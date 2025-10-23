package models

import (
	"time"
)

// ==================== CORE BUSINESS ENTITIES ====================

// Product Entity (Main product table)
type Product struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name            string     `json:"name" gorm:"not null"`
	Description     string     `json:"description"`
	Barcode         string     `json:"barcode" gorm:"uniqueIndex"`
	SKU             string     `json:"sku" gorm:"uniqueIndex"`
	BrandID         string     `json:"brandId" gorm:"not null"`
	CategoryID      string     `json:"categoryId" gorm:"not null"`
	PotencyID       string     `json:"potencyId"`
	HSNID           string     `json:"hsnId"`
	UOMID           string     `json:"uomId" gorm:"not null"`
	PurchasePrice   float64    `json:"purchasePrice" gorm:"default:0"`
	SellingPrice    float64    `json:"sellingPrice" gorm:"default:0"`
	MRP             float64    `json:"mrp" gorm:"default:0"`
	Stock           int        `json:"stock" gorm:"default:0"`
	MinStock        int        `json:"minStock" gorm:"default:0"`
	MaxStock        int        `json:"maxStock" gorm:"default:0"`
	Image           string     `json:"image"`
	IsActive        bool       `json:"isActive" gorm:"default:true"`
	IsPrescription  bool       `json:"isPrescription" gorm:"default:false"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Brand     Brand     `json:"brand" gorm:"foreignKey:BrandID"`
	Category  Category  `json:"category" gorm:"foreignKey:CategoryID"`
	Potency   Potency   `json:"potency" gorm:"foreignKey:PotencyID"`
	HSN       HSN       `json:"hsn" gorm:"foreignKey:HSNID"`
	UOM       UOM       `json:"uom" gorm:"foreignKey:UOMID"`
}

// Inventory Transaction
type InventoryTransaction struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID   string     `json:"productId" gorm:"not null"`
	WarehouseID string     `json:"warehouseId" gorm:"not null"`
	Type        string     `json:"type"` // IN, OUT, ADJUSTMENT
	Quantity    int        `json:"quantity"`
	UnitCost    float64    `json:"unitCost" gorm:"default:0"`
	TotalCost   float64    `json:"totalCost" gorm:"default:0"`
	Reference   string     `json:"reference"` // PO, SO, Adjustment ID
	Notes       string     `json:"notes"`
	CreatedBy   string     `json:"createdBy" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`

	// Relationships
	Product   Product   `json:"product" gorm:"foreignKey:ProductID"`
	Warehouse Warehouse `json:"warehouse" gorm:"foreignKey:WarehouseID"`
}

// Customer Entity
type Customer struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name            string     `json:"name" gorm:"not null"`
	Email           string     `json:"email" gorm:"uniqueIndex"`
	Phone           string     `json:"phone"`
	Address         string     `json:"address"`
	City            string     `json:"city"`
	State           string     `json:"state"`
	Pincode         string     `json:"pincode"`
	GSTNumber       string     `json:"gstNumber"`
	CustomerGroupID string     `json:"customerGroupId"`
	LoyaltyPoints   int        `json:"loyaltyPoints" gorm:"default:0"`
	CreditLimit     float64    `json:"creditLimit" gorm:"default:0"`
	Outstanding     float64    `json:"outstanding" gorm:"default:0"`
	IsActive        bool       `json:"isActive" gorm:"default:true"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	CustomerGroup CustomerGroup `json:"customerGroup" gorm:"foreignKey:CustomerGroupID"`
}

// Vendor Entity
type Vendor struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	Address     string     `json:"address"`
	City        string     `json:"city"`
	State       string     `json:"state"`
	Pincode     string     `json:"pincode"`
	GSTNumber   string     `json:"gstNumber"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Sales Order Entity
type SalesOrder struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrderNumber     string     `json:"orderNumber" gorm:"uniqueIndex;not null"`
	CustomerID      string     `json:"customerId" gorm:"not null"`
	InvoiceSeriesID string     `json:"invoiceSeriesId"`
	Type            string     `json:"type"` // B2C, B2B, D2D
	Status          string     `json:"status"` // DRAFT, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
	OrderDate       time.Time  `json:"orderDate"`
	Subtotal        float64    `json:"subtotal" gorm:"default:0"`
	TaxAmount       float64    `json:"taxAmount" gorm:"default:0"`
	DiscountAmount  float64    `json:"discountAmount" gorm:"default:0"`
	TotalAmount     float64    `json:"totalAmount" gorm:"default:0"`
	PaymentStatus   string     `json:"paymentStatus"` // PENDING, PAID, PARTIAL
	ShippingAddress string     `json:"shippingAddress"`
	Notes           string     `json:"notes"`
	CreatedBy       string     `json:"createdBy" gorm:"not null"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Customer      Customer      `json:"customer" gorm:"foreignKey:CustomerID"`
	InvoiceSeries InvoiceSeries `json:"invoiceSeries" gorm:"foreignKey:InvoiceSeriesID"`
	Items         []SalesOrderItem `json:"items" gorm:"foreignKey:SalesOrderID"`
	Payments      []Payment     `json:"payments" gorm:"foreignKey:SalesOrderID"`
}

// Sales Order Item
type SalesOrderItem struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SalesOrderID string     `json:"salesOrderId" gorm:"not null"`
	ProductID    string     `json:"productId" gorm:"not null"`
	Quantity     int        `json:"quantity"`
	UnitPrice    float64    `json:"unitPrice" gorm:"default:0"`
	Discount     float64    `json:"discount" gorm:"default:0"`
	TaxRate      float64    `json:"taxRate" gorm:"default:0"`
	TotalAmount  float64    `json:"totalAmount" gorm:"default:0"`
	CreatedAt    time.Time  `json:"createdAt"`

	// Relationships
	Product Product `json:"product" gorm:"foreignKey:ProductID"`
}

// Purchase Order Entity
type PurchaseOrder struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrderNumber     string     `json:"orderNumber" gorm:"uniqueIndex;not null"`
	VendorID        string     `json:"vendorId" gorm:"not null"`
	Status          string     `json:"status"` // DRAFT, CONFIRMED, RECEIVED, CANCELLED
	OrderDate       time.Time  `json:"orderDate"`
	ExpectedDate    *time.Time `json:"expectedDate"`
	Subtotal        float64    `json:"subtotal" gorm:"default:0"`
	TaxAmount       float64    `json:"taxAmount" gorm:"default:0"`
	DiscountAmount  float64    `json:"discountAmount" gorm:"default:0"`
	TotalAmount     float64    `json:"totalAmount" gorm:"default:0"`
	PaymentTermsID  string     `json:"paymentTermsId"`
	Notes           string     `json:"notes"`
	CreatedBy       string     `json:"createdBy" gorm:"not null"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Vendor        Vendor        `json:"vendor" gorm:"foreignKey:VendorID"`
	PaymentTerms  PaymentTerms  `json:"paymentTerms" gorm:"foreignKey:PaymentTermsID"`
	Items         []PurchaseOrderItem `json:"items" gorm:"foreignKey:PurchaseOrderID"`
	Receipts      []PurchaseReceipt `json:"receipts" gorm:"foreignKey:PurchaseOrderID"`
}

// Purchase Order Item
type PurchaseOrderItem struct {
	ID             string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PurchaseOrderID string    `json:"purchaseOrderId" gorm:"not null"`
	ProductID      string     `json:"productId" gorm:"not null"`
	Quantity       int        `json:"quantity"`
	UnitPrice      float64    `json:"unitPrice" gorm:"default:0"`
	Discount       float64    `json:"discount" gorm:"default:0"`
	TaxRate        float64    `json:"taxRate" gorm:"default:0"`
	TotalAmount    float64    `json:"totalAmount" gorm:"default:0"`
	ReceivedQty    int        `json:"receivedQty" gorm:"default:0"`
	CreatedAt      time.Time  `json:"createdAt"`

	// Relationships
	Product Product `json:"product" gorm:"foreignKey:ProductID"`
}

// Purchase Receipt (GRN)
type PurchaseReceipt struct {
	ID             string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PurchaseOrderID string    `json:"purchaseOrderId" gorm:"not null"`
	ReceiptNumber  string     `json:"receiptNumber" gorm:"uniqueIndex;not null"`
	ReceiptDate    time.Time  `json:"receiptDate"`
	TotalQuantity  int        `json:"totalQuantity"`
	TotalAmount    float64    `json:"totalAmount" gorm:"default:0"`
	Notes          string     `json:"notes"`
	CreatedBy      string     `json:"createdBy" gorm:"not null"`
	CreatedAt      time.Time  `json:"createdAt"`

	// Relationships
	PurchaseOrder PurchaseOrder `json:"purchaseOrder" gorm:"foreignKey:PurchaseOrderID"`
	Items         []PurchaseReceiptItem `json:"items" gorm:"foreignKey:PurchaseReceiptID"`
}

// Purchase Receipt Item
type PurchaseReceiptItem struct {
	ID                string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PurchaseReceiptID string     `json:"purchaseReceiptId" gorm:"not null"`
	ProductID         string     `json:"productId" gorm:"not null"`
	Quantity          int        `json:"quantity"`
	UnitCost          float64    `json:"unitCost" gorm:"default:0"`
	TotalCost         float64    `json:"totalCost" gorm:"default:0"`
	BatchNumber       string     `json:"batchNumber"`
	ExpiryDate        *time.Time `json:"expiryDate"`
	CreatedAt         time.Time  `json:"createdAt"`

	// Relationships
	Product Product `json:"product" gorm:"foreignKey:ProductID"`
}

// Payment Entity
type Payment struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SalesOrderID *string    `json:"salesOrderId" gorm:"index"`
	VendorID     *string    `json:"vendorId" gorm:"index"`
	Type         string     `json:"type"` // RECEIPT, PAYMENT
	Method       string     `json:"method"` // CASH, CARD, UPI, CHEQUE, BANK_TRANSFER
	Amount       float64    `json:"amount" gorm:"default:0"`
	Reference    string     `json:"reference"`
	Notes        string     `json:"notes"`
	PaymentDate  time.Time  `json:"paymentDate"`
	CreatedBy    string     `json:"createdBy" gorm:"not null"`
	CreatedAt    time.Time  `json:"createdAt"`

	// Relationships
	SalesOrder SalesOrder `json:"salesOrder" gorm:"foreignKey:SalesOrderID"`
	Vendor     Vendor     `json:"vendor" gorm:"foreignKey:VendorID"`
}

// Employee Entity (HR Module)
type Employee struct {
	ID            string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID        string     `json:"userId" gorm:"uniqueIndex;not null"` // Links to User table
	EmployeeCode  string     `json:"employeeCode" gorm:"uniqueIndex"`
	DepartmentID  string     `json:"departmentId" gorm:"not null"`
	DesignationID string     `json:"designationId" gorm:"not null"`
	ShiftID       string     `json:"shiftId"`
	JoiningDate   time.Time  `json:"joiningDate"`
	Salary        float64    `json:"salary" gorm:"default:0"`
	IsActive      bool       `json:"isActive" gorm:"default:true"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`

	// Relationships
	User        User        `json:"user" gorm:"foreignKey:UserID"`
	Department  Department  `json:"department" gorm:"foreignKey:DepartmentID"`
	Designation Designation `json:"designation" gorm:"foreignKey:DesignationID"`
	Shift       Shift       `json:"shift" gorm:"foreignKey:ShiftID"`
}

// Attendance Entity
type Attendance struct {
	ID         string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	EmployeeID string     `json:"employeeId" gorm:"not null"`
	Date       time.Time  `json:"date"`
	CheckIn    *time.Time `json:"checkIn"`
	CheckOut   *time.Time `json:"checkOut"`
	Hours      float64    `json:"hours" gorm:"default:0"`
	Status     string     `json:"status"` // PRESENT, ABSENT, HALF_DAY, LEAVE
	Notes      string     `json:"notes"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`

	// Relationships
	Employee Employee `json:"employee" gorm:"foreignKey:EmployeeID"`
}

// Expense Entity (Finance Module)
type Expense struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ExpenseNumber   string     `json:"expenseNumber" gorm:"uniqueIndex;not null"`
	ExpenseCategoryID string   `json:"expenseCategoryId" gorm:"not null"`
	CostCenterID    string     `json:"costCenterId"`
	LedgerID        string     `json:"ledgerId" gorm:"not null"`
	Amount          float64    `json:"amount" gorm:"default:0"`
	Description     string     `json:"description"`
	ExpenseDate     time.Time  `json:"expenseDate"`
	VendorID        *string    `json:"vendorId" gorm:"index"`
	Receipt         string     `json:"receipt"` // File path
	Status          string     `json:"status"` // DRAFT, SUBMITTED, APPROVED, REJECTED, PAID
	ApprovedBy      *string    `json:"approvedBy"`
	ApprovedAt      *time.Time `json:"approvedAt"`
	CreatedBy       string     `json:"createdBy" gorm:"not null"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	ExpenseCategory ExpenseCategory `json:"expenseCategory" gorm:"foreignKey:ExpenseCategoryID"`
	CostCenter      CostCenter      `json:"costCenter" gorm:"foreignKey:CostCenterID"`
	Ledger          Ledger          `json:"ledger" gorm:"foreignKey:LedgerID"`
	Vendor          Vendor          `json:"vendor" gorm:"foreignKey:VendorID"`
}

// Campaign Entity (Marketing Module)
type Campaign struct {
	ID              string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name            string     `json:"name" gorm:"not null"`
	Description     string     `json:"description"`
	CampaignTypeID  string     `json:"campaignTypeId" gorm:"not null"`
	TargetSegmentID string     `json:"targetSegmentId"`
	TemplateID      string     `json:"templateId"`
	StartDate       time.Time  `json:"startDate"`
	EndDate         *time.Time `json:"endDate"`
	Budget          float64    `json:"budget" gorm:"default:0"`
	Status          string     `json:"status"` // DRAFT, SCHEDULED, RUNNING, COMPLETED, CANCELLED
	CreatedBy       string     `json:"createdBy" gorm:"not null"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	CampaignType  CampaignType  `json:"campaignType" gorm:"foreignKey:CampaignTypeID"`
	TargetSegment TargetSegment `json:"targetSegment" gorm:"foreignKey:TargetSegmentID"`
	Template      Template      `json:"template" gorm:"foreignKey:TemplateID"`
	Messages      []CampaignMessage `json:"messages" gorm:"foreignKey:CampaignID"`
}

// Campaign Message (Individual message in campaign)
type CampaignMessage struct {
	ID         string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CampaignID string     `json:"campaignId" gorm:"not null"`
	Recipient  string     `json:"recipient"` // Email/Phone/Customer ID
	Type       string     `json:"type"` // EMAIL, SMS, WHATSAPP, SOCIAL
	Status     string     `json:"status"` // PENDING, SENT, DELIVERED, FAILED
	SentAt     *time.Time `json:"sentAt"`
	Error      string     `json:"error"`
	CreatedAt  time.Time  `json:"createdAt"`

	// Relationships
	Campaign Campaign `json:"campaign" gorm:"foreignKey:CampaignID"`
}

// CMS Page Entity
type CMSPage struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Title       string     `json:"title" gorm:"not null"`
	Slug        string     `json:"slug" gorm:"uniqueIndex;not null"`
	Content     string     `json:"content" gorm:"type:text"`
	MetaTitle   string     `json:"metaTitle"`
	MetaDescription string `json:"metaDescription"`
	Image       string     `json:"image"`
	IsPublished bool       `json:"isPublished" gorm:"default:false"`
	IsPublic    bool       `json:"isPublic" gorm:"default:true"`
	CreatedBy   string     `json:"createdBy" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Media Library Entity
type Media struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	FileName    string     `json:"fileName" gorm:"not null"`
	FilePath    string     `json:"filePath" gorm:"not null"`
	FileSize    int64      `json:"fileSize"`
	MimeType    string     `json:"mimeType"`
	AltText     string     `json:"altText"`
	Description string     `json:"description"`
	Category    string     `json:"category"` // IMAGE, DOCUMENT, VIDEO, etc.
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	UploadedBy  string     `json:"uploadedBy" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// AI Model Entity (for LLM integration)
type AIModel struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Type        string     `json:"type"` // OPENAI, LOCAL, HUGGINGFACE
	ModelName   string     `json:"modelName"`
	APIKey      string     `json:"-"` // Encrypted
	BaseURL     string     `json:"baseUrl"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedBy   string     `json:"createdBy" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// AI Chat Entity
type AIChat struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string     `json:"userId" gorm:"not null"`
	ModelID     string     `json:"modelId" gorm:"not null"`
	Query       string     `json:"query" gorm:"type:text"`
	Response    string     `json:"response" gorm:"type:text"`
	TokensUsed  int        `json:"tokensUsed" gorm:"default:0"`
	Cost        float64    `json:"cost" gorm:"default:0"`
	CreatedAt   time.Time  `json:"createdAt"`

	// Relationships
	User  User    `json:"user" gorm:"foreignKey:UserID"`
	Model AIModel `json:"model" gorm:"foreignKey:ModelID"`
}
