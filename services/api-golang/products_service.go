// Products Service - Complete CRUD operations for Products module
// This service handles all product-related operations including categories, brands, and units

package main

import (
	"context"
	"fmt"
	"time"
)

// ==================== PRODUCTS SERVICE ====================

type ProductService struct {
	db    *Database
	cache *CacheService
}

func NewProductService(db *Database, cache *CacheService) *ProductService {
	return &ProductService{db: db, cache: cache}
}

// ==================== PRODUCT CRUD OPERATIONS ====================

func (s *ProductService) GetProductByID(ctx context.Context, id string) (*Product, error) {
	cacheKey := fmt.Sprintf("product:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if product, ok := cached.(*Product); ok {
			return product, nil
		}
	}

	var product Product
	if err := s.db.DB.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Preload("PurchaseUnit").
		Preload("SaleUnit").
		Where("id = ? AND is_active = ?", id, true).
		First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &product, 5*time.Minute)
	return &product, nil
}

func (s *ProductService) GetProducts(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Product, int64, error) {
	var products []Product
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Preload("PurchaseUnit").
		Preload("SaleUnit").
		Model(&Product{}).
		Where("is_active = ?", true)

	// Apply filters
	if categoryID, ok := filters["category_id"].(string); ok && categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if brandID, ok := filters["brand_id"].(string); ok && brandID != "" {
		query = query.Where("brand_id = ?", brandID)
	}
	if potency, ok := filters["potency"].(string); ok && potency != "" {
		query = query.Where("potency = ?", potency)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ? OR product_code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if minPrice, ok := filters["min_price"].(float64); ok {
		query = query.Where("retail_price >= ?", minPrice)
	}
	if maxPrice, ok := filters["max_price"].(float64); ok {
		query = query.Where("retail_price <= ?", maxPrice)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&products).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get products: %w", err)
	}

	return products, total, nil
}

func (s *ProductService) CreateProduct(ctx context.Context, product *Product) (*Product, error) {
	if err := s.db.DB.WithContext(ctx).Create(product).Error; err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	// Clear related caches
	cacheKey := fmt.Sprintf("products:*")
	s.cache.Delete(ctx, cacheKey)

	return product, nil
}

func (s *ProductService) UpdateProduct(ctx context.Context, id string, updates map[string]interface{}) (*Product, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Product{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	// Clear caches
	cacheKey := fmt.Sprintf("product:%s", id)
	s.cache.Delete(ctx, cacheKey)
	cacheKey = fmt.Sprintf("products:*")
	s.cache.Delete(ctx, cacheKey)

	return s.GetProductByID(ctx, id)
}

func (s *ProductService) DeleteProduct(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Product{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	// Clear caches
	cacheKey := fmt.Sprintf("product:%s", id)
	s.cache.Delete(ctx, cacheKey)
	cacheKey = fmt.Sprintf("products:*")
	s.cache.Delete(ctx, cacheKey)

	return nil
}

func (s *ProductService) GetLowStockProducts(ctx context.Context, limit int) ([]Product, error) {
	var products []Product

	if err := s.db.DB.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Joins("JOIN inventory_items ON products.id = inventory_items.product_id").
		Where("products.is_active = ? AND inventory_items.available_qty <= products.min_stock_level", true).
		Group("products.id").
		Order("inventory_items.available_qty ASC").
		Limit(limit).
		Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to get low stock products: %w", err)
	}

	return products, nil
}

// ==================== CATEGORY CRUD OPERATIONS ====================

func (s *ProductService) GetCategories(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Category, int64, error) {
	var categories []Category
	var total int64

	query := s.db.DB.WithContext(ctx).Model(&Category{}).Where("is_active = ?", true)

	// Apply filters
	if parentID, ok := filters["parent_id"].(string); ok && parentID != "" {
		query = query.Where("parent_id = ?", parentID)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get categories: %w", err)
	}

	return categories, total, nil
}

func (s *ProductService) CreateCategory(ctx context.Context, category *Category) (*Category, error) {
	if err := s.db.DB.WithContext(ctx).Create(category).Error; err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	// Clear cache
	cacheKey := "categories:*"
	s.cache.Delete(ctx, cacheKey)

	return category, nil
}

func (s *ProductService) UpdateCategory(ctx context.Context, id string, updates map[string]interface{}) (*Category, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Category{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	// Clear cache
	cacheKey := "categories:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetCategoryByID(ctx, id)
}

func (s *ProductService) GetCategoryByID(ctx context.Context, id string) (*Category, error) {
	cacheKey := fmt.Sprintf("category:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if category, ok := cached.(*Category); ok {
			return category, nil
		}
	}

	var category Category
	if err := s.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&category).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &category, 5*time.Minute)
	return &category, nil
}

func (s *ProductService) DeleteCategory(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Category{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	// Clear cache
	cacheKey := "categories:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

// ==================== BRAND CRUD OPERATIONS ====================

func (s *ProductService) GetBrands(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Brand, int64, error) {
	var brands []Brand
	var total int64

	query := s.db.DB.WithContext(ctx).Model(&Brand{}).Where("is_active = ?", true)

	// Apply filters
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count brands: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("name ASC").
		Find(&brands).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get brands: %w", err)
	}

	return brands, total, nil
}

func (s *ProductService) CreateBrand(ctx context.Context, brand *Brand) (*Brand, error) {
	if err := s.db.DB.WithContext(ctx).Create(brand).Error; err != nil {
		return nil, fmt.Errorf("failed to create brand: %w", err)
	}

	// Clear cache
	cacheKey := "brands:*"
	s.cache.Delete(ctx, cacheKey)

	return brand, nil
}

func (s *ProductService) UpdateBrand(ctx context.Context, id string, updates map[string]interface{}) (*Brand, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Brand{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update brand: %w", err)
	}

	// Clear cache
	cacheKey := "brands:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetBrandByID(ctx, id)
}

func (s *ProductService) GetBrandByID(ctx context.Context, id string) (*Brand, error) {
	cacheKey := fmt.Sprintf("brand:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if brand, ok := cached.(*Brand); ok {
			return brand, nil
		}
	}

	var brand Brand
	if err := s.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&brand).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get brand: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &brand, 5*time.Minute)
	return &brand, nil
}

func (s *ProductService) DeleteBrand(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Brand{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete brand: %w", err)
	}

	// Clear cache
	cacheKey := "brands:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

// ==================== UNIT CRUD OPERATIONS ====================

func (s *ProductService) GetUnits(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Unit, int64, error) {
	var units []Unit
	var total int64

	query := s.db.DB.WithContext(ctx).Model(&Unit{}).Where("is_active = ?", true)

	// Apply filters
	if unitType, ok := filters["unit_type"].(string); ok && unitType != "" {
		query = query.Where("unit_type = ?", unitType)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count units: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("name ASC").
		Find(&units).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get units: %w", err)
	}

	return units, total, nil
}

func (s *ProductService) CreateUnit(ctx context.Context, unit *Unit) (*Unit, error) {
	if err := s.db.DB.WithContext(ctx).Create(unit).Error; err != nil {
		return nil, fmt.Errorf("failed to create unit: %w", err)
	}

	// Clear cache
	cacheKey := "units:*"
	s.cache.Delete(ctx, cacheKey)

	return unit, nil
}

func (s *ProductService) UpdateUnit(ctx context.Context, id string, updates map[string]interface{}) (*Unit, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Unit{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update unit: %w", err)
	}

	// Clear cache
	cacheKey := "units:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetUnitByID(ctx, id)
}

func (s *ProductService) GetUnitByID(ctx context.Context, id string) (*Unit, error) {
	cacheKey := fmt.Sprintf("unit:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if unit, ok := cached.(*Unit); ok {
			return unit, nil
		}
	}

	var unit Unit
	if err := s.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&unit).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get unit: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &unit, 5*time.Minute)
	return &unit, nil
}

func (s *ProductService) DeleteUnit(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Unit{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete unit: %w", err)
	}

	// Clear cache
	cacheKey := "units:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

// ==================== PRODUCT HANDLERS ====================

type ProductHandler struct {
	productService *ProductService
	db             *Database
	cache          *CacheService
	config         Config
}

func NewProductHandler(productService *ProductService, db *Database, cache *CacheService, config Config) *ProductHandler {
	return &ProductHandler{
		productService: productService,
		db:             db,
		cache:          cache,
		config:         config,
	}
}

// GetProducts handles GET /api/products
func (h *ProductHandler) GetProducts(c *gin.Context) {
	ctx := c.Request.Context()

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	categoryID := c.Query("category_id")
	brandID := c.Query("brand_id")
	potency := c.Query("potency")
	search := c.Query("search")
	minPriceStr := c.Query("min_price")
	maxPriceStr := c.Query("max_price")

	filters := make(map[string]interface{})
	if categoryID != "" {
		filters["category_id"] = categoryID
	}
	if brandID != "" {
		filters["brand_id"] = brandID
	}
	if potency != "" {
		filters["potency"] = potency
	}
	if search != "" {
		filters["search"] = search
	}
	if minPriceStr != "" {
		if minPrice, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			filters["min_price"] = minPrice
		}
	}
	if maxPriceStr != "" {
		if maxPrice, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			filters["max_price"] = maxPrice
		}
	}

	products, total, err := h.productService.GetProducts(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(products),
		},
	})
}

// GetProduct handles GET /api/products/:id
func (h *ProductHandler) GetProduct(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	product, err := h.productService.GetProductByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if product == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// CreateProduct handles POST /api/products
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	ctx := c.Request.Context()
	var product Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdProduct, err := h.productService.CreateProduct(ctx, &product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdProduct)
}

// UpdateProduct handles PUT /api/products/:id
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedProduct, err := h.productService.UpdateProduct(ctx, id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if updatedProduct == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, updatedProduct)
}

// DeleteProduct handles DELETE /api/products/:id
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	if err := h.productService.DeleteProduct(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetLowStockProducts handles GET /api/products/low-stock
func (h *ProductHandler) GetLowStockProducts(c *gin.Context) {
	ctx := c.Request.Context()
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	products, err := h.productService.GetLowStockProducts(ctx, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

// ==================== CATEGORY HANDLERS ====================

func (h *ProductHandler) GetCategories(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	parentID := c.Query("parent_id")
	search := c.Query("search")

	filters := make(map[string]interface{})
	if parentID != "" {
		filters["parent_id"] = parentID
	}
	if search != "" {
		filters["search"] = search
	}

	categories, total, err := h.productService.GetCategories(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(categories),
		},
	})
}

func (h *ProductHandler) CreateCategory(c *gin.Context) {
	ctx := c.Request.Context()
	var category Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdCategory, err := h.productService.CreateCategory(ctx, &category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdCategory)
}

// ==================== BRAND HANDLERS ====================

func (h *ProductHandler) GetBrands(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	search := c.Query("search")

	filters := make(map[string]interface{})
	if search != "" {
		filters["search"] = search
	}

	brands, total, err := h.productService.GetBrands(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"brands": brands,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(brands),
		},
	})
}

func (h *ProductHandler) CreateBrand(c *gin.Context) {
	ctx := c.Request.Context()
	var brand Brand

	if err := c.ShouldBindJSON(&brand); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdBrand, err := h.productService.CreateBrand(ctx, &brand)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdBrand)
}

// ==================== UNIT HANDLERS ====================

func (h *ProductHandler) GetUnits(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	unitType := c.Query("unit_type")
	search := c.Query("search")

	filters := make(map[string]interface{})
	if unitType != "" {
		filters["unit_type"] = unitType
	}
	if search != "" {
		filters["search"] = search
	}

	units, total, err := h.productService.GetUnits(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"units": units,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(units),
		},
	})
}

func (h *ProductHandler) CreateUnit(c *gin.Context) {
	ctx := c.Request.Context()
	var unit Unit

	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdUnit, err := h.productService.CreateUnit(ctx, &unit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdUnit)
}
