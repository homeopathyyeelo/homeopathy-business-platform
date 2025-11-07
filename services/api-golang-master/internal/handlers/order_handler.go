package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderHandler struct {
	DB *gorm.DB
}

func NewOrderHandler(db *gorm.DB) *OrderHandler {
	return &OrderHandler{DB: db}
}

type Order struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderNumber     string     `json:"order_number" gorm:"uniqueIndex"`
	CustomerID      uuid.UUID  `json:"customer_id" gorm:"index"`
	CustomerName    string     `json:"customer_name"`
	CustomerEmail   string     `json:"customer_email"`
	CustomerPhone   string     `json:"customer_phone"`
	Status          string     `json:"status" gorm:"index;default:'pending'"` // pending, confirmed, processing, shipped, delivered, cancelled, returned
	PaymentStatus   string     `json:"payment_status" gorm:"index;default:'pending'"` // pending, paid, failed, refunded
	PaymentMethod   string     `json:"payment_method"`
	Subtotal        float64    `json:"subtotal"`
	TaxAmount       float64    `json:"tax_amount"`
	DiscountAmount  float64    `json:"discount_amount"`
	ShippingAmount  float64    `json:"shipping_amount"`
	TotalAmount     float64    `json:"total_amount"`
	ShippingAddress string     `json:"shipping_address"`
	ShippingCity    string     `json:"shipping_city"`
	ShippingState   string     `json:"shipping_state"`
	ShippingPincode string     `json:"shipping_pincode"`
	ShippingCountry string     `json:"shipping_country" gorm:"default:'India'"`
	BillingAddress  string     `json:"billing_address"`
	Notes           string     `json:"notes"`
	InternalNotes   string     `json:"internal_notes"`
	TrackingNumber  string     `json:"tracking_number"`
	CourierName     string     `json:"courier_name"`
	Metadata        string     `json:"metadata" gorm:"type:jsonb"`
	ConfirmedAt     *time.Time `json:"confirmed_at"`
	ShippedAt       *time.Time `json:"shipped_at"`
	DeliveredAt     *time.Time `json:"delivered_at"`
	CancelledAt     *time.Time `json:"cancelled_at"`
	CreatedAt       time.Time  `json:"created_at" gorm:"index"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type OrderItem struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID      uuid.UUID `json:"order_id" gorm:"index"`
	ProductID    uuid.UUID `json:"product_id" gorm:"index"`
	ProductName  string    `json:"product_name"`
	ProductSKU   string    `json:"product_sku"`
	ProductImage string    `json:"product_image"`
	Quantity     int       `json:"quantity"`
	UnitPrice    float64   `json:"unit_price"`
	Discount     float64   `json:"discount"`
	TaxRate      float64   `json:"tax_rate"`
	TaxAmount    float64   `json:"tax_amount"`
	TotalPrice   float64   `json:"total_price"`
	Notes        string    `json:"notes"`
	Metadata     string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type OrderStatusHistory struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	OrderID    uuid.UUID  `json:"order_id" gorm:"index"`
	FromStatus string     `json:"from_status"`
	ToStatus   string     `json:"to_status"`
	ChangedBy  *uuid.UUID `json:"changed_by"`
	Notes      string     `json:"notes"`
	CreatedAt  time.Time  `json:"created_at"`
}

// Get all orders
func (h *OrderHandler) GetOrders(c *gin.Context) {
	var orders []Order
	query := h.DB.Model(&Order{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	query.Order("created_at DESC").Limit(100).Find(&orders)
	c.JSON(http.StatusOK, gin.H{"success": true, "orders": orders})
}

// Get single order
func (h *OrderHandler) GetOrder(c *gin.Context) {
	id := c.Param("id")
	var order Order
	
	if err := h.DB.Preload("Items").First(&order, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "order": order})
}

// Create order
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var order Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order.ID = uuid.New()
	order.OrderNumber = generateOrderNumber()
	order.Status = "pending"
	order.PaymentStatus = "pending"

	if err := h.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "order": order})
}

// Update order
func (h *OrderHandler) UpdateOrder(c *gin.Context) {
	id := c.Param("id")
	var order Order
	
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&order).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "order": order})
}

// Update order status
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
		Notes  string `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order Order
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	oldStatus := order.Status
	order.Status = req.Status

	// Update timestamps
	now := time.Now()
	switch req.Status {
	case "confirmed":
		order.ConfirmedAt = &now
	case "shipped":
		order.ShippedAt = &now
	case "delivered":
		order.DeliveredAt = &now
	case "cancelled":
		order.CancelledAt = &now
	}

	h.DB.Save(&order)

	// Create status history
	history := OrderStatusHistory{
		OrderID:    order.ID,
		FromStatus: oldStatus,
		ToStatus:   req.Status,
		Notes:      req.Notes,
	}
	h.DB.Create(&history)

	c.JSON(http.StatusOK, gin.H{"success": true, "order": order})
}

// Cancel order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	id := c.Param("id")
	var order Order
	
	if err := h.DB.First(&order, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	now := time.Now()
	order.Status = "cancelled"
	order.CancelledAt = &now
	h.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Order cancelled"})
}

func generateOrderNumber() string {
	return "ORD-" + time.Now().Format("20060102-150405")
}
