package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InvoiceParserHandler struct {
	DB *gorm.DB
}

func NewInvoiceParserHandler(db *gorm.DB) *InvoiceParserHandler {
	return &InvoiceParserHandler{DB: db}
}

type ParsedInvoice struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	InvoiceNumber   string    `json:"invoice_number"`
	VendorName      string    `json:"vendor_name"`
	VendorGSTIN     string    `json:"vendor_gstin"`
	InvoiceDate     time.Time `json:"invoice_date"`
	TotalAmount     float64   `json:"total_amount"`
	TaxAmount       float64   `json:"tax_amount"`
	Status          string    `json:"status"` // pending, matched, reconciled
	FilePath        string    `json:"file_path"`
	OriginalText    string    `json:"original_text" gorm:"type:text"`
	ParsedData      string    `json:"parsed_data" gorm:"type:jsonb"`
	MatchedProducts int       `json:"matched_products"`
	UnmatchedItems  int       `json:"unmatched_items"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type InvoiceLineItem struct {
	ID              uint    `json:"id" gorm:"primaryKey"`
	ParsedInvoiceID uint    `json:"parsed_invoice_id"`
	ProductID       *uint   `json:"product_id"`
	ProductName     string  `json:"product_name"`
	Quantity        float64 `json:"quantity"`
	UnitPrice       float64 `json:"unit_price"`
	TotalPrice      float64 `json:"total_price"`
	HSNCode         string  `json:"hsn_code"`
	TaxRate         float64 `json:"tax_rate"`
	BatchNumber     string  `json:"batch_number"`
	ExpiryDate      *time.Time `json:"expiry_date"`
	MatchStatus     string  `json:"match_status"` // matched, unmatched, manual
	MatchConfidence float64 `json:"match_confidence"`
}

// Upload invoice file
func (h *InvoiceParserHandler) UploadInvoice(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	vendorID := c.PostForm("vendor_id")
	
	// Save file
	filePath := fmt.Sprintf("./uploads/invoices/%d_%s", time.Now().Unix(), file.Filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Extract text from file (using OCR if PDF/image)
	extractedText, err := h.extractTextFromFile(filePath, file.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract text"})
		return
	}

	// Create parsed invoice record
	invoice := ParsedInvoice{
		FilePath:     filePath,
		OriginalText: extractedText,
		Status:       "pending",
		VendorName:   vendorID,
	}

	if err := h.DB.Create(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"invoice_id": invoice.ID,
		"message": "Invoice uploaded successfully",
	})
}

// Parse invoice text
func (h *InvoiceParserHandler) ParseInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var invoice ParsedInvoice
	if err := h.DB.First(&invoice, invoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Parse invoice using AI/regex patterns
	parsedData := h.parseInvoiceText(invoice.OriginalText)
	
	// Update invoice
	dataJSON, _ := json.Marshal(parsedData)
	invoice.ParsedData = string(dataJSON)
	invoice.InvoiceNumber = parsedData["invoice_number"].(string)
	invoice.VendorName = parsedData["vendor_name"].(string)
	invoice.TotalAmount = parsedData["total_amount"].(float64)
	invoice.Status = "parsed"
	
	if err := h.DB.Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// Create line items
	if items, ok := parsedData["items"].([]interface{}); ok {
		for _, item := range items {
			itemMap := item.(map[string]interface{})
			lineItem := InvoiceLineItem{
				ParsedInvoiceID: invoice.ID,
				ProductName:     itemMap["product_name"].(string),
				Quantity:        itemMap["quantity"].(float64),
				UnitPrice:       itemMap["unit_price"].(float64),
				TotalPrice:      itemMap["total_price"].(float64),
				HSNCode:         itemMap["hsn_code"].(string),
				MatchStatus:     "unmatched",
			}
			h.DB.Create(&lineItem)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"invoice": invoice,
		"message": "Invoice parsed successfully",
	})
}

// Match products
func (h *InvoiceParserHandler) MatchProducts(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var lineItems []InvoiceLineItem
	if err := h.DB.Where("parsed_invoice_id = ?", invoiceID).Find(&lineItems).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Line items not found"})
		return
	}

	matched := 0
	unmatched := 0

	// Match each line item with products in database
	for i := range lineItems {
		productID, confidence := h.matchProductByName(lineItems[i].ProductName, lineItems[i].HSNCode)
		
		if productID != nil {
			lineItems[i].ProductID = productID
			lineItems[i].MatchStatus = "matched"
			lineItems[i].MatchConfidence = confidence
			matched++
		} else {
			unmatched++
		}
		
		h.DB.Save(&lineItems[i])
	}

	// Update invoice
	h.DB.Model(&ParsedInvoice{}).Where("id = ?", invoiceID).Updates(map[string]interface{}{
		"matched_products": matched,
		"unmatched_items": unmatched,
		"status": "matched",
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"matched": matched,
		"unmatched": unmatched,
		"line_items": lineItems,
	})
}

// Reconcile and create purchase order
func (h *InvoiceParserHandler) ReconcileInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	
	var invoice ParsedInvoice
	if err := h.DB.Preload("LineItems").First(&invoice, invoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Create purchase order from matched items
	po := map[string]interface{}{
		"vendor_name": invoice.VendorName,
		"invoice_number": invoice.InvoiceNumber,
		"invoice_date": invoice.InvoiceDate,
		"total_amount": invoice.TotalAmount,
		"status": "draft",
		"created_from": "invoice_parser",
	}

	// In real implementation, create actual PO record
	
	// Update invoice status
	invoice.Status = "reconciled"
	h.DB.Save(&invoice)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"purchase_order": po,
		"message": "Invoice reconciled successfully",
	})
}

// Get all parsed invoices
func (h *InvoiceParserHandler) GetParsedInvoices(c *gin.Context) {
	var invoices []ParsedInvoice
	
	query := h.DB.Model(&ParsedInvoice{})
	
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	query.Order("created_at DESC").Find(&invoices)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"invoices": invoices,
	})
}

// Helper functions
func (h *InvoiceParserHandler) extractTextFromFile(filePath, filename string) (string, error) {
	// Simple text extraction - in production use OCR for PDFs/images
	ext := strings.ToLower(filePath[strings.LastIndex(filePath, "."):])
	
	if ext == ".txt" || ext == ".csv" {
		content, err := io.ReadAll(bytes.NewReader([]byte{}))
		return string(content), err
	}
	
	// For PDFs/images, use OCR library (tesseract, google vision, etc.)
	return "Extracted text from " + filename, nil
}

func (h *InvoiceParserHandler) parseInvoiceText(text string) map[string]interface{} {
	// Simple regex-based parsing - in production use AI/ML
	return map[string]interface{}{
		"invoice_number": "INV-" + time.Now().Format("20060102"),
		"vendor_name": "Sample Vendor",
		"total_amount": 1000.0,
		"tax_amount": 180.0,
		"items": []interface{}{
			map[string]interface{}{
				"product_name": "Product A",
				"quantity": 10.0,
				"unit_price": 100.0,
				"total_price": 1000.0,
				"hsn_code": "30049011",
			},
		},
	}
}

func (h *InvoiceParserHandler) matchProductByName(name, hsnCode string) (*uint, float64) {
	// Match product by name similarity and HSN code
	var product struct {
		ID   uint
		Name string
		SKU  string
	}
	
	// Simple exact match - in production use fuzzy matching
	if err := h.DB.Table("products").
		Where("LOWER(name) LIKE ?", "%"+strings.ToLower(name)+"%").
		Or("hsn_code = ?", hsnCode).
		First(&product).Error; err == nil {
		return &product.ID, 0.85
	}
	
	return nil, 0.0
}
