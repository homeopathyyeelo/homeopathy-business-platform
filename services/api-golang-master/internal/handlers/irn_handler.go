package handlers

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IRNHandler struct {
	db *gorm.DB
}

func NewIRNHandler(db *gorm.DB) *IRNHandler {
	return &IRNHandler{db: db}
}

// IRN Request/Response structures
type IRNRequest struct {
	InvoiceID    string        `json:"invoice_id" binding:"required"`
	SupplyType   string        `json:"supply_type"` // B2B, B2C, SEZWP, SEZWOP, EXPWP, EXPWOP, DEXP
	DocumentType string        `json:"document_type"` // INV, CRN, DBN
	DocumentNo   string        `json:"document_no" binding:"required"`
	DocumentDate string        `json:"document_date" binding:"required"`
	SellerGSTIN  string        `json:"seller_gstin" binding:"required"`
	BuyerGSTIN   string        `json:"buyer_gstin"`
	Items        []IRNLineItem `json:"items" binding:"required"`
	TotalValue   float64       `json:"total_value" binding:"required"`
	CGSTValue    float64       `json:"cgst_value"`
	SGSTValue    float64       `json:"sgst_value"`
	IGSTValue    float64       `json:"igst_value"`
	CESSValue    float64       `json:"cess_value"`
}

type IRNLineItem struct {
	ItemNo      int     `json:"item_no"`
	ProductName string  `json:"product_name"`
	HSNCode     string  `json:"hsn_code"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	TotalAmount float64 `json:"total_amount"`
	GSTRate     float64 `json:"gst_rate"`
	CGSTAmount  float64 `json:"cgst_amount"`
	SGSTAmount  float64 `json:"sgst_amount"`
	IGSTAmount  float64 `json:"igst_amount"`
}

type IRNResponse struct {
	Success      bool   `json:"success"`
	IRN          string `json:"irn"`
	AckNo        string `json:"ack_no"`
	AckDate      string `json:"ack_date"`
	SignedInvoice string `json:"signed_invoice"`
	SignedQRCode string `json:"signed_qr_code"`
	Status       string `json:"status"`
	ErrorMessage string `json:"error_message,omitempty"`
}

type IRNRecord struct {
	ID              string                 `json:"id" gorm:"type:uuid;primaryKey"`
	InvoiceID       string                 `json:"invoice_id" gorm:"type:uuid"`
	IRNNumber       string                 `json:"irn_number"`
	AckNumber       string                 `json:"ack_number"`
	AckDate         time.Time              `json:"ack_date"`
	SignedInvoice   string                 `json:"signed_invoice"`
	SignedQRCode    string                 `json:"signed_qr_code"`
	SupplyType      string                 `json:"supply_type"`
	DocumentType    string                 `json:"document_type"`
	SellerGSTIN     string                 `json:"seller_gstin"`
	BuyerGSTIN      string                 `json:"buyer_gstin"`
	RequestPayload  map[string]interface{} `json:"request_payload" gorm:"type:jsonb"`
	ResponsePayload map[string]interface{} `json:"response_payload" gorm:"type:jsonb"`
	Status          string                 `json:"status"`
	ErrorMessage    string                 `json:"error_message"`
	CancelledAt     *time.Time             `json:"cancelled_at"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

// POST /api/erp/irn/generate
func (h *IRNHandler) GenerateIRN(c *gin.Context) {
	var req IRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Check if IRN already exists for this invoice
	var existing IRNRecord
	if err := h.db.Where("invoice_id = ? AND status = 'active'", req.InvoiceID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "IRN already generated",
			"data":    existing,
		})
		return
	}

	// Generate IRN from government API
	irnResponse, err := h.callGSTAPI(req)
	if err != nil {
		// Store failed attempt
		record := &IRNRecord{
			ID:             uuid.New().String(),
			InvoiceID:      req.InvoiceID,
			SupplyType:     req.SupplyType,
			DocumentType:   req.DocumentType,
			SellerGSTIN:    req.SellerGSTIN,
			BuyerGSTIN:     req.BuyerGSTIN,
			RequestPayload: structToMap(req),
			Status:         "failed",
			ErrorMessage:   err.Error(),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		h.db.Create(record)

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "IRN generation failed: " + err.Error(),
		})
		return
	}

	// Store successful IRN
	record := &IRNRecord{
		ID:              uuid.New().String(),
		InvoiceID:       req.InvoiceID,
		IRNNumber:       irnResponse.IRN,
		AckNumber:       irnResponse.AckNo,
		AckDate:         time.Now(),
		SignedInvoice:   irnResponse.SignedInvoice,
		SignedQRCode:    irnResponse.SignedQRCode,
		SupplyType:      req.SupplyType,
		DocumentType:    req.DocumentType,
		SellerGSTIN:     req.SellerGSTIN,
		BuyerGSTIN:      req.BuyerGSTIN,
		RequestPayload:  structToMap(req),
		ResponsePayload: structToMap(irnResponse),
		Status:          "active",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := h.db.Create(record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save IRN record: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    record,
		"message": "IRN generated successfully",
	})
}

// GET /api/erp/irn/:invoice_id
func (h *IRNHandler) GetIRN(c *gin.Context) {
	invoiceID := c.Param("invoice_id")

	var record IRNRecord
	if err := h.db.Where("invoice_id = ? AND status = 'active'", invoiceID).First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "IRN not found for this invoice",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    record,
	})
}

// POST /api/erp/irn/:id/cancel
func (h *IRNHandler) CancelIRN(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var record IRNRecord
	if err := h.db.Where("id = ?", id).First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "IRN not found"})
		return
	}

	// Call GST API to cancel IRN
	if err := h.cancelGSTIRN(record.IRNNumber, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to cancel IRN: " + err.Error(),
		})
		return
	}

	// Update record
	now := time.Now()
	record.CancelledAt = &now
	record.Status = "cancelled"
	record.UpdatedAt = now

	if err := h.db.Save(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update IRN record",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "IRN cancelled successfully",
		"data":    record,
	})
}

// Call GST API to generate IRN
func (h *IRNHandler) callGSTAPI(req IRNRequest) (*IRNResponse, error) {
	// Check if sandbox mode
	if os.Getenv("IRN_SANDBOX_MODE") == "true" {
		return h.generateMockIRN(req), nil
	}

	// Prepare API request
	apiURL := os.Getenv("GST_API_BASE_URL") + "/invoice/irn"
	
	payload := map[string]interface{}{
		"Version":    "1.1",
		"TranDtls":   map[string]string{"TaxSch": "GST", "SupTyp": req.SupplyType},
		"DocDtls":    map[string]string{"Typ": req.DocumentType, "No": req.DocumentNo, "Dt": req.DocumentDate},
		"SellerDtls": map[string]string{"Gstin": req.SellerGSTIN},
		"BuyerDtls":  map[string]string{"Gstin": req.BuyerGSTIN},
		"ItemList":   req.Items,
		"ValDtls": map[string]float64{
			"AssVal":   req.TotalValue,
			"CgstVal":  req.CGSTValue,
			"SgstVal":  req.SGSTValue,
			"IgstVal":  req.IGSTValue,
			"CesVal":   req.CESSValue,
			"TotInvVal": req.TotalValue + req.CGSTValue + req.SGSTValue + req.IGSTValue + req.CESSValue,
		},
	}

	jsonData, _ := json.Marshal(payload)
	
	httpReq, _ := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("gstin", req.SellerGSTIN)
	httpReq.Header.Set("username", os.Getenv("GST_USERNAME"))
	httpReq.Header.Set("password", os.Getenv("GST_PASSWORD"))

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	var apiResp struct {
		Status      string `json:"status"`
		IRN         string `json:"Irn"`
		AckNo       string `json:"AckNo"`
		AckDt       string `json:"AckDt"`
		SignedInv   string `json:"SignedInvoice"`
		SignedQRCode string `json:"SignedQRCode"`
		ErrorDetails []struct {
			ErrorCode string `json:"error_cd"`
			ErrorMsg  string `json:"error_msg"`
		} `json:"ErrorDetails"`
	}

	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}

	if apiResp.Status != "1" && len(apiResp.ErrorDetails) > 0 {
		return nil, fmt.Errorf("%s: %s", apiResp.ErrorDetails[0].ErrorCode, apiResp.ErrorDetails[0].ErrorMsg)
	}

	return &IRNResponse{
		Success:       true,
		IRN:           apiResp.IRN,
		AckNo:         apiResp.AckNo,
		AckDate:       apiResp.AckDt,
		SignedInvoice: apiResp.SignedInv,
		SignedQRCode:  apiResp.SignedQRCode,
		Status:        "active",
	}, nil
}

// Generate mock IRN for sandbox testing
func (h *IRNHandler) generateMockIRN(req IRNRequest) *IRNResponse {
	// Generate deterministic IRN based on document number
	hash := sha256.Sum256([]byte(req.DocumentNo + req.SellerGSTIN))
	irn := fmt.Sprintf("%x", hash)[:64]

	qrData := fmt.Sprintf("%s|%s|%s|%.2f", req.SellerGSTIN, req.BuyerGSTIN, req.DocumentNo, req.TotalValue)
	qrCode := base64.StdEncoding.EncodeToString([]byte(qrData))

	return &IRNResponse{
		Success:       true,
		IRN:           irn,
		AckNo:         fmt.Sprintf("ACK%d", time.Now().Unix()),
		AckDate:       time.Now().Format("2006-01-02 15:04:05"),
		SignedInvoice: base64.StdEncoding.EncodeToString([]byte("MOCK_SIGNED_INVOICE")),
		SignedQRCode:  qrCode,
		Status:        "active",
	}
}

func (h *IRNHandler) cancelGSTIRN(irnNumber, reason string) error {
	if os.Getenv("IRN_SANDBOX_MODE") == "true" {
		return nil // Mock success
	}

	apiURL := os.Getenv("GST_API_BASE_URL") + "/invoice/cancel"
	payload := map[string]interface{}{
		"Irn":    irnNumber,
		"CnlRsn": reason,
		"CnlRem": reason,
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

func structToMap(data interface{}) map[string]interface{} {
	jsonData, _ := json.Marshal(data)
	var result map[string]interface{}
	json.Unmarshal(jsonData, &result)
	return result
}
