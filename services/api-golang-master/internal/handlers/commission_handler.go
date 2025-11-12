package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CommissionHandler struct {
	db *gorm.DB
}

type CommissionRule struct {
	ID          string    `json:"id"`
	SalesmanID  string    `json:"salesman_id"`
	RuleType    string    `json:"rule_type"` // percentage, fixed, tiered
	Percentage  float64   `json:"percentage"`
	FixedAmount float64   `json:"fixed_amount"`
	MinAmount   float64   `json:"min_amount"`
	MaxAmount   float64   `json:"max_amount"`
	ProductCategory string `json:"product_category"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
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
	return &CommissionHandler{db: db}
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
		"data": req,
	})
}

// GET /api/erp/commissions/calculate
func (h *CommissionHandler) CalculateCommission(c *gin.Context) {
	salesmanID := c.Query("salesman_id")
	fromDate := c.Query("from_date")
	toDate := c.Query("to_date")
	
	// Mock calculation - replace with DB query
	report := CommissionReport{
		SalesmanID:   salesmanID,
		SalesmanName: "Rajesh Kumar",
		TotalSales:   125000,
		Commission:   6250,  // 5% of sales
		Paid:         3000,
		Pending:      3250,
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": report,
		"period": gin.H{
			"from": fromDate,
			"to": toDate,
		},
	})
}

// GET /api/erp/commissions/report
func (h *CommissionHandler) GetCommissionReport(c *gin.Context) {
	period := c.DefaultQuery("period", "current-month")
	
	reports := []CommissionReport{
		{
			SalesmanID:   "emp-001",
			SalesmanName: "Rajesh Kumar",
			TotalSales:   125000,
			Commission:   6250,
			Paid:         3000,
			Pending:      3250,
		},
		{
			SalesmanID:   "emp-002",
			SalesmanName: "Amit Sharma",
			TotalSales:   98000,
			Commission:   4900,
			Paid:         4900,
			Pending:      0,
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": reports,
		"period": period,
	})
}

// POST /api/erp/commissions/pay
func (h *CommissionHandler) PayCommission(c *gin.Context) {
	var req struct {
		SalesmanID string  `json:"salesman_id"`
		Amount     float64 `json:"amount"`
		PaymentMode string `json:"payment_mode"`
		Notes      string  `json:"notes"`
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
		"id": paymentID,
		"salesman_id": req.SalesmanID,
		"amount": req.Amount,
		"status": "paid",
		"payment_mode": req.PaymentMode,
		"paid_at": time.Now(),
		"notes": req.Notes,
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": payment,
	})
}
