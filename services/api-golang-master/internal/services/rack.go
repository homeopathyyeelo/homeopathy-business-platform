package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type RackService struct {
	db *gorm.DB
}

func NewRackService() *RackService {
	return &RackService{
		db: database.GetDB(),
	}
}

func (s *RackService) ListRacks(page, limit int, search, rackType string) ([]models.Rack, int64, error) {
	var racks []models.Rack
	var total int64

	query := s.db.Model(&models.Rack{})

	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if rackType != "" {
		query = query.Where("rack_type = ?", rackType)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("name ASC").Find(&racks).Error

	return racks, total, err
}

func (s *RackService) GetRackByID(id string) (*models.Rack, error) {
	var rack models.Rack
	err := s.db.Where("id = ?", id).First(&rack).Error
	return &rack, err
}

func (s *RackService) CreateRack(rack *models.Rack) error {
	return s.db.Create(rack).Error
}

func (s *RackService) UpdateRack(id string, updates *models.Rack) error {
	return s.db.Model(&models.Rack{}).Where("id = ?", id).Updates(updates).Error
}

func (s *RackService) DeleteRack(id string) error {
	return s.db.Delete(&models.Rack{}, "id = ?", id).Error
}
