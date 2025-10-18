package services

import (
"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type WarehouseService struct {
	db *gorm.DB
}

func NewWarehouseService() *WarehouseService {
	return &WarehouseService{
		db: database.GetDB(),
	}
}

func (s *WarehouseService) GetWarehouseByID(id string) (*models.Warehouse, error) {
	var warehouse models.Warehouse
	err := s.db.Where("id = ?", id).First(&warehouse).Error
	return &warehouse, err
}
