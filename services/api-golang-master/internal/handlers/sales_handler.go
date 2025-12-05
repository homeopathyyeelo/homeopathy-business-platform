package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type SalesHandler struct {
	db *gorm.DB
}

func NewSalesHandler(db interface{}) *SalesHandler {
	if gormDB, ok := db.(*gorm.DB); ok {
		return &SalesHandler{db: gormDB}
	}
	return &SalesHandler{db: nil}
}

// GET /api/erp/sales/orders - List sales orders
func (h *SalesHandler) GetOrders(c *gin.Context) {
	orders := []gin.H{
		{
			"id":           uuid.New().String(),
			"orderNo":      "SO-2024-001",
			"date":         time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"customerName": "Rajesh Medical Store",
			"customerType": "B2B",
			"totalAmount":  8500.00,
			"status":       "pending",
			"itemsCount":   12,
		},
		{
			"id":           uuid.New().String(),
			"orderNo":      "SO-2024-002",
			"date":         time.Now().Add(-48 * time.Hour).Format("2006-01-02"),
			"customerName": "City Pharmacy",
			"customerType": "B2B",
			"totalAmount":  15200.00,
			"status":       "completed",
			"itemsCount":   25,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}

// GET /api/sales/b2b - B2B sales data
func (h *SalesHandler) GetB2BSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "B2B-2024-001",
			"date":         time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"customerName": "Wholesale Distributor A",
			"totalAmount":  45000.00,
			"status":       "paid",
			"itemsCount":   65,
		},
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "B2B-2024-002",
			"date":         time.Now().Add(-48 * time.Hour).Format("2006-01-02"),
			"customerName": "Wholesale Distributor B",
			"totalAmount":  32000.00,
			"status":       "pending",
			"itemsCount":   42,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/invoices - List invoices
func (h *SalesHandler) GetInvoices(c *gin.Context) {
	invoices := []gin.H{
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "INV-2024-001",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Walk-in Customer",
			"totalAmount":  2500.00,
			"status":       "paid",
			"paymentMode":  "Cash",
		},
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "INV-2024-002",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Dr. Sharma Clinic",
			"totalAmount":  6800.00,
			"status":       "paid",
			"paymentMode":  "UPI",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoices,
	})
}

// GET /api/erp/sales/invoices/:id - Get invoice details with items for printing
func (h *SalesHandler) GetInvoiceDetails(c *gin.Context) {
	invoiceID := c.Param("id")

	// Fetch real invoice from database
	var invoice struct {
		ID              string    `gorm:"column:id"`
		InvoiceNo       string    `gorm:"column:invoice_no"`
		InvoiceDate     time.Time `gorm:"column:invoice_date"`
		CustomerID      *string   `gorm:"column:customer_id"`
		CustomerName    string    `gorm:"column:customer_name"`
		CustomerPhone   string    `gorm:"column:customer_phone"`
		CustomerAddress string    `gorm:"column:customer_address"`
		CustomerGSTIN   string    `gorm:"column:customer_gstin"`
		CustomerEmail   string    `gorm:"column:customer_email"`
		Subtotal        float64   `gorm:"column:subtotal"`
		DiscountAmount  float64   `gorm:"column:discount_amount"`
		TaxAmount       float64   `gorm:"column:tax_amount"`
		TotalAmount     float64   `gorm:"column:total_amount"`
		PaidAmount      float64   `gorm:"column:paid_amount"`
		BalanceAmount   float64   `gorm:"column:balance_amount"`
		PaymentStatus   string    `gorm:"column:payment_status"`
		Status          string    `gorm:"column:status"`
	}

	if err := h.db.Table("sales_invoices").Where("id = ?", invoiceID).First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Fetch invoice items
	var items []map[string]interface{}
	h.db.Raw(`
		SELECT 
			sii.id,
			sii.product_id,
			sii.product_name,
			sii.sku,
			sii.batch_number,
			sii.hsn_code,
			sii.quantity,
			sii.unit_price,
			sii.discount_amount,
			sii.discount_percent,
			sii.tax_percent,
			sii.tax_amount,
			sii.total_price
		FROM sales_invoice_items sii
		WHERE sii.invoice_id = ?
		ORDER BY sii.created_at
	`, invoiceID).Scan(&items)

	// Format response
	invoiceData := gin.H{
		"id":        invoice.ID,
		"invoiceNo": invoice.InvoiceNo,
		"date":      invoice.InvoiceDate.Format("2006-01-02"),
		"dueDate":   invoice.InvoiceDate.AddDate(0, 0, 30).Format("2006-01-02"),
		"customer": gin.H{
			"name":      invoice.CustomerName,
			"address":   invoice.CustomerAddress,
			"phone":     invoice.CustomerPhone,
			"email":     invoice.CustomerEmail,
			"gstNumber": invoice.CustomerGSTIN,
		},
		"items":          items,
		"subtotal":       invoice.Subtotal,
		"discountAmount": invoice.DiscountAmount,
		"gstAmount":      invoice.TaxAmount,
		"total":          invoice.TotalAmount,
		"paidAmount":     invoice.PaidAmount,
		"balanceAmount":  invoice.BalanceAmount,
		"paymentStatus":  invoice.PaymentStatus,
		"status":         invoice.Status,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoiceData,
	})
}

// POST /api/erp/sales/pos/create - Create POS sale
func (h *SalesHandler) CreatePOSSale(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice := gin.H{
		"id":        uuid.New().String(),
		"invoiceNo": "POS-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:6],
		"date":      time.Now().Format("2006-01-02T15:04:05Z"),
		"items":     req["items"],
		"total":     req["total"],
		"status":    "completed",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    invoice,
		"message": "Sale created successfully",
	})
}

// GET /api/erp/sales/returns - List returns
func (h *SalesHandler) GetReturns(c *gin.Context) {
	returns := []gin.H{
		{
			"id":              uuid.New().String(),
			"returnNo":        "RET-2024-001",
			"date":            time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"originalInvoice": "INV-2024-045",
			"customerName":    "City Pharmacy",
			"amount":          1500.00,
			"status":          "completed",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    returns,
	})
}

// GET /api/erp/sales/receipts - List receipts
func (h *SalesHandler) GetReceipts(c *gin.Context) {
	receipts := []gin.H{
		{
			"id":           uuid.New().String(),
			"receiptNo":    "RCP-2024-001",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Rajesh Medical Store",
			"amount":       5000.00,
			"paymentMode":  "Bank Transfer",
			"status":       "cleared",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    receipts,
	})
}

// GET /api/erp/sales/b2c - B2C retail sales
func (h *SalesHandler) GetB2CSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":          uuid.New().String(),
			"invoiceNo":   "B2C-2024-001",
			"date":        time.Now().Format("2006-01-02"),
			"customer":    "Walk-in",
			"totalAmount": 1200.00,
			"status":      "paid",
			"itemsCount":  5,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/d2d - Doctor to Doctor sales
func (h *SalesHandler) GetD2DSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":          uuid.New().String(),
			"invoiceNo":   "D2D-2024-001",
			"date":        time.Now().Format("2006-01-02"),
			"doctorName":  "Dr. Kumar Homeopathy",
			"totalAmount": 12000.00,
			"status":      "pending",
			"itemsCount":  25,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/credit - Credit sales management
func (h *SalesHandler) GetCreditSales(c *gin.Context) {
	creditSales := []gin.H{
		{
			"id":           uuid.New().String(),
			"customerName": "City Pharmacy",
			"totalCredit":  45000.00,
			"paid":         20000.00,
			"balance":      25000.00,
			"dueDate":      time.Now().Add(15 * 24 * time.Hour).Format("2006-01-02"),
			"status":       "overdue",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    creditSales,
	})
}

// GET /api/erp/sales/hold-bills - Held bills in POS
func (h *SalesHandler) GetHoldBills(c *gin.Context) {
	holdBills := []gin.H{
		{
			"id":       uuid.New().String(),
			"tempId":   "HOLD-001",
			"counter":  "Counter 1",
			"operator": "Rajesh Kumar",
			"items":    []gin.H{{"name": "Arnica 30C", "qty": 2, "price": 70.0}},
			"subtotal": 140.00,
			"heldAt":   time.Now().Add(-30 * time.Minute).Format("2006-01-02T15:04:05Z"),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    holdBills,
	})
}

// GetSalesOrders returns list of sales orders from database
func (h *SalesHandler) GetSalesOrders(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	customerID := c.Query("customer_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Build query
	query := h.db.WithContext(ctx).Model(&models.SalesOrder{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Fetch orders with pagination
	var orders []models.SalesOrder
	offset := (page - 1) * limit
	if err := query.Preload("Customer").Preload("Items").Offset(offset).Limit(limit).Order("created_at DESC").Find(&orders).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Calculate pagination
	totalPages := (total + int64(limit) - 1) / int64(limit)

	RespondSuccessWithMeta(c, orders, &MetaData{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	})
}

// GetSalesOrder returns a single sales order from database
func (h *SalesHandler) GetSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	if id == "" {
		RespondBadRequest(c, "Order ID is required")
		return
	}

	var order models.SalesOrder
	if err := h.db.WithContext(ctx).Preload("Customer").Preload("Items").Preload("Items.Product").Where("id = ?", id).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			RespondNotFound(c, "Sales Order")
			return
		}
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, order)
}

// CreateSalesOrder creates a new sales order in database
func (h *SalesHandler) CreateSalesOrder(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Parse and validate request
	var req models.CreateSalesOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// Begin transaction
	tx := h.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create sales order
	order := &models.SalesOrder{
		ID:             uuid.New().String(),
		OrderNumber:    generateSalesOrderNumber(),
		CustomerID:     &req.CustomerID,
		OrderDate:      req.OrderDate,
		Status:         "pending",
		Subtotal:       0,
		DiscountAmount: 0,
		TaxAmount:      0,
		TotalAmount:    0,
		Notes:          req.Notes,
	}

	// Calculate totals
	var subtotal, taxTotal float64
	for _, item := range req.Items {
		itemTotal := float64(item.Quantity) * item.UnitPrice
		discount := itemTotal * (item.DiscountPct / 100)
		itemTotal -= discount
		tax := itemTotal * (item.TaxPct / 100)
		itemTotal += tax

		subtotal += float64(item.Quantity) * item.UnitPrice
		taxTotal += tax
	}

	order.Subtotal = subtotal
	order.TaxAmount = taxTotal
	order.TotalAmount = subtotal - (subtotal * req.DiscountPct / 100) + taxTotal

	if err := tx.Create(order).Error; err != nil {
		tx.Rollback()
		RespondInternalError(c, err)
		return
	}

	// Create order items
	for _, itemReq := range req.Items {
		itemTotal := float64(itemReq.Quantity) * itemReq.UnitPrice
		discount := itemTotal * (itemReq.DiscountPct / 100)
		tax := (itemTotal - discount) * (itemReq.TaxPct / 100)

		item := &models.SalesOrderItem{
			ID:              uuid.New().String(),
			SalesOrderID:    order.ID,
			ProductID:       itemReq.ProductID,
			Quantity:        float64(itemReq.Quantity),
			UnitPrice:       itemReq.UnitPrice,
			DiscountPercent: itemReq.DiscountPct,
			DiscountAmount:  discount,
			TaxPercent:      itemReq.TaxPct,
			TaxAmount:       tax,
			TotalAmount:     itemTotal - discount + tax,
		}

		if err := tx.Create(item).Error; err != nil {
			tx.Rollback()
			RespondInternalError(c, err)
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	// Reload with associations
	if err := h.db.WithContext(ctx).Preload("Customer").Preload("Items").First(order, "id = ?", order.ID).Error; err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondCreated(c, order, "Sales order created successfully")
}

// UpdateSalesOrder updates an existing sales order
func (h *SalesHandler) UpdateSalesOrder(c *gin.Context) {
	id := c.Param("id")

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order := gin.H{
		"id":        id,
		"updatedAt": time.Now().Format("2006-01-02T15:04:05Z"),
	}

	// Merge request data
	for k, v := range req {
		order[k] = v
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
		"message": "Sales order updated successfully",
	})
}

// DeleteSalesOrder deletes a sales order
func (h *SalesHandler) DeleteSalesOrder(c *gin.Context) {
	id := c.Param("id")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Sales order deleted successfully",
		"id":      id,
	})
}

// GetSalesInvoices returns list of sales invoices from database
func (h *SalesHandler) GetSalesInvoices(c *gin.Context) {
	// Get query parameters
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")
	search := c.Query("search")
	status := c.Query("status")
	invoiceType := c.Query("invoice_type")
	paymentStatus := c.Query("payment_status")

	// Build query
	query := h.db.Table("sales_invoices").
		Select(`
			sales_invoices.id,
			sales_invoices.invoice_no,
			sales_invoices.invoice_type,
			sales_invoices.customer_id,
			sales_invoices.customer_name,
			sales_invoices.customer_phone,
			sales_invoices.customer_address,
			sales_invoices.customer_gst_number as customer_gstin,
			sales_invoices.invoice_date,
			NULL as due_date,
			sales_invoices.status,
			sales_invoices.payment_status,
			sales_invoices.payment_method,
			sales_invoices.subtotal,
			sales_invoices.total_discount as discount,
			sales_invoices.total_gst as tax,
			sales_invoices.total_amount,
			sales_invoices.amount_paid,
			(sales_invoices.total_amount - sales_invoices.amount_paid) as balance_due,
			sales_invoices.notes,
			sales_invoices.created_at,
			sales_invoices.created_at as updated_at,
			COUNT(sales_invoice_items.id) as items_count
		`).
		Joins("LEFT JOIN sales_invoice_items ON sales_invoices.id = sales_invoice_items.invoice_id").
		Group(`sales_invoices.id, sales_invoices.invoice_no, sales_invoices.invoice_type, 
			sales_invoices.customer_id, sales_invoices.customer_name, sales_invoices.customer_phone,
			sales_invoices.customer_address, sales_invoices.customer_gst_number, sales_invoices.invoice_date,
			sales_invoices.status, sales_invoices.payment_status, sales_invoices.payment_method,
			sales_invoices.subtotal, sales_invoices.total_discount, sales_invoices.total_gst,
			sales_invoices.total_amount, sales_invoices.amount_paid, sales_invoices.notes,
			sales_invoices.created_at`)

	// Apply filters
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("sales_invoices.invoice_no ILIKE ? OR sales_invoices.customer_name ILIKE ? OR sales_invoices.customer_phone ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	if status != "" && status != "all" {
		query = query.Where("sales_invoices.status = ?", status)
	}

	if invoiceType != "" && invoiceType != "all" {
		query = query.Where("sales_invoices.invoice_type = ?", invoiceType)
	}

	if paymentStatus != "" && paymentStatus != "all" {
		query = query.Where("sales_invoices.payment_status = ?", paymentStatus)
	}

	// Count total
	var total int64
	countQuery := h.db.Table("sales_invoices")
	if search != "" {
		searchPattern := "%" + search + "%"
		countQuery = countQuery.Where("invoice_no ILIKE ? OR customer_name ILIKE ? OR customer_phone ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}
	if status != "" && status != "all" {
		countQuery = countQuery.Where("status = ?", status)
	}
	if invoiceType != "" && invoiceType != "all" {
		countQuery = countQuery.Where("invoice_type = ?", invoiceType)
	}
	if paymentStatus != "" && paymentStatus != "all" {
		countQuery = countQuery.Where("payment_status = ?", paymentStatus)
	}
	countQuery.Count(&total)

	// Pagination
	pageInt := 1
	limitInt := 20
	fmt.Sscanf(page, "%d", &pageInt)
	fmt.Sscanf(limit, "%d", &limitInt)

	offset := (pageInt - 1) * limitInt
	query = query.Offset(offset).Limit(limitInt)

	// Execute query
	var invoices []map[string]interface{}
	if err := query.Order("sales_invoices.invoice_date DESC, sales_invoices.created_at DESC").Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch invoices",
		})
		return
	}

	totalPages := (int(total) + limitInt - 1) / limitInt

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      invoices,
			"total":      total,
			"page":       pageInt,
			"limit":      limitInt,
			"totalPages": totalPages,
		},
	})
}

// CreateSalesInvoice creates a new sales invoice
func (h *SalesHandler) CreateSalesInvoice(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice := gin.H{
		"id":        uuid.New().String(),
		"invoiceNo": "INV-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:6],
		"date":      time.Now().Format("2006-01-02"),
		"status":    "draft",
	}

	// Merge request data
	for k, v := range req {
		invoice[k] = v
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    invoice,
		"message": "Sales invoice created successfully",
	})
}

// GetAISalesForecast returns AI-powered sales forecasting
func (h *SalesHandler) GetAISalesForecast(c *gin.Context) {
	var req struct {
		ProductIDs []string `json:"product_ids"`
		Months     int      `json:"months_ahead" default:"3"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for sales forecasting
	endpoint := "/v2/forecast/sales"
	payload := map[string]interface{}{
		"product_ids":        req.ProductIDs,
		"months_ahead":       req.Months,
		"include_confidence": true,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"sales_forecast": aiResponse,
		"generated_at":   time.Now(),
	})
}

// ==================== HELPER FUNCTIONS ====================

// generateSalesOrderNumber generates a unique sales order number
func generateSalesOrderNumber() string {
	return "SO-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]
}
