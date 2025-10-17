package services

import (
	"github.com/yeelo/homeopathy-erp/internal/database"
)

type PaymentService struct {
	db *database.DB
}

func NewPaymentService() *PaymentService {
	return &PaymentService{
		db: database.GetDB(),
	}
}
