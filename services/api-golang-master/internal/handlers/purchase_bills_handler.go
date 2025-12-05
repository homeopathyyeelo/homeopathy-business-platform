package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseBillsHandler struct {
	DB *gorm.DB
}

func NewPurchaseBillsHandler(db *gorm.DB) *PurchaseBillsHandler {
	return &PurchaseBillsHandler{DB: db}
}

type PurchaseBill struct {
	ID             string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BillNo         string     `json:"bill_no" gorm:"uniqueIndex;not null"`
	VendorID       *string    `json:"vendor_id"`
	VendorName     string     `json:"vendor_name" gorm:"-"`
	OrderID        *string    `json:"order_id"`
	OrderNo        string     `json:"order_no" gorm:"-"`
	BillDate       time.Time  `json:"bill_date" gorm:"not null"`
	DueDate        *time.Time `json:"due_date"`
	TotalAmount    float64    `json:"total_amount" gorm:"default:0"`
	PaidAmount     float64    `json:"paid_amount" gorm:"default:0"`
	TaxAmount      float64    `json:"tax_amount" gorm:"default:0"`
	Discount       float64    `json:"discount" gorm:"default:0"`
	Status         string     `json:"status" gorm:"default:UNPAID"`
	PaymentTerms   string     `json:"payment_terms"`
	Notes          string     `json:"notes"`
	AttachmentURLs []string   `json:"attachment_urls" gorm:"type:text[]"`
	CreatedBy      *string    `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (PurchaseBill) TableName() string {
	return "purchase_bills"
}

type PurchaseBillItem struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BillID      string    `json:"bill_id"`
	ProductID   *string   `json:"product_id"`
	ProductName string    `json:"product_name"`
	Quantity    float64   `json:"quantity"`
	UnitPrice   float64   `json:"unit_price"`
	TaxRate     float64   `json:"tax_rate" gorm:"default:0"`
	Discount    float64   `json:"discount" gorm:"default:0"`
	TotalAmount float64   `json:"total_amount"`
	CreatedAt   time.Time `json:"created_at"`
}

func (PurchaseBillItem) TableName() string {
	return "purchase_bill_items"
}

// GET /api/erp/purchases/bills
func (h *PurchaseBillsHandler) GetBills(c *gin.Context) {
	status := c.Query("status")
	vendorID := c.Query("vendor_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	query := h.DB.Table("purchase_bills pb").
		Select(`pb.*, 
			COALESCE(v.name, 'Unknown Vendor') as vendor_name,
			COALESCE(po.po_number, '') as order_no`).
		Joins("LEFT JOIN vendors v ON v.id = pb.vendor_id").
		Joins("LEFT JOIN purchase_orders po ON po.id = pb.order_id")

	if status != "" {
		query = query.Where("pb.status = ?", status)
	}

	if vendorID != "" {
		query = query.Where("pb.vendor_id = ?", vendorID)
	}

	var bills []PurchaseBill
	if err := query.Order("pb.created_at DESC").Limit(limit).Offset(offset).Find(&bills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Get total count
	var total int64
	h.DB.Table("purchase_bills").Where("status = ?", status).Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bills,
		"total":   total,
	})
}

// GET /api/erp/purchases/bills/:id
func (h *PurchaseBillsHandler) GetBill(c *gin.Context) {
	id := c.Param("id")

	var bill PurchaseBill
	err := h.DB.Table("purchase_bills pb").
		Select(`pb.*, 
			COALESCE(v.name, 'Unknown Vendor') as vendor_name,
			COALESCE(po.po_number, '') as order_no`).
		Joins("LEFT JOIN vendors v ON v.id = pb.vendor_id").
		Joins("LEFT JOIN purchase_orders po ON po.id = pb.order_id").
		Where("pb.id = ?", id).
		First(&bill).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Bill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Get bill items
	var items []PurchaseBillItem
	h.DB.Where("bill_id = ?", id).Find(&items)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bill,
		"items":   items,
	})
}

// POST /api/erp/purchases/bills
func (h *PurchaseBillsHandler) CreateBill(c *gin.Context) {
	var req struct {
		VendorID     *string            `json:"vendor_id"`
		OrderID      *string            `json:"order_id"`
		BillDate     string             `json:"bill_date"`
		DueDate      *string            `json:"due_date"`
		TotalAmount  float64            `json:"total_amount"`
		TaxAmount    float64            `json:"tax_amount"`
		Discount     float64            `json:"discount"`
		PaymentTerms string             `json:"payment_terms"`
		Notes        string             `json:"notes"`
		Items        []PurchaseBillItem `json:"items"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Generate bill number
	billNo := generateBillNumber()

	billDate, _ := time.Parse("2006-01-02", req.BillDate)
	var dueDate *time.Time
	if req.DueDate != nil {
		parsedDueDate, _ := time.Parse("2006-01-02", *req.DueDate)
		dueDate = &parsedDueDate
	}

	bill := PurchaseBill{
		ID:           uuid.New().String(),
		BillNo:       billNo,
		VendorID:     req.VendorID,
		OrderID:      req.OrderID,
		BillDate:     billDate,
		DueDate:      dueDate,
		TotalAmount:  req.TotalAmount,
		PaidAmount:   0,
		TaxAmount:    req.TaxAmount,
		Discount:     req.Discount,
		Status:       "UNPAID",
		PaymentTerms: req.PaymentTerms,
		Notes:        req.Notes,
	}

	tx := h.DB.Begin()
	if err := tx.Create(&bill).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Create bill items
	for i := range req.Items {
		req.Items[i].ID = uuid.New().String()
		req.Items[i].BillID = bill.ID
		if err := tx.Create(&req.Items[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    bill,
		"message": "Bill created successfully",
	})
}

// PUT /api/erp/purchases/bills/:id/pay
func (h *PurchaseBillsHandler) MarkAsPaid(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Amount        float64 `json:"amount"`
		PaymentMethod string  `json:"payment_method"`
		PaymentDate   string  `json:"payment_date"`
		ReferenceNo   string  `json:"reference_no"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var bill PurchaseBill
	if err := h.DB.Where("id = ?", id).First(&bill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Bill not found"})
		return
	}

	// Update paid amount
	newPaidAmount := bill.PaidAmount + req.Amount

	// Determine new status
	var newStatus string
	if newPaidAmount >= bill.TotalAmount {
		newStatus = "PAID"
	} else if newPaidAmount > 0 {
		newStatus = "PARTIAL"
	} else {
		newStatus = "UNPAID"
	}

	// Update bill
	if err := h.DB.Model(&bill).Updates(map[string]interface{}{
		"paid_amount": newPaidAmount,
		"status":      newStatus,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment recorded successfully",
		"data":    bill,
	})
}

// DELETE /api/erp/purchases/bills/:id
func (h *PurchaseBillsHandler) DeleteBill(c *gin.Context) {
	id := c.Param("id")

	tx := h.DB.Begin()

	// Delete bill items first
	if err := tx.Where("bill_id = ?", id).Delete(&PurchaseBillItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Delete bill
	if err := tx.Where("id = ?", id).Delete(&PurchaseBill{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Bill deleted successfully",
	})
}

// GET /api/erp/purchases/bills/stats
func (h *PurchaseBillsHandler) GetBillStats(c *gin.Context) {
	var stats struct {
		TotalBills       int64   `json:"total_bills"`
		UnpaidBills      int64   `json:"unpaid_bills"`
		OverdueBills     int64   `json:"overdue_bills"`
		TotalUnpaid      float64 `json:"total_unpaid"`
		TotalPaid        float64 `json:"total_paid"`
		TotalOutstanding float64 `json:"total_outstanding"`
	}

	h.DB.Table("purchase_bills").Count(&stats.TotalBills)
	h.DB.Table("purchase_bills").Where("status IN ('UNPAID', 'PARTIAL')").Count(&stats.UnpaidBills)
	h.DB.Table("purchase_bills").Where("status = 'OVERDUE'").Count(&stats.OverdueBills)

	h.DB.Table("purchase_bills").Where("status IN ('UNPAID', 'PARTIAL')").
		Select("COALESCE(SUM(total_amount - paid_amount), 0)").Scan(&stats.TotalOutstanding)

	h.DB.Table("purchase_bills").Select("COALESCE(SUM(paid_amount), 0)").Scan(&stats.TotalPaid)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

func generateBillNumber() string {
	return "BILL-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]
}
