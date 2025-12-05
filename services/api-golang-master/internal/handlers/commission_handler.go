package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type CommissionHandler struct {
	db                *gorm.DB
	commissionService *services.CommissionService
}

type CommissionRule struct {
	ID              string    `json:"id"`
	SalesmanID      string    `json:"salesman_id"`
	RuleType        string    `json:"rule_type"` // percentage, fixed, tiered
	Percentage      float64   `json:"percentage"`
	FixedAmount     float64   `json:"fixed_amount"`
	MinAmount       float64   `json:"min_amount"`
	MaxAmount       float64   `json:"max_amount"`
	ProductCategory string    `json:"product_category"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}

type CommissionReport struct {
	SalesmanID   string  `json:"salesman_id"`
	SalesmanName string  `json:"salesman_name"`
	TotalSales   float64 `json:"total_sales"`
	Commission   float64 `json:"commission"`
	Paid         float64 `json:"paid"`
	Pending      float64 `json:"pending"`
}

func NewCommissionHandler(db *gorm.DB) *CommissionHandler {
	return &CommissionHandler{
		db:                db,
		commissionService: services.NewCommissionService(db),
	}
}

// POST /api/erp/commissions/rules
func (h *CommissionHandler) CreateRule(c *gin.Context) {
	var req CommissionRule
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	req.ID = "comm-rule-" + time.Now().Format("20060102150405")
	req.CreatedAt = time.Now()

	err := h.db.Exec(`
		INSERT INTO commission_rules (id, salesman_id, rule_type, rate, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, req.ID, req.SalesmanID, req.RuleType, req.Percentage, req.CreatedAt).Error

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error(), "success": false})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    req,
	})
}

// GET /api/erp/commissions/calculate
func (h *CommissionHandler) CalculateCommission(c *gin.Context) {
	beneficiaryID := c.Query("beneficiary_id")
	if beneficiaryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "beneficiary_id is required"})
		return
	}

	fromDate := c.Query("from_date")
	toDate := c.Query("to_date")

	var dateFrom, dateTo *time.Time
	if fromDate != "" {
		if t, err := time.Parse("2006-01-02", fromDate); err == nil {
			dateFrom = &t
		}
	}
	if toDate != "" {
		if t, err := time.Parse("2006-01-02", toDate); err == nil {
			dateTo = &t
		}
	}

	// Get transactions from service
	transactions, _, err := h.commissionService.GetTransactions(beneficiaryID, "", dateFrom, dateTo, 1, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate commission"})
		return
	}

	// Get beneficiary details
	var beneficiary struct {
		ID   string `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}
	h.db.Table("commission_beneficiaries").Where("id = ?", beneficiaryID).First(&beneficiary)

	// Calculate totals
	var totalCommission, paidCommission, pendingCommission float64
	for _, txn := range transactions {
		totalCommission += txn.CommissionAmount
		if txn.Status == "PAID" {
			paidCommission += txn.CommissionAmount
		} else {
			pendingCommission += txn.CommissionAmount
		}
	}

	report := gin.H{
		"beneficiaryId":     beneficiary.ID,
		"beneficiaryName":   beneficiary.Name,
		"totalCommission":   totalCommission,
		"paidCommission":    paidCommission,
		"pendingCommission": pendingCommission,
		"transactionCount":  len(transactions),
		"period": gin.H{
			"from": fromDate,
			"to":   toDate,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    report,
	})
}

// GET /api/erp/commissions/report
func (h *CommissionHandler) GetCommissionReport(c *gin.Context) {
	period := c.DefaultQuery("period", "current-month")

	// Calculate date range based on period
	now := time.Now()
	var startDate, endDate time.Time

	switch period {
	case "current-month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)
	case "last-month":
		startDate = time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
		endDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).Add(-time.Second)
	case "current-quarter":
		quarter := (int(now.Month()) - 1) / 3
		startDate = time.Date(now.Year(), time.Month(quarter*3+1), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 3, 0).Add(-time.Second)
	case "current-year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		endDate = time.Date(now.Year(), 12, 31, 23, 59, 59, 0, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)
	}

	// Get all beneficiaries
	beneficiaries, _, err := h.commissionService.GetBeneficiaries("ACTIVE", 1, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get beneficiaries"})
		return
	}

	var reports []gin.H
	for _, beneficiary := range beneficiaries {
		transactions, _, _ := h.commissionService.GetTransactions(beneficiary.ID, "", &startDate, &endDate, 1, 10000)

		var totalCommission, paidCommission, pendingCommission float64
		for _, txn := range transactions {
			totalCommission += txn.CommissionAmount
			if txn.Status == "PAID" {
				paidCommission += txn.CommissionAmount
			} else {
				pendingCommission += txn.CommissionAmount
			}
		}

		if totalCommission > 0 {
			reports = append(reports, gin.H{
				"beneficiaryId":     beneficiary.ID,
				"beneficiaryName":   beneficiary.Name,
				"totalCommission":   totalCommission,
				"paidCommission":    paidCommission,
				"pendingCommission": pendingCommission,
				"transactionCount":  len(transactions),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reports,
		"period":  period,
	})
}

// POST /api/erp/commissions/pay
func (h *CommissionHandler) PayCommission(c *gin.Context) {
	var req struct {
		SalesmanID  string  `json:"salesman_id"`
		Amount      float64 `json:"amount"`
		PaymentMode string  `json:"payment_mode"`
		Notes       string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	paymentID := "comm-pay-" + time.Now().Format("20060102150405")

	err := h.db.Exec(`
		INSERT INTO commission_payments (id, salesman_id, amount, status, payment_date, created_at)
		VALUES (?, ?, ?, 'PAID', NOW(), NOW())
	`, paymentID, req.SalesmanID, req.Amount).Error

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error(), "success": false})
		return
	}

	payment := gin.H{
		"id":           paymentID,
		"salesman_id":  req.SalesmanID,
		"amount":       req.Amount,
		"status":       "paid",
		"payment_mode": req.PaymentMode,
		"paid_at":      time.Now(),
		"notes":        req.Notes,
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    payment,
	})
}

// ==================== Enhanced Commission Tracking Methods ====================

// GetBeneficiaries lists all commission beneficiaries
// GET /api/erp/commission/beneficiaries
func (h *CommissionHandler) GetBeneficiaries(c *gin.Context) {
	status := c.DefaultQuery("status", "ACTIVE")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	beneficiaries, total, err := h.commissionService.GetBeneficiaries(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch beneficiaries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      beneficiaries,
			"total":      total,
			"page":       page,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetTransactions lists commission transactions
// GET /api/erp/commission/transactions
func (h *CommissionHandler) GetTransactions(c *gin.Context) {
	beneficiaryID := c.Query("beneficiary_id")
	status := c.Query("status")

	var dateFrom, dateTo *time.Time
	if df := c.Query("date_from"); df != "" {
		if t, err := time.Parse("2006-01-02", df); err == nil {
			dateFrom = &t
		}
	}
	if dt := c.Query("date_to"); dt != "" {
		if t, err := time.Parse("2006-01-02", dt); err == nil {
			dateTo = &t
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	transactions, total, err := h.commissionService.GetTransactions(beneficiaryID, status, dateFrom, dateTo, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      transactions,
			"total":      total,
			"page":       page,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPayouts lists payout batches
// GET /api/erp/commission/payouts
func (h *CommissionHandler) GetPayouts(c *gin.Context) {
	beneficiaryID := c.Query("beneficiary_id")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	payouts, total, err := h.commissionService.GetPayouts(beneficiaryID, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payouts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items":      payouts,
			"total":      total,
			"page":       page,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// CreatePayoutBatch creates a new payout batch
// POST /api/erp/commission/payouts
func (h *CommissionHandler) CreatePayoutBatch(c *gin.Context) {
	var req struct {
		BeneficiaryID string `json:"beneficiaryId" binding:"required"`
		PeriodStart   string `json:"periodStart" binding:"required"`
		PeriodEnd     string `json:"periodEnd" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	periodStart, err := time.Parse("2006-01-02", req.PeriodStart)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period start date"})
		return
	}

	periodEnd, err := time.Parse("2006-01-02", req.PeriodEnd)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period end date"})
		return
	}

	payout, err := h.commissionService.CreatePayoutBatch(req.BeneficiaryID, periodStart, periodEnd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payout,
		"message": "Payout batch created successfully",
	})
}

// ApprovePayout approves a payout
// POST /api/erp/commission/payouts/:id/approve
func (h *CommissionHandler) ApprovePayout(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		ApprovedBy string `json:"approvedBy" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.commissionService.ApprovePayout(id, req.ApprovedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payout approved successfully",
	})
}

// ProcessPayout marks payout as paid
// POST /api/erp/commission/payouts/:id/process
func (h *CommissionHandler) ProcessPayout(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		PaymentMethod    string `json:"paymentMethod" binding:"required"`
		PaymentReference string `json:"paymentReference" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.commissionService.ProcessPayout(id, req.PaymentMethod, req.PaymentReference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payout processed successfully",
	})
}
