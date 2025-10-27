package services

import (
"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
)

type PaymentService struct {
	db *gorm.DB
}

func NewPaymentService() *PaymentService {
	return &PaymentService{
		db: database.GetDB(),
	}
}
