package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB *gorm.DB
}

func NewPaymentHandler(db *gorm.DB) *PaymentHandler {
	return &PaymentHandler{DB: db}
}

type Payment struct {
	ID                   uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID              uuid.UUID  `json:"order_id" gorm:"index"`
	Amount               float64    `json:"amount"`
	Currency             string     `json:"currency" gorm:"default:'INR'"`
	Status               string     `json:"status" gorm:"index;default:'pending'"` // pending, processing, completed, failed, refunded
	PaymentMethod        string     `json:"payment_method"` // card, upi, netbanking, wallet, cash, cod
	Gateway              string     `json:"gateway"` // razorpay, stripe, paypal, manual
	GatewayTransactionID string     `json:"gateway_transaction_id" gorm:"index"`
	GatewayPaymentID     string     `json:"gateway_payment_id"`
	GatewayOrderID       string     `json:"gateway_order_id"`
	GatewaySignature     string     `json:"gateway_signature"`
	CustomerID           uuid.UUID  `json:"customer_id" gorm:"index"`
	CustomerEmail        string     `json:"customer_email"`
	CustomerPhone        string     `json:"customer_phone"`
	Description          string     `json:"description"`
	Metadata             string     `json:"metadata" gorm:"type:jsonb"`
	ErrorCode            string     `json:"error_code"`
	ErrorMessage         string     `json:"error_message"`
	PaidAt               *time.Time `json:"paid_at"`
	RefundedAt           *time.Time `json:"refunded_at"`
	RefundAmount         float64    `json:"refund_amount"`
	RefundReason         string     `json:"refund_reason"`
	CreatedAt            time.Time  `json:"created_at" gorm:"index"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type PaymentTransaction struct {
	ID                   uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PaymentID            uuid.UUID `json:"payment_id" gorm:"index"`
	Type                 string    `json:"type"` // charge, refund, capture, void
	Amount               float64   `json:"amount"`
	Status               string    `json:"status"`
	GatewayTransactionID string    `json:"gateway_transaction_id"`
	ResponseData         string    `json:"response_data" gorm:"type:jsonb"`
	CreatedAt            time.Time `json:"created_at"`
}

type Refund struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PaymentID       uuid.UUID  `json:"payment_id" gorm:"index"`
	Amount          float64    `json:"amount"`
	Reason          string     `json:"reason"`
	Status          string     `json:"status" gorm:"default:'pending'"` // pending, processing, completed, failed
	GatewayRefundID string     `json:"gateway_refund_id"`
	ProcessedAt     *time.Time `json:"processed_at"`
	CreatedAt       time.Time  `json:"created_at"`
}

// Get all payments
func (h *PaymentHandler) GetPayments(c *gin.Context) {
	var payments []Payment
	query := h.DB.Model(&Payment{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if orderID := c.Query("order_id"); orderID != "" {
		query = query.Where("order_id = ?", orderID)
	}

	query.Order("created_at DESC").Limit(100).Find(&payments)
	c.JSON(http.StatusOK, gin.H{"success": true, "payments": payments})
}

// Get single payment
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	id := c.Param("id")
	var payment Payment
	
	if err := h.DB.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "payment": payment})
}

// Create payment
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var payment Payment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment.ID = uuid.New()
	payment.Status = "pending"

	if err := h.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "payment": payment})
}

// Process payment (simulate gateway)
func (h *PaymentHandler) ProcessPayment(c *gin.Context) {
	id := c.Param("id")
	var payment Payment
	
	if err := h.DB.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Simulate payment processing
	payment.Status = "completed"
	now := time.Now()
	payment.PaidAt = &now
	payment.GatewayTransactionID = "TXN" + time.Now().Format("20060102150405")

	h.DB.Save(&payment)

	// Create transaction record
	txn := PaymentTransaction{
		PaymentID:            payment.ID,
		Type:                 "charge",
		Amount:               payment.Amount,
		Status:               "success",
		GatewayTransactionID: payment.GatewayTransactionID,
	}
	h.DB.Create(&txn)

	c.JSON(http.StatusOK, gin.H{"success": true, "payment": payment})
}

// Refund payment
func (h *PaymentHandler) RefundPayment(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Amount float64 `json:"amount" binding:"required"`
		Reason string  `json:"reason" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var payment Payment
	if err := h.DB.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Create refund record
	refund := Refund{
		PaymentID: payment.ID,
		Amount:    req.Amount,
		Reason:    req.Reason,
		Status:    "completed",
	}
	now := time.Now()
	refund.ProcessedAt = &now
	h.DB.Create(&refund)

	// Update payment
	payment.Status = "refunded"
	payment.RefundedAt = &now
	payment.RefundAmount = req.Amount
	payment.RefundReason = req.Reason
	h.DB.Save(&payment)

	c.JSON(http.StatusOK, gin.H{"success": true, "refund": refund})
}

// Get payment transactions
func (h *PaymentHandler) GetPaymentTransactions(c *gin.Context) {
	paymentID := c.Param("id")
	var transactions []PaymentTransaction
	
	h.DB.Where("payment_id = ?", paymentID).Order("created_at DESC").Find(&transactions)
	c.JSON(http.StatusOK, gin.H{"success": true, "transactions": transactions})
}
