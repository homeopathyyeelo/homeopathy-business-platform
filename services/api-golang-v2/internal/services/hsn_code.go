package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type HSNCodeService struct {
	db *gorm.DB
}

func NewHSNCodeService() *HSNCodeService {
	return &HSNCodeService{
		db: database.GetDB(),
	}
}

func (s *HSNCodeService) ListHSNCodes(page, limit int, search string) ([]models.HSNCode, int64, error) {
	var hsnCodes []models.HSNCode
	var total int64

	query := s.db.Model(&models.HSNCode{})

	if search != "" {
		query = query.Where("code ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("code ASC").Find(&hsnCodes).Error

	return hsnCodes, total, err
}

func (s *HSNCodeService) GetHSNCodeByID(id string) (*models.HSNCode, error) {
	var hsnCode models.HSNCode
	err := s.db.Where("id = ?", id).First(&hsnCode).Error
	return &hsnCode, err
}

func (s *HSNCodeService) CreateHSNCode(hsnCode *models.HSNCode) error {
	return s.db.Create(hsnCode).Error
}

func (s *HSNCodeService) UpdateHSNCode(id string, updates *models.HSNCode) error {
	return s.db.Model(&models.HSNCode{}).Where("id = ?", id).Updates(updates).Error
}

func (s *HSNCodeService) DeleteHSNCode(id string) error {
	return s.db.Delete(&models.HSNCode{}, "id = ?", id).Error
}
