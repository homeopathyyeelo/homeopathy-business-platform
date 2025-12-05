package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseReturnsHandler struct {
	DB *gorm.DB
}

func NewPurchaseReturnsHandler(db *gorm.DB) *PurchaseReturnsHandler {
	return &PurchaseReturnsHandler{DB: db}
}

type PurchaseReturn struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ReturnNo     string     `json:"return_no" gorm:"uniqueIndex;not null"`
	OrderID      *string    `json:"order_id"`
	OrderNo      string     `json:"order_no" gorm:"-"`
	VendorID     *string    `json:"vendor_id"`
	VendorName   string     `json:"vendor_name" gorm:"-"`
	ReturnDate   time.Time  `json:"return_date"`
	Reason       string     `json:"reason"`
	Status       string     `json:"status" gorm:"default:PENDING"`
	TotalRefund  float64    `json:"total_refund" gorm:"default:0"`
	RefundMethod string     `json:"refund_method"`
	RefundStatus string     `json:"refund_status" gorm:"default:PENDING"`
	Notes        string     `json:"notes"`
	ApprovedBy   *string    `json:"approved_by"`
	ApprovedAt   *time.Time `json:"approved_at"`
	CreatedBy    *string    `json:"created_by"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (PurchaseReturn) TableName() string {
	return "purchase_returns"
}

type PurchaseReturnItem struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ReturnID    string    `json:"return_id"`
	ProductID   *string   `json:"product_id"`
	ProductName string    `json:"product_name"`
	Quantity    int       `json:"quantity"`
	UnitPrice   float64   `json:"unit_price"`
	Reason      string    `json:"reason"`
	CreatedAt   time.Time `json:"created_at"`
}

func (PurchaseReturnItem) TableName() string {
	return "purchase_return_items"
}

// GET /api/erp/purchases/returns
func (h *PurchaseReturnsHandler) GetReturns(c *gin.Context) {
	status := c.Query("status")
	vendorID := c.Query("vendor_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	query := h.DB.Table("purchase_returns pr").
		Select(`pr.*, 
			COALESCE(v.name, 'Unknown') as vendor_name,
			COALESCE(po.po_number, '') as order_no`).
		Joins("LEFT JOIN vendors v ON v.id = pr.vendor_id").
		Joins("LEFT JOIN purchase_orders po ON po.id = pr.order_id")

	if status != "" {
		query = query.Where("pr.status = ?", status)
	}

	if vendorID != "" {
		query = query.Where("pr.vendor_id = ?", vendorID)
	}

	var returns []PurchaseReturn
	if err := query.Order("pr.created_at DESC").Limit(limit).Offset(offset).Find(&returns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var total int64
	h.DB.Table("purchase_returns").Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    returns,
		"total":   total,
	})
}

// POST /api/erp/purchases/returns
func (h *PurchaseReturnsHandler) CreateReturn(c *gin.Context) {
	var req struct {
		OrderID      *string              `json:"order_id"`
		VendorID     *string              `json:"vendor_id"`
		ReturnDate   string               `json:"return_date"`
		Reason       string               `json:"reason"`
		TotalRefund  float64              `json:"total_refund"`
		RefundMethod string               `json:"refund_method"`
		Notes        string               `json:"notes"`
		Items        []PurchaseReturnItem `json:"items"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	returnDate, _ := time.Parse("2006-01-02", req.ReturnDate)
	returnNo := "RET-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]

	returnRecord := PurchaseReturn{
		ID:           uuid.New().String(),
		ReturnNo:     returnNo,
		OrderID:      req.OrderID,
		VendorID:     req.VendorID,
		ReturnDate:   returnDate,
		Reason:       req.Reason,
		Status:       "PENDING",
		TotalRefund:  req.TotalRefund,
		RefundMethod: req.RefundMethod,
		RefundStatus: "PENDING",
		Notes:        req.Notes,
	}

	tx := h.DB.Begin()

	if err := tx.Create(&returnRecord).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Create return items
	for i := range req.Items {
		req.Items[i].ID = uuid.New().String()
		req.Items[i].ReturnID = returnRecord.ID
		if err := tx.Create(&req.Items[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    returnRecord,
		"message": "Return created successfully",
	})
}

// PUT /api/erp/purchases/returns/:id/approve
func (h *PurchaseReturnsHandler) ApproveReturn(c *gin.Context) {
	id := c.Param("id")

	var returnRecord PurchaseReturn
	if err := h.DB.Where("id = ?", id).First(&returnRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Return not found"})
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":      "APPROVED",
		"approved_at": now,
	}

	if err := h.DB.Model(&returnRecord).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Return approved successfully",
		"data":    returnRecord,
	})
}

// POST /api/erp/purchases/returns/:id/refund
func (h *PurchaseReturnsHandler) ProcessRefund(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		RefundMethod string  `json:"refund_method"`
		RefundAmount float64 `json:"refund_amount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var returnRecord PurchaseReturn
	if err := h.DB.Where("id = ?", id).First(&returnRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Return not found"})
		return
	}

	if returnRecord.Status != "APPROVED" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Return must be approved first"})
		return
	}

	updates := map[string]interface{}{
		"refund_status": "COMPLETED",
		"status":        "COMPLETED",
		"refund_method": req.RefundMethod,
	}

	if err := h.DB.Model(&returnRecord).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Refund processed successfully",
	})
}

// GET /api/erp/purchases/returns/stats
func (h *PurchaseReturnsHandler) GetReturnStats(c *gin.Context) {
	var stats struct {
		TotalReturns      int64   `json:"total_returns"`
		PendingReturns    int64   `json:"pending_returns"`
		ApprovedReturns   int64   `json:"approved_returns"`
		TotalRefundAmount float64 `json:"total_refund_amount"`
	}

	h.DB.Table("purchase_returns").Count(&stats.TotalReturns)
	h.DB.Table("purchase_returns").Where("status = 'PENDING'").Count(&stats.PendingReturns)
	h.DB.Table("purchase_returns").Where("status = 'APPROVED'").Count(&stats.ApprovedReturns)
	h.DB.Table("purchase_returns").Where("refund_status = 'COMPLETED'").
		Select("COALESCE(SUM(total_refund), 0)").Scan(&stats.TotalRefundAmount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
