package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"time"
)

type ProductHandler struct {
	db interface{}
}

func NewProductHandler(db interface{}) *ProductHandler {
	return &ProductHandler{db: db}
}

// GET /api/erp/products - List all products
func (h *ProductHandler) GetProducts(c *gin.Context) {
	limit := c.DefaultQuery("limit", "50")
	page := c.DefaultQuery("page", "1")
	search := c.Query("search")
	categoryId := c.Query("categoryId")
	brandId := c.Query("brandId")

	// Mock product data - replace with actual database query
	products := []gin.H{
		{
			"id":             uuid.New().String(),
			"name":           "Arnica Montana 30C",
			"code":           "ARM-30C-10ML",
			"barcode":        "8901234567890",
			"categoryId":     "cat-001",
			"categoryName":   "Dilutions",
			"brandId":        "brand-001",
			"brandName":      "SBL",
			"potencyId":      "pot-001",
			"potencyName":    "30C",
			"formId":         "form-001",
			"formName":       "Dilution",
			"packSize":       "10ml",
			"unit":           "bottle",
			"hsnCode":        "30049099",
			"gstRate":        12.0,
			"mrp":            75.0,
			"retailPrice":    70.0,
			"wholesalePrice": 55.0,
			"dealerPrice":    50.0,
			"purchasePrice":  45.0,
			"sellingPrice":   70.0,
			"currentStock":   150,
			"minStock":       20,
			"maxStock":       500,
			"reorderLevel":   30,
			"description":    "Arnica Montana 30C - For bruises, trauma, and muscle soreness",
			"isActive":       true,
			"createdAt":      time.Now().Add(-30 * 24 * time.Hour).Format(time.RFC3339),
			"updatedAt":      time.Now().Format(time.RFC3339),
		},
		{
			"id":             uuid.New().String(),
			"name":           "Belladonna 200C",
			"code":           "BEL-200C-10ML",
			"barcode":        "8901234567891",
			"categoryId":     "cat-001",
			"categoryName":   "Dilutions",
			"brandId":        "brand-002",
			"brandName":      "Dr. Reckeweg",
			"potencyId":      "pot-002",
			"potencyName":    "200C",
			"formId":         "form-001",
			"formName":       "Dilution",
			"packSize":       "10ml",
			"unit":           "bottle",
			"hsnCode":        "30049099",
			"gstRate":        12.0,
			"mrp":            85.0,
			"retailPrice":    80.0,
			"wholesalePrice": 65.0,
			"dealerPrice":    60.0,
			"purchasePrice":  55.0,
			"sellingPrice":   80.0,
			"currentStock":   200,
			"minStock":       25,
			"maxStock":       600,
			"reorderLevel":   40,
			"description":    "Belladonna 200C - For fever, inflammation, and headaches",
			"isActive":       true,
			"createdAt":      time.Now().Add(-25 * 24 * time.Hour).Format(time.RFC3339),
			"updatedAt":      time.Now().Format(time.RFC3339),
		},
		{
			"id":             uuid.New().String(),
			"name":           "Calendula Mother Tincture",
			"code":           "CAL-MT-30ML",
			"barcode":        "8901234567892",
			"categoryId":     "cat-002",
			"categoryName":   "Mother Tinctures",
			"brandId":        "brand-001",
			"brandName":      "SBL",
			"formId":         "form-002",
			"formName":       "Mother Tincture",
			"packSize":       "30ml",
			"unit":           "bottle",
			"hsnCode":        "30049099",
			"gstRate":        12.0,
			"mrp":            120.0,
			"retailPrice":    110.0,
			"wholesalePrice": 90.0,
			"dealerPrice":    85.0,
			"purchasePrice":  75.0,
			"sellingPrice":   110.0,
			"currentStock":   80,
			"minStock":       15,
			"maxStock":       300,
			"reorderLevel":   25,
			"description":    "Calendula Mother Tincture - For wounds and skin conditions",
			"isActive":       true,
			"createdAt":      time.Now().Add(-20 * 24 * time.Hour).Format(time.RFC3339),
			"updatedAt":      time.Now().Format(time.RFC3339),
		},
	}

	_ = search
	_ = categoryId
	_ = brandId
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      len(products),
			"totalPages": 1,
		},
	})
}

// GET /api/erp/products/:id - Get single product
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	
	product := gin.H{
		"id":             id,
		"name":           "Arnica Montana 30C",
		"code":           "ARM-30C-10ML",
		"barcode":        "8901234567890",
		"categoryId":     "cat-001",
		"categoryName":   "Dilutions",
		"brandId":        "brand-001",
		"brandName":      "SBL",
		"potencyId":      "pot-001",
		"potencyName":    "30C",
		"formId":         "form-001",
		"formName":       "Dilution",
		"packSize":       "10ml",
		"unit":           "bottle",
		"hsnCode":        "30049099",
		"gstRate":        12.0,
		"mrp":            75.0,
		"retailPrice":    70.0,
		"wholesalePrice": 55.0,
		"dealerPrice":    50.0,
		"purchasePrice":  45.0,
		"sellingPrice":   70.0,
		"currentStock":   150,
		"minStock":       20,
		"maxStock":       500,
		"reorderLevel":   30,
		"description":    "Arnica Montana 30C - For bruises, trauma, and muscle soreness",
		"isActive":       true,
		"createdAt":      time.Now().Add(-30 * 24 * time.Hour).Format(time.RFC3339),
		"updatedAt":      time.Now().Format(time.RFC3339),
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

// GET /api/erp/categories - List categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	categories := []gin.H{
		{"id": "cat-001", "name": "Dilutions", "code": "DIL", "isActive": true},
		{"id": "cat-002", "name": "Mother Tinctures", "code": "MT", "isActive": true},
		{"id": "cat-003", "name": "Biochemic", "code": "BIOC", "isActive": true},
		{"id": "cat-004", "name": "Ointments", "code": "OINT", "isActive": true},
		{"id": "cat-005", "name": "Drops", "code": "DROP", "isActive": true},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    categories,
	})
}

// GET /api/erp/brands - List brands
func (h *ProductHandler) GetBrands(c *gin.Context) {
	brands := []gin.H{
		{"id": "brand-001", "name": "SBL", "code": "SBL", "isActive": true},
		{"id": "brand-002", "name": "Dr. Reckeweg", "code": "RECK", "isActive": true},
		{"id": "brand-003", "name": "Allen", "code": "ALLEN", "isActive": true},
		{"id": "brand-004", "name": "Schwabe", "code": "SCHW", "isActive": true},
		{"id": "brand-005", "name": "Bakson", "code": "BAKS", "isActive": true},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    brands,
	})
}

// GET /api/erp/potencies - List potencies
func (h *ProductHandler) GetPotencies(c *gin.Context) {
	potencies := []gin.H{
		{"id": "pot-001", "name": "30C", "code": "30C", "isActive": true},
		{"id": "pot-002", "name": "200C", "code": "200C", "isActive": true},
		{"id": "pot-003", "name": "1M", "code": "1M", "isActive": true},
		{"id": "pot-004", "name": "Q", "code": "Q", "isActive": true},
		{"id": "pot-005", "name": "6X", "code": "6X", "isActive": true},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    potencies,
	})
}

// GET /api/erp/forms - List forms
func (h *ProductHandler) GetForms(c *gin.Context) {
	forms := []gin.H{
		{"id": "form-001", "name": "Dilution", "code": "DIL", "isActive": true},
		{"id": "form-002", "name": "Mother Tincture", "code": "MT", "isActive": true},
		{"id": "form-003", "name": "Tablet", "code": "TAB", "isActive": true},
		{"id": "form-004", "name": "Ointment", "code": "OINT", "isActive": true},
		{"id": "form-005", "name": "Drops", "code": "DROP", "isActive": true},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    forms,
	})
}
