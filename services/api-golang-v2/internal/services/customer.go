package services

import (
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type CustomerService struct {
	db *database.DB
}

func NewCustomerService() *CustomerService {
	return &CustomerService{
		db: database.GetDB(),
	}
}

func (s *CustomerService) GetCustomerByID(id string) (*models.Customer, error) {
	var customer models.Customer
	err := s.db.DB.Where("id = ?", id).First(&customer).Error
	return &customer, err
}

func (s *CustomerService) AddLoyaltyPoints(customerID string, points int) error {
	return s.db.DB.Model(&models.Customer{}).Where("id = ?", customerID).
		Update("loyalty_points", database.DB.Raw("loyalty_points + ?", points)).Error
}
