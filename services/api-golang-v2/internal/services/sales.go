package services

import (
	"time"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type SalesService struct {
	db *database.DB
}

func NewSalesService() *SalesService {
	return &SalesService{
		db: database.GetDB(),
	}
}

func (s *SalesService) ListSales(page, limit int, search, customerID, status, startDate, endDate string) ([]models.SalesOrder, int64, error) {
	var sales []models.SalesOrder
	var total int64

	query := s.db.DB.Model(&models.SalesOrder{})

	if search != "" {
		query = query.Where("order_number ILIKE ?", "%"+search+"%")
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if startDate != "" {
		query = query.Where("order_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("order_date <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Items").Offset(offset).Limit(limit).Order("order_date DESC").Find(&sales).Error

	return sales, total, err
}

func (s *SalesService) GetSalesOrderByID(id string) (*models.SalesOrder, error) {
	var order models.SalesOrder
	err := s.db.DB.Preload("Items").Where("id = ?", id).First(&order).Error
	return &order, err
}

func (s *SalesService) CreateSalesOrder(order *models.SalesOrder) error {
	return s.db.DB.Create(order).Error
}

func (s *SalesService) UpdateSalesOrderStatus(id, status string) error {
	return s.db.DB.Model(&models.SalesOrder{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}).Error
}

func (s *SalesService) GetSalesReport(startDate, endDate, groupBy string) (interface{}, error) {
	// Implement sales report logic based on groupBy (day, week, month)
	var results []map[string]interface{}
	
	query := `
		SELECT 
			DATE_TRUNC(?, order_date) as period,
			COUNT(*) as order_count,
			SUM(total_amount) as total_sales,
			AVG(total_amount) as avg_order_value
		FROM sales_orders
		WHERE order_date BETWEEN ? AND ?
		GROUP BY period
		ORDER BY period DESC
	`
	
	err := s.db.DB.Raw(query, groupBy, startDate, endDate).Scan(&results).Error
	return results, err
}

func (s *SalesService) GetCustomerSalesHistory(customerID string, page, limit int) ([]models.SalesOrder, int64, error) {
	var sales []models.SalesOrder
	var total int64

	query := s.db.DB.Model(&models.SalesOrder{}).Where("customer_id = ?", customerID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Items").Offset(offset).Limit(limit).Order("order_date DESC").Find(&sales).Error

	return sales, total, err
}
