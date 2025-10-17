package services

import (
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type BrandService struct {
	db *database.DB
}

func NewBrandService() *BrandService {
	return &BrandService{
		db: database.GetDB(),
	}
}

func (s *BrandService) GetBrandByID(id string) (*models.Brand, error) {
	var brand models.Brand
	err := s.db.DB.Where("id = ?", id).First(&brand).Error
	return &brand, err
}
