package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// BillSnapshotHandler handles bill snapshot operations
type BillSnapshotHandler struct {
	service *services.BillSnapshotService
}

// NewBillSnapshotHandler creates a new bill snapshot handler
func NewBillSnapshotHandler(db *gorm.DB) *BillSnapshotHandler {
	return &BillSnapshotHandler{
		service: services.NewBillSnapshotService(db),
	}
}

// CreateBillSnapshot creates a new bill snapshot
// POST /api/erp/bill-snapshots
func (h *BillSnapshotHandler) CreateBillSnapshot(c *gin.Context) {
	var req services.BillSnapshotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// Set created by from context (if available)
	if req.CreatedBy == "" {
		req.CreatedBy = "system"
	}

	snapshot, err := h.service.CreateBillSnapshot(req)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondCreated(c, snapshot, "Bill snapshot created successfully")
}

// GetBillSnapshot retrieves a bill snapshot by ID
// GET /api/erp/bill-snapshots/:id
func (h *BillSnapshotHandler) GetBillSnapshot(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		RespondBadRequest(c, "Snapshot ID is required")
		return
	}

	snapshot, err := h.service.GetBillSnapshot(id)
	if err != nil {
		RespondNotFound(c, "Bill Snapshot")
		return
	}

	RespondSuccess(c, snapshot)
}

// GetBillSnapshotByReference retrieves bill snapshot by reference
// GET /api/erp/bill-snapshots/by-reference/:type/:id
func (h *BillSnapshotHandler) GetBillSnapshotByReference(c *gin.Context) {
	refType := c.Param("type")
	refID := c.Param("id")

	if refType == "" || refID == "" {
		RespondBadRequest(c, "Reference type and ID are required")
		return
	}

	snapshot, err := h.service.GetBillSnapshotByReference(refType, refID)
	if err != nil {
		RespondNotFound(c, "Bill Snapshot")
		return
	}

	RespondSuccess(c, snapshot)
}

// GetCustomerBillHistory returns bill history for a customer
// GET /api/erp/customers/:id/bill-history
func (h *BillSnapshotHandler) GetCustomerBillHistory(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		RespondBadRequest(c, "Customer ID is required")
		return
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := parseInt(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	history, err := h.service.GetCustomerBillHistory(customerID, limit)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, gin.H{
		"customerId": customerID,
		"bills":      history,
		"total":      len(history),
	})
}

// GetCustomerLastBill returns the most recent ending bill
// GET /api/erp/customers/:id/last-bill
func (h *BillSnapshotHandler) GetCustomerLastBill(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		RespondBadRequest(c, "Customer ID is required")
		return
	}

	lastBill, err := h.service.GetCustomerLastBill(customerID)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	if lastBill == nil {
		RespondSuccess(c, gin.H{
			"customerId": customerID,
			"lastBill":   nil,
			"message":    "No previous bills found",
		})
		return
	}

	RespondSuccess(c, gin.H{
		"customerId": customerID,
		"lastBill":   lastBill,
	})
}

// GetCustomerReturnVisitData returns last bill + history for returning customers
// GET /api/erp/customers/:id/return-visit
func (h *BillSnapshotHandler) GetCustomerReturnVisitData(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		RespondBadRequest(c, "Customer ID is required")
		return
	}

	// Get last ending bill
	lastBill, err := h.service.GetCustomerLastBill(customerID)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	// Get recent bill history (last 10)
	history, err := h.service.GetCustomerBillHistory(customerID, 10)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, gin.H{
		"customerId": customerID,
		"lastBill":   lastBill,
		"history":    history,
	})
}

// MarkBillAsPrinted marks a bill as printed
// POST /api/erp/bill-snapshots/:id/mark-printed
func (h *BillSnapshotHandler) MarkBillAsPrinted(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		RespondBadRequest(c, "Snapshot ID is required")
		return
	}

	if err := h.service.MarkAsPrinted(id); err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, gin.H{
		"message": "Bill marked as printed",
	})
}

// GetPrinterSettings retrieves printer settings for a counter
// GET /api/erp/printer-settings/:counterId
func (h *BillSnapshotHandler) GetPrinterSettings(c *gin.Context) {
	counterID := c.Param("counterId")
	if counterID == "" {
		counterID = "COUNTER-1" // Default
	}

	settings, err := h.service.GetPrinterSettings(counterID)
	if err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, settings)
}

// UpdatePrinterSettings updates printer settings
// PUT /api/erp/printer-settings/:counterId
func (h *BillSnapshotHandler) UpdatePrinterSettings(c *gin.Context) {
	counterID := c.Param("counterId")
	if counterID == "" {
		RespondBadRequest(c, "Counter ID is required")
		return
	}

	var req struct {
		PaperSize      string `json:"paperSize"`
		PrinterType    string `json:"printerType"`
		PrinterName    string `json:"printerName"`
		AutoPrint      bool   `json:"autoPrint"`
		CopiesPerPrint int    `json:"copiesPerPrint"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// Validate paper size
	if req.PaperSize != "3x5" && req.PaperSize != "4x6" {
		RespondBadRequest(c, "Paper size must be '3x5' or '4x6'")
		return
	}

	// Get or create settings
	settings, _ := h.service.GetPrinterSettings(counterID)
	if settings == nil {
		RespondInternalError(c, nil)
		return
	}

	// Update fields
	settings.CounterID = counterID
	settings.PaperSize = req.PaperSize
	settings.PrinterType = req.PrinterType
	settings.PrinterName = req.PrinterName
	settings.AutoPrint = req.AutoPrint
	settings.CopiesPerPrint = req.CopiesPerPrint

	if err := h.service.UpdatePrinterSettings(settings); err != nil {
		RespondInternalError(c, err)
		return
	}

	RespondSuccess(c, gin.H{
		"message":  "Printer settings updated successfully",
		"settings": settings,
	})
}

// Helper function
func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}
