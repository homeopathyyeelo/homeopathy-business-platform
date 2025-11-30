package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentTrackingService handles order payment operations
type PaymentTrackingService struct {
	db *gorm.DB
}

// NewPaymentTrackingService creates a new payment tracking service
func NewPaymentTrackingService(db *gorm.DB) *PaymentTrackingService {
	return &PaymentTrackingService{db: db}
}

// OrderPayment represents a payment record
type OrderPayment struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	OrderID         string    `json:"orderId" gorm:"type:uuid;not null"`
	PaymentNumber   string    `json:"paymentNumber" gorm:"uniqueIndex;not null"`
	PaymentDate     time.Time `json:"paymentDate"`
	Amount          float64   `json:"amount"`
	PaymentMethod   string    `json:"paymentMethod"`
	ReferenceNumber string    `json:"referenceNumber"`
	Notes           string    `json:"notes"`
	CreatedBy       string    `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (OrderPayment) TableName() string {
	return "order_payments"
}

// RecordPaymentRequest contains payment recording data
type RecordPaymentRequest struct {
	OrderID         string  `json:"orderId" binding:"required"`
	Amount          float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod   string  `json:"paymentMethod" binding:"required"`
	ReferenceNumber string  `json:"referenceNumber"`
	Notes           string  `json:"notes"`
	CreatedBy       string  `json:"createdBy"`
}

// RecordPayment records a new payment for an order
func (s *PaymentTrackingService) RecordPayment(req RecordPaymentRequest) (*OrderPayment, error) {
	// Generate payment number
	paymentNumber := fmt.Sprintf("PAY-%s-%04d", time.Now().Format("200601"), time.Now().Unix()%10000)

	payment := &OrderPayment{
		ID:              uuid.New().String(),
		OrderID:         req.OrderID,
		PaymentNumber:   paymentNumber,
		PaymentDate:     time.Now(),
		Amount:          req.Amount,
		PaymentMethod:   req.PaymentMethod,
		ReferenceNumber: req.ReferenceNumber,
		Notes:           req.Notes,
		CreatedBy:       req.CreatedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.db.Create(payment).Error; err != nil {
		return nil, fmt.Errorf("failed to record payment: %w", err)
	}

	return payment, nil
}

// GetOrderPayments returns all payments for an order
func (s *PaymentTrackingService) GetOrderPayments(orderID string) ([]OrderPayment, error) {
	var payments []OrderPayment
	if err := s.db.Where("order_id = ?", orderID).
		Order("payment_date DESC").
		Find(&payments).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch payments: %w", err)
	}
	return payments, nil
}

// GetPendingAmount calculates the pending amount for an order
func (s *PaymentTrackingService) GetPendingAmount(orderID string) (float64, error) {
	type Result struct {
		PendingAmount float64
	}

	var result Result
	if err := s.db.Raw(`
		SELECT 
			COALESCE(o.total_amount, 0) - COALESCE(SUM(op.amount), 0) as pending_amount
		FROM orders o
		LEFT JOIN order_payments op ON o.id = op.order_id
		WHERE o.id = ?
		GROUP BY o.id, o.total_amount
	`, orderID).Scan(&result).Error; err != nil {
		return 0, fmt.Errorf("failed to calculate pending amount: %w", err)
	}

	return result.PendingAmount, nil
}

// GetPaymentSummary returns payment summary for an order
func (s *PaymentTrackingService) GetPaymentSummary(orderID string) (map[string]interface{}, error) {
	type Summary struct {
		TotalAmount   float64    `json:"totalAmount"`
		PaidAmount    float64    `json:"paidAmount"`
		PendingAmount float64    `json:"pendingAmount"`
		PaymentStatus string     `json:"paymentStatus"`
		PaymentCount  int        `json:"paymentCount"`
		LastPaymentAt *time.Time `json:"lastPaymentAt"`
	}

	var summary Summary
	if err := s.db.Raw(`
		SELECT 
			o.total_amount,
			o.paid_amount,
			o.pending_amount,
			o.payment_status,
			COUNT(op.id) as payment_count,
			MAX(op.payment_date) as last_payment_at
		FROM orders o
		LEFT JOIN order_payments op ON o.id = op.order_id
		WHERE o.id = ?
		GROUP BY o.id, o.total_amount, o.paid_amount, o.pending_amount, o.payment_status
	`, orderID).Scan(&summary).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch payment summary: %w", err)
	}

	return map[string]interface{}{
		"totalAmount":   summary.TotalAmount,
		"paidAmount":    summary.PaidAmount,
		"pendingAmount": summary.PendingAmount,
		"paymentStatus": summary.PaymentStatus,
		"paymentCount":  summary.PaymentCount,
		"lastPaymentAt": summary.LastPaymentAt,
	}, nil
}
