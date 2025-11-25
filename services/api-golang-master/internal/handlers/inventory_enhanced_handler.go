package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// EnhancedInventoryHandler handles enhanced inventory operations
type EnhancedInventoryHandler struct {
	db *gorm.DB
}

// NewEnhancedInventoryHandler creates a new enhanced inventory handler
func NewEnhancedInventoryHandler(db *gorm.DB) *EnhancedInventoryHandler {
	return &EnhancedInventoryHandler{db: db}
}

// GetEnhancedStockList returns enhanced stock summary with batch tracking
// GET /api/inventory/stock
func (h *EnhancedInventoryHandler) GetEnhancedStockList(c *gin.Context) {
	var stocks []models.StockSummaryResponse

	query := h.db.Table("inventory_batches ib").
		Select(`
			ib.product_id as product_id,
			p.name as product_name,
			p.sku as sku,
			COALESCE(c.name, '') as category,
			COALESCE(b.name, '') as brand,
			ib.batch_number as batch_no,
			ib.quantity as qty_in,
			(ib.quantity - ib.available_quantity) as qty_out,
			ib.available_quantity as balance,
			ib.unit_cost as purchase_rate,
			ib.mrp as mrp,
			ib.manufacturing_date as mfg_date,
			ib.expiry_date as exp_date,
			'Main Warehouse' as warehouse_name,
			CASE WHEN ib.is_active THEN 'active' ELSE 'inactive' END as status,
			ib.updated_at as last_txn_date,
			CASE
				WHEN ib.expiry_date < CURRENT_DATE THEN 'expired'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_3m'
				ELSE 'fresh'
			END as expiry_status,
			CASE
				WHEN ib.unit_cost > 0 AND ib.mrp > 0
				THEN ROUND(((ib.mrp - ib.unit_cost) / ib.unit_cost * 100)::numeric, 2)
				ELSE 0
			END as margin_percent
		`).
		Joins("LEFT JOIN products p ON p.id = ib.product_id").
		Joins("LEFT JOIN categories c ON c.id = p.category_id").
		Joins("LEFT JOIN brands b ON b.id = p.brand_id").
		Where("ib.available_quantity > 0 AND ib.is_active = true").
		Order("ib.expiry_date ASC NULLS LAST, ib.batch_number")

	// Apply filters
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("ib.product_id = ?", productID)
	}

	if category := c.Query("category"); category != "" {
		query = query.Where("c.name ILIKE ?", "%"+category+"%")
	}

	if batchNo := c.Query("batch_no"); batchNo != "" {
		query = query.Where("ib.batch_number ILIKE ?", "%"+batchNo+"%")
	}

	if expiryStatus := c.Query("expiry_status"); expiryStatus != "" {
		query = query.Where("CASE\n"+
			"WHEN ib.expiry_date < CURRENT_DATE THEN 'expired'\n"+
			"WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'\n"+
			"WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'\n"+
			"WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_3m'\n"+
			"ELSE 'fresh'\n"+
			"END = ?", expiryStatus)
	}

	if err := query.Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch stock: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stocks,
		"total":   len(stocks),
	})
}

// AddManualStock adds stock manually with batch tracking
// POST /api/inventory/stock
func (h *EnhancedInventoryHandler) AddManualStock(c *gin.Context) {
	var req models.ManualStockEntryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get current balance for the batch
	var currentStock models.EnhancedInventoryStock
	err := tx.Where("product_id = ? AND batch_no = ? AND (warehouse_id = ? OR warehouse_id IS NULL)",
		req.ProductID, req.BatchNo, req.WarehouseID).First(&currentStock).Error

	// Calculate new balance
	newQtyIn := req.Quantity
	newBalance := req.Quantity

	if err == nil {
		// Batch exists, add to existing
		newQtyIn = currentStock.QtyIn + req.Quantity
		newBalance = currentStock.Balance + req.Quantity
	}

	// Update or create inventory stock
	stockData := models.EnhancedInventoryStock{
		ProductID:    req.ProductID,
		BatchNo:      req.BatchNo,
		WarehouseID:  req.WarehouseID,
		QtyIn:        newQtyIn,
		Balance:      newBalance,
		PurchaseRate: req.PurchaseRate,
		MRP:          req.MRP,
		MfgDate:      req.MfgDate,
		ExpDate:      req.ExpDate,
		LastTxnType:  &[]string{"IN"}[0],
		LastTxnDate:  &[]time.Time{time.Now()}[0],
		Status:       "active",
		UpdatedAt:    time.Now(),
	}

	if err == nil {
		// Update existing
		if err := tx.Model(&currentStock).Updates(stockData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to update stock: " + err.Error(),
			})
			return
		}
	} else {
		// Create new
		stockData.CreatedAt = time.Now()
		if err := tx.Create(&stockData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to create stock: " + err.Error(),
			})
			return
		}
	}

	// Create transaction record
	txnData := models.EnhancedStockTransaction{
		ProductID:     req.ProductID,
		BatchNo:       &req.BatchNo,
		WarehouseID:   req.WarehouseID,
		Type:          "IN",
		Qty:           req.Quantity,
		BalanceBefore: &[]float64{currentStock.Balance}[0],
		BalanceAfter:  &newBalance,
		Source:        "manual",
		Reason:        &req.Reason,
		CreatedAt:     time.Now(),
	}

	if err := tx.Create(&txnData).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create transaction: " + err.Error(),
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to commit transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Manual stock added successfully",
		"data": gin.H{
			"batch_no": req.BatchNo,
			"quantity": req.Quantity,
			"balance":  newBalance,
		},
	})
}

// GetStockTransactions returns transaction history for a product/batch
// GET /api/inventory/transactions
func (h *EnhancedInventoryHandler) GetStockTransactions(c *gin.Context) {
	var transactions []models.EnhancedStockTransaction

	query := h.db.Preload("Product").Preload("Batch").Preload("Warehouse").Preload("Creator")

	// Apply filters
	if productID := c.Query("product_id"); productID != "" {
		if pid, err := strconv.ParseUint(productID, 10, 32); err == nil {
			query = query.Where("product_id = ?", pid)
		}
	}

	if batchNo := c.Query("batch_no"); batchNo != "" {
		query = query.Where("batch_no = ?", batchNo)
	}

	if source := c.Query("source"); source != "" {
		query = query.Where("source = ?", source)
	}

	if txnType := c.Query("type"); txnType != "" {
		query = query.Where("type = ?", txnType)
	}

	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	// Pagination
	limit := 100
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	query = query.Order("created_at DESC").Limit(limit).Offset(offset)

	if err := query.Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch transactions: " + err.Error(),
		})
		return
	}

	// Get total count
	var total int64
	countQuery := h.db.Model(&models.EnhancedStockTransaction{})
	if productID := c.Query("product_id"); productID != "" {
		if pid, err := strconv.ParseUint(productID, 10, 32); err == nil {
			countQuery = countQuery.Where("product_id = ?", pid)
		}
	}
	if batchNo := c.Query("batch_no"); batchNo != "" {
		countQuery = countQuery.Where("batch_no = ?", batchNo)
	}
	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transactions,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *EnhancedInventoryHandler) GetLowStockAlerts(c *gin.Context) {
	type AlertItem struct {
		ProductID    string  `json:"product_id"`
		ProductName  string  `json:"product_name"`
		SKU          string  `json:"sku"`
		CurrentStock float64 `json:"current_stock"`
		MinStock     int     `json:"min_stock"`
		Status       string  `json:"status"`
	}
	var alerts []AlertItem

	err := h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			COALESCE(SUM(ib.available_quantity), 0) as current_stock,
			p.min_stock as min_stock,
			CASE 
				WHEN COALESCE(SUM(ib.available_quantity), 0) = 0 THEN 'out_of_stock'
				WHEN COALESCE(SUM(ib.available_quantity), 0) < p.min_stock * 0.5 THEN 'critical'
				ELSE 'low'
			END as status
		FROM products p
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		WHERE p.is_active = true
		GROUP BY p.id, p.name, p.sku, p.min_stock
		HAVING COALESCE(SUM(ib.available_quantity), 0) < p.min_stock
		ORDER BY current_stock ASC
		LIMIT 100
	`).Scan(&alerts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"success": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    alerts,
		"success": true,
	})
}

// GetExpiryAlerts returns expiry alerts
// GET /api/inventory/alerts/expiry
func (h *EnhancedInventoryHandler) GetExpiryAlerts(c *gin.Context) {
	type AlertItem struct {
		ProductID   string    `json:"product_id"`
		ProductName string    `json:"product_name"`
		SKU         string    `json:"sku"`
		BatchNo     string    `json:"batch_no"`
		ExpiryDate  time.Time `json:"expiry_date"`
		Quantity    float64   `json:"quantity"`
		DaysLeft    int       `json:"days_left"`
		Status      string    `json:"status"`
	}
	var alerts []AlertItem

	err := h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			ib.batch_number as batch_no,
			ib.expiry_date,
			ib.available_quantity as quantity,
			EXTRACT(DAY FROM (ib.expiry_date - CURRENT_DATE))::integer as days_left,
			CASE
				WHEN ib.expiry_date < CURRENT_DATE THEN 'expired'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
				WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
				ELSE 'normal'
			END as status
		FROM products p
		INNER JOIN inventory_batches ib ON ib.product_id = p.id
		WHERE ib.expiry_date IS NOT NULL
			AND ib.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
			AND ib.available_quantity > 0
			AND ib.is_active = true
		ORDER BY ib.expiry_date ASC
		LIMIT 100
	`).Scan(&alerts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"success": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    alerts,
		"success": true,
	})
}

// GetStockValuation returns stock valuation summary
// GET /api/inventory/valuation
func (h *EnhancedInventoryHandler) GetStockValuation(c *gin.Context) {
	var valuations []gin.H

	query := h.db.Raw(`
		SELECT
			p.name as product_name,
			c.name as category,
			b.name as brand,
			COUNT(DISTINCT ib.batch_number) as total_batches,
			SUM(ib.available_quantity) as total_qty_in,
			0 as total_qty_out,
			SUM(ib.available_quantity) as current_balance,
			AVG(ib.unit_cost) as avg_purchase_rate,
			AVG(ib.mrp) as avg_mrp,
			SUM(ib.available_quantity * ib.unit_cost) as total_cost_value,
			SUM(ib.available_quantity * ib.mrp) as total_selling_value,
			CASE
				WHEN SUM(ib.available_quantity * ib.unit_cost) > 0
				THEN ROUND(((SUM(ib.available_quantity * ib.mrp) - SUM(ib.available_quantity * ib.unit_cost)) / SUM(ib.available_quantity * ib.unit_cost) * 100)::numeric, 2)
				ELSE 0
			END as overall_margin_percent
		FROM inventory_batches ib
		LEFT JOIN products p ON p.id = ib.product_id
		LEFT JOIN categories c ON c.id = p.category_id
		LEFT JOIN brands b ON b.id = p.brand_id
		WHERE ib.available_quantity > 0 AND ib.is_active = true
		GROUP BY p.id, p.name, c.name, b.name
		ORDER BY total_cost_value DESC
	`)

	if err := query.Scan(&valuations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch valuation: " + err.Error(),
		})
		return
	}

	// Calculate totals
	var totalCostValue, totalSellingValue float64
	for _, v := range valuations {
		if costVal, ok := v["total_cost_value"].(float64); ok {
			totalCostValue += costVal
		}
		if sellingVal, ok := v["total_selling_value"].(float64); ok {
			totalSellingValue += sellingVal
		}
	}

	var totalMargin float64
	if totalCostValue > 0 {
		totalMargin = ((totalSellingValue - totalCostValue) / totalCostValue) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    valuations,
		"summary": gin.H{
			"total_products":      len(valuations),
			"total_cost_value":    totalCostValue,
			"total_selling_value": totalSellingValue,
			"overall_margin":      totalMargin,
		},
	})
}

// ResolveLowStockAlert marks a low stock alert as resolved
// PUT /api/inventory/alerts/low-stock/:id/resolve
func (h *EnhancedInventoryHandler) ResolveLowStockAlert(c *gin.Context) {
	alertID := c.Param("id")

	if err := h.db.Model(&models.EnhancedLowStockAlert{}).
		Where("id = ?", alertID).
		Updates(gin.H{
			"is_resolved": true,
			"resolved_at": time.Now(),
			"updated_at":  time.Now(),
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to resolve alert: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Low stock alert resolved successfully",
	})
}

// ResolveExpiryAlert marks an expiry alert as resolved
// PUT /api/inventory/alerts/expiry/:id/resolve
func (h *EnhancedInventoryHandler) ResolveExpiryAlert(c *gin.Context) {
	alertID := c.Param("id")

	if err := h.db.Model(&models.EnhancedExpiryAlert{}).
		Where("id = ?", alertID).
		Updates(gin.H{
			"is_resolved": true,
			"resolved_at": time.Now(),
			"updated_at":  time.Now(),
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to resolve alert: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Expiry alert resolved successfully",
	})
}

// GenerateStockReport generates comprehensive stock report
// GET /api/inventory/reports/stock
func (h *EnhancedInventoryHandler) GenerateStockReport(c *gin.Context) {
	var reportData struct {
		TotalProducts     int     `json:"total_products"`
		TotalBatches      int     `json:"total_batches"`
		TotalStockValue   float64 `json:"total_stock_value"`
		TotalSellingValue float64 `json:"total_selling_value"`
		LowStockProducts  int     `json:"low_stock_products"`
		ExpiringSoon      int     `json:"expiring_soon"`
		ExpiredProducts   int     `json:"expired_products"`
		TopProducts       []gin.H `json:"top_products"`
		CategorySummary   []gin.H `json:"category_summary"`
	}

	// Get overall statistics
	var stats struct {
		TotalProducts int
		TotalBatches  int
		TotalValue    float64
		SellingValue  float64
		LowStockCount int
		ExpiringCount int
		ExpiredCount  int
	}
	h.db.Raw(`
		SELECT
			COUNT(DISTINCT p.id) as total_products,
			COUNT(DISTINCT ib.batch_number) as total_batches,
			COALESCE(SUM(ib.available_quantity * ib.unit_cost), 0) as total_value,
			COALESCE(SUM(ib.available_quantity * ib.mrp), 0) as selling_value
		FROM inventory_batches ib
		LEFT JOIN products p ON p.id = ib.product_id
		WHERE ib.available_quantity > 0 AND ib.is_active = true
	`).Scan(&stats)

	// typed structs for aggregation queries
	type topProductRow struct {
		ProductName          string  `json:"product_name"`
		Category             string  `json:"category"`
		Brand                string  `json:"brand"`
		TotalBatches         int     `json:"total_batches"`
		TotalQtyIn           float64 `json:"total_qty_in"`
		CurrentBalance       float64 `json:"current_balance"`
		AvgPurchaseRate      float64 `json:"avg_purchase_rate"`
		AvgMRP               float64 `json:"avg_mrp"`
		TotalCostValue       float64 `json:"total_cost_value"`
		TotalSellingValue    float64 `json:"total_selling_value"`
		OverallMarginPercent float64 `json:"overall_margin_percent"`
	}

	type categorySummaryRow struct {
		Category          string  `json:"category"`
		ProductsCount     int     `json:"products_count"`
		BatchesCount      int     `json:"batches_count"`
		TotalQuantity     float64 `json:"total_quantity"`
		TotalCostValue    float64 `json:"total_cost_value"`
		TotalSellingValue float64 `json:"total_selling_value"`
	}

	var topProductRows []topProductRow
	h.db.Raw(`
		SELECT
			COALESCE(p.name, 'Unknown Product') as product_name,
			COALESCE(c.name, 'Uncategorized') as category,
			COALESCE(b.name, 'Unknown Brand') as brand,
			COUNT(DISTINCT ib.batch_number) as total_batches,
			SUM(ib.available_quantity) as total_qty_in,
			SUM(ib.available_quantity) as current_balance,
			COALESCE(AVG(ib.unit_cost), 0) as avg_purchase_rate,
			COALESCE(AVG(ib.mrp), 0) as avg_mrp,
			COALESCE(SUM(ib.available_quantity * ib.unit_cost), 0) as total_cost_value,
			COALESCE(SUM(ib.available_quantity * ib.mrp), 0) as total_selling_value,
			CASE
				WHEN SUM(ib.available_quantity * ib.unit_cost) > 0
				THEN ROUND(((SUM(ib.available_quantity * ib.mrp) - SUM(ib.available_quantity * ib.unit_cost)) / SUM(ib.available_quantity * ib.unit_cost) * 100)::numeric, 2)
				ELSE 0
			END as overall_margin_percent
		FROM inventory_batches ib
		LEFT JOIN products p ON p.id = ib.product_id
		LEFT JOIN categories c ON c.id = p.category_id
		LEFT JOIN brands b ON b.id = p.brand_id
		WHERE ib.available_quantity > 0 AND ib.is_active = true
		GROUP BY p.id, p.name, c.name, b.name
		ORDER BY total_cost_value DESC
		LIMIT 10
	`).Scan(&topProductRows)

	var categoryRows []categorySummaryRow
	h.db.Raw(`
		SELECT
			COALESCE(c.name, 'Uncategorized') as category,
			COUNT(DISTINCT p.id) as products_count,
			COUNT(DISTINCT ib.batch_number) as batches_count,
			COALESCE(SUM(ib.available_quantity), 0) as total_quantity,
			COALESCE(SUM(ib.available_quantity * ib.unit_cost), 0) as total_cost_value,
			COALESCE(SUM(ib.available_quantity * ib.mrp), 0) as total_selling_value
		FROM inventory_batches ib
		LEFT JOIN products p ON p.id = ib.product_id
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE ib.available_quantity > 0 AND ib.is_active = true
		GROUP BY c.name
		ORDER BY total_cost_value DESC
	`).Scan(&categoryRows)

	// convert to []gin.H for response
	topProducts := make([]gin.H, 0, len(topProductRows))
	for _, row := range topProductRows {
		topProducts = append(topProducts, gin.H{
			"product_name":           row.ProductName,
			"category":               row.Category,
			"brand":                  row.Brand,
			"total_batches":          row.TotalBatches,
			"total_qty_in":           row.TotalQtyIn,
			"current_balance":        row.CurrentBalance,
			"avg_purchase_rate":      row.AvgPurchaseRate,
			"avg_mrp":                row.AvgMRP,
			"total_cost_value":       row.TotalCostValue,
			"total_selling_value":    row.TotalSellingValue,
			"overall_margin_percent": row.OverallMarginPercent,
		})
	}

	categorySummary := make([]gin.H, 0, len(categoryRows))
	for _, row := range categoryRows {
		categorySummary = append(categorySummary, gin.H{
			"category":            row.Category,
			"products_count":      row.ProductsCount,
			"batches_count":       row.BatchesCount,
			"total_quantity":      row.TotalQuantity,
			"total_cost_value":    row.TotalCostValue,
			"total_selling_value": row.TotalSellingValue,
		})
	}

	reportData = struct {
		TotalProducts     int     `json:"total_products"`
		TotalBatches      int     `json:"total_batches"`
		TotalStockValue   float64 `json:"total_stock_value"`
		TotalSellingValue float64 `json:"total_selling_value"`
		LowStockProducts  int     `json:"low_stock_products"`
		ExpiringSoon      int     `json:"expiring_soon"`
		ExpiredProducts   int     `json:"expired_products"`
		TopProducts       []gin.H `json:"top_products"`
		CategorySummary   []gin.H `json:"category_summary"`
	}{
		TotalProducts:     stats.TotalProducts,
		TotalBatches:      stats.TotalBatches,
		TotalStockValue:   stats.TotalValue,
		TotalSellingValue: stats.SellingValue,
		TopProducts:       topProducts,
		CategorySummary:   categorySummary,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reportData,
	})
}
