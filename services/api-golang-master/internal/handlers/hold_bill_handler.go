package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/yeelo/homeopathy-erp/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type HoldBillHandler struct {
	db *gorm.DB
}

func NewHoldBillHandler(db *gorm.DB) *HoldBillHandler {
	return &HoldBillHandler{db: db}
}

// HoldBillRequest represents the request payload for holding a bill
type HoldBillRequest struct {
	CounterID       *string       `json:"counter_id"`
	CustomerID      *uuid.UUID    `json:"customer_id"`
	CustomerName    string        `json:"customer_name"`
	CustomerPhone   string        `json:"customer_phone"`
	Items           []interface{} `json:"items"` // Cart items
	SubTotal        float64       `json:"sub_total"`
	DiscountAmount  float64       `json:"discount_amount"`
	DiscountPercent float64       `json:"discount_percent"`
	TaxAmount       float64       `json:"tax_amount"`
	TotalAmount     float64       `json:"total_amount"`
	BillingType     string        `json:"billing_type"`
	Notes           string        `json:"notes"`
	HeldByName      string        `json:"held_by_name"`
}

// POST /api/erp/pos/hold-bill
// Hold the current bill for later
func (h *HoldBillHandler) HoldBill(c *gin.Context) {
	var req HoldBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data", "details": err.Error()})
		return
	}

	// Validate required fields
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot hold empty cart"})
		return
	}

	// Generate unique bill number
	billNumber := fmt.Sprintf("HOLD-%s", time.Now().Format("20060102-150405"))

	// Convert items to JSON
	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process cart items"})
		return
	}

	// Create hold bill record
	holdBill := models.HoldBill{
		BillNumber:      billNumber,
		CounterID:       req.CounterID,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		Items:           itemsJSON,
		SubTotal:        req.SubTotal,
		DiscountAmount:  req.DiscountAmount,
		DiscountPercent: req.DiscountPercent,
		TaxAmount:       req.TaxAmount,
		TotalAmount:     req.TotalAmount,
		TotalItems:      len(req.Items),
		BillingType:     req.BillingType,
		Notes:           req.Notes,
		HeldByName:      req.HeldByName,
		ResumedCount:    0,
	}

	// Save to database
	if err := h.db.Create(&holdBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hold bill", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Bill held successfully",
		"data":    holdBill,
	})
}

// GET /api/erp/pos/hold-bills
// Get all held bills
func (h *HoldBillHandler) GetHoldBills(c *gin.Context) {
	counterID := c.Query("counter_id")
	billingType := c.Query("billing_type")

	query := h.db.Model(&models.HoldBill{})

	// Filter by counter if provided
	if counterID != "" {
		query = query.Where("counter_id = ?", counterID)
	}

	// Filter by billing type if provided
	if billingType != "" {
		query = query.Where("billing_type = ?", billingType)
	}

	// Order by most recent first
	var holdBills []models.HoldBill
	if err := query.Order("created_at DESC").Find(&holdBills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hold bills"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    holdBills,
		"count":   len(holdBills),
	})
}

// GET /api/erp/pos/hold-bills/:id
// Get a specific held bill for resuming
func (h *HoldBillHandler) GetHoldBill(c *gin.Context) {
	id := c.Param("id")

	var holdBill models.HoldBill
	if err := h.db.Where("id = ?", id).First(&holdBill).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Hold bill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hold bill"})
		return
	}

	// Parse items JSON
	var items []interface{}
	if err := json.Unmarshal(holdBill.Items, &items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse cart items"})
		return
	}

	// Increment resume count
	h.db.Model(&holdBill).Update("resumed_count", gorm.Expr("resumed_count + 1"))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":               holdBill.ID,
			"bill_number":      holdBill.BillNumber,
			"counter_id":       holdBill.CounterID,
			"customer_id":      holdBill.CustomerID,
			"customer_name":    holdBill.CustomerName,
			"customer_phone":   holdBill.CustomerPhone,
			"items":            items, // Return parsed items
			"sub_total":        holdBill.SubTotal,
			"discount_amount":  holdBill.DiscountAmount,
			"discount_percent": holdBill.DiscountPercent,
			"tax_amount":       holdBill.TaxAmount,
			"total_amount":     holdBill.TotalAmount,
			"total_items":      holdBill.TotalItems,
			"billing_type":     holdBill.BillingType,
			"notes":            holdBill.Notes,
			"held_by_name":     holdBill.HeldByName,
			"created_at":       holdBill.CreatedAt,
		},
	})
}

// DELETE /api/erp/pos/hold-bills/:id
// Delete a held bill
func (h *HoldBillHandler) DeleteHoldBill(c *gin.Context) {
	id := c.Param("id")

	// Soft delete
	if err := h.db.Where("id = ?", id).Delete(&models.HoldBill{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete hold bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Hold bill deleted successfully",
	})
}

// GET /api/erp/pos/hold-bills/stats
// Get statistics for hold bills
func (h *HoldBillHandler) GetHoldBillStats(c *gin.Context) {
	var stats struct {
		TotalHeld   int64   `json:"total_held"`
		TotalAmount float64 `json:"total_amount"`
		TodayHeld   int64   `json:"today_held"`
		TodayAmount float64 `json:"today_amount"`
	}

	// Total held bills
	h.db.Model(&models.HoldBill{}).Count(&stats.TotalHeld)

	// Total amount
	h.db.Model(&models.HoldBill{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalAmount)

	// Today's held bills
	today := time.Now().Truncate(24 * time.Hour)
	h.db.Model(&models.HoldBill{}).Where("created_at >= ?", today).Count(&stats.TodayHeld)

	// Today's amount
	h.db.Model(&models.HoldBill{}).Where("created_at >= ?", today).Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TodayAmount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
