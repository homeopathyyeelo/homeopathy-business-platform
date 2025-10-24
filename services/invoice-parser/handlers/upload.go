package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	db          *sql.DB
	minioClient interface{}
}

type ParsedInvoice struct {
	ID            string            `json:"parsed_invoice_id"`
	VendorID      string            `json:"vendor_id"`
	ShopID        string            `json:"shop_id"`
	InvoiceNumber string            `json:"invoice_number"`
	InvoiceDate   time.Time         `json:"invoice_date"`
	Currency      string            `json:"currency"`
	TotalAmount   float64           `json:"total_amount"`
	ParsedLines   []ParsedLine      `json:"parsed_lines"`
	Status        string            `json:"status"`
	CreatedAt     time.Time         `json:"created_at"`
}

type ParsedLine struct {
	LineID              string   `json:"line_id"`
	RawText             string   `json:"raw_text"`
	Description         string   `json:"description"`
	Qty                 float64  `json:"qty"`
	UnitPrice           float64  `json:"unit_price"`
	TaxRate             float64  `json:"tax_rate"`
	BatchNo             *string  `json:"batch_no"`
	ExpiryDate          *string  `json:"expiry_date"`
	SuggestedProductID  *string  `json:"suggested_product_id"`
	MatchedProductID    *string  `json:"matched_product_id"`
	MatchType           string   `json:"match_type"`
	MatchConfidence     float64  `json:"match_confidence"`
}

func NewUploadHandler(db *sql.DB, minio interface{}) *UploadHandler {
	return &UploadHandler{db: db, minioClient: minio}
}

// POST /api/v1/purchases/invoices/upload
func (h *UploadHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}
	defer file.Close()

	vendorID := c.PostForm("vendor_id")
	shopID := c.PostForm("shop_id")
	source := c.DefaultPostForm("source", "manual")

	if vendorID == "" || shopID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "vendor_id and shop_id required"})
		return
	}

	// Create parsed invoice record
	invoiceID := uuid.New().String()
	pdfPath := fmt.Sprintf("invoices/%s/%s", vendorID, header.Filename)

	// Store PDF in MinIO (simplified)
	pdfData, _ := io.ReadAll(file)
	
	// Insert into database
	_, err = h.db.Exec(`
		INSERT INTO parsed_invoices (
			id, vendor_id, shop_id, source_type, source_ref,
			raw_pdf_path, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7)
	`, invoiceID, vendorID, shopID, source, header.Filename, pdfPath, time.Now())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Trigger async parsing job
	go h.parseInvoiceAsync(invoiceID, pdfData, pdfPath)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"parsed_invoice_id": invoiceID,
			"status":            "processing",
		},
	})
}

func (h *UploadHandler) parseInvoiceAsync(invoiceID string, pdfData []byte, pdfPath string) {
	// Extract text from PDF
	extractedText := h.extractTextFromPDF(pdfData)
	
	// Parse invoice lines
	lines := h.parseInvoiceLines(extractedText)
	
	// Match products
	matchedLines := h.matchProducts(lines)
	
	// Store parsed lines
	for _, line := range matchedLines {
		lineID := uuid.New().String()
		_, err := h.db.Exec(`
			INSERT INTO parsed_invoice_lines (
				id, parsed_invoice_id, raw_text, description,
				qty, unit_price, tax_rate, batch_no, expiry_date,
				suggested_product_id, matched_product_id,
				match_type, match_confidence, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
		`, lineID, invoiceID, line.RawText, line.Description,
			line.Qty, line.UnitPrice, line.TaxRate, line.BatchNo, line.ExpiryDate,
			line.SuggestedProductID, line.MatchedProductID,
			line.MatchType, line.MatchConfidence)
		
		if err != nil {
			fmt.Printf("Error inserting line: %v\n", err)
		}
	}
	
	// Update invoice status
	h.db.Exec(`
		UPDATE parsed_invoices 
		SET status = 'parsed', parsed_at = $1 
		WHERE id = $2
	`, time.Now(), invoiceID)
	
	// Publish event
	h.publishEvent("invoice.parsed.v1", invoiceID)
}

func (h *UploadHandler) extractTextFromPDF(data []byte) string {
	// TODO: Use pdfplumber or Tika
	return "Sample extracted text from PDF"
}

func (h *UploadHandler) parseInvoiceLines(text string) []ParsedLine {
	// TODO: Implement actual line parsing logic
	return []ParsedLine{
		{
			RawText:     "SBL Arnica 30C 10ml - 12 units @ 85.00",
			Description: "Arnica Montana 30C 10ml",
			Qty:         12,
			UnitPrice:   85.00,
			TaxRate:     18.0,
		},
	}
}

func (h *UploadHandler) matchProducts(lines []ParsedLine) []ParsedLine {
	for i := range lines {
		// Try SKU match
		var productID string
		var confidence float64
		
		err := h.db.QueryRow(`
			SELECT id FROM products 
			WHERE name ILIKE $1 
			LIMIT 1
		`, "%"+lines[i].Description+"%").Scan(&productID)
		
		if err == nil {
			lines[i].MatchedProductID = &productID
			lines[i].MatchType = "exact"
			lines[i].MatchConfidence = 0.95
		} else {
			// Fuzzy match
			err = h.db.QueryRow(`
				SELECT id, similarity(name, $1) as sim
				FROM products
				WHERE similarity(name, $1) > 0.6
				ORDER BY sim DESC
				LIMIT 1
			`, lines[i].Description).Scan(&productID, &confidence)
			
			if err == nil {
				lines[i].SuggestedProductID = &productID
				lines[i].MatchType = "fuzzy"
				lines[i].MatchConfidence = confidence
			} else {
				lines[i].MatchType = "unmatched"
				lines[i].MatchConfidence = 0
			}
		}
	}
	return lines
}

func (h *UploadHandler) publishEvent(eventType, aggregateID string) {
	event := map[string]interface{}{
		"event_type":     eventType,
		"aggregate_type": "parsed_invoice",
		"aggregate_id":   aggregateID,
		"timestamp":      time.Now(),
	}
	
	eventJSON, _ := json.Marshal(event)
	
	h.db.Exec(`
		INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, published)
		VALUES ($1, $2, $3, $4, false)
	`, "parsed_invoice", aggregateID, eventType, eventJSON)
}

// GET /api/v1/purchases/invoices/:id/parsed
func (h *UploadHandler) GetParsed(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var invoice ParsedInvoice
	err := h.db.QueryRow(`
		SELECT id, vendor_id, shop_id, invoice_number, 
			   COALESCE(invoice_date, created_at), currency, 
			   total_amount, status, created_at
		FROM parsed_invoices
		WHERE id = $1
	`, invoiceID).Scan(
		&invoice.ID, &invoice.VendorID, &invoice.ShopID,
		&invoice.InvoiceNumber, &invoice.InvoiceDate,
		&invoice.Currency, &invoice.TotalAmount,
		&invoice.Status, &invoice.CreatedAt,
	)
	
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
		return
	}
	
	// Get lines
	rows, _ := h.db.Query(`
		SELECT id, raw_text, description, qty, unit_price, tax_rate,
			   batch_no, expiry_date, suggested_product_id,
			   matched_product_id, match_type, match_confidence
		FROM parsed_invoice_lines
		WHERE parsed_invoice_id = $1
		ORDER BY id
	`, invoiceID)
	defer rows.Close()
	
	invoice.ParsedLines = []ParsedLine{}
	for rows.Next() {
		var line ParsedLine
		rows.Scan(&line.LineID, &line.RawText, &line.Description,
			&line.Qty, &line.UnitPrice, &line.TaxRate,
			&line.BatchNo, &line.ExpiryDate, &line.SuggestedProductID,
			&line.MatchedProductID, &line.MatchType, &line.MatchConfidence)
		invoice.ParsedLines = append(invoice.ParsedLines, line)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoice,
	})
}

// POST /api/v1/purchases/invoices/:id/confirm
func (h *UploadHandler) Confirm(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var req struct {
		ShopID       string `json:"shop_id"`
		ApproveBy    string `json:"approve_by"`
		AutoAllocate bool   `json:"auto_allocate"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Create vendor receipt (GRN)
	receiptID := uuid.New().String()
	
	tx, _ := h.db.Begin()
	defer tx.Rollback()
	
	// Insert receipt
	_, err := tx.Exec(`
		INSERT INTO purchase_receipts (
			id, parsed_invoice_id, shop_id, status, received_by, received_at
		) VALUES ($1, $2, $3, 'completed', $4, $5)
	`, receiptID, invoiceID, req.ShopID, req.ApproveBy, time.Now())
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Update inventory for each matched line
	rows, _ := tx.Query(`
		SELECT matched_product_id, qty, unit_price, batch_no, expiry_date
		FROM parsed_invoice_lines
		WHERE parsed_invoice_id = $1 AND matched_product_id IS NOT NULL
	`, invoiceID)
	
	for rows.Next() {
		var productID string
		var qty, unitPrice float64
		var batchNo, expiryDate sql.NullString
		
		rows.Scan(&productID, &qty, &unitPrice, &batchNo, &expiryDate)
		
		// Update or create inventory batch
		if !batchNo.Valid {
			batchNo.String = fmt.Sprintf("AUTO-%s", time.Now().Format("20060102"))
			batchNo.Valid = true
		}
		
		tx.Exec(`
			INSERT INTO inventory_batches (
				id, shop_id, product_id, batch_no, qty_available,
				unit_cost, expiry_date, status, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
			ON CONFLICT (shop_id, product_id, batch_no)
			DO UPDATE SET 
				qty_available = inventory_batches.qty_available + $5,
				last_restocked = $8
		`, uuid.New().String(), req.ShopID, productID, batchNo.String,
			qty, unitPrice, expiryDate, time.Now())
	}
	rows.Close()
	
	// Update invoice status
	tx.Exec(`UPDATE parsed_invoices SET status = 'confirmed' WHERE id = $1`, invoiceID)
	
	// Publish events
	h.publishEvent("purchase.receipt.created.v1", receiptID)
	h.publishEvent("inventory.restocked.v1", receiptID)
	
	tx.Commit()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"receipt_id": receiptID,
			"posted":     true,
		},
	})
}
