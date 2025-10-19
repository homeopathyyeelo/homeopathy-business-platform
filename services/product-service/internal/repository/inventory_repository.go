package repository

import (
	"context"

	"github.com/yeelo/product-service/internal/models"
	"gorm.io/gorm"
)

type InventoryRepository interface {
	Create(ctx context.Context, inventory *models.Inventory) error
	GetByID(ctx context.Context, id string) (*models.Inventory, error)
	GetByProductID(ctx context.Context, productID string) ([]*models.Inventory, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Inventory, int64, error)
	GetLowStock(ctx context.Context) ([]*models.Inventory, error)
	Update(ctx context.Context, inventory *models.Inventory) error
	Delete(ctx context.Context, id string) error
	AdjustStock(ctx context.Context, productID string, quantity int, movementType string) error
}

type inventoryRepository struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) InventoryRepository {
	return &inventoryRepository{db: db}
}

func (r *inventoryRepository) Create(ctx context.Context, inventory *models.Inventory) error {
	return r.db.WithContext(ctx).Create(inventory).Error
}

func (r *inventoryRepository) GetByID(ctx context.Context, id string) (*models.Inventory, error) {
	var inventory models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		First(&inventory, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

func (r *inventoryRepository) GetByProductID(ctx context.Context, productID string) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		Where("product_id = ? AND is_active = ?", productID, true).
		Order("expiry_date ASC").
		Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) List(ctx context.Context, page, pageSize int) ([]*models.Inventory, int64, error) {
	var inventories []*models.Inventory
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.WithContext(ctx).Model(&models.Inventory{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Product").
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&inventories).Error

	return inventories, total, err
}

func (r *inventoryRepository) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		Joins("JOIN products ON products.id = inventories.product_id").
		Where("inventories.available_qty <= products.reorder_level").
		Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) Update(ctx context.Context, inventory *models.Inventory) error {
	return r.db.WithContext(ctx).Save(inventory).Error
}

func (r *inventoryRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Inventory{}, "id = ?", id).Error
}

func (r *inventoryRepository) AdjustStock(ctx context.Context, productID string, quantity int, movementType string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Get inventory
		var inventory models.Inventory
		if err := tx.Where("product_id = ?", productID).First(&inventory).Error; err != nil {
			return err
		}

		// Adjust quantity
		if movementType == "in" {
			inventory.Quantity += quantity
			inventory.AvailableQty += quantity
		} else if movementType == "out" {
			inventory.Quantity -= quantity
			inventory.AvailableQty -= quantity
		} else {
			inventory.Quantity = quantity
			inventory.AvailableQty = quantity
		}

		// Update inventory
		if err := tx.Save(&inventory).Error; err != nil {
			return err
		}

		// Create stock movement
		movement := &models.StockMovement{
			ProductID:   productID,
			InventoryID: &inventory.ID,
			Type:        movementType,
			Quantity:    quantity,
		}

		return tx.Create(movement).Error
	})
}
