package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReturnsService handles sales returns and credit notes
type ReturnsService struct {
	db *gorm.DB
}

// NewReturnsService creates a new returns service
func NewReturnsService(db *gorm.DB) *ReturnsService {
	return &ReturnsService{db: db}
}

// SalesReturn represents a credit note
type SalesReturn struct {
	ID                  string     `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReturnNumber        string     `json:"returnNumber" gorm:"column:return_number;unique;not null"`
	OriginalInvoiceID   string     `json:"originalInvoiceId" gorm:"column:original_invoice_id;not null"`
	OriginalInvoiceNo   string     `json:"originalInvoiceNo" gorm:"column:original_invoice_no;not null"`
	OriginalInvoiceDate *time.Time `json:"originalInvoiceDate" gorm:"column:original_invoice_date"`
	CustomerID          *string    `json:"customerId" gorm:"column:customer_id"`
	CustomerName        string     `json:"customerName" gorm:"column:customer_name"`
	CustomerPhone       string     `json:"customerPhone" gorm:"column:customer_phone"`
	CustomerGSTIN       string     `json:"customerGstin" gorm:"column:customer_gstin"`
	ReturnDate          time.Time  `json:"returnDate" gorm:"column:return_date;default:now()"`
	ReturnReason        string     `json:"returnReason" gorm:"column:return_reason"`
	ReturnReasonNotes   string     `json:"returnReasonNotes" gorm:"column:return_reason_notes"`
	Subtotal            float64    `json:"subtotal" gorm:"column:subtotal;default:0"`
	DiscountAmount      float64    `json:"discountAmount" gorm:"column:discount_amount;default:0"`
	TaxAmount           float64    `json:"taxAmount" gorm:"column:tax_amount;default:0"`
	TotalAmount         float64    `json:"totalAmount" gorm:"column:total_amount;not null"`
	RefundMethod        string     `json:"refundMethod" gorm:"column:refund_method"`
	RefundStatus        string     `json:"refundStatus" gorm:"column:refund_status;default:'PENDING'"`
	RefundAmount        float64    `json:"refundAmount" gorm:"column:refund_amount;default:0"`
	RefundReference     string     `json:"refundReference" gorm:"column:refund_reference"`
	RefundedAt          *time.Time `json:"refundedAt" gorm:"column:refunded_at"`
	RequiresApproval    bool       `json:"requiresApproval" gorm:"column:requires_approval;default:false"`
	ApprovedBy          string     `json:"approvedBy" gorm:"column:approved_by"`
	ApprovalTimestamp   *time.Time `json:"approvalTimestamp" gorm:"column:approval_timestamp"`
	ApprovalNotes       string     `json:"approvalNotes" gorm:"column:approval_notes"`
	Status              string     `json:"status" gorm:"column:status;default:'COMPLETED'"`
	CGSTAmount          float64    `json:"cgstAmount" gorm:"column:cgst_amount;default:0"`
	SGSTAmount          float64    `json:"sgstAmount" gorm:"column:sgst_amount;default:0"`
	IGSTAmount          float64    `json:"igstAmount" gorm:"column:igst_amount;default:0"`
	CreatedBy           string     `json:"createdBy" gorm:"column:created_by"`
	CreatedAt           time.Time  `json:"createdAt" gorm:"column:created_at;default:now()"`
	UpdatedAt           time.Time  `json:"updatedAt" gorm:"column:updated_at;default:now()"`
}

// TableName specifies the table name
func (SalesReturn) TableName() string {
	return "sales_returns"
}

// SalesReturnItem represents an item in a return
type SalesReturnItem struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReturnID           string    `json:"returnId" gorm:"column:return_id;not null"`
	ProductID          *string   `json:"productId" gorm:"column:product_id"`
	ProductName        string    `json:"productName" gorm:"column:product_name"`
	SKU                string    `json:"sku" gorm:"column:sku"`
	BatchID            *string   `json:"batchId" gorm:"column:batch_id"`
	BatchNumber        string    `json:"batchNumber" gorm:"column:batch_number"`
	OriginalSaleItemID *string   `json:"originalSaleItemId" gorm:"column:original_sale_item_id"`
	QuantitySold       float64   `json:"quantitySold" gorm:"column:quantity_sold;not null"`
	QuantityReturned   float64   `json:"quantityReturned" gorm:"column:quantity_returned;not null"`
	ItemCondition      string    `json:"itemCondition" gorm:"column:item_condition"`
	UnitPrice          float64   `json:"unitPrice" gorm:"column:unit_price;not null"`
	DiscountAmount     float64   `json:"discountAmount" gorm:"column:discount_amount;default:0"`
	DiscountPercent    float64   `json:"discountPercent" gorm:"column:discount_percent;default:0"`
	TaxableAmount      float64   `json:"taxableAmount" gorm:"column:taxable_amount;default:0"`
	TaxPercent         float64   `json:"taxPercent" gorm:"column:tax_percent;default:0"`
	TaxAmount          float64   `json:"taxAmount" gorm:"column:tax_amount;default:0"`
	TotalAmount        float64   `json:"totalAmount" gorm:"column:total_amount;not null"`
	StockAdjusted      bool      `json:"stockAdjusted" gorm:"column:stock_adjusted;default:false"`
	StockAdjustmentID  *string   `json:"stockAdjustmentId" gorm:"column:stock_adjustment_id"`
	CreatedAt          time.Time `json:"createdAt" gorm:"column:created_at;default:now()"`
}

// TableName specifies the table name
func (SalesReturnItem) TableName() string {
	return "sales_return_items"
}

// CreateReturnRequest represents the request to create a return
type CreateReturnRequest struct {
	OriginalInvoiceNo string              `json:"originalInvoiceNo"`
	ReturnReason      string              `json:"returnReason"`
	ReturnReasonNotes string              `json:"returnReasonNotes"`
	RefundMethod      string              `json:"refundMethod"`
	Items             []ReturnItemRequest `json:"items"`
	CreatedBy         string              `json:"createdBy"`
}

// ReturnItemRequest represents an item to be returned
type ReturnItemRequest struct {
	ProductID        string  `json:"productId"`
	BatchID          string  `json:"batchId"`
	QuantityReturned float64 `json:"quantityReturned"`
	ItemCondition    string  `json:"itemCondition"`
}

// CreateReturn creates a new sales return
func (s *ReturnsService) CreateReturn(req CreateReturnRequest) (*SalesReturn, error) {
	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Fetch original invoice
	var invoice struct {
		ID            string    `gorm:"column:id"`
		InvoiceNo     string    `gorm:"column:invoice_no"`
		InvoiceDate   time.Time `gorm:"column:invoice_date"`
		CustomerID    *string   `gorm:"column:customer_id"`
		CustomerName  string    `gorm:"column:customer_name"`
		CustomerPhone string    `gorm:"column:customer_phone"`
		CustomerGSTIN string    `gorm:"column:customer_gst_number"`
		TotalAmount   float64   `gorm:"column:total_amount"`
		PaymentStatus string    `gorm:"column:payment_status"`
	}

	err := tx.Table("sales_invoices").
		Where("invoice_no = ?", req.OriginalInvoiceNo).
		First(&invoice).Error

	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("original invoice not found: %v", err)
	}

	// 2. Check return time window (30 days default)
	daysSinceInvoice := time.Since(invoice.InvoiceDate).Hours() / 24
	requiresApproval := daysSinceInvoice > 30

	// 3. Validate and fetch return items
	returnItems := []SalesReturnItem{}
	var subtotal, totalTax, totalAmount float64

	for _, itemReq := range req.Items {
		// Fetch original sale item
		var saleItem struct {
			ID              string  `gorm:"column:id"`
			ProductID       string  `gorm:"column:product_id"`
			ProductName     string  `gorm:"column:product_name"`
			SKU             string  `gorm:"column:sku"`
			BatchID         string  `gorm:"column:batch_id"`
			BatchNumber     string  `gorm:"column:batch_number"`
			Quantity        float64 `gorm:"column:quantity"`
			UnitPrice       float64 `gorm:"column:unit_price"`
			DiscountAmount  float64 `gorm:"column:discount_amount"`
			DiscountPercent float64 `gorm:"column:discount_percent"`
			TaxPercent      float64 `gorm:"column:tax_percent"`
			TaxAmount       float64 `gorm:"column:tax_amount"`
			TotalPrice      float64 `gorm:"column:total_price"`
		}

		err := tx.Table("sales_invoice_items").
			Where("invoice_id = ? AND product_id = ? AND batch_id = ?",
				invoice.ID, itemReq.ProductID, itemReq.BatchID).
			First(&saleItem).Error

		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("sale item not found for product %s", itemReq.ProductID)
		}

		// Validate quantity
		if itemReq.QuantityReturned > saleItem.Quantity {
			tx.Rollback()
			return nil, fmt.Errorf("return quantity (%v) exceeds sold quantity (%v) for %s",
				itemReq.QuantityReturned, saleItem.Quantity, saleItem.ProductName)
		}

		// Calculate proportional amounts
		ratio := itemReq.QuantityReturned / saleItem.Quantity
		itemTotal := saleItem.TotalPrice * ratio
		itemTax := saleItem.TaxAmount * ratio
		itemDiscount := saleItem.DiscountAmount * ratio
		itemTaxable := itemTotal - itemTax

		subtotal += itemTotal - itemTax
		totalTax += itemTax
		totalAmount += itemTotal

		returnItem := SalesReturnItem{
			ReturnID:           "", // Will be set after creating return
			ProductID:          &saleItem.ProductID,
			ProductName:        saleItem.ProductName,
			SKU:                saleItem.SKU,
			BatchID:            &saleItem.BatchID,
			BatchNumber:        saleItem.BatchNumber,
			OriginalSaleItemID: &saleItem.ID,
			QuantitySold:       saleItem.Quantity,
			QuantityReturned:   itemReq.QuantityReturned,
			ItemCondition:      itemReq.ItemCondition,
			UnitPrice:          saleItem.UnitPrice,
			DiscountAmount:     itemDiscount,
			DiscountPercent:    saleItem.DiscountPercent,
			TaxableAmount:      itemTaxable,
			TaxPercent:         saleItem.TaxPercent,
			TaxAmount:          itemTax,
			TotalAmount:        itemTotal,
		}

		returnItems = append(returnItems, returnItem)
	}

	// 4. Check if requires approval (high value or late return)
	if totalAmount > 5000 {
		requiresApproval = true
	}

	// 5. Generate return number
	returnNumber := fmt.Sprintf("CN-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])

	// 6. Create sales return
	salesReturn := &SalesReturn{
		ReturnNumber:        returnNumber,
		OriginalInvoiceID:   invoice.ID,
		OriginalInvoiceNo:   invoice.InvoiceNo,
		OriginalInvoiceDate: &invoice.InvoiceDate,
		CustomerID:          invoice.CustomerID,
		CustomerName:        invoice.CustomerName,
		CustomerPhone:       invoice.CustomerPhone,
		CustomerGSTIN:       invoice.CustomerGSTIN,
		ReturnDate:          time.Now(),
		ReturnReason:        req.ReturnReason,
		ReturnReasonNotes:   req.ReturnReasonNotes,
		Subtotal:            subtotal,
		TaxAmount:           totalTax,
		TotalAmount:         totalAmount,
		RefundMethod:        req.RefundMethod,
		RefundStatus:        "PENDING",
		RequiresApproval:    requiresApproval,
		Status:              "COMPLETED",
		CreatedBy:           req.CreatedBy,
	}

	if err := tx.Create(salesReturn).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create return: %v", err)
	}

	// 7. Create return items
	for i := range returnItems {
		returnItems[i].ReturnID = salesReturn.ID
		if err := tx.Create(&returnItems[i]).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create return item: %v", err)
		}

		// 8. Adjust stock based on item condition
		if returnItems[i].ItemCondition == "RESALABLE" {
			// Add back to inventory
			err := tx.Exec(`
				UPDATE inventory_batches 
				SET available_quantity = available_quantity + ?,
				    updated_at = NOW()
				WHERE id = ?`,
				returnItems[i].QuantityReturned,
				*returnItems[i].BatchID).Error

			if err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to adjust stock: %v", err)
			}

			// Mark stock as adjusted
			tx.Model(&returnItems[i]).Update("stock_adjusted", true)
		}
		// For DAMAGED, EXPIRED, OPENED - don't add back to saleable stock
	}

	// 9. Update invoice payment status if refund affects it
	// (Optional: implement refund accounting logic here)

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return salesReturn, nil
}

// GetReturns retrieves returns with filters
func (s *ReturnsService) GetReturns(customerID, status, refundStatus string, dateFrom, dateTo *time.Time, page, limit int) ([]SalesReturn, int64, error) {
	var returns []SalesReturn
	var total int64

	query := s.db.Model(&SalesReturn{})

	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if refundStatus != "" && refundStatus != "all" {
		query = query.Where("refund_status = ?", refundStatus)
	}
	if dateFrom != nil {
		query = query.Where("return_date >= ?", dateFrom)
	}
	if dateTo != nil {
		query = query.Where("return_date <= ?", dateTo)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("return_date DESC").Offset(offset).Limit(limit).Find(&returns).Error; err != nil {
		return nil, 0, err
	}

	return returns, total, nil
}

// GetReturnByID retrieves a return with its items
func (s *ReturnsService) GetReturnByID(id string) (*SalesReturn, []SalesReturnItem, error) {
	var returnDoc SalesReturn
	if err := s.db.Where("id = ?", id).First(&returnDoc).Error; err != nil {
		return nil, nil, err
	}

	var items []SalesReturnItem
	if err := s.db.Where("return_id = ?", id).Find(&items).Error; err != nil {
		return nil, nil, err
	}

	return &returnDoc, items, nil
}

// ApproveReturn approves a return that requires approval
func (s *ReturnsService) ApproveReturn(id, approvedBy, notes string) error {
	now := time.Now()
	return s.db.Model(&SalesReturn{}).
		Where("id = ? AND requires_approval = true", id).
		Updates(map[string]interface{}{
			"approved_by":        approvedBy,
			"approval_timestamp": now,
			"approval_notes":     notes,
			"updated_at":         now,
		}).Error
}

// ProcessRefund marks refund as completed
func (s *ReturnsService) ProcessRefund(id, refundReference string) error {
	now := time.Now()
	return s.db.Model(&SalesReturn{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"refund_status":    "COMPLETED",
			"refund_reference": refundReference,
			"refunded_at":      now,
			"updated_at":       now,
		}).Error
}

// GetReturnStats returns statistics
func (s *ReturnsService) GetReturnStats(dateFrom, dateTo *time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := s.db.Model(&SalesReturn{})
	if dateFrom != nil {
		query = query.Where("return_date >= ?", dateFrom)
	}
	if dateTo != nil {
		query = query.Where("return_date <= ?", dateTo)
	}

	var totalReturns int64
	query.Count(&totalReturns)
	stats["totalReturns"] = totalReturns

	var totalValue float64
	query.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalValue)
	stats["totalValue"] = totalValue

	var pendingApproval int64
	query.Where("requires_approval = true AND approval_timestamp IS NULL").Count(&pendingApproval)
	stats["pendingApproval"] = pendingApproval

	var pendingRefund int64
	query.Where("refund_status = ?", "PENDING").Count(&pendingRefund)
	stats["pendingRefund"] = pendingRefund

	return stats, nil
}
