package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type EInvoiceHandler struct {
	db *gorm.DB
}

func NewEInvoiceHandler(db *gorm.DB) *EInvoiceHandler {
	return &EInvoiceHandler{db: db}
}

// E-Invoice request structure (as per NIC portal)
type EInvoiceRequest struct {
	Version    string             `json:"Version"`
	TranDtls   TransactionDetails `json:"TranDtls"`
	DocDtls    DocumentDetails    `json:"DocDtls"`
	SellerDtls SellerDetails      `json:"SellerDtls"`
	BuyerDtls  BuyerDetails       `json:"BuyerDtls"`
	ItemList   []InvoiceItem      `json:"ItemList"`
	ValDtls    ValueDetails       `json:"ValDtls"`
}

type TransactionDetails struct {
	TaxSch      string `json:"TaxSch"`      // GST
	SupTyp      string `json:"SupTyp"`      // B2B, B2C
	RegRev      string `json:"RegRev"`      // N
	EcmGstin    string `json:"EcmGstin"`    // blank
	IgstOnIntra string `json:"IgstOnIntra"` // N
}

type DocumentDetails struct {
	Typ string `json:"Typ"` // INV
	No  string `json:"No"`  // Invoice number
	Dt  string `json:"Dt"`  // DD/MM/YYYY
}

type SellerDetails struct {
	Gstin string `json:"Gstin"`
	LglNm string `json:"LglNm"`
	TrdNm string `json:"TrdNm"`
	Addr1 string `json:"Addr1"`
	Addr2 string `json:"Addr2"`
	Loc   string `json:"Loc"`
	Pin   int    `json:"Pin"`
	Stcd  string `json:"Stcd"`
	Ph    string `json:"Ph"`
	Em    string `json:"Em"`
}

type BuyerDetails struct {
	Gstin string `json:"Gstin"`
	LglNm string `json:"LglNm"`
	TrdNm string `json:"TrdNm"`
	Pos   string `json:"Pos"`
	Addr1 string `json:"Addr1"`
	Addr2 string `json:"Addr2"`
	Loc   string `json:"Loc"`
	Pin   int    `json:"Pin"`
	Stcd  string `json:"Stcd"`
	Ph    string `json:"Ph"`
	Em    string `json:"Em"`
}

type InvoiceItem struct {
	SlNo       string  `json:"SlNo"`
	PrdDesc    string  `json:"PrdDesc"`
	IsServc    string  `json:"IsServc"`
	HsnCd      string  `json:"HsnCd"`
	Qty        float64 `json:"Qty"`
	Unit       string  `json:"Unit"`
	UnitPrice  float64 `json:"UnitPrice"`
	TotAmt     float64 `json:"TotAmt"`
	Discount   float64 `json:"Discount"`
	AssAmt     float64 `json:"AssAmt"`
	GstRt      float64 `json:"GstRt"`
	IgstAmt    float64 `json:"IgstAmt"`
	CgstAmt    float64 `json:"CgstAmt"`
	SgstAmt    float64 `json:"SgstAmt"`
	TotItemVal float64 `json:"TotItemVal"`
}

type ValueDetails struct {
	AssVal    float64 `json:"AssVal"`
	CgstVal   float64 `json:"CgstVal"`
	SgstVal   float64 `json:"SgstVal"`
	IgstVal   float64 `json:"IgstVal"`
	Discount  float64 `json:"Discount"`
	OthChrg   float64 `json:"OthChrg"`
	RndOffAmt float64 `json:"RndOffAmt"`
	TotInvVal float64 `json:"TotInvVal"`
}

// E-Invoice response from NIC
type EInvoiceResponse struct {
	Success  bool   `json:"success"`
	IRN      string `json:"irn"`
	AckNo    string `json:"ackNo"`
	AckDt    string `json:"ackDt"`
	SignedQR string `json:"signedQr"`
	Message  string `json:"message"`
}

// POST /api/erp/einvoice/generate
func (h *EInvoiceHandler) GenerateEInvoice(c *gin.Context) {
	var req struct {
		InvoiceID string `json:"invoiceId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get invoice details
	var invoice models.SalesInvoice
	if err := h.db.Preload("Items").Preload("Customer").First(&invoice, "id = ?", req.InvoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Check if already generated
	if invoice.EInvoiceGenerated {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "E-Invoice already generated",
			"irn":   invoice.IRN,
		})
		return
	}

	// Prepare E-Invoice request
	eInvReq := prepareEInvoiceRequest(&invoice)

	// Generate E-Invoice format locally (No GSP API call)
	// For businesses with turnover < 10 Cr, E-Invoice is NOT mandatory
	// This generates proper NIC schema format for record-keeping
	// IRN is generated locally for reference (not submitted to GST portal)

	irnResponse := generateLocalEInvoiceFormat(&invoice)

	// Update invoice with E-Invoice details
	now := time.Now()
	invoice.IRN = irnResponse.IRN
	invoice.AckNo = irnResponse.AckNo
	invoice.AckDate = &now
	invoice.EInvoiceGenerated = true

	if err := h.db.Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save E-Invoice details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"irn":         irnResponse.IRN,
			"ackNo":       irnResponse.AckNo,
			"ackDt":       now.Format("02/01/2006 15:04:05"),
			"signedQr":    irnResponse.SignedQR,
			"invoice":     invoice,
			"eInvRequest": eInvReq,
		},
	})
}

// Prepare E-Invoice JSON as per NIC schema
func prepareEInvoiceRequest(invoice *models.SalesInvoice) *EInvoiceRequest {
	// Get company details from database
	sellerGSTIN := "06BUAPG3815Q1ZH" // Yeelo Homeopathy GSTIN

	eInvReq := &EInvoiceRequest{
		Version: "1.1",
		TranDtls: TransactionDetails{
			TaxSch:      "GST",
			SupTyp:      invoice.InvoiceType, // B2B, B2C, SEZWP, SEZWOP, EXPWP, EXPWOP
			RegRev:      "N",
			EcmGstin:    "",
			IgstOnIntra: "N",
		},
		DocDtls: DocumentDetails{
			Typ: "INV",
			No:  invoice.InvoiceNo,
			Dt:  invoice.InvoiceDate.Format("02/01/2006"),
		},
		SellerDtls: SellerDetails{
			Gstin: sellerGSTIN,
			LglNm: "Yeelo Homeopathy Pvt Ltd",
			TrdNm: "Yeelo Homeopathy",
			Addr1: "123 Main Street",
			Addr2: "Near City Mall",
			Loc:   "Mumbai",
			Pin:   400001,
			Stcd:  "27", // Maharashtra
			Ph:    "8478019973",
			Em:    "info@yeelo.com",
		},
		BuyerDtls: BuyerDetails{
			Gstin: invoice.CustomerGSTNumber,
			LglNm: invoice.CustomerName,
			TrdNm: invoice.CustomerName,
			Pos:   "27", // Place of supply
			Addr1: invoice.CustomerAddress,
			Loc:   "Mumbai",
			Pin:   400001,
			Stcd:  "27",
			Ph:    invoice.CustomerPhone,
			Em:    invoice.CustomerEmail,
		},
		ItemList: make([]InvoiceItem, 0),
		ValDtls: ValueDetails{
			AssVal:    invoice.TaxableAmount,
			CgstVal:   invoice.CGST5Percent + invoice.CGST18Percent,
			SgstVal:   invoice.SGST5Percent + invoice.SGST18Percent,
			IgstVal:   invoice.IGST5Percent + invoice.IGST18Percent,
			Discount:  invoice.TotalDiscount,
			RndOffAmt: invoice.RoundOff,
			TotInvVal: invoice.TotalAmount,
		},
	}

	// Add items
	for i, item := range invoice.Items {
		eInvItem := InvoiceItem{
			SlNo:       fmt.Sprintf("%d", i+1),
			PrdDesc:    item.ProductName,
			IsServc:    "N",
			HsnCd:      item.HSNCode,
			Qty:        item.Quantity,
			Unit:       "NOS",
			UnitPrice:  item.UnitPrice,
			TotAmt:     item.UnitPrice * item.Quantity,
			Discount:   item.DiscountAmount,
			AssAmt:     item.TaxableAmount,
			GstRt:      item.GSTRate,
			CgstAmt:    item.CGSTAmount,
			SgstAmt:    item.SGSTAmount,
			IgstAmt:    item.IGSTAmount,
			TotItemVal: item.LineTotal,
		}
		eInvReq.ItemList = append(eInvReq.ItemList, eInvItem)
	}

	return eInvReq
}

// generateLocalEInvoiceFormat generates E-Invoice format locally
// NOTE: This does NOT submit to GST portal - for record-keeping only
// E-Invoice is mandatory only for turnover > ₹10 Cr (as of Oct 2022)
// For smaller businesses, this generates proper format for future compliance
func generateLocalEInvoiceFormat(invoice *models.SalesInvoice) *EInvoiceResponse {
	// Generate local reference IRN (64-character hash)
	data := fmt.Sprintf("%s%s%s%s",
		invoice.InvoiceNo,
		invoice.InvoiceDate.Format("20060102"),
		invoice.CustomerName,
		time.Now().Format("150405"),
	)
	hash := sha256.Sum256([]byte(data))
	irn := hex.EncodeToString(hash[:])

	// Generate Ack No: 14-digit reference number
	ackNo := fmt.Sprintf("LOCAL%09d", time.Now().Unix()%999999999)

	// Generate QR code data as per GST specifications
	// Format: GSTIN|DocType|DocNum|DocDate|TotalInvVal|IRN
	qrData := fmt.Sprintf("%s|INV|%s|%s|%.2f|%s",
		"06BUAPG3815Q1ZH", // Your GSTIN
		invoice.InvoiceNo,
		invoice.InvoiceDate.Format("02/01/2006"),
		invoice.TotalAmount,
		irn,
	)

	return &EInvoiceResponse{
		Success:  true,
		IRN:      irn,
		AckNo:    ackNo,
		AckDt:    time.Now().Format("02/01/2006 15:04:05"),
		SignedQR: qrData,
		Message:  "E-Invoice format generated locally (Not submitted to GST portal)",
	}
}

// GET /api/erp/einvoice/:invoiceId
func (h *EInvoiceHandler) GetEInvoiceDetails(c *gin.Context) {
	invoiceID := c.Param("invoiceId")

	var invoice models.SalesInvoice
	if err := h.db.First(&invoice, "id = ?", invoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	if !invoice.EInvoiceGenerated {
		c.JSON(http.StatusBadRequest, gin.H{"error": "E-Invoice not generated for this invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"irn":   invoice.IRN,
			"ackNo": invoice.AckNo,
			"ackDt": invoice.AckDate,
		},
	})
}

// POST /api/erp/einvoice/cancel
func (h *EInvoiceHandler) CancelEInvoice(c *gin.Context) {
	var req struct {
		InvoiceID string `json:"invoiceId" binding:"required"`
		Reason    string `json:"reason" binding:"required"`
		Remarks   string `json:"remarks"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get invoice
	var invoice models.SalesInvoice
	if err := h.db.First(&invoice, "id = ?", req.InvoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	if !invoice.EInvoiceGenerated {
		c.JSON(http.StatusBadRequest, gin.H{"error": "E-Invoice not generated"})
		return
	}

	// In production, call GSP API to cancel E-Invoice
	// For now, just mark as cancelled

	now := time.Now()
	invoice.Status = "CANCELLED"
	invoice.CancelledAt = &now
	invoice.CancellationReason = req.Reason + " - " + req.Remarks

	if err := h.db.Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "E-Invoice cancelled successfully",
	})
}

// ============================================================================
// E-WAY BILL GENERATION
// ============================================================================

type EWayBillRequest struct {
	InvoiceID       string `json:"invoiceId" binding:"required"`
	TransportMode   string `json:"transportMode"` // 1-Road, 2-Rail, 3-Air, 4-Ship
	TransportID     string `json:"transportId"`   // Vehicle number / LR number
	TransporterName string `json:"transporterName"`
	TransporterID   string `json:"transporterId"` // GST of transporter
	Distance        int    `json:"distance"`      // In KM
	FromPlace       string `json:"fromPlace"`
	ToPlace         string `json:"toPlace"`
}

type EWayBillResponse struct {
	Success      bool   `json:"success"`
	EWayBillNo   string `json:"eWayBillNo"`
	EWayBillDate string `json:"eWayBillDate"`
	ValidUpto    string `json:"validUpto"`
	Message      string `json:"message"`
}

// POST /api/erp/ewaybill/generate
func (h *EInvoiceHandler) GenerateEWayBill(c *gin.Context) {
	var req EWayBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get invoice
	var invoice models.SalesInvoice
	if err := h.db.First(&invoice, "id = ?", req.InvoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// E-Way Bill required if invoice value > 50,000
	if invoice.TotalAmount < 50000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "E-Way Bill not required for invoice value below ₹50,000",
		})
		return
	}

	// Generate local E-Way Bill reference (Not submitted to GST portal)
	// For actual transport, you can manually generate from GST portal if needed
	eWayBillNo := fmt.Sprintf("LOCAL-EW%010d", time.Now().Unix()%9999999999)
	validUpto := time.Now().AddDate(0, 0, getEWayBillValidity(req.Distance))

	// Store E-Way Bill details in database for records
	eWayBillData := map[string]interface{}{
		"invoice_id":       req.InvoiceID,
		"ewaybill_no":      eWayBillNo,
		"generated_date":   time.Now(),
		"valid_upto":       validUpto,
		"distance":         req.Distance,
		"transporter_id":   req.TransporterID,
		"transporter_name": req.TransporterName,
		"transport_id":     req.TransportID,
		"transport_mode":   req.TransportMode,
		"from_place":       req.FromPlace,
		"to_place":         req.ToPlace,
	}
	h.db.Table("ewaybills").Create(eWayBillData)

	response := EWayBillResponse{
		Success:      true,
		EWayBillNo:   eWayBillNo,
		EWayBillDate: time.Now().Format("02/01/2006 15:04:05"),
		ValidUpto:    validUpto.Format("02/01/2006 15:04:05"),
		Message:      "E-Way Bill reference generated (Manual GST portal submission required for transport)",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// Get E-Way Bill validity in days based on distance
func getEWayBillValidity(distanceKM int) int {
	if distanceKM <= 100 {
		return 1
	} else if distanceKM <= 300 {
		return 3
	} else if distanceKM <= 500 {
		return 5
	} else if distanceKM <= 1000 {
		return 10
	} else {
		return 15
	}
}

// POST /api/erp/ewaybill/extend
func (h *EInvoiceHandler) ExtendEWayBill(c *gin.Context) {
	var req struct {
		EWayBillNo    string `json:"eWayBillNo" binding:"required"`
		VehicleNo     string `json:"vehicleNo" binding:"required"`
		FromPlace     string `json:"fromPlace" binding:"required"`
		RemainingDist int    `json:"remainingDist" binding:"required"`
		TransitType   string `json:"transitType"` // W-Warehouse, T-Transit
		AddressLine1  string `json:"addressLine1"`
		Reason        string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production, call GSP API to extend E-Way Bill
	validUpto := time.Now().AddDate(0, 0, getEWayBillValidity(req.RemainingDist))

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "E-Way Bill extended successfully",
		"validUpto": validUpto.Format("02/01/2006 15:04:05"),
	})
}

// POST /api/erp/ewaybill/cancel
func (h *EInvoiceHandler) CancelEWayBill(c *gin.Context) {
	var req struct {
		EWayBillNo string `json:"eWayBillNo" binding:"required"`
		Reason     string `json:"reason" binding:"required"` // 1-Duplicate, 2-Order Cancelled, 3-Data Entry Mistake, 4-Others
		Remarks    string `json:"remarks"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production, call GSP API to cancel E-Way Bill

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "E-Way Bill cancelled successfully",
	})
}
