package services

import (
	"time"

	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
)

type ProductService struct {
	db *gorm.DB
}

func NewProductService(db *gorm.DB) *ProductService {
	return &ProductService{db: db}
}

type ProductFilter struct {
	CategoryID *uint   `json:"category_id"`
	BrandID    *uint   `json:"brand_id"`
	Search     string  `json:"search"`
	IsActive   *bool   `json:"is_active"`
	Limit      int     `json:"limit"`
	Offset     int     `json:"offset"`
}

func (s *ProductService) GetProducts(filter ProductFilter) ([]database.Product, int64, error) {
	query := s.db.Preload("Category").Preload("Brand").Preload("Company")

	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}

	if filter.BrandID != nil {
		query = query.Where("brand_id = ?", *filter.BrandID)
	}

	if filter.Search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+filter.Search+"%", "%"+filter.Search+"%")
	}

	if filter.IsActive != nil {
		query = query.Where("is_active = ?", *filter.IsActive)
	}

	var total int64
	query.Model(&database.Product{}).Count(&total)

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit).Offset(filter.Offset)
	}

	var products []database.Product
	err := query.Find(&products).Error

	return products, total, err
}

func (s *ProductService) GetProduct(id uint) (*database.Product, error) {
	var product database.Product
	err := s.db.Preload("Category").Preload("Brand").Preload("Company").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *ProductService) CreateProduct(product *database.Product) error {
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()
	return s.db.Create(product).Error
}

func (s *ProductService) UpdateProduct(id uint, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()
	return s.db.Model(&database.Product{}).Where("id = ?", id).Updates(updates).Error
}

func (s *ProductService) DeleteProduct(id uint) error {
	return s.db.Delete(&database.Product{}, id).Error
}

func (s *ProductService) GetCategories() ([]database.ProductCategory, error) {
	var categories []database.ProductCategory
	err := s.db.Find(&categories).Error
	return categories, err
}

func (s *ProductService) GetBrands() ([]database.ProductBrand, error) {
	var brands []database.ProductBrand
	err := s.db.Where("is_active = ?", true).Find(&brands).Error
	return brands, err
}

func (s *ProductService) GetPotencies() []string {
	return []string{"6X", "12X", "30X", "200X", "6C", "12C", "30C", "200C", "1M", "10M", "CM", "LM", "Q"}
}

func (s *ProductService) GetForms() []string {
	return []string{"Mother Tincture", "Dilution", "Biochemic", "Trituration", "Ointment", "Drops", "Tablets", "Capsules", "Syrup", "Powder"}
}
