package handlers

import (
	"database/sql"
	"fmt"
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

	// Get actual stock items with batch details
	type StockItem struct {
		ProductID    string         `json:"product_id"`
		ProductName  string         `json:"product_name"`
		SKU          string         `json:"sku"`
		Category     string         `json:"category"`
		Brand        string         `json:"brand"`
		BatchNo      string         `json:"batch_no"`
		ExpiryDate   sql.NullString `json:"expiry_date"`
		QtyIn        float64        `json:"qty_in"`
		QtyOut       float64        `json:"qty_out"`
		Balance      float64        `json:"balance"`
		MRP          float64        `json:"mrp"`
		PurchaseRate float64        `json:"purchase_rate"`
		Margin       float64        `json:"margin"`
		ExpiryStatus string         `json:"expiry_status"`
		Status       string         `json:"status"`
		Warehouse    string         `json:"warehouse"`
	}

	var stockItems []StockItem
	result := h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			COALESCE(c.name, '') as category,
			COALESCE(b.name, '') as brand,
			COALESCE(ib.batch_number, '-') as batch_no,
			ib.expiry_date,
			COALESCE(ib.quantity, p.current_stock) as qty_in,
			COALESCE(ib.quantity - ib.available_quantity, 0) as qty_out,
			COALESCE(ib.available_quantity, p.current_stock) as balance,
			COALESCE(p.mrp, 0) as mrp,
			COALESCE(ib.unit_cost, p.cost_price, 0) as purchase_rate,
			CASE 
				WHEN p.mrp > 0 AND COALESCE(ib.unit_cost, p.cost_price) > 0 
				THEN ((p.mrp - COALESCE(ib.unit_cost, p.cost_price)) / p.mrp * 100)
				ELSE 0 
			END as margin,
			CASE
				WHEN ib.expiry_date IS NULL THEN 'no_expiry'
				WHEN ib.expiry_date < CURRENT_DATE THEN 'expired'
				WHEN ib.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'
				WHEN ib.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_30d'
				WHEN ib.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_90d'
				ELSE 'fresh'
			END as expiry_status,
			CASE
				WHEN COALESCE(ib.available_quantity, p.current_stock) > 0 THEN 'in_stock'
				ELSE 'out_of_stock'
			END as status,
			'Main Warehouse' as warehouse
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		WHERE p.is_active = true
		ORDER BY p.name, ib.batch_number
	`).Scan(&stockItems)

	if result.Error != nil {
		fmt.Printf("❌ Error fetching stock items: %v\n", result.Error)
	}
	fmt.Printf("📦 Fetched %d stock items\n", len(stockItems))

	// Convert to JSON-friendly format
	var jsonItems []gin.H
	for _, item := range stockItems {
		var expiryDate *string
		if item.ExpiryDate.Valid {
			expiryDate = &item.ExpiryDate.String
		}

		jsonItems = append(jsonItems, gin.H{
			"product_id":    item.ProductID,
			"product_name":  item.ProductName,
			"sku":           item.SKU,
			"category":      item.Category,
			"brand":         item.Brand,
			"batch_no":      item.BatchNo,
			"expiry_date":   expiryDate,
			"qty_in":        item.QtyIn,
			"qty_out":       item.QtyOut,
			"balance":       item.Balance,
			"mrp":           item.MRP,
			"purchase_rate": item.PurchaseRate,
			"margin":        item.Margin,
			"expiry_status": item.ExpiryStatus,
			"status":        item.Status,
			"warehouse":     item.Warehouse,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jsonItems,
		"summary": summary,
		"total":   len(jsonItems),
	})
}
