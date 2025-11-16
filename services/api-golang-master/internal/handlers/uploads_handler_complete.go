package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type EnhancedUploadsHandler struct {
	db         *gorm.DB
	normalizer *services.ProductNormalizer
	classifier *services.CategoryClassifier
}

func NewEnhancedUploadsHandler(db *gorm.DB) *EnhancedUploadsHandler {
	return &EnhancedUploadsHandler{
		db:         db,
		normalizer: services.NewProductNormalizer(db),
		classifier: services.NewCategoryClassifier(db),
	}
}

// ============================================================================
// UPLOAD SESSION MANAGEMENT
// ============================================================================

type UploadRow struct {
	ProductName   string  `json:"productName"`
	BatchNumber   string  `json:"batchNumber"`
	ExpiryDate    string  `json:"expiryDate"`
	Quantity      float64 `json:"quantity"`
	FreeQuantity  float64 `json:"freeQuantity"`
	PurchaseRate  float64 `json:"purchaseRate"`
	MRP           float64 `json:"mrp"`
	SellingPrice  float64 `json:"sellingPrice"`
	TaxPercent    float64 `json:"taxPercent"`
	HSNCode       string  `json:"hsnCode"`
	Barcode       string  `json:"barcode"`
	Manufacturer  string  `json:"manufacturer"`
	
	// Purchase-specific fields
	VendorName    string  `json:"vendorName"`
	InvoiceNumber string  `json:"invoiceNumber"`
	InvoiceDate   string  `json:"invoiceDate"`
	
	// Parsed/Matched data
	MatchedProductID string  `json:"matchedProductId"`
	MatchConfidence  float64 `json:"matchConfidence"`
	CategoryDetected string  `json:"categoryDetected"`
	PotencyDetected  string  `json:"potencyDetected"`
	FormDetected     string  `json:"formDetected"`
	AutoCreated      bool    `json:"autoCreated"`
	Warnings         []string `json:"warnings"`
}

// POST /api/erp/uploads/parse - Parse file and create session
func (h *EnhancedUploadsHandler) ParseUploadFile(c *gin.Context) {
	uploadType := c.PostForm("upload_type") // "purchase" or "inventory"
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File required"})
		return
	}
	defer file.Close()

	// Parse file based on extension
	var rows []UploadRow
	ext := strings.ToLower(header.Filename[strings.LastIndex(header.Filename, ".")+1:])
	
	if ext == "csv" {
		rows, err = h.parseCSV(file)
	} else if ext == "xlsx" || ext == "xls" {
		rows, err = h.parseExcel(file)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only CSV and Excel files supported"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse file", "details": err.Error()})
		return
	}

	// Process rows: auto-match products, detect categories
	processedRows := make([]UploadRow, 0)
	for _, row := range rows {
		processed := h.processUploadRow(row, uploadType)
		processedRows = append(processedRows, processed)
	}

	// Create upload session
	sessionData, _ := json.Marshal(processedRows)
	session := map[string]interface{}{
		"id":              uuid.New().String(),
		"upload_type":     uploadType,
		"filename":        header.Filename,
		"total_rows":      len(processedRows),
		"processed_rows":  len(processedRows),
		"approval_status": "pending",
		"session_data":    string(sessionData),
		"uploaded_at":     time.Now(),
		"uploaded_by":     c.GetString("user_id"), // From JWT
	}

	if err := h.db.Table("upload_sessions").Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"sessionId": session["id"],
		"totalRows": len(processedRows),
		"summary": gin.H{
			"autoMatched": countMatched(processedRows),
			"autoCreated": countAutoCreated(processedRows),
			"warnings":    countWarnings(processedRows),
		},
		"rows": processedRows,
	})
}

// ============================================================================
// PROCESS PURCHASE UPLOAD (Official Purchase with Vendor/Invoice)
// ============================================================================

// POST /api/erp/uploads/process/purchase
func (h *EnhancedUploadsHandler) ProcessPurchaseUpload(c *gin.Context) {
	var req struct {
		SessionID     string `json:"sessionId" binding:"required"`
		VendorID      string `json:"vendorId" binding:"required"`
		InvoiceNumber string `json:"invoiceNumber" binding:"required"`
		InvoiceDate   string `json:"invoiceDate" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get session
	var session map[string]interface{}
	if err := h.db.Table("upload_sessions").Where("id = ?", req.SessionID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session["upload_type"] != "purchase" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session is not a purchase upload"})
		return
	}

	// Parse session data
	var rows []UploadRow
	json.Unmarshal([]byte(session["session_data"].(string)), &rows)

	// Begin transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Create Purchase Order
	invoiceDate, _ := time.Parse("2006-01-02", req.InvoiceDate)
	purchaseOrder := models.PurchaseOrder{
		ID:                   uuid.New().String(),
		OrderNumber:          req.InvoiceNumber,
		VendorID:             req.VendorID,
		OrderDate:            invoiceDate,
		ExpectedDeliveryDate: &invoiceDate,
		Status:               "received",
		Subtotal:             0, // Will calculate
		TaxAmount:            0,
		TotalAmount:          0, // Will calculate
		Notes:                fmt.Sprintf("Auto-created from upload session %s", req.SessionID),
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	// 2. Process each row
	totalAmount := 0.0
	taxAmount := 0.0
	
	for _, row := range rows {
		// Get or create product
		productID := row.MatchedProductID
		if productID == "" {
			// Auto-create product
			product := h.autoCreateProduct(row)
			if err := tx.Create(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product", "details": err.Error()})
				return
			}
			productID = product.ID
		} else {
			// Update existing product if MRP/GST/HSN changed
			h.updateProductMaster(tx, productID, row)
		}

		// Parse expiry date
		var expiryDate *time.Time
		if row.ExpiryDate != "" {
			parsed, _ := time.Parse("2006-01-02", row.ExpiryDate)
			expiryDate = &parsed
		}

		// Create Purchase Order Item
		qty := row.Quantity + row.FreeQuantity
		lineTotal := row.PurchaseRate * row.Quantity
		lineTax := lineTotal * (row.TaxPercent / 100)
		
		poItem := models.PurchaseOrderItem{
			ID:              uuid.New().String(),
			PurchaseOrderID: purchaseOrder.ID,
			ProductID:       productID,
			Quantity:        qty,
			ReceivedQuantity: qty,
			UnitPrice:       row.PurchaseRate,
			TaxPercent:      row.TaxPercent,
			TaxAmount:       lineTax,
			TotalAmount:     lineTotal + lineTax,
			CreatedAt:       time.Now(),
		}
		
		if err := tx.Create(&poItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create PO item"})
			return
		}

		// Create Inventory Batch (stock_source='purchase')
		batch := models.InventoryBatch{
			ID:                uuid.New().String(),
			ProductID:         productID,
			BatchNumber:       row.BatchNumber,
			ExpiryDate:        expiryDate,
			Quantity:          qty,
			AvailableQuantity: qty,
			UnitCost:          row.PurchaseRate,
			SellingPrice:      row.SellingPrice,
			MRP:               row.MRP,
			SupplierID:        &req.VendorID,
			PurchaseOrderID:   purchaseOrder.ID,
			StockSource:       "purchase", // ✅ CRITICAL: Mark as official purchase
			IsActive:          true,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		if err := tx.Create(&batch).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
			return
		}

		// Update product current_stock
		tx.Model(&models.Product{}).Where("id = ?", productID).
			UpdateColumn("current_stock", gorm.Expr("current_stock + ?", qty))

		totalAmount += lineTotal
		taxAmount += lineTax
	}

	// Update Purchase Order totals
	purchaseOrder.Subtotal = totalAmount
	purchaseOrder.TaxAmount = taxAmount
	purchaseOrder.TotalAmount = totalAmount + taxAmount

	if err := tx.Create(&purchaseOrder).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create purchase order"})
		return
	}

	// 3. Create Purchase Receipt (GRN)
	receipt := models.PurchaseReceipt{
		ID:              uuid.New().String(),
		PurchaseOrderID: &purchaseOrder.ID,
		ReceiptNumber:   "GRN-" + req.InvoiceNumber,
		ReceiptDate:     time.Now(),
		TotalAmount:     purchaseOrder.TotalAmount,
		Notes:           "Auto-generated GRN from purchase upload",
		CreatedAt:       time.Now(),
	}

	if err := tx.Create(&receipt).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create receipt"})
		return
	}

	// 4. Update session status
	tx.Table("upload_sessions").Where("id = ?", req.SessionID).
		Updates(map[string]interface{}{
			"approval_status": "approved",
			"processed_at":    time.Now(),
		})

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"purchaseOrderId": purchaseOrder.ID,
		"receiptId":       receipt.ID,
		"totalRows":       len(rows),
		"totalAmount":     totalAmount,
		"taxAmount":       taxAmount,
		"grandTotal":      purchaseOrder.TotalAmount,
	})
}

// ============================================================================
// PROCESS INVENTORY UPLOAD (Opening Stock / Physical Verification)
// ============================================================================

// POST /api/erp/uploads/process/inventory
func (h *EnhancedUploadsHandler) ProcessInventoryUpload(c *gin.Context) {
	var req struct {
		SessionID string `json:"sessionId" binding:"required"`
		Reason    string `json:"reason"` // "opening_stock", "physical_verification", "data_migration"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get session
	var session map[string]interface{}
	if err := h.db.Table("upload_sessions").Where("id = ?", req.SessionID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session["upload_type"] != "inventory" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session is not an inventory upload"})
		return
	}

	// Parse session data
	var rows []UploadRow
	json.Unmarshal([]byte(session["session_data"].(string)), &rows)

	// Begin transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	createdBatches := 0
	totalQuantity := 0.0

	// Process each row
	for _, row := range rows {
		// Get or create product
		productID := row.MatchedProductID
		if productID == "" {
			// Auto-create product
			product := h.autoCreateProduct(row)
			if err := tx.Create(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
				return
			}
			productID = product.ID
		} else {
			// Update existing product if MRP/GST/HSN missing
			h.updateProductMaster(tx, productID, row)
		}

		// Parse expiry date
		var expiryDate *time.Time
		if row.ExpiryDate != "" {
			parsed, _ := time.Parse("2006-01-02", row.ExpiryDate)
			expiryDate = &parsed
		}

		// Create Inventory Batch (stock_source='inventory')
		// NO vendor, NO purchase_order, NO invoice
		batch := models.InventoryBatch{
			ID:                uuid.New().String(),
			ProductID:         productID,
			BatchNumber:       row.BatchNumber,
			ExpiryDate:        expiryDate,
			Quantity:          row.Quantity,
			AvailableQuantity: row.Quantity,
			UnitCost:          row.PurchaseRate,
			SellingPrice:      row.SellingPrice,
			MRP:               row.MRP,
			SupplierID:        nil,            // ✅ NO vendor for inventory upload
			PurchaseOrderID:   "",             // ✅ NO purchase order
			StockSource:       "inventory",    // ✅ CRITICAL: Mark as opening stock
			IsActive:          true,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		if err := tx.Create(&batch).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
			return
		}

		// Create Stock Adjustment record for audit
		adjustment := models.StockAdjustment{
			ID:             uuid.New().String(),
			ProductID:      &productID,
			BatchID:        &batch.ID,
			AdjustmentType: "IN",
			QuantityBefore: 0,
			QuantityAfter:  row.Quantity,
			QuantityDelta:  row.Quantity,
			UnitCost:       row.PurchaseRate,
			TotalCost:      row.PurchaseRate * row.Quantity,
			Reason:         req.Reason,
			Notes:          fmt.Sprintf("Inventory upload from session %s", req.SessionID),
			AdjustedBy:     c.GetString("user_id"),
			CreatedAt:      time.Now(),
		}

		if err := tx.Create(&adjustment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create adjustment"})
			return
		}

		// Update product current_stock
		tx.Model(&models.Product{}).Where("id = ?", productID).
			UpdateColumn("current_stock", gorm.Expr("current_stock + ?", row.Quantity))

		createdBatches++
		totalQuantity += row.Quantity
	}

	// Update session status
	tx.Table("upload_sessions").Where("id = ?", req.SessionID).
		Updates(map[string]interface{}{
			"approval_status": "approved",
			"processed_at":    time.Now(),
		})

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"createdBatches": createdBatches,
		"totalQuantity":  totalQuantity,
		"reason":         req.Reason,
	})
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func (h *EnhancedUploadsHandler) processUploadRow(row UploadRow, uploadType string) UploadRow {
	// 1. Normalize product name
	parsed := h.normalizer.NormalizeProductName(row.ProductName)
	row.PotencyDetected = parsed.Potency
	row.FormDetected = parsed.Form

	// 2. Detect category
	categoryMatch, _ := h.classifier.ClassifyProduct(parsed, row.ProductName)
	if categoryMatch != nil {
		row.CategoryDetected = categoryMatch.CategoryName
	}

	// 3. Auto-match existing product
	product, confidence, _ := h.normalizer.FindMatchingProduct(row.ProductName, row.Barcode)
	if product != nil {
		row.MatchedProductID = product.ID
		row.MatchConfidence = confidence
	} else {
		row.AutoCreated = true
		row.Warnings = append(row.Warnings, "Product will be auto-created")
	}

	// 4. Validate required fields
	if uploadType == "purchase" && row.VendorName == "" {
		row.Warnings = append(row.Warnings, "Vendor name missing for purchase")
	}
	if row.Quantity <= 0 {
		row.Warnings = append(row.Warnings, "Invalid quantity")
	}
	if row.MRP <= 0 {
		row.Warnings = append(row.Warnings, "MRP missing or invalid")
	}

	return row
}

func (h *EnhancedUploadsHandler) autoCreateProduct(row UploadRow) models.Product {
	// Parse name for potency/form
	parsed := h.normalizer.NormalizeProductName(row.ProductName)

	// Generate SKU
	sku := fmt.Sprintf("AUTO-%d", time.Now().Unix())

	// Determine GST
	taxRate := row.TaxPercent
	if taxRate == 0 {
		taxRate = h.normalizer.DetermineGST(parsed.Form)
	}

	// Note: We're setting simple string fields, not foreign keys
	// In a production system, you'd look up or create Category/Brand/etc IDs
	return models.Product{
		ID:           uuid.New().String(),
		SKU:          sku,
		Name:         row.ProductName,
		// CategoryID would be looked up from categories table
		// CategoryID:   nil, // TODO: Look up category by name
		PackSize:     parsed.PackSize,
		MRP:          row.MRP,
		SellingPrice: row.SellingPrice,
		CostPrice:    row.PurchaseRate,
		TaxRate:      taxRate, // Note: Field is TaxRate not TaxPercent
		Barcode:      row.Barcode,
		Manufacturer: row.Manufacturer,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

func (h *EnhancedUploadsHandler) updateProductMaster(tx *gorm.DB, productID string, row UploadRow) {
	updates := make(map[string]interface{})

	// Update MRP if different
	if row.MRP > 0 {
		updates["mrp"] = row.MRP
	}

	// Update GST if provided
	if row.TaxPercent > 0 {
		updates["tax_rate"] = row.TaxPercent // Note: Field is tax_rate
	}

	// Update HSN if missing
	if row.HSNCode != "" {
		updates["hsn_code"] = row.HSNCode
	}

	// Update barcode if missing
	if row.Barcode != "" {
		updates["barcode"] = row.Barcode
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		tx.Model(&models.Product{}).Where("id = ?", productID).Updates(updates)
	}
}

// ============================================================================
// FILE PARSING
// ============================================================================

func (h *EnhancedUploadsHandler) parseCSV(file io.Reader) ([]UploadRow, error) {
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("CSV file must have header and at least one data row")
	}

	// Parse header to get column indexes
	header := records[0]
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	rows := make([]UploadRow, 0)
	for i := 1; i < len(records); i++ {
		record := records[i]
		row := UploadRow{
			ProductName:   getCol(record, colMap, "product_name", "name", "product"),
			BatchNumber:   getCol(record, colMap, "batch", "batch_number", "batch_no"),
			ExpiryDate:    getCol(record, colMap, "expiry", "expiry_date", "exp_date"),
			Quantity:      parseFloat(getCol(record, colMap, "quantity", "qty")),
			FreeQuantity:  parseFloat(getCol(record, colMap, "free_quantity", "free_qty", "free")),
			PurchaseRate:  parseFloat(getCol(record, colMap, "purchase_rate", "rate", "cost")),
			MRP:           parseFloat(getCol(record, colMap, "mrp", "max_price")),
			SellingPrice:  parseFloat(getCol(record, colMap, "selling_price", "sp", "price")),
			TaxPercent:    parseFloat(getCol(record, colMap, "gst", "tax", "tax_percent")),
			HSNCode:       getCol(record, colMap, "hsn", "hsn_code"),
			Barcode:       getCol(record, colMap, "barcode", "ean"),
			Manufacturer:  getCol(record, colMap, "manufacturer", "mfg"),
			VendorName:    getCol(record, colMap, "vendor", "vendor_name", "supplier"),
			InvoiceNumber: getCol(record, colMap, "invoice", "invoice_number", "bill_no"),
			InvoiceDate:   getCol(record, colMap, "invoice_date", "bill_date", "date"),
		}
		rows = append(rows, row)
	}

	return rows, nil
}

func (h *EnhancedUploadsHandler) parseExcel(file io.Reader) ([]UploadRow, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("No sheets found in Excel file")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("Excel file must have header and at least one data row")
	}

	// Parse header
	header := rows[0]
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	result := make([]UploadRow, 0)
	for i := 1; i < len(rows); i++ {
		record := rows[i]
		row := UploadRow{
			ProductName:   getCol(record, colMap, "product_name", "name", "product"),
			BatchNumber:   getCol(record, colMap, "batch", "batch_number", "batch_no"),
			ExpiryDate:    getCol(record, colMap, "expiry", "expiry_date", "exp_date"),
			Quantity:      parseFloat(getCol(record, colMap, "quantity", "qty")),
			FreeQuantity:  parseFloat(getCol(record, colMap, "free_quantity", "free_qty", "free")),
			PurchaseRate:  parseFloat(getCol(record, colMap, "purchase_rate", "rate", "cost")),
			MRP:           parseFloat(getCol(record, colMap, "mrp", "max_price")),
			SellingPrice:  parseFloat(getCol(record, colMap, "selling_price", "sp", "price")),
			TaxPercent:    parseFloat(getCol(record, colMap, "gst", "tax", "tax_percent")),
			HSNCode:       getCol(record, colMap, "hsn", "hsn_code"),
			Barcode:       getCol(record, colMap, "barcode", "ean"),
			Manufacturer:  getCol(record, colMap, "manufacturer", "mfg"),
			VendorName:    getCol(record, colMap, "vendor", "vendor_name", "supplier"),
			InvoiceNumber: getCol(record, colMap, "invoice", "invoice_number", "bill_no"),
			InvoiceDate:   getCol(record, colMap, "invoice_date", "bill_date", "date"),
		}
		result = append(result, row)
	}

	return result, nil
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

func getCol(record []string, colMap map[string]int, aliases ...string) string {
	for _, alias := range aliases {
		if idx, ok := colMap[alias]; ok && idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
	}
	return ""
}

func parseFloat(s string) float64 {
	s = strings.ReplaceAll(s, ",", "")
	s = strings.TrimSpace(s)
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func countMatched(rows []UploadRow) int {
	count := 0
	for _, row := range rows {
		if row.MatchedProductID != "" {
			count++
		}
	}
	return count
}

func countAutoCreated(rows []UploadRow) int {
	count := 0
	for _, row := range rows {
		if row.AutoCreated {
			count++
		}
	}
	return count
}

func countWarnings(rows []UploadRow) int {
	count := 0
	for _, row := range rows {
		count += len(row.Warnings)
	}
	return count
}
