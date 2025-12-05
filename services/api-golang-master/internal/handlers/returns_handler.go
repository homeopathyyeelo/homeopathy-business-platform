package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// ReturnsHandler handles sales returns and credit notes
type ReturnsHandler struct {
	db             *gorm.DB
	returnsService *services.ReturnsService
}

// NewReturnsHandler creates a new returns handler
func NewReturnsHandler(db *gorm.DB) *ReturnsHandler {
	return &ReturnsHandler{
		db:             db,
		returnsService: services.NewReturnsService(db),
	}
}

// CheckEligibility checks if an invoice is eligible for return
// GET /api/erp/sales/invoices/:invoiceNo/eligible-for-return
func (h *ReturnsHandler) CheckEligibility(c *gin.Context) {
	invoiceNo := c.Param("invoiceNo")

	// Fetch invoice
	var invoice struct {
		ID            string    `gorm:"column:id"`
		InvoiceNo     string    `gorm:"column:invoice_no"`
		InvoiceDate   time.Time `gorm:"column:invoice_date"`
		Status        string    `gorm:"column:status"`
		TotalAmount   float64   `gorm:"column:total_amount"`
		PaymentStatus string    `gorm:"column:payment_status"`
	}

	err := h.db.Table("sales_invoices").
		Where("invoice_no = ?", invoiceNo).
		First(&invoice).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"eligible": false,
				"reason":   "Invoice not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice"})
		return
	}

	// Check if cancelled
	if invoice.Status == "CANCELLED" || invoice.Status == "VOID" {
		c.JSON(http.StatusOK, gin.H{
			"eligible": false,
			"reason":   "Invoice is cancelled or void",
		})
		return
	}

	// Check return time window (30 days)
	daysSinceInvoice := time.Since(invoice.InvoiceDate).Hours() / 24
	requiresApproval := daysSinceInvoice > 30

	// Fetch invoice items with return eligibility
	type ItemEligibility struct {
		ID              string  `gorm:"column:id"`
		ProductID       string  `gorm:"column:product_id"`
		ProductName     string  `gorm:"column:product_name"`
		SKU             string  `gorm:"column:sku"`
		BatchID         string  `gorm:"column:batch_id"`
		BatchNumber     string  `gorm:"column:batch_number"`
		Quantity        float64 `gorm:"column:quantity"`
		UnitPrice       float64 `gorm:"column:unit_price"`
		TotalPrice      float64 `gorm:"column:total_price"`
		AlreadyReturned float64 `gorm:"column:already_returned"`
		AvailableReturn float64 `gorm:"column:available_return"`
	}

	var items []ItemEligibility
	err = h.db.Raw(`
		SELECT 
			sii.id,
			sii.product_id,
			sii.product_name,
			sii.sku,
			sii.batch_id,
			sii.batch_number,
			sii.quantity,
			sii.unit_price,
			sii.total_price,
			COALESCE(SUM(sri.quantity_returned), 0) as already_returned,
			sii.quantity - COALESCE(SUM(sri.quantity_returned), 0) as available_return
		FROM sales_invoice_items sii
		LEFT JOIN sales_return_items sri ON sri.original_sale_item_id = sii.id
		WHERE sii.invoice_id = ?
		GROUP BY sii.id, sii.product_id, sii.product_name, sii.sku, sii.batch_id, 
		         sii.batch_number, sii.quantity, sii.unit_price, sii.total_price
		HAVING sii.quantity - COALESCE(SUM(sri.quantity_returned), 0) > 0
	`, invoice.ID).Scan(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"eligible":         len(items) > 0,
		"requiresApproval": requiresApproval,
		"daysSinceInvoice": int(daysSinceInvoice),
		"invoice":          invoice,
		"eligibleItems":    items,
	})
}

// CreateReturn creates a new sales return
// POST /api/erp/sales/returns
func (h *ReturnsHandler) CreateReturn(c *gin.Context) {
	var req services.CreateReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data", "details": err.Error()})
		return
	}

	// Validate required fields
	if req.OriginalInvoiceNo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Original invoice number is required"})
		return
	}

	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one item must be returned"})
		return
	}

	// Create return
	returnDoc, err := h.returnsService.CreateReturn(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    returnDoc,
		"message": "Return created successfully",
	})
}

// GetReturns lists all returns with filters
// GET /api/erp/sales/returns
func (h *ReturnsHandler) GetReturns(c *gin.Context) {
	customerID := c.Query("customer_id")
	status := c.Query("status")
	refundStatus := c.Query("refund_status")

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

	returns, total, err := h.returnsService.GetReturns(customerID, status, refundStatus, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch returns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      returns,
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetReturnByID gets a single return with items
// GET /api/erp/sales/returns/:id
func (h *ReturnsHandler) GetReturnByID(c *gin.Context) {
	id := c.Param("id")

	returnDoc, items, err := h.returnsService.GetReturnByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Return not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch return"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"return": returnDoc,
			"items":  items,
		},
	})
}

// ApproveReturn approves a return that requires approval
// POST /api/erp/sales/returns/:id/approve
func (h *ReturnsHandler) ApproveReturn(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		ApprovedBy    string `json:"approvedBy" binding:"required"`
		ApprovalNotes string `json:"approvalNotes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.returnsService.ApproveReturn(id, req.ApprovedBy, req.ApprovalNotes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Return approved successfully",
	})
}

// ProcessRefund processes the refund for a return
// POST /api/erp/sales/returns/:id/process-refund
func (h *ReturnsHandler) ProcessRefund(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		RefundReference string `json:"refundReference" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.returnsService.ProcessRefund(id, req.RefundReference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Refund processed successfully",
	})
}

// GetFraudAlerts gets customers flagged for serial returns
// GET /api/erp/sales/returns/fraud-alerts
func (h *ReturnsHandler) GetFraudAlerts(c *gin.Context) {
	// Query customers with multiple returns in last 60 days
	type FraudAlert struct {
		CustomerID     string    `gorm:"column:customer_id"`
		CustomerName   string    `gorm:"column:customer_name"`
		CustomerPhone  string    `gorm:"column:customer_phone"`
		ReturnCount    int       `gorm:"column:return_count"`
		TotalReturned  float64   `gorm:"column:total_returned"`
		LastReturnDate time.Time `gorm:"column:last_return_date"`
	}

	var alerts []FraudAlert
	err := h.db.Raw(`
		SELECT 
			customer_id,
			customer_name,
			customer_phone,
			COUNT(*) as return_count,
			SUM(total_amount) as total_returned,
			MAX(return_date) as last_return_date
		FROM sales_returns
		WHERE return_date >= NOW() - INTERVAL '60 days'
		  AND customer_id IS NOT NULL
		GROUP BY customer_id, customer_name, customer_phone
		HAVING COUNT(*) >= 3
		ORDER BY return_count DESC, total_returned DESC
	`).Scan(&alerts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fraud alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"count":   len(alerts),
	})
}

// GetStats returns statistics for returns
// GET /api/erp/sales/returns/stats
func (h *ReturnsHandler) GetStats(c *gin.Context) {
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

	stats, err := h.returnsService.GetReturnStats(dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
