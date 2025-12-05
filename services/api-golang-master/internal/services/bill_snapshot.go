package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

// BillSnapshotService handles bill snapshot operations
type BillSnapshotService struct {
	db             *gorm.DB
	thermalPrinter *ThermalPrinterService
}

// NewBillSnapshotService creates a new bill snapshot service
func NewBillSnapshotService(db *gorm.DB) *BillSnapshotService {
	return &BillSnapshotService{
		db:             db,
		thermalPrinter: NewThermalPrinterService(),
	}
}

// BillSnapshotRequest represents request to create bill snapshot
type BillSnapshotRequest struct {
	ReferenceType   string                 `json:"referenceType"` // ORDER, INVOICE, QUOTATION
	ReferenceID     string                 `json:"referenceId"`
	ReferenceNumber string                 `json:"referenceNumber"`
	CustomerID      *string                `json:"customerId"`
	CustomerName    string                 `json:"customerName"`
	CustomerPhone   string                 `json:"customerPhone"`
	PaperSize       string                 `json:"paperSize"`
	BillData        map[string]interface{} `json:"billData"`
	Subtotal        float64                `json:"subtotal"`
	DiscountAmount  float64                `json:"discountAmount"`
	TaxAmount       float64                `json:"taxAmount"`
	TotalAmount     float64                `json:"totalAmount"`
	PaidAmount      float64                `json:"paidAmount"`
	BalanceAmount   float64                `json:"balanceAmount"`
	Status          string                 `json:"status"`
	PaymentStatus   string                 `json:"paymentStatus"`
	CreatedBy       string                 `json:"createdBy"`
}

// CreateBillSnapshot saves a complete bill snapshot
func (s *BillSnapshotService) CreateBillSnapshot(req BillSnapshotRequest) (*models.BillSnapshot, error) {
	// Validate paper size
	if req.PaperSize != "3x5" && req.PaperSize != "4x6" {
		req.PaperSize = "3x5" // Default to 3x5
	}

	// Convert bill data to JSON
	billDataJSON, err := json.Marshal(req.BillData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal bill data: %w", err)
	}

	// Generate preview text and HTML
	previewText := s.generatePreviewText(req)
	htmlContent := s.generateHTMLContent(req)

	snapshot := &models.BillSnapshot{
		ID:              uuid.New().String(),
		ReferenceType:   req.ReferenceType,
		ReferenceID:     req.ReferenceID,
		ReferenceNumber: req.ReferenceNumber,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		PaperSize:       req.PaperSize,
		BillData:        string(billDataJSON),
		PreviewText:     previewText,
		HTMLContent:     htmlContent,
		Subtotal:        req.Subtotal,
		DiscountAmount:  req.DiscountAmount,
		TaxAmount:       req.TaxAmount,
		TotalAmount:     req.TotalAmount,
		PaidAmount:      req.PaidAmount,
		BalanceAmount:   req.BalanceAmount,
		Status:          req.Status,
		PaymentStatus:   req.PaymentStatus,
		CreatedAt:       time.Now(),
		CreatedBy:       req.CreatedBy,
	}

	if err := s.db.Create(snapshot).Error; err != nil {
		return nil, fmt.Errorf("failed to create bill snapshot: %w", err)
	}

	return snapshot, nil
}

// GetCustomerBillHistory returns bill history for a customer
func (s *BillSnapshotService) GetCustomerBillHistory(customerID string, limit int) ([]models.CustomerBillHistory, error) {
	var history []models.CustomerBillHistory

	query := `
		SELECT 
			id, reference_type, reference_number, customer_id, customer_name,
			paper_size, total_amount, paid_amount, balance_amount,
			status, payment_status, created_at, printed_at,
			CASE WHEN status IN ('completed', 'cancelled') THEN true ELSE false END as is_ending_bill
		FROM bill_snapshots
		WHERE customer_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`

	if err := s.db.Raw(query, customerID, limit).Scan(&history).Error; err != nil {
		return nil, fmt.Errorf("failed to get customer bill history: %w", err)
	}

	return history, nil
}

// GetCustomerLastBill returns the most recent ending bill for a customer
func (s *BillSnapshotService) GetCustomerLastBill(customerID string) (*models.CustomerLastBill, error) {
	var lastBill models.CustomerLastBill

	query := `
		SELECT 
			customer_id, id as last_bill_id, reference_number as last_bill_number,
			reference_type, total_amount as last_total, paid_amount as last_paid,
			balance_amount as last_balance, status as last_status,
			payment_status as last_payment_status, created_at as last_bill_date
		FROM bill_snapshots
		WHERE customer_id = ? AND status IN ('completed', 'cancelled')
		ORDER BY created_at DESC
		LIMIT 1
	`

	if err := s.db.Raw(query, customerID).Scan(&lastBill).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No previous bills
		}
		return nil, fmt.Errorf("failed to get last bill: %w", err)
	}

	return &lastBill, nil
}

// GetBillSnapshot retrieves a specific bill snapshot
func (s *BillSnapshotService) GetBillSnapshot(id string) (*models.BillSnapshot, error) {
	var snapshot models.BillSnapshot
	if err := s.db.Where("id = ?", id).First(&snapshot).Error; err != nil {
		return nil, fmt.Errorf("bill snapshot not found: %w", err)
	}
	return &snapshot, nil
}

// GetBillSnapshotByReference retrieves bill snapshot by reference
func (s *BillSnapshotService) GetBillSnapshotByReference(refType, refID string) (*models.BillSnapshot, error) {
	var snapshot models.BillSnapshot
	if err := s.db.Where("reference_type = ? AND reference_id = ?", refType, refID).First(&snapshot).Error; err != nil {
		return nil, fmt.Errorf("bill snapshot not found: %w", err)
	}
	return &snapshot, nil
}

// MarkAsPrinted marks a bill snapshot as printed
func (s *BillSnapshotService) MarkAsPrinted(id string) error {
	now := time.Now()
	return s.db.Model(&models.BillSnapshot{}).
		Where("id = ?", id).
		Update("printed_at", now).Error
}

// generatePreviewText creates a plain text preview
func (s *BillSnapshotService) generatePreviewText(req BillSnapshotRequest) string {
	width := 48
	if req.PaperSize == "4x6" {
		width = 64
	}

	preview := fmt.Sprintf("%-*s\n", width, "YEELO HOMEOPATHY")
	preview += fmt.Sprintf("%-*s\n", width, "Sohna, Gurugram")
	preview += fmt.Sprintf("%s\n", repeatChar("=", width))
	preview += fmt.Sprintf("%s: %s\n", req.ReferenceType, req.ReferenceNumber)

	if req.CustomerName != "" && req.CustomerName != "Walk-in Customer" {
		preview += fmt.Sprintf("Customer: %s\n", req.CustomerName)
		if req.CustomerPhone != "" {
			preview += fmt.Sprintf("Phone: %s\n", req.CustomerPhone)
		}
	}

	preview += fmt.Sprintf("%s\n", repeatChar("=", width))
	preview += fmt.Sprintf("Subtotal:  %10.2f\n", req.Subtotal)
	if req.DiscountAmount > 0 {
		preview += fmt.Sprintf("Discount:  %10.2f\n", req.DiscountAmount)
	}
	if req.TaxAmount > 0 {
		preview += fmt.Sprintf("GST:       %10.2f\n", req.TaxAmount)
	}
	preview += fmt.Sprintf("%s\n", repeatChar("=", width))
	preview += fmt.Sprintf("TOTAL:     %10.2f\n", req.TotalAmount)
	preview += fmt.Sprintf("Paid:      %10.2f\n", req.PaidAmount)
	if req.BalanceAmount > 0 {
		preview += fmt.Sprintf("Balance:   %10.2f\n", req.BalanceAmount)
	}
	preview += fmt.Sprintf("%s\n", repeatChar("=", width))
	preview += fmt.Sprintf("Status: %s\n", req.Status)
	preview += fmt.Sprintf("Payment: %s\n", req.PaymentStatus)

	return preview
}

// generateHTMLContent creates an HTML version
func (s *BillSnapshotService) generateHTMLContent(req BillSnapshotRequest) string {
	html := `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: monospace; max-width: %dpx; margin: 0 auto; padding: 20px; }
.header { text-align: center; font-weight: bold; font-size: 18px; }
.section { margin: 10px 0; }
.separator { border-top: 2px solid #000; margin: 5px 0; }
.row { display: flex; justify-content: space-between; }
.total { font-weight: bold; font-size: 16px; }
</style>
</head>
<body>
<div class="header">YEELO HOMEOPATHY</div>
<div class="section" style="text-align: center;">Sohna, Gurugram<br>Phone: 8478019973</div>
<div class="separator"></div>
<div class="section">
	<strong>%s:</strong> %s<br>
	<strong>Date:</strong> %s
</div>
`

	width := 300
	if req.PaperSize == "4x6" {
		width = 400
	}

	html = fmt.Sprintf(html, width, req.ReferenceType, req.ReferenceNumber, time.Now().Format("02/01/2006 03:04 PM"))

	if req.CustomerName != "" && req.CustomerName != "Walk-in Customer" {
		html += fmt.Sprintf(`<div class="section">
	<strong>Customer:</strong> %s`, req.CustomerName)
		if req.CustomerPhone != "" {
			html += fmt.Sprintf(`<br><strong>Phone:</strong> %s`, req.CustomerPhone)
		}
		html += `</div>`
	}

	html += `<div class="separator"></div>
<div class="section">`

	html += fmt.Sprintf(`<div class="row"><span>Subtotal:</span><span>₹%.2f</span></div>`, req.Subtotal)
	if req.DiscountAmount > 0 {
		html += fmt.Sprintf(`<div class="row"><span>Discount:</span><span>₹%.2f</span></div>`, req.DiscountAmount)
	}
	if req.TaxAmount > 0 {
		html += fmt.Sprintf(`<div class="row"><span>GST:</span><span>₹%.2f</span></div>`, req.TaxAmount)
	}

	html += `</div><div class="separator"></div>
<div class="section">`
	html += fmt.Sprintf(`<div class="row total"><span>TOTAL:</span><span>₹%.2f</span></div>`, req.TotalAmount)
	html += fmt.Sprintf(`<div class="row"><span>Paid:</span><span>₹%.2f</span></div>`, req.PaidAmount)
	if req.BalanceAmount > 0 {
		html += fmt.Sprintf(`<div class="row"><span>Balance:</span><span>₹%.2f</span></div>`, req.BalanceAmount)
	}

	html += `</div><div class="separator"></div>
<div class="section" style="text-align: center;">`
	html += fmt.Sprintf(`Status: %s | Payment: %s`, req.Status, req.PaymentStatus)
	html += `</div>
<div class="section" style="text-align: center; margin-top: 20px;">Thank You! Visit Again</div>
</body>
</html>`

	return html
}

// Helper function to repeat characters
func repeatChar(char string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += char
	}
	return result
}

// GetPrinterSettings retrieves printer settings for a counter
func (s *BillSnapshotService) GetPrinterSettings(counterID string) (*models.PrinterSettings, error) {
	var settings models.PrinterSettings
	err := s.db.Where("counter_id = ? AND is_active = ?", counterID, true).First(&settings).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return default settings
			return &models.PrinterSettings{
				CounterID:      counterID,
				PaperSize:      "3x5",
				PrinterType:    "thermal",
				AutoPrint:      false,
				CopiesPerPrint: 1,
				IsActive:       true,
			}, nil
		}
		return nil, err
	}
	return &settings, nil
}

// UpdatePrinterSettings updates printer settings
func (s *BillSnapshotService) UpdatePrinterSettings(settings *models.PrinterSettings) error {
	// Validate paper size
	if settings.PaperSize != "3x5" && settings.PaperSize != "4x6" {
		return fmt.Errorf("invalid paper size: must be '3x5' or '4x6'")
	}

	var existing models.PrinterSettings
	err := s.db.Where("counter_id = ?", settings.CounterID).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Create new
		settings.ID = uuid.New().String()
		settings.CreatedAt = time.Now()
		settings.UpdatedAt = time.Now()
		return s.db.Create(settings).Error
	}

	if err != nil {
		return err
	}

	// Update existing
	settings.ID = existing.ID
	settings.UpdatedAt = time.Now()
	return s.db.Save(settings).Error
}
