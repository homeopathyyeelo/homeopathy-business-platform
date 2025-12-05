package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentService handles payment tracking operations
type PaymentService struct {
	db *gorm.DB
}

// NewPaymentService creates a new payment service
func NewPaymentService(db *gorm.DB) *PaymentService {
	return &PaymentService{db: db}
}

// Payment represents a payment record with ERP sync tracking
type Payment struct {
	ID                  string     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PaymentNumber       string     `json:"paymentNumber" gorm:"column:payment_number;unique;not null"`
	InvoiceID           *string    `json:"invoiceId" gorm:"column:invoice_id"`
	CustomerID          *string    `json:"customerId" gorm:"column:customer_id"`
	PaymentDate         time.Time  `json:"paymentDate" gorm:"column:payment_date;default:now()"`
	PaymentMethod       string     `json:"paymentMethod" gorm:"column:payment_method"`
	Amount              float64    `json:"amount" gorm:"column:amount;not null"`
	TransactionRefNo    string     `json:"transactionRefNo" gorm:"column:transaction_ref_no"`
	ChequeNumber        string     `json:"chequeNumber" gorm:"column:cheque_number"`
	ChequeBankName      string     `json:"chequeBankName" gorm:"column:cheque_bank_name"`
	ChequeDate          *time.Time `json:"chequeDate" gorm:"column:cheque_date"`
	ChequeStatus        string     `json:"chequeStatus" gorm:"column:cheque_status"`
	ChequeDepositDate   *time.Time `json:"chequeDepositDate" gorm:"column:cheque_deposit_date"`
	ChequeClearanceDate *time.Time `json:"chequeClearanceDate" gorm:"column:cheque_clearance_date"`
	ChequeBounceReason  string     `json:"chequeBounceReason" gorm:"column:cheque_bounce_reason"`
	UPIId               string     `json:"upiId" gorm:"column:upi_id"`
	CardLast4Digits     string     `json:"cardLast4Digits" gorm:"column:card_last_4_digits"`
	CardApprovalCode    string     `json:"cardApprovalCode" gorm:"column:card_approval_code"`
	BankRefNumber       string     `json:"bankRefNumber" gorm:"column:bank_ref_number"`
	PaymentType         string     `json:"paymentType" gorm:"column:payment_type;default:'REGULAR'"`
	MDRPercent          float64    `json:"mdrPercent" gorm:"column:mdr_percent;default:0"`
	MDRAmount           float64    `json:"mdrAmount" gorm:"column:mdr_amount;default:0"`
	Status              string     `json:"status" gorm:"column:status;default:'ACTIVE'"`
	// ERP Sync Fields
	ERPSyncStatus      string     `json:"erpSyncStatus" gorm:"column:erp_sync_status;default:'PENDING'"`
	ERPSyncAttempts    int        `json:"erpSyncAttempts" gorm:"column:erp_sync_attempts;default:0"`
	ERPSyncLastAttempt *time.Time `json:"erpSyncLastAttempt" gorm:"column:erp_sync_last_attempt"`
	ERPSyncError       string     `json:"erpSyncError" gorm:"column:erp_sync_error"`
	ERPReferenceID     string     `json:"erpReferenceId" gorm:"column:erp_reference_id"`
	// Reconciliation Fields
	Reconciled          bool       `json:"reconciled" gorm:"column:reconciled;default:false"`
	ReconciliationDate  *time.Time `json:"reconciliationDate" gorm:"column:reconciliation_date"`
	ReconciliationNotes string     `json:"reconciliationNotes" gorm:"column:reconciliation_notes"`
	// Audit Fields
	Notes             string    `json:"notes" gorm:"column:notes"`
	ProofFileURL      string    `json:"proofFileUrl" gorm:"column:proof_file_url"`
	ReversalPaymentID *string   `json:"reversalPaymentId" gorm:"column:reversal_payment_id"`
	ReversalReason    string    `json:"reversalReason" gorm:"column:reversal_reason"`
	CreatedBy         string    `json:"createdBy" gorm:"column:created_by"`
	UpdatedBy         string    `json:"updatedBy" gorm:"column:updated_by"`
	CreatedAt         time.Time `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt         time.Time `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (Payment) TableName() string {
	return "payments"
}

// PaymentAllocation represents payment allocation to invoices
type PaymentAllocation struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PaymentID       string    `json:"paymentId" gorm:"column:payment_id;not null"`
	InvoiceID       string    `json:"invoiceId" gorm:"column:invoice_id;not null"`
	AllocatedAmount float64   `json:"allocatedAmount" gorm:"column:allocated_amount;not null"`
	CreatedAt       time.Time `json:"createdAt" gorm:"column:created_at;default:now()"`
}

// TableName specifies the table name
func (PaymentAllocation) TableName() string {
	return "payment_allocations"
}

// CustomerCredit represents store credit
type CustomerCredit struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreditNumber   string     `json:"creditNumber" gorm:"column:credit_number;unique;not null"`
	CustomerID     string     `json:"customerId" gorm:"column:customer_id;not null"`
	SourceType     string     `json:"sourceType" gorm:"column:source_type"`
	SourceID       *string    `json:"sourceId" gorm:"column:source_id"`
	OriginalAmount float64    `json:"originalAmount" gorm:"column:original_amount;not null"`
	BalanceAmount  float64    `json:"balanceAmount" gorm:"column:balance_amount;not null"`
	ExpiryDate     *time.Time `json:"expiryDate" gorm:"column:expiry_date"`
	Status         string     `json:"status" gorm:"column:status;default:'ACTIVE'"`
	UsedAt         *time.Time `json:"usedAt" gorm:"column:used_at"`
	UsedInvoiceID  *string    `json:"usedInvoiceId" gorm:"column:used_invoice_id"`
	CreatedAt      time.Time  `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt      time.Time  `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (CustomerCredit) TableName() string {
	return "customer_credits"
}

// RecordPaymentRequest represents payment recording request
type RecordPaymentRequest struct {
	InvoiceID        *string             `json:"invoiceId"`
	CustomerID       *string             `json:"customerId"`
	PaymentMethod    string              `json:"paymentMethod" binding:"required"`
	Amount           float64             `json:"amount" binding:"required"`
	TransactionRefNo string              `json:"transactionRefNo"`
	ChequeNumber     string              `json:"chequeNumber"`
	ChequeBankName   string              `json:"chequeBankName"`
	ChequeDate       *time.Time          `json:"chequeDate"`
	UPIId            string              `json:"upiId"`
	CardLast4Digits  string              `json:"cardLast4Digits"`
	CardApprovalCode string              `json:"cardApprovalCode"`
	BankRefNumber    string              `json:"bankRefNumber"`
	MDRPercent       float64             `json:"mdrPercent"`
	PaymentType      string              `json:"paymentType"`
	Notes            string              `json:"notes"`
	ProofFileURL     string              `json:"proofFileUrl"`
	Allocations      []AllocationRequest `json:"allocations"`
	CreatedBy        string              `json:"createdBy"`
}

// AllocationRequest represents payment allocation request
type AllocationRequest struct {
	InvoiceID       string  `json:"invoiceId" binding:"required"`
	AllocatedAmount float64 `json:"allocatedAmount" binding:"required"`
}

// RecordPayment records a new payment with validation and ERP sync tracking
func (s *PaymentService) RecordPayment(req RecordPaymentRequest) (*Payment, error) {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Must have invoice reference
	if req.InvoiceID == nil || *req.InvoiceID == "" {
		tx.Rollback()
		return nil, fmt.Errorf("payment must have valid invoice reference")
	}

	// Validate amount
	if req.Amount <= 0 {
		tx.Rollback()
		return nil, fmt.Errorf("payment amount must be greater than zero")
	}

	// Check for duplicate payment
	if req.TransactionRefNo != "" {
		isDuplicate, err := s.CheckPaymentDuplicate(req.PaymentMethod, req.TransactionRefNo)
		if err == nil && isDuplicate {
			tx.Rollback()
			return nil, fmt.Errorf("duplicate payment detected: transaction %s already exists", req.TransactionRefNo)
		}
	}

	// Validate transaction reference based on payment method
	if req.PaymentMethod == "UPI" && req.UPIId == "" && req.TransactionRefNo == "" {
		tx.Rollback()
		return nil, fmt.Errorf("UPI ID or transaction reference is required for UPI payments")
	}
	if req.PaymentMethod == "CARD" && req.CardLast4Digits == "" {
		tx.Rollback()
		return nil, fmt.Errorf("card last 4 digits required for card payments")
	}
	if req.PaymentMethod == "CHEQUE" && req.ChequeNumber == "" {
		tx.Rollback()
		return nil, fmt.Errorf("cheque number is required for cheque payments")
	}

	// Generate payment number
	paymentNumber := fmt.Sprintf("PAY-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

	// Calculate MDR if applicable
	mdrAmount := 0.0
	if req.MDRPercent > 0 {
		mdrAmount = req.Amount * req.MDRPercent / 100
	}

	// Determine cheque status
	chequeStatus := ""
	if req.PaymentMethod == "CHEQUE" {
		chequeStatus = "RECEIVED"
	}

	// Create payment with ERP sync tracking
	payment := &Payment{
		PaymentNumber:    paymentNumber,
		InvoiceID:        req.InvoiceID,
		CustomerID:       req.CustomerID,
		PaymentDate:      time.Now(),
		PaymentMethod:    req.PaymentMethod,
		Amount:           req.Amount,
		TransactionRefNo: req.TransactionRefNo,
		ChequeNumber:     req.ChequeNumber,
		ChequeBankName:   req.ChequeBankName,
		ChequeDate:       req.ChequeDate,
		ChequeStatus:     chequeStatus,
		UPIId:            req.UPIId,
		CardLast4Digits:  req.CardLast4Digits,
		CardApprovalCode: req.CardApprovalCode,
		BankRefNumber:    req.BankRefNumber,
		PaymentType:      req.PaymentType,
		MDRPercent:       req.MDRPercent,
		MDRAmount:        mdrAmount,
		Status:           "ACTIVE",
		// ERP sync initialized as PENDING for non-cheque, HOLD for cheque until cleared
		ERPSyncStatus: func() string {
			if req.PaymentMethod == "CHEQUE" {
				return "HOLD"
			}
			return "PENDING"
		}(),
		ERPSyncAttempts: 0,
		Notes:           req.Notes,
		ProofFileURL:    req.ProofFileURL,
		CreatedBy:       req.CreatedBy,
	}

	if err := tx.Create(payment).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create payment: %v", err)
	}

	// Audit log
	auditLog := map[string]interface{}{
		"id":           uuid.New().String(),
		"entity_type":  "PAYMENT",
		"entity_id":    payment.ID,
		"action":       "CREATE",
		"performed_by": req.CreatedBy,
		"details":      fmt.Sprintf("Payment %s created for invoice %s, amount: %.2f", paymentNumber, *req.InvoiceID, req.Amount),
		"created_at":   time.Now(),
	}
	if err := tx.Table("audit_logs").Create(auditLog).Error; err != nil {
		// Log error but don't fail transaction
		fmt.Printf("Failed to create audit log: %v\n", err)
	}

	// Handle payment allocations
	if len(req.Allocations) > 0 {
		totalAllocated := 0.0
		for _, alloc := range req.Allocations {
			allocation := PaymentAllocation{
				PaymentID:       payment.ID,
				InvoiceID:       alloc.InvoiceID,
				AllocatedAmount: alloc.AllocatedAmount,
			}
			if err := tx.Create(&allocation).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to create allocation: %v", err)
			}

			// Update invoice balance
			err := tx.Exec(`
				UPDATE sales_invoices 
				SET balance_amount = balance_amount - ?,
				    payment_status = CASE 
				        WHEN balance_amount - ? <= 0 THEN 'PAID'
				        ELSE 'PARTIAL'
				    END,
				    updated_at = NOW()
				WHERE id = ?`,
				alloc.AllocatedAmount, alloc.AllocatedAmount, alloc.InvoiceID).Error

			if err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to update invoice balance: %v", err)
			}

			totalAllocated += alloc.AllocatedAmount
		}

		// Check for overpayment
		if totalAllocated > req.Amount {
			tx.Rollback()
			return nil, fmt.Errorf("total allocated amount (%.2f) exceeds payment amount (%.2f)", totalAllocated, req.Amount)
		}

		// Handle unallocated amount as store credit
		if totalAllocated < req.Amount && req.CustomerID != nil {
			overpayment := req.Amount - totalAllocated
			creditNumber := fmt.Sprintf("CREDIT-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])
			expiryDate := time.Now().AddDate(0, 3, 0) // 3 months from now

			credit := CustomerCredit{
				CreditNumber:   creditNumber,
				CustomerID:     *req.CustomerID,
				SourceType:     "OVERPAYMENT",
				SourceID:       &payment.ID,
				OriginalAmount: overpayment,
				BalanceAmount:  overpayment,
				ExpiryDate:     &expiryDate,
				Status:         "ACTIVE",
			}

			if err := tx.Create(&credit).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to create store credit: %v", err)
			}
		}
	} else if req.InvoiceID != nil {
		// Single invoice payment
		allocation := PaymentAllocation{
			PaymentID:       payment.ID,
			InvoiceID:       *req.InvoiceID,
			AllocatedAmount: req.Amount,
		}
		if err := tx.Create(&allocation).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create allocation: %v", err)
		}

		// Update invoice balance
		err := tx.Exec(`
			UPDATE sales_invoices 
			SET balance_amount = balance_amount - ?,
			    payment_status = CASE 
			        WHEN balance_amount - ? <= 0 THEN 'PAID'
			        ELSE 'PARTIAL'
			    END,
			    updated_at = NOW()
			WHERE id = ?`,
			req.Amount, req.Amount, *req.InvoiceID).Error

		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update invoice balance: %v", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return payment, nil
}

// UpdateChequeStatus updates cheque status
func (s *PaymentService) UpdateChequeStatus(paymentID, status string, depositDate, clearanceDate *time.Time, bounceReason string) error {
	updates := map[string]interface{}{
		"cheque_status": status,
		"updated_at":    time.Now(),
	}

	if depositDate != nil {
		updates["cheque_deposit_date"] = depositDate
	}
	if clearanceDate != nil {
		updates["cheque_clearance_date"] = clearanceDate
	}
	if bounceReason != "" {
		updates["cheque_bounce_reason"] = bounceReason
	}

	// If bounced, reverse the payment
	if status == "BOUNCED" {
		tx := s.db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Get original payment
		var payment Payment
		if err := tx.Where("id = ?", paymentID).First(&payment).Error; err != nil {
			return err
		}

		// Get allocations
		var allocations []PaymentAllocation
		tx.Where("payment_id = ?", paymentID).Find(&allocations)

		// Reverse invoice balances
		for _, alloc := range allocations {
			err := tx.Exec(`
				UPDATE sales_invoices 
				SET balance_amount = balance_amount + ?,
				    payment_status = 'PENDING',
				    updated_at = NOW()
				WHERE id = ?`,
				alloc.AllocatedAmount, alloc.InvoiceID).Error

			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Update payment status
		updates["status"] = "REVERSED"
		if err := tx.Model(&Payment{}).Where("id = ?", paymentID).Updates(updates).Error; err != nil {
			tx.Rollback()
			return err
		}

		return tx.Commit().Error
	}

	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(updates).Error
}

// ReversePayment reverses a payment
func (s *PaymentService) ReversePayment(paymentID, reason, reversedBy string) error {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get original payment
	var payment Payment
	if err := tx.Where("id = ?", paymentID).First(&payment).Error; err != nil {
		return err
	}

	// Get allocations
	var allocations []PaymentAllocation
	tx.Where("payment_id = ?", paymentID).Find(&allocations)

	// Reverse invoice balances
	for _, alloc := range allocations {
		err := tx.Exec(`
			UPDATE sales_invoices 
			SET balance_amount = balance_amount + ?,
			    payment_status = CASE 
			        WHEN balance_amount + ? >= total_amount THEN 'PENDING'
			        ELSE 'PARTIAL'
			    END,
			    updated_at = NOW()
			WHERE id = ?`,
			alloc.AllocatedAmount, alloc.AllocatedAmount, alloc.InvoiceID).Error

		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Create reversal payment entry
	reversalNumber := fmt.Sprintf("REV-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])
	reversalPayment := Payment{
		PaymentNumber:     reversalNumber,
		InvoiceID:         payment.InvoiceID,
		CustomerID:        payment.CustomerID,
		PaymentDate:       time.Now(),
		PaymentMethod:     payment.PaymentMethod,
		Amount:            -payment.Amount, // Negative amount
		PaymentType:       "REVERSAL",
		Status:            "ACTIVE",
		ReversalPaymentID: &paymentID,
		ReversalReason:    reason,
		CreatedBy:         reversedBy,
	}

	if err := tx.Create(&reversalPayment).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Update original payment status
	if err := tx.Model(&Payment{}).Where("id = ?", paymentID).
		Updates(map[string]interface{}{
			"status":     "REVERSED",
			"updated_at": time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// GetPayments retrieves payments with filters
func (s *PaymentService) GetPayments(invoiceID, customerID, paymentMethod, status string, dateFrom, dateTo *time.Time, page, limit int) ([]Payment, int64, error) {
	var payments []Payment
	var total int64

	query := s.db.Model(&Payment{})

	if invoiceID != "" {
		query = query.Where("invoice_id = ?", invoiceID)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if paymentMethod != "" && paymentMethod != "all" {
		query = query.Where("payment_method = ?", paymentMethod)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if dateFrom != nil {
		query = query.Where("payment_date >= ?", dateFrom)
	}
	if dateTo != nil {
		query = query.Where("payment_date <= ?", dateTo)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("payment_date DESC").Offset(offset).Limit(limit).Find(&payments).Error; err != nil {
		return nil, 0, err
	}

	return payments, total, nil
}

// GetReconciliationReport generates EOD reconciliation report
func (s *PaymentService) GetReconciliationReport(date time.Time) (map[string]interface{}, error) {
	report := make(map[string]interface{})

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1)

	// Cash payments today
	var cashPayments float64
	s.db.Model(&Payment{}).
		Where("payment_method = ? AND payment_date >= ? AND payment_date < ? AND status = ?",
			"CASH", startOfDay, endOfDay, "ACTIVE").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&cashPayments)

	// Card payments today
	var cardPayments float64
	s.db.Model(&Payment{}).
		Where("payment_method = ? AND payment_date >= ? AND payment_date < ? AND status = ?",
			"CARD", startOfDay, endOfDay, "ACTIVE").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&cardPayments)

	// UPI payments today
	var upiPayments float64
	s.db.Model(&Payment{}).
		Where("payment_method = ? AND payment_date >= ? AND payment_date < ? AND status = ?",
			"UPI", startOfDay, endOfDay, "ACTIVE").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&upiPayments)

	// Cheque payments today
	var chequePayments float64
	s.db.Model(&Payment{}).
		Where("payment_method = ? AND payment_date >= ? AND payment_date < ? AND status = ?",
			"CHEQUE", startOfDay, endOfDay, "ACTIVE").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&chequePayments)

	report["date"] = date.Format("2006-01-02")
	report["cashPayments"] = cashPayments
	report["cardPayments"] = cardPayments
	report["upiPayments"] = upiPayments
	report["chequePayments"] = chequePayments
	report["totalPayments"] = cashPayments + cardPayments + upiPayments + chequePayments

	return report, nil
}

// ==================== ERP Integration Methods ====================

// ValidatePaymentForERP validates payment before ERP sync
func (s *PaymentService) ValidatePaymentForERP(paymentID string) error {
	var payment Payment
	if err := s.db.Where("id = ?", paymentID).First(&payment).Error; err != nil {
		return fmt.Errorf("payment not found: %v", err)
	}

	// Must have valid invoice reference
	if payment.InvoiceID == nil || *payment.InvoiceID == "" {
		return fmt.Errorf("payment must have valid invoice reference")
	}

	// Must have valid amount
	if payment.Amount <= 0 {
		return fmt.Errorf("payment amount must be greater than zero")
	}

	// Must have valid payment method
	if payment.PaymentMethod == "" {
		return fmt.Errorf("payment method is required")
	}

	// Validate payment method specific fields
	switch payment.PaymentMethod {
	case "UPI":
		if payment.UPIId == "" && payment.TransactionRefNo == "" {
			return fmt.Errorf("UPI ID or transaction reference is required for UPI payments")
		}
	case "CARD":
		if payment.CardLast4Digits == "" {
			return fmt.Errorf("card last 4 digits required for card payments")
		}
	case "CHEQUE":
		if payment.ChequeNumber == "" {
			return fmt.Errorf("cheque number is required for cheque payments")
		}
		if payment.ChequeStatus != "CLEARED" {
			return fmt.Errorf("cheque must be cleared before ERP sync")
		}
	}

	// Must not be already synced
	if payment.ERPSyncStatus == "SYNCED" {
		return fmt.Errorf("payment already synced to ERP")
	}

	// Must be active status
	if payment.Status != "ACTIVE" {
		return fmt.Errorf("only active payments can be synced")
	}

	return nil
}

// MarkERPSyncPending marks payment for ERP sync
func (s *PaymentService) MarkERPSyncPending(paymentID string) error {
	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(map[string]interface{}{
		"erp_sync_status": "PENDING",
		"updated_at":      time.Now(),
	}).Error
}

// MarkERPSyncSuccess marks payment as successfully synced to ERP
func (s *PaymentService) MarkERPSyncSuccess(paymentID, erpReferenceID string) error {
	now := time.Now()
	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(map[string]interface{}{
		"erp_sync_status":       "SYNCED",
		"erp_reference_id":      erpReferenceID,
		"erp_sync_last_attempt": now,
		"erp_sync_error":        "",
		"updated_at":            now,
	}).Error
}

// MarkERPSyncFailed marks payment sync as failed with error
func (s *PaymentService) MarkERPSyncFailed(paymentID, errorMsg string) error {
	now := time.Now()
	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(map[string]interface{}{
		"erp_sync_status":       "FAILED",
		"erp_sync_error":        errorMsg,
		"erp_sync_last_attempt": now,
		"erp_sync_attempts":     gorm.Expr("erp_sync_attempts + 1"),
		"updated_at":            now,
	}).Error
}

// GetPendingERPSyncPayments retrieves payments pending ERP sync
func (s *PaymentService) GetPendingERPSyncPayments(limit int) ([]Payment, error) {
	var payments []Payment
	err := s.db.Where("erp_sync_status IN (?, ?)", "PENDING", "FAILED").
		Where("erp_sync_attempts < ?", 5).
		Where("status = ?", "ACTIVE").
		Order("created_at ASC").
		Limit(limit).
		Find(&payments).Error
	return payments, err
}

// GetFailedERPSyncPayments retrieves payments with failed ERP sync
func (s *PaymentService) GetFailedERPSyncPayments() ([]Payment, error) {
	var payments []Payment
	err := s.db.Where("erp_sync_status = ?", "FAILED").
		Where("erp_sync_attempts >= ?", 5).
		Order("erp_sync_last_attempt DESC").
		Find(&payments).Error
	return payments, err
}

// RetryERPSync resets sync status for retry
func (s *PaymentService) RetryERPSync(paymentID string) error {
	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(map[string]interface{}{
		"erp_sync_status":   "PENDING",
		"erp_sync_attempts": 0,
		"erp_sync_error":    "",
		"updated_at":        time.Now(),
	}).Error
}

// ReconcilePayment marks payment as reconciled
func (s *PaymentService) ReconcilePayment(paymentID, notes, reconciledBy string) error {
	now := time.Now()
	return s.db.Model(&Payment{}).Where("id = ?", paymentID).Updates(map[string]interface{}{
		"reconciled":           true,
		"reconciliation_date":  now,
		"reconciliation_notes": notes,
		"updated_by":           reconciledBy,
		"updated_at":           now,
	}).Error
}

// GetUnreconciledPayments retrieves payments needing reconciliation
func (s *PaymentService) GetUnreconciledPayments(dateFrom, dateTo *time.Time) ([]Payment, error) {
	var payments []Payment
	query := s.db.Where("reconciled = ?", false).Where("status = ?", "ACTIVE")

	if dateFrom != nil {
		query = query.Where("payment_date >= ?", dateFrom)
	}
	if dateTo != nil {
		query = query.Where("payment_date <= ?", dateTo)
	}

	err := query.Order("payment_date ASC").Find(&payments).Error
	return payments, err
}

// GetPaymentSyncSummary generates ERP sync status summary
func (s *PaymentService) GetPaymentSyncSummary() (map[string]interface{}, error) {
	summary := make(map[string]interface{})

	// Count by sync status
	var syncCounts []struct {
		SyncStatus string
		Count      int64
	}
	s.db.Model(&Payment{}).
		Select("erp_sync_status as sync_status, COUNT(*) as count").
		Where("status = ?", "ACTIVE").
		Group("erp_sync_status").
		Scan(&syncCounts)

	for _, sc := range syncCounts {
		summary[sc.SyncStatus] = sc.Count
	}

	// Count unreconciled
	var unreconciledCount int64
	s.db.Model(&Payment{}).
		Where("reconciled = ? AND status = ?", false, "ACTIVE").
		Count(&unreconciledCount)
	summary["UNRECONCILED"] = unreconciledCount

	// Count failed syncs needing attention
	var failedSyncCount int64
	s.db.Model(&Payment{}).
		Where("erp_sync_status = ? AND erp_sync_attempts >= ?", "FAILED", 5).
		Count(&failedSyncCount)
	summary["FAILED_NEEDS_ATTENTION"] = failedSyncCount

	return summary, nil
}

// AuditPaymentAction logs payment actions
func (s *PaymentService) AuditPaymentAction(paymentID, action, performedBy, details string) error {
	auditLog := map[string]interface{}{
		"id":           uuid.New().String(),
		"entity_type":  "PAYMENT",
		"entity_id":    paymentID,
		"action":       action,
		"performed_by": performedBy,
		"details":      details,
		"created_at":   time.Now(),
	}

	return s.db.Table("audit_logs").Create(auditLog).Error
}

// CheckPaymentDuplicate checks for duplicate payment by transaction reference
func (s *PaymentService) CheckPaymentDuplicate(paymentMethod, transactionRef string) (bool, error) {
	var count int64
	err := s.db.Model(&Payment{}).
		Where("payment_method = ? AND transaction_ref_no = ? AND status = ?",
			paymentMethod, transactionRef, "ACTIVE").
		Count(&count).Error

	return count > 0, err
}
