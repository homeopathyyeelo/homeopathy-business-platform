package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LedgerService handles accounting operations
type LedgerService struct {
	db *gorm.DB
}

// NewLedgerService creates a new ledger service
func NewLedgerService(db *gorm.DB) *LedgerService {
	return &LedgerService{db: db}
}

// ===============================
// MODELS
// ===============================

type LedgerAccount struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	AccountCode     string    `json:"accountCode" gorm:"uniqueIndex"`
	AccountName     string    `json:"accountName"`
	AccountType     string    `json:"accountType"`
	ParentAccountID *string   `json:"parentAccountId" gorm:"type:uuid"`
	Description     string    `json:"description"`
	IsActive        bool      `json:"isActive"`
	IsSystemAccount bool      `json:"isSystemAccount"`
	OpeningBalance  float64   `json:"openingBalance"`
	CurrentBalance  float64   `json:"currentBalance"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (LedgerAccount) TableName() string {
	return "ledger_accounts"
}

type JournalEntry struct {
	ID            string             `json:"id" gorm:"type:uuid;primaryKey"`
	EntryNumber   string             `json:"entryNumber" gorm:"uniqueIndex"`
	EntryDate     time.Time          `json:"entryDate" gorm:"type:date"`
	ReferenceType string             `json:"referenceType"`
	ReferenceID   string             `json:"referenceId"`
	Description   string             `json:"description"`
	IsPosted      bool               `json:"isPosted"`
	CreatedBy     string             `json:"createdBy"`
	CreatedAt     time.Time          `json:"createdAt"`
	UpdatedAt     time.Time          `json:"updatedAt"`
	Lines         []JournalEntryLine `json:"lines" gorm:"foreignKey:JournalEntryID"`
}

func (JournalEntry) TableName() string {
	return "journal_entries"
}

type JournalEntryLine struct {
	ID             string         `json:"id" gorm:"type:uuid;primaryKey"`
	JournalEntryID string         `json:"journalEntryId"`
	AccountID      string         `json:"accountId"`
	DebitAmount    float64        `json:"debitAmount"`
	CreditAmount   float64        `json:"creditAmount"`
	Description    string         `json:"description"`
	CreatedAt      time.Time      `json:"createdAt"`
	Account        *LedgerAccount `json:"account" gorm:"foreignKey:AccountID"`
}

func (JournalEntryLine) TableName() string {
	return "journal_entry_lines"
}

// ===============================
// REQUESTS
// ===============================

type CreateJournalEntryRequest struct {
	EntryDate     time.Time              `json:"entryDate" binding:"required"`
	ReferenceType string                 `json:"referenceType"`
	ReferenceID   string                 `json:"referenceId"`
	Description   string                 `json:"description" binding:"required"`
	CreatedBy     string                 `json:"createdBy"`
	Lines         []JournalEntryLineItem `json:"lines" binding:"required,min=2"`
}

type JournalEntryLineItem struct {
	AccountCode  string  `json:"accountCode" binding:"required"`
	DebitAmount  float64 `json:"debitAmount"`
	CreditAmount float64 `json:"creditAmount"`
	Description  string  `json:"description"`
}

// ===============================
// CORE METHODS
// ===============================

// CreateJournalEntry creates a new journal entry with validation
func (s *LedgerService) CreateJournalEntry(req CreateJournalEntryRequest) (*JournalEntry, error) {
	// Validate: Must have at least 2 lines
	if len(req.Lines) < 2 {
		return nil, errors.New("journal entry must have at least 2 lines")
	}

	// Validate: Debits must equal credits
	totalDebits := 0.0
	totalCredits := 0.0
	for _, line := range req.Lines {
		totalDebits += line.DebitAmount
		totalCredits += line.CreditAmount
	}
	if totalDebits != totalCredits {
		return nil, fmt.Errorf("debits (%.2f) must equal credits (%.2f)", totalDebits, totalCredits)
	}

	// Generate entry number
	entryNumber := fmt.Sprintf("JE-%s-%04d", time.Now().Format("200601"), time.Now().Unix()%10000)

	// Begin transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create journal entry
	entry := &JournalEntry{
		ID:            uuid.New().String(),
		EntryNumber:   entryNumber,
		EntryDate:     req.EntryDate,
		ReferenceType: req.ReferenceType,
		ReferenceID:   req.ReferenceID,
		Description:   req.Description,
		IsPosted:      true,
		CreatedBy:     req.CreatedBy,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(entry).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create journal entry: %w", err)
	}

	// Create journal entry lines
	for _, lineReq := range req.Lines {
		// Get account ID from code
		var account LedgerAccount
		if err := tx.Where("account_code = ?", lineReq.AccountCode).First(&account).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("account not found: %s", lineReq.AccountCode)
		}

		line := &JournalEntryLine{
			ID:             uuid.New().String(),
			JournalEntryID: entry.ID,
			AccountID:      account.ID,
			DebitAmount:    lineReq.DebitAmount,
			CreditAmount:   lineReq.CreditAmount,
			Description:    lineReq.Description,
			CreatedAt:      time.Now(),
		}

		if err := tx.Create(line).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create journal entry line: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return entry with lines
	s.db.Preload("Lines.Account").First(entry, "id = ?", entry.ID)
	return entry, nil
}

// GetAccountBalance returns current balance for an account
func (s *LedgerService) GetAccountBalance(accountCode string, asOfDate *time.Time) (float64, error) {
	var account LedgerAccount
	if err := s.db.Where("account_code = ?", accountCode).First(&account).Error; err != nil {
		return 0, fmt.Errorf("account not found: %s", accountCode)
	}

	if asOfDate == nil {
		// Return current balance
		return account.CurrentBalance, nil
	}

	// Calculate balance as of specific date
	var result struct {
		Balance float64
	}

	query := `
		SELECT 
			la.opening_balance + 
			SUM(
				CASE 
					WHEN la.account_type IN ('ASSET', 'EXPENSE') 
					THEN jel.debit_amount - jel.credit_amount
					ELSE jel.credit_amount - jel.debit_amount
				END
			) as balance
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.id = ? AND (je.entry_date IS NULL OR je.entry_date <= ?)
		GROUP BY la.id, la.opening_balance
	`

	if err := s.db.Raw(query, account.ID, asOfDate).Scan(&result).Error; err != nil {
		return 0, err
	}

	return result.Balance, nil
}

// GetGeneralLedger returns ledger entries for an account
func (s *LedgerService) GetGeneralLedger(accountCode string, startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var account LedgerAccount
	if err := s.db.Where("account_code = ?", accountCode).First(&account).Error; err != nil {
		return nil, fmt.Errorf("account not found: %s", accountCode)
	}

	var results []map[string]interface{}
	query := `
		SELECT 
			je.entry_date,
			je.entry_number,
			je.description as entry_description,
			jel.description as line_description,
			jel.debit_amount,
			jel.credit_amount,
			je.reference_type,
			je.reference_id
		FROM journal_entry_lines jel
		JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE jel.account_id = ? 
		  AND je.entry_date >= ? 
		  AND je.entry_date <= ?
		ORDER BY je.entry_date, je.entry_number
	`

	if err := s.db.Raw(query, account.ID, startDate, endDate).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetTrialBalance returns trial balance for all accounts
func (s *LedgerService) GetTrialBalance(asOfDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT 
			la.account_code,
			la.account_name,
			la.account_type,
			la.opening_balance + COALESCE(SUM(
				CASE 
					WHEN la.account_type IN ('ASSET', 'EXPENSE') 
					THEN jel.debit_amount - jel.credit_amount
					ELSE jel.credit_amount - jel.debit_amount
				END
			), 0) as balance,
			COALESCE(SUM(jel.debit_amount), 0) as total_debits,
			COALESCE(SUM(jel.credit_amount), 0) as total_credits
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.entry_date <= ?
		WHERE la.is_active = true
		GROUP BY la.id, la.account_code, la.account_name, la.account_type, la.opening_balance
		HAVING la.opening_balance + COALESCE(SUM(
			CASE 
				WHEN la.account_type IN ('ASSET', 'EXPENSE') 
				THEN jel.debit_amount - jel.credit_amount
				ELSE jel.credit_amount - jel.debit_amount
			END
		), 0) != 0
		ORDER BY la.account_code
	`

	if err := s.db.Raw(query, asOfDate).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetProfitLoss returns profit & loss statement
func (s *LedgerService) GetProfitLoss(startDate, endDate time.Time) (map[string]interface{}, error) {
	// Revenue accounts
	var revenue []map[string]interface{}
	s.db.Raw(`
		SELECT 
			la.account_name,
			COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as amount
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.account_type = 'REVENUE'
		  AND (je.entry_date IS NULL OR (je.entry_date >= ? AND je.entry_date <= ?))
		GROUP BY la.id, la.account_name
		HAVING SUM(jel.credit_amount - jel.debit_amount) != 0
		ORDER BY la.account_code
	`, startDate, endDate).Scan(&revenue)

	// Expense accounts
	var expenses []map[string]interface{}
	s.db.Raw(`
		SELECT 
			la.account_name,
			COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as amount
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.account_type = 'EXPENSE'
		  AND (je.entry_date IS NULL OR (je.entry_date >= ? AND je.entry_date <= ?))
		GROUP BY la.id, la.account_name
		HAVING SUM(jel.debit_amount - jel.credit_amount) != 0
		ORDER BY la.account_code
	`, startDate, endDate).Scan(&expenses)

	// Calculate totals
	totalRevenue := 0.0
	for _, r := range revenue {
		if amt, ok := r["amount"].(float64); ok {
			totalRevenue += amt
		}
	}

	totalExpenses := 0.0
	for _, e := range expenses {
		if amt, ok := e["amount"].(float64); ok {
			totalExpenses += amt
		}
	}

	netProfit := totalRevenue - totalExpenses

	return map[string]interface{}{
		"revenue":       revenue,
		"expenses":      expenses,
		"totalRevenue":  totalRevenue,
		"totalExpenses": totalExpenses,
		"netProfit":     netProfit,
		"startDate":     startDate,
		"endDate":       endDate,
	}, nil
}

// GetBalanceSheet returns balance sheet
func (s *LedgerService) GetBalanceSheet(asOfDate time.Time) (map[string]interface{}, error) {
	// Assets
	var assets []map[string]interface{}
	s.db.Raw(`
		SELECT 
			la.account_name,
			la.opening_balance + COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.account_type = 'ASSET'
		  AND (je.entry_date IS NULL OR je.entry_date <= ?)
		GROUP BY la.id, la.account_name, la.opening_balance
		HAVING la.opening_balance + COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
		ORDER BY la.account_code
	`, asOfDate).Scan(&assets)

	// Liabilities
	var liabilities []map[string]interface{}
	s.db.Raw(`
		SELECT 
			la.account_name,
			la.opening_balance + COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.account_type = 'LIABILITY'
		  AND (je.entry_date IS NULL OR je.entry_date <= ?)
		GROUP BY la.id, la.account_name, la.opening_balance
		HAVING la.opening_balance + COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) != 0
		ORDER BY la.account_code
	`, asOfDate).Scan(&liabilities)

	// Equity
	var equity []map[string]interface{}
	s.db.Raw(`
		SELECT 
			la.account_name,
			la.opening_balance + COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
		FROM ledger_accounts la
		LEFT JOIN journal_entry_lines jel ON la.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
		WHERE la.account_type = 'EQUITY'
		  AND (je.entry_date IS NULL OR je.entry_date <= ?)
		GROUP BY la.id, la.account_name, la.opening_balance
		HAVING la.opening_balance + COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) != 0
		ORDER BY la.account_code
	`, asOfDate).Scan(&equity)

	// Calculate totals
	totalAssets := 0.0
	for _, a := range assets {
		if bal, ok := a["balance"].(float64); ok {
			totalAssets += bal
		}
	}

	totalLiabilities := 0.0
	for _, l := range liabilities {
		if bal, ok := l["balance"].(float64); ok {
			totalLiabilities += bal
		}
	}

	totalEquity := 0.0
	for _, e := range equity {
		if bal, ok := e["balance"].(float64); ok {
			totalEquity += bal
		}
	}

	return map[string]interface{}{
		"assets":           assets,
		"liabilities":      liabilities,
		"equity":           equity,
		"totalAssets":      totalAssets,
		"totalLiabilities": totalLiabilities,
		"totalEquity":      totalEquity,
		"asOfDate":         asOfDate,
	}, nil
}

// GetAllAccounts returns chart of accounts
func (s *LedgerService) GetAllAccounts() ([]LedgerAccount, error) {
	var accounts []LedgerAccount
	if err := s.db.Order("account_code").Find(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}
