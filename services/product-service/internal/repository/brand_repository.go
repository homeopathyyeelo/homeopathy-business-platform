package repository

import (
	"context"

	"github.com/yeelo/product-service/internal/models"
	"gorm.io/gorm"
)

type BrandRepository interface {
	Create(ctx context.Context, brand *models.Brand) error
	GetByID(ctx context.Context, id string) (*models.Brand, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Brand, int64, error)
	Update(ctx context.Context, brand *models.Brand) error
	Delete(ctx context.Context, id string) error
}

type brandRepository struct {
	db *gorm.DB
}

func NewBrandRepository(db *gorm.DB) BrandRepository {
	return &brandRepository{db: db}
}

func (r *brandRepository) Create(ctx context.Context, brand *models.Brand) error {
	return r.db.WithContext(ctx).Create(brand).Error
}

func (r *brandRepository) GetByID(ctx context.Context, id string) (*models.Brand, error) {
	var brand models.Brand
	err := r.db.WithContext(ctx).First(&brand, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &brand, nil
}

func (r *brandRepository) List(ctx context.Context, page, pageSize int) ([]*models.Brand, int64, error) {
	var brands []*models.Brand
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.WithContext(ctx).Model(&models.Brand{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(pageSize).
		Order("name ASC").
		Find(&brands).Error

	return brands, total, err
}

func (r *brandRepository) Update(ctx context.Context, brand *models.Brand) error {
	return r.db.WithContext(ctx).Save(brand).Error
}

func (r *brandRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Brand{}, "id = ?", id).Error
}
