package services

import (
	"time"

	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
)

type SalesService struct {
	db *gorm.DB
}

func NewSalesService(db *gorm.DB) *SalesService {
	return &SalesService{db: db}
}

type SaleFilter struct {
	ShopID        *uint   `json:"shop_id"`
	CustomerID    *uint   `json:"customer_id"`
	SaleType      string  `json:"sale_type"`
	PaymentStatus string  `json:"payment_status"`
	StartDate     *time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	Search        string  `json:"search"`
	Limit         int     `json:"limit"`
	Offset        int     `json:"offset"`
}

func (s *SalesService) GetSales(filter SaleFilter) ([]database.Sale, int64, error) {
	query := s.db.Preload("Customer").Preload("Shop").Preload("Items").Preload("Items.Product").Preload("Items.Batch")

	if filter.ShopID != nil {
		query = query.Where("shop_id = ?", *filter.ShopID)
	}

	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}

	if filter.SaleType != "" {
		query = query.Where("sale_type = ?", filter.SaleType)
	}

	if filter.PaymentStatus != "" {
		query = query.Where("payment_status = ?", filter.PaymentStatus)
	}

	if filter.StartDate != nil {
		query = query.Where("sale_date >= ?", *filter.StartDate)
	}

	if filter.EndDate != nil {
		query = query.Where("sale_date <= ?", *filter.EndDate)
	}

	if filter.Search != "" {
		query = query.Joins("LEFT JOIN customers ON sales.customer_id = customers.id").
			Where("sales.invoice_no ILIKE ? OR customers.name ILIKE ? OR customers.phone ILIKE ?",
				"%"+filter.Search+"%", "%"+filter.Search+"%", "%"+filter.Search+"%")
	}

	var total int64
	query.Model(&database.Sale{}).Count(&total)

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit).Offset(filter.Offset)
	}

	query = query.Order("sale_date DESC")

	var sales []database.Sale
	err := query.Find(&sales).Error

	return sales, total, err
}

func (s *SalesService) GetSale(id uint) (*database.Sale, error) {
	var sale database.Sale
	err := s.db.Preload("Customer").Preload("Shop").Preload("Items").Preload("Items.Product").Preload("Items.Batch").First(&sale, id).Error
	if err != nil {
		return nil, err
	}
	return &sale, nil
}

func (s *SalesService) CreateSale(sale *database.Sale) error {
	sale.CreatedAt = time.Now()
	sale.UpdatedAt = time.Now()

	// Calculate totals
	var subTotal, taxTotal float64
	for i := range sale.Items {
		sale.Items[i].CreatedAt = time.Now()
		sale.Items[i].UpdatedAt = time.Now()
		subTotal += sale.Items[i].UnitPrice * float64(sale.Items[i].Quantity)
		taxTotal += sale.Items[i].Tax
	}

	sale.SubTotal = subTotal
	sale.Tax = taxTotal
	sale.Total = subTotal + taxTotal - sale.Discount

	return s.db.Transaction(func(tx *gorm.DB) error {
		// Create sale
		if err := tx.Create(sale).Error; err != nil {
			return err
		}

		// Update inventory
		for _, item := range sale.Items {
			if item.BatchID != nil {
				if err := tx.Model(&database.InventoryBatch{}).
					Where("id = ?", *item.BatchID).
					Update("quantity", gorm.Expr("quantity - ?", item.Quantity)).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (s *SalesService) UpdateSale(id uint, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()
	return s.db.Model(&database.Sale{}).Where("id = ?", id).Updates(updates).Error
}

func (s *SalesService) ProcessReturn(saleID uint, returnItems []database.SaleItem) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Create return sale
		returnSale := database.Sale{
			ShopID:        1, // TODO: Get from context
			CustomerID:    nil, // Return sale
			InvoiceNo:     "RTN-" + time.Now().Format("20060102150405"),
			SaleDate:      time.Now(),
			SaleType:      "Return",
			SubTotal:      0,
			Discount:      0,
			Tax:           0,
			Total:         0,
			PaymentStatus: "Completed",
			PaymentMethod: "Return",
			Notes:         "Return sale",
		}

		// Calculate return totals
		for _, item := range returnItems {
			returnSale.SubTotal += item.UnitPrice * float64(item.Quantity)
			returnSale.Tax += item.Tax
		}
		returnSale.Total = returnSale.SubTotal + returnSale.Tax

		if err := tx.Create(&returnSale).Error; err != nil {
			return err
		}

		// Add return items
		for _, item := range returnItems {
			item.SaleID = returnSale.ID
			item.CreatedAt = time.Now()
			item.UpdatedAt = time.Now()
			if err := tx.Create(&item).Error; err != nil {
				return err
			}
		}

		// Restore inventory
		for _, item := range returnItems {
			if item.BatchID != nil {
				if err := tx.Model(&database.InventoryBatch{}).
					Where("id = ?", *item.BatchID).
					Update("quantity", gorm.Expr("quantity + ?", item.Quantity)).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (s *SalesService) GetSalesSummary(shopID uint, startDate, endDate time.Time) (map[string]interface{}, error) {
	var result struct {
		TotalSales     int     `json:"total_sales"`
		TotalRevenue   float64 `json:"total_revenue"`
		TotalTax       float64 `json:"total_tax"`
		TotalDiscount  float64 `json:"total_discount"`
		AverageOrderValue float64 `json:"average_order_value"`
		SalesCount     int     `json:"sales_count"`
	}

	query := s.db.Model(&database.Sale{}).
		Where("shop_id = ? AND sale_date BETWEEN ? AND ?", shopID, startDate, endDate)

	err := query.Select(`
		COUNT(*) as total_sales,
		COALESCE(SUM(total), 0) as total_revenue,
		COALESCE(SUM(tax), 0) as total_tax,
		COALESCE(SUM(discount), 0) as total_discount,
		CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as average_order_value,
		COUNT(*) as sales_count
	`).Scan(&result).Error

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_sales":        result.TotalSales,
		"total_revenue":      result.TotalRevenue,
		"total_tax":         result.TotalTax,
		"total_discount":    result.TotalDiscount,
		"average_order_value": result.AverageOrderValue,
		"sales_count":       result.SalesCount,
	}, nil
}
