package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseGRNHandler struct {
	DB *gorm.DB
}

func NewPurchaseGRNHandler(db *gorm.DB) *PurchaseGRNHandler {
	return &PurchaseGRNHandler{DB: db}
}

type PurchaseGRN struct {
	ID             string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	GRNNo          string    `json:"grn_no" gorm:"uniqueIndex;not null"`
	OrderID        *string   `json:"order_id"`
	OrderNo        string    `json:"order_no" gorm:"-"`
	ReceivedDate   time.Time `json:"received_date"`
	ReceivedBy     *string   `json:"received_by"`
	ReceivedByName string    `json:"received_by_name" gorm:"-"`
	Status         string    `json:"status" gorm:"default:PENDING"`
	QCStatus       string    `json:"qc_status" gorm:"default:PENDING"`
	WarehouseID    *string   `json:"warehouse_id"`
	Notes          string    `json:"notes"`
	CreatedBy      *string   `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (PurchaseGRN) TableName() string {
	return "purchase_grn"
}

type PurchaseGRNItem struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	GRNID       string     `json:"grn_id"`
	ProductID   *string    `json:"product_id"`
	ProductName string     `json:"product_name"`
	OrderedQty  int        `json:"ordered_qty"`
	ReceivedQty int        `json:"received_qty"`
	DamagedQty  int        `json:"damaged_qty" gorm:"default:0"`
	AcceptedQty int        `json:"accepted_qty"`
	BatchNo     string     `json:"batch_no"`
	ExpiryDate  *time.Time `json:"expiry_date"`
	Notes       string     `json:"notes"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (PurchaseGRNItem) TableName() string {
	return "purchase_grn_items"
}

// GET /api/erp/purchases/grn
func (h *PurchaseGRNHandler) GetGRNs(c *gin.Context) {
	status := c.Query("status")
	orderID := c.Query("order_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	query := h.DB.Table("purchase_grn pg").
		Select(`pg.*, 
			COALESCE(po.po_number, '') as order_no,
			COALESCE(u.name, 'Unknown') as received_by_name`).
		Joins("LEFT JOIN purchase_orders po ON po.id = pg.order_id").
		Joins("LEFT JOIN users u ON u.id = pg.received_by")

	if status != "" {
		query = query.Where("pg.status = ?", status)
	}

	if orderID != "" {
		query = query.Where("pg.order_id = ?", orderID)
	}

	var grns []PurchaseGRN
	if err := query.Order("pg.created_at DESC").Limit(limit).Offset(offset).Find(&grns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var total int64
	h.DB.Table("purchase_grn").Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grns,
		"total":   total,
	})
}

// GET /api/erp/purchases/grn/:id
func (h *PurchaseGRNHandler) GetGRN(c *gin.Context) {
	id := c.Param("id")

	var grn PurchaseGRN
	err := h.DB.Table("purchase_grn pg").
		Select(`pg.*, 
			COALESCE(po.po_number, '') as order_no,
			COALESCE(u.name, 'Unknown') as received_by_name`).
		Joins("LEFT JOIN purchase_orders po ON po.id = pg.order_id").
		Joins("LEFT JOIN users u ON u.id = pg.received_by").
		Where("pg.id = ?", id).
		First(&grn).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "GRN not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Get GRN items
	var items []PurchaseGRNItem
	h.DB.Where("grn_id = ?", id).Find(&items)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grn,
		"items":   items,
	})
}

// POST /api/erp/purchases/grn
func (h *PurchaseGRNHandler) CreateGRN(c *gin.Context) {
	var req struct {
		OrderID      *string           `json:"order_id"`
		ReceivedDate string            `json:"received_date"`
		ReceivedBy   *string           `json:"received_by"`
		WarehouseID  *string           `json:"warehouse_id"`
		Notes        string            `json:"notes"`
		Items        []PurchaseGRNItem `json:"items"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	receivedDate, _ := time.Parse("2006-01-02", req.ReceivedDate)
	grnNo := "GRN-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]

	grn := PurchaseGRN{
		ID:           uuid.New().String(),
		GRNNo:        grnNo,
		OrderID:      req.OrderID,
		ReceivedDate: receivedDate,
		ReceivedBy:   req.ReceivedBy,
		Status:       "PENDING",
		QCStatus:     "PENDING",
		WarehouseID:  req.WarehouseID,
		Notes:        req.Notes,
	}

	tx := h.DB.Begin()

	if err := tx.Create(&grn).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Create GRN items
	for i := range req.Items {
		req.Items[i].ID = uuid.New().String()
		req.Items[i].GRNID = grn.ID
		if err := tx.Create(&req.Items[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    grn,
		"message": "GRN created successfully",
	})
}

// PUT /api/erp/purchases/grn/:id/approve
func (h *PurchaseGRNHandler) ApproveGRN(c *gin.Context) {
	id := c.Param("id")

	var grn PurchaseGRN
	if err := h.DB.Where("id = ?", id).First(&grn).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "GRN not found"})
		return
	}

	if err := h.DB.Model(&grn).Update("status", "APPROVED").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "GRN approved successfully",
	})
}

// POST /api/erp/purchases/grn/:id/qc
func (h *PurchaseGRNHandler) UpdateQCStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		QCStatus string `json:"qc_status"` // PASSED, FAILED, PARTIAL
		Notes    string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var grn PurchaseGRN
	if err := h.DB.Where("id = ?", id).First(&grn).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "GRN not found"})
		return
	}

	updates := map[string]interface{}{
		"qc_status": req.QCStatus,
		"notes":     req.Notes,
	}

	if err := h.DB.Model(&grn).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "QC status updated successfully",
	})
}

// GET /api/erp/purchases/grn/stats
func (h *PurchaseGRNHandler) GetGRNStats(c *gin.Context) {
	var stats struct {
		TotalGRNs    int64 `json:"total_grns"`
		PendingGRNs  int64 `json:"pending_grns"`
		ApprovedGRNs int64 `json:"approved_grns"`
		QCPassedGRNs int64 `json:"qc_passed_grns"`
		QCFailedGRNs int64 `json:"qc_failed_grns"`
	}

	h.DB.Table("purchase_grn").Count(&stats.TotalGRNs)
	h.DB.Table("purchase_grn").Where("status = 'PENDING'").Count(&stats.PendingGRNs)
	h.DB.Table("purchase_grn").Where("status = 'APPROVED'").Count(&stats.ApprovedGRNs)
	h.DB.Table("purchase_grn").Where("qc_status = 'PASSED'").Count(&stats.QCPassedGRNs)
	h.DB.Table("purchase_grn").Where("qc_status = 'FAILED'").Count(&stats.QCFailedGRNs)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
