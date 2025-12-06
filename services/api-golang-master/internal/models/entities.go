package models

import (
	"time"
)

// ==================== UNIFIED SCHEMA ENTITIES ====================
// Single source of truth for ALL services - use this exact schema
// Generated from UNIFIED-SCHEMA-DEFINITION.sql

// ============================================================================
// 1. CORE MASTER DATA TABLES
// ============================================================================

// Categories Entity (Product categories)
type Category struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	ParentID    *string   `json:"parentId" gorm:"type:uuid;index"`
	SortOrder   int       `json:"sortOrder" gorm:"default:0"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relationships
	Parent   *Category `json:"parent" gorm:"foreignKey:ParentID"`
	Products []Product `json:"products" gorm:"foreignKey:CategoryID"`
}

// Brands Entity (Product brands)
type Brand struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	LogoURL     string    `json:"logoUrl"`
	Website     string    `json:"website"`
	Country     string    `json:"country" gorm:"default:'India'"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relationships
	Products []Product `json:"products" gorm:"foreignKey:BrandID"`
}

// Potencies Entity (Homeopathy-specific)
type Potency struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	PotencyType string    `json:"potencyType" gorm:"not null"` // DECIMAL, CENTESIMAL, LM, MOTHER_TINCTURE
	Value       *float64  `json:"value"`
	Description string    `json:"description"`
	SortOrder   int       `json:"sortOrder" gorm:"default:0"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`

	// Relationships
	Products []Product `json:"products" gorm:"foreignKey:PotencyID"`
}

// Forms Entity (Product forms)
type Form struct {
	ID                     string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name                   string    `json:"name" gorm:"not null"`
	Code                   string    `json:"code" gorm:"uniqueIndex;not null"`
	FormType               string    `json:"formType" gorm:"not null"` // LIQUID, SOLID, EXTERNAL, SPECIAL, COSMETIC
	Description            string    `json:"description"`
	IsPrescriptionRequired bool      `json:"isPrescriptionRequired" gorm:"default:false"`
	SortOrder              int       `json:"sortOrder" gorm:"default:0"`
	IsActive               bool      `json:"isActive" gorm:"default:true"`
	CreatedAt              time.Time `json:"createdAt"`

	// Relationships
	Products []Product `json:"products" gorm:"foreignKey:FormID"`
}

// Units Entity (Units of measurement)
type Unit struct {
	ID               string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name             string    `json:"name" gorm:"not null"`
	Code             string    `json:"code" gorm:"uniqueIndex;not null"`
	UnitType         string    `json:"unitType" gorm:"not null"` // WEIGHT, VOLUME, COUNT, LENGTH
	ConversionFactor float64   `json:"conversionFactor" gorm:"default:1"`
	BaseUnit         string    `json:"baseUnit"`
	IsActive         bool      `json:"isActive" gorm:"default:true"`
	CreatedAt        time.Time `json:"createdAt"`

	// Relationships
	Products []Product `json:"products" gorm:"foreignKey:UnitID"`
}

// HSN Codes Entity (GST codes)
type HSNCode struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	GSTRate     float64   `json:"gstRate" gorm:"not null"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`

	// Relationships
	Products []Product `json:"products" gorm:"foreignKey:HSNCodeID"`
}

// ============================================================================
// 2. CORE BUSINESS TABLES
// ============================================================================

// Products Entity (Main catalog)
type Product struct {
	ID         string  `json:"id" gorm:"type:uuid;primaryKey"`
	SKU        string  `json:"sku" gorm:"uniqueIndex;not null"`
	Name       string  `json:"name" gorm:"not null"`
	CategoryID *string `json:"categoryId" gorm:"type:uuid;index"`
	BrandID    *string `json:"brandId" gorm:"type:uuid;index"`
	PotencyID  *string `json:"potencyId" gorm:"type:uuid"`
	FormID     *string `json:"formId" gorm:"type:uuid"`
	HSNCodeID  *string `json:"hsnCodeId" gorm:"type:uuid"`
	UnitID     *string `json:"unitId" gorm:"type:uuid"`

	// Pricing
	CostPrice    float64 `json:"costPrice" gorm:"default:0"`
	SellingPrice float64 `json:"sellingPrice" gorm:"default:0"`
	MRP          float64 `json:"mrp" gorm:"default:0"`
	TaxRate      float64 `json:"taxRate" gorm:"default:12.00"`

	// Stock Management
	PackSize     string  `json:"packSize"`
	ReorderLevel int     `json:"reorderLevel" gorm:"default:20"`
	MinStock     int     `json:"minStock" gorm:"default:10"`
	MaxStock     int     `json:"maxStock" gorm:"default:1000"`
	CurrentStock float64 `json:"currentStock" gorm:"default:0"`

	// Product Details
	Barcode                string `json:"barcode"`
	BarcodeTemplate        string `json:"barcodeTemplate" gorm:"default:'BarcodeT8'"`
	Description            string `json:"description"`
	Manufacturer           string `json:"manufacturer"`
	IsPrescriptionRequired bool   `json:"isPrescriptionRequired" gorm:"default:false"`
	IsActive               bool   `json:"isActive" gorm:"default:true"`
	Tags                   string `json:"tags"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Category           *Category            `json:"category" gorm:"foreignKey:CategoryID"`
	Brand              *Brand               `json:"brand" gorm:"foreignKey:BrandID"`
	Potency            *Potency             `json:"potency" gorm:"foreignKey:PotencyID"`
	Form               *Form                `json:"form" gorm:"foreignKey:FormID"`
	HSNCode            *HSNCode             `json:"hsnCode" gorm:"foreignKey:HSNCodeID"`
	Unit               *Unit                `json:"unit" gorm:"foreignKey:UnitID"`
	InventoryBatches   []InventoryBatch     `json:"inventoryBatches" gorm:"foreignKey:ProductID"`
	PricingTiers       []ProductPricingTier `json:"pricingTiers" gorm:"foreignKey:ProductID"`
	SalesOrderItems    []SalesOrderItem     `json:"salesOrderItems" gorm:"foreignKey:ProductID"`
	PurchaseOrderItems []PurchaseOrderItem  `json:"purchaseOrderItems" gorm:"foreignKey:ProductID"`
}

// Customers Entity
type Customer struct {
	ID             string `json:"id" gorm:"type:uuid;primaryKey"`
	CustomerCode   string `json:"customerCode" gorm:"uniqueIndex"`
	Name           string `json:"name" gorm:"not null"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	AlternatePhone string `json:"alternatePhone"`
	Address        string `json:"address"`
	City           string `json:"city"`
	State          string `json:"state"`
	Country        string `json:"country" gorm:"default:'India'"`
	Pincode        string `json:"pincode"`
	GSTNumber      string `json:"gstNumber"`
	PANNumber      string `json:"panNumber"`

	// Business Fields
	CustomerType       string  `json:"customerType" gorm:"default:'retail'"` // RETAIL, WHOLESALE, DISTRIBUTOR, DOCTOR
	CreditLimit        float64 `json:"creditLimit" gorm:"default:0"`
	OutstandingBalance float64 `json:"outstandingBalance" gorm:"default:0"`
	LoyaltyPoints      int     `json:"loyaltyPoints" gorm:"default:0"`

	OptOutMarketing bool `json:"optOutMarketing" gorm:"default:false"`

	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	SalesOrders []SalesOrder `json:"salesOrders" gorm:"foreignKey:CustomerID"`
}

// Vendors Entity
type Vendor struct {
	ID             string `json:"id" gorm:"type:uuid;primaryKey"`
	VendorCode     string `json:"vendorCode" gorm:"uniqueIndex"`
	Name           string `json:"name" gorm:"not null"`
	ContactPerson  string `json:"contactPerson"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	AlternatePhone string `json:"alternatePhone"`
	Address        string `json:"address"`
	City           string `json:"city"`
	State          string `json:"state"`
	Country        string `json:"country" gorm:"default:'India'"`
	Pincode        string `json:"pincode"`
	GSTNumber      string `json:"gstNumber"`
	PANNumber      string `json:"panNumber"`

	// Banking Details
	BankName    string `json:"bankName"`
	BankAccount string `json:"bankAccount"`
	IFSCCode    string `json:"ifscCode"`

	// Business Terms
	PaymentTerms string  `json:"paymentTerms"`
	CreditDays   int     `json:"creditDays" gorm:"default:30"`
	Rating       float64 `json:"rating" gorm:"default:0"`

	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	PurchaseOrders   []PurchaseOrder  `json:"purchaseOrders" gorm:"foreignKey:VendorID"`
	InventoryBatches []InventoryBatch `json:"inventoryBatches" gorm:"foreignKey:SupplierID"`
}

// ============================================================================
// 3. INVENTORY MANAGEMENT TABLES
// ============================================================================

// Inventory Batches Entity (Batch tracking)
type InventoryBatch struct {
	ID                string     `json:"id" gorm:"type:uuid;primaryKey"`
	ProductID         string     `json:"productId" gorm:"type:uuid;not null"`
	BatchNumber       string     `json:"batchNumber" gorm:"not null"`
	ManufacturingDate *time.Time `json:"manufacturingDate"`
	ExpiryDate        *time.Time `json:"expiryDate"`

	// Stock Details
	Quantity          float64 `json:"quantity" gorm:"not null"`
	ReservedQuantity  float64 `json:"reservedQuantity" gorm:"default:0"`
	AvailableQuantity float64 `json:"availableQuantity" gorm:"not null"`

	// Cost Details
	UnitCost     float64 `json:"unitCost" gorm:"not null"`
	SellingPrice float64 `json:"sellingPrice" gorm:"not null"`
	MRP          float64 `json:"mrp"`

	// Location
	Location   string `json:"location"`
	RackNumber string `json:"rackNumber"`
	BinNumber  string `json:"binNumber"`

	// Supplier & Source
	SupplierID      *string `json:"supplierId" gorm:"type:uuid"`
	PurchaseOrderID string  `json:"purchaseOrderId"`
	StockSource     string  `json:"stockSource" gorm:"default:'purchase'"` // purchase, inventory, adjustment, transfer, return

	IsExpired bool      `json:"isExpired" gorm:"default:false"`
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Product          *Product          `json:"product" gorm:"foreignKey:ProductID"`
	Supplier         *Vendor           `json:"supplier" gorm:"foreignKey:SupplierID"`
	SalesOrderItems  []SalesOrderItem  `json:"salesOrderItems" gorm:"foreignKey:BatchID"`
	StockAdjustments []StockAdjustment `json:"stockAdjustments" gorm:"foreignKey:BatchID"`
}

// Stock Adjustments Entity
type StockAdjustment struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey"`
	ProductID      *string   `json:"productId" gorm:"type:uuid;index"`
	BatchID        *string   `json:"batchId" gorm:"type:uuid;index"`
	AdjustmentType string    `json:"adjustmentType" gorm:"not null"` // IN, OUT, ADJUSTMENT
	QuantityBefore float64   `json:"quantityBefore" gorm:"not null"`
	QuantityAfter  float64   `json:"quantityAfter" gorm:"not null"`
	QuantityDelta  float64   `json:"quantityDelta" gorm:"not null"`
	UnitCost       float64   `json:"unitCost"`
	TotalCost      float64   `json:"totalCost"`
	Reason         string    `json:"reason" gorm:"not null"`
	Notes          string    `json:"notes"`
	ReferenceID    string    `json:"referenceId"`
	AdjustedBy     string    `json:"adjustedBy"`
	CreatedAt      time.Time `json:"createdAt"`

	// Relationships
	Product *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch   *InventoryBatch `json:"batch" gorm:"foreignKey:BatchID"`
}

// ============================================================================
// 4. SALES MANAGEMENT TABLES
// ============================================================================

// Sales Orders Entity
type SalesOrder struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	OrderNumber string    `json:"orderNumber" gorm:"uniqueIndex;not null"`
	CustomerID  *string   `json:"customerId" gorm:"type:uuid;index"`
	OrderDate   time.Time `json:"orderDate" gorm:"default:now()"`
	OrderType   string    `json:"orderType" gorm:"default:'sale'"` // SALE, RETURN, EXCHANGE
	Status      string    `json:"status" gorm:"default:'draft'"`   // DRAFT, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

	// Financials
	Subtotal       float64 `json:"subtotal" gorm:"default:0"`
	DiscountAmount float64 `json:"discountAmount" gorm:"default:0"`
	TaxAmount      float64 `json:"taxAmount" gorm:"default:0"`
	TotalAmount    float64 `json:"totalAmount" gorm:"not null"`

	// Payment
	PaidAmount    float64 `json:"paidAmount" gorm:"default:0"`
	BalanceAmount float64 `json:"balanceAmount" gorm:"default:0"`
	PaymentMethod string  `json:"paymentMethod"`
	PaymentStatus string  `json:"paymentStatus" gorm:"default:'pending'"`

	// Delivery
	ShippingAddress string `json:"shippingAddress"`
	Notes           string `json:"notes"`

	CreatedBy string    `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Customer *Customer        `json:"customer" gorm:"foreignKey:CustomerID"`
	Items    []SalesOrderItem `json:"items" gorm:"foreignKey:SalesOrderID"`
	Payments []Payment        `json:"payments" gorm:"foreignKey:SalesOrderID"`
}

// Sales Order Items Entity
type SalesOrderItem struct {
	ID           string  `json:"id" gorm:"type:uuid;primaryKey"`
	SalesOrderID string  `json:"salesOrderId" gorm:"type:uuid;not null"`
	ProductID    string  `json:"productId" gorm:"type:uuid;not null"`
	BatchID      *string `json:"batchId" gorm:"type:uuid"`

	Quantity        float64 `json:"quantity" gorm:"not null"`
	UnitPrice       float64 `json:"unitPrice" gorm:"not null"`
	DiscountPercent float64 `json:"discountPercent" gorm:"default:0"`
	DiscountAmount  float64 `json:"discountAmount" gorm:"default:0"`
	TaxPercent      float64 `json:"taxPercent" gorm:"default:12.00"`
	TaxAmount       float64 `json:"taxAmount" gorm:"default:0"`
	TotalAmount     float64 `json:"totalAmount" gorm:"not null"`

	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	SalesOrder *SalesOrder     `json:"salesOrder" gorm:"foreignKey:SalesOrderID"`
	Product    *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch      *InventoryBatch `json:"batch" gorm:"foreignKey:BatchID"`
}

// ============================================================================
// 5. PURCHASE MANAGEMENT TABLES
// ============================================================================

// Purchase Orders Entity
type PurchaseOrder struct {
	ID                   string     `json:"id" gorm:"type:uuid;primaryKey"`
	OrderNumber          string     `json:"orderNumber" gorm:"uniqueIndex;not null"`
	VendorID             string     `json:"vendorId" gorm:"type:uuid;not null"`
	OrderDate            time.Time  `json:"orderDate" gorm:"default:now()"`
	ExpectedDeliveryDate *time.Time `json:"expectedDeliveryDate"`
	Status               string     `json:"status" gorm:"default:'draft'"` // DRAFT, CONFIRMED, RECEIVED, CANCELLED

	// Financials
	Subtotal       float64 `json:"subtotal" gorm:"default:0"`
	DiscountAmount float64 `json:"discountAmount" gorm:"default:0"`
	TaxAmount      float64 `json:"taxAmount" gorm:"default:0"`
	TotalAmount    float64 `json:"totalAmount" gorm:"not null"`

	// Terms
	PaymentTerms string `json:"paymentTerms"`
	Notes        string `json:"notes"`

	CreatedBy string    `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Vendor   *Vendor             `json:"vendor" gorm:"foreignKey:VendorID"`
	Items    []PurchaseOrderItem `json:"items" gorm:"foreignKey:PurchaseOrderID"`
	Receipts []PurchaseReceipt   `json:"receipts" gorm:"foreignKey:PurchaseOrderID"`
}

// Purchase Order Items Entity
type PurchaseOrderItem struct {
	ID              string `json:"id" gorm:"type:uuid;primaryKey"`
	PurchaseOrderID string `json:"purchaseOrderId" gorm:"type:uuid;not null"`
	ProductID       string `json:"productId" gorm:"type:uuid;not null"`

	Quantity        float64 `json:"quantity" gorm:"not null"`
	UnitPrice       float64 `json:"unitPrice" gorm:"not null"`
	DiscountPercent float64 `json:"discountPercent" gorm:"default:0"`
	DiscountAmount  float64 `json:"discountAmount" gorm:"default:0"`
	TaxPercent      float64 `json:"taxPercent" gorm:"default:12.00"`
	TaxAmount       float64 `json:"taxAmount" gorm:"default:0"`
	TotalAmount     float64 `json:"totalAmount" gorm:"not null"`

	// Delivery tracking
	ReceivedQuantity float64 `json:"receivedQuantity" gorm:"default:0"`
	PendingQuantity  float64 `json:"pendingQuantity" gorm:"not null"`

	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	PurchaseOrder *PurchaseOrder        `json:"purchaseOrder" gorm:"foreignKey:PurchaseOrderID"`
	Product       *Product              `json:"product" gorm:"foreignKey:ProductID"`
	ReceiptItems  []PurchaseReceiptItem `json:"receiptItems" gorm:"foreignKey:PurchaseOrderItemID"`
}

// Purchase Receipts Entity (GRN)
type PurchaseReceipt struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	PurchaseOrderID *string   `json:"purchaseOrderId" gorm:"type:uuid;index"`
	ReceiptNumber   string    `json:"receiptNumber" gorm:"uniqueIndex;not null"`
	ReceiptDate     time.Time `json:"receiptDate" gorm:"default:now()"`

	// Financials
	Subtotal    float64 `json:"subtotal" gorm:"default:0"`
	TaxAmount   float64 `json:"taxAmount" gorm:"default:0"`
	TotalAmount float64 `json:"totalAmount" gorm:"default:0"`

	// Status
	Status string `json:"status" gorm:"default:'received'"` // RECEIVED, PARTIAL, CANCELLED
	Notes  string `json:"notes"`

	CreatedBy string    `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	PurchaseOrder *PurchaseOrder        `json:"purchaseOrder" gorm:"foreignKey:PurchaseOrderID"`
	Items         []PurchaseReceiptItem `json:"items" gorm:"foreignKey:PurchaseReceiptID"`
}

// Purchase Receipt Items Entity
type PurchaseReceiptItem struct {
	ID                  string  `json:"id" gorm:"type:uuid;primaryKey"`
	PurchaseReceiptID   string  `json:"purchaseReceiptId" gorm:"type:uuid;not null"`
	PurchaseOrderItemID *string `json:"purchaseOrderItemId" gorm:"type:uuid"`
	ProductID           string  `json:"productId" gorm:"type:uuid;not null"`

	Quantity  float64 `json:"quantity" gorm:"not null"`
	UnitCost  float64 `json:"unitCost" gorm:"not null"`
	TotalCost float64 `json:"totalCost" gorm:"not null"`

	// Batch details
	BatchNumber       string     `json:"batchNumber" gorm:"not null"`
	ManufacturingDate *time.Time `json:"manufacturingDate"`
	ExpiryDate        *time.Time `json:"expiryDate"`

	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	PurchaseReceipt   *PurchaseReceipt   `json:"purchaseReceipt" gorm:"foreignKey:PurchaseReceiptID"`
	PurchaseOrderItem *PurchaseOrderItem `json:"purchaseOrderItem" gorm:"foreignKey:PurchaseOrderItemID"`
	Product           *Product           `json:"product" gorm:"foreignKey:ProductID"`
}

// ============================================================================
// 6. PAYMENT MANAGEMENT TABLES
// ============================================================================

// Payments Entity
type Payment struct {
	ID            string    `json:"id" gorm:"type:uuid;primaryKey"`
	PaymentNumber string    `json:"paymentNumber" gorm:"uniqueIndex;not null"`
	PaymentDate   time.Time `json:"paymentDate" gorm:"default:now()"`

	// Related entities
	SalesOrderID    *string `json:"salesOrderId" gorm:"type:uuid;index"`
	PurchaseOrderID *string `json:"purchaseOrderId" gorm:"type:uuid;index"`
	CustomerID      *string `json:"customerId" gorm:"type:uuid;index"`
	VendorID        *string `json:"vendorId" gorm:"type:uuid;index"`

	// Payment details
	PaymentType     string  `json:"paymentType" gorm:"not null"`   // RECEIPT, PAYMENT
	PaymentMethod   string  `json:"paymentMethod" gorm:"not null"` // CASH, CARD, UPI, CHEQUE, BANK_TRANSFER, CREDIT
	Amount          float64 `json:"amount" gorm:"not null"`
	ReferenceNumber string  `json:"referenceNumber"`
	BankReference   string  `json:"bankReference"`
	Notes           string  `json:"notes"`

	// Status
	Status    string `json:"status" gorm:"default:'completed'"` // PENDING, COMPLETED, FAILED, CANCELLED
	CreatedBy string `json:"createdBy"`
	UpdatedBy string `json:"updatedBy"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	SalesOrder    *SalesOrder    `json:"salesOrder" gorm:"foreignKey:SalesOrderID"`
	PurchaseOrder *PurchaseOrder `json:"purchaseOrder" gorm:"foreignKey:PurchaseOrderID"`
	Customer      *Customer      `json:"customer" gorm:"foreignKey:CustomerID"`
	Vendor        *Vendor        `json:"vendor" gorm:"foreignKey:VendorID"`
}

// ============================================================================
// 7. USER MANAGEMENT TABLES (RBAC)
// ============================================================================

// Companies Entity (Multi-company)
type Company struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Code      string    `json:"code" gorm:"uniqueIndex;not null"`
	LegalName string    `json:"legalName"`
	PAN       string    `json:"pan"`
	GSTIN     string    `json:"gstin"`
	Address   string    `json:"address"`
	City      string    `json:"city"`
	State     string    `json:"state"`
	Country   string    `json:"country" gorm:"default:'India'"`
	Pincode   string    `json:"pincode"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Website   string    `json:"website"`
	LogoURL   string    `json:"logoUrl"`
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Users          []User          `json:"users" gorm:"foreignKey:CompanyID"`
	Roles          []Role          `json:"roles" gorm:"foreignKey:CompanyID"`
	CustomerGroups []CustomerGroup `json:"customerGroups" gorm:"foreignKey:CompanyID"`
	PriceLists     []PriceList     `json:"priceLists" gorm:"foreignKey:CompanyID"`
	Racks          []Rack          `json:"racks" gorm:"foreignKey:CompanyID"`
}

// Users Entity (Authentication)
type User struct {
	ID        string  `json:"id" gorm:"type:uuid;primaryKey"`
	CompanyID *string `json:"companyId" gorm:"type:uuid;index"`

	// Authentication
	Email        string `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string `json:"-" gorm:"not null"`
	Phone        string `json:"phone"`

	// Profile
	FirstName   string `json:"firstName" gorm:"not null"`
	LastName    string `json:"lastName"`
	DisplayName string `json:"displayName"`

	// Status
	IsActive      bool       `json:"isActive" gorm:"default:true"`
	IsVerified    bool       `json:"isVerified" gorm:"default:false"`
	IsSuperAdmin  bool       `json:"isSuperAdmin" gorm:"default:false"`
	LastLoginAt   *time.Time `json:"lastLoginAt"`
	LastLogin     *time.Time `json:"lastLogin"`
	LoginAttempts int        `json:"-" gorm:"default:0"`
	LockedUntil   *time.Time `json:"-"`

	// 2FA
	TwoFactorEnabled bool   `json:"twoFactorEnabled" gorm:"default:false"`
	TwoFactorSecret  string `json:"-"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Company         *Company         `json:"company" gorm:"foreignKey:CompanyID"`
	Roles           []UserRole       `json:"userRoles" gorm:"foreignKey:UserID"`
	AIConversations []AIConversation `json:"aiConversations" gorm:"foreignKey:UserID"`
}

// Roles Entity (RBAC)
type Role struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	CompanyID   *string   `json:"companyId" gorm:"type:uuid;index"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	Level       int       `json:"level" gorm:"default:0"`
	IsSystem    bool      `json:"isSystem" gorm:"default:false"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`

	// Relationships
	Company         *Company         `json:"company" gorm:"foreignKey:CompanyID"`
	UserRoles       []UserRole       `json:"userRoles" gorm:"foreignKey:RoleID"`
	RolePermissions []RolePermission `json:"rolePermissions" gorm:"foreignKey:RoleID"`
}

// Permissions Entity
type Permission struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Module      string    `json:"module" gorm:"not null"`
	Action      string    `json:"action" gorm:"not null"`
	Description string    `json:"description"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`

	// Relationships
	RolePermissions []RolePermission `json:"rolePermissions" gorm:"foreignKey:PermissionID"`
}

// User Roles Entity
type UserRole struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    string    `json:"userId" gorm:"type:uuid;not null"`
	RoleID    string    `json:"roleId" gorm:"type:uuid;not null"`
	CompanyID *string   `json:"companyId" gorm:"type:uuid;index"`
	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	User    *User    `json:"user" gorm:"foreignKey:UserID"`
	Role    *Role    `json:"role" gorm:"foreignKey:RoleID"`
	Company *Company `json:"company" gorm:"foreignKey:CompanyID"`
}

// Role Permissions Entity
type RolePermission struct {
	ID           string    `json:"id" gorm:"type:uuid;primaryKey"`
	RoleID       string    `json:"roleId" gorm:"type:uuid;not null"`
	PermissionID string    `json:"permissionId" gorm:"type:uuid;not null"`
	CompanyID    *string   `json:"companyId" gorm:"type:uuid;index"`
	CreatedAt    time.Time `json:"createdAt"`

	// Relationships
	Role       *Role       `json:"role" gorm:"foreignKey:RoleID"`
	Permission *Permission `json:"permission" gorm:"foreignKey:PermissionID"`
	Company    *Company    `json:"company" gorm:"foreignKey:CompanyID"`
}

// ============================================================================
// 8. ADDITIONAL MASTER DATA TABLES
// ============================================================================

// Customer Groups Entity
type CustomerGroup struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	CompanyID       *string   `json:"companyId" gorm:"type:uuid;index"`
	Name            string    `json:"name" gorm:"not null"`
	Code            string    `json:"code" gorm:"uniqueIndex;not null"`
	DiscountPercent float64   `json:"discountPercent" gorm:"default:0"`
	CreditLimit     float64   `json:"creditLimit" gorm:"default:0"`
	PaymentTerms    string    `json:"paymentTerms"`
	IsActive        bool      `json:"isActive" gorm:"default:true"`
	CreatedAt       time.Time `json:"createdAt"`

	// Relationships
	Company *Company `json:"company" gorm:"foreignKey:CompanyID"`
}

// Price Lists Entity
type PriceList struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	CompanyID   *string   `json:"companyId" gorm:"type:uuid;index"`
	Name        string    `json:"name" gorm:"not null"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	IsDefault   bool      `json:"isDefault" gorm:"default:false"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt"`

	// Relationships
	Company *Company               `json:"company" gorm:"foreignKey:CompanyID"`
	Items   []ProductPriceListItem `json:"items" gorm:"foreignKey:PriceListID"`
}

// Product Price List Items Entity
type ProductPriceListItem struct {
	ID              string     `json:"id" gorm:"type:uuid;primaryKey"`
	PriceListID     string     `json:"priceListId" gorm:"type:uuid;not null"`
	ProductID       string     `json:"productId" gorm:"type:uuid;not null"`
	SellingPrice    float64    `json:"sellingPrice" gorm:"not null"`
	DiscountPercent float64    `json:"discountPercent" gorm:"default:0"`
	EffectiveFrom   *time.Time `json:"effectiveFrom" gorm:"default:now()"`
	EffectiveTo     *time.Time `json:"effectiveTo"`
	IsActive        bool       `json:"isActive" gorm:"default:true"`
	CreatedAt       time.Time  `json:"createdAt"`

	// Relationships
	PriceList *PriceList `json:"priceList" gorm:"foreignKey:PriceListID"`
	Product   *Product   `json:"product" gorm:"foreignKey:ProductID"`
}

// Racks Entity (Warehouse locations)
type Rack struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	CompanyID *string   `json:"companyId" gorm:"type:uuid;index"`
	Name      string    `json:"name" gorm:"not null"`
	Code      string    `json:"code" gorm:"uniqueIndex;not null"`
	RackType  string    `json:"rackType"` // STORAGE, DISPLAY, COLD_STORAGE
	Capacity  float64   `json:"capacity"`
	Unit      string    `json:"unit"` // KG, LITERS, PIECES
	Location  string    `json:"location"`
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`

	// Relationships
	Company          *Company         `json:"company" gorm:"foreignKey:CompanyID"`
	InventoryBatches []InventoryBatch `json:"inventoryBatches" gorm:"foreignKey:RackNumber"`
}

// ============================================================================
// 9. AI AND ANALYTICS TABLES
// ============================================================================

// AI Models Entity
type AIModel struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name            string    `json:"name" gorm:"not null"`
	Code            string    `json:"code" gorm:"uniqueIndex;not null"`
	ModelType       string    `json:"modelType" gorm:"not null"` // OPENAI, LOCAL, HUGGINGFACE
	ModelName       string    `json:"modelName"`
	APIKeyEncrypted string    `json:"-"`
	BaseURL         string    `json:"baseUrl"`
	MaxTokens       int       `json:"maxTokens" gorm:"default:4000"`
	Temperature     float64   `json:"temperature" gorm:"default:0.7"`
	IsActive        bool      `json:"isActive" gorm:"default:true"`
	CreatedBy       string    `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`

	// Relationships
	Conversations []AIConversation `json:"conversations" gorm:"foreignKey:ModelID"`
}

// AI Conversations Entity
type AIConversation struct {
	ID               string    `json:"id" gorm:"type:uuid;primaryKey"`
	UserID           *string   `json:"userId" gorm:"type:uuid;index"`
	ModelID          string    `json:"modelId" gorm:"type:uuid;not null"`
	ConversationType string    `json:"conversationType"` // CHAT, ANALYSIS, RECOMMENDATION
	Title            string    `json:"title"`
	Messages         string    `json:"messages" gorm:"type:jsonb"`
	TotalTokens      int       `json:"totalTokens" gorm:"default:0"`
	TotalCost        float64   `json:"totalCost" gorm:"default:0"`
	CreatedAt        time.Time `json:"createdAt"`

	// Relationships
	User  *User    `json:"user" gorm:"foreignKey:UserID"`
	Model *AIModel `json:"model" gorm:"foreignKey:ModelID"`
}

// ============================================================================
// 10. EVENT SOURCING TABLES (Outbox Pattern)
// ============================================================================

// Outbox Events Entity (Event sourcing)
type OutboxEvent struct {
	ID            string     `json:"id" gorm:"type:uuid;primaryKey"`
	AggregateType string     `json:"aggregateType" gorm:"not null"`
	AggregateID   string     `json:"aggregateId" gorm:"not null"`
	EventType     string     `json:"eventType" gorm:"not null"`
	Payload       string     `json:"payload" gorm:"type:jsonb;not null"`
	CreatedAt     time.Time  `json:"createdAt" gorm:"default:now()"`
	PublishedAt   *time.Time `json:"publishedAt"`
	RetryCount    int        `json:"retryCount" gorm:"default:0"`
	MaxRetries    int        `json:"maxRetries" gorm:"default:3"`
	LastError     string     `json:"lastError"`
}

// Event Subscriptions Entity
type EventSubscription struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey"`
	SubscriberName string    `json:"subscriberName" gorm:"uniqueIndex;not null"`
	EventTypes     string    `json:"eventTypes" gorm:"type:text[]"`
	WebhookURL     string    `json:"webhookUrl"`
	IsActive       bool      `json:"isActive" gorm:"default:true"`
	CreatedAt      time.Time `json:"createdAt"`
}

// ============================================================================
// 11. ADDITIONAL ENTITIES FROM OTHER FILES
// ============================================================================

// POS Session Entity (from pos_session.go)
type POSSession struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey"`
	SessionNumber  string     `json:"sessionNumber" gorm:"uniqueIndex;not null"`
	EmployeeID     string     `json:"employeeId" gorm:"type:uuid;not null"`
	ShopID         string     `json:"shopId" gorm:"type:uuid;not null"`
	OpenTime       time.Time  `json:"openTime"`
	CloseTime      *time.Time `json:"closeTime"`
	OpeningBalance float64    `json:"openingBalance" gorm:"default:0"`
	ClosingBalance float64    `json:"closingBalance" gorm:"default:0"`
	CashSales      float64    `json:"cashSales" gorm:"default:0"`
	CardSales      float64    `json:"cardSales" gorm:"default:0"`
	TotalSales     float64    `json:"totalSales" gorm:"default:0"`
	Status         string     `json:"status"` // OPEN, CLOSED, RECONCILED
	Notes          string     `json:"notes"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`

	// Relationships
	Employee *User    `json:"employee" gorm:"foreignKey:EmployeeID"`
	Company  *Company `json:"company" gorm:"foreignKey:ShopID"`
}

// Product Import Entity (from product_import.go)
type ProductImport struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey"`
	ImportType     string     `json:"importType"` // EXCEL, CSV, API
	FileName       string     `json:"fileName"`
	FilePath       string     `json:"filePath"`
	TotalRows      int        `json:"totalRows"`
	ProcessedRows  int        `json:"processedRows" gorm:"default:0"`
	SuccessfulRows int        `json:"successfulRows" gorm:"default:0"`
	FailedRows     int        `json:"failedRows" gorm:"default:0"`
	Status         string     `json:"status"` // PENDING, PROCESSING, COMPLETED, FAILED
	ErrorLog       string     `json:"errorLog" gorm:"type:text"`
	StartedAt      *time.Time `json:"startedAt"`
	CompletedAt    *time.Time `json:"completedAt"`
	CreatedBy      string     `json:"createdBy" gorm:"not null"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// Bug Report Entity (from bug.go)
type BugReport struct {
	ID               string     `json:"id" gorm:"type:uuid;primaryKey"`
	Title            string     `json:"title" gorm:"not null"`
	Description      string     `json:"description" gorm:"type:text"`
	StepsToReproduce string     `json:"stepsToReproduce" gorm:"type:text"`
	ExpectedBehavior string     `json:"expectedBehavior"`
	ActualBehavior   string     `json:"actualBehavior"`
	Severity         string     `json:"severity"`    // LOW, MEDIUM, HIGH, CRITICAL
	Priority         string     `json:"priority"`    // LOW, MEDIUM, HIGH, URGENT
	Status           string     `json:"status"`      // OPEN, IN_PROGRESS, RESOLVED, CLOSED
	Environment      string     `json:"environment"` // DEVELOPMENT, STAGING, PRODUCTION
	Browser          string     `json:"browser"`
	OS               string     `json:"os"`
	UserAgent        string     `json:"userAgent"`
	URL              string     `json:"url"`
	UserID           *string    `json:"userId" gorm:"type:uuid"`
	AssignedTo       *string    `json:"assignedTo" gorm:"type:uuid"`
	Comments         string     `json:"comments" gorm:"type:text"`
	Resolution       string     `json:"resolution" gorm:"type:text"`
	ResolutionDate   *time.Time `json:"resolutionDate"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`

	// Relationships
	User     *User `json:"user" gorm:"foreignKey:UserID"`
	Assignee *User `json:"assignee" gorm:"foreignKey:AssignedTo"`
}

// ============================================================================
// TABLE NAME METHODS FOR GORM
// ============================================================================

// Master Data Table Names
func (Category) TableName() string { return "categories" }
func (Brand) TableName() string    { return "brands" }
func (Potency) TableName() string  { return "potencies" }
func (Form) TableName() string     { return "forms" }
func (Unit) TableName() string     { return "units" }
func (HSNCode) TableName() string  { return "hsn_codes" }

// Core Business Table Names
func (Product) TableName() string             { return "products" }
func (Customer) TableName() string            { return "customers" }
func (Vendor) TableName() string              { return "vendors" }
func (InventoryBatch) TableName() string      { return "inventory_batches" }
func (StockAdjustment) TableName() string     { return "stock_adjustments" }
func (SalesOrder) TableName() string          { return "sales_orders" }
func (SalesOrderItem) TableName() string      { return "sales_order_items" }
func (PurchaseOrder) TableName() string       { return "purchase_orders" }
func (PurchaseOrderItem) TableName() string   { return "purchase_order_items" }
func (PurchaseReceipt) TableName() string     { return "purchase_receipts" }
func (PurchaseReceiptItem) TableName() string { return "purchase_receipt_items" }
func (Payment) TableName() string             { return "payments" }

// RBAC Table Names
func (Company) TableName() string        { return "companies" }
func (User) TableName() string           { return "users" }
func (Role) TableName() string           { return "roles" }
func (Permission) TableName() string     { return "permissions" }
func (UserRole) TableName() string       { return "user_roles" }
func (RolePermission) TableName() string { return "role_permissions" }

// Additional Table Names
func (CustomerGroup) TableName() string        { return "customer_groups" }
func (PriceList) TableName() string            { return "price_lists" }
func (ProductPriceListItem) TableName() string { return "product_price_list_items" }
func (Rack) TableName() string                 { return "racks" }
func (AIModel) TableName() string              { return "ai_models" }
func (AIConversation) TableName() string       { return "ai_conversations" }
func (OutboxEvent) TableName() string          { return "outbox_events" }
func (EventSubscription) TableName() string    { return "event_subscriptions" }
func (POSSession) TableName() string           { return "pos_sessions" }
func (ProductImport) TableName() string        { return "product_imports" }
func (BugReport) TableName() string            { return "bug_reports" }

// Legacy aliases for backward compatibility
type InventoryTransaction = InventoryBatch // For backward compatibility
type Warehouse = Rack                      // For backward compatibility

// ============================================================================
// BARCODE SYSTEM STRUCTS
// ============================================================================

// ProductBarcode represents barcode records for products and batches
type ProductBarcode struct {
	ID          string     `json:"id" gorm:"type:uuid;primaryKey"`
	ProductID   string     `json:"productId" gorm:"type:uuid;not null"`
	BatchID     *string    `json:"batchId" gorm:"type:uuid"`
	BatchNo     string     `json:"batchNo" gorm:"not null"`
	Barcode     string     `json:"barcode" gorm:"uniqueIndex;not null"`
	BarcodeType string     `json:"barcodeType" gorm:"default:'EAN13'"`
	MRP         float64    `json:"mrp" gorm:"default:0"`
	ExpDate     *time.Time `json:"expDate"`
	Quantity    int        `json:"quantity" gorm:"default:1"`
	WarehouseID *string    `json:"warehouseId" gorm:"type:uuid"`
	Status      string     `json:"status" gorm:"default:'active'"`
	GeneratedAt time.Time  `json:"generatedAt"`
	CreatedBy   string     `json:"createdBy" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Relationships
	Product   *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch     *InventoryBatch `json:"batch" gorm:"foreignKey:BatchID"`
	Warehouse *Rack           `json:"warehouse" gorm:"foreignKey:WarehouseID"`
	Creator   *User           `json:"creator" gorm:"foreignKey:CreatedBy"`
}

func (ProductBarcode) TableName() string { return "product_barcodes" }

// ============================================================================
// ENHANCED PURCHASE SYSTEM STRUCTS
// ============================================================================

// PurchaseSummaryResponse represents purchase order summary for listings
type PurchaseSummaryResponse struct {
	ID            string                 `json:"id"`
	InvoiceNo     string                 `json:"invoiceNo"`
	InvoiceDate   time.Time              `json:"invoiceDate"`
	TotalAmount   float64                `json:"totalAmount"`
	Status        string                 `json:"status"`
	CreatedBy     string                 `json:"createdBy"`
	CreatedAt     time.Time              `json:"createdAt"`
	ApprovedAt    *time.Time             `json:"approvedAt"`
	SupplierName  string                 `json:"supplierName"`
	SupplierEmail string                 `json:"supplierEmail"`
	SupplierPhone string                 `json:"supplierPhone"`
	ItemsCount    int                    `json:"itemsCount"`
	Items         []PurchaseItemResponse `json:"items,omitempty"`
}

// PurchaseItemResponse represents purchase item details
type PurchaseItemResponse struct {
	ID              string     `json:"id"`
	ProductName     string     `json:"productName"`
	SKU             string     `json:"sku"`
	Category        string     `json:"category"`
	Brand           string     `json:"brand"`
	BatchNo         string     `json:"batchNo"`
	Qty             float64    `json:"qty"`
	Rate            float64    `json:"rate"`
	MRP             float64    `json:"mrp"`
	Amount          float64    `json:"amount"`
	MfgDate         *time.Time `json:"mfgDate"`
	ExpDate         *time.Time `json:"expDate"`
	DiscountPercent float64    `json:"discountPercent"`
	TaxPercent      float64    `json:"taxPercent"`
}

// PurchaseUploadRequest represents request for creating purchase orders
type PurchaseUploadRequest struct {
	SupplierID  uint                  `json:"supplierId"`
	InvoiceNo   string                `json:"invoiceNo"`
	InvoiceDate time.Time             `json:"invoiceDate"`
	Items       []PurchaseItemRequest `json:"items"`
	Notes       string                `json:"notes"`
}

// PurchaseItemRequest represents request for purchase item operations
type PurchaseItemRequest struct {
	ProductID       uint       `json:"productId"`
	BatchNo         string     `json:"batchNo"`
	Qty             float64    `json:"qty"`
	Rate            float64    `json:"rate"`
	MRP             float64    `json:"mrp"`
	MfgDate         *time.Time `json:"mfgDate"`
	ExpDate         *time.Time `json:"expDate"`
	DiscountPercent float64    `json:"discountPercent"`
	TaxPercent      float64    `json:"taxPercent"`
}

// EnhancedPurchaseOrder represents enhanced purchase order entity
type EnhancedPurchaseOrder struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	SupplierID  *uint      `json:"supplierId" gorm:"index"`
	InvoiceNo   string     `json:"invoiceNo" gorm:"uniqueIndex"`
	InvoiceDate time.Time  `json:"invoiceDate"`
	TotalAmount float64    `json:"totalAmount"`
	Status      string     `json:"status" gorm:"default:'draft'"`
	Notes       string     `json:"notes"`
	CreatedBy   string     `json:"createdBy"`
	ApprovedBy  *uint      `json:"approvedBy"`
	ApprovedAt  *time.Time `json:"approvedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Relationships
	Items    []EnhancedPurchaseItem `json:"items" gorm:"foreignKey:PurchaseID"`
	Supplier *Vendor                `json:"supplier" gorm:"foreignKey:SupplierID"`
}

func (EnhancedPurchaseOrder) TableName() string { return "purchase_orders" }

// EnhancedPurchaseItem represents enhanced purchase order item entity
type EnhancedPurchaseItem struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	PurchaseID      uint       `json:"purchaseId" gorm:"index"`
	ProductID       uint       `json:"productId" gorm:"index"`
	BatchNo         string     `json:"batchNo"`
	Qty             float64    `json:"qty"`
	Rate            float64    `json:"rate"`
	MRP             float64    `json:"mrp"`
	MfgDate         *time.Time `json:"mfgDate"`
	ExpDate         *time.Time `json:"expDate"`
	DiscountPercent float64    `json:"discountPercent"`
	TaxPercent      float64    `json:"taxPercent"`
	Amount          *float64   `json:"amount"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Product *Product `json:"product" gorm:"foreignKey:ProductID"`
}

func (EnhancedPurchaseItem) TableName() string { return "purchase_items" }

// EnhancedInventoryStock represents enhanced inventory stock entity
type EnhancedInventoryStock struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	ProductID    uint       `json:"productId" gorm:"index"`
	BatchNo      string     `json:"batchNo" gorm:"index"`
	WarehouseID  *uint      `json:"warehouseId" gorm:"index"`
	QtyIn        float64    `json:"qtyIn"`
	Balance      float64    `json:"balance"`
	PurchaseRate *float64   `json:"purchaseRate"`
	MRP          *float64   `json:"mrp"`
	MfgDate      *time.Time `json:"mfgDate"`
	ExpDate      *time.Time `json:"expDate"`
	LastTxnType  *string    `json:"lastTxnType"`
	LastTxnDate  *time.Time `json:"lastTxnDate"`
	Status       string     `json:"status" gorm:"default:'active'"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// Relationships
	Product *Product `json:"product" gorm:"foreignKey:ProductID"`
}

func (EnhancedInventoryStock) TableName() string { return "inventory_stock" }

// EnhancedStockTransaction represents enhanced stock transaction entity
type EnhancedStockTransaction struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	ProductID     uint      `json:"productId" gorm:"index"`
	BatchNo       *string   `json:"batchNo" gorm:"index"`
	WarehouseID   *uint     `json:"warehouseId" gorm:"index"`
	Type          string    `json:"type" gorm:"not null"` // IN, OUT
	Qty           float64   `json:"qty"`
	BalanceBefore *float64  `json:"balanceBefore"`
	BalanceAfter  *float64  `json:"balanceAfter"`
	Source        string    `json:"source"`
	RefID         *string   `json:"refId"`
	RefType       *string   `json:"refType"`
	Reason        *string   `json:"reason"`
	CreatedBy     *uint     `json:"createdBy"`
	CreatedAt     time.Time `json:"createdAt"`

	// Relationships
	Product   *Product        `json:"product" gorm:"foreignKey:ProductID"`
	Batch     *InventoryBatch `json:"batch" gorm:"foreignKey:BatchNo;references:BatchNumber"`
	Warehouse *Rack           `json:"warehouse" gorm:"foreignKey:WarehouseID"`
	Creator   *User           `json:"creator" gorm:"foreignKey:CreatedBy"`
}

func (EnhancedStockTransaction) TableName() string { return "stock_transactions" }

// ============================================================================
// INVENTORY SYSTEM STRUCTS
// ============================================================================

// StockSummaryResponse represents stock summary data for listings
type StockSummaryResponse struct {
	ProductID     string     `json:"product_id" gorm:"column:product_id"`
	ProductName   string     `json:"product_name" gorm:"column:product_name"`
	SKU           string     `json:"sku" gorm:"column:sku"`
	Category      string     `json:"category" gorm:"column:category"`
	Brand         string     `json:"brand" gorm:"column:brand"`
	BatchNo       string     `json:"batch_no" gorm:"column:batch_no"`
	QtyIn         float64    `json:"qty_in" gorm:"column:qty_in"`
	QtyOut        float64    `json:"qty_out" gorm:"column:qty_out"`
	Balance       float64    `json:"balance" gorm:"column:balance"`
	PurchaseRate  *float64   `json:"purchase_rate" gorm:"column:purchase_rate"`
	MRP           *float64   `json:"mrp" gorm:"column:mrp"`
	MfgDate       *time.Time `json:"mfg_date" gorm:"column:mfg_date"`
	ExpDate       *time.Time `json:"exp_date" gorm:"column:exp_date"`
	WarehouseName string     `json:"warehouse_name" gorm:"column:warehouse_name"`
	Status        string     `json:"status" gorm:"column:status"`
	LastTxnDate   *time.Time `json:"last_txn_date" gorm:"column:last_txn_date"`
	ExpiryStatus  string     `json:"expiry_status" gorm:"column:expiry_status"`
	MarginPercent float64    `json:"margin_percent" gorm:"column:margin_percent"`
}

// ManualStockEntryRequest represents request for manual stock entry
type ManualStockEntryRequest struct {
	ProductID    uint       `json:"productId"`
	BatchNo      string     `json:"batchNo"`
	Quantity     float64    `json:"quantity"`
	PurchaseRate *float64   `json:"purchaseRate"`
	MRP          *float64   `json:"mrp"`
	MfgDate      *time.Time `json:"mfgDate"`
	ExpDate      *time.Time `json:"expDate"`
	WarehouseID  *uint      `json:"warehouseId"`
	Reason       string     `json:"reason"`
	Notes        string     `json:"notes"`
}

// EnhancedLowStockAlert represents low stock alert entity
type EnhancedLowStockAlert struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	ProductID    uint       `json:"productId" gorm:"index"`
	BatchNo      string     `json:"batchNo" gorm:"index"`
	WarehouseID  *uint      `json:"warehouseId" gorm:"index"`
	CurrentStock float64    `json:"currentStock"`
	MinStock     float64    `json:"minStock"`
	AlertType    string     `json:"alertType"`
	Severity     string     `json:"severity"`
	IsResolved   bool       `json:"isResolved" gorm:"default:false"`
	ResolvedAt   *time.Time `json:"resolvedAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// Relationships
	Product   *Product `json:"product" gorm:"foreignKey:ProductID"`
	Warehouse *Rack    `json:"warehouse" gorm:"foreignKey:WarehouseID"`
}

func (EnhancedLowStockAlert) TableName() string { return "low_stock_alerts" }

// EnhancedExpiryAlert represents expiry alert entity
type EnhancedExpiryAlert struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	ProductID       uint       `json:"productId" gorm:"index"`
	BatchNo         string     `json:"batchNo" gorm:"index"`
	WarehouseID     *uint      `json:"warehouseId" gorm:"index"`
	ExpDate         time.Time  `json:"expDate"`
	DaysUntilExpiry int        `json:"daysUntilExpiry"`
	CurrentStock    float64    `json:"currentStock"`
	AlertType       string     `json:"alertType"`
	Severity        string     `json:"severity"`
	IsResolved      bool       `json:"isResolved" gorm:"default:false"`
	ResolvedAt      *time.Time `json:"resolvedAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Relationships
	Product   *Product `json:"product" gorm:"foreignKey:ProductID"`
	Warehouse *Rack    `json:"warehouse" gorm:"foreignKey:WarehouseID"`
}

func (EnhancedExpiryAlert) TableName() string { return "expiry_alerts" }

// ============================================================================
// PRODUCT IMPORT MODELS (for normalization system)
// ============================================================================

// ProductImportSession tracks bulk import progress
type ProductImportSession struct {
	ID            string     `json:"id" gorm:"type:uuid;primaryKey"`
	FileName      string     `json:"fileName"`
	UploadedBy    string     `json:"uploadedBy" gorm:"type:uuid;not null"`
	TotalRows     int        `json:"totalRows" gorm:"default:0"`
	ProcessedRows int        `json:"processedRows" gorm:"default:0"`
	SuccessRows   int        `json:"successRows" gorm:"default:0"`
	ErrorRows     int        `json:"errorRows" gorm:"default:0"`
	PendingReview int        `json:"pendingReview" gorm:"default:0"`
	Status        string     `json:"status" gorm:"default:'processing';index"` // processing, completed, failed
	StartedAt     time.Time  `json:"startedAt"`
	CompletedAt   *time.Time `json:"completedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// ProductImportStaging holds products pending review
type ProductImportStaging struct {
	ID               string     `json:"id" gorm:"type:uuid;primaryKey"`
	SessionID        string     `json:"sessionId" gorm:"type:uuid;not null;index"`
	RawData          string     `json:"rawData" gorm:"type:jsonb"`
	ProductName      string     `json:"productName" gorm:"type:varchar(500);not null"`
	BrandName        string     `json:"brandName"`
	Barcode          string     `json:"barcode"`
	HSNCode          string     `json:"hsnCode"`
	MRP              float64    `json:"mrp"`
	ParsedSubstance  string     `json:"parsedSubstance"`
	ParsedPotency    string     `json:"parsedPotency"`
	ParsedScale      string     `json:"parsedScale"`
	ParsedForm       string     `json:"parsedForm"`
	MatchedProductID *string    `json:"matchedProductId" gorm:"type:uuid"`
	MatchConfidence  float64    `json:"matchConfidence" gorm:"default:0"`
	MatchMethod      string     `json:"matchMethod"`
	Status           string     `json:"status" gorm:"default:'pending';index"`
	ErrorMessage     string     `json:"errorMessage" gorm:"type:text"`
	ReviewNotes      string     `json:"reviewNotes" gorm:"type:text"`
	ReviewedBy       *string    `json:"reviewedBy" gorm:"type:uuid"`
	ReviewedAt       *time.Time `json:"reviewedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// ============================================================================
// BILL SNAPSHOT & PRINTER SETTINGS MODELS
// ============================================================================

// PrinterSettings stores printer configuration per counter/user
type PrinterSettings struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey"`
	CounterID      string    `json:"counterId" gorm:"not null;index"`
	CounterName    string    `json:"counterName"`
	UserID         *string   `json:"userId" gorm:"type:uuid;index"`
	PaperSize      string    `json:"paperSize" gorm:"default:'3x5'"`       // '3x5' or '4x6'
	PrinterType    string    `json:"printerType" gorm:"default:'thermal'"` // 'thermal', 'a4', 'dot-matrix'
	PrinterName    string    `json:"printerName"`
	AutoPrint      bool      `json:"autoPrint" gorm:"default:false"`
	CopiesPerPrint int       `json:"copiesPerPrint" gorm:"default:1"`
	IsActive       bool      `json:"isActive" gorm:"default:true"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// BillSnapshot stores complete bill history
type BillSnapshot struct {
	ID              string  `json:"id" gorm:"type:uuid;primaryKey"`
	ReferenceType   string  `json:"referenceType" gorm:"not null;index"` // 'ORDER', 'INVOICE', 'QUOTATION'
	ReferenceID     string  `json:"referenceId" gorm:"type:uuid;not null;index"`
	ReferenceNumber string  `json:"referenceNumber" gorm:"index"`
	CustomerID      *string `json:"customerId" gorm:"type:uuid;index"`
	CustomerName    string  `json:"customerName"`
	CustomerPhone   string  `json:"customerPhone"`

	// Bill Details
	PaperSize   string `json:"paperSize" gorm:"not null"`
	BillData    string `json:"billData" gorm:"type:jsonb;not null"` // Complete bill structure
	PreviewText string `json:"previewText" gorm:"type:text"`        // Plain text version
	HTMLContent string `json:"htmlContent" gorm:"type:text"`        // HTML version
	PDFURL      string `json:"pdfUrl"`                              // If PDF generated

	// Amounts
	Subtotal       float64 `json:"subtotal"`
	DiscountAmount float64 `json:"discountAmount"`
	TaxAmount      float64 `json:"taxAmount"`
	TotalAmount    float64 `json:"totalAmount"`
	PaidAmount     float64 `json:"paidAmount"`
	BalanceAmount  float64 `json:"balanceAmount"`

	// Status tracking
	Status        string `json:"status" gorm:"default:'pending';index"`  // 'pending', 'completed', 'cancelled'
	PaymentStatus string `json:"paymentStatus" gorm:"default:'pending'"` // 'pending', 'partial', 'paid'

	// Metadata
	PrintedAt      *time.Time `json:"printedAt"`
	EmailedAt      *time.Time `json:"emailedAt"`
	WhatsAppSentAt *time.Time `json:"whatsappSentAt"`

	CreatedAt time.Time `json:"createdAt"`
	CreatedBy string    `json:"createdBy"`
}

// CustomerBillHistory represents a customer's bill history item
type CustomerBillHistory struct {
	ID              string     `json:"id"`
	ReferenceType   string     `json:"referenceType"`
	ReferenceNumber string     `json:"referenceNumber"`
	CustomerID      string     `json:"customerId"`
	CustomerName    string     `json:"customerName"`
	PaperSize       string     `json:"paperSize"`
	TotalAmount     float64    `json:"totalAmount"`
	PaidAmount      float64    `json:"paidAmount"`
	BalanceAmount   float64    `json:"balanceAmount"`
	Status          string     `json:"status"`
	PaymentStatus   string     `json:"paymentStatus"`
	CreatedAt       time.Time  `json:"createdAt"`
	PrintedAt       *time.Time `json:"printedAt"`
	IsEndingBill    bool       `json:"isEndingBill"`
}

// CustomerLastBill represents customer's most recent ending bill
type CustomerLastBill struct {
	CustomerID        string    `json:"customerId"`
	LastBillID        string    `json:"lastBillId"`
	LastBillNumber    string    `json:"lastBillNumber"`
	ReferenceType     string    `json:"referenceType"`
	LastTotal         float64   `json:"lastTotal"`
	LastPaid          float64   `json:"lastPaid"`
	LastBalance       float64   `json:"lastBalance"`
	LastStatus        string    `json:"lastStatus"`
	LastPaymentStatus string    `json:"lastPaymentStatus"`
	LastBillDate      time.Time `json:"lastBillDate"`
}
