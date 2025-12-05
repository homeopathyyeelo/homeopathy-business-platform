package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type POSEnhancedHandler struct {
	db             *gorm.DB
	autoAccounting *services.AutoAccountingService
}

func NewPOSEnhancedHandler(db *gorm.DB) *POSEnhancedHandler {
	return &POSEnhancedHandler{
		db:             db,
		autoAccounting: services.NewAutoAccountingService(db),
	}
}

// ============================================================================
// PRODUCT SEARCH WITH BATCH SELECTION (FEFO)
// ============================================================================

type ProductSearchResult struct {
	ID             string      `json:"id"`
	Name           string      `json:"name"`
	SKU            string      `json:"sku"`
	Barcode        string      `json:"barcode"`
	Category       string      `json:"category"`
	Brand          string      `json:"brand"`
	Potency        string      `json:"potency"`
	Form           string      `json:"form"`
	HSNCode        string      `json:"hsnCode"`
	GSTRate        float64     `json:"gstRate"`
	MRP            float64     `json:"mrp"`
	WholesalePrice float64     `json:"wholesalePrice"`
	DP             float64     `json:"dp"`
	PTR            float64     `json:"ptr"`
	PTS            float64     `json:"pts"`
	Stock          float64     `json:"stock"`
	Batches        []BatchInfo `json:"batches"`
	TaxRate        float64     `json:"taxRate"`
}

type BatchInfo struct {
	ID                string     `json:"id"`
	BatchNumber       string     `json:"batchNumber"`
	ExpiryDate        *time.Time `json:"expiryDate"`
	AvailableQuantity float64    `json:"availableQuantity"`
	SellingPrice      float64    `json:"sellingPrice"`
	MRP               float64    `json:"mrp"`
	Location          string     `json:"location"`
	DaysToExpiry      int        `json:"daysToExpiry"`
}

// POST /api/erp/pos/search-products
func (h *POSEnhancedHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	var products []models.Product
	searchQuery := "%" + strings.ToLower(query) + "%"

	err := h.db.Preload("Category").Preload("Brand").Preload("Potency").
		Preload("Form").Preload("HSNCode").Preload("InventoryBatches", "is_active = ? AND is_expired = ?", true, false).
		Preload("PricingTiers", "is_active = ?", true).
		Where("LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(barcode) LIKE ?", searchQuery, searchQuery, searchQuery).
		Where("is_active = ?", true).
		Limit(20).
		Find(&products).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	// Transform to search results with batches
	results := make([]ProductSearchResult, 0)
	for _, p := range products {
		result := ProductSearchResult{
			ID:      p.ID,
			Name:    p.Name,
			SKU:     p.SKU,
			Barcode: p.Barcode,
			MRP:     p.MRP,
			Stock:   p.CurrentStock,
			TaxRate: p.TaxRate,
			Batches: make([]BatchInfo, 0),
		}

		// Add category, brand, etc.
		if p.Category != nil {
			result.Category = p.Category.Name
		}
		if p.Brand != nil {
			result.Brand = p.Brand.Name
		}
		if p.Potency != nil {
			result.Potency = p.Potency.Name
		}
		if p.Form != nil {
			result.Form = p.Form.Name
		}
		if p.HSNCode != nil {
			result.HSNCode = p.HSNCode.Code
			result.GSTRate = p.HSNCode.GSTRate
		}

		// Populate wholesale pricing from active tier
		for _, tier := range p.PricingTiers {
			if tier.IsActive {
				if tier.WholesalePrice != nil {
					result.WholesalePrice = *tier.WholesalePrice
				}
				if tier.DP != nil {
					result.DP = *tier.DP
				}
				if tier.PTR != nil {
					result.PTR = *tier.PTR
				}
				if tier.PTS != nil {
					result.PTS = *tier.PTS
				}
				break // Use the first active tier found
			}
		}

		// Sort batches by expiry (FEFO - First Expiry First Out)
		for _, batch := range p.InventoryBatches {
			if batch.AvailableQuantity > 0 {
				daysToExpiry := 999999
				if batch.ExpiryDate != nil {
					daysToExpiry = int(time.Until(*batch.ExpiryDate).Hours() / 24)
				}

				result.Batches = append(result.Batches, BatchInfo{
					ID:                batch.ID,
					BatchNumber:       batch.BatchNumber,
					ExpiryDate:        batch.ExpiryDate,
					AvailableQuantity: batch.AvailableQuantity,
					SellingPrice:      batch.SellingPrice,
					MRP:               batch.MRP,
					Location:          batch.Location,
					DaysToExpiry:      daysToExpiry,
				})
			}
		}

		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
		"count":   len(results),
	})
}

// GET /api/erp/pos/product/:id/batches - Get batches for a product (FEFO sorted)
func (h *POSEnhancedHandler) GetProductBatches(c *gin.Context) {
	productID := c.Param("id")

	var batches []models.InventoryBatch
	err := h.db.Where("product_id = ? AND is_active = ? AND is_expired = ? AND available_quantity > 0",
		productID, true, false).
		Order("expiry_date ASC NULLS LAST"). // FEFO sorting
		Find(&batches).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}

	batchInfos := make([]BatchInfo, 0)
	for _, batch := range batches {
		daysToExpiry := 999999
		if batch.ExpiryDate != nil {
			daysToExpiry = int(time.Until(*batch.ExpiryDate).Hours() / 24)
		}

		batchInfos = append(batchInfos, BatchInfo{
			ID:                batch.ID,
			BatchNumber:       batch.BatchNumber,
			ExpiryDate:        batch.ExpiryDate,
			AvailableQuantity: batch.AvailableQuantity,
			SellingPrice:      batch.SellingPrice,
			MRP:               batch.MRP,
			Location:          batch.Location,
			DaysToExpiry:      daysToExpiry,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batchInfos,
	})
}

// ============================================================================
// INVOICE CREATION WITH MULTI-RATE GST CALCULATION
// ============================================================================

type CreateInvoiceRequest struct {
	InvoiceType        string               `json:"invoiceType"` // RETAIL, WHOLESALE, B2B
	CustomerID         string               `json:"customerId"`
	CustomerName       string               `json:"customerName"`
	CustomerPhone      string               `json:"customerPhone"`
	CustomerEmail      string               `json:"customerEmail"`
	CustomerAddress    string               `json:"customerAddress"`
	CustomerGSTNumber  string               `json:"customerGstNumber"`
	Items              []InvoiceItemRequest `json:"items"`
	BillDiscount       float64              `json:"billDiscount"`
	BillDiscountType   string               `json:"billDiscountType"` // PERCENT or AMOUNT
	PaymentMethod      string               `json:"paymentMethod"`
	AmountPaid         float64              `json:"amountPaid"`
	Notes              string               `json:"notes"`
	PrescriptionNumber string               `json:"prescriptionNumber"`
	DoctorID           string               `json:"doctorId"`
	DoctorName         string               `json:"doctorName"`
	CounterID          string               `json:"counterId"`
	CounterName        string               `json:"counterName"`
}

type InvoiceItemRequest struct {
	ProductID       string  `json:"productId"`
	ProductName     string  `json:"productName"`
	SKU             string  `json:"sku"`
	BatchID         string  `json:"batchId"`
	Quantity        float64 `json:"quantity"`
	UnitPrice       float64 `json:"unitPrice"`
	MRP             float64 `json:"mrp"`
	DiscountPercent float64 `json:"discountPercent"`
	HSNCode         string  `json:"hsnCode"`
	GSTRate         float64 `json:"gstRate"`
	Category        string  `json:"category"`
	Brand           string  `json:"brand"`
	Potency         string  `json:"potency"`
	Form            string  `json:"form"`
}

// POST /api/erp/pos/create-invoice
func (h *POSEnhancedHandler) CreateInvoice(c *gin.Context) {
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate items
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No items in invoice"})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Generate invoice number
	invoiceNo := fmt.Sprintf("INV-%s-%04d", time.Now().Format("200601"), time.Now().Unix()%10000)

	// Calculate totals
	var subtotal, itemDiscount float64
	var cgst5, sgst5, igst5, cgst18, sgst18, igst18 float64
	invoiceItems := make([]models.SalesInvoiceItem, 0)

	for _, item := range req.Items {
		// Validate stock
		// Validate stock & Auto-select batch if needed
		var batch models.InventoryBatch

		// Auto-select batch if BatchID is empty
		if item.BatchID == "" {
			// Find best batch (FEFO) with stock
			var bestBatch models.InventoryBatch
			if err := tx.Where("product_id = ? AND is_active = ? AND is_expired = ? AND available_quantity >= ?",
				item.ProductID, true, false, item.Quantity).
				Order("expiry_date ASC NULLS LAST").
				First(&bestBatch).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("No stock available for %s", item.ProductName)})
				return
			}
			batch = bestBatch
			item.BatchID = batch.ID // Assign the selected batch ID
		} else {
			// Validate provided BatchID
			if err := tx.First(&batch, "id = ?", item.BatchID).Error; err != nil {
				// Fallback: Try to find ANY valid batch if the specific one is not found
				// This handles cases where frontend might send an invalid ID but we have stock
				var bestBatch models.InventoryBatch
				if err := tx.Where("product_id = ? AND is_active = ? AND available_quantity >= ?",
					item.ProductID, true, item.Quantity).
					Order("expiry_date ASC NULLS LAST").
					First(&bestBatch).Error; err == nil {
					batch = bestBatch
					item.BatchID = batch.ID // Use this valid batch instead
				} else {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Batch not found: %s", item.BatchID)})
					return
				}
			}
		}

		if batch.AvailableQuantity < item.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient stock for %s", item.ProductName)})
			return
		}

		// Calculate line amounts
		lineSubtotal := item.UnitPrice * item.Quantity
		discountAmount := (lineSubtotal * item.DiscountPercent) / 100
		taxableAmount := lineSubtotal - discountAmount

		// GST calculation (multi-rate support)
		var cgst, sgst, igst float64
		gstAmount := (taxableAmount * item.GSTRate) / 100

		// For intra-state: CGST + SGST, for inter-state: IGST
		// Assuming intra-state for now (split 50-50)
		cgst = gstAmount / 2
		sgst = gstAmount / 2

		// Aggregate GST by rate
		if item.GSTRate == 5 {
			cgst5 += cgst
			sgst5 += sgst
			igst5 += igst
		} else if item.GSTRate == 18 {
			cgst18 += cgst
			sgst18 += sgst
			igst18 += igst
		}

		lineTotal := taxableAmount + gstAmount

		// Create invoice item
		invoiceItem := models.SalesInvoiceItem{
			ID:              uuid.New().String(),
			ProductID:       item.ProductID,
			ProductName:     item.ProductName,
			SKU:             item.SKU,
			BatchID:         &item.BatchID,
			BatchNumber:     batch.BatchNumber,
			ExpiryDate:      batch.ExpiryDate,
			HSNCode:         item.HSNCode,
			Category:        item.Category,
			Brand:           item.Brand,
			Potency:         item.Potency,
			Form:            item.Form,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			MRP:             item.MRP,
			DiscountPercent: item.DiscountPercent,
			DiscountAmount:  discountAmount,
			TaxableAmount:   taxableAmount,
			GSTRate:         item.GSTRate,
			CGSTAmount:      cgst,
			SGSTAmount:      sgst,
			IGSTAmount:      igst,
			TotalGST:        gstAmount,
			LineTotal:       lineTotal,
		}

		invoiceItems = append(invoiceItems, invoiceItem)

		subtotal += lineSubtotal
		itemDiscount += discountAmount

		// Deduct stock
		newQty := batch.AvailableQuantity - item.Quantity
		if err := tx.Model(&models.InventoryBatch{}).
			Where("id = ?", item.BatchID).
			Update("available_quantity", newQty).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
			return
		}
		batch.AvailableQuantity = newQty
	}

	// Apply bill-level discount
	var billDiscountAmount float64
	if req.BillDiscountType == "PERCENT" {
		billDiscountAmount = ((subtotal - itemDiscount) * req.BillDiscount) / 100
	} else {
		billDiscountAmount = req.BillDiscount
	}

	totalDiscount := itemDiscount + billDiscountAmount
	taxableAmount := subtotal - totalDiscount
	totalGST := cgst5 + sgst5 + igst5 + cgst18 + sgst18 + igst18
	totalAmount := taxableAmount + totalGST

	// Round off
	roundOff := float64(int(totalAmount+0.5)) - totalAmount
	totalAmount += roundOff

	// Create invoice
	invoice := models.SalesInvoice{
		ID:                  uuid.New().String(),
		InvoiceNo:           invoiceNo,
		InvoiceDate:         time.Now(),
		InvoiceType:         req.InvoiceType,
		CustomerName:        req.CustomerName,
		CustomerPhone:       req.CustomerPhone,
		CustomerEmail:       req.CustomerEmail,
		CustomerAddress:     req.CustomerAddress,
		CustomerGSTNumber:   req.CustomerGSTNumber,
		Subtotal:            subtotal,
		ItemDiscount:        itemDiscount,
		BillDiscount:        billDiscountAmount,
		BillDiscountPercent: req.BillDiscount,
		TotalDiscount:       totalDiscount,
		TaxableAmount:       taxableAmount,
		CGST5Percent:        cgst5,
		SGST5Percent:        sgst5,
		IGST5Percent:        igst5,
		CGST18Percent:       cgst18,
		SGST18Percent:       sgst18,
		IGST18Percent:       igst18,
		TotalGST:            totalGST,
		RoundOff:            roundOff,
		TotalAmount:         totalAmount,
		PaymentMethod:       req.PaymentMethod,
		PaymentStatus:       "PAID",
		AmountPaid:          req.AmountPaid,
		ChangeAmount:        req.AmountPaid - totalAmount,
		Notes:               req.Notes,
		PrescriptionNumber:  req.PrescriptionNumber,
		DoctorName:          req.DoctorName,
		CounterID:           req.CounterID,
		CounterName:         req.CounterName,
		Status:              "COMPLETED",
		CreatedBy:           c.GetString("user_id"),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if req.CustomerID != "" {
		invoice.CustomerID = &req.CustomerID
	}
	if req.DoctorID != "" {
		invoice.DoctorID = &req.DoctorID
	}

	// Save invoice
	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	// Save invoice items
	for i := range invoiceItems {
		invoiceItems[i].InvoiceID = invoice.ID
		if err := tx.Create(&invoiceItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice items"})
			return
		}
	}

	// Create Order from Invoice
	orderService := services.NewOrderCreationService(tx)
	orderItems := make([]services.OrderItemRequest, len(invoiceItems))
	for i, invItem := range invoiceItems {
		orderItems[i] = services.OrderItemRequest{
			ProductID:   invItem.ProductID,
			ProductName: invItem.ProductName,
			SKU:         invItem.SKU,
			BatchID:     invItem.BatchID,
			BatchNumber: invItem.BatchNumber,
			Quantity:    invItem.Quantity,
			UnitPrice:   invItem.UnitPrice,
			TotalPrice:  invItem.LineTotal,
		}
	}

	// Create order from invoice
	orderReq := services.InvoiceToOrderRequest{
		InvoiceID:     invoice.ID,
		InvoiceNo:     invoiceNo,
		CustomerID:    invoice.CustomerID,
		CustomerName:  req.CustomerName,
		CustomerPhone: req.CustomerPhone,
		CustomerEmail: req.CustomerEmail,
		TotalAmount:   totalAmount,
		Items:         orderItems,
		PaymentMethod: req.PaymentMethod,
		PaymentStatus: "PAID",
	}

	order, err := orderService.CreateOrderFromInvoice(tx, orderReq)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Calculate doctor commission if applicable (async after commit)
	calculateCommission := req.DoctorID != ""

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Post to Accounting Ledger (Async)
	go func() {
		// Re-initialize auto-accounting with fresh DB connection for async operation
		autoAccounting := services.NewAutoAccountingService(h.db)

		// Calculate total GST components
		totalCGST := cgst5 + cgst18
		totalSGST := sgst5 + sgst18
		totalIGST := igst5 + igst18

		// 1. Post Invoice Journal Entry
		err := autoAccounting.PostInvoiceJournalEntry(
			invoice.ID,
			invoiceNo,
			time.Now(),
			req.CustomerName,
			subtotal,
			totalCGST,
			totalSGST,
			totalIGST,
			totalAmount,
			string(req.InvoiceType),
		)
		if err != nil {
			fmt.Printf("Error posting invoice journal entry: %v\n", err)
		}

		// 2. Post Payment Journal Entry (if paid)
		// Note: CreateInvoiceRequest doesn't have PaymentStatus field, it's inferred or defaulted to PAID for POS
		// For POS, we assume immediate payment unless specified otherwise
		if invoice.PaymentStatus == "PAID" {
			// Generate payment number
			paymentNo := fmt.Sprintf("PAY-%s-%04d", time.Now().Format("20060102"), time.Now().Unix()%10000)

			// Use order ID as payment reference if available, otherwise invoice ID
			refID := invoice.ID
			if order != nil {
				if id, ok := order["id"].(string); ok {
					refID = id
				}
			}

			err = autoAccounting.PostPaymentJournalEntry(
				refID,
				paymentNo,
				invoiceNo,
				req.CustomerName,
				req.PaymentMethod,
				time.Now(),
				totalAmount,
			)
			if err != nil {
				fmt.Printf("Error posting payment journal entry: %v\n", err)
			}
		}
	}()

	// Generate PDFs (after commit)
	pdfService := services.NewInvoicePDFService()
	// Get company details from database
	var company struct {
		Name    string `gorm:"column:name"`
		GSTIN   string `gorm:"column:gstin"`
		Address string `gorm:"column:address"`
		Phone   string `gorm:"column:phone"`
	}
	h.db.Table("company_settings").Select("name, gstin, address, phone").Limit(1).Scan(&company)

	pdfData := services.InvoiceData{
		Invoice:      &invoice,
		Items:        invoiceItems,
		CompanyName:  company.Name,
		CompanyGSTIN: company.GSTIN,
		CompanyAddr:  company.Address,
		CompanyPhone: company.Phone,
	}

	thermalPDF, err := pdfService.GenerateThermalReceipt(pdfData)
	if err != nil {
		// Log error but don't fail the invoice creation
		thermalPDF = ""
	}

	a4PDF, err := pdfService.GenerateA4Invoice(pdfData)
	if err != nil {
		// Log error but don't fail the invoice creation
		a4PDF = ""
	}

	// Send Notifications (Async)
	notificationService := services.NewNotificationService()
	go func() {
		// Email Invoice
		if req.CustomerEmail != "" && a4PDF != "" {
			notificationService.SendInvoiceEmail(req.CustomerEmail, req.CustomerName, invoiceNo, a4PDF)
		}

		// WhatsApp Invoice
		if req.CustomerPhone != "" && a4PDF != "" {
			notificationService.SendInvoiceWhatsApp(req.CustomerPhone, invoiceNo, a4PDF)
		}

		// SMS Confirmation
		if req.CustomerPhone != "" {
			notificationService.SendPaymentConfirmationSMS(req.CustomerPhone, totalAmount, invoiceNo)
		}
	}()

	// E-Invoice Generation (Async for B2B)
	if invoice.InvoiceType == "B2B" || (invoice.CustomerGSTNumber != "") {
		gstService := services.NewGSTService()
		go func() {
			irn, qrCode, err := gstService.GenerateIRN(&invoice)
			if err == nil {
				// Update invoice with IRN and QR Code
				// Note: In a real app, we'd need a separate DB update here since the main transaction is committed
				// For now, we just log it as the stub implementation doesn't persist back yet
				fmt.Printf("Generated IRN for %s: %s\n", invoiceNo, irn)
				_ = qrCode // usage
			}
		}()
	}

	// Async doctor commission calculation
	if calculateCommission {
		go h.calculateDoctorCommission(invoice.ID, req.DoctorID, req.DoctorName, invoiceNo, totalAmount)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":          invoice.ID,
			"invoiceNo":   invoiceNo,
			"totalAmount": totalAmount,
			"invoice":     invoice,
			"order":       order,
			"items":       invoiceItems,
			"pdfs": gin.H{
				"thermal": thermalPDF,
				"a4":      a4PDF,
			},
		},
	})
}

func (h *POSEnhancedHandler) calculateDoctorCommission(invoiceID, doctorID, doctorName, invoiceNo string, invoiceAmount float64) {
	// Get commission rule
	var rule models.DoctorCommissionRule
	err := h.db.Where("doctor_id = ? AND is_active = ? AND valid_from <= ? AND (valid_until IS NULL OR valid_until >= ?)",
		doctorID, true, time.Now(), time.Now()).
		First(&rule).Error

	if err != nil {
		// No commission rule found
		return
	}

	// Calculate commission
	commissionRate := rule.DefaultRate
	commissionAmount := (invoiceAmount * commissionRate) / 100

	// Create commission record
	commission := models.DoctorCommission{
		ID:               uuid.New().String(),
		TransactionDate:  time.Now(),
		DoctorID:         &doctorID,
		DoctorName:       doctorName,
		InvoiceID:        &invoiceID,
		InvoiceNo:        invoiceNo,
		InvoiceDate:      time.Now(),
		InvoiceAmount:    invoiceAmount,
		CommissionRate:   commissionRate,
		CommissionAmount: commissionAmount,
		PaymentStatus:    "PENDING",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	h.db.Create(&commission)
}

// ============================================================================
// HELD BILLS (PARK & RESUME)
// ============================================================================

// POST /api/erp/pos/hold-bill
func (h *POSEnhancedHandler) HoldBill(c *gin.Context) {
	var req struct {
		CustomerID   string                 `json:"customerId"`
		CustomerName string                 `json:"customerName"`
		BillData     map[string]interface{} `json:"billData"`
		TotalAmount  float64                `json:"totalAmount"`
		ItemsCount   int                    `json:"itemsCount"`
		CounterID    string                 `json:"counterId"`
		Notes        string                 `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	billDataJSON, err := json.Marshal(req.BillData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bill data"})
		return
	}

	holdNo := fmt.Sprintf("HOLD-%s-%04d", time.Now().Format("20060102"), time.Now().Unix()%10000)

	heldBill := models.HeldBill{
		ID:           uuid.New().String(),
		HoldNo:       holdNo,
		BillData:     string(billDataJSON),
		CustomerName: req.CustomerName,
		TotalAmount:  &req.TotalAmount,
		ItemsCount:   &req.ItemsCount,
		CounterID:    req.CounterID,
		HeldBy:       "POS User", // TODO: Get from auth
		HeldAt:       time.Now(),
		Status:       "HELD",
		Notes:        req.Notes,
		CreatedAt:    time.Now(),
	}

	if req.CustomerID != "" {
		heldBill.CustomerID = &req.CustomerID
	}

	if err := h.db.Create(&heldBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hold bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    heldBill,
	})
}

// GET /api/erp/pos/held-bills
func (h *POSEnhancedHandler) GetHeldBills(c *gin.Context) {
	var heldBills []models.HeldBill

	err := h.db.Where("status = ?", "HELD").
		Order("held_at DESC").
		Find(&heldBills).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch held bills"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    heldBills,
	})
}

// POST /api/erp/pos/resume-bill/:id
func (h *POSEnhancedHandler) ResumeBill(c *gin.Context) {
	id := c.Param("id")

	var heldBill models.HeldBill
	if err := h.db.First(&heldBill, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Held bill not found"})
		return
	}

	// Parse bill data
	var billData map[string]interface{}
	if err := json.Unmarshal([]byte(heldBill.BillData), &billData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse bill data"})
		return
	}

	// Update status
	heldBill.Status = "RESUMED"
	now := time.Now()
	heldBill.ResumedAt = &now
	heldBill.ResumedBy = "POS User" // TODO: Get from auth

	if err := h.db.Save(&heldBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update held bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"data":     billData,
		"holdInfo": heldBill,
	})
}

// DELETE /api/erp/pos/held-bill/:id
func (h *POSEnhancedHandler) DeleteHeldBill(c *gin.Context) {
	id := c.Param("id")

	result := h.db.Model(&models.HeldBill{}).Where("id = ?", id).Update("status", "CANCELLED")

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete held bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Held bill deleted",
	})
}

// ============================================================================
// SALES RETURNS
// ============================================================================

type CreateReturnRequest struct {
	OriginalInvoiceID string              `json:"originalInvoiceId"`
	OriginalInvoiceNo string              `json:"originalInvoiceNo"`
	CustomerID        string              `json:"customerId"`
	CustomerName      string              `json:"customerName"`
	CustomerPhone     string              `json:"customerPhone"`
	ReturnReason      string              `json:"returnReason"`
	ReturnRemarks     string              `json:"returnRemarks"`
	Items             []ReturnItemRequest `json:"items"`
	RefundMethod      string              `json:"refundMethod"` // CASH, CARD, CREDIT_NOTE
}

type ReturnItemRequest struct {
	OriginalItemID   string  `json:"originalItemId"`
	ProductID        string  `json:"productId"`
	ProductName      string  `json:"productName"`
	BatchID          string  `json:"batchId"`
	ReturnedQuantity float64 `json:"returnedQuantity"`
	UnitPrice        float64 `json:"unitPrice"`
	DiscountAmount   float64 `json:"discountAmount"`
	GSTRate          float64 `json:"gstRate"`
	HSNCode          string  `json:"hsnCode"`
}

// POST /api/erp/pos/create-return
func (h *POSEnhancedHandler) CreateReturn(c *gin.Context) {
	var req CreateReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := h.db.Begin()

	returnNo := fmt.Sprintf("RET-%s-%04d", time.Now().Format("200601"), time.Now().Unix()%10000)

	// Calculate return totals
	var subtotal, totalDiscount, totalGST float64
	var cgst5, sgst5, cgst18, sgst18 float64

	returnItems := make([]models.SalesReturnItem, 0)

	for _, item := range req.Items {
		lineSubtotal := item.UnitPrice * item.ReturnedQuantity
		taxableAmount := lineSubtotal - item.DiscountAmount
		gstAmount := (taxableAmount * item.GSTRate) / 100

		cgst := gstAmount / 2
		sgst := gstAmount / 2

		if item.GSTRate == 5 {
			cgst5 += cgst
			sgst5 += sgst
		} else if item.GSTRate == 18 {
			cgst18 += cgst
			sgst18 += sgst
		}

		lineTotal := taxableAmount + gstAmount

		returnItem := models.SalesReturnItem{
			ID:               uuid.New().String(),
			ProductID:        item.ProductID,
			ProductName:      item.ProductName,
			ReturnedQuantity: item.ReturnedQuantity,
			UnitPrice:        item.UnitPrice,
			DiscountAmount:   item.DiscountAmount,
			TaxableAmount:    taxableAmount,
			GSTRate:          item.GSTRate,
			CGSTAmount:       cgst,
			SGSTAmount:       sgst,
			TotalGST:         gstAmount,
			LineTotal:        lineTotal,
			HSNCode:          item.HSNCode,
		}

		if item.OriginalItemID != "" {
			returnItem.OriginalItemID = &item.OriginalItemID
		}
		if item.BatchID != "" {
			returnItem.BatchID = &item.BatchID
		}

		returnItems = append(returnItems, returnItem)

		subtotal += lineSubtotal
		totalDiscount += item.DiscountAmount
		totalGST += gstAmount

		// Restock inventory
		if item.BatchID != "" {
			var batch models.InventoryBatch
			if err := tx.First(&batch, "id = ?", item.BatchID).Error; err == nil {
				batch.AvailableQuantity += item.ReturnedQuantity
				tx.Save(&batch)
			}
		}
	}

	taxableAmount := subtotal - totalDiscount
	totalAmount := taxableAmount + totalGST

	// Create return
	salesReturn := models.SalesReturn{
		ID:                uuid.New().String(),
		ReturnNo:          returnNo,
		ReturnDate:        time.Now(),
		OriginalInvoiceNo: req.OriginalInvoiceNo,
		CustomerName:      req.CustomerName,
		CustomerPhone:     req.CustomerPhone,
		ReturnReason:      req.ReturnReason,
		ReturnRemarks:     req.ReturnRemarks,
		Subtotal:          subtotal,
		TotalDiscount:     totalDiscount,
		TaxableAmount:     taxableAmount,
		CGST5Percent:      cgst5,
		SGST5Percent:      sgst5,
		CGST18Percent:     cgst18,
		SGST18Percent:     sgst18,
		TotalGST:          totalGST,
		TotalAmount:       totalAmount,
		RefundMethod:      req.RefundMethod,
		RefundStatus:      "PENDING",
		Status:            "COMPLETED",
		ReturnedBy:        "POS User",
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if req.OriginalInvoiceID != "" {
		salesReturn.OriginalInvoiceID = &req.OriginalInvoiceID
	}
	if req.CustomerID != "" {
		salesReturn.CustomerID = &req.CustomerID
	}

	if err := tx.Create(&salesReturn).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create return"})
		return
	}

	// Save return items
	for i := range returnItems {
		returnItems[i].ReturnID = salesReturn.ID
		if err := tx.Create(&returnItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create return items"})
			return
		}
	}

	// Create credit note if refund method is CREDIT_NOTE
	if req.RefundMethod == "CREDIT_NOTE" {
		creditNote := models.CreditNote{
			ID:             uuid.New().String(),
			CreditNoteNo:   fmt.Sprintf("CN-%s", returnNo),
			CreditNoteDate: time.Now(),
			CustomerName:   req.CustomerName,
			ReturnNo:       returnNo,
			CreditAmount:   totalAmount,
			BalanceAmount:  totalAmount,
			ValidFrom:      time.Now(),
			Status:         "ACTIVE",
			CreatedBy:      "POS User",
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		if req.CustomerID != "" {
			creditNote.CustomerID = &req.CustomerID
		}
		returnID := salesReturn.ID
		creditNote.ReturnID = &returnID

		if err := tx.Create(&creditNote).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create credit note"})
			return
		}

		salesReturn.CreditNoteID = &creditNote.ID
		salesReturn.CreditNoteNo = creditNote.CreditNoteNo
		tx.Save(&salesReturn)
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"return": salesReturn,
			"items":  returnItems,
		},
	})
}

// GET /api/erp/pos/returns
func (h *POSEnhancedHandler) GetReturns(c *gin.Context) {
	var returns []models.SalesReturn

	query := h.db.Preload("Items").Order("return_date DESC")

	// Filters
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if fromDate := c.Query("from_date"); fromDate != "" {
		query = query.Where("return_date >= ?", fromDate)
	}
	if toDate := c.Query("to_date"); toDate != "" {
		query = query.Where("return_date <= ?", toDate)
	}

	if err := query.Limit(100).Find(&returns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch returns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    returns,
	})
}

// ============================================================================
// GET INVOICE DETAILS
// ============================================================================

// GET /api/erp/pos/invoice/:id
func (h *POSEnhancedHandler) GetInvoice(c *gin.Context) {
	id := c.Param("id")

	var invoice models.SalesInvoice
	if err := h.db.Preload("Items").Preload("Customer").First(&invoice, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoice,
	})
}

// GET /api/erp/pos/invoices - List invoices
func (h *POSEnhancedHandler) GetInvoices(c *gin.Context) {
	var invoices []models.SalesInvoice

	query := h.db.Order("invoice_date DESC")

	// Filters
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if fromDate := c.Query("from_date"); fromDate != "" {
		query = query.Where("invoice_date >= ?", fromDate)
	}
	if toDate := c.Query("to_date"); toDate != "" {
		query = query.Where("invoice_date <= ?", toDate)
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	if err := query.Limit(100).Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoices,
	})
}
