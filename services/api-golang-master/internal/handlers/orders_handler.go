package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// OrdersHandler handles order-related requests
type OrdersHandler struct {
	db             *gorm.DB
	paymentService *services.PaymentTrackingService
	thermalPrinter *services.ThermalPrinterService
}

// NewOrdersHandler creates a new orders handler
func NewOrdersHandler(db *gorm.DB) *OrdersHandler {
	return &OrdersHandler{
		db:             db,
		paymentService: services.NewPaymentTrackingService(db),
		thermalPrinter: services.NewThermalPrinterService(),
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

// PrintOrderThermal generates thermal print for an order
// POST /api/erp/orders/:id/print
func (h *OrdersHandler) PrintOrderThermal(c *gin.Context) {
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

	// Build print data
	printData := services.OrderPrintData{
		OrderNumber:    order["order_number"].(string),
		InvoiceNumber:  getStringField(order, "invoice_number"),
		OrderDate:      order["order_date"].(time.Time),
		CustomerName:   getStringField(order, "customer_name"),
		CustomerPhone:  getStringField(order, "customer_phone"),
		Subtotal:       getFloatField(order, "subtotal"),
		DiscountAmount: getFloatField(order, "discount_amount"),
		TaxAmount:      getFloatField(order, "tax_amount"),
		TotalAmount:    getFloatField(order, "total_amount"),
		PaidAmount:     getFloatField(order, "paid_amount"),
		PendingAmount:  getFloatField(order, "pending_amount"),
		PaymentMethod:  getStringField(order, "payment_method"),
		PaymentStatus:  getStringField(order, "payment_status"),
		Source:         getStringField(order, "source"),
		Notes:          getStringField(order, "notes"),
		CompanyName:    "Yeelo Homeopathy",
		CompanyPhone:   "8478019973",
		CompanyAddress: "Sohna, Gurugram, Haryana",
		PaperSize:      h.getPrinterPaperSize(),
		CustomerGST:    getStringField(order, "customer_gst_number"),
	}

	// Convert items
	for _, item := range items {
		printData.Items = append(printData.Items, services.OrderItemPrint{
			ProductName:     getStringField(item, "product_name"),
			SKU:             getStringField(item, "sku"),
			Quantity:        getFloatField(item, "quantity"),
			UnitPrice:       getFloatField(item, "unit_price"),
			Discount:        getFloatField(item, "discount_amount"),
			DiscountPercent: getFloatField(item, "discount_percent"),
			TaxPercent:      getFloatField(item, "tax_percent"),
			TaxAmount:       getFloatField(item, "tax_amount"),
			Total:           getFloatField(item, "total_price"),
		})
	}

	// Generate ESC/POS commands
	escposData := h.thermalPrinter.GenerateOrderSlip(printData)

	// Return both raw ESC/POS and preview text
	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"escposData":  escposData,
		"previewText": h.thermalPrinter.FormatForDisplay(escposData),
		"orderNumber": printData.OrderNumber,
	})
}

// PrintInvoiceThermal generates thermal print for an invoice
// POST /api/erp/invoices/:invoiceNo/print
func (h *OrdersHandler) PrintInvoiceThermal(c *gin.Context) {
	invoiceNo := c.Param("invoiceNo")

	// Fetch invoice from sales_invoices
	var invoice map[string]interface{}
	if err := h.db.Table("sales_invoices").Where("invoice_no = ?", invoiceNo).Take(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Fetch invoice items
	var items []map[string]interface{}
	h.db.Table("sales_invoice_items").Where("invoice_id = ?", invoice["id"]).Find(&items)

	// Build print data
	printData := services.OrderPrintData{
		InvoiceNumber:  invoiceNo,
		OrderDate:      invoice["invoice_date"].(time.Time),
		CustomerName:   getStringField(invoice, "customer_name"),
		CustomerPhone:  getStringField(invoice, "customer_phone"),
		Subtotal:       getFloatField(invoice, "subtotal"),
		DiscountAmount: getFloatField(invoice, "total_discount"),
		TaxAmount:      getFloatField(invoice, "total_gst"),
		TotalAmount:    getFloatField(invoice, "total_amount"),
		PaidAmount:     getFloatField(invoice, "total_amount"), // Invoices are paid
		PendingAmount:  0,
		PaymentMethod:  getStringField(invoice, "payment_method"),
		PaymentStatus:  "PAID",
		Source:         "POS",
		Notes:          getStringField(invoice, "notes"),
		CompanyName:    "Yeelo Homeopathy",
		CompanyPhone:   "8478019973",
		CompanyAddress: "Sohna, Gurugram, Haryana",
		PaperSize:      h.getPrinterPaperSize(),
		CustomerGST:    getStringField(invoice, "customer_gst_number"),
	}

	// Convert items
	for _, item := range items {
		printData.Items = append(printData.Items, services.OrderItemPrint{
			ProductName:     getStringField(item, "product_name"),
			SKU:             getStringField(item, "sku"),
			Quantity:        getFloatField(item, "quantity"),
			UnitPrice:       getFloatField(item, "unit_price"),
			Discount:        getFloatField(item, "discount_amount"),
			DiscountPercent: getFloatField(item, "discount_percent"),
			TaxPercent:      getFloatField(item, "gst_rate"),
			TaxAmount:       getFloatField(item, "total_gst"),
			Total:           getFloatField(item, "line_total"),
		})
	}

	// Generate ESC/POS commands
	escposData := h.thermalPrinter.GenerateOrderSlip(printData)

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"escposData":    escposData,
		"previewText":   h.thermalPrinter.FormatForDisplay(escposData),
		"invoiceNumber": invoiceNo,
	})
}

// Helper functions
func atoi(s string) int {
	var result int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			result = result*10 + int(c-'0')
		}
	}
	return result
}

func getStringField(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok && val != nil {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getFloatField(m map[string]interface{}, key string) float64 {
	if val, ok := m[key]; ok && val != nil {
		switch v := val.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return 0
}

func (h *OrdersHandler) getPrinterPaperSize() string {
	var s AppSetting
	if err := h.db.Where("key = ?", "pos.printer.paperSize").First(&s).Error; err == nil {
		// Value is json.RawMessage, e.g. "3x5" (with quotes)
		var size string
		if err := json.Unmarshal(s.Value, &size); err == nil {
			return size
		}
	}
	return "3x5" // Default
}

// DownloadInvoicePDF - Download A4 PDF for invoice
func (h *OrdersHandler) DownloadInvoicePDF(c *gin.Context) {
	invoiceNo := c.Param("invoiceNo")

	// Get invoice as model
	var invoice models.SalesInvoice
	err := h.db.Where("invoice_no = ?", invoiceNo).First(&invoice).Error

	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Invoice not found"})
		return
	}

	// Get invoice items as models
	var items []models.SalesInvoiceItem
	h.db.Where("invoice_id = ?", invoice.ID).Find(&items)

	// Build PDF data
	pdfData := services.InvoiceData{
		Invoice:      &invoice,
		Items:        items,
		CompanyName:  "Yeelo Homeopathy",
		CompanyGSTIN: "06BUAPG3815Q1ZH",
		CompanyAddr:  "Shop No. 3, Khewat No. 213, Dhunela, Sohna, Gurugram, Haryana, 122103",
		CompanyPhone: "8478019973",
	}

	// Generate A4 PDF
	pdfService := services.NewInvoicePDFService()
	pdfPath, err := pdfService.GenerateA4Invoice(pdfData)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to generate PDF"})
		return
	}

	// Serve file for download
	c.Header("Content-Disposition", "attachment; filename=Invoice-"+invoiceNo+".pdf")
	c.File(pdfPath)
}
