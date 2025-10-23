package repository

import (
	"context"

	"github.com/yeelo/product-service/internal/models"
	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(ctx context.Context, product *models.Product) error
	GetByID(ctx context.Context, id string) (*models.Product, error)
	GetByBarcode(ctx context.Context, barcode string) (*models.Product, error)
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Product, int64, error)
	Search(ctx context.Context, query string, page, pageSize int) ([]*models.Product, int64, error)
	Update(ctx context.Context, product *models.Product) error
	Delete(ctx context.Context, id string) error
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *productRepository) GetByID(ctx context.Context, id string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		First(&product, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		First(&product, "barcode = ?", barcode).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		First(&product, "sku = ?", sku).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) List(ctx context.Context, page, pageSize int) ([]*models.Product, int64, error) {
	var products []*models.Product
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.WithContext(ctx).Model(&models.Product{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&products).Error

	return products, total, err
}

func (r *productRepository) Search(ctx context.Context, query string, page, pageSize int) ([]*models.Product, int64, error) {
	var products []*models.Product
	var total int64

	offset := (page - 1) * pageSize
	searchQuery := "%" + query + "%"

	countQuery := r.db.WithContext(ctx).Model(&models.Product{}).
		Where("name ILIKE ? OR code ILIKE ? OR sku ILIKE ?", searchQuery, searchQuery, searchQuery)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Brand").
		Where("name ILIKE ? OR code ILIKE ? OR sku ILIKE ?", searchQuery, searchQuery, searchQuery).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&products).Error

	return products, total, err
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *productRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Product{}, "id = ?", id).Error
}
