package handlers

import (
	"encoding/csv"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// MargHeader represents header row in Marg ERP format
type MargHeader struct {
	InvoiceNumber string
	InvoiceDate   *string
	SupplierName  string
	SupplierGSTIN string
	TotalAmount   float64
}

// MargItem represents transaction row in Marg ERP format
type MargItem struct {
	Brand           string
	ProductCode     string
	ProductName     string
	Size            string
	BatchNumber     string
	Quantity        float64
	MRP             float64
	UnitPrice       float64
	GrossAmount     float64
	DiscountPercent float64
	SplPercent      float64
	GSTPercent      float64
	NetAmount       float64
	TaxAmount       float64
	HSNCode         string
	ExpiryDate      *string
}

// MargInvoice represents complete invoice with header and items
type MargInvoice struct {
	Header MargHeader
	Items  []MargItem
}

// StandardRow represents converted standard format
type StandardRow struct {
	InvoiceNumber   string
	InvoiceDate     string
	SupplierName    string
	SupplierGSTIN   string
	ProductCode     string
	ProductName     string
	Brand           string
	Potency         string
	Size            string
	Form            string
	HSNCode         string
	BatchNumber     string
	ExpiryDate      string
	Quantity        string
	UnitPrice       string
	MRP             string
	DiscountPercent string
	TaxPercent      string
	TotalAmount     string
}

// ParseMargERPCSV parses Marg ERP format from CSV content
func ParseMargERPCSV(content string) ([]StandardRow, error) {
	// Use a more lenient CSV reader for Marg format
	reader := csv.NewReader(strings.NewReader(content))
	reader.FieldsPerRecord = -1 // Allow variable number of fields

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %v", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("empty CSV file")
	}

	// Check if this is Marg ERP format
	if !isMargERPFormat(records) {
		return nil, fmt.Errorf("not a valid Marg ERP format")
	}

	var invoices []MargInvoice
	var currentHeader *MargHeader
	var currentItems []MargItem

	for _, fields := range records {
		if len(fields) == 0 {
			continue
		}

		recordType := strings.TrimSpace(fields[0])

		if recordType == "H" {
			// Save previous invoice if exists
			if currentHeader != nil && len(currentItems) > 0 {
				invoices = append(invoices, MargInvoice{
					Header: *currentHeader,
					Items:  currentItems,
				})
			}

			// Parse header
			currentHeader = &MargHeader{
				InvoiceNumber: getFieldValue(fields, 2),
				InvoiceDate:   parseDate(getFieldValue(fields, 3)),
				SupplierName:  getFieldValue(fields, 30),
				SupplierGSTIN: getFieldValue(fields, 32),
				TotalAmount:   0,
			}
			currentItems = []MargItem{}
		} else if recordType == "T" && currentHeader != nil {
			// Parse transaction line
			qty := parseFloatMarg(getFieldValue(fields, 20))
			gstPercent := parseFloatMarg(getFieldValue(fields, 12))
			mrp := parseFloatMarg(getFieldValue(fields, 14))
			if mrp == 0 {
				mrp = parseFloatMarg(getFieldValue(fields, 16))
			}
			discPercent := parseFloatMarg(getFieldValue(fields, 22))
			grossAmount := parseFloatMarg(getFieldValue(fields, 23))
			splPercent := parseFloatMarg(getFieldValue(fields, 24))
			netAmount := parseFloatMarg(getFieldValue(fields, 25))
			taxAmount := parseFloatMarg(getFieldValue(fields, 26))

			// Derive pre-tax total and unit price
			preTaxTotal := netAmount - taxAmount
			unitPrice := float64(0)
			if qty > 0 {
				unitPrice = preTaxTotal / qty
			}

			item := MargItem{
				Brand:           getFieldValue(fields, 2),
				ProductCode:     getFieldValue(fields, 3),
				ProductName:     getFieldValue(fields, 5),
				Size:            getFieldValue(fields, 6),
				BatchNumber:     getFieldValue(fields, 8),
				Quantity:        qty,
				MRP:             mrp,
				UnitPrice:       unitPrice,
				GrossAmount:     grossAmount,
				DiscountPercent: discPercent,
				SplPercent:      splPercent,
				GSTPercent:      gstPercent,
				NetAmount:       netAmount,
				TaxAmount:       taxAmount,
				HSNCode:         getFieldValue(fields, 39),
				ExpiryDate:      parseDate(getFieldValue(fields, 9)),
			}

			currentItems = append(currentItems, item)
		} else if recordType == "F" && currentHeader != nil {
			// Footer row - contains totals
			totalAmount := parseFloatMarg(getFieldValue(fields, 2))
			currentHeader.TotalAmount = totalAmount
		}
	}

	// Save last invoice
	if currentHeader != nil && len(currentItems) > 0 {
		invoices = append(invoices, MargInvoice{
			Header: *currentHeader,
			Items:  currentItems,
		})
	}

	// Convert to standard format
	return convertMargToStandard(invoices), nil
}

// isMargERPFormat checks if CSV is in Marg ERP format
func isMargERPFormat(records [][]string) bool {
	if len(records) == 0 {
		return false
	}

	firstLine := strings.Join(records[0], ",")
	return strings.HasPrefix(firstLine, "H,") && strings.Contains(firstLine, "<MARGERP FORMAT>")
}

// convertMargToStandard converts Marg invoices to standard format
func convertMargToStandard(margInvoices []MargInvoice) []StandardRow {
	var standardRows []StandardRow

	for _, invoice := range margInvoices {
		for _, item := range invoice.Items {
			invoiceDate := ""
			if invoice.Header.InvoiceDate != nil {
				invoiceDate = *invoice.Header.InvoiceDate
			}

			expiryDate := ""
			if item.ExpiryDate != nil {
				expiryDate = *item.ExpiryDate
			}

			row := StandardRow{
				InvoiceNumber:   invoice.Header.InvoiceNumber,
				InvoiceDate:     invoiceDate,
				SupplierName:    invoice.Header.SupplierName,
				SupplierGSTIN:   invoice.Header.SupplierGSTIN,
				ProductCode:     item.ProductCode,
				ProductName:     item.ProductName,
				Brand:           strings.Trim(item.Brand, "()"),
				Potency:         extractPotency(item.ProductName),
				Size:            item.Size,
				Form:            extractForm(item.Brand),
				HSNCode:         item.HSNCode,
				BatchNumber:     item.BatchNumber,
				ExpiryDate:      expiryDate,
				Quantity:        fmt.Sprintf("%.0f", item.Quantity),
				UnitPrice:       fmt.Sprintf("%.2f", item.UnitPrice),
				MRP:             fmt.Sprintf("%.2f", item.MRP),
				DiscountPercent: fmt.Sprintf("%.2f", item.DiscountPercent+item.SplPercent),
				TaxPercent:      fmt.Sprintf("%.2f", item.GSTPercent),
				TotalAmount:     fmt.Sprintf("%.2f", item.UnitPrice*item.Quantity),
			}

			standardRows = append(standardRows, row)
		}
	}

	return standardRows
}

// Helper functions

func getFieldValue(fields []string, index int) string {
	if index < len(fields) {
		return strings.TrimSpace(fields[index])
	}
	return ""
}

func parseFloatMarg(s string) float64 {
	if val, err := strconv.ParseFloat(s, 64); err == nil {
		return val
	}
	return 0
}

func parseDate(dateStr string) *string {
	if dateStr == "" || dateStr == "00000000" || len(dateStr) != 8 {
		return nil
	}

	day := dateStr[0:2]
	month := dateStr[2:4]
	year := dateStr[4:8]

	if day == "00" || month == "00" || year == "0000" {
		return nil
	}

	formatted := year + "-" + month + "-" + day
	return &formatted
}

func extractPotency(productName string) string {
	// Simple potency extraction - can be enhanced
	parts := strings.Fields(productName)
	for _, part := range parts {
		if matched, _ := regexp.MatchString(`^\d+[CXM]?|[QXCM]+$`, part); matched {
			return part
		}
	}
	return ""
}

func extractForm(brand string) string {
	// Extract form from parentheses, e.g., "SBL (DILUTION)" -> "DILUTION"
	if start := strings.Index(brand, "("); start != -1 {
		if end := strings.Index(brand[start:], ")"); end != -1 {
			return strings.TrimSpace(brand[start+1 : start+end])
		}
	}
	return ""
}
