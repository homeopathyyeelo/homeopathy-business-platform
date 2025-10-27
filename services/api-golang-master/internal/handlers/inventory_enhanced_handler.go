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
	db interface{}
}

// NewEnhancedInventoryHandler creates a new enhanced inventory handler
func NewEnhancedInventoryHandler(db interface{}) *EnhancedInventoryHandler {
	return &EnhancedInventoryHandler{db: db}
}

// GetEnhancedStockList returns enhanced stock summary with batch tracking
// GET /api/inventory/stock
func (h *EnhancedInventoryHandler) GetEnhancedStockList(c *gin.Context) {
	var stocks []models.StockSummaryResponse

	query := h.db.(*gorm.DB).Table("inventory_stock is_").
		Select(`
			p.name as product_name,
			p.sku,
			p.category,
			p.brand,
			is_.batch_no,
			is_.qty_in,
			is_.qty_out,
			is_.balance,
			is_.purchase_rate,
			is_.mrp,
			is_.mfg_date,
			is_.exp_date,
			w.name as warehouse_name,
			is_.status,
			is_.last_txn_date,
			CASE
				WHEN is_.exp_date < CURRENT_DATE THEN 'expired'
				WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'
				WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'
				WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_3m'
				ELSE 'fresh'
			END as expiry_status,
			CASE
				WHEN is_.purchase_rate > 0 AND is_.mrp > 0
				THEN ROUND(((is_.mrp - is_.purchase_rate) / is_.purchase_rate * 100)::numeric, 2)
				ELSE 0
			END as margin_percent
		`).
		Joins("LEFT JOIN products p ON p.id = is_.product_id").
		Joins("LEFT JOIN warehouses w ON w.id = is_.warehouse_id").
		Where("is_.balance > 0").
		Order("is_.exp_date ASC NULLS LAST, is_.batch_no")

	// Apply filters
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("is_.product_id = ?", productID)
	}

	if category := c.Query("category"); category != "" {
		query = query.Where("p.category ILIKE ?", "%"+category+"%")
	}

	if batchNo := c.Query("batch_no"); batchNo != "" {
		query = query.Where("is_.batch_no ILIKE ?", "%"+batchNo+"%")
	}

	if expiryStatus := c.Query("expiry_status"); expiryStatus != "" {
		query = query.Where("CASE\n"+
			"WHEN is_.exp_date < CURRENT_DATE THEN 'expired'\n"+
			"WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'\n"+
			"WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'\n"+
			"WHEN is_.exp_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_3m'\n"+
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
	tx := h.db.(*gorm.DB).Begin()
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

	query := h.db.(*gorm.DB).Preload("Product").Preload("Batch").Preload("Warehouse").Preload("Creator")

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
	countQuery := h.db.(*gorm.DB).Model(&models.EnhancedStockTransaction{})
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

// GetLowStockAlerts returns low stock alerts
// GET /api/inventory/alerts/low-stock
func (h *EnhancedInventoryHandler) GetLowStockAlerts(c *gin.Context) {
	var alerts []models.EnhancedLowStockAlert

	query := h.db.(*gorm.DB).Preload("Product").Preload("Warehouse").
		Where("is_resolved = ?", false).
		Order("created_at DESC")

	if err := query.Find(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch low stock alerts: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"total":   len(alerts),
	})
}

// GetExpiryAlerts returns expiry alerts
// GET /api/inventory/alerts/expiry
func (h *EnhancedInventoryHandler) GetExpiryAlerts(c *gin.Context) {
	var alerts []models.EnhancedExpiryAlert

	query := h.db.(*gorm.DB).Preload("Product").Preload("Warehouse").
		Where("is_resolved = ?", false).
		Order("days_until_expiry ASC")

	if err := query.Find(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch expiry alerts: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"total":   len(alerts),
	})
}

// GetStockValuation returns stock valuation summary
// GET /api/inventory/valuation
func (h *EnhancedInventoryHandler) GetStockValuation(c *gin.Context) {
	var valuations []gin.H

	query := h.db.(*gorm.DB).Raw(`
		SELECT
			p.name as product_name,
			p.category,
			p.brand,
			COUNT(DISTINCT is_.batch_no) as total_batches,
			SUM(is_.qty_in) as total_qty_in,
			SUM(is_.qty_out) as total_qty_out,
			SUM(is_.balance) as current_balance,
			AVG(is_.purchase_rate) as avg_purchase_rate,
			AVG(is_.mrp) as avg_mrp,
			SUM(is_.balance * is_.purchase_rate) as total_cost_value,
			SUM(is_.balance * is_.mrp) as total_selling_value,
			CASE
				WHEN SUM(is_.balance * is_.purchase_rate) > 0
				THEN ROUND(((SUM(is_.balance * is_.mrp) - SUM(is_.balance * is_.purchase_rate)) / SUM(is_.balance * is_.purchase_rate) * 100)::numeric, 2)
				ELSE 0
			END as overall_margin_percent
		FROM inventory_stock is_
		LEFT JOIN products p ON p.id = is_.product_id
		WHERE is_.balance > 0
		GROUP BY p.id, p.name, p.category, p.brand
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

	if err := h.db.(*gorm.DB).Model(&models.EnhancedLowStockAlert{}).
		Where("id = ?", alertID).
		Updates(gin.H{
			"is_resolved":  true,
			"resolved_at":  time.Now(),
			"updated_at":   time.Now(),
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

	if err := h.db.(*gorm.DB).Model(&models.EnhancedExpiryAlert{}).
		Where("id = ?", alertID).
		Updates(gin.H{
			"is_resolved":  true,
			"resolved_at":  time.Now(),
			"updated_at":   time.Now(),
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
		TotalProducts   int
		TotalBatches    int
		TotalValue      float64
		SellingValue    float64
		LowStockCount   int
		ExpiringCount   int
		ExpiredCount    int
	}
	h.db.(*gorm.DB).Raw(`
		SELECT
			COUNT(DISTINCT p.id) as total_products,
			COUNT(DISTINCT is_.batch_no) as total_batches,
			SUM(is_.balance * is_.purchase_rate) as total_value,
			SUM(is_.balance * is_.mrp) as selling_value
		FROM inventory_stock is_
		LEFT JOIN products p ON p.id = is_.product_id
		WHERE is_.balance > 0
	`).Scan(&stats)

	// Get top products
	var topProducts []gin.H
	h.db.(*gorm.DB).Raw(`
		SELECT
			p.name as product_name,
			p.category,
			p.brand,
			COUNT(DISTINCT is_.batch_no) as total_batches,
			SUM(is_.qty_in) as total_qty_in,
			SUM(is_.qty_out) as total_qty_out,
			SUM(is_.balance) as current_balance,
			AVG(is_.purchase_rate) as avg_purchase_rate,
			AVG(is_.mrp) as avg_mrp,
			SUM(is_.balance * is_.purchase_rate) as total_cost_value,
			SUM(is_.balance * is_.mrp) as total_selling_value,
			CASE
				WHEN SUM(is_.balance * is_.purchase_rate) > 0
				THEN ROUND(((SUM(is_.balance * is_.mrp) - SUM(is_.balance * is_.purchase_rate)) / SUM(is_.balance * is_.purchase_rate) * 100)::numeric, 2)
				ELSE 0
			END as overall_margin_percent
		FROM inventory_stock is_
		LEFT JOIN products p ON p.id = is_.product_id
		WHERE is_.balance > 0
		GROUP BY p.id, p.name, p.category, p.brand
		ORDER BY total_cost_value DESC
		LIMIT 10
	`).Scan(&topProducts)

	// Get category summary
	var categorySummary []gin.H
	h.db.(*gorm.DB).Raw(`
		SELECT
			p.category,
			COUNT(DISTINCT p.id) as products_count,
			COUNT(DISTINCT is_.batch_no) as batches_count,
			SUM(is_.balance) as total_quantity,
			SUM(is_.balance * is_.purchase_rate) as total_cost_value,
			SUM(is_.balance * is_.mrp) as total_selling_value
		FROM inventory_stock is_
		LEFT JOIN products p ON p.id = is_.product_id
		WHERE is_.balance > 0
		GROUP BY p.category
		ORDER BY total_cost_value DESC
	`).Scan(&categorySummary)

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
