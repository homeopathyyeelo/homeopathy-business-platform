package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FinanceHandler struct {
	DB *gorm.DB
}

func NewFinanceHandler(db *gorm.DB) *FinanceHandler {
	return &FinanceHandler{DB: db}
}

type Ledger struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	Name          string    `json:"name"`
	Type          string    `json:"type"` // asset, liability, income, expense
	OpeningBalance float64  `json:"opening_balance"`
	CurrentBalance float64  `json:"current_balance"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}

type JournalEntry struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	EntryNumber string    `json:"entry_number"`
	EntryDate   time.Time `json:"entry_date"`
	Description string    `json:"description"`
	TotalDebit  float64   `json:"total_debit"`
	TotalCredit float64   `json:"total_credit"`
	Status      string    `json:"status"`
	CreatedBy   uint      `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

type LedgerTransaction struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	LedgerID        uint      `json:"ledger_id"`
	JournalEntryID  uint      `json:"journal_entry_id"`
	TransactionType string    `json:"transaction_type"` // debit, credit
	Amount          float64   `json:"amount"`
	Description     string    `json:"description"`
	ReferenceType   string    `json:"reference_type"` // sale, purchase, payment, etc
	ReferenceID     uint      `json:"reference_id"`
	CreatedAt       time.Time `json:"created_at"`
}

type GSTReport struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	Month         int       `json:"month"`
	Year          int       `json:"year"`
	TotalSales    float64   `json:"total_sales"`
	TotalPurchase float64   `json:"total_purchase"`
	CGST          float64   `json:"cgst"`
	SGST          float64   `json:"sgst"`
	IGST          float64   `json:"igst"`
	TaxPayable    float64   `json:"tax_payable"`
	TaxPaid       float64   `json:"tax_paid"`
	Status        string    `json:"status"`
	FiledDate     *time.Time `json:"filed_date"`
	CreatedAt     time.Time `json:"created_at"`
}

// Ledgers
func (h *FinanceHandler) GetLedgers(c *gin.Context) {
	var ledgers []Ledger
	h.DB.Where("is_active = ?", true).Find(&ledgers)
	c.JSON(http.StatusOK, gin.H{"success": true, "ledgers": ledgers})
}

func (h *FinanceHandler) CreateLedger(c *gin.Context) {
	var ledger Ledger
	if err := c.ShouldBindJSON(&ledger); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ledger.CurrentBalance = ledger.OpeningBalance
	ledger.IsActive = true
	if err := h.DB.Create(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "ledger": ledger})
}

// Journal Entries
func (h *FinanceHandler) GetJournalEntries(c *gin.Context) {
	var entries []JournalEntry
	h.DB.Order("entry_date DESC").Limit(100).Find(&entries)
	c.JSON(http.StatusOK, gin.H{"success": true, "entries": entries})
}

func (h *FinanceHandler) CreateJournalEntry(c *gin.Context) {
	var entry JournalEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	entry.EntryNumber = generateEntryNumber()
	entry.Status = "posted"
	if err := h.DB.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "entry": entry})
}

// GST Reports
func (h *FinanceHandler) GetGSTReports(c *gin.Context) {
	var reports []GSTReport
	h.DB.Order("year DESC, month DESC").Find(&reports)
	c.JSON(http.StatusOK, gin.H{"success": true, "reports": reports})
}

func (h *FinanceHandler) GenerateGSTReport(c *gin.Context) {
	var req struct {
		Month int `json:"month" binding:"required"`
		Year  int `json:"year" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate GST from sales and purchases
	var totalSales, totalPurchase float64
	h.DB.Table("sales").
		Where("EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?", req.Month, req.Year).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalSales)
		
	h.DB.Table("purchases").
		Where("EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?", req.Month, req.Year).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalPurchase)

	cgst := (totalSales * 0.09) - (totalPurchase * 0.09)
	sgst := (totalSales * 0.09) - (totalPurchase * 0.09)
	
	report := GSTReport{
		Month:         req.Month,
		Year:          req.Year,
		TotalSales:    totalSales,
		TotalPurchase: totalPurchase,
		CGST:          cgst,
		SGST:          sgst,
		TaxPayable:    cgst + sgst,
		Status:        "draft",
	}
	
	h.DB.Create(&report)
	c.JSON(http.StatusOK, gin.H{"success": true, "report": report})
}

// Profit & Loss
func (h *FinanceHandler) GetProfitLoss(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var totalRevenue, totalCost, totalExpenses float64
	
	h.DB.Table("sales").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)
		
	h.DB.Table("purchases").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalCost)
		
	h.DB.Table("expenses").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalExpenses)

	grossProfit := totalRevenue - totalCost
	netProfit := grossProfit - totalExpenses

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report": gin.H{
			"total_revenue":  totalRevenue,
			"total_cost":     totalCost,
			"gross_profit":   grossProfit,
			"total_expenses": totalExpenses,
			"net_profit":     netProfit,
			"profit_margin":  (netProfit / totalRevenue) * 100,
		},
	})
}

// Balance Sheet
func (h *FinanceHandler) GetBalanceSheet(c *gin.Context) {
	var totalAssets, totalLiabilities, totalEquity float64
	
	h.DB.Table("ledgers").Where("type = ?", "asset").Select("COALESCE(SUM(current_balance), 0)").Scan(&totalAssets)
	h.DB.Table("ledgers").Where("type = ?", "liability").Select("COALESCE(SUM(current_balance), 0)").Scan(&totalLiabilities)
	h.DB.Table("ledgers").Where("type = ?", "equity").Select("COALESCE(SUM(current_balance), 0)").Scan(&totalEquity)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"balance_sheet": gin.H{
			"assets":      totalAssets,
			"liabilities": totalLiabilities,
			"equity":      totalEquity,
			"balance":     totalAssets - (totalLiabilities + totalEquity),
		},
	})
}

func generateEntryNumber() string {
	return "JE" + time.Now().Format("20060102150405")
}
