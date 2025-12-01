package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// LedgerHandler handles ledger-related requests
type LedgerHandler struct {
	db            *gorm.DB
	ledgerService *services.LedgerService
}

// NewLedgerHandler creates a new ledger handler
func NewLedgerHandler(db *gorm.DB) *LedgerHandler {
	return &LedgerHandler{
		db:            db,
		ledgerService: services.NewLedgerService(db),
	}
}

// GetAccounts returns chart of accounts
// GET /api/erp/ledger/accounts
func (h *LedgerHandler) GetAccounts(c *gin.Context) {
	accounts, err := h.ledgerService.GetAllAccounts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"accounts": accounts,
	})
}

// CreateJournalEntry creates a new journal entry
// POST /api/erp/ledger/journal-entries
func (h *LedgerHandler) CreateJournalEntry(c *gin.Context) {
	var req services.CreateJournalEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Get user from auth context
	req.CreatedBy = "System"

	entry, err := h.ledgerService.CreateJournalEntry(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"entry":   entry,
		"message": "Journal entry created successfully",
	})
}

// GetAccountBalance returns account balance
// GET /api/erp/ledger/accounts/:code/balance
func (h *LedgerHandler) GetAccountBalance(c *gin.Context) {
	accountCode := c.Param("code")
	asOfDateStr := c.Query("asOfDate")

	var asOfDate *time.Time
	if asOfDateStr != "" {
		parsed, err := time.Parse("2006-01-02", asOfDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
		asOfDate = &parsed
	}

	balance, err := h.ledgerService.GetAccountBalance(accountCode, asOfDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"accountCode": accountCode,
		"balance":     balance,
		"asOfDate":    asOfDate,
	})
}

// GetTrialBalance returns trial balance report
// GET /api/erp/ledger/trial-balance?asOfDate=2025-01-31
func (h *LedgerHandler) GetTrialBalance(c *gin.Context) {
	asOfDateStr := c.DefaultQuery("asOfDate", time.Now().Format("2006-01-02"))
	asOfDate, err := time.Parse("2006-01-02", asOfDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	trialBalance, err := h.ledgerService.GetTrialBalance(asOfDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"trialBalance": trialBalance,
		"asOfDate":     asOfDate,
	})
}

// GetProfitLoss returns P&L statement
// GET /api/erp/ledger/profit-loss?startDate=2025-01-01&endDate=2025-01-31
func (h *LedgerHandler) GetProfitLoss(c *gin.Context) {
	startDateStr := c.DefaultQuery("startDate", time.Now().AddDate(0, 0, -30).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("endDate", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	report, err := h.ledgerService.GetProfitLoss(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report":  report,
	})
}

// GetBalanceSheet returns balance sheet
// GET /api/erp/ledger/balance-sheet?asOfDate=2025-01-31
func (h *LedgerHandler) GetBalanceSheet(c *gin.Context) {
	asOfDateStr := c.DefaultQuery("asOfDate", time.Now().Format("2006-01-02"))
	asOfDate, err := time.Parse("2006-01-02", asOfDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	report, err := h.ledgerService.GetBalanceSheet(asOfDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report":  report,
	})
}

// GetGeneralLedger returns general ledger for an account
// GET /api/erp/ledger/general-ledger/:code?startDate=2025-01-01&endDate=2025-01-31
func (h *LedgerHandler) GetGeneralLedger(c *gin.Context) {
	accountCode := c.Param("code")
	startDateStr := c.DefaultQuery("startDate", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("endDate", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	entries, err := h.ledgerService.GetGeneralLedger(accountCode, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"accountCode": accountCode,
		"entries":     entries,
		"startDate":   startDate,
		"endDate":     endDate,
	})
}
