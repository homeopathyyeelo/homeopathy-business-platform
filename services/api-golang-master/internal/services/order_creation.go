package services

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrderCreationService handles automatic order creation from sales
type OrderCreationService struct {
	db *gorm.DB
}

// NewOrderCreationService creates a new order creation service
func NewOrderCreationService(db *gorm.DB) *OrderCreationService {
	return &OrderCreationService{db: db}
}

// InvoiceToOrderRequest contains data from invoice to create order
type InvoiceToOrderRequest struct {
	InvoiceID     string
	InvoiceNo     string
	CustomerID    *string
	CustomerName  string
	CustomerPhone string
	CustomerEmail string
	TotalAmount   float64
	Items         []OrderItemRequest
	PaymentMethod string
	PaymentStatus string
}

// OrderItemRequest represents an order item
type OrderItemRequest struct {
	ProductID   string
	ProductName string
	SKU         string
	BatchID     *string
	BatchNumber string
	Quantity    float64
	UnitPrice   float64
	TotalPrice  float64
}

// CreateOrderFromInvoice creates an order automatically when invoice is created
func (s *OrderCreationService) CreateOrderFromInvoice(tx *gorm.DB, req InvoiceToOrderRequest) (map[string]interface{}, error) {
	// Generate order number
	orderNo := "ORD-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]

	orderID := uuid.New().String()

	// Create order with direct SQL to avoid model dependency
	orderData := map[string]interface{}{
		"id":             orderID,
		"order_number":   orderNo,
		"customer_id":    req.CustomerID,
		"customer_name":  req.CustomerName,
		"customer_phone": req.CustomerPhone,
		"customer_email": req.CustomerEmail,
		"order_date":     time.Now(),
		"status":         "COMPLETED", // Auto-mark as completed since it's from POS
		"total_amount":   req.TotalAmount,
		"payment_method": req.PaymentMethod,
		"payment_status": req.PaymentStatus,
		"source":         "POS",
		"created_at":     time.Now(),
		"updated_at":     time.Now(),
	}

	// Insert order
	if err := tx.Table("orders").Create(orderData).Error; err != nil {
		return nil, err
	}

	// Create order items
	for _, item := range req.Items {
		orderItemData := map[string]interface{}{
			"id":           uuid.New().String(),
			"order_id":     orderID,
			"product_id":   item.ProductID,
			"product_name": item.ProductName,
			"product_sku":  item.SKU,
			"batch_id":     item.BatchID,
			"batch_number": item.BatchNumber,
			"quantity":     item.Quantity,
			"unit_price":   item.UnitPrice,
			"total_price":  item.TotalPrice,
			"created_at":   time.Now(),
			"updated_at":   time.Now(),
		}

		if err := tx.Table("order_items").Create(orderItemData).Error; err != nil {
			return nil, err
		}
	}

	// Return order summary
	result := map[string]interface{}{
		"id":          orderID,
		"orderNumber": orderNo,
		"totalAmount": req.TotalAmount,
		"status":      "COMPLETED",
		"itemCount":   len(req.Items),
	}

	return result, nil
}
