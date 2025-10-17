package services

import (
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type CategoryService struct {
	db *database.DB
}

func NewCategoryService() *CategoryService {
	return &CategoryService{
		db: database.GetDB(),
	}
}

func (s *CategoryService) GetCategoryByID(id string) (*models.Category, error) {
	var category models.Category
	err := s.db.DB.Where("id = ?", id).First(&category).Error
	return &category, err
}
