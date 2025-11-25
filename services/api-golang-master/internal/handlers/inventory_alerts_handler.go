package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InventoryAlertsHandler struct {
	db *gorm.DB
}

type LowStockAlert struct {
	ProductID       string `json:"product_id"`
	ProductName     string `json:"product_name"`
	CurrentStock    int    `json:"current_stock"`
	MinStockLevel   int    `json:"min_stock_level"`
	SKU             string `json:"sku"`
	Category        string `json:"category"`
	Brand           string `json:"brand"`
	ReorderQuantity int    `json:"reorder_quantity"`
	Severity        string `json:"severity"` // critical, high, medium
}

type ExpiryAlert struct {
	BatchID     string    `json:"batch_id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	BatchNumber string    `json:"batch_number"`
	ExpiryDate  time.Time `json:"expiry_date"`
	DaysLeft    int       `json:"days_left"`
	Quantity    int       `json:"quantity"`
	Severity    string    `json:"severity"` // critical, warning, info
	SKU         string    `json:"sku"`
	Brand       string    `json:"brand"`
}

type StockSummary struct {
	TotalProducts   int     `json:"total_products"`
	TotalStockValue float64 `json:"total_stock_value"`
	LowStockCount   int     `json:"low_stock_count"`
	OutOfStockCount int     `json:"out_of_stock_count"`
	ExpiringCount   int     `json:"expiring_count"`
	ExpiredCount    int     `json:"expired_count"`
	OverstockCount  int     `json:"overstock_count"`
}

func NewInventoryAlertsHandler(db *gorm.DB) *InventoryAlertsHandler {
	return &InventoryAlertsHandler{db: db}
}

// GET /api/erp/inventory/alerts/low-stock
func (h *InventoryAlertsHandler) GetLowStockAlerts(c *gin.Context) {
	limit := c.DefaultQuery("limit", "50")

	var alerts []LowStockAlert

	// Query products with stock below minimum level
	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			COALESCE(SUM(ib.available_quantity), 0)::int as current_stock,
			p.min_stock_level,
			COALESCE(c.name, '') as category,
			COALESCE(b.name, '') as brand,
			GREATEST(p.min_stock_level - COALESCE(SUM(ib.available_quantity), 0), 0)::int as reorder_quantity,
			CASE 
				WHEN COALESCE(SUM(ib.available_quantity), 0) = 0 THEN 'critical'
				WHEN COALESCE(SUM(ib.available_quantity), 0) < p.min_stock_level * 0.3 THEN 'critical'
				WHEN COALESCE(SUM(ib.available_quantity), 0) < p.min_stock_level * 0.6 THEN 'high'
				ELSE 'medium'
			END as severity
		FROM products p
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		LEFT JOIN categories c ON c.id = p.category_id
		LEFT JOIN brands b ON b.id = p.brand_id
		WHERE p.is_active = true 
			AND p.min_stock_level > 0
		GROUP BY p.id, p.name, p.sku, p.min_stock_level, c.name, b.name
		HAVING COALESCE(SUM(ib.available_quantity), 0) < p.min_stock_level
		ORDER BY severity DESC, current_stock ASC
		LIMIT ?
	`, limit).Scan(&alerts)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"count":   len(alerts),
	})
}

// GET /api/erp/inventory/alerts/expiry
func (h *InventoryAlertsHandler) GetExpiryAlerts(c *gin.Context) {
	daysAhead := c.DefaultQuery("days", "90") // Default: next 90 days
	limit := c.DefaultQuery("limit", "50")

	var alerts []ExpiryAlert

	// Query batches expiring soon
	h.db.Raw(`
		SELECT 
			ib.id as batch_id,
			ib.product_id,
			p.name as product_name,
			p.sku,
			ib.batch_number,
			ib.expiry_date,
			(ib.expiry_date - CURRENT_DATE) as days_left,
			ib.available_quantity as quantity,
			COALESCE(b.name, '') as brand,
			CASE 
				WHEN ib.expiry_date < CURRENT_DATE THEN 'expired'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
				ELSE 'info'
			END as severity
		FROM inventory_batches ib
		JOIN products p ON p.id = ib.product_id
		LEFT JOIN brands b ON b.id = p.brand_id
		WHERE ib.expiry_date IS NOT NULL
			AND ib.expiry_date <= CURRENT_DATE + INTERVAL '? days'
			AND ib.available_quantity > 0
			AND ib.is_active = true
		ORDER BY ib.expiry_date ASC
		LIMIT ?
	`, daysAhead, limit).Scan(&alerts)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"count":   len(alerts),
	})
}

// GET /api/erp/inventory/stock
func (h *InventoryAlertsHandler) GetStockSummary(c *gin.Context) {
	var summary StockSummary

	// Total products
	h.db.Raw("SELECT COUNT(*) FROM products WHERE is_active = true").Scan(&summary.TotalProducts)

	// Total stock value
	h.db.Raw(`
		SELECT COALESCE(SUM(ib.available_quantity * ib.unit_cost), 0) 
		FROM inventory_batches ib 
		WHERE ib.is_active = true
	`).Scan(&summary.TotalStockValue)

	// Low stock count
	h.db.Raw(`
		SELECT COUNT(DISTINCT p.id)
		FROM products p
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		WHERE p.is_active = true 
			AND p.min_stock_level > 0
		GROUP BY p.id, p.min_stock_level
		HAVING COALESCE(SUM(ib.available_quantity), 0) < p.min_stock_level
	`).Scan(&summary.LowStockCount)

	// Out of stock count
	h.db.Raw(`
		SELECT COUNT(DISTINCT p.id)
		FROM products p
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		WHERE p.is_active = true
		GROUP BY p.id
		HAVING COALESCE(SUM(ib.available_quantity), 0) = 0
	`).Scan(&summary.OutOfStockCount)

	// Expiring count (next 90 days)
	h.db.Raw(`
		SELECT COUNT(DISTINCT ib.id)
		FROM inventory_batches ib
		WHERE ib.expiry_date IS NOT NULL
			AND ib.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
			AND ib.available_quantity > 0
			AND ib.is_active = true
	`).Scan(&summary.ExpiringCount)

	// Expired count
	h.db.Raw(`
		SELECT COUNT(DISTINCT ib.id)
		FROM inventory_batches ib
		WHERE ib.expiry_date < CURRENT_DATE
			AND ib.available_quantity > 0
			AND ib.is_active = true
	`).Scan(&summary.ExpiredCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}
