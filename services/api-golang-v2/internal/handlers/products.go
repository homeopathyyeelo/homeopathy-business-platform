package handlers

import (
	"net/http"
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"github.com/google/uuid"
)

// ProductHandler handles all product-related operations
type ProductHandler struct {
	productService *services.ProductService
	brandService   *services.BrandService
	categoryService *services.CategoryService
	inventoryService *services.InventoryService
}

// NewProductHandler creates a new product handler
func NewProductHandler() *ProductHandler {
	return &ProductHandler{
		productService: services.NewProductService(),
		brandService:   services.NewBrandService(),
		categoryService: services.NewCategoryService(),
		inventoryService: services.NewInventoryService(),
	}
}

// ListProducts returns paginated list of products with search and filters
func (h *ProductHandler) ListProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	brandID := c.Query("brand_id")
	categoryID := c.Query("category_id")
	activeOnly, _ := strconv.ParseBool(c.DefaultQuery("active_only", "true"))

	products, total, err := h.productService.ListProducts(page, limit, search, brandID, categoryID, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetProduct returns a single product by ID with full details
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required"})
		return
	}

	product, err := h.productService.GetProductByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// CreateProduct creates a new product with validation
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if req.Name == "" || req.BrandID == "" || req.CategoryID == "" || req.UOMID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, Brand, Category, and UOM are required"})
		return
	}

	// Check if brand and category exist
	if _, err := h.brandService.GetBrandByID(req.BrandID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid brand ID"})
		return
	}
	if _, err := h.categoryService.GetCategoryByID(req.CategoryID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	product := &models.Product{
		ID:             uuid.New().String(),
		Name:           req.Name,
		Description:    req.Description,
		Barcode:        req.Barcode,
		SKU:            req.SKU,
		BrandID:        req.BrandID,
		CategoryID:     req.CategoryID,
		PotencyID:      req.PotencyID,
		HSNID:          req.HSNID,
		UOMID:          req.UOMID,
		PurchasePrice:  req.PurchasePrice,
		SellingPrice:   req.SellingPrice,
		MRP:            req.MRP,
		Stock:          req.Stock,
		MinStock:       req.MinStock,
		MaxStock:       req.MaxStock,
		Image:          req.Image,
		IsActive:       true,
		IsPrescription: req.IsPrescription,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.productService.CreateProduct(product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

// UpdateProduct updates an existing product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if product exists
	product, err := h.productService.GetProductByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Barcode != "" {
		updates["barcode"] = req.Barcode
	}
	if req.SKU != "" {
		updates["sku"] = req.SKU
	}
	if req.BrandID != "" {
		updates["brand_id"] = req.BrandID
	}
	if req.CategoryID != "" {
		updates["category_id"] = req.CategoryID
	}
	if req.PotencyID != nil {
		updates["potency_id"] = req.PotencyID
	}
	if req.HSNID != nil {
		updates["hsn_id"] = req.HSNID
	}
	if req.UOMID != "" {
		updates["uom_id"] = req.UOMID
	}
	if req.PurchasePrice != nil {
		updates["purchase_price"] = *req.PurchasePrice
	}
	if req.SellingPrice != nil {
		updates["selling_price"] = *req.SellingPrice
	}
	if req.MRP != nil {
		updates["mrp"] = *req.MRP
	}
	if req.Stock != nil {
		updates["stock"] = *req.Stock
	}
	if req.MinStock != nil {
		updates["min_stock"] = *req.MinStock
	}
	if req.MaxStock != nil {
		updates["max_stock"] = *req.MaxStock
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.IsPrescription != nil {
		updates["is_prescription"] = *req.IsPrescription
	}
	updates["updated_at"] = time.Now()

	if err := h.productService.UpdateProduct(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product updated successfully"})
}

// DeleteProduct soft deletes a product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required"})
		return
	}

	if err := h.productService.DeleteProduct(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetProductStock returns current stock for a product
func (h *ProductHandler) GetProductStock(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required"})
		return
	}

	stock, err := h.inventoryService.GetProductStock(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stock"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_id": id,
		"stock":      stock,
	})
}

// UpdateProductStock adjusts product stock
func (h *ProductHandler) UpdateProductStock(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required"})
		return
	}

	var req UpdateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.inventoryService.AdjustStock(id, req.Quantity, req.Type, req.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock updated successfully"})
}

// GetLowStockProducts returns products with low stock
func (h *ProductHandler) GetLowStockProducts(c *gin.Context) {
	products, err := h.productService.GetLowStockProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get low stock products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

// GetExpiringProducts returns products expiring soon
func (h *ProductHandler) GetExpiringProducts(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	products, err := h.productService.GetExpiringProducts(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expiring products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

// Request/Response structs
type CreateProductRequest struct {
	Name           string   `json:"name" binding:"required"`
	Description    string   `json:"description"`
	Barcode        string   `json:"barcode"`
	SKU            string   `json:"sku"`
	BrandID        string   `json:"brandId" binding:"required"`
	CategoryID     string   `json:"categoryId" binding:"required"`
	PotencyID      *string  `json:"potencyId"`
	HSNID          *string  `json:"hsnId"`
	UOMID          string   `json:"uomId" binding:"required"`
	PurchasePrice  float64  `json:"purchasePrice"`
	SellingPrice   float64  `json:"sellingPrice"`
	MRP            float64  `json:"mrp"`
	Stock          int      `json:"stock"`
	MinStock       int      `json:"minStock"`
	MaxStock       int      `json:"maxStock"`
	Image          string   `json:"image"`
	IsPrescription *bool    `json:"isPrescription"`
}

type UpdateProductRequest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Barcode        string   `json:"barcode"`
	SKU            string   `json:"sku"`
	BrandID        string   `json:"brandId"`
	CategoryID     string   `json:"categoryId"`
	PotencyID      *string  `json:"potencyId"`
	HSNID          *string  `json:"hsnId"`
	UOMID          string   `json:"uomId"`
	PurchasePrice  *float64 `json:"purchasePrice"`
	SellingPrice   *float64 `json:"sellingPrice"`
	MRP            *float64 `json:"mrp"`
	Stock          *int     `json:"stock"`
	MinStock       *int     `json:"minStock"`
	MaxStock       *int     `json:"maxStock"`
	Image          string   `json:"image"`
	IsPrescription *bool    `json:"isPrescription"`
}

type UpdateStockRequest struct {
	Quantity int    `json:"quantity" binding:"required"`
	Type     string `json:"type" binding:"required"` // IN, OUT, ADJUSTMENT
	Notes    string `json:"notes"`
}
