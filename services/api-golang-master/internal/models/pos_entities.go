package models

import "time"

// ============================================================================
// POS & GST COMPLIANCE ENTITIES
// ============================================================================

// SalesInvoice represents a POS sales invoice
type SalesInvoice struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	InvoiceNo          string    `json:"invoiceNo" gorm:"uniqueIndex;not null"`
	InvoiceDate        time.Time `json:"invoiceDate" gorm:"not null;default:now()"`
	InvoiceType        string    `json:"invoiceType" gorm:"default:'RETAIL'"` // RETAIL, WHOLESALE, B2B, B2C, EXPORT
	
	// Customer details
	CustomerID         *string   `json:"customerId" gorm:"type:uuid"`
	CustomerName       string    `json:"customerName" gorm:"not null;default:'Walk-in Customer'"`
	CustomerPhone      string    `json:"customerPhone"`
	CustomerEmail      string    `json:"customerEmail"`
	CustomerAddress    string    `json:"customerAddress"`
	CustomerGSTNumber  string    `json:"customerGstNumber"`
	
	// Financial breakdown
	Subtotal           float64   `json:"subtotal" gorm:"not null;default:0"`
	ItemDiscount       float64   `json:"itemDiscount" gorm:"default:0"`
	BillDiscount       float64   `json:"billDiscount" gorm:"default:0"`
	BillDiscountPercent float64  `json:"billDiscountPercent" gorm:"default:0"`
	TotalDiscount      float64   `json:"totalDiscount" gorm:"default:0"`
	TaxableAmount      float64   `json:"taxableAmount" gorm:"not null;default:0"`
	
	// GST breakdown (multi-rate support)
	CGST5Percent       float64   `json:"cgst5Percent" gorm:"default:0"`
	SGST5Percent       float64   `json:"sgst5Percent" gorm:"default:0"`
	IGST5Percent       float64   `json:"igst5Percent" gorm:"default:0"`
	CGST18Percent      float64   `json:"cgst18Percent" gorm:"default:0"`
	SGST18Percent      float64   `json:"sgst18Percent" gorm:"default:0"`
	IGST18Percent      float64   `json:"igst18Percent" gorm:"default:0"`
	TotalGST           float64   `json:"totalGst" gorm:"not null;default:0"`
	
	// Round off and total
	RoundOff           float64   `json:"roundOff" gorm:"default:0"`
	TotalAmount        float64   `json:"totalAmount" gorm:"not null"`
	
	// Payment details
	PaymentMethod      string    `json:"paymentMethod" gorm:"not null;default:'CASH'"` // CASH, CARD, UPI, CREDIT
	PaymentStatus      string    `json:"paymentStatus" gorm:"default:'PAID'"`          // PAID, PARTIAL, PENDING, CREDIT
	AmountPaid         float64   `json:"amountPaid" gorm:"default:0"`
	ChangeAmount       float64   `json:"changeAmount" gorm:"default:0"`
	
	// Additional details
	Notes              string    `json:"notes"`
	PrescriptionNumber string    `json:"prescriptionNumber"`
	DoctorID           *string   `json:"doctorId" gorm:"type:uuid"`
	DoctorName         string    `json:"doctorName"`
	
	// Counter & Staff
	CounterID          string    `json:"counterId"`
	CounterName        string    `json:"counterName"`
	BilledBy           string    `json:"billedBy"`
	
	// E-Invoice & IRN
	IRN                string    `json:"irn"`
	AckNo              string    `json:"ackNo"`
	AckDate            *time.Time `json:"ackDate"`
	EInvoiceGenerated  bool      `json:"eInvoiceGenerated" gorm:"default:false"`
	
	// Status
	Status             string    `json:"status" gorm:"default:'COMPLETED'"` // DRAFT, HELD, COMPLETED, CANCELLED, RETURNED
	CancelledAt        *time.Time `json:"cancelledAt"`
	CancelledBy        string    `json:"cancelledBy"`
	CancellationReason string    `json:"cancellationReason"`
	
	// Tracking
	CreatedBy          string    `json:"createdBy"`
	UpdatedBy          string    `json:"updatedBy"`
	CreatedAt          time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt          time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Customer           *Customer           `json:"customer" gorm:"foreignKey:CustomerID"`
	Items              []SalesInvoiceItem  `json:"items" gorm:"foreignKey:InvoiceID"`
}

func (SalesInvoice) TableName() string { return "sales_invoices" }

// SalesInvoiceItem represents individual items in a sales invoice
type SalesInvoiceItem struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	InvoiceID       string    `json:"invoiceId" gorm:"type:uuid;not null"`
	
	// Product details
	ProductID       string    `json:"productId" gorm:"type:uuid;not null"`
	ProductName     string    `json:"productName" gorm:"not null"`
	SKU             string    `json:"sku"`
	BatchID         *string   `json:"batchId" gorm:"type:uuid"`
	BatchNumber     string    `json:"batchNumber"`
	ExpiryDate      *time.Time `json:"expiryDate"`
	
	// HSN & Category
	HSNCode         string    `json:"hsnCode"`
	Category        string    `json:"category"`
	Brand           string    `json:"brand"`
	Potency         string    `json:"potency"`
	Form            string    `json:"form"`
	
	// Quantity & Pricing
	Quantity        float64   `json:"quantity" gorm:"not null"`
	UnitPrice       float64   `json:"unitPrice" gorm:"not null"`
	MRP             float64   `json:"mrp" gorm:"not null"`
	DiscountPercent float64   `json:"discountPercent" gorm:"default:0"`
	DiscountAmount  float64   `json:"discountAmount" gorm:"default:0"`
	
	// Tax calculation
	TaxableAmount   float64   `json:"taxableAmount" gorm:"not null"`
	GSTRate         float64   `json:"gstRate" gorm:"not null"` // 5 or 18
	CGSTAmount      float64   `json:"cgstAmount" gorm:"default:0"`
	SGSTAmount      float64   `json:"sgstAmount" gorm:"default:0"`
	IGSTAmount      float64   `json:"igstAmount" gorm:"default:0"`
	TotalGST        float64   `json:"totalGst" gorm:"not null"`
	
	// Line total
	LineTotal       float64   `json:"lineTotal" gorm:"not null"`
	
	// Track if item was returned
	ReturnedQuantity float64  `json:"returnedQuantity" gorm:"default:0"`
	IsReturned      bool      `json:"isReturned" gorm:"default:false"`
	
	CreatedAt       time.Time `json:"createdAt" gorm:"default:now()"`
	
	// Relationships
	Invoice         *SalesInvoice   `json:"invoice" gorm:"foreignKey:InvoiceID"`
	Product         *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch           *InventoryBatch `json:"batch" gorm:"foreignKey:BatchID"`
}

func (SalesInvoiceItem) TableName() string { return "sales_invoice_items" }

// SalesReturn represents a sales return/refund
type SalesReturn struct {
	ID                   string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReturnNo             string    `json:"returnNo" gorm:"uniqueIndex;not null"`
	ReturnDate           time.Time `json:"returnDate" gorm:"not null;default:now()"`
	
	// Original invoice reference
	OriginalInvoiceID    *string   `json:"originalInvoiceId" gorm:"type:uuid"`
	OriginalInvoiceNo    string    `json:"originalInvoiceNo"`
	OriginalInvoiceDate  *time.Time `json:"originalInvoiceDate"`
	
	// Customer details
	CustomerID           *string   `json:"customerId" gorm:"type:uuid"`
	CustomerName         string    `json:"customerName" gorm:"not null"`
	CustomerPhone        string    `json:"customerPhone"`
	CustomerGSTNumber    string    `json:"customerGstNumber"`
	
	// Return reason
	ReturnReason         string    `json:"returnReason" gorm:"not null"` // DAMAGED, EXPIRED, WRONG_PRODUCT, CUSTOMER_REQUEST, QUALITY_ISSUE, OTHER
	ReturnRemarks        string    `json:"returnRemarks"`
	
	// Financial breakdown
	Subtotal             float64   `json:"subtotal" gorm:"not null;default:0"`
	TotalDiscount        float64   `json:"totalDiscount" gorm:"default:0"`
	TaxableAmount        float64   `json:"taxableAmount" gorm:"not null;default:0"`
	
	// GST breakdown
	CGST5Percent         float64   `json:"cgst5Percent" gorm:"default:0"`
	SGST5Percent         float64   `json:"sgst5Percent" gorm:"default:0"`
	IGST5Percent         float64   `json:"igst5Percent" gorm:"default:0"`
	CGST18Percent        float64   `json:"cgst18Percent" gorm:"default:0"`
	SGST18Percent        float64   `json:"sgst18Percent" gorm:"default:0"`
	IGST18Percent        float64   `json:"igst18Percent" gorm:"default:0"`
	TotalGST             float64   `json:"totalGst" gorm:"not null;default:0"`
	
	TotalAmount          float64   `json:"totalAmount" gorm:"not null"`
	
	// Refund details
	RefundMethod         string    `json:"refundMethod"` // CASH, CARD, CREDIT_NOTE, BANK_TRANSFER
	RefundStatus         string    `json:"refundStatus" gorm:"default:'PENDING'"` // PENDING, REFUNDED, CREDITED
	RefundDate           *time.Time `json:"refundDate"`
	
	// Credit note reference
	CreditNoteID         *string   `json:"creditNoteId" gorm:"type:uuid"`
	CreditNoteNo         string    `json:"creditNoteNo"`
	
	// Status
	Status               string    `json:"status" gorm:"default:'COMPLETED'"` // DRAFT, COMPLETED, CANCELLED
	
	// Tracking
	ReturnedBy           string    `json:"returnedBy"`
	ApprovedBy           string    `json:"approvedBy"`
	CreatedBy            string    `json:"createdBy"`
	CreatedAt            time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt            time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Customer             *Customer          `json:"customer" gorm:"foreignKey:CustomerID"`
	OriginalInvoice      *SalesInvoice      `json:"originalInvoice" gorm:"foreignKey:OriginalInvoiceID"`
	Items                []SalesReturnItem  `json:"items" gorm:"foreignKey:ReturnID"`
}

func (SalesReturn) TableName() string { return "sales_returns" }

// SalesReturnItem represents individual items in a return
type SalesReturnItem struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReturnID          string    `json:"returnId" gorm:"type:uuid;not null"`
	
	// Original invoice item reference
	OriginalItemID    *string   `json:"originalItemId" gorm:"type:uuid"`
	
	// Product details
	ProductID         string    `json:"productId" gorm:"type:uuid;not null"`
	ProductName       string    `json:"productName" gorm:"not null"`
	SKU               string    `json:"sku"`
	BatchID           *string   `json:"batchId" gorm:"type:uuid"`
	BatchNumber       string    `json:"batchNumber"`
	ExpiryDate        *time.Time `json:"expiryDate"`
	
	// HSN & Category
	HSNCode           string    `json:"hsnCode"`
	
	// Quantity & Pricing
	ReturnedQuantity  float64   `json:"returnedQuantity" gorm:"not null"`
	UnitPrice         float64   `json:"unitPrice" gorm:"not null"`
	DiscountAmount    float64   `json:"discountAmount" gorm:"default:0"`
	
	// Tax calculation
	TaxableAmount     float64   `json:"taxableAmount" gorm:"not null"`
	GSTRate           float64   `json:"gstRate" gorm:"not null"`
	CGSTAmount        float64   `json:"cgstAmount" gorm:"default:0"`
	SGSTAmount        float64   `json:"sgstAmount" gorm:"default:0"`
	IGSTAmount        float64   `json:"igstAmount" gorm:"default:0"`
	TotalGST          float64   `json:"totalGst" gorm:"not null"`
	
	// Line total
	LineTotal         float64   `json:"lineTotal" gorm:"not null"`
	
	// Stock restock flag
	Restocked         bool      `json:"restocked" gorm:"default:false"`
	RestockedAt       *time.Time `json:"restockedAt"`
	
	CreatedAt         time.Time `json:"createdAt" gorm:"default:now()"`
	
	// Relationships
	Return            *SalesReturn       `json:"return" gorm:"foreignKey:ReturnID"`
	Product           *Product           `json:"product" gorm:"foreignKey:ProductID"`
	Batch             *InventoryBatch    `json:"batch" gorm:"foreignKey:BatchID"`
}

func (SalesReturnItem) TableName() string { return "sales_return_items" }

// CreditNote represents a credit note issued for returns
type CreditNote struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreditNoteNo      string    `json:"creditNoteNo" gorm:"uniqueIndex;not null"`
	CreditNoteDate    time.Time `json:"creditNoteDate" gorm:"not null;default:now()"`
	
	// Customer details
	CustomerID        *string   `json:"customerId" gorm:"type:uuid"`
	CustomerName      string    `json:"customerName" gorm:"not null"`
	CustomerGSTNumber string    `json:"customerGstNumber"`
	
	// Related return
	ReturnID          *string   `json:"returnId" gorm:"type:uuid"`
	ReturnNo          string    `json:"returnNo"`
	
	// Credit amount
	CreditAmount      float64   `json:"creditAmount" gorm:"not null"`
	UsedAmount        float64   `json:"usedAmount" gorm:"default:0"`
	BalanceAmount     float64   `json:"balanceAmount" gorm:"not null"`
	
	// Validity
	ValidFrom         time.Time `json:"validFrom" gorm:"not null"`
	ValidUntil        *time.Time `json:"validUntil"`
	
	// Status
	Status            string    `json:"status" gorm:"default:'ACTIVE'"` // ACTIVE, USED, EXPIRED, CANCELLED
	
	Notes             string    `json:"notes"`
	
	// Tracking
	CreatedBy         string    `json:"createdBy"`
	CreatedAt         time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt         time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Customer          *Customer    `json:"customer" gorm:"foreignKey:CustomerID"`
	Return            *SalesReturn `json:"return" gorm:"foreignKey:ReturnID"`
}

func (CreditNote) TableName() string { return "credit_notes" }

// ITCLedger tracks Input Tax Credit for GST compliance
type ITCLedger struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	EntryDate       time.Time `json:"entryDate" gorm:"not null;default:now()"`
	EntryType       string    `json:"entryType" gorm:"not null"` // PURCHASE, RETURN, ADJUSTMENT
	
	// Document reference
	DocumentType    string    `json:"documentType" gorm:"not null"` // PURCHASE_INVOICE, DEBIT_NOTE, CREDIT_NOTE
	DocumentNo      string    `json:"documentNo" gorm:"not null"`
	DocumentDate    time.Time `json:"documentDate" gorm:"not null"`
	
	// Vendor/Supplier details
	VendorID        *string   `json:"vendorId" gorm:"type:uuid"`
	VendorName      string    `json:"vendorName" gorm:"not null"`
	VendorGSTNumber string    `json:"vendorGstNumber"`
	
	// HSN code
	HSNCode         string    `json:"hsnCode"`
	
	// Taxable amount
	TaxableAmount   float64   `json:"taxableAmount" gorm:"not null"`
	
	// ITC amounts (input tax paid)
	CGSTAmount      float64   `json:"cgstAmount" gorm:"default:0"`
	SGSTAmount      float64   `json:"sgstAmount" gorm:"default:0"`
	IGSTAmount      float64   `json:"igstAmount" gorm:"default:0"`
	TotalITC        float64   `json:"totalItc" gorm:"not null"`
	
	// ITC eligibility & utilization
	ITCEligible     bool      `json:"itcEligible" gorm:"default:true"`
	ITCClaimed      bool      `json:"itcClaimed" gorm:"default:false"`
	ITCClaimDate    *time.Time `json:"itcClaimDate"`
	ITCClaimPeriod  string    `json:"itcClaimPeriod"` // e.g., "2024-03" for March 2024
	
	// Reversal tracking
	Reversed        bool      `json:"reversed" gorm:"default:false"`
	ReversalDate    *time.Time `json:"reversalDate"`
	ReversalReason  string    `json:"reversalReason"`
	
	// Tracking
	CreatedBy       string    `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt" gorm:"default:now()"`
	
	// Relationships
	Vendor          *Vendor   `json:"vendor" gorm:"foreignKey:VendorID"`
}

func (ITCLedger) TableName() string { return "itc_ledger" }

// DoctorCommissionRule defines commission rules for doctors
type DoctorCommissionRule struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	DoctorID        *string   `json:"doctorId" gorm:"type:uuid"`
	DoctorName      string    `json:"doctorName" gorm:"not null"`
	
	// Commission type
	CommissionType  string    `json:"commissionType" gorm:"not null;default:'PERCENTAGE'"` // PERCENTAGE, FLAT, SLAB
	
	// Commission rates
	DefaultRate     float64   `json:"defaultRate" gorm:"default:0"`  // e.g., 10.00 for 10%
	FlatAmount      float64   `json:"flatAmount" gorm:"default:0"`
	
	// Category/Brand specific rates
	BrandID         *string   `json:"brandId" gorm:"type:uuid"`
	CategoryID      *string   `json:"categoryId" gorm:"type:uuid"`
	SpecificRate    *float64  `json:"specificRate"`
	
	// Validity
	ValidFrom       time.Time `json:"validFrom" gorm:"not null"`
	ValidUntil      *time.Time `json:"validUntil"`
	
	// Status
	IsActive        bool      `json:"isActive" gorm:"default:true"`
	
	CreatedAt       time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt       time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Doctor          *Customer `json:"doctor" gorm:"foreignKey:DoctorID"`
	Brand           *Brand    `json:"brand" gorm:"foreignKey:BrandID"`
	Category        *Category `json:"category" gorm:"foreignKey:CategoryID"`
}

func (DoctorCommissionRule) TableName() string { return "doctor_commission_rules" }

// DoctorCommission tracks commission transactions
type DoctorCommission struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	TransactionDate   time.Time `json:"transactionDate" gorm:"not null;default:now()"`
	
	// Doctor details
	DoctorID          *string   `json:"doctorId" gorm:"type:uuid"`
	DoctorName        string    `json:"doctorName" gorm:"not null"`
	
	// Invoice reference
	InvoiceID         *string   `json:"invoiceId" gorm:"type:uuid"`
	InvoiceNo         string    `json:"invoiceNo" gorm:"not null"`
	InvoiceDate       time.Time `json:"invoiceDate" gorm:"not null"`
	InvoiceAmount     float64   `json:"invoiceAmount" gorm:"not null"`
	
	// Commission calculation
	CommissionRate    float64   `json:"commissionRate" gorm:"not null"`
	CommissionAmount  float64   `json:"commissionAmount" gorm:"not null"`
	
	// Payment status
	PaymentStatus     string    `json:"paymentStatus" gorm:"default:'PENDING'"` // PENDING, PAID, CANCELLED
	PaymentDate       *time.Time `json:"paymentDate"`
	PaymentMethod     string    `json:"paymentMethod"`
	PaymentReference  string    `json:"paymentReference"`
	
	// Tracking
	CreatedAt         time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt         time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Doctor            *Customer      `json:"doctor" gorm:"foreignKey:DoctorID"`
	Invoice           *SalesInvoice  `json:"invoice" gorm:"foreignKey:InvoiceID"`
}

func (DoctorCommission) TableName() string { return "doctor_commissions" }

// Prescription represents medical prescriptions
type Prescription struct {
	ID                     string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PrescriptionNo         string    `json:"prescriptionNo" gorm:"uniqueIndex;not null"`
	PrescriptionDate       time.Time `json:"prescriptionDate" gorm:"not null;default:current_date"`
	
	// Patient details
	PatientName            string    `json:"patientName" gorm:"not null"`
	PatientAge             *int      `json:"patientAge"`
	PatientGender          string    `json:"patientGender"`
	PatientPhone           string    `json:"patientPhone"`
	PatientAddress         string    `json:"patientAddress"`
	
	// Doctor details
	DoctorID               *string   `json:"doctorId" gorm:"type:uuid"`
	DoctorName             string    `json:"doctorName" gorm:"not null"`
	DoctorQualification    string    `json:"doctorQualification"`
	DoctorRegistrationNo   string    `json:"doctorRegistrationNo"`
	
	// Prescription details
	Complaints             string    `json:"complaints"`
	Diagnosis              string    `json:"diagnosis"`
	Notes                  string    `json:"notes"`
	
	// Prescription image/scan
	ImageURL               string    `json:"imageUrl"`
	
	// Validity
	ValidFrom              time.Time `json:"validFrom" gorm:"not null;default:current_date"`
	ValidUntil             *time.Time `json:"validUntil"`
	
	// Status
	Status                 string    `json:"status" gorm:"default:'ACTIVE'"` // ACTIVE, DISPENSED, EXPIRED, CANCELLED
	
	// Linking to sales
	LastBilledDate         *time.Time `json:"lastBilledDate"`
	BillingCount           int       `json:"billingCount" gorm:"default:0"`
	
	CreatedBy              string    `json:"createdBy"`
	CreatedAt              time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt              time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Doctor                 *Customer          `json:"doctor" gorm:"foreignKey:DoctorID"`
	Items                  []PrescriptionItem `json:"items" gorm:"foreignKey:PrescriptionID"`
}

func (Prescription) TableName() string { return "prescriptions" }

// PrescriptionItem represents medicines prescribed
type PrescriptionItem struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PrescriptionID     string    `json:"prescriptionId" gorm:"type:uuid;not null"`
	
	// Product details
	ProductID          *string   `json:"productId" gorm:"type:uuid"`
	MedicineName       string    `json:"medicineName" gorm:"not null"`
	Potency            string    `json:"potency"`
	Dosage             string    `json:"dosage"`
	Frequency          string    `json:"frequency"`
	Duration           string    `json:"duration"`
	Quantity           *float64  `json:"quantity"`
	
	// Dispensing tracking
	DispensedQuantity  float64   `json:"dispensedQuantity" gorm:"default:0"`
	PendingQuantity    *float64  `json:"pendingQuantity"`
	
	Instructions       string    `json:"instructions"`
	
	CreatedAt          time.Time `json:"createdAt" gorm:"default:now()"`
	
	// Relationships
	Prescription       *Prescription `json:"prescription" gorm:"foreignKey:PrescriptionID"`
	Product            *Product      `json:"product" gorm:"foreignKey:ProductID"`
}

func (PrescriptionItem) TableName() string { return "prescription_items" }

// HeldBill represents parked/held bills
type HeldBill struct {
	ID           string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	HoldNo       string    `json:"holdNo" gorm:"uniqueIndex;not null"`
	
	// Bill data (JSON for flexibility)
	BillData     string    `json:"billData" gorm:"type:jsonb;not null"`
	
	// Customer details
	CustomerID   *string   `json:"customerId" gorm:"type:uuid"`
	CustomerName string    `json:"customerName"`
	
	// Financial summary
	TotalAmount  *float64  `json:"totalAmount"`
	ItemsCount   *int      `json:"itemsCount"`
	
	// Counter details
	CounterID    string    `json:"counterId"`
	HeldBy       string    `json:"heldBy"`
	HeldAt       time.Time `json:"heldAt" gorm:"not null;default:now()"`
	
	// Status
	Status       string    `json:"status" gorm:"default:'HELD'"` // HELD, RESUMED, EXPIRED, CANCELLED
	ResumedAt    *time.Time `json:"resumedAt"`
	ResumedBy    string    `json:"resumedBy"`
	
	// Notes
	Notes        string    `json:"notes"`
	
	CreatedAt    time.Time `json:"createdAt" gorm:"default:now()"`
	
	// Relationships
	Customer     *Customer `json:"customer" gorm:"foreignKey:CustomerID"`
}

func (HeldBill) TableName() string { return "held_bills" }

// ProductPricingTier represents multiple pricing levels
type ProductPricingTier struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ProductID      string    `json:"productId" gorm:"type:uuid;not null"`
	
	// Multiple pricing levels
	MRP            float64   `json:"mrp" gorm:"not null"` // Maximum Retail Price
	DP             *float64  `json:"dp"`                  // Dealer Price
	PTR            *float64  `json:"ptr"`                 // Price to Retailer
	PTS            *float64  `json:"pts"`                 // Price to Stockist
	WholesalePrice *float64  `json:"wholesalePrice"`
	
	// Minimum selling price
	MinimumPrice   *float64  `json:"minimumPrice"`
	
	// Batch specific pricing
	BatchID        *string   `json:"batchId" gorm:"type:uuid"`
	
	// Validity
	EffectiveFrom  time.Time `json:"effectiveFrom" gorm:"not null;default:current_date"`
	EffectiveUntil *time.Time `json:"effectiveUntil"`
	
	IsActive       bool      `json:"isActive" gorm:"default:true"`
	CreatedAt      time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt      time.Time `json:"updatedAt" gorm:"default:now()"`
	
	// Relationships
	Product        *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch          *InventoryBatch `json:"batch" gorm:"foreignKey:BatchID"`
}

func (ProductPricingTier) TableName() string { return "product_pricing_tiers" }

// GSTReturnPeriod represents GST return period summaries
type GSTReturnPeriod struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	PeriodMonth        string    `json:"periodMonth" gorm:"uniqueIndex;not null"` // e.g., "2024-03" for March 2024
	PeriodYear         int       `json:"periodYear" gorm:"not null"`
	
	// Sales summary
	TotalSales         float64   `json:"totalSales" gorm:"default:0"`
	TaxableSales       float64   `json:"taxableSales" gorm:"default:0"`
	GSTCollected       float64   `json:"gstCollected" gorm:"default:0"`
	
	// Purchase summary
	TotalPurchases     float64   `json:"totalPurchases" gorm:"default:0"`
	TaxablePurchases   float64   `json:"taxablePurchases" gorm:"default:0"`
	GSTPaid            float64   `json:"gstPaid" gorm:"default:0"`
	ITCClaimed         float64   `json:"itcClaimed" gorm:"default:0"`
	
	// Net GST liability
	NetGSTPayable      float64   `json:"netGstPayable" gorm:"default:0"`
	
	// Filing status
	GSTR1Filed         bool      `json:"gstr1Filed" gorm:"default:false"`
	GSTR1FiledDate     *time.Time `json:"gstr1FiledDate"`
	GSTR3BFiled        bool      `json:"gstr3bFiled" gorm:"default:false"`
	GSTR3BFiledDate    *time.Time `json:"gstr3bFiledDate"`
	
	// Status
	Status             string    `json:"status" gorm:"default:'OPEN'"` // OPEN, CLOSED, FILED
	
	CreatedAt          time.Time `json:"createdAt" gorm:"default:now()"`
	UpdatedAt          time.Time `json:"updatedAt" gorm:"default:now()"`
}

func (GSTReturnPeriod) TableName() string { return "gst_return_periods" }
