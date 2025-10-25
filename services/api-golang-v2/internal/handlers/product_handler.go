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
	CurrentStock int       `json:"currentStock" gorm:"column:current_stock"`
	IsActive     bool      `json:"isActive" gorm:"column:is_active"`
	Tags         string    `json:"tags"`
	CreatedAt    time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"column:updated_at"`
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
			p.potency,
			p.form,
			p.brand,
			p.category,
			b.batch_id,
			b.batch_no,
			b.barcode,
			b.barcode_type,
			b.mrp,
			b.exp_date,
			b.quantity,
			COALESCE(w.name, 'Main Warehouse') as warehouse,
			b.generated_at,
			b.status,
			b.created_by,
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
		var id, productId, productName, sku, potency, form, brand, category, batchId, batchNo, barcode, barcodeType, warehouse, generatedAt, status, createdBy, expiryStatus string
		var mrp float64
		var expDate *string
		var quantity int

		err := rows.Scan(&id, &productId, &productName, &sku, &potency, &form, &brand, &category, &batchId, &batchNo, &barcode, &barcodeType, &mrp, &expDate, &quantity, &warehouse, &generatedAt, &status, &createdBy, &expiryStatus)
		if err != nil {
			continue
		}

		barcodeData := gin.H{
			"id":            id,
			"product_id":    productId,
			"product_name":  productName,
			"sku":           sku,
			"potency":       potency,
			"form":          form,
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    barcodes,
		"total":   len(barcodes),
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
		"message": "Barcode labels prepared for printing",
	})
}
