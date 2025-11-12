package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HomeopathyProductHandler - Enhanced handler for homeopathy products
type HomeopathyProductHandler struct {
	db *gorm.DB
}

func NewHomeopathyProductHandler(db *gorm.DB) *HomeopathyProductHandler {
	return &HomeopathyProductHandler{db: db}
}

// ProductSearchRequest for advanced search
type ProductSearchRequest struct {
	Query      string   `json:"query"`
	CategoryID string   `json:"categoryId"`
	BrandID    string   `json:"brandId"`
	PotencyID  string   `json:"potencyId"`
	FormID     string   `json:"formId"`
	MinPrice   float64  `json:"minPrice"`
	MaxPrice   float64  `json:"maxPrice"`
	InStock    bool     `json:"inStock"`
	Tags       []string `json:"tags"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
}

// ProductWithDetails includes all related entities
type ProductWithDetails struct {
	ID                     string     `json:"id"`
	SKU                    string     `json:"sku"`
	Name                   string     `json:"name"`
	Description            string     `json:"description"`
	CategoryName           string     `json:"categoryName"`
	BrandName              string     `json:"brandName"`
	PotencyName            string     `json:"potencyName"`
	PotencyType            string     `json:"potencyType"`
	FormName               string     `json:"formName"`
	CostPrice              float64    `json:"costPrice"`
	SellingPrice           float64    `json:"sellingPrice"`
	MRP                    float64    `json:"mrp"`
	TaxRate                float64    `json:"taxRate"`
	CurrentStock           float64    `json:"currentStock"`
	ReorderLevel           int        `json:"reorderLevel"`
	MinStock               int        `json:"minStock"`
	Manufacturer           string     `json:"manufacturer"`
	PackSize               string     `json:"packSize"`
	Barcode                string     `json:"barcode"`
	IsPrescriptionRequired bool       `json:"isPrescriptionRequired"`
	IsActive               bool       `json:"isActive"`
	Tags                   string     `json:"tags"`
	HSNCode                string     `json:"hsnCode"`
	GSTRate                float64    `json:"gstRate"`
	CreatedAt              time.Time  `json:"createdAt"`
	UpdatedAt              time.Time  `json:"updatedAt"`
}

// GET /api/homeopathy/products/search - Advanced product search
func (h *HomeopathyProductHandler) SearchProducts(c *gin.Context) {
	var req ProductSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 50
	}

	offset := (req.Page - 1) * req.Limit

	query := h.db.Table("products p").
		Select(`
			p.id, p.sku, p.name, p.description, p.cost_price, p.selling_price, 
			p.mrp, p.tax_rate, p.current_stock, p.reorder_level, p.min_stock,
			p.manufacturer, p.pack_size, p.barcode, p.is_prescription_required,
			p.is_active, p.tags, p.created_at, p.updated_at,
			c.name as category_name, b.name as brand_name,
			pot.name as potency_name, pot.potency_type,
			f.name as form_name, h.code as hsn_code, h.gst_rate
		`).
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Joins("LEFT JOIN potencies pot ON p.potency_id = pot.id").
		Joins("LEFT JOIN forms f ON p.form_id = f.id").
		Joins("LEFT JOIN hsn_codes h ON p.hsn_code_id = h.id").
		Where("p.is_active = ?", true)

	// Apply filters
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.sku) LIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	if req.CategoryID != "" {
		query = query.Where("p.category_id = ?", req.CategoryID)
	}

	if req.BrandID != "" {
		query = query.Where("p.brand_id = ?", req.BrandID)
	}

	if req.PotencyID != "" {
		query = query.Where("p.potency_id = ?", req.PotencyID)
	}

	if req.FormID != "" {
		query = query.Where("p.form_id = ?", req.FormID)
	}

	if req.MinPrice > 0 {
		query = query.Where("p.selling_price >= ?", req.MinPrice)
	}

	if req.MaxPrice > 0 {
		query = query.Where("p.selling_price <= ?", req.MaxPrice)
	}

	if req.InStock {
		query = query.Where("p.current_stock > 0")
	}

	// Count total
	var total int64
	query.Count(&total)

	// Get products
	var products []ProductWithDetails
	if err := query.Offset(offset).Limit(req.Limit).Order("p.name ASC").Scan(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     req.Page,
		"limit":    req.Limit,
		"pages":    (int(total) + req.Limit - 1) / req.Limit,
	})
}

// GET /api/homeopathy/products/:id/batches - Get all batches for a product
func (h *HomeopathyProductHandler) GetProductBatches(c *gin.Context) {
	productID := c.Param("id")

	type BatchInfo struct {
		ID                string     `json:"id"`
		BatchNumber       string     `json:"batchNumber"`
		Quantity          float64    `json:"quantity"`
		AvailableQuantity float64    `json:"availableQuantity"`
		ReservedQuantity  float64    `json:"reservedQuantity"`
		UnitCost          float64    `json:"unitCost"`
		SellingPrice      float64    `json:"sellingPrice"`
		MRP               float64    `json:"mrp"`
		ManufacturingDate *time.Time `json:"manufacturingDate"`
		ExpiryDate        *time.Time `json:"expiryDate"`
		Location          string     `json:"location"`
		RackNumber        string     `json:"rackNumber"`
		SupplierName      string     `json:"supplierName"`
		IsExpired         bool       `json:"isExpired"`
		DaysToExpiry      int        `json:"daysToExpiry"`
		Status            string     `json:"status"`
	}

	var batches []BatchInfo
	err := h.db.Table("inventory_batches ib").
		Select(`
			ib.id, ib.batch_number, ib.quantity, ib.available_quantity,
			ib.reserved_quantity, ib.unit_cost, ib.selling_price, ib.mrp,
			ib.manufacturing_date, ib.expiry_date, ib.location, ib.rack_number,
			v.name as supplier_name, ib.is_expired,
			CASE
				WHEN ib.expiry_date IS NULL THEN 999999
				ELSE EXTRACT(DAY FROM (ib.expiry_date - NOW()))
			END as days_to_expiry,
			CASE
				WHEN ib.is_expired THEN 'Expired'
				WHEN ib.expiry_date IS NOT NULL AND ib.expiry_date < NOW() THEN 'Expired'
				WHEN ib.expiry_date IS NOT NULL AND ib.expiry_date < NOW() + INTERVAL '30 days' THEN 'Expiring Soon'
				WHEN ib.available_quantity <= 0 THEN 'Out of Stock'
				WHEN ib.available_quantity < ib.quantity * 0.2 THEN 'Low Stock'
				ELSE 'Active'
			END as status
		`).
		Joins("LEFT JOIN vendors v ON ib.supplier_id = v.id").
		Where("ib.product_id = ? AND ib.is_active = ?", productID, true).
		Order("ib.expiry_date ASC NULLS LAST, ib.batch_number ASC").
		Scan(&batches).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"batches": batches,
		"total":   len(batches),
	})
}

// GET /api/homeopathy/products/low-stock - Get low stock products
func (h *HomeopathyProductHandler) GetLowStockProducts(c *gin.Context) {
	type LowStockProduct struct {
		ID            string  `json:"id"`
		SKU           string  `json:"sku"`
		Name          string  `json:"name"`
		CategoryName  string  `json:"categoryName"`
		BrandName     string  `json:"brandName"`
		CurrentStock  float64 `json:"currentStock"`
		MinStock      int     `json:"minStock"`
		ReorderLevel  int     `json:"reorderLevel"`
		StockStatus   string  `json:"stockStatus"`
		LastOrderDate *time.Time `json:"lastOrderDate"`
	}

	var products []LowStockProduct
	err := h.db.Table("products p").
		Select(`
			p.id, p.sku, p.name, c.name as category_name, b.name as brand_name,
			p.current_stock, p.min_stock, p.reorder_level,
			CASE
				WHEN p.current_stock = 0 THEN 'Out of Stock'
				WHEN p.current_stock <= p.min_stock THEN 'Critical'
				WHEN p.current_stock <= p.reorder_level THEN 'Low Stock'
				ELSE 'Normal'
			END as stock_status
		`).
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Where("p.is_active = ? AND p.current_stock <= p.reorder_level", true).
		Order("p.current_stock ASC, p.name ASC").
		Scan(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch low stock products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    len(products),
	})
}

// GET /api/homeopathy/products/expiring - Get expiring products
func (h *HomeopathyProductHandler) GetExpiringProducts(c *gin.Context) {
	days := c.DefaultQuery("days", "30")

	type ExpiringProduct struct {
		ID            string     `json:"id"`
		SKU           string     `json:"sku"`
		ProductName   string     `json:"productName"`
		BatchNumber   string     `json:"batchNumber"`
		ExpiryDate    *time.Time `json:"expiryDate"`
		DaysToExpiry  int        `json:"daysToExpiry"`
		Quantity      float64    `json:"quantity"`
		Value         float64    `json:"value"`
		Status        string     `json:"status"`
	}

	var products []ExpiringProduct
	err := h.db.Table("inventory_batches ib").
		Select(`
			p.id, p.sku, p.name as product_name, ib.batch_number,
			ib.expiry_date,
			EXTRACT(DAY FROM (ib.expiry_date - NOW())) as days_to_expiry,
			ib.available_quantity as quantity,
			ib.available_quantity * ib.unit_cost as value,
			CASE
				WHEN ib.expiry_date < NOW() THEN 'Expired'
				WHEN ib.expiry_date < NOW() + INTERVAL '7 days' THEN 'Urgent'
				WHEN ib.expiry_date < NOW() + INTERVAL '30 days' THEN 'Warning'
				ELSE 'Normal'
			END as status
		`).
		Joins("JOIN products p ON ib.product_id = p.id").
		Where("ib.expiry_date IS NOT NULL AND ib.expiry_date <= NOW() + INTERVAL '? days' AND ib.is_active = ?", days, true).
		Order("ib.expiry_date ASC").
		Scan(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiring products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    len(products),
	})
}

// POST /api/homeopathy/products/:id/adjust-stock - Adjust stock with reason
func (h *HomeopathyProductHandler) AdjustStock(c *gin.Context) {
	productID := c.Param("id")

	type StockAdjustmentRequest struct {
		BatchID        string  `json:"batchId" binding:"required"`
		AdjustmentType string  `json:"adjustmentType" binding:"required"` // IN, OUT, ADJUSTMENT
		Quantity       float64 `json:"quantity" binding:"required"`
		Reason         string  `json:"reason" binding:"required"`
		Notes          string  `json:"notes"`
		ReferenceID    string  `json:"referenceId"`
	}

	var req StockAdjustmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := h.db.Begin()

	// Get current batch
	var batch struct {
		Quantity          float64
		AvailableQuantity float64
		UnitCost          float64
	}
	if err := tx.Table("inventory_batches").
		Where("id = ? AND product_id = ?", req.BatchID, productID).
		Select("quantity, available_quantity, unit_cost").
		First(&batch).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}

	// Calculate new quantities
	var newQuantity, newAvailable float64
	switch req.AdjustmentType {
	case "IN":
		newQuantity = batch.Quantity + req.Quantity
		newAvailable = batch.AvailableQuantity + req.Quantity
	case "OUT":
		if batch.AvailableQuantity < req.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
			return
		}
		newQuantity = batch.Quantity - req.Quantity
		newAvailable = batch.AvailableQuantity - req.Quantity
	case "ADJUSTMENT":
		newQuantity = req.Quantity
		newAvailable = req.Quantity
	default:
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adjustment type"})
		return
	}

	// Update batch
	if err := tx.Table("inventory_batches").
		Where("id = ?", req.BatchID).
		Updates(map[string]interface{}{
			"quantity":           newQuantity,
			"available_quantity": newAvailable,
			"updated_at":         time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update batch"})
		return
	}

	// Create adjustment record
	adjustment := map[string]interface{}{
		"id":              uuid.New().String(),
		"product_id":      productID,
		"batch_id":        req.BatchID,
		"adjustment_type": req.AdjustmentType,
		"quantity_before": batch.Quantity,
		"quantity_after":  newQuantity,
		"quantity_delta":  req.Quantity,
		"unit_cost":       batch.UnitCost,
		"total_cost":      batch.UnitCost * req.Quantity,
		"reason":          req.Reason,
		"notes":           req.Notes,
		"reference_id":    req.ReferenceID,
		"adjusted_by":     c.GetString("user_id"),
		"created_at":      time.Now(),
	}

	if err := tx.Table("stock_adjustments").Create(adjustment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create adjustment record"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":          "Stock adjusted successfully",
		"previousQuantity": batch.Quantity,
		"newQuantity":      newQuantity,
		"adjustment":       adjustment,
	})
}

// GET /api/homeopathy/products/by-potency/:potencyId - Get products by potency
func (h *HomeopathyProductHandler) GetProductsByPotency(c *gin.Context) {
	potencyID := c.Param("potencyId")

	var products []ProductWithDetails
	err := h.db.Table("products p").
		Select(`
			p.id, p.sku, p.name, p.description, p.cost_price, p.selling_price,
			p.mrp, p.current_stock, c.name as category_name, b.name as brand_name,
			pot.name as potency_name, f.name as form_name
		`).
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Joins("LEFT JOIN potencies pot ON p.potency_id = pot.id").
		Joins("LEFT JOIN forms f ON p.form_id = f.id").
		Where("p.potency_id = ? AND p.is_active = ?", potencyID, true).
		Order("p.name ASC").
		Scan(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    len(products),
	})
}

// GET /api/homeopathy/products/bestsellers - Get best selling products
func (h *HomeopathyProductHandler) GetBestSellers(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	days := c.DefaultQuery("days", "30")

	type BestSeller struct {
		ProductID    string  `json:"productId"`
		ProductName  string  `json:"productName"`
		SKU          string  `json:"sku"`
		CategoryName string  `json:"categoryName"`
		BrandName    string  `json:"brandName"`
		TotalSold    float64 `json:"totalSold"`
		TotalRevenue float64 `json:"totalRevenue"`
		OrderCount   int     `json:"orderCount"`
	}

	var products []BestSeller
	err := h.db.Table("sales_order_items soi").
		Select(`
			p.id as product_id, p.name as product_name, p.sku,
			c.name as category_name, b.name as brand_name,
			SUM(soi.quantity) as total_sold,
			SUM(soi.total_amount) as total_revenue,
			COUNT(DISTINCT soi.sales_order_id) as order_count
		`).
		Joins("JOIN products p ON soi.product_id = p.id").
		Joins("LEFT JOIN categories c ON p.category_id = c.id").
		Joins("LEFT JOIN brands b ON p.brand_id = b.id").
		Joins("JOIN sales_orders so ON soi.sales_order_id = so.id").
		Where("so.created_at >= NOW() - INTERVAL '? days' AND so.status != 'CANCELLED'", days).
		Group("p.id, p.name, p.sku, c.name, b.name").
		Order("total_sold DESC").
		Limit(limit).
		Scan(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bestsellers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    len(products),
	})
}
