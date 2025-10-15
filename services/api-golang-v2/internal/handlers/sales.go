package handlers

import (
	"net/http"
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"github.com/google/uuid"
)

// SalesHandler handles all sales-related operations
type SalesHandler struct {
	salesService    *services.SalesService
	productService  *services.ProductService
	customerService *services.CustomerService
	paymentService  *services.PaymentService
}

// NewSalesHandler creates a new sales handler
func NewSalesHandler() *SalesHandler {
	return &SalesHandler{
		salesService:    services.NewSalesService(),
		productService:  services.NewProductService(),
		customerService: services.NewCustomerService(),
		paymentService:  services.NewPaymentService(),
	}
}

// ListSales returns paginated list of sales orders
func (h *SalesHandler) ListSales(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	customerID := c.Query("customer_id")
	status := c.Query("status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	sales, total, err := h.salesService.ListSales(page, limit, search, customerID, status, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales": sales,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetSalesOrder returns a single sales order by ID
func (h *SalesHandler) GetSalesOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sales order ID is required"})
		return
	}

	order, err := h.salesService.GetSalesOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sales order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}

// CreateSalesOrder creates a new sales order (POS)
func (h *SalesHandler) CreateSalesOrder(c *gin.Context) {
	var req CreateSalesOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate customer
	if _, err := h.customerService.GetCustomerByID(req.CustomerID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	// Validate products and calculate totals
	var items []models.SalesOrderItem
	var subtotal, taxAmount, totalAmount float64

	for _, item := range req.Items {
		product, err := h.productService.GetProductByID(item.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID: " + item.ProductID})
			return
		}

		if product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock for product: " + product.Name})
			return
		}

		itemTotal := float64(item.Quantity) * item.UnitPrice
		taxTotal := itemTotal * (item.TaxRate / 100)
		total := itemTotal + taxTotal

		salesItem := models.SalesOrderItem{
			ID:          uuid.New().String(),
			ProductID:   item.ProductID,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Discount:    item.Discount,
			TaxRate:     item.TaxRate,
			TotalAmount: total,
			CreatedAt:   time.Now(),
		}

		items = append(items, salesItem)
		subtotal += itemTotal
		taxAmount += taxTotal
		totalAmount += total
	}

	// Apply order-level discount
	if req.DiscountAmount > 0 {
		totalAmount -= req.DiscountAmount
	}

	// Generate order number
	orderNumber := "SO" + time.Now().Format("20060102") + strconv.Itoa(int(time.Now().Unix()%1000))

	order := &models.SalesOrder{
		ID:             uuid.New().String(),
		OrderNumber:    orderNumber,
		CustomerID:     req.CustomerID,
		Type:           req.Type,
		Status:         "CONFIRMED",
		OrderDate:      time.Now(),
		Subtotal:       subtotal,
		TaxAmount:      taxAmount,
		DiscountAmount: req.DiscountAmount,
		TotalAmount:    totalAmount,
		PaymentStatus:  req.PaymentStatus,
		ShippingAddress: req.ShippingAddress,
		Notes:          req.Notes,
		CreatedBy:      c.GetString("user_id"),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Items:          items,
	}

	if err := h.salesService.CreateSalesOrder(order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sales order"})
		return
	}

	// Update product stock
	for _, item := range items {
		h.productService.UpdateStock(item.ProductID, -item.Quantity)
	}

	// Add loyalty points if customer exists
	if req.CustomerID != "" {
		points := int(totalAmount / 100) // 1 point per 100 rupees
		h.customerService.AddLoyaltyPoints(req.CustomerID, points)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sales order created successfully",
		"order":   order,
	})
}

// UpdateSalesOrderStatus updates order status
func (h *SalesHandler) UpdateSalesOrderStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sales order ID is required"})
		return
	}

	var req UpdateSalesOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.salesService.UpdateSalesOrderStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}

// CancelSalesOrder cancels a sales order
func (h *SalesHandler) CancelSalesOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sales order ID is required"})
		return
	}

	// Get order details
	order, err := h.salesService.GetSalesOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sales order not found"})
		return
	}

	// Restore stock
	for _, item := range order.Items {
		h.productService.UpdateStock(item.ProductID, item.Quantity)
	}

	// Update order status
	if err := h.salesService.UpdateSalesOrderStatus(id, "CANCELLED"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sales order cancelled successfully"})
}

// GetSalesReport returns sales analytics
func (h *SalesHandler) GetSalesReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	groupBy := c.DefaultQuery("group_by", "day") // day, week, month

	if startDate == "" {
		startDate = time.Now().AddDate(0, -1, 0).Format("2006-01-02") // Last month
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	report, err := h.salesService.GetSalesReport(startDate, endDate, groupBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"report": report,
	})
	c.JSON(http.StatusOK, report)
}

// GetCustomerSalesHistory returns sales history for a customer
func (h *SalesHandler) GetCustomerSalesHistory(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	sales, total, err := h.salesService.GetCustomerSalesHistory(customerID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales": sales,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// Request/Response structs
type CreateSalesOrderRequest struct {
	CustomerID      string                    `json:"customerId" binding:"required"`
	Type            string                    `json:"type" binding:"required"` // B2C, B2B, D2D
	Items           []CreateSalesOrderItemRequest `json:"items" binding:"required"`
	DiscountAmount  float64                   `json:"discountAmount"`
	PaymentStatus   string                    `json:"paymentStatus"`
	ShippingAddress string                    `json:"shippingAddress"`
	Notes           string                    `json:"notes"`
}

type CreateSalesOrderItemRequest struct {
	ProductID string  `json:"productId" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	UnitPrice float64 `json:"unitPrice" binding:"required"`
	Discount  float64 `json:"discount"`
	TaxRate   float64 `json:"taxRate"`
}

type UpdateSalesOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
