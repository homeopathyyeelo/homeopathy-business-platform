package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HoldBillService handles held bill operations
type HoldBillService struct {
	db *gorm.DB
}

// NewHoldBillService creates a new hold bill service
func NewHoldBillService(db *gorm.DB) *HoldBillService {
	return &HoldBillService{db: db}
}

// HoldBill represents a temporarily held bill
type HoldBill struct {
	ID             string          `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	HoldNumber     string          `json:"holdNumber" gorm:"column:hold_number;unique;not null"`
	CounterID      string          `json:"counterId" gorm:"column:counter_id"`
	CounterName    string          `json:"counterName" gorm:"column:counter_name"`
	UserID         string          `json:"userId" gorm:"column:user_id"`
	UserName       string          `json:"userName" gorm:"column:user_name"`
	CustomerID     *string         `json:"customerId" gorm:"column:customer_id"`
	CustomerName   string          `json:"customerName" gorm:"column:customer_name"`
	CustomerPhone  string          `json:"customerPhone" gorm:"column:customer_phone"`
	CartData       json.RawMessage `json:"cartData" gorm:"column:cart_data;type:jsonb"`
	Subtotal       float64         `json:"subtotal" gorm:"column:subtotal"`
	DiscountAmount float64         `json:"discountAmount" gorm:"column:discount_amount"`
	TaxAmount      float64         `json:"taxAmount" gorm:"column:tax_amount"`
	TotalAmount    float64         `json:"totalAmount" gorm:"column:total_amount"`
	ItemsCount     int             `json:"itemsCount" gorm:"column:items_count"`
	Notes          string          `json:"notes" gorm:"column:notes"`
	Status         string          `json:"status" gorm:"column:status;default:'ACTIVE'"`
	HoldAt         time.Time       `json:"holdAt" gorm:"column:hold_at;default:now()"`
	ExpiresAt      time.Time       `json:"expiresAt" gorm:"column:expires_at"`
	ResumedAt      *time.Time      `json:"resumedAt" gorm:"column:resumed_at"`
	DiscardedAt    *time.Time      `json:"discardedAt" gorm:"column:discarded_at"`
	DiscardedBy    string          `json:"discardedBy" gorm:"column:discarded_by"`
	DiscardReason  string          `json:"discardReason" gorm:"column:discard_reason"`
	CreatedAt      time.Time       `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt      time.Time       `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (HoldBill) TableName() string {
	return "held_bills"
}

// CartItem represents an item in the cart
type CartItem struct {
	ProductID       string  `json:"productId"`
	ProductName     string  `json:"productName"`
	SKU             string  `json:"sku"`
	BatchID         string  `json:"batchId"`
	BatchNumber     string  `json:"batchNumber"`
	Quantity        float64 `json:"quantity"`
	UnitPrice       float64 `json:"unitPrice"`
	DiscountAmount  float64 `json:"discountAmount"`
	DiscountPercent float64 `json:"discountPercent"`
	TaxPercent      float64 `json:"taxPercent"`
	TaxAmount       float64 `json:"taxAmount"`
	Total           float64 `json:"total"`
	ExpiryDate      string  `json:"expiryDate"`
}

// HoldBillRequest represents the request to hold a bill
type HoldBillRequest struct {
	CounterID      string     `json:"counterId"`
	CounterName    string     `json:"counterName"`
	UserID         string     `json:"userId"`
	UserName       string     `json:"userName"`
	CustomerID     *string    `json:"customerId"`
	CustomerName   string     `json:"customerName"`
	CustomerPhone  string     `json:"customerPhone"`
	CartItems      []CartItem `json:"cartItems"`
	Subtotal       float64    `json:"subtotal"`
	DiscountAmount float64    `json:"discountAmount"`
	TaxAmount      float64    `json:"taxAmount"`
	TotalAmount    float64    `json:"totalAmount"`
	Notes          string     `json:"notes"`
}

// CreateHoldBill creates a new held bill
func (s *HoldBillService) CreateHoldBill(req HoldBillRequest) (*HoldBill, error) {
	// Validate request
	if len(req.CartItems) == 0 {
		return nil, fmt.Errorf("cart cannot be empty")
	}

	if req.TotalAmount <= 0 {
		return nil, fmt.Errorf("total amount must be greater than zero")
	}

	// Generate hold number
	holdNumber := fmt.Sprintf("HOLD-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

	// Marshal cart data to JSON
	cartDataJSON, err := json.Marshal(req.CartItems)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal cart data: %v", err)
	}

	// Create hold bill
	holdBill := &HoldBill{
		HoldNumber:     holdNumber,
		CounterID:      req.CounterID,
		CounterName:    req.CounterName,
		UserID:         req.UserID,
		UserName:       req.UserName,
		CustomerID:     req.CustomerID,
		CustomerName:   req.CustomerName,
		CustomerPhone:  req.CustomerPhone,
		CartData:       cartDataJSON,
		Subtotal:       req.Subtotal,
		DiscountAmount: req.DiscountAmount,
		TaxAmount:      req.TaxAmount,
		TotalAmount:    req.TotalAmount,
		ItemsCount:     len(req.CartItems),
		Notes:          req.Notes,
		Status:         "ACTIVE",
		HoldAt:         time.Now(),
		ExpiresAt:      time.Now().Add(7 * 24 * time.Hour), // 7 days default
	}

	if err := s.db.Create(holdBill).Error; err != nil {
		return nil, fmt.Errorf("failed to create hold bill: %v", err)
	}

	return holdBill, nil
}

// GetHeldBills retrieves held bills with filters
func (s *HoldBillService) GetHeldBills(counterID, userID, status string, page, limit int) ([]HoldBill, int64, error) {
	var bills []HoldBill
	var total int64

	query := s.db.Model(&HoldBill{})

	// Apply filters
	if counterID != "" {
		query = query.Where("counter_id = ?", counterID)
	}
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	} else {
		// By default, only show active bills
		query = query.Where("status = ?", "ACTIVE")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination
	offset := (page - 1) * limit
	if err := query.Order("hold_at DESC").Offset(offset).Limit(limit).Find(&bills).Error; err != nil {
		return nil, 0, err
	}

	return bills, total, nil
}

// GetHoldBillByID retrieves a single hold bill
func (s *HoldBillService) GetHoldBillByID(id string) (*HoldBill, error) {
	var bill HoldBill
	if err := s.db.Where("id = ?", id).First(&bill).Error; err != nil {
		return nil, err
	}
	return &bill, nil
}

// GetHoldBillByNumber retrieves a hold bill by hold number
func (s *HoldBillService) GetHoldBillByNumber(holdNumber string) (*HoldBill, error) {
	var bill HoldBill
	if err := s.db.Where("hold_number = ?", holdNumber).First(&bill).Error; err != nil {
		return nil, err
	}
	return &bill, nil
}

// ResumeHoldBill marks a bill as resumed
func (s *HoldBillService) ResumeHoldBill(id string) (*HoldBill, error) {
	var bill HoldBill
	if err := s.db.Where("id = ?", id).First(&bill).Error; err != nil {
		return nil, err
	}

	if bill.Status != "ACTIVE" {
		return nil, fmt.Errorf("only active held bills can be resumed")
	}

	// Mark as resumed
	now := time.Now()
	bill.Status = "RESUMED"
	bill.ResumedAt = &now
	bill.UpdatedAt = now

	if err := s.db.Save(&bill).Error; err != nil {
		return nil, err
	}

	return &bill, nil
}

// DiscardHoldBill discards a held bill
func (s *HoldBillService) DiscardHoldBill(id, discardedBy, reason string) error {
	var bill HoldBill
	if err := s.db.Where("id = ?", id).First(&bill).Error; err != nil {
		return err
	}

	if bill.Status != "ACTIVE" {
		return fmt.Errorf("only active held bills can be discarded")
	}

	// Mark as discarded
	now := time.Now()
	bill.Status = "DISCARDED"
	bill.DiscardedAt = &now
	bill.DiscardedBy = discardedBy
	bill.DiscardReason = reason
	bill.UpdatedAt = now

	if err := s.db.Save(&bill).Error; err != nil {
		return err
	}

	return nil
}

// ValidateHoldBill validates if items in hold bill are still available
func (s *HoldBillService) ValidateHoldBill(id string) (map[string]interface{}, error) {
	bill, err := s.GetHoldBillByID(id)
	if err != nil {
		return nil, err
	}

	// Parse cart data
	var cartItems []CartItem
	if err := json.Unmarshal(bill.CartData, &cartItems); err != nil {
		return nil, fmt.Errorf("failed to parse cart data: %v", err)
	}

	// Validate each item
	validationResults := make(map[string]interface{})
	allValid := true
	issues := []map[string]interface{}{}

	for _, item := range cartItems {
		// Check stock availability
		var batch struct {
			ID           string    `gorm:"column:id"`
			BatchNumber  string    `gorm:"column:batch_number"`
			AvailableQty float64   `gorm:"column:available_quantity"`
			SellingPrice float64   `gorm:"column:selling_price"`
			ExpiryDate   time.Time `gorm:"column:expiry_date"`
		}

		err := s.db.Table("inventory_batches").
			Select("id, batch_number, available_quantity, selling_price, expiry_date").
			Where("id = ?", item.BatchID).
			First(&batch).Error

		if err != nil {
			// Batch not found
			allValid = false
			issues = append(issues, map[string]interface{}{
				"productName": item.ProductName,
				"issue":       "BATCH_NOT_FOUND",
				"message":     "Batch no longer available",
			})
			continue
		}

		// Check if expired
		if batch.ExpiryDate.Before(time.Now()) {
			allValid = false
			issues = append(issues, map[string]interface{}{
				"productName": item.ProductName,
				"issue":       "BATCH_EXPIRED",
				"message":     "Batch has expired",
				"expiryDate":  batch.ExpiryDate.Format("2006-01-02"),
			})
			continue
		}

		// Check stock availability
		if batch.AvailableQty < item.Quantity {
			allValid = false
			issues = append(issues, map[string]interface{}{
				"productName": item.ProductName,
				"issue":       "INSUFFICIENT_STOCK",
				"message":     "Insufficient stock available",
				"requested":   item.Quantity,
				"available":   batch.AvailableQty,
			})
			continue
		}

		// Check price change
		if batch.SellingPrice != item.UnitPrice {
			issues = append(issues, map[string]interface{}{
				"productName": item.ProductName,
				"issue":       "PRICE_CHANGED",
				"message":     "Price has changed since hold",
				"oldPrice":    item.UnitPrice,
				"newPrice":    batch.SellingPrice,
			})
			// Price change doesn't invalidate, just notify
		}
	}

	validationResults["valid"] = allValid
	validationResults["issues"] = issues
	validationResults["canProceed"] = allValid || len(issues) == 0

	return validationResults, nil
}

// CleanupExpiredHolds deletes expired held bills
func (s *HoldBillService) CleanupExpiredHolds() (int64, error) {
	result := s.db.Where("status = ? AND expires_at < ?", "ACTIVE", time.Now()).
		Update("status", "EXPIRED")

	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}

// GetHoldBillStats returns statistics for held bills
func (s *HoldBillService) GetHoldBillStats(counterID string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := s.db.Model(&HoldBill{})
	if counterID != "" {
		query = query.Where("counter_id = ?", counterID)
	}

	// Total active holds
	var activeCount int64
	query.Where("status = ?", "ACTIVE").Count(&activeCount)
	stats["activeHolds"] = activeCount

	// Total value of active holds
	var totalValue float64
	s.db.Model(&HoldBill{}).
		Where("status = ?", "ACTIVE").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalValue)
	stats["totalValue"] = totalValue

	// Expiring soon (within 24 hours)
	var expiringSoon int64
	query.Where("status = ? AND expires_at BETWEEN ? AND ?",
		"ACTIVE", time.Now(), time.Now().Add(24*time.Hour)).
		Count(&expiringSoon)
	stats["expiringSoon"] = expiringSoon

	// Today's holds
	today := time.Now().Truncate(24 * time.Hour)
	var todayCount int64
	query.Where("status = ? AND hold_at >= ?", "ACTIVE", today).Count(&todayCount)
	stats["todayHolds"] = todayCount

	return stats, nil
}
