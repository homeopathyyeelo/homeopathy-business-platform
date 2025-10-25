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

// PurchaseHandler handles all purchase-related operations
type PurchaseHandler struct {
	purchaseService *services.PurchaseService
	vendorService   *services.VendorService
	productService  *services.ProductService
}

// NewPurchaseHandler creates a new purchase handler
func NewPurchaseHandler() *PurchaseHandler {
	return &PurchaseHandler{
		purchaseService: services.NewPurchaseService(),
		vendorService:   services.NewVendorService(),
		productService:  services.NewProductService(),
	}
}

// ListPurchaseOrders returns paginated list of purchase orders
func (h *PurchaseHandler) ListPurchaseOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	vendorID := c.Query("vendor_id")
	status := c.Query("status")

	orders, total, err := h.purchaseService.ListPurchaseOrders(page, limit, search, vendorID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch purchase orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPurchaseOrder returns a single purchase order by ID
func (h *PurchaseHandler) GetPurchaseOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	order, err := h.purchaseService.GetPurchaseOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// CreatePurchaseOrder creates a new purchase order
func (h *PurchaseHandler) CreatePurchaseOrder(c *gin.Context) {
	var req CreatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate vendor
	if _, err := h.vendorService.GetVendorByID(req.VendorID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vendor ID"})
		return
	}

	// Validate products and calculate totals
	var items []models.PurchaseOrderItem
	var subtotal, taxAmount, totalAmount float64

	for _, item := range req.Items {
		if _, err := h.productService.GetProductByID(item.ProductID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID: " + item.ProductID})
			return
		}

		itemTotal := float64(item.Quantity) * item.UnitPrice
		taxTotal := itemTotal * (item.TaxRate / 100)
		total := itemTotal + taxTotal

		poItem := models.PurchaseOrderItem{
			ID:          uuid.New().String(),
			ProductID:   item.ProductID,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Discount:    item.Discount,
			TaxRate:     item.TaxRate,
			TotalAmount: total,
			CreatedAt:   time.Now(),
		}

		items = append(items, poItem)
		subtotal += itemTotal
		taxAmount += taxTotal
		totalAmount += total
	}

	// Generate order number
	orderNumber := "PO" + time.Now().Format("20060102") + strconv.Itoa(int(time.Now().Unix()%1000))

	order := &models.PurchaseOrder{
		ID:             uuid.New().String(),
		OrderNumber:    orderNumber,
		VendorID:       req.VendorID,
		Status:         "DRAFT",
		OrderDate:      time.Now(),
		ExpectedDate:   req.ExpectedDate,
		Subtotal:       subtotal,
		TaxAmount:      taxAmount,
		DiscountAmount: req.DiscountAmount,
		TotalAmount:    totalAmount - req.DiscountAmount,
		PaymentTermsID: req.PaymentTermsID,
		Notes:          req.Notes,
		CreatedBy:      c.GetString("user_id"),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Items:          items,
	}

	if err := h.purchaseService.CreatePurchaseOrder(order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create purchase order"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Purchase order created successfully",
		"order":   order,
	})
}

// UpdatePurchaseOrderStatus updates order status
func (h *PurchaseHandler) UpdatePurchaseOrderStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	var req UpdatePurchaseOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.purchaseService.UpdatePurchaseOrderStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Purchase order status updated successfully"})
}

// ReceivePurchaseOrder processes goods receipt
func (h *PurchaseHandler) ReceivePurchaseOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order ID is required"})
		return
	}

	var req ReceivePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process receipt for each item
	for _, item := range req.Items {
		receiptItem := &models.PurchaseReceiptItem{
			ID:                uuid.New().String(),
			PurchaseReceiptID: req.ReceiptID,
			ProductID:         item.ProductID,
			Quantity:          item.Quantity,
			UnitCost:          item.UnitCost,
			TotalCost:         float64(item.Quantity) * item.UnitCost,
			BatchNumber:       item.BatchNumber,
			ExpiryDate:        item.ExpiryDate,
			CreatedAt:         time.Now(),
		}

		if err := h.purchaseService.CreatePurchaseReceiptItem(receiptItem); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process receipt"})
			return
		}

		// Update product stock
		h.productService.UpdateStock(item.ProductID, item.Quantity)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Purchase order received successfully"})
}

// Request/Response structs
type CreatePurchaseOrderRequest struct {
	VendorID       string                        `json:"vendorId" binding:"required"`
	ExpectedDate   *time.Time                    `json:"expectedDate"`
	PaymentTermsID string                        `json:"paymentTermsId"`
	DiscountAmount float64                       `json:"discountAmount"`
	Notes          string                        `json:"notes"`
	Items          []CreatePurchaseOrderItemRequest `json:"items" binding:"required"`
}

type CreatePurchaseOrderItemRequest struct {
	ProductID string  `json:"productId" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	UnitPrice float64 `json:"unitPrice" binding:"required"`
	Discount  float64 `json:"discount"`
	TaxRate   float64 `json:"taxRate"`
}

type UpdatePurchaseOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type ReceivePurchaseOrderRequest struct {
	ReceiptID string                           `json:"receiptId" binding:"required"`
	Items     []CreatePurchaseReceiptItemRequest `json:"items" binding:"required"`
}

type CreatePurchaseReceiptItemRequest struct {
	ProductID   string     `json:"productId" binding:"required"`
	Quantity    int        `json:"quantity" binding:"required,min=1"`
	UnitCost    float64    `json:"unitCost" binding:"required"`
	BatchNumber string     `json:"batchNumber"`
	ExpiryDate  *time.Time `json:"expiryDate"`
}
