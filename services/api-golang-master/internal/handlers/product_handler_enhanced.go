package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

// ==================== ENHANCED PRODUCT HANDLER WITH VALIDATION ====================
// This demonstrates best practices for handling requests from Next.js frontend

type ProductHandlerEnhanced struct {
	db *gorm.DB
}

func NewProductHandlerEnhanced(db *gorm.DB) *ProductHandlerEnhanced {
	return &ProductHandlerEnhanced{db: db}
}

// CreateProductValidated creates a product with full validation
// @Summary Create new product with validation
// @Tags Products
// @Accept json
// @Produce json
// @Param product body models.CreateProductRequest true "Product data"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/erp/products [post]
func (h *ProductHandlerEnhanced) CreateProductValidated(c *gin.Context) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Parse and validate request
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// Additional business validation
	if err := h.validateProductUniqueness(ctx, req.SKU, req.Barcode); err != nil {
		RespondConflict(c, err.Error())
		return
	}

	// Create product model
	product := &Product{
		ID:           generateUUID(),
		SKU:          req.SKU,
		Name:         req.Name,
		Description:  req.Description,
		SellingPrice: req.Price,
		MRP:          req.MRP,
		CurrentStock: req.Stock,
		Category:     req.CategoryID, // Store as category string for now
		Brand:        req.BrandID,    // Store as brand string for now
		UOM:          req.UnitID,
		Barcode:      req.Barcode,
		ReorderLevel: req.ReorderLevel,
		IsActive:     getIsActive(req.IsActive),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Save to database
	if err := h.db.WithContext(ctx).Create(product).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Return success response
	RespondCreated(c, product, "Product created successfully")
}

// UpdateProductValidated updates a product with full validation
// @Summary Update product with validation
// @Tags Products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param product body models.UpdateProductRequest true "Product data"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/erp/products/{id} [put]
func (h *ProductHandlerEnhanced) UpdateProductValidated(c *gin.Context) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Get product ID from URL
	productID := c.Param("id")
	if productID == "" {
		RespondBadRequest(c, "Product ID is required")
		return
	}

	// Parse and validate request
	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// Check if product exists
	var product Product
	if err := h.db.WithContext(ctx).Where("id = ?", productID).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			RespondNotFound(c, "Product")
			return
		}
		RespondInternalError(c, err)
		return
	}

	// Update fields if provided
	if req.Name != "" {
		product.Name = req.Name
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.Price > 0 {
		product.SellingPrice = req.Price
	}
	if req.MRP > 0 {
		product.MRP = req.MRP
	}
	if req.Stock >= 0 {
		product.CurrentStock = req.Stock
	}
	if req.CategoryID != "" {
		product.Category = req.CategoryID
	}
	if req.BrandID != "" {
		product.Brand = req.BrandID
	}
	if req.UnitID != "" {
		product.UOM = req.UnitID
	}
	if req.SKU != "" {
		product.SKU = req.SKU
	}
	if req.Barcode != "" {
		product.Barcode = req.Barcode
	}
	if req.ReorderLevel >= 0 {
		product.ReorderLevel = req.ReorderLevel
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	product.UpdatedAt = time.Now()

	// Save updates
	if err := h.db.WithContext(ctx).Save(&product).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Return success response
	RespondSuccessWithMessage(c, product, "Product updated successfully")
}

// GetProductsValidated retrieves products with pagination and filtering
// @Summary Get products with pagination
// @Tags Products
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param search query string false "Search term"
// @Param category query string false "Category filter"
// @Param is_active query bool false "Active status filter"
// @Success 200 {object} SuccessResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/erp/products [get]
func (h *ProductHandlerEnhanced) GetProductsValidated(c *gin.Context) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Parse query parameters with defaults
	page := parseIntQuery(c, "page", 1)
	limit := parseIntQuery(c, "limit", 20)
	search := c.Query("search")
	category := c.Query("category")
	isActiveStr := c.Query("is_active")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Build query
	query := h.db.WithContext(ctx).Model(&Product{})

	// Apply filters
	if search != "" {
		query = query.Where("name ILIKE ? OR sku ILIKE ? OR barcode ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if category != "" {
		query = query.Where("category_id = ?", category)
	}
	if isActiveStr != "" {
		query = query.Where("is_active = ?", isActiveStr == "true")
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Fetch paginated results
	var products []Product
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Calculate total pages
	totalPages := (total + int64(limit) - 1) / int64(limit)

	// Return paginated response
	RespondSuccessWithMeta(c, products, &MetaData{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	})
}

// DeleteProductValidated soft deletes a product
// @Summary Delete product
// @Tags Products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} SuccessResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/erp/products/{id} [delete]
func (h *ProductHandlerEnhanced) DeleteProductValidated(c *gin.Context) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Get product ID from URL
	productID := c.Param("id")
	if productID == "" {
		RespondBadRequest(c, "Product ID is required")
		return
	}

	// Check if product exists
	var product Product
	if err := h.db.WithContext(ctx).Where("id = ?", productID).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			RespondNotFound(c, "Product")
			return
		}
		RespondInternalError(c, err)
		return
	}

	// Soft delete (set is_active to false)
	if err := h.db.WithContext(ctx).Model(&product).Update("is_active", false).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Return success response
	RespondSuccessWithMessage(c, nil, "Product deleted successfully")
}

// ==================== HELPER FUNCTIONS ====================

func (h *ProductHandlerEnhanced) validateProductUniqueness(ctx context.Context, sku, barcode string) error {
	var count int64

	// Check SKU uniqueness
	if err := h.db.WithContext(ctx).Model(&Product{}).Where("sku = ?", sku).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return gorm.ErrDuplicatedKey
	}

	// Check barcode uniqueness if provided
	if barcode != "" {
		if err := h.db.WithContext(ctx).Model(&Product{}).Where("barcode = ?", barcode).Count(&count).Error; err != nil {
			return err
	}
		if count > 0 {
			return gorm.ErrDuplicatedKey
		}
	}

	return nil
}

func parseIntQuery(c *gin.Context, key string, defaultValue int) int {
	value := c.Query(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	return intValue
}

func generateUUID() string {
	return uuid.New().String()
}

func getIsActive(isActive *bool) bool {
	if isActive == nil {
		return true
	}
	return *isActive
}
