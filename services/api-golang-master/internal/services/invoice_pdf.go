package services

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

// InvoicePDFService handles PDF generation for invoices
type InvoicePDFService struct{}

// NewInvoicePDFService creates a new PDF service
func NewInvoicePDFService() *InvoicePDFService {
	return &InvoicePDFService{}
}

// InvoiceData contains all data needed for PDF generation
type InvoiceData struct {
	Invoice      *models.SalesInvoice
	Items        []models.SalesInvoiceItem
	CompanyName  string
	CompanyGSTIN string
	CompanyAddr  string
	CompanyPhone string
}

// GenerateThermalReceipt generates a 3x5" thermal receipt PDF
func (s *InvoicePDFService) GenerateThermalReceipt(data InvoiceData) (string, error) {
	// Create new PDF with custom size (3x6 inches)
	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		OrientationStr: "P",
		UnitStr:        "pt",
		SizeStr:        "",
		Size:           gofpdf.SizeType{Wd: 216.0, Ht: 432.0}, // 3x6 inches at 72 DPI
		FontDirStr:     "",
	})
	pdf.AddPage()

	// Set monospace font for thermal printer
	pdf.SetFont("Courier", "", 9)

	y := 10.0

	// Company header
	pdf.SetFont("Courier", "B", 11)
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 12, centerText(data.CompanyName, 32), "", 0, "C", false, 0, "")
	y += 12

	pdf.SetFont("Courier", "", 8)
	pdf.SetXY(10, y)
	pdf.MultiCell(196, 10, centerText("Ph: "+data.CompanyPhone, 32), "", "C", false)
	y += 20

	// Separator
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 10, "================================", "", 0, "C", false, 0, "")
	y += 12

	// Invoice details
	pdf.SetFont("Courier", "B", 9)
	pdf.SetXY(10, y)
	pdf.CellFormat(98, 10, "Bill #: "+data.Invoice.InvoiceNo, "", 0, "L", false, 0, "")
	pdf.SetXY(108, y)
	pdf.CellFormat(98, 10, time.Now().Format("02/01/06 15:04"), "", 0, "R", false, 0, "")
	y += 12

	if data.Invoice.CustomerName != "" {
		pdf.SetFont("Courier", "", 8)
		pdf.SetXY(10, y)
		pdf.CellFormat(196, 10, "Customer: "+data.Invoice.CustomerName, "", 0, "L", false, 0, "")
		y += 10
		if data.Invoice.CustomerPhone != "" {
			pdf.SetXY(10, y)
			pdf.CellFormat(196, 10, "Ph: "+data.Invoice.CustomerPhone, "", 0, "L", false, 0, "")
			y += 10
		}
	}

	// Separator
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 10, "================================", "", 0, "C", false, 0, "")
	y += 12

	// Items header
	pdf.SetFont("Courier", "B", 8)
	pdf.SetXY(10, y)
	pdf.CellFormat(100, 10, "Item", "", 0, "L", false, 0, "")
	pdf.SetXY(110, y)
	pdf.CellFormat(30, 10, "Qty", "", 0, "R", false, 0, "")
	pdf.SetXY(140, y)
	pdf.CellFormat(66, 10, "Amount", "", 0, "R", false, 0, "")
	y += 10

	pdf.SetFont("Courier", "", 7)
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 8, "--------------------------------", "", 0, "L", false, 0, "")
	y += 8

	// Items
	pdf.SetFont("Courier", "", 8)
	for _, item := range data.Items {
		// Product name (truncate if too long)
		name := truncateString(item.ProductName, 28)
		pdf.SetXY(10, y)
		pdf.CellFormat(100, 9, name, "", 0, "L", false, 0, "")

		// Quantity
		pdf.SetXY(110, y)
		pdf.CellFormat(30, 9, fmt.Sprintf("%.0f", item.Quantity), "", 0, "R", false, 0, "")

		// Amount
		pdf.SetXY(140, y)
		pdf.CellFormat(66, 9, fmt.Sprintf("%.2f", item.LineTotal), "", 0, "R", false, 0, "")
		y += 9
	}

	// Separator
	y += 2
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 8, "================================", "", 0, "C", false, 0, "")
	y += 10

	// Totals
	pdf.SetFont("Courier", "", 9)
	pdf.SetXY(10, y)
	pdf.CellFormat(140, 10, "Subtotal:", "", 0, "L", false, 0, "")
	pdf.SetXY(150, y)
	pdf.CellFormat(56, 10, fmt.Sprintf("Rs %.2f", data.Invoice.Subtotal), "", 0, "R", false, 0, "")
	y += 10

	if data.Invoice.TotalDiscount > 0 {
		pdf.SetXY(10, y)
		pdf.CellFormat(140, 10, "Discount:", "", 0, "L", false, 0, "")
		pdf.SetXY(150, y)
		pdf.CellFormat(56, 10, fmt.Sprintf("Rs %.2f", data.Invoice.TotalDiscount), "", 0, "R", false, 0, "")
		y += 10
	}

	if data.Invoice.TotalGST > 0 {
		pdf.SetXY(10, y)
		pdf.CellFormat(140, 10, "GST:", "", 0, "L", false, 0, "")
		pdf.SetXY(150, y)
		pdf.CellFormat(56, 10, fmt.Sprintf("Rs %.2f", data.Invoice.TotalGST), "", 0, "R", false, 0, "")
		y += 10
	}

	pdf.SetFont("Courier", "B", 11)
	pdf.SetXY(10, y)
	pdf.CellFormat(140, 12, "TOTAL:", "", 0, "L", false, 0, "")
	pdf.SetXY(150, y)
	pdf.CellFormat(56, 12, fmt.Sprintf("Rs %.2f", data.Invoice.TotalAmount), "", 0, "R", false, 0, "")
	y += 14

	// Payment method
	pdf.SetFont("Courier", "", 8)
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 10, "Paid via: "+data.Invoice.PaymentMethod, "", 0, "C", false, 0, "")
	y += 12

	// Footer
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 10, "================================", "", 0, "C", false, 0, "")
	y += 10

	pdf.SetFont("Courier", "B", 9)
	pdf.SetXY(10, y)
	pdf.CellFormat(196, 10, "Thank You! Visit Again", "", 0, "C", false, 0, "")

	// Convert to base64
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// GenerateA4Invoice generates a professional A4 invoice PDF
func (s *InvoicePDFService) GenerateA4Invoice(data InvoiceData) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header with company details
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(190, 10, data.CompanyName)
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 9)
	pdf.Cell(190, 5, data.CompanyAddr)
	pdf.Ln(5)
	pdf.Cell(95, 5, "Phone: "+data.CompanyPhone)
	pdf.Cell(95, 5, "GSTIN: "+data.CompanyGSTIN)
	pdf.Ln(10)

	// Invoice title
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(190, 8, "TAX INVOICE")
	pdf.Ln(10)

	// Invoice details
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(95, 6, "Invoice No: "+data.Invoice.InvoiceNo)
	pdf.Cell(95, 6, "Date: "+data.Invoice.InvoiceDate.Format("02/01/2006"))
	pdf.Ln(6)

	// Customer details
	if data.Invoice.CustomerName != "" {
		pdf.Ln(5)
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(190, 6, "Bill To:")
		pdf.Ln(6)
		pdf.SetFont("Arial", "", 10)
		pdf.Cell(190, 5, data.Invoice.CustomerName)
		pdf.Ln(5)
		if data.Invoice.CustomerPhone != "" {
			pdf.Cell(190, 5, "Phone: "+data.Invoice.CustomerPhone)
			pdf.Ln(5)
		}
		if data.Invoice.CustomerGSTNumber != "" {
			pdf.Cell(190, 5, "GSTIN: "+data.Invoice.CustomerGSTNumber)
			pdf.Ln(5)
		}
	}

	pdf.Ln(8)

	// Items table header
	pdf.SetFillColor(240, 240, 240)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(10, 8, "#", "1", 0, "C", true, 0, "")
	pdf.CellFormat(60, 8, "Product", "1", 0, "L", true, 0, "")
	pdf.CellFormat(20, 8, "HSN", "1", 0, "C", true, 0, "")
	pdf.CellFormat(15, 8, "Qty", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 8, "Rate", "1", 0, "R", true, 0, "")
	pdf.CellFormat(25, 8, "Discount", "1", 0, "R", true, 0, "")
	pdf.CellFormat(15, 8, "GST%", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 8, "Amount", "1", 1, "R", true, 0, "")

	// Items
	pdf.SetFont("Arial", "", 8)
	for i, item := range data.Items {
		pdf.CellFormat(10, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(60, 6, truncateString(item.ProductName, 35), "1", 0, "L", false, 0, "")
		pdf.CellFormat(20, 6, item.HSNCode, "1", 0, "C", false, 0, "")
		pdf.CellFormat(15, 6, fmt.Sprintf("%.0f", item.Quantity), "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 6, fmt.Sprintf("%.2f", item.UnitPrice), "1", 0, "R", false, 0, "")
		pdf.CellFormat(25, 6, fmt.Sprintf("%.2f", item.DiscountAmount), "1", 0, "R", false, 0, "")
		pdf.CellFormat(15, 6, fmt.Sprintf("%.0f%%", item.GSTRate), "1", 0, "C", false, 0, "")
		pdf.CellFormat(20, 6, fmt.Sprintf("%.2f", item.LineTotal), "1", 1, "R", false, 0, "")
	}

	pdf.Ln(5)

	// Totals
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(150, 6, "")
	pdf.Cell(20, 6, "Subtotal:")
	pdf.Cell(20, 6, fmt.Sprintf("Rs %.2f", data.Invoice.Subtotal))
	pdf.Ln(6)

	if data.Invoice.TotalDiscount > 0 {
		pdf.Cell(150, 6, "")
		pdf.Cell(20, 6, "Discount:")
		pdf.Cell(20, 6, fmt.Sprintf("Rs %.2f", data.Invoice.TotalDiscount))
		pdf.Ln(6)
	}

	pdf.Cell(150, 6, "")
	pdf.Cell(20, 6, "GST:")
	pdf.Cell(20, 6, fmt.Sprintf("Rs %.2f", data.Invoice.TotalGST))
	pdf.Ln(6)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(150, 8, "")
	pdf.Cell(20, 8, "TOTAL:")
	pdf.Cell(20, 8, fmt.Sprintf("Rs %.2f", data.Invoice.TotalAmount))
	pdf.Ln(12)

	// Footer
	pdf.SetFont("Arial", "I", 8)
	pdf.Cell(190, 5, "Terms & Conditions: Goods once sold are not returnable.")
	pdf.Ln(5)
	pdf.Cell(190, 5, "This is a computer-generated invoice.")

	// Convert to base64
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// Helper functions
func centerText(text string, width int) string {
	if len(text) >= width {
		return text[:width]
	}
	padding := (width - len(text)) / 2
	return fmt.Sprintf("%*s%s", padding, "", text)
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
