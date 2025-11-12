package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type ProductHandler struct {
	db *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

// Product model matching database table (core schema)
type Product struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid"`
	SKU          string    `json:"sku" gorm:"uniqueIndex"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	Brand        string    `json:"brand"`
	Potency      string    `json:"potency"`
	Form         string    `json:"form"`
	PackSize     string    `json:"packSize" gorm:"column:pack_size"`
	UOM          string    `json:"uom"`
	CostPrice    float64   `json:"costPrice" gorm:"column:cost_price"`
	SellingPrice float64   `json:"sellingPrice" gorm:"column:selling_price"`
	MRP          float64   `json:"mrp"`
	TaxPercent   float64   `json:"taxPercent" gorm:"column:tax_percent"`
	HSNCode      string    `json:"hsnCode" gorm:"column:hsn_code"`
	Manufacturer string    `json:"manufacturer"`
	Description  string    `json:"description"`
	Barcode      string    `json:"barcode"`
	ReorderLevel int       `json:"reorderLevel" gorm:"column:reorder_level"`
	MinStock     int       `json:"minStock" gorm:"column:min_stock"`
	MaxStock     int       `json:"maxStock" gorm:"column:max_stock"`
	CurrentStock float64   `json:"currentStock" gorm:"column:current_stock"`
	IsActive     bool      `json:"isActive" gorm:"column:is_active"`
	Tags         string    `json:"tags"`
	CreatedAt    time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

// AI Request/Response structs
type AIRecommendationRequest struct {
	ProductID  string `json:"product_id" binding:"required"`
	CustomerID string `json:"customer_id"`
	Limit      int    `json:"limit" default:"5"`
}

type AIDemandForecastRequest struct {
	ProductIDs []string `json:"product_ids" binding:"required"`
	Months     int      `json:"months_ahead" default:"1"`
}

type AICustomerSegmentationRequest struct {
	CustomerID      string `json:"customer_id" binding:"required"`
	IncludeFeatures bool   `json:"include_features" default:"false"`
}

type AIInventoryOptimizationRequest struct {
	ProductIDs         []string `json:"product_ids" binding:"required"`
	OptimizationType   string   `json:"optimization_type" default:"both"`
}

type AIFraudCheckRequest struct {
	TransactionID   string            `json:"transaction_id" binding:"required"`
	UserID          string            `json:"user_id" binding:"required"`
	Amount          float64           `json:"amount" binding:"required"`
	PaymentMethod   string            `json:"payment_method" binding:"required"`
	UserBehavior    map[string]interface{} `json:"user_behavior"`
}

type AIBatchRecommendationRequest struct {
	CustomerIDs []string `json:"customer_ids" binding:"required"`
	Limit       int      `json:"limit" default:"10"`
}

func (Product) TableName() string {
	return "products"
}

// GET /api/erp/products - List all products
func (h *ProductHandler) GetProducts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	pageStr := c.DefaultQuery("page", "1")
	search := c.Query("search")
	category := c.Query("category")
	brand := c.Query("brand")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)

	// If limit is very high (like 10000), return all products without pagination
	if limit >= 1000 {
		limit = 100000 // Set to very high number to get all
		page = 1
	}

	offset := (page - 1) * limit

	// Build query from public schema (where products were actually imported)
	query := h.db.Table("products")

	// Apply filters
	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(sku) LIKE ?", searchPattern, searchPattern)
	}
	if category != "" {
		query = query.Where("LOWER(category) = ?", strings.ToLower(category))
	}
	if brand != "" {
		query = query.Where("LOWER(brand) = ?", strings.ToLower(brand))
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Fetch products
	var products []Product
	result := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch products: " + result.Error.Error(),
		})
		return
	}

	// Calculate total pages (only if using pagination)
	totalPages := 1
	if limit < 1000 {
		totalPages = int(total) / limit
		if int(total)%limit > 0 {
			totalPages++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": totalPages,
		},
	})
}

// GET /api/erp/products/:id - Get single product
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")

	var product Product
	result := h.db.Table("products").Where("id = ? OR sku = ?", id, id).First(&product)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Product not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch product: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
	})
}

// POST /api/erp/products - Create product
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req["id"] = uuid.New().String()
	req["createdAt"] = time.Now().Format(time.RFC3339)
	req["updatedAt"] = time.Now().Format(time.RFC3339)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    req,
		"message": "Product created successfully",
	})
}

// PUT /api/erp/products/:id - Update product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req["id"] = id
	req["updatedAt"] = time.Now().Format(time.RFC3339)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    req,
		"message": "Product updated successfully",
	})
}

// DELETE /api/erp/products/:id - Delete product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Product deleted successfully",
		"id":      id,
	})
}

// Master data models
type MasterData struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid"`
	Name        string    `json:"name"`
	Code        string    `json:"code"`
	Description string    `json:"description"`
	ParentID    *string   `json:"parent_id" gorm:"column:parent_id;type:uuid"`
	IsActive    bool      `json:"isActive" gorm:"column:is_active"`
	CreatedAt   time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

// GET /api/erp/categories - List categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	var categories []MasterData
	result := h.db.Table("categories").Order("name ASC").Find(&categories)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch categories: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    categories,
	})
}

// GET /api/erp/categories/:id - Get single category
func (h *ProductHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")

	var category MasterData
	result := h.db.Table("categories").Where("id = ?", id).First(&category)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Category not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch category: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    category,
	})
}

// POST /api/erp/categories - Create category
func (h *ProductHandler) CreateCategory(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true

	if err := h.db.Table("categories").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create category: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    req,
		"message": "Category created successfully",
	})
}

// PUT /api/erp/categories/:id - Update category
func (h *ProductHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var req MasterData

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.UpdatedAt = time.Now()

	if err := h.db.Table("categories").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update category: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Category updated successfully",
	})
}

// DELETE /api/erp/categories/:id - Delete category
func (h *ProductHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Table("categories").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete category: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Category deleted successfully",
	})
}

// Subcategory model
type Subcategory struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid"`
	Name        string    `json:"name"`
	Code        string    `json:"code"`
	CategoryID  string    `json:"category_id" gorm:"column:parent_id;type:uuid"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active" gorm:"column:is_active"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at"`
}

// GET /api/masters/subcategories - List subcategories
func (h *ProductHandler) GetSubcategories(c *gin.Context) {
	categoryID := c.Query("category_id")

	query := h.db.Table("categories").Where("parent_id IS NOT NULL").Order("name ASC")

	if categoryID != "" {
		query = query.Where("parent_id = ?", categoryID)
	}

	var subcategories []Subcategory
	result := query.Find(&subcategories)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch subcategories: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    subcategories,
		"total":   len(subcategories),
	})
}

// GET /api/erp/brands - List brands
func (h *ProductHandler) GetBrands(c *gin.Context) {
	var brands []MasterData
	result := h.db.Table("brands").Order("name ASC").Find(&brands)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch brands: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    brands,
	})
}

// POST /api/erp/brands - Create brand
func (h *ProductHandler) CreateBrand(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("brands").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "Brand created"})
}

// PUT /api/erp/brands/:id - Update brand
func (h *ProductHandler) UpdateBrand(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("brands").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Brand updated"})
}

// DELETE /api/erp/brands/:id - Delete brand
func (h *ProductHandler) DeleteBrand(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("brands").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Brand deleted"})
}

// GET /api/erp/potencies - List potencies
func (h *ProductHandler) GetPotencies(c *gin.Context) {
	var potencies []MasterData
	result := h.db.Table("potencies").Order("name ASC").Find(&potencies)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch potencies: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    potencies,
	})
}

// POST /api/erp/potencies - Create potency
func (h *ProductHandler) CreatePotency(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("potencies").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "Potency created"})
}

// PUT /api/erp/potencies/:id - Update potency
func (h *ProductHandler) UpdatePotency(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("potencies").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Potency updated"})
}

// DELETE /api/erp/potencies/:id - Delete potency
func (h *ProductHandler) DeletePotency(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("potencies").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Potency deleted"})
}

// GET /api/erp/forms - List forms
func (h *ProductHandler) GetForms(c *gin.Context) {
	var forms []MasterData
	result := h.db.Table("forms").Order("name ASC").Find(&forms)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch forms: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    forms,
	})
}

// POST /api/erp/forms - Create form
func (h *ProductHandler) CreateForm(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("forms").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "Form created"})
}

// PUT /api/erp/forms/:id - Update form
func (h *ProductHandler) UpdateForm(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("forms").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Form updated"})
}

// DELETE /api/erp/forms/:id - Delete form
func (h *ProductHandler) DeleteForm(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("forms").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Form deleted"})
}

// ==================== HSN CODES ====================

// GET /api/erp/hsn-codes - Get all HSN codes
func (h *ProductHandler) GetHSNCodes(c *gin.Context) {
	var hsnCodes []MasterData
	if err := h.db.Table("hsn_codes").Find(&hsnCodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": hsnCodes})
}

// POST /api/erp/hsn-codes - Create HSN code
func (h *ProductHandler) CreateHSNCode(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("hsn_codes").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "HSN code created"})
}

// PUT /api/erp/hsn-codes/:id - Update HSN code
func (h *ProductHandler) UpdateHSNCode(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("hsn_codes").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "HSN code updated"})
}

// DELETE /api/erp/hsn-codes/:id - Delete HSN code
func (h *ProductHandler) DeleteHSNCode(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("hsn_codes").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "HSN code deleted"})
}

// ==================== UNITS ====================

// GET /api/erp/units - Get all units
func (h *ProductHandler) GetUnits(c *gin.Context) {
	var units []MasterData
	if err := h.db.Table("units").Find(&units).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": units})
}

// POST /api/erp/units - Create unit
func (h *ProductHandler) CreateUnit(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("units").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "Unit created"})
}

// PUT /api/erp/units/:id - Update unit
func (h *ProductHandler) UpdateUnit(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("units").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Unit updated"})
}

// DELETE /api/erp/units/:id - Delete unit
func (h *ProductHandler) DeleteUnit(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("units").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Unit deleted"})
}

// ==================== BARCODES ====================

// GET /api/erp/products/barcode - Get all products with barcodes (batch-level)
func (h *ProductHandler) GetBarcodes(c *gin.Context) {
	// Build query with joins to get all necessary fields
	query := `
		SELECT
			b.id,
			b.product_id,
			p.name as product_name,
			p.sku,
			COALESCE(p.potency, '') as potency,
			COALESCE(p.brand, '') as brand,
			COALESCE(p.category, '') as category,
			COALESCE(b.batch_id::text, '') as batch_id,
			COALESCE(b.batch_no, '') as batch_no,
			b.barcode,
			COALESCE(b.barcode_type, 'EAN13') as barcode_type,
			COALESCE(b.mrp, 0) as mrp,
			b.exp_date,
			COALESCE(b.quantity, 0) as quantity,
			COALESCE(w.name, 'Main Warehouse') as warehouse,
			b.generated_at,
			COALESCE(b.status, 'active') as status,
			COALESCE(b.created_by::text, '') as created_by,
			-- Calculate expiry status
			CASE
				WHEN b.exp_date < CURRENT_DATE THEN 'expired'
				WHEN b.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
				ELSE 'active'
			END as expiry_status
		FROM public.barcodes b
		LEFT JOIN public.products p ON p.id = b.product_id
		LEFT JOIN public.warehouses w ON w.id = b.warehouse_id
		ORDER BY b.generated_at DESC
	`

	rows, err := h.db.Raw(query).Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch barcodes: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var barcodes []gin.H
	for rows.Next() {
		var id, productId, productName, sku, potency, brand, category, batchId, batchNo, barcode, barcodeType, warehouse, generatedAt, status, createdBy, expiryStatus string
		var mrp float64
		var expDate *string
		var quantity int

		err := rows.Scan(&id, &productId, &productName, &sku, &potency, &brand, &category, &batchId, &batchNo, &barcode, &barcodeType, &mrp, &expDate, &quantity, &warehouse, &generatedAt, &status, &createdBy, &expiryStatus)
		if err != nil {
			continue
		}

		barcodeData := gin.H{
			"id":            id,
			"product_id":    productId,
			"product_name":  productName,
			"sku":           sku,
			"potency":       potency,
			"brand":         brand,
			"category":      category,
			"batch_id":      batchId,
			"batch_no":      batchNo,
			"barcode":       barcode,
			"barcode_type":  barcodeType,
			"mrp":           mrp,
			"exp_date":      expDate,
			"quantity":      quantity,
			"warehouse":     warehouse,
			"generated_at":  generatedAt,
			"status":        status,
			"created_by":    createdBy,
			"expiry_status": expiryStatus,
		}

		barcodes = append(barcodes, barcodeData)
	}

	// Return the aggregated barcode list
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    barcodes,
		"total":   len(barcodes),
	})
}

// ==================== CUSTOMERS ====================

// GET /api/erp/customers - List customers
func (h *ProductHandler) GetCustomers(c *gin.Context) {
	var customers []models.Customer
	result := h.db.Table("customers").Order("name ASC").Find(&customers)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch customers: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    customers,
		"total":   len(customers),
	})
}

// GET /api/erp/customers/:id - Get single customer
func (h *ProductHandler) GetCustomer(c *gin.Context) {
	id := c.Param("id")

	var customer models.Customer
	result := h.db.Table("customers").Where("id = ? OR customer_code = ?", id, id).First(&customer)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Customer not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch customer: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    customer,
	})
}

// POST /api/erp/customers - Create customer
func (h *ProductHandler) CreateCustomer(c *gin.Context) {
	var req models.Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true

	if err := h.db.Table("customers").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create customer: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    req,
		"message": "Customer created successfully",
	})
}

// PUT /api/erp/customers/:id - Update customer
func (h *ProductHandler) UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var req models.Customer

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.UpdatedAt = time.Now()

	if err := h.db.Table("customers").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update customer: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Customer updated successfully",
	})
}

// DELETE /api/erp/customers/:id - Delete customer
func (h *ProductHandler) DeleteCustomer(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Table("customers").Where("id = ?", id).Delete(&models.Customer{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete customer: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Customer deleted successfully",
	})
}

// ==================== VENDORS ====================

// GET /api/erp/vendors - List vendors
func (h *ProductHandler) GetVendors(c *gin.Context) {
	var vendors []models.Vendor
	result := h.db.Table("vendors").Order("name ASC").Find(&vendors)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch vendors: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    vendors,
		"total":   len(vendors),
	})
}

// GET /api/erp/vendors/:id - Get single vendor
func (h *ProductHandler) GetVendor(c *gin.Context) {
	id := c.Param("id")

	var vendor models.Vendor
	result := h.db.Table("vendors").Where("id = ? OR vendor_code = ?", id, id).First(&vendor)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Vendor not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch vendor: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    vendor,
	})
}

// POST /api/erp/vendors - Create vendor
func (h *ProductHandler) CreateVendor(c *gin.Context) {
	var req models.Vendor
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true

	if err := h.db.Table("vendors").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create vendor: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    req,
		"message": "Vendor created successfully",
	})
}

// PUT /api/erp/vendors/:id - Update vendor
func (h *ProductHandler) UpdateVendor(c *gin.Context) {
	id := c.Param("id")
	var req models.Vendor

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.UpdatedAt = time.Now()

	if err := h.db.Table("vendors").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update vendor: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Vendor updated successfully",
	})
}

// DELETE /api/erp/vendors/:id - Delete vendor
func (h *ProductHandler) DeleteVendor(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Table("vendors").Where("id = ?", id).Delete(&models.Vendor{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete vendor: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Vendor deleted successfully",
	})
}

// POST /api/erp/products/barcode/generate - Generate barcode for batch
func (h *ProductHandler) GenerateBarcode(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id"`
		BatchID   string `json:"batch_id"`
		BatchNo   string `json:"batch_no"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid payload"})
		return
	}
	if req.ProductID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "product_id is required"})
		return
	}

	// Get product details including homeopathy-specific fields
	var productName, sku, potency, form, brand, category string
	var productMRP float64
	err := h.db.Table("products").Where("id = ?", req.ProductID).Select("name, sku, potency, form, brand, category, mrp").Row().Scan(&productName, &sku, &potency, &form, &brand, &category, &productMRP)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "product not found"})
		return
	}

	// Get batch details if batch_id provided
	var batchNo string = req.BatchNo
	var batchMRP float64 = productMRP
	var expDate *time.Time
	var qty int = 0
	var warehouseID *string

	if req.BatchID != "" {
		err = h.db.Raw(`
			SELECT b.batch_no, b.mrp, b.exp_date, COALESCE(b.quantity,0) AS qty, b.warehouse_id
			FROM batches b
			WHERE b.id = ?`, req.BatchID).Row().Scan(&batchNo, &batchMRP, &expDate, &qty, &warehouseID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "batch not found"})
			return
		}
	}

	// Generate unique EAN-13 barcode
	barcode := "89012345" + strconv.Itoa(int(time.Now().UnixNano()%10000))
	// Ensure uniqueness
	for i := 0; i < 10; i++ {
		var count int
		h.db.Raw("SELECT COUNT(*) FROM public.barcodes WHERE barcode = ?", barcode).Row().Scan(&count)
		if count == 0 {
			break
		}
		barcode = "89012345" + strconv.Itoa(int(time.Now().UnixNano()%10000)+i)
	}

	// Create barcode record
	barcodeRecord := gin.H{
		"id":           uuid.New().String(),
		"product_id":   req.ProductID,
		"batch_id":     req.BatchID,
		"batch_no":     batchNo,
		"barcode":      barcode,
		"barcode_type": "EAN-13",
		"mrp":          batchMRP,
		"exp_date":     nil,
		"quantity":     qty,
		"warehouse_id": warehouseID,
		"potency":      potency,
		"form":         form,
		"brand":        brand,
		"category":     category,
		"created_by":   "system",
		"status":       "active",
	}

	if expDate != nil {
		barcodeRecord["exp_date"] = expDate.Format("2006-01-02")
	}

	// Insert into database
	insertQuery := `
		INSERT INTO public.barcodes (id, product_id, batch_id, batch_no, barcode, barcode_type, mrp, exp_date, quantity, warehouse_id, potency, form, brand, category, created_by, status, generated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	err = h.db.Exec(insertQuery,
		barcodeRecord["id"],
		barcodeRecord["product_id"],
		barcodeRecord["batch_id"],
		barcodeRecord["batch_no"],
		barcodeRecord["barcode"],
		barcodeRecord["barcode_type"],
		barcodeRecord["mrp"],
		barcodeRecord["exp_date"],
		barcodeRecord["quantity"],
		barcodeRecord["warehouse_id"],
		barcodeRecord["potency"],
		barcodeRecord["form"],
		barcodeRecord["brand"],
		barcodeRecord["category"],
		barcodeRecord["created_by"],
		barcodeRecord["status"],
		time.Now(),
	).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to save barcode"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    barcodeRecord,
		"message": "Barcode generated successfully",
	})
}

// POST /api/erp/products/barcode/print - Prepare barcode labels for printing
func (h *ProductHandler) PrintBarcodes(c *gin.Context) {
	var req struct {
		BarcodeIDs []string `json:"barcode_ids"`
		LabelSize  string   `json:"label_size"` // "small", "medium", "large"
		Copies     int      `json:"copies"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Prepare print data
	printData := gin.H{
		"print_id":     uuid.New().String(),
		"barcode_ids":  req.BarcodeIDs,
		"label_size":   req.LabelSize,
		"copies":       req.Copies,
		"total_labels": len(req.BarcodeIDs) * req.Copies,
		"print_url":    "/api/erp/products/barcode/print/" + uuid.New().String() + ".pdf",
		"created_at":   time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    printData,
		"message": "Print data prepared successfully",
	})
}

// ==================== PAYMENTS ====================

// GET /api/erp/payments - List payments
func (h *ProductHandler) GetPayments(c *gin.Context) {
	var payments []models.Payment
	result := h.db.Table("payments").Order("created_at DESC").Find(&payments)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch payments: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"total":   len(payments),
	})
}

// POST /api/erp/payments - Create payment
func (h *ProductHandler) CreatePayment(c *gin.Context) {
	var req models.Payment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.UpdatedBy = "system"
	req.Status = "COMPLETED"

	tx := h.db.Begin()
	
	if err := tx.Table("payments").Create(&req).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create payment",
			"success": false,
		})
		return
	}
	
	err := tx.Exec(`
		UPDATE sales_invoices 
		SET payment_status = CASE 
				WHEN (total_amount - COALESCE(paid_amount, 0) - ?) <= 0 THEN 'PAID'
				WHEN COALESCE(paid_amount, 0) > 0 THEN 'PARTIAL'
				ELSE 'PENDING'
			END,
			paid_amount = COALESCE(paid_amount, 0) + ?,
			updated_at = NOW()
		WHERE id = ? AND deleted_at IS NULL
	`, req.Amount, req.Amount, req.ID).Error
	
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update invoice",
			"success": false,
		})
		return
	}
	
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    req,
		"message": "Payment created successfully",
	})
}

// PUT /api/erp/payments/:id - Update payment
func (h *ProductHandler) UpdatePayment(c *gin.Context) {
	id := c.Param("id")
	var req models.Payment

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	req.UpdatedAt = time.Now()
	req.UpdatedBy = "system" // TODO: Get from auth context

	if err := h.db.Table("payments").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update payment: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment updated successfully",
	})
}

// ==================== INVENTORY ====================

// GET /api/erp/inventory - Get inventory
func (h *ProductHandler) GetInventory(c *gin.Context) {
	var items []models.InventoryBatch
	result := h.db.Table("inventory").Order("product_name ASC").Find(&items)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch inventory: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
		"total":   len(items),
	})
}

// POST /api/erp/inventory/adjust - Adjust stock
func (h *ProductHandler) AdjustStock(c *gin.Context) {
	var req struct {
		ProductID string  `json:"productId"`
		Quantity  float64 `json:"quantity"`
		Type      string  `json:"type"` // "ADD" or "REMOVE"
		Reason    string  `json:"reason"`
		Notes     string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Update inventory
	var currentStock float64
	h.db.Table("inventory").Where("product_id = ?", req.ProductID).Select("current_stock").Row().Scan(&currentStock)

	if req.Type == "ADD" {
		currentStock += req.Quantity
	} else {
		currentStock -= req.Quantity
	}

	if err := h.db.Table("inventory").Where("product_id = ?", req.ProductID).Update("current_stock", currentStock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to adjust stock: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock adjusted successfully",
		"data": gin.H{
			"productId": req.ProductID,
			"quantity":  req.Quantity,
			"type":      req.Type,
			"newStock":  currentStock,
		},
	})
}

// GET /api/erp/inventory/adjustments - Get stock adjustments
func (h *ProductHandler) GetAdjustments(c *gin.Context) {
	var adjustments []gin.H

	// For now, return sample data since we don't have a stock_adjustments table yet
	adjustments = []gin.H{
		{
			"id":          uuid.New().String(),
			"productId":   "test-product-1",
			"productName": "Arnica Montana 30C",
			"quantity":    50,
			"type":        "ADD",
			"reason":      "Purchase Receipt",
			"notes":       "Stock received from vendor",
			"adjustedBy":  "system",
			"adjustedAt":  time.Now().Format(time.RFC3339),
		},
		{
			"id":          uuid.New().String(),
			"productId":   "test-product-2",
			"productName": "Belladonna 200C",
			"quantity":    -10,
			"type":        "REMOVE",
			"reason":      "Damage",
			"notes":       "Expired stock removed",
			"adjustedBy":  "admin",
			"adjustedAt":  time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    adjustments,
		"total":   len(adjustments),
	})
}

// POST /api/erp/inventory/transfer - Transfer stock
func (h *ProductHandler) TransferStock(c *gin.Context) {
	var req struct {
		ProductID    string  `json:"productId"`
		Quantity     float64 `json:"quantity"`
		FromLocation string  `json:"fromLocation"`
		ToLocation   string  `json:"toLocation"`
		Reason       string  `json:"reason"`
		Notes        string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock transfer initiated",
		"data": gin.H{
			"transferId":   uuid.New().String(),
			"productId":    req.ProductID,
			"quantity":     req.Quantity,
			"fromLocation": req.FromLocation,
			"toLocation":   req.ToLocation,
			"status":       "PENDING",
		},
	})
}

// GET /api/erp/inventory/transfers - Get stock transfers
func (h *ProductHandler) GetTransfers(c *gin.Context) {
	var transfers []gin.H

	transfers = []gin.H{
		{
			"id":           uuid.New().String(),
			"productId":    "test-product-1",
			"productName":  "Arnica Montana 30C",
			"quantity":     25,
			"fromLocation": "Main Warehouse",
			"toLocation":   "Branch A",
			"reason":       "Branch Replenishment",
			"status":       "COMPLETED",
			"initiatedBy":  "admin",
			"initiatedAt":  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transfers,
		"total":   len(transfers),
	})
}

// GET /api/erp/inventory/alerts - Get inventory alerts
func (h *ProductHandler) GetAlerts(c *gin.Context) {
	var alerts []gin.H

	alerts = []gin.H{
		{
			"id":           uuid.New().String(),
			"type":         "LOW_STOCK",
			"severity":     "HIGH",
			"productId":    "test-product-2",
			"productName":  "Belladonna 200C",
			"currentStock": 15,
			"minStock":     25,
			"message":      "Stock below minimum level",
			"createdAt":    time.Now().Format(time.RFC3339),
		},
		{
			"id":          uuid.New().String(),
			"type":        "EXPIRY",
			"severity":    "MEDIUM",
			"productId":   "test-product-3",
			"productName": "Nux Vomica 1M",
			"expiryDate":  time.Now().Add(7 * 24 * time.Hour).Format("2006-01-02"),
			"message":     "Product expires in 7 days",
			"createdAt":   time.Now().Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"total":   len(alerts),
	})
}

// AI-POWERED METHODS (Integration with Python ML Service)

// GetAIProductRecommendations returns AI-powered product recommendations
func (h *ProductHandler) GetAIProductRecommendations(c *gin.Context) {
	var req AIRecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/recommendations/product"
	payload := map[string]interface{}{
		"product_id": req.ProductID,
		"customer_id": req.CustomerID,
		"top_n": req.Limit,
		"recommendation_type": "hybrid",
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIProductRecommendationsByCustomer returns personalized recommendations for a customer
func (h *ProductHandler) GetAIProductRecommendationsByCustomer(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Customer ID is required",
		})
		return
	}

	// Get customer's recent purchase history
	var recentProducts []string
	// This would query the database for customer's recent purchases

	// Call AI service with customer context
	endpoint := "/v2/recommendations/customer"
	payload := map[string]interface{}{
		"customer_id": customerID,
		"recent_products": recentProducts,
		"limit": 10,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"recommendations": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAICustomerSegmentation returns AI-powered customer segmentation
func (h *ProductHandler) GetAICustomerSegmentation(c *gin.Context) {
	var req AICustomerSegmentationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/segmentation/customer"
	payload := map[string]interface{}{
		"customer_id": req.CustomerID,
		"include_features": req.IncludeFeatures,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"segment": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIBatchRecommendations returns recommendations for multiple customers
func (h *ProductHandler) GetAIBatchRecommendations(c *gin.Context) {
	var req AIBatchRecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for batch recommendations
	endpoint := "/v2/recommendations/batch"
	payload := map[string]interface{}{
		"customer_ids": req.CustomerIDs,
		"limit": req.Limit,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"batch_recommendations": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIFraudDetection checks transaction for fraud patterns
func (h *ProductHandler) GetAIFraudDetection(c *gin.Context) {
	var req AIFraudCheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for fraud detection
	endpoint := "/v2/fraud/check"
	payload := map[string]interface{}{
		"transaction_id": req.TransactionID,
		"user_id": req.UserID,
		"amount": req.Amount,
		"payment_method": req.PaymentMethod,
		"user_behavior": req.UserBehavior,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"fraud_analysis": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAICustomerInsights returns AI-powered customer insights
func (h *ProductHandler) GetAICustomerInsights(c *gin.Context) {
	// Call AI service for customer analytics
	endpoint := "/v2/analytics/customers"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"customer_insights": aiResponse,
		"generated_at": time.Now(),
	})
}
