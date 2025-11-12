package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HomeopathyInventoryHandler - Enhanced inventory management
type HomeopathyInventoryHandler struct {
	db *gorm.DB
}

func NewHomeopathyInventoryHandler(db *gorm.DB) *HomeopathyInventoryHandler {
	return &HomeopathyInventoryHandler{db: db}
}

// BatchRequest for creating new inventory batch
type BatchRequest struct {
	ProductID         string     `json:"productId" binding:"required"`
	BatchNumber       string     `json:"batchNumber" binding:"required"`
	Quantity          float64    `json:"quantity" binding:"required,gt=0"`
	UnitCost          float64    `json:"unitCost" binding:"required,gt=0"`
	SellingPrice      float64    `json:"sellingPrice" binding:"required,gt=0"`
	MRP               float64    `json:"mrp"`
	ManufacturingDate *time.Time `json:"manufacturingDate"`
	ExpiryDate        *time.Time `json:"expiryDate"`
	Location          string     `json:"location"`
	RackNumber        string     `json:"rackNumber"`
	BinNumber         string     `json:"binNumber"`
	SupplierID        string     `json:"supplierId"`
	PurchaseOrderID   string     `json:"purchaseOrderId"`
}

// BatchResponse with complete details
type BatchResponse struct {
	ID                string     `json:"id"`
	ProductID         string     `json:"productId"`
	ProductName       string     `json:"productName"`
	SKU               string     `json:"sku"`
	CategoryName      string     `json:"categoryName"`
	BrandName         string     `json:"brandName"`
	BatchNumber       string     `json:"batchNumber"`
	Quantity          float64    `json:"quantity"`
	AvailableQuantity float64    `json:"availableQuantity"`
	ReservedQuantity  float64    `json:"reservedQuantity"`
	UnitCost          float64    `json:"unitCost"`
	SellingPrice      float64    `json:"sellingPrice"`
	MRP               float64    `json:"mrp"`
	TotalValue        float64    `json:"totalValue"`
	ManufacturingDate *time.Time `json:"manufacturingDate"`
	ExpiryDate        *time.Time `json:"expiryDate"`
	DaysToExpiry      int        `json:"daysToExpiry"`
	Location          string     `json:"location"`
	RackNumber        string     `json:"rackNumber"`
	BinNumber         string     `json:"binNumber"`
	SupplierName      string     `json:"supplierName"`
	IsExpired         bool       `json:"isExpired"`
	Status            string     `json:"status"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// POST /api/homeopathy/inventory/batches - Create new batch
func (h *HomeopathyInventoryHandler) CreateBatch(c *gin.Context) {
	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if batch number already exists for this product
	var existingCount int64
	h.db.Table("inventory_batches").
		Where("product_id = ? AND batch_number = ? AND is_active = ?", req.ProductID, req.BatchNumber, true).
		Count(&existingCount)

	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Batch number already exists for this product"})
		return
	}

	// Create batch
	batchID := uuid.New().String()
	batch := map[string]interface{}{
		"id":                 batchID,
		"product_id":         req.ProductID,
		"batch_number":       req.BatchNumber,
		"quantity":           req.Quantity,
		"available_quantity": req.Quantity,
		"reserved_quantity":  0,
		"unit_cost":          req.UnitCost,
		"selling_price":      req.SellingPrice,
		"mrp":                req.MRP,
		"manufacturing_date": req.ManufacturingDate,
		"expiry_date":        req.ExpiryDate,
		"location":           req.Location,
		"rack_number":        req.RackNumber,
		"bin_number":         req.BinNumber,
		"supplier_id":        req.SupplierID,
		"purchase_order_id":  req.PurchaseOrderID,
		"is_expired":         false,
		"is_active":          true,
		"created_at":         time.Now(),
		"updated_at":         time.Now(),
	}

	tx := h.db.Begin()

	if err := tx.Table("inventory_batches").Create(batch).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
		return
	}

	// Update product current stock
	if err := tx.Exec(`
		UPDATE products 
		SET current_stock = current_stock + ?,
		    updated_at = NOW()
		WHERE id = ?
	`, req.Quantity, req.ProductID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product stock"})
		return
	}

	// Create stock adjustment record
	adjustment := map[string]interface{}{
		"id":              uuid.New().String(),
		"product_id":      req.ProductID,
		"batch_id":        batchID,
		"adjustment_type": "IN",
		"quantity_before": 0,
		"quantity_after":  req.Quantity,
		"quantity_delta":  req.Quantity,
		"unit_cost":       req.UnitCost,
		"total_cost":      req.Quantity * req.UnitCost,
		"reason":          "New Batch Created",
		"reference_id":    req.PurchaseOrderID,
		"adjusted_by":     c.GetString("user_id"),
		"created_at":      time.Now(),
	}

	if err := tx.Table("stock_adjustments").Create(adjustment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create adjustment record"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Batch created successfully",
		"batchId": batchID,
		"batch":   batch,
	})
}

// GET /api/homeopathy/inventory/batches - List all batches
func (h *HomeopathyInventoryHandler) GetBatches(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	productID := c.Query("productId")
	status := c.Query("status")
	location := c.Query("location")

	offset := (page - 1) * limit

	query := h.db.Table("inventory_batches ib").
		Select(`
			ib.id, ib.product_id, ib.batch_number,
			ib.quantity, ib.available_quantity, ib.reserved_quantity,
			ib.unit_cost, ib.selling_price, ib.mrp,
			ib.available_quantity * ib.unit_cost as total_value,
			ib.manufacturing_date, ib.expiry_date,
			ib.location, ib.rack_number, ib.bin_number,
			ib.is_expired, ib.created_at,
			p.name as product_name, p.sku,
			c.name as category_name, b.name as brand_name,
			v.name as supplier_name,
			CASE
				WHEN ib.expiry_date IS NULL THEN 999999
				ELSE EXTRACT(DAY FROM (ib.expiry_date - NOW()))
			END as days_to_expiry,
			CASE
				WHEN ib.is_expired OR (ib.expiry_date IS NOT NULL AND ib.expiry_date < NOW()) THEN 'Expired'
				WHEN ib.expiry_date IS NOT NULL AND ib.expiry_date < NOW() + INTERVAL '30 days' THEN 'Expiring Soon'
				WHEN ib.available_quantity = 0 THEN 'Out of Stock'
				WHEN ib.available_quantity < ib.quantity * 0.2 THEN 'Low Stock'
				ELSE 'Active'
			END as status
		`).
		Joins("LEFT JOIN products p ON ib.product_id = p.id").
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Joins("LEFT JOIN vendors v ON ib.supplier_id = v.id").
		Where("ib.is_active = ?", true)

	if productID != "" {
		query = query.Where("ib.product_id = ?", productID)
	}

	if status != "" {
		switch status {
		case "expired":
			query = query.Where("ib.is_expired = ? OR (ib.expiry_date IS NOT NULL AND ib.expiry_date < NOW())", true)
		case "expiring_soon":
			query = query.Where("ib.expiry_date IS NOT NULL AND ib.expiry_date >= NOW() AND ib.expiry_date < NOW() + INTERVAL '30 days'")
		case "low_stock":
			query = query.Where("ib.available_quantity < ib.quantity * 0.2 AND ib.available_quantity > 0")
		case "out_of_stock":
			query = query.Where("ib.available_quantity = 0")
		case "active":
			query = query.Where("ib.available_quantity > 0 AND (ib.expiry_date IS NULL OR ib.expiry_date >= NOW() + INTERVAL '30 days')")
		}
	}

	if location != "" {
		query = query.Where("ib.location LIKE ?", "%"+location+"%")
	}

	// Count total
	var total int64
	query.Count(&total)

	// Get batches
	var batches []BatchResponse
	if err := query.Offset(offset).Limit(limit).Order("ib.created_at DESC").Scan(&batches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"batches": batches,
		"total":   total,
		"page":    page,
		"limit":   limit,
		"pages":   (int(total) + limit - 1) / limit,
	})
}

// GET /api/homeopathy/inventory/summary - Inventory summary
func (h *HomeopathyInventoryHandler) GetInventorySummary(c *gin.Context) {
	type InventorySummary struct {
		TotalProducts       int     `json:"totalProducts"`
		TotalBatches        int     `json:"totalBatches"`
		TotalStockValue     float64 `json:"totalStockValue"`
		TotalQuantity       float64 `json:"totalQuantity"`
		LowStockProducts    int     `json:"lowStockProducts"`
		OutOfStockProducts  int     `json:"outOfStockProducts"`
		ExpiringBatches     int     `json:"expiringBatches"`
		ExpiredBatches      int     `json:"expiredBatches"`
		ActiveBatches       int     `json:"activeBatches"`
		AverageStockValue   float64 `json:"averageStockValue"`
	}

	var summary InventorySummary

	// Total products
	var totalProducts int64
	h.db.Table("products").Where("is_active = ?", true).Count(&totalProducts)
	summary.TotalProducts = int(totalProducts)

	// Total batches
	var totalBatches int64
	h.db.Table("inventory_batches").Where("is_active = ?", true).Count(&totalBatches)
	summary.TotalBatches = int(totalBatches)

	// Total stock value and quantity
	h.db.Raw(`
		SELECT 
			COALESCE(SUM(available_quantity * unit_cost), 0) as total_value,
			COALESCE(SUM(available_quantity), 0) as total_quantity
		FROM inventory_batches
		WHERE is_active = true
	`).Scan(&map[string]interface{}{
		"total_value":    &summary.TotalStockValue,
		"total_quantity": &summary.TotalQuantity,
	})

	// Low stock products
	var lowStock int64
	h.db.Table("products").Where("is_active = ? AND current_stock <= reorder_level AND current_stock > 0", true).Count(&lowStock)
	summary.LowStockProducts = int(lowStock)

	// Out of stock products
	var outOfStock int64
	h.db.Table("products").Where("is_active = ? AND current_stock = 0", true).Count(&outOfStock)
	summary.OutOfStockProducts = int(outOfStock)

	// Expiring batches (next 30 days)
	var expiringBatches int64
	h.db.Table("inventory_batches").
		Where("is_active = ? AND expiry_date IS NOT NULL AND expiry_date >= NOW() AND expiry_date < NOW() + INTERVAL '30 days'", true).
		Count(&expiringBatches)
	summary.ExpiringBatches = int(expiringBatches)

	// Expired batches
	var expiredBatches int64
	h.db.Table("inventory_batches").
		Where("is_active = ? AND (is_expired = ? OR (expiry_date IS NOT NULL AND expiry_date < NOW()))", true, true).
		Count(&expiredBatches)
	summary.ExpiredBatches = int(expiredBatches)

	// Active batches
	var activeBatches int64
	h.db.Table("inventory_batches").
		Where("is_active = ? AND available_quantity > 0 AND (expiry_date IS NULL OR expiry_date >= NOW())", true).
		Count(&activeBatches)
	summary.ActiveBatches = int(activeBatches)

	// Average stock value
	if summary.TotalProducts > 0 {
		summary.AverageStockValue = summary.TotalStockValue / float64(summary.TotalProducts)
	}

	c.JSON(http.StatusOK, summary)
}

// GET /api/homeopathy/inventory/valuation - Stock valuation report
func (h *HomeopathyInventoryHandler) GetStockValuation(c *gin.Context) {
	categoryID := c.Query("categoryId")
	brandID := c.Query("brandId")

	type ValuationReport struct {
		ProductID      string  `json:"productId"`
		ProductName    string  `json:"productName"`
		SKU            string  `json:"sku"`
		CategoryName   string  `json:"categoryName"`
		BrandName      string  `json:"brandName"`
		TotalQuantity  float64 `json:"totalQuantity"`
		AverageCost    float64 `json:"averageCost"`
		TotalValue     float64 `json:"totalValue"`
		SellingPrice   float64 `json:"sellingPrice"`
		PotentialValue float64 `json:"potentialValue"`
		Margin         float64 `json:"margin"`
		BatchCount     int     `json:"batchCount"`
	}

	query := h.db.Table("products p").
		Select(`
			p.id as product_id,
			p.name as product_name,
			p.sku,
			c.name as category_name,
			b.name as brand_name,
			COALESCE(SUM(ib.available_quantity), 0) as total_quantity,
			CASE 
				WHEN SUM(ib.available_quantity) > 0 
				THEN SUM(ib.available_quantity * ib.unit_cost) / SUM(ib.available_quantity)
				ELSE 0 
			END as average_cost,
			COALESCE(SUM(ib.available_quantity * ib.unit_cost), 0) as total_value,
			MAX(ib.selling_price) as selling_price,
			COALESCE(SUM(ib.available_quantity * ib.selling_price), 0) as potential_value,
			CASE 
				WHEN SUM(ib.available_quantity * ib.unit_cost) > 0 
				THEN ((SUM(ib.available_quantity * ib.selling_price) - SUM(ib.available_quantity * ib.unit_cost)) / SUM(ib.available_quantity * ib.unit_cost)) * 100
				ELSE 0 
			END as margin,
			COUNT(DISTINCT ib.id) as batch_count
		`).
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Joins("LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.is_active = true AND ib.available_quantity > 0").
		Where("p.is_active = ?", true).
		Group("p.id, p.name, p.sku, c.name, b.name")

	if categoryID != "" {
		query = query.Where("p.category_id = ?", categoryID)
	}

	if brandID != "" {
		query = query.Where("p.brand_id = ?", brandID)
	}

	var report []ValuationReport
	if err := query.Order("total_value DESC").Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate valuation report"})
		return
	}

	// Calculate totals
	var totalValue, totalPotentialValue float64
	for _, item := range report {
		totalValue += item.TotalValue
		totalPotentialValue += item.PotentialValue
	}

	c.JSON(http.StatusOK, gin.H{
		"report":             report,
		"totalValue":         totalValue,
		"totalPotentialValue": totalPotentialValue,
		"totalMargin":        totalPotentialValue - totalValue,
		"count":              len(report),
	})
}

// POST /api/homeopathy/inventory/batches/:id/transfer - Transfer batch to different location
func (h *HomeopathyInventoryHandler) TransferBatch(c *gin.Context) {
	batchID := c.Param("id")

	type TransferRequest struct {
		ToLocation   string `json:"toLocation" binding:"required"`
		ToRackNumber string `json:"toRackNumber"`
		ToBinNumber  string `json:"toBinNumber"`
		Notes        string `json:"notes"`
	}

	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update batch location
	result := h.db.Table("inventory_batches").
		Where("id = ?", batchID).
		Updates(map[string]interface{}{
			"location":    req.ToLocation,
			"rack_number": req.ToRackNumber,
			"bin_number":  req.ToBinNumber,
			"updated_at":  time.Now(),
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to transfer batch"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Batch transferred successfully",
		"batchId":    batchID,
		"toLocation": req.ToLocation,
	})
}
