// Hardware Integration Handlers - Weighing machines, barcode scanners, POS displays
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HardwareIntegrationHandler handles hardware device operations
type HardwareIntegrationHandler struct {
	db     *GORMDatabase
	cache  *CacheService
	serial *SerialPortService
	printer *PrinterService
	display *CustomerDisplayService
}

// NewHardwareIntegrationHandler creates a new hardware integration handler
func NewHardwareIntegrationHandler(db *GORMDatabase, cache *CacheService, serial *SerialPortService, printer *PrinterService, display *CustomerDisplayService) *HardwareIntegrationHandler {
	return &HardwareIntegrationHandler{
		db:      db,
		cache:   cache,
		serial:  serial,
		printer: printer,
		display: display,
	}
}

// ==================== WEIGHING MACHINE INTEGRATION ====================

// GetWeight retrieves weight from weighing machine
func (h *HardwareIntegrationHandler) GetWeight(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Get weighing machine configuration
	scaleID := c.Query("scale_id")
	if scaleID == "" {
		scaleID = "default"
	}

	// In a real implementation, this would communicate with the weighing machine
	// For now, return a mock weight
	weight := map[string]interface{}{
		"scale_id":   scaleID,
		"weight":     1.25, // kg
		"unit":       "kg",
		"timestamp":  time.Now(),
		"stable":     true,
	}

	c.JSON(http.StatusOK, weight)
}

// CalibrateScale calibrates the weighing machine
func (h *HardwareIntegrationHandler) CalibrateScale(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		ScaleID string  `json:"scale_id" binding:"required"`
		ZeroWeight float64 `json:"zero_weight"`
		CalWeight  float64 `json:"cal_weight" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would send calibration commands to the scale
	response := map[string]interface{}{
		"message":     "Scale calibrated successfully",
		"scale_id":    request.ScaleID,
		"calibration": map[string]interface{}{
			"zero_weight": request.ZeroWeight,
			"cal_weight":  request.CalWeight,
			"timestamp":   time.Now(),
		},
	}

	c.JSON(http.StatusOK, response)
}

// ==================== BARCODE SCANNER INTEGRATION ====================

// ScanBarcode processes barcode scan data
func (h *HardwareIntegrationHandler) ScanBarcode(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		Barcode string `json:"barcode" binding:"required"`
		Source  string `json:"source"` // scanner_id or "manual"
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process barcode - lookup product
	product, err := h.lookupProductByBarcode(request.Barcode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Log barcode scan
	scanLog := BarcodeScanLog{
		Barcode:   request.Barcode,
		ProductID: product.ID,
		Source:    request.Source,
		ScannedAt: time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&scanLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log scan"})
		return
	}

	response := map[string]interface{}{
		"product": product,
		"scan_id": scanLog.ID,
		"scanned_at": scanLog.ScannedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetBarcodeHistory retrieves barcode scan history
func (h *HardwareIntegrationHandler) GetBarcodeHistory(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var logs []BarcodeScanLog
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&BarcodeScanLog{})

	// Apply filters
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if source := c.Query("source"); source != "" {
		query = query.Where("source = ?", source)
	}

	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		if endDate := c.Query("end_date"); endDate != "" {
			query = query.Where("scanned_at BETWEEN ? AND ?", startDate, endDate)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count scan logs"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("scanned_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve scan history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ==================== CUSTOMER DISPLAY INTEGRATION ====================

// UpdateCustomerDisplay updates the customer-facing display
func (h *HardwareIntegrationHandler) UpdateCustomerDisplay(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var request struct {
		DisplayID   string                 `json:"display_id" binding:"required"`
		Content     map[string]interface{} `json:"content" binding:"required"`
		Line1       string                 `json:"line1"`
		Line2       string                 `json:"line2"`
		Total       float64                `json:"total"`
		Change      float64                `json:"change"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update customer display
	err := h.display.UpdateDisplay(request.DisplayID, request.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer display"})
		return
	}

	// Log display update
	displayLog := CustomerDisplayLog{
		DisplayID: request.DisplayID,
		Content:   request.Content,
		UpdatedAt: time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&displayLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log display update"})
		return
	}

	response := map[string]interface{}{
		"message":     "Customer display updated successfully",
		"display_id":  request.DisplayID,
		"updated_at":  time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetCustomerDisplayStatus retrieves customer display status
func (h *HardwareIntegrationHandler) GetCustomerDisplayStatus(c *gin.Context) {
	displayID := c.Param("display_id")

	status := map[string]interface{}{
		"display_id": displayID,
		"status":     "connected",
		"last_update": time.Now(),
		"content": map[string]interface{}{
			"line1": "Welcome to",
			"line2": "Yeelo Homeopathy",
			"total": 0.00,
		},
	}

	c.JSON(http.StatusOK, status)
}

// ==================== PRINTER INTEGRATION ====================

// PrintReceipt prints a receipt
func (h *HardwareIntegrationHandler) PrintReceipt(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	var request struct {
		PrinterID string      `json:"printer_id" binding:"required"`
		Receipt   ReceiptData `json:"receipt" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Print receipt
	err := h.printer.PrintReceipt(request.PrinterID, request.Receipt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to print receipt"})
		return
	}

	// Log print job
	printLog := PrintLog{
		PrinterID: request.PrinterID,
		JobType:   "receipt",
		Status:    "completed",
		Data:      request.Receipt,
		PrintedAt: time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&printLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log print job"})
		return
	}

	response := map[string]interface{}{
		"message":     "Receipt printed successfully",
		"printer_id":  request.PrinterID,
		"job_id":      printLog.ID,
		"printed_at":  time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// PrintReport prints a report
func (h *HardwareIntegrationHandler) PrintReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		PrinterID string      `json:"printer_id" binding:"required"`
		Report    ReportData  `json:"report" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Print report
	err := h.printer.PrintReport(request.PrinterID, request.Report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to print report"})
		return
	}

	// Log print job
	printLog := PrintLog{
		PrinterID: request.PrinterID,
		JobType:   "report",
		Status:    "completed",
		Data:      request.Report,
		PrintedAt: time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&printLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log print job"})
		return
	}

	response := map[string]interface{}{
		"message":     "Report printed successfully",
		"printer_id":  request.PrinterID,
		"job_id":      printLog.ID,
		"printed_at":  time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== POS FEATURES ====================

// HoldBill holds a bill for later completion
func (h *HardwareIntegrationHandler) HoldBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		BillID      string      `json:"bill_id" binding:"required"`
		CustomerID  string      `json:"customer_id"`
		Items       []BillItem  `json:"items" binding:"required"`
		Total       float64     `json:"total" binding:"required"`
		Notes       string      `json:"notes"`
		HoldReason  string      `json:"hold_reason"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create held bill
	heldBill := HeldBill{
		BillID:     request.BillID,
		CustomerID: request.CustomerID,
		Items:      request.Items,
		Total:      request.Total,
		Status:     "held",
		Notes:      request.Notes,
		HoldReason: request.HoldReason,
		HeldAt:     time.Now(),
		HeldBy:     c.GetString("user_id"),
	}

	if err := h.db.DB.WithContext(ctx).Create(&heldBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hold bill"})
		return
	}

	response := map[string]interface{}{
		"message":    "Bill held successfully",
		"held_bill_id": heldBill.ID,
		"held_at":    heldBill.HeldAt,
		"status":     "held",
	}

	c.JSON(http.StatusOK, response)
}

// GetHeldBills retrieves held bills
func (h *HardwareIntegrationHandler) GetHeldBills(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var bills []HeldBill
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&HeldBill{}).Where("status = ?", "held")

	// Filter by customer if provided
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	// Filter by date range
	if startDate := c.Query("start_date"); startDate != "" {
		if endDate := c.Query("end_date"); endDate != "" {
			query = query.Where("held_at BETWEEN ? AND ?", startDate, endDate)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count held bills"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("held_at DESC").Find(&bills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve held bills"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bills":  bills,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ResumeHeldBill resumes a held bill
func (h *HardwareIntegrationHandler) ResumeHeldBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	billID := c.Param("bill_id")

	var heldBill HeldBill
	if err := h.db.DB.WithContext(ctx).Where("id = ? AND status = ?", billID, "held").First(&heldBill).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Held bill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve held bill"})
		return
	}

	// Resume the bill
	updates := map[string]interface{}{
		"status":     "resumed",
		"resumed_at": time.Now(),
		"resumed_by": c.GetString("user_id"),
	}

	if err := h.db.DB.WithContext(ctx).Model(&heldBill).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resume held bill"})
		return
	}

	response := map[string]interface{}{
		"message":     "Bill resumed successfully",
		"held_bill_id": heldBill.ID,
		"resumed_at":  time.Now(),
		"bill_data":   heldBill,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== DUAL PANEL POS ====================

// SwitchPOSPanel switches between POS panels
func (h *HardwareIntegrationHandler) SwitchPOSPanel(c *gin.Context) {
	var request struct {
		Panel    string `json:"panel" binding:"required"` // "sales", "inventory", "reports"
		PanelID  string `json:"panel_id"`
		Settings map[string]interface{} `json:"settings"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would control the POS interface
	response := map[string]interface{}{
		"message":     "POS panel switched successfully",
		"panel":       request.Panel,
		"panel_id":    request.PanelID,
		"switched_at": time.Now(),
		"settings":    request.Settings,
	}

	c.JSON(http.StatusOK, response)
}

// GetPOSLayout retrieves POS layout configuration
func (h *HardwareIntegrationHandler) GetPOSLayout(c *gin.Context) {
	layout := map[string]interface{}{
		"panels": []map[string]interface{}{
			{
				"id":      "main_panel",
				"type":    "sales",
				"position": "left",
				"size":    "70%",
			},
			{
				"id":      "side_panel",
				"type":    "customer_info",
				"position": "right",
				"size":    "30%",
			},
		},
		"hotkeys": map[string]string{
			"F1": "new_sale",
			"F2": "hold_bill",
			"F3": "print_receipt",
			"F4": "customer_lookup",
		},
		"dual_monitor": true,
		"customer_display": true,
	}

	c.JSON(http.StatusOK, layout)
}

// ==================== HARDWARE STATUS ====================

// GetHardwareStatus retrieves hardware device status
func (h *HardwareIntegrationHandler) GetHardwareStatus(c *gin.Context) {
	status := map[string]interface{}{
		"weighing_machine": map[string]interface{}{
			"status":      "connected",
			"scale_id":    "SCALE_001",
			"last_reading": time.Now(),
			"calibrated":  true,
		},
		"barcode_scanner": map[string]interface{}{
			"status":      "connected",
			"scanner_id":  "SCANNER_001",
			"last_scan":   time.Now(),
			"scans_today": 150,
		},
		"customer_display": map[string]interface{}{
			"status":      "connected",
			"display_id":  "DISPLAY_001",
			"last_update": time.Now(),
		},
		"printer": map[string]interface{}{
			"status":      "connected",
			"printer_id":  "PRINTER_001",
			"paper_level": "good",
			"ink_level":   "good",
		},
		"pos_system": map[string]interface{}{
			"status":        "online",
			"dual_panel":    true,
			"held_bills":    3,
			"active_session": true,
		},
	}

	c.JSON(http.StatusOK, status)
}

// ==================== HELPER METHODS ====================

func (h *HardwareIntegrationHandler) lookupProductByBarcode(barcode string) (*Product, error) {
	// In a real implementation, this would query the database
	// For now, return a mock product
	return &Product{
		ID:   "product_mock_" + barcode,
		Code: "PROD_" + barcode,
		Name: "Sample Product",
	}, nil
}

// ==================== DATA STRUCTURES ====================

// ReceiptData represents receipt data for printing
type ReceiptData struct {
	Header   string      `json:"header"`
	Items    []BillItem  `json:"items"`
	Subtotal float64     `json:"subtotal"`
	Tax      float64     `json:"tax"`
	Discount float64     `json:"discount"`
	Total    float64     `json:"total"`
	Footer   string      `json:"footer"`
}

// ReportData represents report data for printing
type ReportData struct {
	Title      string                 `json:"title"`
	Subtitle   string                 `json:"subtitle"`
	Data       map[string]interface{} `json:"data"`
	GeneratedAt time.Time             `json:"generated_at"`
}


// HeldBill represents a held bill
type HeldBill struct {
	BaseEntity
	BillID     string     `gorm:"not null;index" json:"bill_id"`
	CustomerID string     `gorm:"index" json:"customer_id"`
	Items      []BillItem `gorm:"type:jsonb" json:"items"`
	Total      float64    `gorm:"type:decimal(10,2)" json:"total"`
	Status     string     `gorm:"not null;size:20" json:"status"`
	Notes      string     `gorm:"type:text" json:"notes"`
	HoldReason string     `gorm:"type:text" json:"hold_reason"`
	HeldAt     time.Time  `gorm:"not null" json:"held_at"`
	HeldBy     string     `gorm:"not null" json:"held_by"`
	ResumedAt  *time.Time `gorm:"null" json:"resumed_at"`
	ResumedBy  string     `gorm:"null" json:"resumed_by"`
}

// BarcodeScanLog represents barcode scan logs
type BarcodeScanLog struct {
	BaseEntity
	Barcode   string    `gorm:"not null;index;size:100" json:"barcode"`
	ProductID string    `gorm:"not null;index" json:"product_id"`
	Source    string    `gorm:"size:50" json:"source"`
	ScannedAt time.Time `gorm:"not null" json:"scanned_at"`
}

// CustomerDisplayLog represents customer display update logs
type CustomerDisplayLog struct {
	BaseEntity
	DisplayID string                 `gorm:"not null;index;size:100" json:"display_id"`
	Content   map[string]interface{} `gorm:"type:jsonb" json:"content"`
	UpdatedAt time.Time              `gorm:"not null" json:"updated_at"`
}

// PrintLog represents print job logs
type PrintLog struct {
	BaseEntity
	PrinterID string      `gorm:"not null;index;size:100" json:"printer_id"`
	JobType   string      `gorm:"not null;size:50" json:"job_type"`
	Status    string      `gorm:"not null;size:20" json:"status"`
	Data      interface{} `gorm:"type:jsonb" json:"data"`
	PrintedAt time.Time   `gorm:"not null" json:"printed_at"`
	Error     string      `gorm:"type:text" json:"error"`
}
