// Payment Gateway Handlers - Stripe and Razorpay integration
package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PaymentGatewayHandler handles payment gateway operations
type PaymentGatewayHandler struct {
	db     *GORMDatabase
	cache  *CacheService
	stripe *StripeService
	razorpay *RazorpayService
}

// NewPaymentGatewayHandler creates a new payment gateway handler
func NewPaymentGatewayHandler(db *GORMDatabase, cache *CacheService, stripe *StripeService, razorpay *RazorpayService) *PaymentGatewayHandler {
	return &PaymentGatewayHandler{db: db, cache: cache, stripe: stripe, razorpay: razorpay}
}

// ==================== STRIPE INTEGRATION ====================

// CreateStripePaymentIntent creates a Stripe payment intent
func (h *PaymentGatewayHandler) CreateStripePaymentIntent(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Currency    string `json:"currency" binding:"required"`
		Description string `json:"description"`
		CustomerID  string `json:"customer_id"`
		InvoiceID   string `json:"invoice_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create payment intent using Stripe service
	paymentIntent, err := h.stripe.CreatePaymentIntent(request.Amount, request.Currency, request.Description, request.CustomerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment intent"})
		return
	}

	// Log payment attempt
	paymentLog := PaymentLog{
		Gateway:     "stripe",
		TransactionID: paymentIntent.ID,
		Amount:      float64(request.Amount) / 100, // Convert from cents
		Currency:    request.Currency,
		Status:      "pending",
		PaymentMethod: "card",
		CustomerID:  request.CustomerID,
		InvoiceID:   request.InvoiceID,
	}

	if err := h.db.DB.WithContext(ctx).Create(&paymentLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log payment"})
		return
	}

	response := map[string]interface{}{
		"payment_intent_id": paymentIntent.ID,
		"client_secret":     paymentIntent.ClientSecret,
		"amount":            paymentIntent.Amount,
		"currency":          paymentIntent.Currency,
		"status":            paymentIntent.Status,
	}

	c.JSON(http.StatusOK, response)
}

// ConfirmStripePayment confirms a Stripe payment
func (h *PaymentGatewayHandler) ConfirmStripePayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	paymentIntentID := c.Param("payment_intent_id")

	// Confirm payment using Stripe service
	paymentIntent, err := h.stripe.ConfirmPayment(paymentIntentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm payment"})
		return
	}

	// Update payment log
	if err := h.db.DB.WithContext(ctx).Model(&PaymentLog{}).Where("transaction_id = ?", paymentIntentID).Update("status", "completed").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment log"})
		return
	}

	response := map[string]interface{}{
		"payment_intent_id": paymentIntent.ID,
		"status":            paymentIntent.Status,
		"amount":            paymentIntent.Amount,
		"currency":          paymentIntent.Currency,
	}

	c.JSON(http.StatusOK, response)
}

// CreateStripeRefund creates a Stripe refund
func (h *PaymentGatewayHandler) CreateStripeRefund(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		PaymentIntentID string `json:"payment_intent_id" binding:"required"`
		Amount          int64  `json:"amount"`
		Reason          string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	refund, err := h.stripe.CreateRefund(request.PaymentIntentID, request.Amount, request.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund"})
		return
	}

	// Log refund
	refundLog := RefundLog{
		PaymentTransactionID: request.PaymentIntentID,
		RefundID:            refund.ID,
		Amount:              float64(refund.Amount) / 100,
		Currency:            refund.Currency,
		Status:              "completed",
		Reason:              request.Reason,
	}

	if err := h.db.DB.WithContext(ctx).Create(&refundLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log refund"})
		return
	}

	response := map[string]interface{}{
		"refund_id": refund.ID,
		"amount":    refund.Amount,
		"currency":  refund.Currency,
		"status":    refund.Status,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== RAZORPAY INTEGRATION ====================

// CreateRazorpayOrder creates a Razorpay order
func (h *PaymentGatewayHandler) CreateRazorpayOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Currency    string `json:"currency" binding:"required"`
		Description string `json:"description"`
		CustomerID  string `json:"customer_id"`
		InvoiceID   string `json:"invoice_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order, err := h.razorpay.CreateOrder(request.Amount, request.Currency, request.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Log payment attempt
	paymentLog := PaymentLog{
		Gateway:     "razorpay",
		TransactionID: order.ID,
		Amount:      float64(request.Amount) / 100, // Convert from paise
		Currency:    request.Currency,
		Status:      "pending",
		PaymentMethod: "card",
		CustomerID:  request.CustomerID,
		InvoiceID:   request.InvoiceID,
	}

	if err := h.db.DB.WithContext(ctx).Create(&paymentLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log payment"})
		return
	}

	response := map[string]interface{}{
		"order_id":    order.ID,
		"amount":      order.Amount,
		"currency":    order.Currency,
		"status":      order.Status,
		"receipt":     order.Receipt,
	}

	c.JSON(http.StatusOK, response)
}

// VerifyRazorpayPayment verifies a Razorpay payment
func (h *PaymentGatewayHandler) VerifyRazorpayPayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		OrderID    string `json:"order_id" binding:"required"`
		PaymentID  string `json:"payment_id" binding:"required"`
		Signature  string `json:"signature" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify payment signature
	isValid, err := h.razorpay.VerifyPayment(request.OrderID, request.PaymentID, request.Signature)
	if err != nil || !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	// Get payment details
	payment, err := h.razorpay.GetPayment(request.PaymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment details"})
		return
	}

	// Update payment log
	if err := h.db.DB.WithContext(ctx).Model(&PaymentLog{}).Where("transaction_id = ?", request.OrderID).Update("status", "completed").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment log"})
		return
	}

	response := map[string]interface{}{
		"payment_id": payment.ID,
		"order_id":   payment.OrderID,
		"amount":     payment.Amount,
		"currency":   payment.Currency,
		"status":     payment.Status,
		"method":     payment.Method,
	}

	c.JSON(http.StatusOK, response)
}

// CreateRazorpayRefund creates a Razorpay refund
func (h *PaymentGatewayHandler) CreateRazorpayRefund(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		PaymentID string `json:"payment_id" binding:"required"`
		Amount    int64  `json:"amount"`
		Reason    string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	refund, err := h.razorpay.CreateRefund(request.PaymentID, request.Amount, request.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund"})
		return
	}

	// Log refund
	refundLog := RefundLog{
		PaymentTransactionID: request.PaymentID,
		RefundID:            refund.ID,
		Amount:              float64(refund.Amount) / 100,
		Currency:            refund.Currency,
		Status:              "completed",
		Reason:              request.Reason,
	}

	if err := h.db.DB.WithContext(ctx).Create(&refundLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log refund"})
		return
	}

	response := map[string]interface{}{
		"refund_id": refund.ID,
		"amount":    refund.Amount,
		"currency":  refund.Currency,
		"status":    refund.Status,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== PAYMENT LOGS ====================

// GetPaymentLogs retrieves payment logs
func (h *PaymentGatewayHandler) GetPaymentLogs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var logs []PaymentLog
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&PaymentLog{})

	// Apply filters
	if gateway := c.Query("gateway"); gateway != "" {
		query = query.Where("gateway = ?", gateway)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if invoiceID := c.Query("invoice_id"); invoiceID != "" {
		query = query.Where("invoice_id = ?", invoiceID)
	}

	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		if endDate := c.Query("end_date"); endDate != "" {
			query = query.Where("created_at BETWEEN ? AND ?", startDate, endDate)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count payment logs"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetPaymentLog retrieves a specific payment log
func (h *PaymentGatewayHandler) GetPaymentLog(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var log PaymentLog

	if err := h.db.DB.WithContext(ctx).Where("id = ?", id).First(&log).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment log not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment log"})
		return
	}

	c.JSON(http.StatusOK, log)
}

// ==================== REFUND LOGS ====================

// GetRefundLogs retrieves refund logs
func (h *PaymentGatewayHandler) GetRefundLogs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var logs []RefundLog
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&RefundLog{})

	// Apply filters
	if gateway := c.Query("gateway"); gateway != "" {
		query = query.Where("gateway = ?", gateway)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count refund logs"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve refund logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ==================== PAYMENT GATEWAY CONFIGURATION ====================

// GetPaymentGatewayConfig retrieves payment gateway configuration
func (h *PaymentGatewayHandler) GetPaymentGatewayConfig(c *gin.Context) {
	config := map[string]interface{}{
		"stripe": map[string]interface{}{
			"enabled":      true,
			"public_key":   "pk_test_...", // In real implementation, get from config
			"webhook_url":  "/api/payments/webhooks/stripe",
		},
		"razorpay": map[string]interface{}{
			"enabled":      true,
			"key_id":       "rzp_test_...", // In real implementation, get from config
			"webhook_url":  "/api/payments/webhooks/razorpay",
		},
	}

	c.JSON(http.StatusOK, config)
}

// ==================== WEBHOOK HANDLERS ====================

// HandleStripeWebhook handles Stripe webhook events
func (h *PaymentGatewayHandler) HandleStripeWebhook(c *gin.Context) {
	var event map[string]interface{}

	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process webhook event
	eventType := event["type"].(string)
	eventData := event["data"].(map[string]interface{})

	switch eventType {
	case "payment_intent.succeeded":
		// Handle successful payment
		paymentIntent := eventData["object"].(map[string]interface{})
		paymentIntentID := paymentIntent["id"].(string)

		// Update payment log
		h.db.DB.Model(&PaymentLog{}).Where("transaction_id = ?", paymentIntentID).Update("status", "completed")

	case "payment_intent.payment_failed":
		// Handle failed payment
		paymentIntent := eventData["object"].(map[string]interface{})
		paymentIntentID := paymentIntent["id"].(string)

		// Update payment log
		h.db.DB.Model(&PaymentLog{}).Where("transaction_id = ?", paymentIntentID).Update("status", "failed")
	}

	c.JSON(http.StatusOK, gin.H{"status": "webhook processed"})
}

// HandleRazorpayWebhook handles Razorpay webhook events
func (h *PaymentGatewayHandler) HandleRazorpayWebhook(c *gin.Context) {
	var event map[string]interface{}

	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process webhook event
	eventType := event["event"].(string)

	switch eventType {
	case "payment.authorized":
		// Handle authorized payment
		payment := event["payload"].(map[string]interface{})["payment"].(map[string]interface{})
		paymentID := payment["entity"].(map[string]interface{})["id"].(string)

		// Update payment log
		h.db.DB.Model(&PaymentLog{}).Where("transaction_id = ?", paymentID).Update("status", "completed")

	case "payment.failed":
		// Handle failed payment
		payment := event["payload"].(map[string]interface{})["payment"].(map[string]interface{})
		paymentID := payment["entity"].(map[string]interface{})["id"].(string)

		// Update payment log
		h.db.DB.Model(&PaymentLog{}).Where("transaction_id = ?", paymentID).Update("status", "failed")
	}

	c.JSON(http.StatusOK, gin.H{"status": "webhook processed"})
}

// ==================== PAYMENT ANALYTICS ====================

// GetPaymentAnalytics retrieves payment analytics
func (h *PaymentGatewayHandler) GetPaymentAnalytics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Get date range
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	// Calculate payment statistics
	var stats map[string]interface{}

	query := `
		SELECT
			COUNT(*) as total_payments,
			COALESCE(SUM(amount), 0) as total_amount,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
			AVG(amount) as average_amount,
			gateway
		FROM payment_logs
		WHERE created_at BETWEEN ? AND ?
		GROUP BY gateway
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment analytics"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"analytics":  stats,
	}

	c.JSON(http.StatusOK, response)
}
