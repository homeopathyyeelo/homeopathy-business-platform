// Inventory Service - Complete CRUD operations for Inventory Management
// This service handles warehouses, inventory items, and stock adjustments

package main

import (
	"context"
	"fmt"
	"time"
)

// ==================== INVENTORY SERVICE ====================

type InventoryService struct {
	db    *Database
	cache *CacheService
}

func NewInventoryService(db *Database, cache *CacheService) *InventoryService {
	return &InventoryService{db: db, cache: cache}
}

// ==================== WAREHOUSE CRUD OPERATIONS ====================

func (s *InventoryService) GetWarehouseByID(ctx context.Context, id string) (*Warehouse, error) {
	cacheKey := fmt.Sprintf("warehouse:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if warehouse, ok := cached.(*Warehouse); ok {
			return warehouse, nil
		}
	}

	var warehouse Warehouse
	if err := s.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&warehouse).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get warehouse: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &warehouse, 5*time.Minute)
	return &warehouse, nil
}

func (s *InventoryService) GetWarehouses(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Warehouse, int64, error) {
	var warehouses []Warehouse
	var total int64

	query := s.db.DB.WithContext(ctx).Model(&Warehouse{}).Where("is_active = ?", true)

	// Apply filters
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if warehouseType, ok := filters["warehouse_type"].(string); ok && warehouseType != "" {
		query = query.Where("warehouse_type = ?", warehouseType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count warehouses: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("name ASC").
		Find(&warehouses).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get warehouses: %w", err)
	}

	return warehouses, total, nil
}

func (s *InventoryService) CreateWarehouse(ctx context.Context, warehouse *Warehouse) (*Warehouse, error) {
	if err := s.db.DB.WithContext(ctx).Create(warehouse).Error; err != nil {
		return nil, fmt.Errorf("failed to create warehouse: %w", err)
	}

	// Clear cache
	cacheKey := "warehouses:*"
	s.cache.Delete(ctx, cacheKey)

	return warehouse, nil
}

func (s *InventoryService) UpdateWarehouse(ctx context.Context, id string, updates map[string]interface{}) (*Warehouse, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Warehouse{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update warehouse: %w", err)
	}

	// Clear cache
	cacheKey := "warehouses:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetWarehouseByID(ctx, id)
}

func (s *InventoryService) DeleteWarehouse(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Warehouse{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete warehouse: %w", err)
	}

	// Clear cache
	cacheKey := "warehouses:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

// ==================== INVENTORY ITEM CRUD OPERATIONS ====================

func (s *InventoryService) GetInventoryItemByID(ctx context.Context, id string) (*InventoryItem, error) {
	cacheKey := fmt.Sprintf("inventory_item:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if item, ok := cached.(*InventoryItem); ok {
			return item, nil
		}
	}

	var item InventoryItem
	if err := s.db.DB.WithContext(ctx).
		Preload("Product").
		Preload("Warehouse").
		Where("id = ? AND is_active = ?", id, true).
		First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get inventory item: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &item, 5*time.Minute)
	return &item, nil
}

func (s *InventoryService) GetInventoryItems(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]InventoryItem, int64, error) {
	var items []InventoryItem
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Product").
		Preload("Warehouse").
		Model(&InventoryItem{}).
		Where("is_active = ?", true)

	// Apply filters
	if productID, ok := filters["product_id"].(string); ok && productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if warehouseID, ok := filters["warehouse_id"].(string); ok && warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}
	if batchNumber, ok := filters["batch_number"].(string); ok && batchNumber != "" {
		query = query.Where("batch_number = ?", batchNumber)
	}
	if lowStock, ok := filters["low_stock"].(bool); ok && lowStock {
		query = query.Where("available_qty <= ?", s.db.DB.Model(&Product{}).Select("min_stock_level").Where("id = inventory_items.product_id"))
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count inventory items: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&items).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get inventory items: %w", err)
	}

	return items, total, nil
}

func (s *InventoryService) CreateInventoryItem(ctx context.Context, item *InventoryItem) (*InventoryItem, error) {
	if err := s.db.DB.WithContext(ctx).Create(item).Error; err != nil {
		return nil, fmt.Errorf("failed to create inventory item: %w", err)
	}

	// Update product available quantity
	if err := s.updateProductAvailableQty(ctx, item.ProductID); err != nil {
		return nil, err
	}

	// Clear cache
	cacheKey := "inventory:*"
	s.cache.Delete(ctx, cacheKey)

	return item, nil
}

func (s *InventoryService) UpdateInventoryItem(ctx context.Context, id string, updates map[string]interface{}) (*InventoryItem, error) {
	if err := s.db.DB.WithContext(ctx).Model(&InventoryItem{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update inventory item: %w", err)
	}

	// Get the updated item to find product ID
	var item InventoryItem
	if err := s.db.DB.WithContext(ctx).Where("id = ?", id).First(&item).Error; err != nil {
		return nil, fmt.Errorf("failed to get updated inventory item: %w", err)
	}

	// Update product available quantity
	if err := s.updateProductAvailableQty(ctx, item.ProductID); err != nil {
		return nil, err
	}

	// Clear cache
	cacheKey := "inventory:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetInventoryItemByID(ctx, id)
}

func (s *InventoryService) DeleteInventoryItem(ctx context.Context, id string) error {
	// Get the item to find product ID before deletion
	var item InventoryItem
	if err := s.db.DB.WithContext(ctx).Where("id = ?", id).First(&item).Error; err != nil {
		return fmt.Errorf("failed to get inventory item for deletion: %w", err)
	}

	if err := s.db.DB.WithContext(ctx).Model(&InventoryItem{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete inventory item: %w", err)
	}

	// Update product available quantity
	if err := s.updateProductAvailableQty(ctx, item.ProductID); err != nil {
		return nil, err
	}

	// Clear cache
	cacheKey := "inventory:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

func (s *InventoryService) updateProductAvailableQty(ctx context.Context, productID string) error {
	var totalAvailable int64
	if err := s.db.DB.WithContext(ctx).Model(&InventoryItem{}).
		Where("product_id = ? AND is_active = ?", productID, true).
		Select("COALESCE(SUM(available_qty), 0)").
		Scan(&totalAvailable).Error; err != nil {
		return fmt.Errorf("failed to calculate available quantity: %w", err)
	}

	if err := s.db.DB.WithContext(ctx).Model(&Product{}).
		Where("id = ?", productID).
		Update("available_qty", totalAvailable).Error; err != nil {
		return fmt.Errorf("failed to update product available quantity: %w", err)
	}

	return nil
}

// ==================== STOCK ADJUSTMENT OPERATIONS ====================

func (s *InventoryService) CreateStockAdjustment(ctx context.Context, adjustment *StockAdjustment) (*StockAdjustment, error) {
	// Get current inventory item
	var item InventoryItem
	if err := s.db.DB.WithContext(ctx).Where("id = ?", adjustment.InventoryItemID).First(&item).Error; err != nil {
		return nil, fmt.Errorf("failed to get inventory item for adjustment: %w", err)
	}

	// Calculate new quantities
	var newQuantity, newAvailableQty int
	switch adjustment.AdjustmentType {
	case "addition":
		newQuantity = item.Quantity + adjustment.Quantity
		newAvailableQty = item.AvailableQty + adjustment.Quantity
	case "subtraction":
		newQuantity = item.Quantity - adjustment.Quantity
		newAvailableQty = item.AvailableQty - adjustment.Quantity
		if newQuantity < 0 || newAvailableQty < 0 {
			return nil, fmt.Errorf("insufficient stock for adjustment")
		}
	case "damage", "expiry":
		newQuantity = item.Quantity
		newAvailableQty = item.AvailableQty - adjustment.Quantity
		if newAvailableQty < 0 {
			return nil, fmt.Errorf("insufficient available stock for adjustment")
		}
	case "return":
		newQuantity = item.Quantity + adjustment.Quantity
		newAvailableQty = item.AvailableQty + adjustment.Quantity
	default:
		return nil, fmt.Errorf("invalid adjustment type: %s", adjustment.AdjustmentType)
	}

	// Update inventory item
	updates := map[string]interface{}{
		"quantity":      newQuantity,
		"available_qty": newAvailableQty,
	}
	if err := s.db.DB.WithContext(ctx).Model(&InventoryItem{}).
		Where("id = ?", adjustment.InventoryItemID).
		Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update inventory item: %w", err)
	}

	// Create adjustment record
	if err := s.db.DB.WithContext(ctx).Create(adjustment).Error; err != nil {
		return nil, fmt.Errorf("failed to create stock adjustment: %w", err)
	}

	// Update product available quantity
	if err := s.updateProductAvailableQty(ctx, item.ProductID); err != nil {
		return nil, err
	}

	// Clear cache
	cacheKey := "inventory:*"
	s.cache.Delete(ctx, cacheKey)

	return adjustment, nil
}

func (s *InventoryService) GetStockAdjustments(ctx context.Context, inventoryItemID string, limit, offset int) ([]StockAdjustment, int64, error) {
	var adjustments []StockAdjustment
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("InventoryItem").
		Model(&StockAdjustment{}).
		Where("inventory_item_id = ?", inventoryItemID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count stock adjustments: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&adjustments).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get stock adjustments: %w", err)
	}

	return adjustments, total, nil
}

// ==================== INVENTORY REPORTS ====================

func (s *InventoryService) GetInventorySummary(ctx context.Context) (map[string]interface{}, error) {
	var totalProducts, totalWarehouses, lowStockItems, totalValue int64

	// Total products
	s.db.DB.WithContext(ctx).Model(&Product{}).Where("is_active = ?", true).Count(&totalProducts)

	// Total warehouses
	s.db.DB.WithContext(ctx).Model(&Warehouse{}).Where("is_active = ?", true).Count(&totalWarehouses)

	// Low stock items
	s.db.DB.WithContext(ctx).Model(&InventoryItem{}).
		Joins("JOIN products ON inventory_items.product_id = products.id").
		Where("inventory_items.is_active = ? AND products.is_active = ? AND inventory_items.available_qty <= products.min_stock_level",
			true, true).
		Count(&lowStockItems)

	// Total inventory value
	s.db.DB.WithContext(ctx).Model(&InventoryItem{}).
		Select("COALESCE(SUM(unit_cost * available_qty), 0)").
		Where("is_active = ?", true).
		Scan(&totalValue)

	return map[string]interface{}{
		"total_products":     totalProducts,
		"total_warehouses":   totalWarehouses,
		"low_stock_items":    lowStockItems,
		"total_value":        totalValue,
		"last_updated":       time.Now(),
	}, nil
}

func (s *InventoryService) GetWarehouseUtilization(ctx context.Context) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT
			w.id,
			w.name,
			w.capacity,
			COALESCE(SUM(ii.quantity), 0) as current_stock,
			CASE
				WHEN w.capacity > 0 THEN (COALESCE(SUM(ii.quantity), 0)::float / w.capacity::float) * 100
				ELSE 0
			END as utilization_percent
		FROM warehouses w
		LEFT JOIN inventory_items ii ON w.id = ii.warehouse_id AND ii.is_active = true
		WHERE w.is_active = true
		GROUP BY w.id, w.name, w.capacity
		ORDER BY utilization_percent DESC
	`

	if err := s.db.DB.Raw(query).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get warehouse utilization: %w", err)
	}

	return results, nil
}

// ==================== INVENTORY HANDLERS ====================

type InventoryHandler struct {
	inventoryService *InventoryService
	db               *Database
	cache            *CacheService
	config           Config
}

func NewInventoryHandler(inventoryService *InventoryService, db *Database, cache *CacheService, config Config) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
		db:               db,
		cache:            cache,
		config:           config,
	}
}

// Warehouse endpoints
func (h *InventoryHandler) GetWarehouses(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	search := c.Query("search")
	warehouseType := c.Query("warehouse_type")

	filters := make(map[string]interface{})
	if search != "" {
		filters["search"] = search
	}
	if warehouseType != "" {
		filters["warehouse_type"] = warehouseType
	}

	warehouses, total, err := h.inventoryService.GetWarehouses(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"warehouses": warehouses,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(warehouses),
		},
	})
}

func (h *InventoryHandler) GetWarehouse(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	warehouse, err := h.inventoryService.GetWarehouseByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if warehouse == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
		return
	}

	c.JSON(http.StatusOK, warehouse)
}

func (h *InventoryHandler) CreateWarehouse(c *gin.Context) {
	ctx := c.Request.Context()
	var warehouse Warehouse

	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdWarehouse, err := h.inventoryService.CreateWarehouse(ctx, &warehouse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdWarehouse)
}

func (h *InventoryHandler) UpdateWarehouse(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedWarehouse, err := h.inventoryService.UpdateWarehouse(ctx, id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if updatedWarehouse == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
		return
	}

	c.JSON(http.StatusOK, updatedWarehouse)
}

func (h *InventoryHandler) DeleteWarehouse(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	if err := h.inventoryService.DeleteWarehouse(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Warehouse deleted successfully"})
}

// Inventory Item endpoints
func (h *InventoryHandler) GetInventoryItems(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	batchNumber := c.Query("batch_number")
	lowStockStr := c.Query("low_stock")

	filters := make(map[string]interface{})
	if productID != "" {
		filters["product_id"] = productID
	}
	if warehouseID != "" {
		filters["warehouse_id"] = warehouseID
	}
	if batchNumber != "" {
		filters["batch_number"] = batchNumber
	}
	if lowStockStr == "true" {
		filters["low_stock"] = true
	}

	items, total, err := h.inventoryService.GetInventoryItems(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory_items": items,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(items),
		},
	})
}

func (h *InventoryHandler) GetInventoryItem(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	item, err := h.inventoryService.GetInventoryItemByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *InventoryHandler) CreateInventoryItem(c *gin.Context) {
	ctx := c.Request.Context()
	var item InventoryItem

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdItem, err := h.inventoryService.CreateInventoryItem(ctx, &item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdItem)
}

func (h *InventoryHandler) UpdateInventoryItem(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedItem, err := h.inventoryService.UpdateInventoryItem(ctx, id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if updatedItem == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		return
	}

	c.JSON(http.StatusOK, updatedItem)
}

func (h *InventoryHandler) DeleteInventoryItem(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	if err := h.inventoryService.DeleteInventoryItem(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item deleted successfully"})
}

func (h *InventoryHandler) UpdateStock(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var adjustment StockAdjustment
	if err := c.ShouldBindJSON(&adjustment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment.InventoryItemID = id

	createdAdjustment, err := h.inventoryService.CreateStockAdjustment(ctx, &adjustment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdAdjustment)
}

func (h *InventoryHandler) GetStockAdjustments(c *gin.Context) {
	ctx := c.Request.Context()
	inventoryItemID := c.Param("id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	adjustments, total, err := h.inventoryService.GetStockAdjustments(ctx, inventoryItemID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"adjustments": adjustments,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(adjustments),
		},
	})
}

// Reports endpoints
func (h *InventoryHandler) GetInventorySummary(c *gin.Context) {
	ctx := c.Request.Context()

	summary, err := h.inventoryService.GetInventorySummary(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (h *InventoryHandler) GetWarehouseUtilization(c *gin.Context) {
	ctx := c.Request.Context()

	utilization, err := h.inventoryService.GetWarehouseUtilization(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"warehouse_utilization": utilization,
		"count":                 len(utilization),
	})
}
