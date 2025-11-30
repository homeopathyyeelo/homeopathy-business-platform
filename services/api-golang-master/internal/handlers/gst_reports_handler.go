package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type GSTReportsHandler struct {
	db *gorm.DB
}

func NewGSTReportsHandler(db *gorm.DB) *GSTReportsHandler {
	return &GSTReportsHandler{db: db}
}

// ============================================================================
// GST SUMMARY REPORTS
// ============================================================================

type GSTSummary struct {
	Period            string  `json:"period"`
	TotalSales        float64 `json:"totalSales"`
	TaxableSales      float64 `json:"taxableSales"`
	GSTCollected5     float64 `json:"gstCollected5"`
	GSTCollected18    float64 `json:"gstCollected18"`
	TotalGSTCollected float64 `json:"totalGstCollected"`
	TotalPurchases    float64 `json:"totalPurchases"`
	GSTIntel          float64 `json:"gstPaid"`
	ITCClaimed        float64 `json:"itcClaimed"`
	NetGSTPayable     float64 `json:"netGstPayable"`
}

// GET /api/erp/gst/summary - Get GST summary for a period
func (h *GSTReportsHandler) GetGSTSummary(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01")) // Default: current month

	var sales []models.SalesInvoice
	var itcEntries []models.ITCLedger

	// Get sales for the period
	startDate := period + "-01"
	endDate := period + "-31"

	h.db.Where("invoice_date >= ? AND invoice_date <= ? AND status = ?",
		startDate, endDate, "COMPLETED").
		Find(&sales)

	// Calculate sales GST
	var totalSales, taxableSales, gst5, gst18, totalGST float64
	for _, sale := range sales {
		totalSales += sale.TotalAmount
		taxableSales += sale.TaxableAmount
		gst5 += (sale.CGST5Percent + sale.SGST5Percent + sale.IGST5Percent)
		gst18 += (sale.CGST18Percent + sale.SGST18Percent + sale.IGST18Percent)
		totalGST += sale.TotalGST
	}

	// Get ITC for the period
	h.db.Where("entry_date >= ? AND entry_date <= ?", startDate, endDate).
		Find(&itcEntries)

	var totalITC float64
	for _, entry := range itcEntries {
		if entry.ITCEligible {
			totalITC += entry.TotalITC
		}
	}

	netGSTPayable := totalGST - totalITC

	summary := GSTSummary{
		Period:            period,
		TotalSales:        totalSales,
		TaxableSales:      taxableSales,
		GSTCollected5:     gst5,
		GSTCollected18:    gst18,
		TotalGSTCollected: totalGST,
		ITCClaimed:        totalITC,
		NetGSTPayable:     netGSTPayable,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// ============================================================================
// GSTR-1 REPORT (Sales)
// ============================================================================

type GSTR1Data struct {
	Period         string           `json:"period"`
	B2B            []B2BInvoice     `json:"b2b"`  // B2B invoices
	B2CL           []B2CLInvoice    `json:"b2cl"` // B2C Large (>2.5L)
	B2CS           []B2CSummary     `json:"b2cs"` // B2C Small summary
	HSNSummary     []HSNSummaryItem `json:"hsnSummary"`
	DocumentIssued DocumentIssued   `json:"documentIssued"`
}

type B2BInvoice struct {
	InvoiceNo    string  `json:"invoiceNo"`
	InvoiceDate  string  `json:"invoiceDate"`
	CustomerName string  `json:"customerName"`
	GSTNumber    string  `json:"gstNumber"`
	InvoiceValue float64 `json:"invoiceValue"`
	TaxableValue float64 `json:"taxableValue"`
	CGST         float64 `json:"cgst"`
	SGST         float64 `json:"sgst"`
	IGST         float64 `json:"igst"`
	TotalGST     float64 `json:"totalGst"`
}

type B2CLInvoice struct {
	InvoiceNo     string  `json:"invoiceNo"`
	InvoiceDate   string  `json:"invoiceDate"`
	CustomerState string  `json:"customerState"`
	InvoiceValue  float64 `json:"invoiceValue"`
	TaxableValue  float64 `json:"taxableValue"`
	IGST          float64 `json:"igst"`
}

type B2CSummary struct {
	Type         string  `json:"type"` // Inter-state or Intra-state
	GSTRate      float64 `json:"gstRate"`
	TaxableValue float64 `json:"taxableValue"`
	CGST         float64 `json:"cgst"`
	SGST         float64 `json:"sgst"`
	IGST         float64 `json:"igst"`
}

type HSNSummaryItem struct {
	HSNCode      string  `json:"hsnCode"`
	Description  string  `json:"description"`
	UQC          string  `json:"uqc"` // Unit Quantity Code
	TotalQty     float64 `json:"totalQty"`
	TaxableValue float64 `json:"taxableValue"`
	CGST         float64 `json:"cgst"`
	SGST         float64 `json:"sgst"`
	IGST         float64 `json:"igst"`
}

type DocumentIssued struct {
	InvoicesFrom string `json:"invoicesFrom"`
	InvoicesTo   string `json:"invoicesTo"`
	TotalIssued  int    `json:"totalIssued"`
	Cancelled    int    `json:"cancelled"`
}

// GET /api/erp/gst/gstr1 - Generate GSTR-1 report
func (h *GSTReportsHandler) GetGSTR1Report(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01"))

	startDate := period + "-01"
	endDate := period + "-31"

	var invoices []models.SalesInvoice
	h.db.Preload("Items").
		Where("invoice_date >= ? AND invoice_date <= ? AND status = ?",
			startDate, endDate, "COMPLETED").
		Find(&invoices)

	// B2B Invoices (with GST number)
	b2bInvoices := make([]B2BInvoice, 0)
	for _, inv := range invoices {
		if inv.CustomerGSTNumber != "" {
			b2bInvoices = append(b2bInvoices, B2BInvoice{
				InvoiceNo:    inv.InvoiceNo,
				InvoiceDate:  inv.InvoiceDate.Format("2006-01-02"),
				CustomerName: inv.CustomerName,
				GSTNumber:    inv.CustomerGSTNumber,
				InvoiceValue: inv.TotalAmount,
				TaxableValue: inv.TaxableAmount,
				CGST:         inv.CGST5Percent + inv.CGST18Percent,
				SGST:         inv.SGST5Percent + inv.SGST18Percent,
				IGST:         inv.IGST5Percent + inv.IGST18Percent,
				TotalGST:     inv.TotalGST,
			})
		}
	}

	// B2C Invoices (without GST number)
	b2cSummary := make([]B2CSummary, 0)
	var intraState5, intraState18 float64
	var cgst5, sgst5, cgst18, sgst18 float64

	for _, inv := range invoices {
		if inv.CustomerGSTNumber == "" {
			intraState5 += inv.TaxableAmount * 0.05 / (1 + 0.05) // Approx calculation
			intraState18 += inv.TaxableAmount * 0.18 / (1 + 0.18)
			cgst5 += inv.CGST5Percent
			sgst5 += inv.SGST5Percent
			cgst18 += inv.CGST18Percent
			sgst18 += inv.SGST18Percent
		}
	}

	if intraState5 > 0 {
		b2cSummary = append(b2cSummary, B2CSummary{
			Type:         "Intra-state",
			GSTRate:      5,
			TaxableValue: intraState5,
			CGST:         cgst5,
			SGST:         sgst5,
		})
	}
	if intraState18 > 0 {
		b2cSummary = append(b2cSummary, B2CSummary{
			Type:         "Intra-state",
			GSTRate:      18,
			TaxableValue: intraState18,
			CGST:         cgst18,
			SGST:         sgst18,
		})
	}

	// HSN Summary
	hsnMap := make(map[string]*HSNSummaryItem)
	for _, inv := range invoices {
		for _, item := range inv.Items {
			if item.HSNCode == "" {
				continue
			}

			if _, exists := hsnMap[item.HSNCode]; !exists {
				hsnMap[item.HSNCode] = &HSNSummaryItem{
					HSNCode: item.HSNCode,
					UQC:     "NOS",
				}
			}

			hsnMap[item.HSNCode].TotalQty += item.Quantity
			hsnMap[item.HSNCode].TaxableValue += item.TaxableAmount
			hsnMap[item.HSNCode].CGST += item.CGSTAmount
			hsnMap[item.HSNCode].SGST += item.SGSTAmount
			hsnMap[item.HSNCode].IGST += item.IGSTAmount
		}
	}

	hsnSummary := make([]HSNSummaryItem, 0)
	for _, hsn := range hsnMap {
		hsnSummary = append(hsnSummary, *hsn)
	}

	// Document issued summary
	docIssued := DocumentIssued{
		TotalIssued: len(invoices),
		Cancelled:   0,
	}
	if len(invoices) > 0 {
		docIssued.InvoicesFrom = invoices[0].InvoiceNo
		docIssued.InvoicesTo = invoices[len(invoices)-1].InvoiceNo
	}

	// Count cancelled
	var cancelled int64
	h.db.Model(&models.SalesInvoice{}).
		Where("invoice_date >= ? AND invoice_date <= ? AND status = ?",
			startDate, endDate, "CANCELLED").
		Count(&cancelled)
	docIssued.Cancelled = int(cancelled)

	gstr1Data := GSTR1Data{
		Period:         period,
		B2B:            b2bInvoices,
		B2CS:           b2cSummary,
		HSNSummary:     hsnSummary,
		DocumentIssued: docIssued,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gstr1Data,
	})
}

// ============================================================================
// GSTR-3B REPORT (Summary)
// ============================================================================

type GSTR3BData struct {
	Period        string           `json:"period"`
	OutwardSupply GSTR3BOutward    `json:"outwardSupply"`
	InwardSupply  GSTR3BInward     `json:"inwardSupply"`
	ITCAvailable  GSTR3BITC        `json:"itcAvailable"`
	TaxPayable    GSTR3BTaxPayable `json:"taxPayable"`
}

type GSTR3BOutward struct {
	TaxableValue float64 `json:"taxableValue"`
	CGST         float64 `json:"cgst"`
	SGST         float64 `json:"sgst"`
	IGST         float64 `json:"igst"`
	Cess         float64 `json:"cess"`
}

type GSTR3BInward struct {
	TaxableValue float64 `json:"taxableValue"`
	CGST         float64 `json:"cgst"`
	SGST         float64 `json:"sgst"`
	IGST         float64 `json:"igst"`
}

type GSTR3BITC struct {
	CGST float64 `json:"cgst"`
	SGST float64 `json:"sgst"`
	IGST float64 `json:"igst"`
}

type GSTR3BTaxPayable struct {
	CGST float64 `json:"cgst"`
	SGST float64 `json:"sgst"`
	IGST float64 `json:"igst"`
}

// GET /api/erp/gst/gstr3b - Generate GSTR-3B report
func (h *GSTReportsHandler) GetGSTR3BReport(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01"))

	startDate := period + "-01"
	endDate := period + "-31"

	// Outward supply (sales)
	var totalSales, taxableSales float64
	var totalCGST, totalSGST, totalIGST float64

	var invoices []models.SalesInvoice
	h.db.Where("invoice_date >= ? AND invoice_date <= ? AND status = ?",
		startDate, endDate, "COMPLETED").
		Find(&invoices)

	for _, inv := range invoices {
		totalSales += inv.TotalAmount
		taxableSales += inv.TaxableAmount
		totalCGST += inv.CGST5Percent + inv.CGST18Percent
		totalSGST += inv.SGST5Percent + inv.SGST18Percent
		totalIGST += inv.IGST5Percent + inv.IGST18Percent
	}

	// Inward supply & ITC (purchases)
	var itcEntries []models.ITCLedger
	h.db.Where("entry_date >= ? AND entry_date <= ?", startDate, endDate).
		Find(&itcEntries)

	var itcCGST, itcSGST, itcIGST float64
	var inwardTaxable float64

	for _, entry := range itcEntries {
		if entry.ITCEligible {
			inwardTaxable += entry.TaxableAmount
			itcCGST += entry.CGSTAmount
			itcSGST += entry.SGSTAmount
			itcIGST += entry.IGSTAmount
		}
	}

	// Tax payable
	taxPayableCGST := totalCGST - itcCGST
	taxPayableSGST := totalSGST - itcSGST
	taxPayableIGST := totalIGST - itcIGST

	gstr3bData := GSTR3BData{
		Period: period,
		OutwardSupply: GSTR3BOutward{
			TaxableValue: taxableSales,
			CGST:         totalCGST,
			SGST:         totalSGST,
			IGST:         totalIGST,
		},
		InwardSupply: GSTR3BInward{
			TaxableValue: inwardTaxable,
			CGST:         itcCGST,
			SGST:         itcSGST,
			IGST:         itcIGST,
		},
		ITCAvailable: GSTR3BITC{
			CGST: itcCGST,
			SGST: itcSGST,
			IGST: itcIGST,
		},
		TaxPayable: GSTR3BTaxPayable{
			CGST: taxPayableCGST,
			SGST: taxPayableSGST,
			IGST: taxPayableIGST,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gstr3bData,
	})
}

// ============================================================================
// ITC LEDGER
// ============================================================================

// GET /api/erp/gst/itc-ledger - Get ITC ledger entries
func (h *GSTReportsHandler) GetITCLedger(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01"))

	startDate := period + "-01"
	endDate := period + "-31"

	var entries []models.ITCLedger
	h.db.Preload("Vendor").
		Where("entry_date >= ? AND entry_date <= ?", startDate, endDate).
		Order("entry_date DESC").
		Find(&entries)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    entries,
	})
}

// POST /api/erp/gst/itc-ledger - Add ITC entry
func (h *GSTReportsHandler) AddITCEntry(c *gin.Context) {
	var req models.ITCLedger
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate total ITC
	req.TotalITC = req.CGSTAmount + req.SGSTAmount + req.IGSTAmount

	if err := h.db.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ITC entry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    req,
	})
}

// ============================================================================
// HSN-WISE SALES REPORT
// ============================================================================

type HSNWiseSalesReport struct {
	HSNCode       string  `json:"hsnCode"`
	Description   string  `json:"description"`
	GSTRate       float64 `json:"gstRate"`
	TotalQuantity float64 `json:"totalQuantity"`
	TotalValue    float64 `json:"totalValue"`
	TaxableValue  float64 `json:"taxableValue"`
	CGST          float64 `json:"cgst"`
	SGST          float64 `json:"sgst"`
	IGST          float64 `json:"igst"`
	TotalGST      float64 `json:"totalGst"`
}

// GET /api/erp/gst/hsn-wise-sales - Get HSN-wise sales report
func (h *GSTReportsHandler) GetHSNWiseSales(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01"))

	startDate := period + "-01"
	endDate := period + "-31"

	var items []models.SalesInvoiceItem
	h.db.Joins("JOIN sales_invoices ON sales_invoices.id = sales_invoice_items.invoice_id").
		Where("sales_invoices.invoice_date >= ? AND sales_invoices.invoice_date <= ? AND sales_invoices.status = ?",
			startDate, endDate, "COMPLETED").
		Find(&items)

	// Group by HSN code
	hsnMap := make(map[string]*HSNWiseSalesReport)

	for _, item := range items {
		hsnCode := item.HSNCode
		if hsnCode == "" {
			hsnCode = "UNKNOWN"
		}

		if _, exists := hsnMap[hsnCode]; !exists {
			hsnMap[hsnCode] = &HSNWiseSalesReport{
				HSNCode:     hsnCode,
				Description: item.Category,
				GSTRate:     item.GSTRate,
			}
		}

		hsnMap[hsnCode].TotalQuantity += item.Quantity
		hsnMap[hsnCode].TotalValue += item.LineTotal
		hsnMap[hsnCode].TaxableValue += item.TaxableAmount
		hsnMap[hsnCode].CGST += item.CGSTAmount
		hsnMap[hsnCode].SGST += item.SGSTAmount
		hsnMap[hsnCode].IGST += item.IGSTAmount
		hsnMap[hsnCode].TotalGST += item.TotalGST
	}

	report := make([]HSNWiseSalesReport, 0)
	for _, hsn := range hsnMap {
		report = append(report, *hsn)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    report,
	})
}

// ============================================================================
// DOCTOR COMMISSION REPORTS
// ============================================================================

// GET /api/erp/pos/doctor-commissions - Get doctor commission report
func (h *GSTReportsHandler) GetDoctorCommissions(c *gin.Context) {
	var commissions []models.DoctorCommission

	query := h.db.Preload("Doctor").Preload("Invoice").Order("transaction_date DESC")

	if doctorID := c.Query("doctor_id"); doctorID != "" {
		query = query.Where("doctor_id = ?", doctorID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("payment_status = ?", status)
	}
	if fromDate := c.Query("from_date"); fromDate != "" {
		query = query.Where("transaction_date >= ?", fromDate)
	}
	if toDate := c.Query("to_date"); toDate != "" {
		query = query.Where("transaction_date <= ?", toDate)
	}

	if err := query.Limit(100).Find(&commissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch commissions"})
		return
	}

	// Calculate summary
	var totalCommission, paidCommission, pendingCommission float64
	for _, comm := range commissions {
		totalCommission += comm.CommissionAmount
		if comm.PaymentStatus == "PAID" {
			paidCommission += comm.CommissionAmount
		} else {
			pendingCommission += comm.CommissionAmount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    commissions,
		"summary": gin.H{
			"total":   totalCommission,
			"paid":    paidCommission,
			"pending": pendingCommission,
		},
	})
}

// POST /api/erp/pos/doctor-commissions/:id/mark-paid - Mark commission as paid
func (h *GSTReportsHandler) MarkCommissionPaid(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		PaymentMethod    string `json:"paymentMethod"`
		PaymentReference string `json:"paymentReference"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	result := h.db.Model(&models.DoctorCommission{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"payment_status":    "PAID",
			"payment_date":      now,
			"payment_method":    req.PaymentMethod,
			"payment_reference": req.PaymentReference,
			"updated_at":        now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update commission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Commission marked as paid",
	})
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

// GET /api/erp/pos/dashboard-stats - Get POS dashboard statistics
func (h *GSTReportsHandler) GetDashboardStats(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	// Today's sales
	var todayInvoices []models.SalesInvoice
	h.db.Where("DATE(invoice_date) = ? AND status = ?", today, "COMPLETED").
		Find(&todayInvoices)

	var todaySales, todayGST float64
	for _, inv := range todayInvoices {
		todaySales += inv.TotalAmount
		todayGST += inv.TotalGST
	}

	// This month's sales
	thisMonth := time.Now().Format("2006-01")
	var monthInvoices []models.SalesInvoice
	h.db.Where("DATE_FORMAT(invoice_date, '%Y-%m') = ? AND status = ?", thisMonth, "COMPLETED").
		Find(&monthInvoices)

	var monthSales, monthGST float64
	for _, inv := range monthInvoices {
		monthSales += inv.TotalAmount
		monthGST += inv.TotalGST
	}

	// Pending commissions
	var pendingCommissions float64
	h.db.Model(&models.DoctorCommission{}).
		Where("payment_status = ?", "PENDING").
		Select("COALESCE(SUM(commission_amount), 0)").
		Scan(&pendingCommissions)

	// Held bills count
	var heldBillsCount int64
	h.db.Model(&models.HeldBill{}).
		Where("status = ?", "HELD").
		Count(&heldBillsCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"today": gin.H{
				"sales":    todaySales,
				"gst":      todayGST,
				"invoices": len(todayInvoices),
			},
			"thisMonth": gin.H{
				"sales":    monthSales,
				"gst":      monthGST,
				"invoices": len(monthInvoices),
			},
			"pendingCommissions": pendingCommissions,
			"heldBills":          heldBillsCount,
		},
	})
}

// GET /api/erp/gst/sales-register - Detailed sales register
func (h *GSTReportsHandler) GetSalesRegister(c *gin.Context) {
	fromDate := c.DefaultQuery("from_date", time.Now().AddDate(0, 0, -30).Format("2006-01-02"))
	toDate := c.DefaultQuery("to_date", time.Now().Format("2006-01-02"))

	var invoices []models.SalesInvoice
	h.db.Where("invoice_date >= ? AND invoice_date <= ? AND status = ?",
		fromDate, toDate, "COMPLETED").
		Order("invoice_date DESC").
		Limit(500).
		Find(&invoices)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoices,
		"count":   len(invoices),
	})
}

// GET /api/erp/gst/purchase-register - Detailed purchase register with ITC
func (h *GSTReportsHandler) GetPurchaseRegister(c *gin.Context) {
	fromDate := c.DefaultQuery("from_date", time.Now().AddDate(0, 0, -30).Format("2006-01-02"))
	toDate := c.DefaultQuery("to_date", time.Now().Format("2006-01-02"))

	var itcEntries []models.ITCLedger
	h.db.Preload("Vendor").
		Where("entry_date >= ? AND entry_date <= ?", fromDate, toDate).
		Order("entry_date DESC").
		Limit(500).
		Find(&itcEntries)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    itcEntries,
		"count":   len(itcEntries),
	})
}

// Export GST data to JSON (for external filing software)
func (h *GSTReportsHandler) ExportGSTData(c *gin.Context) {
	period := c.DefaultQuery("period", time.Now().Format("2006-01"))
	reportType := c.DefaultQuery("type", "gstr1") // gstr1, gstr3b, itc

	switch reportType {
	case "gstr1":
		// Call GSTR1 generation
		c.Set("period", period)
		h.GetGSTR1Report(c)
	case "gstr3b":
		c.Set("period", period)
		h.GetGSTR3BReport(c)
	case "itc":
		c.Set("period", period)
		h.GetITCLedger(c)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report type"})
	}
}
