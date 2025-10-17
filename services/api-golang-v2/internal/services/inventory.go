package services

import (
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type InventoryService struct {
	db *database.DB
}

func NewInventoryService() *InventoryService {
	return &InventoryService{
		db: database.GetDB(),
	}
}

func (s *InventoryService) GetInventory(productID, warehouseID string, lowStockOnly bool) ([]models.InventoryItem, error) {
	var inventory []models.InventoryItem

	query := s.db.DB.Model(&models.InventoryItem{})

	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}
	if lowStockOnly {
		query = query.Where("quantity <= min_quantity")
	}

	err := query.Find(&inventory).Error
	return inventory, err
}

func (s *InventoryService) GetInventoryHistory(productID, warehouseID, startDate, endDate string, page, limit int) ([]models.InventoryTransaction, int64, error) {
	var transactions []models.InventoryTransaction
	var total int64

	query := s.db.DB.Model(&models.InventoryTransaction{})

	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&transactions).Error

	return transactions, total, err
}

func (s *InventoryService) CreateInventoryTransaction(transaction *models.InventoryTransaction) error {
	return s.db.DB.Create(transaction).Error
}

func (s *InventoryService) GetProductStock(productID string) (int, error) {
	var product models.Product
	err := s.db.DB.Select("stock").Where("id = ?", productID).First(&product).Error
	return product.Stock, err
}

func (s *InventoryService) AdjustStock(productID string, quantity int, transactionType, notes string) error {
	// This will be called from handler with proper transaction creation
	return nil
}

func (s *InventoryService) GetStockAlerts() ([]models.StockAlert, error) {
	var alerts []models.StockAlert
	
	// Get low stock products
	query := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.stock as current_stock,
			p.min_stock as min_stock,
			'LOW_STOCK' as alert_type
		FROM products p
		WHERE p.stock <= p.min_stock AND p.is_active = true
	`
	
	err := s.db.DB.Raw(query).Scan(&alerts).Error
	return alerts, err
}

func (s *InventoryService) GetInventoryValuation(warehouseID string) (map[string]interface{}, error) {
	var result map[string]interface{}
	
	query := `
		SELECT 
			COUNT(DISTINCT product_id) as total_products,
			SUM(quantity) as total_quantity,
			SUM(quantity * unit_cost) as total_value
		FROM inventory_items
		WHERE 1=1
	`
	
	if warehouseID != "" {
		query += " AND warehouse_id = ?"
		err := s.db.DB.Raw(query, warehouseID).Scan(&result).Error
		return result, err
	}
	
	err := s.db.DB.Raw(query).Scan(&result).Error
	return result, err
}
