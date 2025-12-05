package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type PaymentHandler struct {
	DB             *gorm.DB
	paymentService *services.PaymentService
}

func NewPaymentHandler(db *gorm.DB) *PaymentHandler {
	return &PaymentHandler{
		DB:             db,
		paymentService: services.NewPaymentService(db),
	}
}

type Payment struct {
	ID                   uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID              uuid.UUID  `json:"order_id" gorm:"index"`
	Amount               float64    `json:"amount"`
	Currency             string     `json:"currency" gorm:"default:'INR'"`
	Status               string     `json:"status" gorm:"index;default:'pending'"` // pending, processing, completed, failed, refunded
	PaymentMethod        string     `json:"payment_method"`                        // card, upi, netbanking, wallet, cash, cod
	Gateway              string     `json:"gateway"`                               // razorpay, stripe, paypal, manual
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

// ==================== Payment Tracking Methods ====================

// RecordInvoicePayment records a payment against invoice(s)
// POST /api/erp/sales/payments
func (h *PaymentHandler) RecordInvoicePayment(c *gin.Context) {
	var req services.RecordPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data", "details": err.Error()})
		return
	}

	payment, err := h.paymentService.RecordPayment(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payment,
		"message": "Payment recorded successfully",
	})
}

// ListInvoicePayments lists payments with filters
// GET /api/erp/sales/payments
func (h *PaymentHandler) ListInvoicePayments(c *gin.Context) {
	invoiceID := c.Query("invoice_id")
	customerID := c.Query("customer_id")
	paymentMethod := c.Query("payment_method")
	status := c.Query("status")

	var dateFrom, dateTo *time.Time
	if df := c.Query("date_from"); df != "" {
		if t, err := time.Parse("2006-01-02", df); err == nil {
			dateFrom = &t
		}
	}
	if dt := c.Query("date_to"); dt != "" {
		if t, err := time.Parse("2006-01-02", dt); err == nil {
			dateTo = &t
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	payments, total, err := h.paymentService.GetPayments(invoiceID, customerID, paymentMethod, status, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      payments,
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// UpdateChequeStatus updates cheque status
// PUT /api/erp/sales/payments/:id/cheque-status
func (h *PaymentHandler) UpdateChequeStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status        string     `json:"status" binding:"required"`
		DepositDate   *time.Time `json:"depositDate"`
		ClearanceDate *time.Time `json:"clearanceDate"`
		BounceReason  string     `json:"bounceReason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.paymentService.UpdateChequeStatus(id, req.Status, req.DepositDate, req.ClearanceDate, req.BounceReason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Cheque status updated successfully",
	})
}

// ReverseInvoicePayment reverses a payment
// POST /api/erp/sales/payments/:id/reverse
func (h *PaymentHandler) ReverseInvoicePayment(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Reason     string `json:"reason" binding:"required"`
		ReversedBy string `json:"reversedBy" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.paymentService.ReversePayment(id, req.Reason, req.ReversedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment reversed successfully",
	})
}

// GetReconciliationReport generates EOD reconciliation report
// GET /api/erp/sales/payments/reconciliation
func (h *PaymentHandler) GetReconciliationReport(c *gin.Context) {
	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	report, err := h.paymentService.GetReconciliationReport(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    report,
	})
}

// ==================== ERP Sync Management Endpoints ====================

// GetPendingERPSync gets payments pending ERP sync
// GET /api/erp/sales/payments/erp-sync/pending
func (h *PaymentHandler) GetPendingERPSync(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	payments, err := h.paymentService.GetPendingERPSyncPayments(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"count":   len(payments),
	})
}

// GetFailedERPSync gets payments with failed ERP sync
// GET /api/erp/sales/payments/erp-sync/failed
func (h *PaymentHandler) GetFailedERPSync(c *gin.Context) {
	payments, err := h.paymentService.GetFailedERPSyncPayments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch failed payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"count":   len(payments),
	})
}

// RetryERPSync retries ERP sync for a payment
// POST /api/erp/sales/payments/:id/erp-sync/retry
func (h *PaymentHandler) RetryERPSync(c *gin.Context) {
	id := c.Param("id")

	if err := h.paymentService.RetryERPSync(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment queued for ERP sync retry",
	})
}

// GetERPSyncSummary gets ERP sync status summary
// GET /api/erp/sales/payments/erp-sync/summary
func (h *PaymentHandler) GetERPSyncSummary(c *gin.Context) {
	summary, err := h.paymentService.GetPaymentSyncSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// GetUnreconciledPayments gets payments needing reconciliation
// GET /api/erp/sales/payments/reconciliation/pending
func (h *PaymentHandler) GetUnreconciledPayments(c *gin.Context) {
	var dateFrom, dateTo *time.Time
	if df := c.Query("date_from"); df != "" {
		if t, err := time.Parse("2006-01-02", df); err == nil {
			dateFrom = &t
		}
	}
	if dt := c.Query("date_to"); dt != "" {
		if t, err := time.Parse("2006-01-02", dt); err == nil {
			dateTo = &t
		}
	}

	payments, err := h.paymentService.GetUnreconciledPayments(dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch unreconciled payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"count":   len(payments),
	})
}

// ReconcilePayment marks payment as reconciled
// POST /api/erp/sales/payments/:id/reconcile
func (h *PaymentHandler) ReconcilePayment(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Notes        string `json:"notes"`
		ReconciledBy string `json:"reconciledBy" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if err := h.paymentService.ReconcilePayment(id, req.Notes, req.ReconciledBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment reconciled successfully",
	})
}
