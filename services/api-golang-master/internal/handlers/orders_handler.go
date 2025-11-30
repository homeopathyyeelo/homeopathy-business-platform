package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// OrdersHandler handles order-related requests
type OrdersHandler struct {
	db             *gorm.DB
	paymentService *services.PaymentTrackingService
}

// NewOrdersHandler creates a new orders handler
func NewOrdersHandler(db *gorm.DB) *OrdersHandler {
	return &OrdersHandler{
		db:             db,
		paymentService: services.NewPaymentTrackingService(db),
	}
}

// OrderListItem represents an order in the list view
type OrderListItem struct {
	ID            string    `json:"id"`
	OrderNumber   string    `json:"orderNumber"`
	CustomerID    *string   `json:"customerId"`
	CustomerName  string    `json:"customerName"`
	CustomerPhone string    `json:"customerPhone"`
	OrderDate     time.Time `json:"orderDate"`
	Status        string    `json:"status"`
	Source        string    `json:"source"`
	TotalAmount   float64   `json:"totalAmount"`
	PaidAmount    float64   `json:"paidAmount"`
	PendingAmount float64   `json:"pendingAmount"`
	PaymentStatus string    `json:"paymentStatus"`
	PaymentMethod string    `json:"paymentMethod"`
	CreatedAt     time.Time `json:"createdAt"`
}

// GetOrders returns list of orders with filters
// GET /api/orders?status=&paymentStatus=&source=&startDate=&endDate=&search=&page=&limit=
func (h *OrdersHandler) GetOrders(c *gin.Context) {
	// Query parameters
	status := c.Query("status")
	paymentStatus := c.Query("paymentStatus")
	source := c.Query("source")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	search := c.Query("search")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	// Build query
	query := h.db.Table("orders").
		Select("id, order_number, customer_id, customer_name, customer_phone, order_date, status, source, total_amount, paid_amount, pending_amount, payment_status, payment_method, created_at")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if source != "" {
		query = query.Where("source = ?", source)
	}
	if startDate != "" {
		query = query.Where("order_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("order_date <= ?", endDate)
	}
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("order_number ILIKE ? OR customer_name ILIKE ? OR customer_phone ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Pagination
	var offset int
	if page != "1" {
		offset = (atoi(page) - 1) * atoi(limit)
	}
	query = query.Offset(offset).Limit(atoi(limit))

	// Fetch orders
	var orders []OrderListItem
	if err := query.Order("order_date DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// GetOrderDetails returns detailed order information with items and payments
// GET /api/orders/:id
func (h *OrdersHandler) GetOrderDetails(c *gin.Context) {
	orderID := c.Param("id")

	// Fetch order
	var order map[string]interface{}
	if err := h.db.Table("orders").Where("id = ?", orderID).Take(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Fetch order items
	var items []map[string]interface{}
	h.db.Table("order_items").Where("order_id = ?", orderID).Find(&items)

	// Fetch payments
	payments, _ := h.paymentService.GetOrderPayments(orderID)

	// Fetch payment summary
	summary, _ := h.paymentService.GetPaymentSummary(orderID)

	c.JSON(http.StatusOK, gin.H{
		"order":          order,
		"items":          items,
		"payments":       payments,
		"paymentSummary": summary,
	})
}

// GetOrderPayments returns payment history for an order
// GET /api/orders/:id/payments
func (h *OrdersHandler) GetOrderPayments(c *gin.Context) {
	orderID := c.Param("id")

	payments, err := h.paymentService.GetOrderPayments(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	summary, _ := h.paymentService.GetPaymentSummary(orderID)

	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"summary":  summary,
	})
}

// RecordPayment records a new payment for an order
// POST /api/orders/:id/payments
func (h *OrdersHandler) RecordPayment(c *gin.Context) {
	orderID := c.Param("id")

	var req services.RecordPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.OrderID = orderID
	// TODO: Get user from auth context
	req.CreatedBy = "System"

	payment, err := h.paymentService.RecordPayment(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch updated summary
	summary, _ := h.paymentService.GetPaymentSummary(orderID)

	c.JSON(http.StatusOK, gin.H{
		"payment": payment,
		"summary": summary,
		"message": "Payment recorded successfully",
	})
}

// Helper function to convert string to int
func atoi(s string) int {
	var result int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			result = result*10 + int(c-'0')
		}
	}
	return result
}
