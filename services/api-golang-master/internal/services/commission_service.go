package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CommissionService handles commission tracking operations
type CommissionService struct {
	db *gorm.DB
}

// NewCommissionService creates a new commission service
func NewCommissionService(db *gorm.DB) *CommissionService {
	return &CommissionService{db: db}
}

// CommissionBeneficiary represents a commission beneficiary
type CommissionBeneficiary struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	BeneficiaryCode   string    `json:"beneficiaryCode" gorm:"column:beneficiary_code;unique;not null"`
	Name              string    `json:"name" gorm:"column:name;not null"`
	BeneficiaryType   string    `json:"beneficiaryType" gorm:"column:beneficiary_type"`
	PANNumber         string    `json:"panNumber" gorm:"column:pan_number"`
	BankAccountNumber string    `json:"bankAccountNumber" gorm:"column:bank_account_number"`
	BankIFSCCode      string    `json:"bankIfscCode" gorm:"column:bank_ifsc_code"`
	BankName          string    `json:"bankName" gorm:"column:bank_name"`
	ContactEmail      string    `json:"contactEmail" gorm:"column:contact_email"`
	ContactPhone      string    `json:"contactPhone" gorm:"column:contact_phone"`
	Address           string    `json:"address" gorm:"column:address"`
	TDSApplicable     bool      `json:"tdsApplicable" gorm:"column:tds_applicable;default:true"`
	Status            string    `json:"status" gorm:"column:status;default:'ACTIVE'"`
	CreatedAt         time.Time `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt         time.Time `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (CommissionBeneficiary) TableName() string {
	return "commission_beneficiaries"
}

// CommissionRule represents commission calculation rules
type CommissionRule struct {
	ID               string          `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	BeneficiaryID    string          `json:"beneficiaryId" gorm:"column:beneficiary_id;not null"`
	CommissionType   string          `json:"commissionType" gorm:"column:commission_type"`
	CommissionRate   float64         `json:"commissionRate" gorm:"column:commission_rate"`
	TierConfig       json.RawMessage `json:"tierConfig" gorm:"column:tier_config;type:jsonb"`
	CalculationBasis string          `json:"calculationBasis" gorm:"column:calculation_basis"`
	MinimumAmount    float64         `json:"minimumAmount" gorm:"column:minimum_amount"`
	MaximumAmount    float64         `json:"maximumAmount" gorm:"column:maximum_amount"`
	MonthlyCapAmount float64         `json:"monthlyCapAmount" gorm:"column:monthly_cap_amount"`
	ValidFrom        *time.Time      `json:"validFrom" gorm:"column:valid_from"`
	ValidTo          *time.Time      `json:"validTo" gorm:"column:valid_to"`
	Status           string          `json:"status" gorm:"column:status;default:'ACTIVE'"`
	CreatedAt        time.Time       `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt        time.Time       `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (CommissionRule) TableName() string {
	return "commission_rules"
}

// CommissionTransaction represents individual commission transactions
type CommissionTransaction struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	TransactionNumber string    `json:"transactionNumber" gorm:"column:transaction_number;unique;not null"`
	BeneficiaryID     string    `json:"beneficiaryId" gorm:"column:beneficiary_id;not null"`
	InvoiceID         *string   `json:"invoiceId" gorm:"column:invoice_id"`
	InvoiceNo         string    `json:"invoiceNo" gorm:"column:invoice_no"`
	CustomerName      string    `json:"customerName" gorm:"column:customer_name"`
	SaleAmount        float64   `json:"saleAmount" gorm:"column:sale_amount"`
	CommissionRate    float64   `json:"commissionRate" gorm:"column:commission_rate"`
	CommissionAmount  float64   `json:"commissionAmount" gorm:"column:commission_amount"`
	TDSPercent        float64   `json:"tdsPercent" gorm:"column:tds_percent;default:10"`
	TDSAmount         float64   `json:"tdsAmount" gorm:"column:tds_amount;default:0"`
	NetPayable        float64   `json:"netPayable" gorm:"column:net_payable"`
	TransactionType   string    `json:"transactionType" gorm:"column:transaction_type;default:'COMMISSION'"`
	Status            string    `json:"status" gorm:"column:status;default:'PENDING'"`
	Reversed          bool      `json:"reversed" gorm:"column:reversed;default:false"`
	PayoutID          *string   `json:"payoutId" gorm:"column:payout_id"`
	TransactionDate   time.Time `json:"transactionDate" gorm:"column:transaction_date;default:now()"`
	CreatedAt         time.Time `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt         time.Time `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (CommissionTransaction) TableName() string {
	return "commission_transactions"
}

// CommissionPayout represents payout batches
type CommissionPayout struct {
	ID                   string     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PayoutNumber         string     `json:"payoutNumber" gorm:"column:payout_number;unique;not null"`
	BeneficiaryID        string     `json:"beneficiaryId" gorm:"column:beneficiary_id;not null"`
	PayoutPeriodStart    time.Time  `json:"payoutPeriodStart" gorm:"column:payout_period_start"`
	PayoutPeriodEnd      time.Time  `json:"payoutPeriodEnd" gorm:"column:payout_period_end"`
	TotalCommission      float64    `json:"totalCommission" gorm:"column:total_commission"`
	TotalTDS             float64    `json:"totalTDS" gorm:"column:total_tds"`
	NetPayout            float64    `json:"netPayout" gorm:"column:net_payout"`
	TransactionCount     int        `json:"transactionCount" gorm:"column:transaction_count"`
	PaymentMethod        string     `json:"paymentMethod" gorm:"column:payment_method"`
	PaymentReference     string     `json:"paymentReference" gorm:"column:payment_reference"`
	TDSCertificateIssued bool       `json:"tdsCertificateIssued" gorm:"column:tds_certificate_issued;default:false"`
	Status               string     `json:"status" gorm:"column:status;default:'PENDING_APPROVAL'"`
	ApprovedBy           string     `json:"approvedBy" gorm:"column:approved_by"`
	ApprovalDate         *time.Time `json:"approvalDate" gorm:"column:approval_date"`
	PaidAt               *time.Time `json:"paidAt" gorm:"column:paid_at"`
	RejectionReason      string     `json:"rejectionReason" gorm:"column:rejection_reason"`
	CreatedAt            time.Time  `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt            time.Time  `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (CommissionPayout) TableName() string {
	return "commission_payouts"
}

// Tier represents a commission tier
type Tier struct {
	Min  float64 `json:"min"`
	Max  float64 `json:"max"`
	Rate float64 `json:"rate"`
}

// CalculateCommission calculates commission based on rules
func (s *CommissionService) CalculateCommission(beneficiaryID string, saleAmount float64, invoiceID, invoiceNo, customerName string) (*CommissionTransaction, error) {
	// Get active rule for beneficiary
	var rule CommissionRule
	err := s.db.Where("beneficiary_id = ? AND status = ? AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_to IS NULL OR valid_to >= NOW())",
		beneficiaryID, "ACTIVE").First(&rule).Error

	if err != nil {
		return nil, fmt.Errorf("no active commission rule found for beneficiary")
	}

	// Calculate commission amount
	var commissionAmount float64
	var commissionRate float64

	switch rule.CommissionType {
	case "PERCENTAGE":
		commissionRate = rule.CommissionRate
		commissionAmount = saleAmount * rule.CommissionRate / 100

	case "FLAT":
		commissionAmount = rule.CommissionRate
		commissionRate = (rule.CommissionRate / saleAmount) * 100

	case "TIERED":
		// Parse tier config
		var tiers []Tier
		if err := json.Unmarshal(rule.TierConfig, &tiers); err != nil {
			return nil, fmt.Errorf("invalid tier configuration: %v", err)
		}

		// Calculate tiered commission
		remainingAmount := saleAmount
		for _, tier := range tiers {
			if remainingAmount <= 0 {
				break
			}

			tierMin := tier.Min
			tierMax := tier.Max
			if tierMax == 0 {
				tierMax = 999999999 // No upper limit
			}

			// Amount in this tier
			tierAmount := 0.0
			if saleAmount > tierMax {
				tierAmount = tierMax - tierMin
			} else if saleAmount > tierMin {
				tierAmount = saleAmount - tierMin
			}

			if tierAmount > 0 {
				commissionAmount += tierAmount * tier.Rate / 100
			}
		}

		commissionRate = (commissionAmount / saleAmount) * 100

	default:
		return nil, fmt.Errorf("invalid commission type: %s", rule.CommissionType)
	}

	// Apply min/max limits
	if rule.MinimumAmount > 0 && commissionAmount < rule.MinimumAmount {
		commissionAmount = rule.MinimumAmount
	}
	if rule.MaximumAmount > 0 && commissionAmount > rule.MaximumAmount {
		commissionAmount = rule.MaximumAmount
	}

	// Check monthly cap
	if rule.MonthlyCapAmount > 0 {
		var monthTotal float64
		s.db.Model(&CommissionTransaction{}).
			Where("beneficiary_id = ? AND transaction_date >= DATE_TRUNC('month', NOW()) AND status != ?",
				beneficiaryID, "REVERSED").
			Select("COALESCE(SUM(commission_amount), 0)").
			Scan(&monthTotal)

		if monthTotal+commissionAmount > rule.MonthlyCapAmount {
			commissionAmount = rule.MonthlyCapAmount - monthTotal
			if commissionAmount < 0 {
				commissionAmount = 0
			}
		}
	}

	// Get beneficiary for TDS check
	var beneficiary CommissionBeneficiary
	s.db.Where("id = ?", beneficiaryID).First(&beneficiary)

	// Calculate TDS (will be applied at payout if cumulative >15000)
	tdsAmount := 0.0
	tdsPercent := 0.0
	if beneficiary.TDSApplicable {
		tdsPercent = 10.0
		// TDS will be calculated at payout batch creation
	}

	netPayable := commissionAmount - tdsAmount

	// Generate transaction number
	transactionNumber := fmt.Sprintf("COMM-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

	// Create transaction
	transaction := &CommissionTransaction{
		TransactionNumber: transactionNumber,
		BeneficiaryID:     beneficiaryID,
		InvoiceID:         &invoiceID,
		InvoiceNo:         invoiceNo,
		CustomerName:      customerName,
		SaleAmount:        saleAmount,
		CommissionRate:    commissionRate,
		CommissionAmount:  commissionAmount,
		TDSPercent:        tdsPercent,
		TDSAmount:         tdsAmount,
		NetPayable:        netPayable,
		TransactionType:   "COMMISSION",
		Status:            "PENDING",
		TransactionDate:   time.Now(),
	}

	if err := s.db.Create(transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create commission transaction: %v", err)
	}

	return transaction, nil
}

// ClawbackCommission reverses commission on return/cancellation
func (s *CommissionService) ClawbackCommission(invoiceID string) error {
	// Find original commission transactions
	var transactions []CommissionTransaction
	s.db.Where("invoice_id = ? AND status NOT IN (?, ?)", invoiceID, "REVERSED", "CLAWBACK").Find(&transactions)

	for _, txn := range transactions {
		// Create reversal transaction
		reversalNumber := fmt.Sprintf("CLAW-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

		reversal := CommissionTransaction{
			TransactionNumber: reversalNumber,
			BeneficiaryID:     txn.BeneficiaryID,
			InvoiceID:         &invoiceID,
			InvoiceNo:         txn.InvoiceNo,
			CustomerName:      txn.CustomerName,
			SaleAmount:        txn.SaleAmount,
			CommissionRate:    txn.CommissionRate,
			CommissionAmount:  -txn.CommissionAmount, // Negative
			TDSPercent:        0,
			TDSAmount:         0,
			NetPayable:        -txn.NetPayable, // Negative
			TransactionType:   "CLAWBACK_RETURN",
			Status:            "COMPLETED",
			TransactionDate:   time.Now(),
		}

		if err := s.db.Create(&reversal).Error; err != nil {
			return fmt.Errorf("failed to create clawback transaction: %v", err)
		}

		// Mark original as reversed
		s.db.Model(&txn).Updates(map[string]interface{}{
			"reversed":   true,
			"status":     "REVERSED",
			"updated_at": time.Now(),
		})
	}

	return nil
}

// CreatePayoutBatch creates a payout batch for a beneficiary
func (s *CommissionService) CreatePayoutBatch(beneficiaryID string, periodStart, periodEnd time.Time) (*CommissionPayout, error) {
	// Get pending transactions
	var transactions []CommissionTransaction
	err := s.db.Where("beneficiary_id = ? AND status = ? AND transaction_date >= ? AND transaction_date <= ? AND payout_id IS NULL",
		beneficiaryID, "PENDING", periodStart, periodEnd).Find(&transactions).Error

	if err != nil {
		return nil, err
	}

	if len(transactions) == 0 {
		return nil, fmt.Errorf("no pending transactions found for this period")
	}

	// Calculate totals
	var totalCommission, totalTDS float64
	for _, txn := range transactions {
		totalCommission += txn.CommissionAmount
	}

	// Get beneficiary
	var beneficiary CommissionBeneficiary
	s.db.Where("id = ?", beneficiaryID).First(&beneficiary)

	// Calculate TDS if applicable (10% if annual >15000)
	if beneficiary.TDSApplicable && totalCommission >= 15000 {
		totalTDS = totalCommission * 10 / 100
	}

	netPayout := totalCommission - totalTDS

	// Generate payout number
	payoutNumber := fmt.Sprintf("PAYOUT-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

	// Create payout
	payout := &CommissionPayout{
		PayoutNumber:      payoutNumber,
		BeneficiaryID:     beneficiaryID,
		PayoutPeriodStart: periodStart,
		PayoutPeriodEnd:   periodEnd,
		TotalCommission:   totalCommission,
		TotalTDS:          totalTDS,
		NetPayout:         netPayout,
		TransactionCount:  len(transactions),
		Status:            "PENDING_APPROVAL",
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(payout).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Link transactions to payout and update TDS
	for _, txn := range transactions {
		tdsAmount := 0.0
		if beneficiary.TDSApplicable && totalCommission >= 15000 {
			tdsAmount = txn.CommissionAmount * 10 / 100
		}

		tx.Model(&CommissionTransaction{}).Where("id = ?", txn.ID).Updates(map[string]interface{}{
			"payout_id":   payout.ID,
			"tds_amount":  tdsAmount,
			"net_payable": txn.CommissionAmount - tdsAmount,
			"updated_at":  time.Now(),
		})
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return payout, nil
}

// ApprovePayout approves a payout
func (s *CommissionService) ApprovePayout(payoutID, approvedBy string) error {
	now := time.Now()
	return s.db.Model(&CommissionPayout{}).Where("id = ?", payoutID).Updates(map[string]interface{}{
		"status":        "APPROVED",
		"approved_by":   approvedBy,
		"approval_date": now,
		"updated_at":    now,
	}).Error
}

// RejectPayout rejects a payout
func (s *CommissionService) RejectPayout(payoutID, reason string) error {
	return s.db.Model(&CommissionPayout{}).Where("id = ?", payoutID).Updates(map[string]interface{}{
		"status":           "REJECTED",
		"rejection_reason": reason,
		"updated_at":       time.Now(),
	}).Error
}

// ProcessPayout marks payout as paid
func (s *CommissionService) ProcessPayout(payoutID, paymentMethod, paymentReference string) error {
	now := time.Now()
	err := s.db.Model(&CommissionPayout{}).Where("id = ? AND status = ?", payoutID, "APPROVED").Updates(map[string]interface{}{
		"status":            "PAID",
		"payment_method":    paymentMethod,
		"payment_reference": paymentReference,
		"paid_at":           now,
		"updated_at":        now,
	}).Error

	if err != nil {
		return err
	}

	// Update linked transactions
	return s.db.Model(&CommissionTransaction{}).Where("payout_id = ?", payoutID).Updates(map[string]interface{}{
		"status":     "PAID",
		"updated_at": time.Now(),
	}).Error
}

// GetBeneficiaries retrieves beneficiaries
func (s *CommissionService) GetBeneficiaries(status string, page, limit int) ([]CommissionBeneficiary, int64, error) {
	var beneficiaries []CommissionBeneficiary
	var total int64

	query := s.db.Model(&CommissionBeneficiary{})
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("name").Offset(offset).Limit(limit).Find(&beneficiaries).Error; err != nil {
		return nil, 0, err
	}

	return beneficiaries, total, nil
}

// GetTransactions retrieves commission transactions
func (s *CommissionService) GetTransactions(beneficiaryID, status string, dateFrom, dateTo *time.Time, page, limit int) ([]CommissionTransaction, int64, error) {
	var transactions []CommissionTransaction
	var total int64

	query := s.db.Model(&CommissionTransaction{})

	if beneficiaryID != "" {
		query = query.Where("beneficiary_id = ?", beneficiaryID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if dateFrom != nil {
		query = query.Where("transaction_date >= ?", dateFrom)
	}
	if dateTo != nil {
		query = query.Where("transaction_date <= ?", dateTo)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("transaction_date DESC").Offset(offset).Limit(limit).Find(&transactions).Error; err != nil {
		return nil, 0, err
	}

	return transactions, total, nil
}

// GetPayouts retrieves payout batches
func (s *CommissionService) GetPayouts(beneficiaryID, status string, page, limit int) ([]CommissionPayout, int64, error) {
	var payouts []CommissionPayout
	var total int64

	query := s.db.Model(&CommissionPayout{})

	if beneficiaryID != "" {
		query = query.Where("beneficiary_id = ?", beneficiaryID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&payouts).Error; err != nil {
		return nil, 0, err
	}

	return payouts, total, nil
}
