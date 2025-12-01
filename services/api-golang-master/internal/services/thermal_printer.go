package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// ThermalPrinterService handles ESC/POS thermal printing
type ThermalPrinterService struct{}

// NewThermalPrinterService creates a new thermal printer service
func NewThermalPrinterService() *ThermalPrinterService {
	return &ThermalPrinterService{}
}

// ESC/POS Commands
const (
	ESC          = "\x1b"
	GS           = "\x1d"
	INIT         = ESC + "@"                  // Initialize printer
	BOLD_ON      = ESC + "E" + "\x01"         // Bold on
	BOLD_OFF     = ESC + "E" + "\x00"         // Bold off
	ALIGN_LEFT   = ESC + "a" + "\x00"         // Align left
	ALIGN_CENTER = ESC + "a" + "\x01"         // Align center
	ALIGN_RIGHT  = ESC + "a" + "\x02"         // Align right
	SIZE_NORMAL  = GS + "!" + "\x00"          // Normal text
	SIZE_DOUBLE  = GS + "!" + "\x11"          // Double size
	SIZE_LARGE   = GS + "!" + "\x22"          // Large text
	CUT_PAPER    = GS + "V" + "\x41" + "\x03" // Cut paper
	LINE_FEED    = "\n"
	DOUBLE_FEED  = "\n\n"
)

// OrderPrintData contains order/invoice data for printing
type OrderPrintData struct {
	OrderNumber    string
	InvoiceNumber  string
	OrderDate      time.Time
	CustomerName   string
	CustomerPhone  string
	Items          []OrderItemPrint
	Subtotal       float64
	DiscountAmount float64
	TaxAmount      float64
	TotalAmount    float64
	PaidAmount     float64
	PendingAmount  float64
	PaymentMethod  string
	PaymentStatus  string
	Source         string // POS, B2B, ONLINE
	Notes          string
	CompanyName    string
	CompanyPhone   string
	CompanyAddress string
}

// OrderItemPrint represents an item in the order
type OrderItemPrint struct {
	ProductName string
	SKU         string
	Quantity    float64
	UnitPrice   float64
	Discount    float64
	Total       float64
}

// Generate3x5OrderSlip generates ESC/POS commands for 3x5 inch thermal printer
// 3 inches width = 48 characters (at 16 chars/inch)
func (s *ThermalPrinterService) Generate3x5OrderSlip(data OrderPrintData) string {
	var buf bytes.Buffer

	// Initialize printer
	buf.WriteString(INIT)

	// Header - Company Name (Large, Bold, Centered)
	buf.WriteString(ALIGN_CENTER)
	buf.WriteString(SIZE_LARGE)
	buf.WriteString(BOLD_ON)
	buf.WriteString(truncateLine(data.CompanyName, 24))
	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_NORMAL)
	buf.WriteString(BOLD_OFF)

	// Company Phone & Address
	buf.WriteString(truncateLine(data.CompanyPhone, 48))
	buf.WriteString(LINE_FEED)
	buf.WriteString(truncateLine(data.CompanyAddress, 48))
	buf.WriteString(LINE_FEED)

	// Separator
	buf.WriteString(strings.Repeat("=", 48))
	buf.WriteString(LINE_FEED)

	// Order/Invoice Number (Bold)
	buf.WriteString(ALIGN_LEFT)
	buf.WriteString(BOLD_ON)
	if data.InvoiceNumber != "" {
		buf.WriteString(fmt.Sprintf("INVOICE: %s", data.InvoiceNumber))
	} else {
		buf.WriteString(fmt.Sprintf("ORDER: %s", data.OrderNumber))
	}
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)

	// Date & Time
	buf.WriteString(data.OrderDate.Format("02/01/2006 03:04 PM"))
	buf.WriteString(LINE_FEED)

	// Source Badge
	buf.WriteString(fmt.Sprintf("Source: %s", data.Source))
	buf.WriteString(LINE_FEED)

	// Customer Info (if available)
	if data.CustomerName != "" && data.CustomerName != "Walk-in Customer" {
		buf.WriteString(LINE_FEED)
		buf.WriteString(BOLD_ON)
		buf.WriteString("Customer:")
		buf.WriteString(BOLD_OFF)
		buf.WriteString(LINE_FEED)
		buf.WriteString(truncateLine(data.CustomerName, 48))
		buf.WriteString(LINE_FEED)
		if data.CustomerPhone != "" {
			buf.WriteString(fmt.Sprintf("Ph: %s", data.CustomerPhone))
			buf.WriteString(LINE_FEED)
		}
	}

	// Separator
	buf.WriteString(strings.Repeat("=", 48))
	buf.WriteString(LINE_FEED)

	// Items Header
	buf.WriteString(BOLD_ON)
	buf.WriteString(fmt.Sprintf("%-28s %5s %10s", "Item", "Qty", "Amount"))
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)
	buf.WriteString(strings.Repeat("-", 48))
	buf.WriteString(LINE_FEED)

	// Items
	for _, item := range data.Items {
		// Product name (truncate if too long)
		productName := truncateLine(item.ProductName, 28)
		buf.WriteString(fmt.Sprintf("%-28s %5.0f %10.2f", productName, item.Quantity, item.Total))
		buf.WriteString(LINE_FEED)

		// SKU in smaller text (optional)
		if item.SKU != "" {
			buf.WriteString(fmt.Sprintf("  SKU: %s", item.SKU))
			buf.WriteString(LINE_FEED)
		}
	}

	// Separator
	buf.WriteString(strings.Repeat("=", 48))
	buf.WriteString(LINE_FEED)

	// Totals
	buf.WriteString(fmt.Sprintf("%-34s %10.2f", "Subtotal:", data.Subtotal))
	buf.WriteString(LINE_FEED)

	if data.DiscountAmount > 0 {
		buf.WriteString(fmt.Sprintf("%-34s %10.2f", "Discount:", data.DiscountAmount))
		buf.WriteString(LINE_FEED)
	}

	if data.TaxAmount > 0 {
		buf.WriteString(fmt.Sprintf("%-34s %10.2f", "Tax (GST):", data.TaxAmount))
		buf.WriteString(LINE_FEED)
	}

	// Grand Total (Bold, Large)
	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_DOUBLE)
	buf.WriteString(BOLD_ON)
	buf.WriteString(fmt.Sprintf("TOTAL: Rs %.2f", data.TotalAmount))
	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_NORMAL)
	buf.WriteString(BOLD_OFF)

	// Payment Status
	buf.WriteString(LINE_FEED)
	buf.WriteString(strings.Repeat("=", 48))
	buf.WriteString(LINE_FEED)

	buf.WriteString(BOLD_ON)
	buf.WriteString(fmt.Sprintf("Payment Status: %s", data.PaymentStatus))
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)

	if data.PaidAmount > 0 {
		buf.WriteString(fmt.Sprintf("Paid: Rs %.2f (%s)", data.PaidAmount, data.PaymentMethod))
		buf.WriteString(LINE_FEED)
	}

	if data.PendingAmount > 0 {
		buf.WriteString(BOLD_ON)
		buf.WriteString(fmt.Sprintf("Pending: Rs %.2f", data.PendingAmount))
		buf.WriteString(LINE_FEED)
		buf.WriteString(BOLD_OFF)
	}

	// Notes (if any)
	if data.Notes != "" {
		buf.WriteString(LINE_FEED)
		buf.WriteString("Notes: " + truncateLine(data.Notes, 42))
		buf.WriteString(LINE_FEED)
	}

	// Footer
	buf.WriteString(LINE_FEED)
	buf.WriteString(strings.Repeat("=", 48))
	buf.WriteString(LINE_FEED)
	buf.WriteString(ALIGN_CENTER)
	buf.WriteString(BOLD_ON)
	buf.WriteString("Thank You! Visit Again")
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)
	buf.WriteString(LINE_FEED)

	// QR Code placeholder (if needed in future)
	// buf.WriteString(ALIGN_CENTER)
	// buf.WriteString(generateQRCode(data.OrderNumber))
	// buf.WriteString(LINE_FEED)

	// Cut paper
	buf.WriteString(DOUBLE_FEED)
	buf.WriteString(CUT_PAPER)

	return buf.String()
}

// GenerateThermalReceipt generates simple text receipt (backward compatible)
func (s *ThermalPrinterService) GenerateThermalReceipt(invoice *models.SalesInvoice, items []models.SalesInvoiceItem) string {
	data := OrderPrintData{
		InvoiceNumber:  invoice.InvoiceNo,
		OrderDate:      invoice.InvoiceDate,
		CustomerName:   invoice.CustomerName,
		CustomerPhone:  invoice.CustomerPhone,
		Subtotal:       invoice.Subtotal,
		DiscountAmount: invoice.TotalDiscount,
		TaxAmount:      invoice.TotalGST,
		TotalAmount:    invoice.TotalAmount,
		PaidAmount:     invoice.TotalAmount, // Assume fully paid
		PendingAmount:  0,
		PaymentMethod:  invoice.PaymentMethod,
		PaymentStatus:  "PAID",
		Source:         "POS",
		CompanyName:    "Yeelo Homeopathy",
		CompanyPhone:   "8478019973",
		CompanyAddress: "Sohna, Gurugram, Haryana",
	}

	// Convert items
	for _, item := range items {
		data.Items = append(data.Items, OrderItemPrint{
			ProductName: item.ProductName,
			SKU:         item.SKU,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Discount:    item.DiscountAmount,
			Total:       item.LineTotal,
		})
	}

	return s.Generate3x5OrderSlip(data)
}

// Helper function to truncate line to fit width
func truncateLine(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen-3] + "..."
}

// FormatForDisplay converts ESC/POS to readable text (for preview)
func (s *ThermalPrinterService) FormatForDisplay(escposData string) string {
	// Remove ESC/POS control codes for preview
	readable := strings.ReplaceAll(escposData, INIT, "")
	readable = strings.ReplaceAll(readable, BOLD_ON, "**")
	readable = strings.ReplaceAll(readable, BOLD_OFF, "**")
	readable = strings.ReplaceAll(readable, SIZE_DOUBLE, "")
	readable = strings.ReplaceAll(readable, SIZE_LARGE, "")
	readable = strings.ReplaceAll(readable, SIZE_NORMAL, "")
	readable = strings.ReplaceAll(readable, ALIGN_CENTER, "")
	readable = strings.ReplaceAll(readable, ALIGN_LEFT, "")
	readable = strings.ReplaceAll(readable, ALIGN_RIGHT, "")
	readable = strings.ReplaceAll(readable, CUT_PAPER, "\n[CUT PAPER]\n")
	readable = strings.ReplaceAll(readable, GS, "")
	readable = strings.ReplaceAll(readable, ESC, "")

	return readable
}
