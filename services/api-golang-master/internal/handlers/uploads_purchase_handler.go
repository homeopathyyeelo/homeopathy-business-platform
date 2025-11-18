package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PurchaseUploadHandler replicates TypeScript upload-purchase behavior
type PurchaseUploadHandler struct {
	db *gorm.DB
}

func NewPurchaseUploadHandler(db *gorm.DB) *PurchaseUploadHandler {
	return &PurchaseUploadHandler{db: db}
}

// PurchaseUploadRow mirrors TypeScript interface
type PurchaseUploadRow struct {
	InvoiceNumber string
	InvoiceDate   string
	SupplierName  string
	SupplierGSTIN string
	ProductCode   string
	ProductName   string
	Brand         string
	Potency       string
	Size          string
	Form          string
	Unit          string
	HSNCode       string
	BatchNumber   string
	ExpiryDate    string
	Quantity      string
	UnitPrice     string
	MRP           string
	DiscountPct   string
	DiscountAmt   string
	TaxPct        string
	TaxAmt        string
	TotalAmount   string
}

// UploadPurchase handles POST /api/uploads/purchase (full TypeScript behavior)
func (h *PurchaseUploadHandler) UploadPurchase(c *gin.Context) {
	// Get auth token (simplified - in prod validate JWT)
	authToken := c.GetHeader("Authorization")
	if authToken == "" {
		cookie, err := c.Cookie("auth-token")
		if err == nil {
			authToken = "Bearer " + cookie
		}
	}
	if authToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	// Read and parse CSV
	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file"})
		return
	}

	var records []PurchaseUploadRow
	contentStr := string(content)

	// Detect format and parse
	if strings.Contains(contentStr, "<MARGERP FORMAT>") {
		records, err = h.parseMargERP(contentStr)
	} else {
		records, err = h.parseStandardCSV(contentStr)
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Parse error: %v", err)})
		return
	}
	if len(records) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file is empty or invalid"})
		return
	}

	// Group by invoice number
	invoiceGroups := make(map[string][]PurchaseUploadRow)
	for _, rec := range records {
		invoiceGroups[rec.InvoiceNumber] = append(invoiceGroups[rec.InvoiceNumber], rec)
	}

	// Process each invoice
	var results []gin.H
	for invoiceNo, items := range invoiceGroups {
		result, err := h.processInvoice(c, header, invoiceNo, items)
		if err != nil {
			fmt.Printf("Error processing invoice %s: %v\n", invoiceNo, err)
			continue
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Processed %d invoice(s)", len(results)),
		"results": results,
	})
}

// parseMargERP parses Marg ERP format (mirrors TS logic)
func (h *PurchaseUploadHandler) parseMargERP(text string) ([]PurchaseUploadRow, error) {
	lines := strings.Split(text, "\n")
	var records []PurchaseUploadRow
	var headerInfo map[string]string

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		rowType := line[0]

		if rowType == 'H' {
			// Parse header
			fields := strings.Split(line, ",")
			headerInfo = map[string]string{
				"invoiceNumber": safeGet(fields, 2),
				"invoiceDate":   h.formatDate(safeGet(fields, 3)),
				"supplierName":  safeGet(fields, 31),
				"supplierGSTIN": safeGet(fields, 32),
			}
		} else if rowType == 'T' {
			// Parse transaction
			fields := strings.Split(line, ",")
			if len(fields) >= 20 {
				productName := safeGet(fields, 5)
				records = append(records, PurchaseUploadRow{
					InvoiceNumber: headerInfo["invoiceNumber"],
					InvoiceDate:   headerInfo["invoiceDate"],
					SupplierName:  headerInfo["supplierName"],
					SupplierGSTIN: headerInfo["supplierGSTIN"],
					ProductCode:   safeGet(fields, 3),
					ProductName:   productName,
					Brand:         safeGet(fields, 2),
					Potency:       h.extractPotency(productName),
					Size:          safeGet(fields, 6),
					Form:          h.extractForm(productName),
					Unit:          h.extractUnit(safeGet(fields, 6), productName),
					HSNCode:       safeGet(fields, 36),
					BatchNumber:   safeGet(fields, 8),
					ExpiryDate:    h.formatDate(safeGet(fields, 9)),
					Quantity:      safeGet(fields, 20),
					UnitPrice:     h.calculateUnitPrice(safeGet(fields, 14), safeGet(fields, 22)),
					MRP:           safeGet(fields, 14),
					DiscountPct:   safeGet(fields, 22),
					DiscountAmt:   h.calculateTotalDiscount(safeGet(fields, 20), safeGet(fields, 14), safeGet(fields, 22), safeGet(fields, 24), safeGet(fields, 27)),
					TaxPct:        safeGet(fields, 12),
					TaxAmt:        safeGet(fields, 26),
					TotalAmount:   safeGet(fields, 25),
				})
			}
		}
	}
	return records, nil
}

// parseStandardCSV parses regular CSV
func (h *PurchaseUploadHandler) parseStandardCSV(text string) ([]PurchaseUploadRow, error) {
	reader := csv.NewReader(strings.NewReader(text))
	rows, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("CSV must have header and data rows")
	}

	fmt.Printf("DEBUG: CSV rows count: %d\n", len(rows))
	fmt.Printf("DEBUG: Header: %v\n", rows[0])

	headers := rows[0]
	var records []PurchaseUploadRow

	for i := 1; i < len(rows); i++ {
		if len(rows[i]) == 0 || (len(rows[i]) == 1 && rows[i][0] == "") {
			continue
		}
		fmt.Printf("DEBUG: Row %d: %v\n", i, rows[i])
		row := make(map[string]string)
		for j, hdr := range headers {
			if j < len(rows[i]) {
				row[hdr] = rows[i][j]
			}
		}
		records = append(records, PurchaseUploadRow{
			InvoiceNumber: row["Invoice Number"],
			InvoiceDate:   row["Invoice Date"],
			SupplierName:  row["Supplier Name"],
			SupplierGSTIN: row["Supplier GSTIN"],
			ProductCode:   row["Product Code"],
			ProductName:   row["Product Name"],
			Brand:         row["Brand"],
			Potency:       row["Potency"],
			Size:          row["Size"],
			Form:          row["Form"],
			Unit:          row["Unit"],
			HSNCode:       row["HSN Code"],
			BatchNumber:   row["Batch Number"],
			ExpiryDate:    row["Expiry Date"],
			Quantity:      row["Quantity"],
			UnitPrice:     row["Unit Price"],
			MRP:           row["MRP"],
			DiscountPct:   row["Discount %"],
			DiscountAmt:   row["Discount Amount"],
			TaxPct:        row["Tax %"],
			TaxAmt:        row["Tax Amount"],
			TotalAmount:   row["Total Amount"],
		})
	}
	fmt.Printf("DEBUG: Parsed %d records\n", len(records))
	return records, nil
}

// processInvoice processes a single invoice (mirrors TS logic)
func (h *PurchaseUploadHandler) processInvoice(c *gin.Context, header *multipart.FileHeader, invoiceNo string, items []PurchaseUploadRow) (gin.H, error) {
	if len(items) == 0 {
		return nil, fmt.Errorf("no items for invoice %s", invoiceNo)
	}
	first := items[0]

	// Calculate totals
	subtotal := 0.0
	taxAmount := 0.0
	gstBreakup := make(map[string]float64)
	estProfitNumerator := 0.0
	estProfitDenominator := 0.0

	for _, it := range items {
		qty := parseFloat(it.Quantity)
		unitPrice := parseFloat(it.UnitPrice)
		mrp := parseFloat(it.MRP)
		taxPct := parseFloat(it.TaxPct)
		totalAmt := parseFloat(it.TotalAmount)

		subtotal += totalAmt
		taxAmount += qty * unitPrice * taxPct / 100

		taxKey := fmt.Sprintf("%.0f", taxPct)
		gstBreakup[taxKey] += qty * unitPrice * taxPct / 100

		if mrp > 0 && qty > 0 {
			estProfitNumerator += (mrp - unitPrice) * qty
			estProfitDenominator += mrp * qty
		}
	}

	// Create upload session
	sessionID := uuid.New().String()
	invDate := first.InvoiceDate
	if invDate == "" {
		invDate = "" // Keep empty for NULL in database
	}

	var invDateInterface interface{}
	if invDate == "" {
		invDateInterface = nil
	} else {
		invDateInterface = invDate
	}

	if err := h.db.Exec(`
		INSERT INTO upload_sessions (
			id, upload_type, file_name, file_size, total_rows, status, uploaded_by,
			supplier_name, invoice_number, invoice_date, total_amount, total_items,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
	`, sessionID, "purchase", header.Filename, header.Size, len(items), "awaiting_approval", "system",
		first.SupplierName, invoiceNo, invDateInterface, subtotal, len(items)).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %v", err)
	}

	// Get or create vendor
	var vendorID *string
	if first.SupplierName != "" {
		var vID string
		if err := h.db.Raw(`SELECT id FROM vendors WHERE name = ? LIMIT 1`, first.SupplierName).Scan(&vID).Error; err != nil {
			// Create vendor
			if err := h.db.Raw(`INSERT INTO vendors (name, created_at, updated_at) VALUES (?, NOW(), NOW()) RETURNING id`, first.SupplierName).Scan(&vID).Error; err != nil {
				return nil, fmt.Errorf("failed to create vendor: %v", err)
			}
		}
		vendorID = &vID
	}

	// Create purchase_uploads record
	var purchaseInvDate interface{}
	if invDate == "" {
		purchaseInvDate = nil
	} else {
		purchaseInvDate = invDate
	}

	if err := h.db.Exec(`
		INSERT INTO purchase_uploads (
			session_id, vendor_id, vendor_name, vendor_gstin,
			invoice_number, invoice_date, subtotal, tax_amount, total_amount, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, sessionID, vendorID, first.SupplierName, first.SupplierGSTIN, invoiceNo, purchaseInvDate, subtotal, taxAmount, subtotal, "pending").Error; err != nil {
		return nil, fmt.Errorf("failed to create purchase upload: %v", err)
	}

	// Process items
	matchedCount := 0
	newProductsCount := 0
	updatedProductsCount := 0

	for i, item := range items {
		productId, isNew, err := h.createOrUpdateProduct(item)
		if err != nil {
			fmt.Printf("Error creating product %s: %v\n", item.ProductName, err)
			continue
		}
		if isNew {
			newProductsCount++
		} else {
			updatedProductsCount++
		}
		matchedCount++

		// Insert into upload_items
		if err := h.db.Exec(`
			INSERT INTO upload_items (
				session_id, row_number, product_code, product_name, brand, potency, size, form,
				hsn_code, batch_number, expiry_date, quantity, unit_price, mrp,
				discount_percent, discount_amount, tax_percent, tax_amount, total_amount,
				matched_product_id, match_type, match_confidence, raw_data, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, sessionID, i+1, item.ProductCode, item.ProductName, item.Brand, item.Potency, item.Size, item.Form,
			item.HSNCode, item.BatchNumber, item.ExpiryDate, parseFloat(item.Quantity), parseFloat(item.UnitPrice), parseFloat(item.MRP),
			parseFloat(item.DiscountPct), parseFloat(item.DiscountAmt), parseFloat(item.TaxPct), parseFloat(item.TaxAmt), parseFloat(item.TotalAmount),
			productId, map[bool]string{true: "auto-created", false: "existing"}[isNew], 100, "{}", "matched").Error; err != nil {
			fmt.Printf("Failed to insert upload item: %v\n", err)
		}
	}

	// Update session status
	h.db.Exec(`UPDATE upload_sessions SET status = ?, processed_rows = ? WHERE id = ?`, "awaiting_approval", len(items), sessionID)

	estProfitPercent := 0.0
	if estProfitDenominator > 0 {
		estProfitPercent = (estProfitNumerator / estProfitDenominator) * 100
	}

	return gin.H{
		"sessionId":            sessionID,
		"invoiceNumber":        invoiceNo,
		"itemCount":            len(items),
		"matchedCount":         matchedCount,
		"unmatchedCount":       0,
		"newProductsCount":     newProductsCount,
		"updatedProductsCount": updatedProductsCount,
		"totals": gin.H{
			"subtotal":               subtotal,
			"taxAmount":              taxAmount,
			"gstBreakup":             gstBreakup,
			"estimatedProfitPercent": estProfitPercent,
		},
	}, nil
}

// createOrUpdateProduct mirrors TS createOrUpdateProduct
func (h *PurchaseUploadHandler) createOrUpdateProduct(item PurchaseUploadRow) (string, bool, error) {
	// Check existing by SKU or name
	var existing struct {
		ID string
	}
	err := h.db.Raw(`SELECT id FROM products WHERE sku = ? OR name = ? LIMIT 1`, item.ProductCode, item.ProductName).Scan(&existing).Error

	if err == nil && existing.ID != "" {
		// Update existing product with latest MRP/GST
		hsnInfo := h.determineHSNCode(item.ProductName, item.Form)
		h.db.Exec(`UPDATE products SET mrp = ?, selling_price = ?, gst_rate = ?, updated_at = NOW() WHERE id = ?`,
			parseFloat(item.MRP), parseFloat(item.MRP), hsnInfo["gstRate"].(float64), existing.ID)
		return existing.ID, false, nil
	}

	// Create new product
	hsnInfo := h.determineHSNCode(item.ProductName, item.Form)
	category := h.determineCategory(item.ProductName, item.Form)

	// Get/create brand, category, HSN
	brandID, _ := h.getOrCreateBrand(item.Brand)
	categoryID, _ := h.getOrCreateCategory(category)
	hsnID, _ := h.getOrCreateHSNCode(hsnInfo["hsn"].(string), hsnInfo["gstRate"].(float64))

	// Generate barcode
	barcode := strings.ToUpper(strings.ReplaceAll(item.ProductCode, " ", ""))
	if barcode == "" {
		barcode = fmt.Sprintf("PROD%d", time.Now().Unix())
	}

	var productID string
	if err := h.db.Raw(`
		INSERT INTO products (
			name, sku, barcode, description, brand_id, category_id, hsn_code_id,
			potency, form, size, unit, mrp, selling_price, gst_rate, stock_qty,
			is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, true, NOW(), NOW())
		RETURNING id
	`, item.ProductName, item.ProductCode, barcode, fmt.Sprintf("Auto-created from purchase upload: %s", item.ProductName),
		brandID, categoryID, hsnID, item.Potency, item.Form, item.Size, item.Unit,
		parseFloat(item.MRP), parseFloat(item.MRP), hsnInfo["gstRate"].(float64)).Scan(&productID).Error; err != nil {
		return "", false, fmt.Errorf("failed to create product: %v", err)
	}

	return productID, true, nil
}

// Helper functions mirroring TS utilities
func (h *PurchaseUploadHandler) determineHSNCode(productName, form string) map[string]interface{} {
	name := strings.ToLower(productName)

	cosmeticKeywords := []string{"shampoo", "soap", "toothpaste", "facewash", "hair oil", "lotion", "cream", "deodorant", "cosmetic", "beauty"}
	for _, kw := range cosmeticKeywords {
		if strings.Contains(name, kw) {
			return map[string]interface{}{"hsn": "330499", "gstRate": 18.0}
		}
	}
	return map[string]interface{}{"hsn": "30049014", "gstRate": 5.0}
}

func (h *PurchaseUploadHandler) determineCategory(productName, form string) string {
	name := strings.ToLower(productName)
	formType := strings.ToLower(form)

	categories := map[string][]string{
		"Tablets":            {"tablet", "tabs"},
		"Dilutions":          {"dilution"},
		"Mother Tinctures":   {"mother tincture", "q", "mt"},
		"Ointments & Creams": {"ointment", "cream", "gel"},
		"Drops":              {"drop"},
		"Syrups":             {"syrup", "syp"},
		"Oils":               {"oil"},
		"Bio Combination":    {"bc-"},
		"Biochemic":          {"biochemic"},
	}

	for cat, keywords := range categories {
		for _, kw := range keywords {
			if strings.Contains(formType, kw) || strings.Contains(name, kw) {
				return cat
			}
		}
	}
	return "Patent Medicines"
}

func (h *PurchaseUploadHandler) getOrCreateBrand(name string) (*string, error) {
	if name == "" {
		return nil, nil
	}
	var id string
	if err := h.db.Raw(`SELECT id FROM brands WHERE name = ? LIMIT 1`, name).Scan(&id).Error; err != nil {
		code := strings.ToUpper(strings.ReplaceAll(name, " ", "_"))
		if err := h.db.Raw(`INSERT INTO brands (name, code, description, is_active) VALUES (?, ?, ?, true) RETURNING id`,
			name, code, fmt.Sprintf("Auto-created brand for %s", name)).Scan(&id).Error; err != nil {
			return nil, err
		}
	}
	return &id, nil
}

func (h *PurchaseUploadHandler) getOrCreateCategory(name string) (*string, error) {
	if name == "" {
		return nil, nil
	}
	var id string
	if err := h.db.Raw(`SELECT id FROM categories WHERE name = ? LIMIT 1`, name).Scan(&id).Error; err != nil {
		code := strings.ToUpper(strings.ReplaceAll(name, " ", "_"))
		if err := h.db.Raw(`INSERT INTO categories (name, code, description, is_active) VALUES (?, ?, ?, true) RETURNING id`,
			name, code, fmt.Sprintf("Auto-created category for %s", name)).Scan(&id).Error; err != nil {
			return nil, err
		}
	}
	return &id, nil
}

func (h *PurchaseUploadHandler) getOrCreateHSNCode(code string, rate float64) (*string, error) {
	if code == "" {
		code = "30049014"
	}
	var id string
	if err := h.db.Raw(`SELECT id FROM hsn_codes WHERE code = ? LIMIT 1`, code).Scan(&id).Error; err != nil {
		if err := h.db.Raw(`INSERT INTO hsn_codes (code, description, gst_rate, is_active) VALUES (?, ?, ?, true) RETURNING id`,
			code, fmt.Sprintf("Auto-created HSN code for %s", code), rate).Scan(&id).Error; err != nil {
			return nil, err
		}
	}
	return &id, nil
}

// String parsing helpers
func (h *PurchaseUploadHandler) extractPotency(name string) string {
	// Simple regex-like extraction
	if strings.Contains(strings.ToLower(name), "dilution") {
		parts := strings.Fields(name)
		for i, p := range parts {
			if strings.ToLower(p) == "dilution" && i+1 < len(parts) {
				return parts[i+1]
			}
		}
	}
	return ""
}

func (h *PurchaseUploadHandler) extractForm(name string) string {
	lower := strings.ToLower(name)
	if strings.Contains(lower, "dilution") {
		return "Dilution"
	}
	if strings.Contains(lower, "mother tinc") || strings.Contains(lower, " q") {
		return "Mother Tincture"
	}
	if strings.Contains(lower, "drop") {
		return "Drops"
	}
	if strings.Contains(lower, "syrup") || strings.Contains(lower, "syp") {
		return "Syrup"
	}
	if strings.Contains(lower, "ointment") || strings.Contains(lower, "cream") {
		return "Ointment"
	}
	return "Liquid"
}

func (h *PurchaseUploadHandler) extractUnit(size, name string) string {
	lower := strings.ToLower(size + " " + name)
	if strings.Contains(lower, "ml") {
		return "ml"
	}
	if strings.Contains(lower, "gm") || strings.Contains(lower, "g") {
		return "gm"
	}
	if strings.Contains(lower, "tab") {
		return "tabs"
	}
	return "ml"
}

func (h *PurchaseUploadHandler) formatDate(dateStr string) string {
	if dateStr == "" || dateStr == "00000000" {
		return ""
	}
	if len(dateStr) == 8 {
		return fmt.Sprintf("%s-%s-%s", dateStr[4:8], dateStr[2:4], dateStr[0:2])
	}
	return dateStr
}

func (h *PurchaseUploadHandler) calculateUnitPrice(mrp, discount string) string {
	mrpVal := parseFloat(mrp)
	disc := parseFloat(discount)
	if mrpVal == 0 {
		return "0"
	}
	return fmt.Sprintf("%.2f", mrpVal*(100-disc)/100)
}

func (h *PurchaseUploadHandler) calculateTotalDiscount(qty, mrp, discount, spl, spl2 string) string {
	q := parseFloat(qty)
	mrpVal := parseFloat(mrp)
	disc := parseFloat(discount)
	splVal := parseFloat(spl)
	spl2Val := parseFloat(spl2)

	mainDiscount := q * (mrpVal * disc / 100)
	splDiscount := q * splVal
	spl2Discount := q * spl2Val

	return fmt.Sprintf("%.2f", mainDiscount+splDiscount+spl2Discount)
}

// Utility functions
func safeGet(slice []string, index int) string {
	if index < len(slice) {
		return slice[index]
	}
	return ""
}
