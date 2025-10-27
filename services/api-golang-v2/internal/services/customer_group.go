package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type CustomerGroupService struct {
	db *gorm.DB
}

func NewCustomerGroupService() *CustomerGroupService {
	return &CustomerGroupService{
		db: database.GetDB(),
	}
}

func (s *CustomerGroupService) ListCustomerGroups(page, limit int, search string) ([]models.CustomerGroup, int64, error) {
	var customerGroups []models.CustomerGroup
	var total int64

	query := s.db.Model(&models.CustomerGroup{})

	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("name ASC").Find(&customerGroups).Error

	return customerGroups, total, err
}

func (s *CustomerGroupService) GetCustomerGroupByID(id string) (*models.CustomerGroup, error) {
	var customerGroup models.CustomerGroup
	err := s.db.Where("id = ?", id).First(&customerGroup).Error
	return &customerGroup, err
}

func (s *CustomerGroupService) CreateCustomerGroup(customerGroup *models.CustomerGroup) error {
	return s.db.Create(customerGroup).Error
}

func (s *CustomerGroupService) UpdateCustomerGroup(id string, updates *models.CustomerGroup) error {
	return s.db.Model(&models.CustomerGroup{}).Where("id = ?", id).Updates(updates).Error
}

func (s *CustomerGroupService) DeleteCustomerGroup(id string) error {
	return s.db.Delete(&models.CustomerGroup{}, "id = ?", id).Error
}
