// Sales Handlers - Complete implementation for invoices, payments, returns, and commissions
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

// SalesHandler handles all sales-related operations
type SalesHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewSalesHandler creates a new sales handler
func NewSalesHandler(db *GORMDatabase, cache *CacheService) *SalesHandler {
	return &SalesHandler{db: db, cache: cache}
}

// ==================== INVOICE HANDLERS ====================

// GetInvoices retrieves all invoices with filtering and pagination
func (h *SalesHandler) GetInvoices(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var invoices []Invoice
	var total int64

	query := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Preload("Payments").
		Model(&Invoice{}).
		Where("is_active = ?", true)

	// Apply filters
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if paymentStatus := c.Query("payment_status"); paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if salesmanID := c.Query("salesman_id"); salesmanID != "" {
		query = query.Where("salesman_id = ?", salesmanID)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("invoice_date >= ?", date)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("invoice_date <= ?", date)
		}
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("invoice_number ILIKE ? OR customer_id IN (SELECT id FROM customers WHERE name ILIKE ? OR phone ILIKE ?)",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count invoices"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"invoices": invoices,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetInvoice retrieves a specific invoice by ID
func (h *SalesHandler) GetInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var invoice Invoice

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Preload("Payments").
		Where("id = ? AND is_active = ?", id, true).
		First(&invoice).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// CreateInvoice creates a new invoice
func (h *SalesHandler) CreateInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var invoice Invoice
	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		invoice.CreatedBy = userID.(string)
	}

	// Set default status
	invoice.Status = "draft"
	invoice.PaymentStatus = "unpaid"

	// Calculate totals
	for i := range invoice.Items {
		item := &invoice.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	invoice.Subtotal = 0
	invoice.TaxAmount = 0
	invoice.TotalAmount = 0

	for _, item := range invoice.Items {
		invoice.Subtotal += item.Quantity * item.UnitPrice
		invoice.TaxAmount += item.TaxAmount
		invoice.TotalAmount += item.TotalAmount
	}

	invoice.OutstandingAmount = invoice.TotalAmount

	// Generate invoice number if series is specified
	if invoice.InvoiceSeriesID != "" {
		var series InvoiceSeries
		if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", invoice.InvoiceSeriesID, true).First(&series).Error; err == nil {
			invoice.InvoiceNumber = fmt.Sprintf("%s%06d", series.Prefix, series.CurrentNumber)
			series.CurrentNumber++
			h.db.DB.WithContext(ctx).Save(&series)
		}
	}

	if err := h.db.DB.WithContext(ctx).Create(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	// Clear cache for related data
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusCreated, invoice)
}

// UpdateInvoice updates an existing invoice (only if not issued)
func (h *SalesHandler) UpdateInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var invoice Invoice

	// Check if invoice exists and can be edited
	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&invoice).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice"})
		return
	}

	// Prevent editing issued invoices
	if invoice.Status == "confirmed" || invoice.Status == "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot edit issued invoice"})
		return
	}

	// Bind update data
	var updateData Invoice
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	invoice.CustomerID = updateData.CustomerID
	invoice.PaymentTerms = updateData.PaymentTerms
	invoice.Notes = updateData.Notes
	invoice.SalesmanID = updateData.SalesmanID

	// Recalculate totals from items
	for i := range updateData.Items {
		item := &updateData.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	invoice.Items = updateData.Items

	invoice.Subtotal = 0
	invoice.TaxAmount = 0
	invoice.TotalAmount = 0

	for _, item := range invoice.Items {
		invoice.Subtotal += item.Quantity * item.UnitPrice
		invoice.TaxAmount += item.TaxAmount
		invoice.TotalAmount += item.TotalAmount
	}

	invoice.OutstandingAmount = invoice.TotalAmount - invoice.PaidAmount

	if err := h.db.DB.WithContext(ctx).Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusOK, invoice)
}

// DeleteInvoice soft deletes an invoice
func (h *SalesHandler) DeleteInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&Invoice{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusNoContent, nil)
}

// GetInvoicesByCustomer retrieves invoices for a specific customer
func (h *SalesHandler) GetInvoicesByCustomer(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")
	var invoices []Invoice

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Where("customer_id = ? AND is_active = ?", customerID, true).
		Order("created_at DESC").
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve customer invoices"})
		return
	}

	c.JSON(http.StatusOK, invoices)
}

// GetInvoicesBySalesman retrieves invoices for a specific salesman
func (h *SalesHandler) GetInvoicesBySalesman(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	salesmanID := c.Param("salesman_id")
	var invoices []Invoice

	if err := h.db.DB.WithContext(ctx).
		Where("salesman_id = ? AND is_active = ?", salesmanID, true).
		Order("created_at DESC").
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve salesman invoices"})
		return
	}

	c.JSON(http.StatusOK, invoices)
}

// UpdateInvoiceStatus updates the status of an invoice
func (h *SalesHandler) UpdateInvoiceStatus(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var request struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"draft", "confirmed", "cancelled", "paid", "overdue"}
	isValid := false
	for _, status := range validStatuses {
		if request.Status == status {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	updates := map[string]interface{}{
		"status":     request.Status,
		"updated_at": time.Now(),
	}

	if request.Status == "cancelled" {
		updates["cancelled_at"] = time.Now()
	}

	if err := h.db.DB.WithContext(ctx).Model(&Invoice{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice status"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusOK, gin.H{"message": "Invoice status updated successfully"})
}

// ApproveInvoice approves an invoice for issuance
func (h *SalesHandler) ApproveInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	userID, _ := c.Get("user_id")

	updates := map[string]interface{}{
		"status":     "confirmed",
		"approved_by": userID.(string),
		"approved_at": time.Now(),
		"updated_at": time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Model(&Invoice{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve invoice"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusOK, gin.H{"message": "Invoice approved successfully"})
}

// GetInvoiceSummary provides invoice summary statistics
func (h *SalesHandler) GetInvoiceSummary(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var summary struct {
		TotalInvoices     int64   `json:"total_invoices"`
		TotalAmount       float64 `json:"total_amount"`
		PaidAmount        float64 `json:"paid_amount"`
		OutstandingAmount float64 `json:"outstanding_amount"`
		PaidInvoices      int64   `json:"paid_invoices"`
		OverdueInvoices   int64   `json:"overdue_invoices"`
	}

	query := h.db.DB.WithContext(ctx).Model(&Invoice{}).Where("is_active = ?", true)

	if err := query.Count(&summary.TotalInvoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count invoices"})
		return
	}

	if err := query.Select("COALESCE(SUM(total_amount), 0)").Scan(&summary.TotalAmount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate total amount"})
		return
	}

	if err := query.Select("COALESCE(SUM(paid_amount), 0)").Scan(&summary.PaidAmount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate paid amount"})
		return
	}

	summary.OutstandingAmount = summary.TotalAmount - summary.PaidAmount

	if err := query.Where("payment_status = ?", "paid").Count(&summary.PaidInvoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count paid invoices"})
		return
	}

	if err := query.Where("status = ? AND due_date < ?", "confirmed", time.Now()).Count(&summary.OverdueInvoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count overdue invoices"})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetOutstandingInvoices retrieves overdue invoices
func (h *SalesHandler) GetOutstandingInvoices(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var invoices []Invoice

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Where("status = ? AND due_date < ? AND outstanding_amount > 0 AND is_active = ?",
			"confirmed", time.Now(), true).
		Order("due_date ASC").
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve outstanding invoices"})
		return
	}

	c.JSON(http.StatusOK, invoices)
}

// ==================== PAYMENT HANDLERS ====================

// GetPayments retrieves all payments
func (h *SalesHandler) GetPayments(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var payments []Payment

	query := h.db.DB.WithContext(ctx).Where("is_active = ?", true)

	// Apply filters
	if invoiceID := c.Query("invoice_id"); invoiceID != "" {
		query = query.Where("invoice_id = ?", invoiceID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var total int64
	if err := query.Model(&Payment{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count payments"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetPayment retrieves a specific payment
func (h *SalesHandler) GetPayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var payment Payment

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// CreatePayment creates a new payment
func (h *SalesHandler) CreatePayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var payment Payment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set processed by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		payment.ProcessedBy = userID.(string)
	}

	// Set default status
	payment.Status = "pending"

	if err := h.db.DB.WithContext(ctx).Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	// Update invoice payment status
	h.updateInvoicePaymentStatus(ctx, payment.InvoiceID)

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusCreated, payment)
}

// UpdatePayment updates an existing payment
func (h *SalesHandler) UpdatePayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var payment Payment

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment"})
		return
	}

	var updateData Payment
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	payment.Amount = updateData.Amount
	payment.PaymentMethod = updateData.PaymentMethod
	payment.PaymentReference = updateData.PaymentReference
	payment.Notes = updateData.Notes
	payment.Status = updateData.Status

	if err := h.db.DB.WithContext(ctx).Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	// Update invoice payment status
	h.updateInvoicePaymentStatus(ctx, payment.InvoiceID)

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusOK, payment)
}

// DeletePayment soft deletes a payment
func (h *SalesHandler) DeletePayment(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&Payment{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment"})
		return
	}

	// Update invoice payment status
	invoiceID := c.Query("invoice_id")
	if invoiceID != "" {
		h.updateInvoicePaymentStatus(ctx, invoiceID)
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusNoContent, nil)
}

// GetPaymentsByInvoice retrieves payments for a specific invoice
func (h *SalesHandler) GetPaymentsByInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	invoiceID := c.Param("invoice_id")
	var payments []Payment

	if err := h.db.DB.WithContext(ctx).
		Where("invoice_id = ? AND is_active = ?", invoiceID, true).
		Order("created_at DESC").
		Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice payments"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

// updateInvoicePaymentStatus updates the payment status of an invoice after payment changes
func (h *SalesHandler) updateInvoicePaymentStatus(ctx context.Context, invoiceID string) {
	var invoice Invoice
	if err := h.db.DB.WithContext(ctx).Where("id = ?", invoiceID).First(&invoice).Error; err == nil {
		var totalPaid float64
		h.db.DB.WithContext(ctx).Model(&Payment{}).
			Where("invoice_id = ? AND status = ? AND is_active = ?", invoiceID, "completed", true).
			Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

		invoice.PaidAmount = totalPaid
		invoice.OutstandingAmount = invoice.TotalAmount - totalPaid

		if invoice.OutstandingAmount <= 0 {
			invoice.PaymentStatus = "paid"
			invoice.OutstandingAmount = 0
		} else if totalPaid > 0 {
			invoice.PaymentStatus = "partial_paid"
		} else {
			invoice.PaymentStatus = "unpaid"
		}

		h.db.DB.WithContext(ctx).Save(&invoice)
	}
}

// ==================== SALES ORDER HANDLERS ====================

// GetSalesOrders retrieves all sales orders
func (h *SalesHandler) GetSalesOrders(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var orders []SalesOrder

	query := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Model(&SalesOrder{}).
		Where("is_active = ?", true)

	// Apply filters
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count sales orders"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetSalesOrder retrieves a specific sales order
func (h *SalesHandler) GetSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var order SalesOrder

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Where("id = ? AND is_active = ?", id, true).
		First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sales order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales order"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// CreateSalesOrder creates a new sales order
func (h *SalesHandler) CreateSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var order SalesOrder
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		order.CreatedBy = userID.(string)
	}

	// Set default status
	order.Status = "draft"
	order.PaymentStatus = "unpaid"

	// Calculate totals
	for i := range order.Items {
		item := &order.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	order.Subtotal = 0
	order.TaxAmount = 0
	order.TotalAmount = 0

	for _, item := range order.Items {
		order.Subtotal += item.Quantity * item.UnitPrice
		order.TaxAmount += item.TaxAmount
		order.TotalAmount += item.TotalAmount
	}

	if err := h.db.DB.WithContext(ctx).Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sales order"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "sales_orders:*")

	c.JSON(http.StatusCreated, order)
}

// UpdateSalesOrder updates an existing sales order
func (h *SalesHandler) UpdateSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var order SalesOrder

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sales order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales order"})
		return
	}

	var updateData SalesOrder
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	order.CustomerID = updateData.CustomerID
	order.PaymentTerms = updateData.PaymentTerms
	order.Notes = updateData.Notes
	order.SalesmanID = updateData.SalesmanID

	// Recalculate totals
	for i := range updateData.Items {
		item := &updateData.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	order.Items = updateData.Items

	order.Subtotal = 0
	order.TaxAmount = 0
	order.TotalAmount = 0

	for _, item := range order.Items {
		order.Subtotal += item.Quantity * item.UnitPrice
		order.TaxAmount += item.TaxAmount
		order.TotalAmount += item.TotalAmount
	}

	if err := h.db.DB.WithContext(ctx).Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sales order"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "sales_orders:*")

	c.JSON(http.StatusOK, order)
}

// DeleteSalesOrder soft deletes a sales order
func (h *SalesHandler) DeleteSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&SalesOrder{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sales order"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "sales_orders:*")

	c.JSON(http.StatusNoContent, nil)
}

// ConvertOrderToInvoice converts a sales order to an invoice
func (h *SalesHandler) ConvertOrderToInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var order SalesOrder

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Where("id = ? AND is_active = ?", id, true).
		First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sales order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales order"})
		return
	}

	// Create invoice from order
	invoice := Invoice{
		CustomerID:     order.CustomerID,
		InvoiceDate:    time.Now(),
		DueDate:        time.Now().AddDate(0, 0, 30), // 30 days
		Status:         "draft",
		PaymentStatus:  "unpaid",
		PaymentTerms:   order.PaymentTerms,
		Notes:          order.Notes,
		SalesmanID:     order.SalesmanID,
		Items:          make([]InvoiceItem, len(order.Items)),
	}

	// Convert order items to invoice items
	for i, item := range order.Items {
		invoice.Items[i] = InvoiceItem{
			ProductID:       item.ProductID,
			ProductName:     item.ProductName,
			ProductCode:     item.ProductCode,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			DiscountPercent: item.DiscountPercent,
			DiscountAmount:  item.DiscountAmount,
			TaxPercent:      item.TaxPercent,
			TaxAmount:       item.TaxAmount,
			TotalAmount:     item.TotalAmount,
			BatchNumber:     item.BatchNumber,
			ExpiryDate:      item.ExpiryDate,
		}
	}

	// Calculate invoice totals
	for i := range invoice.Items {
		item := &invoice.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	invoice.Subtotal = 0
	invoice.TaxAmount = 0
	invoice.TotalAmount = 0

	for _, item := range invoice.Items {
		invoice.Subtotal += item.Quantity * item.UnitPrice
		invoice.TaxAmount += item.TaxAmount
		invoice.TotalAmount += item.TotalAmount
	}

	invoice.OutstandingAmount = invoice.TotalAmount

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		invoice.CreatedBy = userID.(string)
	}

	if err := h.db.DB.WithContext(ctx).Create(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice from order"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "invoices:*")

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sales order converted to invoice successfully",
		"invoice": invoice,
	})
}

// GetOrdersByCustomer retrieves orders for a specific customer
func (h *SalesHandler) GetOrdersByCustomer(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")
	var orders []SalesOrder

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Where("customer_id = ? AND is_active = ?", customerID, true).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve customer orders"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// ==================== INVOICE SERIES HANDLERS ====================

// GetInvoiceSeries retrieves all invoice series
func (h *SalesHandler) GetInvoiceSeries(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var series []InvoiceSeries

	if err := h.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("name").Find(&series).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice series"})
		return
	}

	c.JSON(http.StatusOK, series)
}

// GetInvoiceSeriesByID retrieves a specific invoice series
func (h *SalesHandler) GetInvoiceSeriesByID(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var series InvoiceSeries

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&series).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice series not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice series"})
		return
	}

	c.JSON(http.StatusOK, series)
}

// CreateInvoiceSeries creates a new invoice series
func (h *SalesHandler) CreateInvoiceSeries(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var series InvoiceSeries
	if err := c.ShouldBindJSON(&series); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.DB.WithContext(ctx).Create(&series).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice series"})
		return
	}

	c.JSON(http.StatusCreated, series)
}

// UpdateInvoiceSeries updates an existing invoice series
func (h *SalesHandler) UpdateInvoiceSeries(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var series InvoiceSeries

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&series).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice series not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice series"})
		return
	}

	var updateData InvoiceSeries
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	series.Name = updateData.Name
	series.Prefix = updateData.Prefix
	series.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&series).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice series"})
		return
	}

	c.JSON(http.StatusOK, series)
}

// DeleteInvoiceSeries soft deletes an invoice series
func (h *SalesHandler) DeleteInvoiceSeries(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&InvoiceSeries{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice series"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ==================== RETURN HANDLERS ====================

// GetReturns retrieves all returns
func (h *SalesHandler) GetReturns(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var returns []Return

	query := h.db.DB.WithContext(ctx).
		Preload("Invoice").
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Model(&Return{}).
		Where("is_active = ?", true)

	// Apply filters
	if invoiceID := c.Query("invoice_id"); invoiceID != "" {
		query = query.Where("invoice_id = ?", invoiceID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count returns"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&returns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve returns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"returns": returns,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetReturn retrieves a specific return
func (h *SalesHandler) GetReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var returnRecord Return

	if err := h.db.DB.WithContext(ctx).
		Preload("Invoice").
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Where("id = ? AND is_active = ?", id, true).
		First(&returnRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Return not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve return"})
		return
	}

	c.JSON(http.StatusOK, returnRecord)
}

// CreateReturn creates a new return
func (h *SalesHandler) CreateReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var returnRecord Return
	if err := c.ShouldBindJSON(&returnRecord); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate totals
	for i := range returnRecord.Items {
		item := &returnRecord.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
	}

	returnRecord.Subtotal = 0
	returnRecord.TaxAmount = 0
	returnRecord.TotalAmount = 0

	for _, item := range returnRecord.Items {
		returnRecord.Subtotal += item.Quantity * item.UnitPrice
		returnRecord.TaxAmount += item.TaxAmount
		returnRecord.TotalAmount += item.TotalAmount
	}

	if err := h.db.DB.WithContext(ctx).Create(&returnRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create return"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "returns:*")

	c.JSON(http.StatusCreated, returnRecord)
}

// UpdateReturn updates an existing return
func (h *SalesHandler) UpdateReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var returnRecord Return

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&returnRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Return not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve return"})
		return
	}

	var updateData Return
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	returnRecord.Reason = updateData.Reason
	returnRecord.Notes = updateData.Notes
	returnRecord.RefundMethod = updateData.RefundMethod
	returnRecord.RefundReference = updateData.RefundReference

	// Recalculate totals
	for i := range updateData.Items {
		item := &updateData.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
	}

	returnRecord.Items = updateData.Items

	returnRecord.Subtotal = 0
	returnRecord.TaxAmount = 0
	returnRecord.TotalAmount = 0

	for _, item := range returnRecord.Items {
		returnRecord.Subtotal += item.Quantity * item.UnitPrice
		returnRecord.TaxAmount += item.TaxAmount
		returnRecord.TotalAmount += item.TotalAmount
	}

	if err := h.db.DB.WithContext(ctx).Save(&returnRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update return"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "returns:*")

	c.JSON(http.StatusOK, returnRecord)
}

// DeleteReturn soft deletes a return
func (h *SalesHandler) DeleteReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&Return{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete return"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "returns:*")

	c.JSON(http.StatusNoContent, nil)
}

// ApproveReturn approves a return for processing
func (h *SalesHandler) ApproveReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	userID, _ := c.Get("user_id")

	updates := map[string]interface{}{
		"status":     "approved",
		"approved_by": userID.(string),
		"approved_at": time.Now(),
		"updated_at": time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Model(&Return{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve return"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "returns:*")

	c.JSON(http.StatusOK, gin.H{"message": "Return approved successfully"})
}

// GetReturnsByInvoice retrieves returns for a specific invoice
func (h *SalesHandler) GetReturnsByInvoice(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	invoiceID := c.Param("invoice_id")
	var returns []Return

	if err := h.db.DB.WithContext(ctx).
		Preload("Customer").
		Where("invoice_id = ? AND is_active = ?", invoiceID, true).
		Order("created_at DESC").
		Find(&returns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice returns"})
		return
	}

	c.JSON(http.StatusOK, returns)
}

// ==================== COMMISSION HANDLERS ====================

// GetCommissions retrieves all commissions
func (h *SalesHandler) GetCommissions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var commissions []SalesmanCommission

	query := h.db.DB.WithContext(ctx).
		Preload("Invoice").
		Model(&SalesmanCommission{}).
		Where("is_active = ?", true)

	// Apply filters
	if salesmanID := c.Query("salesman_id"); salesmanID != "" {
		query = query.Where("salesman_id = ?", salesmanID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count commissions"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&commissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve commissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"commissions": commissions,
		"total":       total,
		"limit":       limit,
		"offset":      offset,
	})
}

// GetCommission retrieves a specific commission
func (h *SalesHandler) GetCommission(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var commission SalesmanCommission

	if err := h.db.DB.WithContext(ctx).
		Preload("Invoice").
		Where("id = ? AND is_active = ?", id, true).
		First(&commission).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Commission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve commission"})
		return
	}

	c.JSON(http.StatusOK, commission)
}

// CreateCommission creates a new commission
func (h *SalesHandler) CreateCommission(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var commission SalesmanCommission
	if err := c.ShouldBindJSON(&commission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.DB.WithContext(ctx).Create(&commission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create commission"})
		return
	}

	c.JSON(http.StatusCreated, commission)
}

// UpdateCommission updates an existing commission
func (h *SalesHandler) UpdateCommission(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var commission SalesmanCommission

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&commission).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Commission not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve commission"})
		return
	}

	var updateData SalesmanCommission
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	commission.CommissionAmount = updateData.CommissionAmount
	commission.CommissionPercent = updateData.CommissionPercent
	commission.CalculationBasis = updateData.CalculationBasis
	commission.Notes = updateData.Notes

	if err := h.db.DB.WithContext(ctx).Save(&commission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update commission"})
		return
	}

	c.JSON(http.StatusOK, commission)
}

// DeleteCommission soft deletes a commission
func (h *SalesHandler) DeleteCommission(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&SalesmanCommission{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete commission"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ApproveCommission approves a commission for payment
func (h *SalesHandler) ApproveCommission(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	userID, _ := c.Get("user_id")

	updates := map[string]interface{}{
		"status":     "approved",
		"approved_by": userID.(string),
		"approved_at": time.Now(),
		"updated_at": time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Model(&SalesmanCommission{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve commission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Commission approved successfully"})
}

// GetCommissionsBySalesman retrieves commissions for a specific salesman
func (h *SalesHandler) GetCommissionsBySalesman(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	salesmanID := c.Param("salesman_id")
	var commissions []SalesmanCommission

	if err := h.db.DB.WithContext(ctx).
		Preload("Invoice").
		Where("salesman_id = ? AND is_active = ?", salesmanID, true).
		Order("created_at DESC").
		Find(&commissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve salesman commissions"})
		return
	}

	c.JSON(http.StatusOK, commissions)
}
