package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchasePaymentsHandler struct {
	DB *gorm.DB
}

func NewPurchasePaymentsHandler(db *gorm.DB) *PurchasePaymentsHandler {
	return &PurchasePaymentsHandler{DB: db}
}

type PurchasePayment struct {
	ID            string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PaymentNo     string    `json:"payment_no" gorm:"uniqueIndex;not null"`
	VendorID      *string   `json:"vendor_id"`
	VendorName    string    `json:"vendor_name" gorm:"-"`
	BillID        *string   `json:"bill_id"`
	BillNo        string    `json:"bill_no" gorm:"-"`
	PaymentDate   time.Time `json:"payment_date"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"`
	ReferenceNo   string    `json:"reference_no"`
	Status        string    `json:"status" gorm:"default:COMPLETED"`
	Notes         string    `json:"notes"`
	CreatedBy     *string   `json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (PurchasePayment) TableName() string {
	return "purchase_payments"
}

// GET /api/erp/purchases/payments
func (h *PurchasePaymentsHandler) GetPayments(c *gin.Context) {
	vendorID := c.Query("vendor_id")
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	query := h.DB.Table("purchase_payments pp").
		Select(`pp.*, 
			COALESCE(v.name, 'Unknown') as vendor_name,
			COALESCE(pb.bill_no, '') as bill_no`).
		Joins("LEFT JOIN vendors v ON v.id = pp.vendor_id").
		Joins("LEFT JOIN purchase_bills pb ON pb.id = pp.bill_id")

	if vendorID != "" {
		query = query.Where("pp.vendor_id = ?", vendorID)
	}

	if status != "" {
		query = query.Where("pp.status = ?", status)
	}

	var payments []PurchasePayment
	if err := query.Order("pp.payment_date DESC").Limit(limit).Offset(offset).Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var total int64
	h.DB.Table("purchase_payments").Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
		"total":   total,
	})
}

// POST /api/erp/purchases/payments
func (h *PurchasePaymentsHandler) CreatePayment(c *gin.Context) {
	var req struct {
		VendorID      *string `json:"vendor_id"`
		BillID        *string `json:"bill_id"`
		PaymentDate   string  `json:"payment_date"`
		Amount        float64 `json:"amount"`
		PaymentMethod string  `json:"payment_method"`
		ReferenceNo   string  `json:"reference_no"`
		Notes         string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	paymentDate, _ := time.Parse("2006-01-02", req.PaymentDate)
	paymentNo := "PAY-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]

	payment := PurchasePayment{
		ID:            uuid.New().String(),
		PaymentNo:     paymentNo,
		VendorID:      req.VendorID,
		BillID:        req.BillID,
		PaymentDate:   paymentDate,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		ReferenceNo:   req.ReferenceNo,
		Status:        "COMPLETED",
		Notes:         req.Notes,
	}

	tx := h.DB.Begin()

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Update bill if bill_id provided
	if req.BillID != nil {
		var bill PurchaseBill
		if err := tx.Where("id = ?", req.BillID).First(&bill).Error; err == nil {
			newPaidAmount := bill.PaidAmount + req.Amount
			var newStatus string
			if newPaidAmount >= bill.TotalAmount {
				newStatus = "PAID"
			} else {
				newStatus = "PARTIAL"
			}

			tx.Model(&bill).Updates(map[string]interface{}{
				"paid_amount": newPaidAmount,
				"status":      newStatus,
			})
		}
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payment,
		"message": "Payment recorded successfully",
	})
}

// GET /api/erp/purchases/payments/due
func (h *PurchasePaymentsHandler) GetDuePayments(c *gin.Context) {
	type DuePayment struct {
		BillID      string     `json:"bill_id"`
		BillNo      string     `json:"bill_no"`
		VendorName  string     `json:"vendor_name"`
		BillDate    time.Time  `json:"bill_date"`
		DueDate     *time.Time `json:"due_date"`
		TotalAmount float64    `json:"total_amount"`
		PaidAmount  float64    `json:"paid_amount"`
		DueAmount   float64    `json:"due_amount"`
		DaysOverdue int        `json:"days_overdue"`
	}

	var duePayments []DuePayment

	h.DB.Raw(`
		SELECT 
			pb.id as bill_id,
			pb.bill_no,
			COALESCE(v.name, 'Unknown') as vendor_name,
			pb.bill_date,
			pb.due_date,
			pb.total_amount,
			pb.paid_amount,
			(pb.total_amount - pb.paid_amount) as due_amount,
			CASE 
				WHEN pb.due_date IS NULL THEN 0
				ELSE GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - pb.due_date::date))::int)
			END as days_overdue
		FROM purchase_bills pb
		LEFT JOIN vendors v ON v.id = pb.vendor_id
		WHERE pb.status IN ('UNPAID', 'PARTIAL')
		ORDER BY pb.due_date ASC NULLS LAST
		LIMIT 50
	`).Scan(&duePayments)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    duePayments,
	})
}

// POST /api/erp/purchases/payments/:id/void
func (h *PurchasePaymentsHandler) VoidPayment(c *gin.Context) {
	id := c.Param("id")

	var payment PurchasePayment
	if err := h.DB.Where("id = ?", id).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Payment not found"})
		return
	}

	tx := h.DB.Begin()

	// Update payment status
	if err := tx.Model(&payment).Update("status", "VOID").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Reverse bill payment
	if payment.BillID != nil {
		var bill PurchaseBill
		if err := tx.Where("id = ?", payment.BillID).First(&bill).Error; err == nil {
			newPaidAmount := bill.PaidAmount - payment.Amount
			var newStatus string
			if newPaidAmount <= 0 {
				newStatus = "UNPAID"
			} else if newPaidAmount < bill.TotalAmount {
				newStatus = "PARTIAL"
			} else {
				newStatus = "PAID"
			}

			tx.Model(&bill).Updates(map[string]interface{}{
				"paid_amount": newPaidAmount,
				"status":      newStatus,
			})
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment voided successfully",
	})
}

// GET /api/erp/purchases/payments/stats
func (h *PurchasePaymentsHandler) GetPaymentStats(c *gin.Context) {
	var stats struct {
		TotalPayments     int64   `json:"total_payments"`
		TotalPaid         float64 `json:"total_paid"`
		PaymentsThisMonth int64   `json:"payments_this_month"`
		AmountThisMonth   float64 `json:"amount_this_month"`
	}

	h.DB.Table("purchase_payments").Where("status = 'COMPLETED'").Count(&stats.TotalPayments)
	h.DB.Table("purchase_payments").Where("status = 'COMPLETED'").Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalPaid)

	h.DB.Table("purchase_payments").
		Where("status = 'COMPLETED' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)").
		Count(&stats.PaymentsThisMonth)

	h.DB.Table("purchase_payments").
		Where("status = 'COMPLETED' AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)").
		Select("COALESCE(SUM(amount), 0)").Scan(&stats.AmountThisMonth)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
