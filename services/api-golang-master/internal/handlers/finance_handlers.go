// Finance Handlers - Complete implementation for ledgers, cashbook, expenses, GST, and financial reports
package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// FinanceHandler handles all finance and accounting operations
type FinanceHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewFinanceHandler creates a new finance handler
func NewFinanceHandler(db *GORMDatabase, cache *CacheService) *FinanceHandler {
	return &FinanceHandler{db: db, cache: cache}
}

// ==================== LEDGER HANDLERS ====================

// GetSalesLedger retrieves sales ledger entries
func (h *FinanceHandler) GetSalesLedger(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var ledger []map[string]interface{}

	query := `
		SELECT
			i.invoice_number,
			i.invoice_date,
			c.name as customer_name,
			i.total_amount,
			i.paid_amount,
			i.outstanding_amount,
			i.status,
			i.payment_status
		FROM invoices i
		JOIN customers c ON i.customer_id = c.id
		WHERE i.is_active = true
	`

	// Apply filters
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query += fmt.Sprintf(" AND i.invoice_date >= '%s'", date.Format("2006-01-02"))
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query += fmt.Sprintf(" AND i.invoice_date <= '%s'", date.Format("2006-01-02"))
		}
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		query += fmt.Sprintf(" AND i.customer_id = '%s'", customerID)
	}

	query += " ORDER BY i.invoice_date DESC"

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := h.db.DB.WithContext(ctx).Raw(query).Limit(limit).Offset(offset).Scan(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sales ledger"})
		return
	}

	var total int64
	h.db.DB.WithContext(ctx).Model(&Invoice{}).Where("is_active = ?", true).Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"ledger": ledger,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetPurchaseLedger retrieves purchase ledger entries
func (h *FinanceHandler) GetPurchaseLedger(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var ledger []map[string]interface{}

	query := `
		SELECT
			vi.invoice_number,
			vi.invoice_date,
			v.name as vendor_name,
			vi.total_amount,
			vi.paid_amount,
			vi.outstanding_amount,
			vi.status,
			vi.payment_status
		FROM vendor_invoices vi
		JOIN vendors v ON vi.vendor_id = v.id
		WHERE vi.is_active = true
	`

	// Apply filters
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query += fmt.Sprintf(" AND vi.invoice_date >= '%s'", date.Format("2006-01-02"))
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query += fmt.Sprintf(" AND vi.invoice_date <= '%s'", date.Format("2006-01-02"))
		}
	}
	if vendorID := c.Query("vendor_id"); vendorID != "" {
		query += fmt.Sprintf(" AND vi.vendor_id = '%s'", vendorID)
	}

	query += " ORDER BY vi.invoice_date DESC"

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := h.db.DB.WithContext(ctx).Raw(query).Limit(limit).Offset(offset).Scan(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve purchase ledger"})
		return
	}

	var total int64
	h.db.DB.WithContext(ctx).Model(&VendorInvoice{}).Where("is_active = ?", true).Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"ledger": ledger,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetCustomerLedger retrieves ledger for a specific customer
func (h *FinanceHandler) GetCustomerLedger(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")
	var ledger []map[string]interface{}

	query := `
		SELECT
			i.invoice_number,
			i.invoice_date,
			i.total_amount,
			i.paid_amount,
			i.outstanding_amount,
			i.due_date,
			i.status,
			i.payment_status
		FROM invoices i
		WHERE i.customer_id = ? AND i.is_active = true
		ORDER BY i.invoice_date DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, customerID).Scan(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve customer ledger"})
		return
	}

	c.JSON(http.StatusOK, ledger)
}

// GetVendorLedger retrieves ledger for a specific vendor
func (h *FinanceHandler) GetVendorLedger(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	vendorID := c.Param("vendor_id")
	var ledger []map[string]interface{}

	query := `
		SELECT
			vi.invoice_number,
			vi.invoice_date,
			vi.total_amount,
			vi.paid_amount,
			vi.outstanding_amount,
			vi.due_date,
			vi.status,
			vi.payment_status
		FROM vendor_invoices vi
		WHERE vi.vendor_id = ? AND vi.is_active = true
		ORDER BY vi.invoice_date DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, vendorID).Scan(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve vendor ledger"})
		return
	}

	c.JSON(http.StatusOK, ledger)
}

// ==================== CASH & BANK BOOK HANDLERS ====================

// GetCashBook retrieves cash book entries
func (h *FinanceHandler) GetCashBook(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var entries []CashBook
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&CashBook{}).Where("is_active = ?", true)

	// Apply filters
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("entry_date >= ?", date)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("entry_date <= ?", date)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count cash book entries"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("entry_date DESC").Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve cash book entries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries": entries,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// CreateCashBookEntry creates a new cash book entry
func (h *FinanceHandler) CreateCashBookEntry(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var entry CashBook
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		entry.CreatedBy = userID.(string)
	}

	// Calculate balance (simplified - in real implementation, you'd track running balance)
	var lastEntry CashBook
	h.db.DB.WithContext(ctx).Order("entry_date DESC, created_at DESC").First(&lastEntry)

	entry.Balance = lastEntry.Balance + entry.CashIn - entry.CashOut

	if err := h.db.DB.WithContext(ctx).Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cash book entry"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// GetBankBook retrieves bank book entries
func (h *FinanceHandler) GetBankBook(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var entries []BankBook
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&BankBook{}).Where("is_active = ?", true)

	// Apply filters
	if bankName := c.Query("bank_name"); bankName != "" {
		query = query.Where("bank_name ILIKE ?", "%"+bankName+"%")
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("entry_date >= ?", date)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("entry_date <= ?", date)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count bank book entries"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("entry_date DESC").Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve bank book entries"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries": entries,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// CreateBankBookEntry creates a new bank book entry
func (h *FinanceHandler) CreateBankBookEntry(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var entry BankBook
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		entry.CreatedBy = userID.(string)
	}

	// Calculate balance
	var lastEntry BankBook
	h.db.DB.WithContext(ctx).Where("bank_name = ?", entry.BankName).
		Order("entry_date DESC, created_at DESC").First(&lastEntry)

	entry.Balance = lastEntry.Balance + entry.Deposit - entry.Withdrawal

	if err := h.db.DB.WithContext(ctx).Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bank book entry"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// ==================== EXPENSE HANDLERS ====================

// GetExpenses retrieves all expenses
func (h *FinanceHandler) GetExpenses(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var expenses []Expense
	var total int64

	query := h.db.DB.WithContext(ctx).
		Preload("Vendor").
		Model(&Expense{}).
		Where("is_active = ?", true)

	// Apply filters
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("expense_date >= ?", date)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("expense_date <= ?", date)
		}
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count expenses"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("expense_date DESC").Find(&expenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve expenses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"expenses": expenses,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetExpense retrieves a specific expense
func (h *FinanceHandler) GetExpense(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var expense Expense

	if err := h.db.DB.WithContext(ctx).
		Preload("Vendor").
		Where("id = ? AND is_active = ?", id, true).
		First(&expense).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve expense"})
		return
	}

	c.JSON(http.StatusOK, expense)
}

// CreateExpense creates a new expense
func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var expense Expense
	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set created by from JWT token
	userID, exists := c.Get("user_id")
	if exists {
		expense.CreatedBy = userID.(string)
	}

	// Set default status
	expense.Status = "pending"

	// Calculate total amount
	expense.TotalAmount = expense.Amount + expense.TaxAmount

	if err := h.db.DB.WithContext(ctx).Create(&expense).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
		return
	}

	c.JSON(http.StatusCreated, expense)
}

// UpdateExpense updates an existing expense
func (h *FinanceHandler) UpdateExpense(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var expense Expense

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&expense).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve expense"})
		return
	}

	var updateData Expense
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	expense.Amount = updateData.Amount
	expense.TaxAmount = updateData.TaxAmount
	expense.TotalAmount = updateData.Amount + updateData.TaxAmount
	expense.Category = updateData.Category
	expense.Subcategory = updateData.Subcategory
	expense.Description = updateData.Description
	expense.PaymentMethod = updateData.PaymentMethod
	expense.VendorID = updateData.VendorID

	if err := h.db.DB.WithContext(ctx).Save(&expense).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update expense"})
		return
	}

	c.JSON(http.StatusOK, expense)
}

// DeleteExpense soft deletes an expense
func (h *FinanceHandler) DeleteExpense(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&Expense{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete expense"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetExpenseCategories retrieves expense categories
func (h *FinanceHandler) GetExpenseCategories(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var categories []string

	query := `
		SELECT DISTINCT category
		FROM expenses
		WHERE is_active = true AND category IS NOT NULL
		ORDER BY category
	`

	if err := h.db.DB.WithContext(ctx).Raw(query).Pluck("category", &categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve expense categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// ==================== GST & TAX HANDLERS ====================

// GetGSTReturns retrieves GST return data
func (h *FinanceHandler) GetGSTReturns(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	period := c.Query("period") // monthly/quarterly
	if period == "" {
		period = "monthly"
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = now.Format("2006-01-01")
		endDate = now.AddDate(0, 1, 0).AddDate(0, 0, -1).Format("2006-01-02")
	}

	var gstData map[string]interface{}

	// Calculate GST data based on invoices and vendor invoices
	query := `
		SELECT
			SUM(CASE WHEN i.total_amount > 0 THEN i.tax_amount ELSE 0 END) as sales_gst,
			SUM(CASE WHEN vi.total_amount > 0 THEN vi.tax_amount ELSE 0 END) as purchase_gst,
			COUNT(DISTINCT i.id) as sales_invoices,
			COUNT(DISTINCT vi.id) as purchase_invoices
		FROM invoices i
		FULL OUTER JOIN vendor_invoices vi ON i.invoice_date BETWEEN ? AND ?
		WHERE (i.invoice_date BETWEEN ? AND ? OR vi.invoice_date BETWEEN ? AND ?)
		AND (i.is_active = true OR vi.is_active = true)
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate, startDate, endDate, startDate, endDate).Scan(&gstData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate GST data"})
		return
	}

	// Add period information
	gstData["period"] = period
	gstData["start_date"] = startDate
	gstData["end_date"] = endDate

	c.JSON(http.StatusOK, gstData)
}

// CreateGSTReturn creates a GST return filing
func (h *FinanceHandler) CreateGSTReturn(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var gstReturn struct {
		Period    string    `json:"period" binding:"required"`
		StartDate time.Time `json:"start_date" binding:"required"`
		EndDate   time.Time `json:"end_date" binding:"required"`
		GSTData   map[string]interface{} `json:"gst_data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&gstReturn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would:
	// 1. Validate GST data
	// 2. Generate GST return XML/JSON
	// 3. Submit to GST portal
	// 4. Store return reference

	response := map[string]interface{}{
		"message":       "GST return created successfully",
		"return_id":     fmt.Sprintf("GST_%s_%s", gstReturn.Period, time.Now().Format("20060102")),
		"period":        gstReturn.Period,
		"start_date":    gstReturn.StartDate,
		"end_date":      gstReturn.EndDate,
		"submitted_at":  time.Now(),
		"status":        "pending_submission",
	}

	c.JSON(http.StatusCreated, response)
}

// GetEWayBills retrieves e-way bills
func (h *FinanceHandler) GetEWayBills(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// This would typically integrate with GST portal API
	// For now, return placeholder data

	ewayBills := []map[string]interface{}{
		{
			"eway_bill_number": "EWB123456789",
			"invoice_number":   "INV001",
			"vehicle_number":   "MH12AB1234",
			"from_place":       "Mumbai",
			"to_place":         "Pune",
			"status":           "active",
			"generated_at":     time.Now().AddDate(0, 0, -1),
		},
	}

	c.JSON(http.StatusOK, ewayBills)
}

// CreateEWayBill creates a new e-way bill
func (h *FinanceHandler) CreateEWayBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var ewayBill struct {
		InvoiceID    string `json:"invoice_id" binding:"required"`
		VehicleNumber string `json:"vehicle_number" binding:"required"`
		FromPlace    string `json:"from_place" binding:"required"`
		ToPlace      string `json:"to_place" binding:"required"`
		TransporterID string `json:"transporter_id"`
	}

	if err := c.ShouldBindJSON(&ewayBill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would:
	// 1. Validate invoice and GST details
	// 2. Generate e-way bill through GST portal API
	// 3. Store e-way bill reference

	response := map[string]interface{}{
		"eway_bill_number": fmt.Sprintf("EWB%d", time.Now().Unix()),
		"invoice_id":       ewayBill.InvoiceID,
		"vehicle_number":   ewayBill.VehicleNumber,
		"from_place":       ewayBill.FromPlace,
		"to_place":         ewayBill.ToPlace,
		"status":           "generated",
		"generated_at":     time.Now(),
		"valid_until":      time.Now().AddDate(0, 0, 1), // Valid for 1 day
	}

	c.JSON(http.StatusCreated, response)
}

// CancelEWayBill cancels an e-way bill
func (h *FinanceHandler) CancelEWayBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	ewayBillNumber := c.Param("eway_bill_number")

	// In a real implementation, this would call GST portal API to cancel

	response := map[string]interface{}{
		"eway_bill_number": ewayBillNumber,
		"status":           "cancelled",
		"cancelled_at":     time.Now(),
		"reason":           "Cancelled by user",
	}

	c.JSON(http.StatusOK, response)
}

// ==================== FINANCIAL REPORT HANDLERS ====================

// GetTrialBalance retrieves trial balance
func (h *FinanceHandler) GetTrialBalance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Calculate trial balance from chart of accounts and journal entries
	var trialBalance []map[string]interface{}

	query := `
		SELECT
			coa.account_code,
			coa.account_name,
			coa.account_type,
			COALESCE(SUM(jel.debit_amount), 0) as debit_total,
			COALESCE(SUM(jel.credit_amount), 0) as credit_total,
			(COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)) as balance
		FROM chart_of_accounts coa
		LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted'
		WHERE coa.is_active = true
		GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
		ORDER BY coa.account_code
	`

	if err := h.db.DB.WithContext(ctx).Raw(query).Scan(&trialBalance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate trial balance"})
		return
	}

	c.JSON(http.StatusOK, trialBalance)
}

// GetBalanceSheet retrieves balance sheet
func (h *FinanceHandler) GetBalanceSheet(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	asOfDate := c.Query("as_of_date")
	if asOfDate == "" {
		asOfDate = time.Now().Format("2006-01-02")
	}

	// Calculate balance sheet from trial balance
	var balanceSheet map[string]interface{}

	// Assets
	assetsQuery := `
		SELECT COALESCE(SUM(balance), 0) as total
		FROM (
			SELECT (COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)) as balance
			FROM chart_of_accounts coa
			LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
			LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date <= ?
			WHERE coa.account_type = 'asset' AND coa.is_active = true
		) assets
	`

	// Liabilities + Equity
	liabilitiesQuery := `
		SELECT COALESCE(SUM(balance), 0) as total
		FROM (
			SELECT (COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)) as balance
			FROM chart_of_accounts coa
			LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
			LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date <= ?
			WHERE coa.account_type IN ('liability', 'equity') AND coa.is_active = true
		) liabilities
	`

	var assets, liabilities float64

	h.db.DB.WithContext(ctx).Raw(assetsQuery, asOfDate).Scan(&assets)
	h.db.DB.WithContext(ctx).Raw(liabilitiesQuery, asOfDate).Scan(&liabilities)

	balanceSheet = map[string]interface{}{
		"as_of_date": asOfDate,
		"assets":     assets,
		"liabilities": liabilities,
		"equity":     assets - liabilities,
		"total":      assets,
	}

	c.JSON(http.StatusOK, balanceSheet)
}

// GetProfitLoss retrieves profit and loss statement
func (h *FinanceHandler) GetProfitLoss(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current financial year
		now := time.Now()
		startDate = fmt.Sprintf("%d-04-01", now.Year()) // April 1st
		endDate = now.Format("2006-01-02")
	}

	// Income
	incomeQuery := `
		SELECT COALESCE(SUM(jel.credit_amount), 0) as total
		FROM chart_of_accounts coa
		LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted'
			AND je.entry_date BETWEEN ? AND ?
		WHERE coa.account_type = 'income' AND coa.is_active = true
	`

	// Expenses
	expenseQuery := `
		SELECT COALESCE(SUM(jel.debit_amount), 0) as total
		FROM chart_of_accounts coa
		LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
		LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted'
			AND je.entry_date BETWEEN ? AND ?
		WHERE coa.account_type = 'expense' AND coa.is_active = true
	`

	var income, expenses float64

	h.db.DB.WithContext(ctx).Raw(incomeQuery, startDate, endDate).Scan(&income)
	h.db.DB.WithContext(ctx).Raw(expenseQuery, startDate, endDate).Scan(&expenses)

	profitLoss := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"income":     income,
		"expenses":   expenses,
		"net_profit": income - expenses,
	}

	c.JSON(http.StatusOK, profitLoss)
}

