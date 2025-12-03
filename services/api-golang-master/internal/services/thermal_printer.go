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
	CustomerGST    string
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
	PaperSize      string // "3x5" or "4x6"
	GSTIN          string
}

// OrderItemPrint represents an item in the order
type OrderItemPrint struct {
	ProductName     string
	SKU             string
	Quantity        float64
	UnitPrice       float64
	Discount        float64
	DiscountPercent float64
	TaxPercent      float64
	TaxAmount       float64
	Total           float64
}

// GenerateOrderSlip generates ESC/POS commands based on paper size
func (s *ThermalPrinterService) GenerateOrderSlip(data OrderPrintData) string {
	var buf bytes.Buffer

	// Determine width based on paper size
	// 3x5 inch = 3 inch width = ~48 chars (at Font A)
	// 4x6 inch = 4 inch width = ~64 chars (at Font A)
	width := 48
	if data.PaperSize == "4x6" {
		width = 64
	}

	// Initialize printer
	buf.WriteString(INIT)

	// Header - Company Name (Large, Bold, Centered)
	buf.WriteString(ALIGN_CENTER)
	buf.WriteString(SIZE_LARGE)
	buf.WriteString(BOLD_ON)
	buf.WriteString(truncateLine(data.CompanyName, width/2)) // Larger font takes double space
	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_NORMAL)
	buf.WriteString(BOLD_OFF)

	// Company Phone & Address
	buf.WriteString(truncateLine(data.CompanyPhone, width))
	buf.WriteString(LINE_FEED)
	buf.WriteString(truncateLine(data.CompanyAddress, width))
	buf.WriteString(LINE_FEED)

	// Separator
	buf.WriteString(strings.Repeat("=", width))
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
		buf.WriteString(truncateLine(data.CustomerName, width))
		buf.WriteString(LINE_FEED)
		if data.CustomerPhone != "" {
			buf.WriteString(fmt.Sprintf("Ph: %s", data.CustomerPhone))
			buf.WriteString(LINE_FEED)
		}
		if data.CustomerGST != "" {
			buf.WriteString(fmt.Sprintf("GSTIN: %s", data.CustomerGST))
			buf.WriteString(LINE_FEED)
		}
	}

	// Separator
	buf.WriteString(strings.Repeat("=", width))
	buf.WriteString(LINE_FEED)

	// Items Header
	buf.WriteString(BOLD_ON)
	if width == 64 {
		// 4x6 Layout: Item(24) Qty(5) Rate(8) Disc(8) GST(8) Total(10)
		buf.WriteString(fmt.Sprintf("%-24s %5s %8s %8s %8s %10s", "Item", "Qty", "Rate", "Disc", "GST", "Total"))
	} else {
		// 3x5 Layout: Item on line 1, Details on line 2
		buf.WriteString(fmt.Sprintf("%-48s", "Item Details"))
	}
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)
	buf.WriteString(strings.Repeat("-", width))
	buf.WriteString(LINE_FEED)

	// Items
	for _, item := range data.Items {
		productName := truncateLine(item.ProductName, width)

		if width == 64 {
			// 4x6 Layout - Single Line if possible, or name on top
			buf.WriteString(productName)
			buf.WriteString(LINE_FEED)
			// Qty, Rate, Disc(Amt+%), GST(Amt+%), Total
			// Qty(5) Rate(8) Disc(8) GST(8) Total(10)
			discStr := fmt.Sprintf("%.0f%%", item.DiscountPercent)
			gstStr := fmt.Sprintf("%.0f%%", item.TaxPercent)

			buf.WriteString(fmt.Sprintf("%5.0f %8.2f %8s %8s %10.2f",
				item.Quantity, item.UnitPrice, discStr, gstStr, item.Total))
		} else {
			// 3x5 Layout - Two Lines
			buf.WriteString(productName)
			buf.WriteString(LINE_FEED)

			// Line 2: Qty x Rate | Disc | GST | Total
			// Qty(4) Rate(7) Disc(6) GST(5) Total(9)
			// 2 x 100.00 10% 18% 180.00
			discStr := ""
			if item.DiscountPercent > 0 {
				discStr = fmt.Sprintf("%.0f%%", item.DiscountPercent)
			}

			gstStr := ""
			if item.TaxPercent > 0 {
				gstStr = fmt.Sprintf("%.0f%%", item.TaxPercent)
			}

			buf.WriteString(fmt.Sprintf("%4.0f x %-7.2f %6s %5s %9.2f",
				item.Quantity, item.UnitPrice, discStr, gstStr, item.Total))
		}
		buf.WriteString(LINE_FEED)
	}

	// Separator
	buf.WriteString(strings.Repeat("=", width))
	buf.WriteString(LINE_FEED)

	// Totals
	// Align right for totals
	rightAlignFmt := fmt.Sprintf("%%%ds %%10.2f", width-11) // e.g. "%37s %10.2f"

	buf.WriteString(fmt.Sprintf(rightAlignFmt, "Subtotal:", data.Subtotal))
	buf.WriteString(LINE_FEED)

	if data.DiscountAmount > 0 {
		buf.WriteString(fmt.Sprintf(rightAlignFmt, "Discount:", data.DiscountAmount))
		buf.WriteString(LINE_FEED)
	}

	if data.TaxAmount > 0 {
		buf.WriteString(fmt.Sprintf(rightAlignFmt, "GST:", data.TaxAmount))
		buf.WriteString(LINE_FEED)
	}

	// Grand Total (Bold, Large)
	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_DOUBLE)
	buf.WriteString(BOLD_ON)

	// For large text, width is effectively halved
	totalStr := fmt.Sprintf("TOTAL: %.2f", data.TotalAmount)
	// Center align manually since we are in double size
	padding := (width/2 - len(totalStr)) / 2
	if padding < 0 {
		padding = 0
	}
	buf.WriteString(strings.Repeat(" ", padding) + totalStr)

	buf.WriteString(LINE_FEED)
	buf.WriteString(SIZE_NORMAL)
	buf.WriteString(BOLD_OFF)

	// Payment Status
	buf.WriteString(LINE_FEED)
	buf.WriteString(strings.Repeat("=", width))
	buf.WriteString(LINE_FEED)

	buf.WriteString(BOLD_ON)
	buf.WriteString(fmt.Sprintf("Payment: %s (%s)", data.PaymentStatus, data.PaymentMethod))
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)

	// Savings Message
	if data.DiscountAmount > 0 {
		buf.WriteString(LINE_FEED)
		buf.WriteString(ALIGN_CENTER)
		buf.WriteString(fmt.Sprintf("*** You saved Rs %.2f ***", data.DiscountAmount))
		buf.WriteString(ALIGN_LEFT) // Reset
		buf.WriteString(LINE_FEED)
	}

	// Notes (if any)
	if data.Notes != "" {
		buf.WriteString(LINE_FEED)
		buf.WriteString("Notes: " + truncateLine(data.Notes, width-7))
		buf.WriteString(LINE_FEED)
	}

	// Footer
	buf.WriteString(LINE_FEED)
	buf.WriteString(strings.Repeat("=", width))
	buf.WriteString(LINE_FEED)
	buf.WriteString(ALIGN_CENTER)
	buf.WriteString(BOLD_ON)
	buf.WriteString("Thank You! Visit Again")
	buf.WriteString(LINE_FEED)
	buf.WriteString(BOLD_OFF)
	buf.WriteString(LINE_FEED)

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
		CustomerGST:    invoice.CustomerGSTNumber,
		Subtotal:       invoice.Subtotal,
		DiscountAmount: invoice.TotalDiscount,
		TaxAmount:      invoice.TotalGST,
		TotalAmount:    invoice.TotalAmount,
		PaidAmount:     invoice.AmountPaid,
		PendingAmount:  invoice.TotalAmount - invoice.AmountPaid,
		PaymentMethod:  invoice.PaymentMethod,
		PaymentStatus:  invoice.PaymentStatus,
		Source:         "POS",
		CompanyName:    "Yeelo Homeopathy",
		GSTIN:          "06BUAPG3815Q1ZH",
		CompanyPhone:   "M: 8478019973",
		CompanyAddress: "Dhunela, Sohna Road, Gurugram, Haryana",
		PaperSize:      "3x5", // Default to 3x5 as requested
	}

	// Convert items
	for _, item := range items {
		data.Items = append(data.Items, OrderItemPrint{
			ProductName:     item.ProductName,
			SKU:             item.SKU,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			Discount:        item.DiscountAmount,
			DiscountPercent: item.DiscountPercent,
			TaxPercent:      item.GSTRate,
			TaxAmount:       item.TotalGST,
			Total:           item.LineTotal,
		})
	}

	return s.GenerateOrderSlip(data)
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
	readable = strings.ReplaceAll(readable, CUT_PAPER, "\nMonday - Sunday: 9 AM-9 PM\n")
	readable = strings.ReplaceAll(readable, GS, "")
	readable = strings.ReplaceAll(readable, ESC, "")

	return readable
}
