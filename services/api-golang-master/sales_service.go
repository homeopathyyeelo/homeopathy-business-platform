package main

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ==================== SALES & INVOICING MODELS ====================

// Invoice represents sales invoices
type Invoice struct {
	BaseEntity
	InvoiceNumber     string    `gorm:"not null;uniqueIndex;size:100" json:"invoice_number" validate:"required"`
	CustomerID        string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	Customer          Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	InvoiceDate       time.Time `gorm:"not null" json:"invoice_date"`
	DueDate           time.Time `gorm:"not null" json:"due_date"`
	Subtotal          float64   `gorm:"type:decimal(15,2);not null;default:0" json:"subtotal" validate:"min=0"`
	TaxAmount         float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	DiscountAmount    float64   `gorm:"type:decimal(15,2);not null;default:0" json:"discount_amount" validate:"min=0"`
	TotalAmount       float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	PaidAmount        float64   `gorm:"type:decimal(15,2);not null;default:0" json:"paid_amount" validate:"min=0"`
	OutstandingAmount float64   `gorm:"type:decimal(15,2);not null;default:0" json:"outstanding_amount" validate:"min=0"`
	Status            string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft confirmed cancelled paid overdue"`
	PaymentStatus     string    `gorm:"not null;default:unpaid;size:20" json:"payment_status" validate:"oneof=unpaid partial_paid paid refunded"`
	PaymentTerms      string    `gorm:"size:100" json:"payment_terms"`
	Notes             string    `gorm:"type:text" json:"notes"`
	Items             []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"items"`
	Payments          []Payment     `gorm:"foreignKey:InvoiceID" json:"payments"`
	SalesmanID        string        `gorm:"index" json:"salesman_id"`
	CreatedBy         string        `gorm:"not null;size:255" json:"created_by" validate:"required"`
	ApprovedBy        string        `gorm:"size:255" json:"approved_by"`
	ApprovedAt        *time.Time    `gorm:"null" json:"approved_at"`
	ShippedAt         *time.Time    `gorm:"null" json:"shipped_at"`
	CancelledAt       *time.Time    `gorm:"null" json:"cancelled_at"`
	InvoiceSeriesID   string        `gorm:"index" json:"invoice_series_id"`
}

// InvoiceItem represents individual items in an invoice
type InvoiceItem struct {
	BaseEntity
	InvoiceID     string    `gorm:"not null;index" json:"invoice_id"`
	ProductID     string    `gorm:"not null;index" json:"product_id" validate:"required"`
	Product       Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductName   string    `gorm:"not null;size:255" json:"product_name" validate:"required"`
	ProductCode   string    `gorm:"size:100" json:"product_code"`
	Quantity      int       `gorm:"not null;default:1" json:"quantity" validate:"min=1"`
	UnitPrice     float64   `gorm:"type:decimal(15,2);not null;default:0" json:"unit_price" validate:"min=0"`
	DiscountPercent float64 `gorm:"default:0;check:discount >= 0 AND discount <= 100" json:"discount_percent" validate:"min=0,max=100"`
	DiscountAmount float64  `gorm:"type:decimal(15,2);not null;default:0" json:"discount_amount" validate:"min=0"`
	TaxPercent    float64   `gorm:"default:0;check:tax >= 0 AND tax <= 100" json:"tax_percent" validate:"min=0,max=100"`
	TaxAmount     float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	TotalAmount   float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	BatchNumber   string    `gorm:"size:100" json:"batch_number"`
	ExpiryDate    *time.Time `gorm:"null" json:"expiry_date"`
}

// Payment represents payments made against invoices
type Payment struct {
	BaseEntity
	InvoiceID       string    `gorm:"not null;index" json:"invoice_id"`
	PaymentDate     time.Time `gorm:"not null" json:"payment_date"`
	Amount          float64   `gorm:"type:decimal(15,2);not null;default:0" json:"amount" validate:"min=0"`
	PaymentMethod   string    `gorm:"not null;size:50" json:"payment_method" validate:"required"`
	PaymentReference string   `gorm:"size:255" json:"payment_reference"`
	Notes           string    `gorm:"type:text" json:"notes"`
	ProcessedBy     string    `gorm:"not null;size:255" json:"processed_by" validate:"required"`
	Status          string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending completed failed refunded"`
	BankReference   string    `gorm:"size:255" json:"bank_reference"`
	GatewayResponse map[string]interface{} `gorm:"type:jsonb" json:"gateway_response"`
}

// SalesOrder represents sales orders/quotations
type SalesOrder struct {
	BaseEntity
	OrderNumber     string    `gorm:"not null;uniqueIndex;size:100" json:"order_number" validate:"required"`
	CustomerID      string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	Customer        Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	OrderDate       time.Time `gorm:"not null" json:"order_date"`
	DeliveryDate    *time.Time `gorm:"null" json:"delivery_date"`
	Subtotal        float64   `gorm:"type:decimal(15,2);not null;default:0" json:"subtotal" validate:"min=0"`
	TaxAmount       float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	DiscountAmount  float64   `gorm:"type:decimal(15,2);not null;default:0" json:"discount_amount" validate:"min=0"`
	TotalAmount     float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	Status          string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft confirmed shipped delivered cancelled"`
	PaymentStatus   string    `gorm:"not null;default:unpaid;size:20" json:"payment_status" validate:"oneof=unpaid partial_paid paid"`
	PaymentTerms    string    `gorm:"size:100" json:"payment_terms"`
	Notes           string    `gorm:"type:text" json:"notes"`
	Items           []SalesOrderItem `gorm:"foreignKey:SalesOrderID" json:"items"`
	SalesmanID      string    `gorm:"index" json:"salesman_id"`
	CreatedBy       string    `gorm:"not null;size:255" json:"created_by" validate:"required"`
}

// SalesOrderItem represents individual items in a sales order
type SalesOrderItem struct {
	BaseEntity
	SalesOrderID   string    `gorm:"not null;index" json:"sales_order_id"`
	ProductID      string    `gorm:"not null;index" json:"product_id" validate:"required"`
	Product        Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductName    string    `gorm:"not null;size:255" json:"product_name" validate:"required"`
	ProductCode    string    `gorm:"size:100" json:"product_code"`
	Quantity       int       `gorm:"not null;default:1" json:"quantity" validate:"min=1"`
	UnitPrice      float64   `gorm:"type:decimal(15,2);not null;default:0" json:"unit_price" validate:"min=0"`
	DiscountPercent float64 `gorm:"default:0;check:discount >= 0 AND discount <= 100" json:"discount_percent" validate:"min=0,max=100"`
	DiscountAmount float64   `gorm:"type:decimal(15,2);not null;default:0" json:"discount_amount" validate:"min=0"`
	TaxPercent     float64   `gorm:"default:0;check:tax >= 0 AND tax <= 100" json:"tax_percent" validate:"min=0,max=100"`
	TaxAmount      float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	TotalAmount    float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	BatchNumber    string    `gorm:"size:100" json:"batch_number"`
	ExpiryDate     *time.Time `gorm:"null" json:"expiry_date"`
}

// Return represents sales returns and credit notes
type Return struct {
	BaseEntity
	ReturnNumber     string    `gorm:"not null;uniqueIndex;size:100" json:"return_number" validate:"required"`
	InvoiceID        string    `gorm:"not null;index" json:"invoice_id" validate:"required"`
	Invoice          Invoice   `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
	CustomerID       string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	Customer         Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	ReturnDate       time.Time `gorm:"not null" json:"return_date"`
	Reason           string    `gorm:"not null;size:255" json:"reason" validate:"required"`
	Subtotal         float64   `gorm:"type:decimal(15,2);not null;default:0" json:"subtotal" validate:"min=0"`
	TaxAmount        float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	TotalAmount      float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	Status           string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending approved rejected completed"`
	ApprovedBy       string    `gorm:"size:255" json:"approved_by"`
	ApprovedAt       *time.Time `gorm:"null" json:"approved_at"`
	ProcessedBy      string    `gorm:"size:255" json:"processed_by"`
	ProcessedAt      *time.Time `gorm:"null" json:"processed_at"`
	Items            []ReturnItem `gorm:"foreignKey:ReturnID" json:"items"`
	RefundMethod     string    `gorm:"size:50" json:"refund_method"`
	RefundReference  string    `gorm:"size:255" json:"refund_reference"`
	Notes            string    `gorm:"type:text" json:"notes"`
}

// ReturnItem represents individual items in a return
type ReturnItem struct {
	BaseEntity
	ReturnID      string    `gorm:"not null;index" json:"return_id"`
	InvoiceItemID string    `gorm:"not null;index" json:"invoice_item_id" validate:"required"`
	ProductID     string    `gorm:"not null;index" json:"product_id" validate:"required"`
	Product       Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductName   string    `gorm:"not null;size:255" json:"product_name" validate:"required"`
	Quantity      int       `gorm:"not null;default:1" json:"quantity" validate:"min=1"`
	UnitPrice     float64   `gorm:"type:decimal(15,2);not null;default:0" json:"unit_price" validate:"min=0"`
	DiscountAmount float64  `gorm:"type:decimal(15,2);not null;default:0" json:"discount_amount" validate:"min=0"`
	TaxAmount     float64   `gorm:"type:decimal(15,2);not null;default:0" json:"tax_amount" validate:"min=0"`
	TotalAmount   float64   `gorm:"type:decimal(15,2);not null;default:0" json:"total_amount" validate:"min=0"`
	Reason        string    `gorm:"not null;size:255" json:"reason" validate:"required"`
	Condition     string    `gorm:"not null;size:50" json:"condition" validate:"required"`
}

// InvoiceSeries represents different invoice numbering series
type InvoiceSeries struct {
	BaseEntity
	Name           string `gorm:"not null;uniqueIndex;size:100" json:"name" validate:"required"`
	Prefix         string `gorm:"not null;size:20" json:"prefix" validate:"required"`
	CurrentNumber  int    `gorm:"not null;default:1" json:"current_number" validate:"min=1"`
	StartingNumber int    `gorm:"not null;default:1" json:"starting_number" validate:"min=1"`
	IsActive       bool   `gorm:"default:true" json:"is_active"`
	Description    string `gorm:"type:text" json:"description"`
}

// SalesmanCommission represents commission tracking for salesmen
type SalesmanCommission struct {
	BaseEntity
	SalesmanID     string    `gorm:"not null;index" json:"salesman_id" validate:"required"`
	SalesmanName   string    `gorm:"not null;size:255" json:"salesman_name" validate:"required"`
	InvoiceID      string    `gorm:"not null;index" json:"invoice_id" validate:"required"`
	Invoice        Invoice   `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
	CommissionAmount float64 `gorm:"type:decimal(15,2);not null;default:0" json:"commission_amount" validate:"min=0"`
	CommissionPercent float64 `gorm:"not null;default:0;check:percent >= 0 AND percent <= 100" json:"commission_percent" validate:"min=0,max=100"`
	CalculationBasis string `gorm:"not null;size:50" json:"calculation_basis" validate:"required"`
	Status         string `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending approved paid rejected"`
	ApprovedBy     string `gorm:"size:255" json:"approved_by"`
	ApprovedAt     *time.Time `gorm:"null" json:"approved_at"`
	PaidAt         *time.Time `gorm:"null" json:"paid_at"`
	PaymentReference string `gorm:"size:255" json:"payment_reference"`
	Notes          string `gorm:"type:text" json:"notes"`
}

// ==================== SALES SERVICE ====================

type SalesService struct {
	db    *GORMDatabase
	cache *CacheService
}

func NewSalesService(db *GORMDatabase, cache *CacheService) *SalesService {
	return &SalesService{db: db, cache: cache}
}

// ==================== INVOICE CRUD OPERATIONS ====================

func (s *SalesService) GetInvoiceByID(ctx context.Context, id string) (*Invoice, error) {
	cacheKey := fmt.Sprintf("invoice:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if invoice, ok := cached.(*Invoice); ok {
			return invoice, nil
		}
	}

	var invoice Invoice
	if err := s.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Preload("Payments").
		Where("id = ? AND is_active = ?", id, true).
		First(&invoice).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &invoice, 5*time.Minute)
	return &invoice, nil
}

func (s *SalesService) GetInvoices(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Invoice, int64, error) {
	var invoices []Invoice
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Customer").
		Model(&Invoice{}).
		Where("is_active = ?", true)

	// Apply filters
	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if paymentStatus, ok := filters["payment_status"].(string); ok && paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if salesmanID, ok := filters["salesman_id"].(string); ok && salesmanID != "" {
		query = query.Where("salesman_id = ?", salesmanID)
	}
	if startDate, ok := filters["start_date"].(time.Time); ok {
		query = query.Where("invoice_date >= ?", startDate)
	}
	if endDate, ok := filters["end_date"].(time.Time); ok {
		query = query.Where("invoice_date <= ?", endDate)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("invoice_number ILIKE ? OR customer_id IN (SELECT id FROM customers WHERE name ILIKE ?)",
			"%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count invoices: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&invoices).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get invoices: %w", err)
	}

	return invoices, total, nil
}

func (s *SalesService) CreateInvoice(ctx context.Context, invoice *Invoice) (*Invoice, error) {
	// Generate invoice number from series
	if invoice.InvoiceSeriesID != "" {
		series, err := s.GetInvoiceSeriesByID(ctx, invoice.InvoiceSeriesID)
		if err != nil {
			return nil, fmt.Errorf("failed to get invoice series: %w", err)
		}
		invoice.InvoiceNumber = fmt.Sprintf("%s%06d", series.Prefix, series.CurrentNumber)
		series.CurrentNumber++
		if err := s.db.DB.WithContext(ctx).Save(series).Error; err != nil {
			return nil, fmt.Errorf("failed to update invoice series: %w", err)
		}
	}

	// Calculate totals
	for i := range invoice.Items {
		item := &invoice.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	invoice.Subtotal = 0
	invoice.TaxAmount = 0
	invoice.TotalAmount = 0

	for _, item := range invoice.Items {
		invoice.Subtotal += item.Quantity * item.UnitPrice
		invoice.TaxAmount += item.TaxAmount
		invoice.TotalAmount += item.TotalAmount
	}

	invoice.OutstandingAmount = invoice.TotalAmount

	if err := s.db.DB.WithContext(ctx).Create(invoice).Error; err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	// Clear cache for related data
	s.cache.DeletePattern(ctx, "invoices:*")

	return invoice, nil
}

func (s *SalesService) UpdateInvoice(ctx context.Context, id string, invoice *Invoice) (*Invoice, error) {
	existing, err := s.GetInvoiceByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("invoice not found")
	}

	// Prevent editing if invoice is already issued
	if existing.Status == "confirmed" || existing.Status == "paid" {
		return nil, fmt.Errorf("cannot edit issued invoice")
	}

	// Calculate totals
	for i := range invoice.Items {
		item := &invoice.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	invoice.Subtotal = 0
	invoice.TaxAmount = 0
	invoice.TotalAmount = 0

	for _, item := range invoice.Items {
		invoice.Subtotal += item.Quantity * item.UnitPrice
		invoice.TaxAmount += item.TaxAmount
		invoice.TotalAmount += item.TotalAmount
	}

	invoice.OutstandingAmount = invoice.TotalAmount - existing.PaidAmount

	if err := s.db.DB.WithContext(ctx).Save(invoice).Error; err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// Clear cache
	s.cache.DeletePattern(ctx, "invoices:*")

	return invoice, nil
}

// ==================== SALES ORDER OPERATIONS ====================

func (s *SalesService) GetSalesOrderByID(ctx context.Context, id string) (*SalesOrder, error) {
	cacheKey := fmt.Sprintf("sales_order:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if order, ok := cached.(*SalesOrder); ok {
			return order, nil
		}
	}

	var order SalesOrder
	if err := s.db.DB.WithContext(ctx).
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Where("id = ? AND is_active = ?", id, true).
		First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get sales order: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &order, 5*time.Minute)
	return &order, nil
}

func (s *SalesService) GetSalesOrders(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]SalesOrder, int64, error) {
	var orders []SalesOrder
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Customer").
		Model(&SalesOrder{}).
		Where("is_active = ?", true)

	// Apply filters
	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count sales orders: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get sales orders: %w", err)
	}

	return orders, total, nil
}

func (s *SalesService) CreateSalesOrder(ctx context.Context, order *SalesOrder) (*SalesOrder, error) {
	// Calculate totals
	for i := range order.Items {
		item := &order.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
		item.DiscountAmount = (item.TotalAmount * item.DiscountPercent) / 100
		item.TaxAmount = ((item.TotalAmount - item.DiscountAmount) * item.TaxPercent) / 100
		item.TotalAmount = item.TotalAmount - item.DiscountAmount + item.TaxAmount
	}

	order.Subtotal = 0
	order.TaxAmount = 0
	order.TotalAmount = 0

	for _, item := range order.Items {
		order.Subtotal += item.Quantity * item.UnitPrice
		order.TaxAmount += item.TaxAmount
		order.TotalAmount += item.TotalAmount
	}

	if err := s.db.DB.WithContext(ctx).Create(order).Error; err != nil {
		return nil, fmt.Errorf("failed to create sales order: %w", err)
	}

	// Clear cache
	s.cache.DeletePattern(ctx, "sales_orders:*")

	return order, nil
}

func (s *SalesService) ConvertOrderToInvoice(ctx context.Context, orderID string) (*Invoice, error) {
	order, err := s.GetSalesOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, fmt.Errorf("sales order not found")
	}

	invoice := &Invoice{
		CustomerID:     order.CustomerID,
		InvoiceDate:    time.Now(),
		DueDate:        time.Now().AddDate(0, 0, 30), // 30 days
		Status:         "draft",
		PaymentStatus:  "unpaid",
		CreatedBy:      order.CreatedBy,
		SalesmanID:     order.SalesmanID,
		Items:          make([]InvoiceItem, len(order.Items)),
	}

	// Convert order items to invoice items
	for i, item := range order.Items {
		invoice.Items[i] = InvoiceItem{
			ProductID:       item.ProductID,
			ProductName:     item.ProductName,
			ProductCode:     item.ProductCode,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			DiscountPercent: item.DiscountPercent,
			DiscountAmount:  item.DiscountAmount,
			TaxPercent:      item.TaxPercent,
			TaxAmount:       item.TaxAmount,
			TotalAmount:     item.TotalAmount,
			BatchNumber:     item.BatchNumber,
			ExpiryDate:      item.ExpiryDate,
		}
	}

	return s.CreateInvoice(ctx, invoice)
}

// ==================== INVOICE SERIES OPERATIONS ====================

func (s *SalesService) GetInvoiceSeriesByID(ctx context.Context, id string) (*InvoiceSeries, error) {
	var series InvoiceSeries
	if err := s.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&series).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get invoice series: %w", err)
	}
	return &series, nil
}

func (s *SalesService) GetInvoiceSeries(ctx context.Context) ([]InvoiceSeries, error) {
	var series []InvoiceSeries
	if err := s.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("name").Find(&series).Error; err != nil {
		return nil, fmt.Errorf("failed to get invoice series: %w", err)
	}
	return series, nil
}

func (s *SalesService) CreateInvoiceSeries(ctx context.Context, series *InvoiceSeries) (*InvoiceSeries, error) {
	if err := s.db.DB.WithContext(ctx).Create(series).Error; err != nil {
		return nil, fmt.Errorf("failed to create invoice series: %w", err)
	}
	return series, nil
}

// ==================== PAYMENT OPERATIONS ====================

func (s *SalesService) CreatePayment(ctx context.Context, payment *Payment) (*Payment, error) {
	// Get the invoice to update outstanding amount
	invoice, err := s.GetInvoiceByID(ctx, payment.InvoiceID)
	if err != nil {
		return nil, err
	}
	if invoice == nil {
		return nil, fmt.Errorf("invoice not found")
	}

	// Update invoice paid amount and payment status
	invoice.PaidAmount += payment.Amount
	invoice.OutstandingAmount = invoice.TotalAmount - invoice.PaidAmount

	if invoice.OutstandingAmount <= 0 {
		invoice.PaymentStatus = "paid"
		invoice.OutstandingAmount = 0
	} else if invoice.PaidAmount > 0 {
		invoice.PaymentStatus = "partial_paid"
	}

	// Save payment and invoice in transaction
	tx := s.db.DB.WithContext(ctx).Begin()
	if err := tx.Create(payment).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	if err := tx.Save(invoice).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	tx.Commit()

	// Clear cache
	s.cache.DeletePattern(ctx, "invoices:*")

	return payment, nil
}

// ==================== RETURN OPERATIONS ====================

func (s *SalesService) GetReturnByID(ctx context.Context, id string) (*Return, error) {
	cacheKey := fmt.Sprintf("return:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if returnRecord, ok := cached.(*Return); ok {
			return returnRecord, nil
		}
	}

	var returnRecord Return
	if err := s.db.DB.WithContext(ctx).
		Preload("Invoice").
		Preload("Customer").
		Preload("Items").
		Preload("Items.Product").
		Where("id = ? AND is_active = ?", id, true).
		First(&returnRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get return: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &returnRecord, 5*time.Minute)
	return &returnRecord, nil
}

func (s *SalesService) CreateReturn(ctx context.Context, returnRecord *Return) (*Return, error) {
	// Calculate totals
	for i := range returnRecord.Items {
		item := &returnRecord.Items[i]
		item.TotalAmount = item.Quantity * item.UnitPrice
	}

	returnRecord.Subtotal = 0
	returnRecord.TaxAmount = 0
	returnRecord.TotalAmount = 0

	for _, item := range returnRecord.Items {
		returnRecord.Subtotal += item.Quantity * item.UnitPrice
		returnRecord.TaxAmount += item.TaxAmount
		returnRecord.TotalAmount += item.TotalAmount
	}

	if err := s.db.DB.WithContext(ctx).Create(returnRecord).Error; err != nil {
		return nil, fmt.Errorf("failed to create return: %w", err)
	}

	// Clear cache
	s.cache.DeletePattern(ctx, "returns:*")

	return returnRecord, nil
}

// ==================== COMMISSION OPERATIONS ====================

func (s *SalesService) GetCommissions(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]SalesmanCommission, int64, error) {
	var commissions []SalesmanCommission
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Invoice").
		Model(&SalesmanCommission{}).
		Where("is_active = ?", true)

	// Apply filters
	if salesmanID, ok := filters["salesman_id"].(string); ok && salesmanID != "" {
		query = query.Where("salesman_id = ?", salesmanID)
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count commissions: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&commissions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get commissions: %w", err)
	}

	return commissions, total, nil
}

func (s *SalesService) CreateCommission(ctx context.Context, commission *SalesmanCommission) (*SalesmanCommission, error) {
	if err := s.db.DB.WithContext(ctx).Create(commission).Error; err != nil {
		return nil, fmt.Errorf("failed to create commission: %w", err)
	}
	return commission, nil
}
