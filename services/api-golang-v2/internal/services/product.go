package services

import (
	"fmt"
	"time"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type ProductService struct {
	db *database.DB
}

func NewProductService() *ProductService {
	return &ProductService{
		db: database.GetDB(),
	}
}

func (s *ProductService) ListProducts(page, limit int, search, brandID, categoryID string, activeOnly bool) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := s.db.DB.Model(&models.Product{})

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR sku ILIKE ? OR barcode ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if brandID != "" {
		query = query.Where("brand_id = ?", brandID)
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error

	return products, total, err
}

func (s *ProductService) GetProductByID(id string) (*models.Product, error) {
	var product models.Product
	err := s.db.DB.Where("id = ?", id).First(&product).Error
	return &product, err
}

func (s *ProductService) CreateProduct(product *models.Product) error {
	return s.db.DB.Create(product).Error
}

func (s *ProductService) UpdateProduct(id string, updates map[string]interface{}) error {
	return s.db.DB.Model(&models.Product{}).Where("id = ?", id).Updates(updates).Error
}

func (s *ProductService) DeleteProduct(id string) error {
	return s.db.DB.Model(&models.Product{}).Where("id = ?", id).Update("is_active", false).Error
}

func (s *ProductService) GetLowStockProducts() ([]models.Product, error) {
	var products []models.Product
	err := s.db.DB.Where("stock <= min_stock AND is_active = ?", true).Find(&products).Error
	return products, err
}

func (s *ProductService) GetExpiringProducts(days int) ([]models.Product, error) {
	var products []models.Product
	expiryDate := time.Now().AddDate(0, 0, days)
	err := s.db.DB.Where("expiry_date <= ? AND expiry_date > ? AND is_active = ?", expiryDate, time.Now(), true).Find(&products).Error
	return products, err
}

func (s *ProductService) UpdateStock(productID string, quantity int) error {
	return s.db.DB.Model(&models.Product{}).Where("id = ?", productID).Update("stock", quantity).Error
}
