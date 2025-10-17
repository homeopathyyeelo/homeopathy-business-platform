// Complete ERP Models for Homeopathy Business Platform
// This file contains all master data models for the comprehensive ERP system

package main

import (
	"time"
	"gorm.io/gorm"
)

// ==================== BASE ENTITY ====================

type BaseEntity struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}

// ==================== USER & AUTHENTICATION ====================

type User struct {
	BaseEntity
	Username       string    `gorm:"uniqueIndex;not null;size:100" json:"username" validate:"required,min=3,max=100"`
	Email          string    `gorm:"uniqueIndex;not null;size:255" json:"email" validate:"required,email"`
	Password       string    `gorm:"not null;size:255" json:"password" validate:"required,min=8"`
	FirstName      string    `gorm:"size:100" json:"first_name"`
	LastName       string    `gorm:"size:100" json:"last_name"`
	Phone          string    `gorm:"size:20" json:"phone"`
	Role           string    `gorm:"default:user;size:50" json:"role" validate:"oneof=admin manager user"`
	IsEmailVerified bool     `gorm:"default:false" json:"is_email_verified"`
	LastLoginAt    *time.Time `json:"last_login_at"`
	LoginAttempts  int       `gorm:"default:0" json:"login_attempts"`
	IsLocked       bool      `gorm:"default:false" json:"is_locked"`
	LockedUntil    *time.Time `json:"locked_until"`
	TwoFactorEnabled bool    `gorm:"default:false" json:"two_factor_enabled"`
	TwoFactorSecret  string  `gorm:"size:255" json:"two_factor_secret"`
	ProfilePicture   string  `gorm:"size:500" json:"profile_picture"`
	Groups           []UserGroup `gorm:"many2many:user_groups;" json:"groups"`
}

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type UserGroup struct {
	BaseEntity
	Name        string `gorm:"not null;size:100" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	ParentID    *string `gorm:"index" json:"parent_id"`
	Users       []User `gorm:"many2many:user_groups;" json:"users"`
	Permissions []Permission `gorm:"many2many:group_permissions;" json:"permissions"`
}

type Permission struct {
	BaseEntity
	Name        string `gorm:"uniqueIndex;not null;size:100" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	Resource    string `gorm:"not null;size:100" json:"resource" validate:"required"`
	Action      string `gorm:"not null;size:50" json:"action" validate:"required"`
	Groups      []UserGroup `gorm:"many2many:group_permissions;" json:"groups"`
}

// ==================== COMPANY & ORGANIZATION ====================

type Company struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Address     string `gorm:"type:text" json:"address"`
	City        string `gorm:"size:100" json:"city"`
	State       string `gorm:"size:100" json:"state"`
	Country     string `gorm:"size:100" json:"country"`
	Pincode     string `gorm:"size:20" json:"pincode"`
	Phone       string `gorm:"size:20" json:"phone"`
	Email       string `gorm:"size:255" json:"email"`
	GSTNumber   string `gorm:"size:50" json:"gst_number"`
	PANNumber   string `gorm:"size:20" json:"pan_number"`
	Website     string `gorm:"size:255" json:"website"`
	Logo        string `gorm:"size:500" json:"logo"`
	IsMain      bool   `gorm:"default:true" json:"is_main"`
	Branches    []Branch `gorm:"foreignKey:CompanyID" json:"branches"`
}

type Branch struct {
	BaseEntity
	CompanyID     string `gorm:"not null;index" json:"company_id" validate:"required"`
	Name          string `gorm:"not null;size:255" json:"name" validate:"required"`
	Address       string `gorm:"type:text" json:"address"`
	City          string `gorm:"size:100" json:"city"`
	State         string `gorm:"size:100" json:"state"`
	Country       string `gorm:"size:100" json:"country"`
	Pincode       string `gorm:"size:20" json:"pincode"`
	Phone         string `gorm:"size:20" json:"phone"`
	Email         string `gorm:"size:255" json:"email"`
	BranchType    string `gorm:"size:50" json:"branch_type"`
	Region        string `gorm:"size:100" json:"region"`
	IsHeadOffice  bool   `gorm:"default:false" json:"is_head_office"`
	ManagerID     *string `gorm:"index" json:"manager_id"`
	Company       Company `gorm:"foreignKey:CompanyID" json:"company"`
}

// ==================== PRODUCT MANAGEMENT ====================

type Category struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	ParentID    *string `gorm:"index" json:"parent_id"`
	HSNCode     string `gorm:"size:50" json:"hsn_code"`
	GSTRate     float64 `gorm:"type:decimal(5,2);default:18.00" json:"gst_rate"`
	Image       string `gorm:"size:500" json:"image"`
	SortOrder   int    `gorm:"default:0" json:"sort_order"`
	Products    []Product `gorm:"foreignKey:CategoryID" json:"products"`
}

type Brand struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	Logo        string `gorm:"size:500" json:"logo"`
	Website     string `gorm:"size:255" json:"website"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	Products    []Product `gorm:"foreignKey:BrandID" json:"products"`
}

type Unit struct {
	BaseEntity
	Name       string  `gorm:"not null;size:100" json:"name" validate:"required"`
	ShortName  string  `gorm:"not null;size:10" json:"short_name" validate:"required"`
	BaseUnitID *string `gorm:"index" json:"base_unit_id"`
	ConversionFactor float64 `gorm:"type:decimal(10,4);default:1.0000" json:"conversion_factor"`
	UnitType   string  `gorm:"size:50" json:"unit_type"` // weight, volume, length, etc.
	Products   []Product `gorm:"foreignKey:PurchaseUnitID;references:ID" json:"purchase_unit_products"`
	SaleProducts []Product `gorm:"foreignKey:SaleUnitID;references:ID" json:"sale_unit_products"`
}

type Product struct {
	BaseEntity
	ProductCode    string  `gorm:"uniqueIndex;not null;size:100" json:"product_code" validate:"required"`
	Name           string  `gorm:"not null;size:255" json:"name" validate:"required"`
	Description    string  `gorm:"type:text" json:"description"`
	CategoryID     string  `gorm:"not null;index" json:"category_id" validate:"required"`
	BrandID        string  `gorm:"index" json:"brand_id"`
	PurchaseUnitID string  `gorm:"not null;index" json:"purchase_unit_id" validate:"required"`
	SaleUnitID     string  `gorm:"not null;index" json:"sale_unit_id" validate:"required"`
	HSNCode        string  `gorm:"size:20" json:"hsn_code"`
	Potency        string  `gorm:"size:50" json:"potency"`
	Form           string  `gorm:"size:100" json:"form"` // tablet, liquid, powder, etc.
	Strength       string  `gorm:"size:100" json:"strength"`
	PackSize       string  `gorm:"size:100" json:"pack_size"`
	Manufacturer   string  `gorm:"size:255" json:"manufacturer"`
	BatchNumber    string  `gorm:"size:100" json:"batch_number"`
	ExpiryDate     *time.Time `json:"expiry_date"`
	PurchasePrice  float64 `gorm:"type:decimal(10,2);default:0.00" json:"purchase_price"`
	WholesalePrice float64 `gorm:"type:decimal(10,2);default:0.00" json:"wholesale_price"`
	RetailPrice    float64 `gorm:"type:decimal(10,2);default:0.00" json:"retail_price"`
	MRP            float64 `gorm:"type:decimal(10,2);default:0.00" json:"mrp"`
	MinStockLevel  int     `gorm:"default:0" json:"min_stock_level"`
	ReorderLevel   int     `gorm:"default:0" json:"reorder_level"`
	MaxStockLevel  int     `gorm:"default:0" json:"max_stock_level"`
	RackLocation   string  `gorm:"size:100" json:"rack_location"`
	ShelfLocation  string  `gorm:"size:100" json:"shelf_location"`
	Barcode        string  `gorm:"size:100" json:"barcode"`
	QRCode         string  `gorm:"size:500" json:"qr_code"`
	Image          string  `gorm:"size:500" json:"image"`
	IsPrescriptionRequired bool `gorm:"default:false" json:"is_prescription_required"`
	IsActive       bool    `gorm:"default:true" json:"is_active"`
	Category       Category `gorm:"foreignKey:CategoryID" json:"category"`
	Brand          Brand    `gorm:"foreignKey:BrandID" json:"brand"`
	PurchaseUnit   Unit     `gorm:"foreignKey:PurchaseUnitID" json:"purchase_unit"`
	SaleUnit       Unit     `gorm:"foreignKey:SaleUnitID" json:"sale_unit"`
	InventoryItems []InventoryItem `gorm:"foreignKey:ProductID" json:"inventory_items"`
}

// ==================== INVENTORY MANAGEMENT ====================

type Warehouse struct {
	BaseEntity
	Code         string `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name         string `gorm:"not null;size:255" json:"name" validate:"required"`
	Address      string `gorm:"type:text" json:"address"`
	City         string `gorm:"size:100" json:"city"`
	State        string `gorm:"size:100" json:"state"`
	Country      string `gorm:"size:100" json:"country"`
	Pincode      string `gorm:"size:20" json:"pincode"`
	Phone        string `gorm:"size:20" json:"phone"`
	Email        string `gorm:"size:255" json:"email"`
	ContactPerson string `gorm:"size:255" json:"contact_person"`
	Capacity     int    `gorm:"default:0" json:"capacity"`
	WarehouseType string `gorm:"size:50" json:"warehouse_type"` // main, branch, cold_storage
	Temperature  float64 `gorm:"type:decimal(5,2)" json:"temperature"`
	Humidity     float64 `gorm:"type:decimal(5,2)" json:"humidity"`
	IsActive     bool   `gorm:"default:true" json:"is_active"`
	ManagerID    *string `gorm:"index" json:"manager_id"`
	InventoryItems []InventoryItem `gorm:"foreignKey:WarehouseID" json:"inventory_items"`
}

type InventoryItem struct {
	BaseEntity
	ProductID    string  `gorm:"not null;index" json:"product_id" validate:"required"`
	WarehouseID  string  `gorm:"not null;index" json:"warehouse_id" validate:"required"`
	BatchNumber  string  `gorm:"size:100" json:"batch_number"`
	Quantity     int     `gorm:"default:0" json:"quantity"`
	ReservedQty  int     `gorm:"default:0" json:"reserved_qty"`
	AvailableQty int     `gorm:"default:0" json:"available_qty"`
	UnitCost     float64 `gorm:"type:decimal(10,2);default:0.00" json:"unit_cost"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	MfgDate      *time.Time `json:"mfg_date"`
	Location     string `gorm:"size:100" json:"location"`
	Notes        string `gorm:"type:text" json:"notes"`
	Product      Product `gorm:"foreignKey:ProductID" json:"product"`
	Warehouse    Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse"`
}

type StockAdjustment struct {
	BaseEntity
	InventoryItemID string    `gorm:"not null;index" json:"inventory_item_id" validate:"required"`
	AdjustmentType  string    `gorm:"not null;size:50" json:"adjustment_type" validate:"oneof=addition subtraction damage expiry return"`
	Quantity        int       `gorm:"not null" json:"quantity" validate:"min=1"`
	Reason          string    `gorm:"not null;size:255" json:"reason" validate:"required"`
	ReferenceNumber string   `gorm:"size:100" json:"reference_number"`
	ApprovedBy      *string   `gorm:"index" json:"approved_by"`
	ApprovedAt      *time.Time `json:"approved_at"`
	Notes           string    `gorm:"type:text" json:"notes"`
	InventoryItem   InventoryItem `gorm:"foreignKey:InventoryItemID" json:"inventory_item"`
}

// ==================== CUSTOMER MANAGEMENT ====================

type Customer struct {
	BaseEntity
	CustomerCode    string `gorm:"uniqueIndex;not null;size:50" json:"customer_code" validate:"required"`
	Name            string `gorm:"not null;size:255" json:"name" validate:"required"`
	ContactPerson   string `gorm:"size:255" json:"contact_person"`
	Phone           string `gorm:"size:20" json:"phone"`
	Email           string `gorm:"size:255" json:"email"`
	Address         string `gorm:"type:text" json:"address"`
	City            string `gorm:"size:100" json:"city"`
	State           string `gorm:"size:100" json:"state"`
	Country         string `gorm:"size:100" json:"country"`
	Pincode         string `gorm:"size:20" json:"pincode"`
	GSTNumber       string `gorm:"size:50" json:"gst_number"`
	PANNumber       string `gorm:"size:20" json:"pan_number"`
	DateOfBirth     *time.Time `json:"date_of_birth"`
	Gender          string `gorm:"size:10" json:"gender"`
	MaritalStatus   string `gorm:"size:20" json:"marital_status"`
	Occupation      string `gorm:"size:100" json:"occupation"`
	IncomeRange     string `gorm:"size:50" json:"income_range"`
	CreditLimit     float64 `gorm:"type:decimal(12,2);default:0.00" json:"credit_limit"`
	PaymentTerms    string `gorm:"size:100" json:"payment_terms"`
	LoyaltyPoints   int    `gorm:"default:0" json:"loyalty_points"`
	MarketingConsent bool   `gorm:"default:false" json:"marketing_consent"`
	CustomerType    string `gorm:"size:50" json:"customer_type"` // retail, wholesale, institutional
	CustomerGroupID *string `gorm:"index" json:"customer_group_id"`
	ReferralSource  string `gorm:"size:100" json:"referral_source"`
	Notes           string `gorm:"type:text" json:"notes"`
	IsActive        bool   `gorm:"default:true" json:"is_active"`
	Orders          []SalesOrder `gorm:"foreignKey:CustomerID" json:"orders"`
}

// ==================== VENDOR MANAGEMENT ====================

type Vendor struct {
	BaseEntity
	VendorCode      string `gorm:"uniqueIndex;not null;size:50" json:"vendor_code" validate:"required"`
	Name            string `gorm:"not null;size:255" json:"name" validate:"required"`
	ContactPerson   string `gorm:"size:255" json:"contact_person"`
	Phone           string `gorm:"size:20" json:"phone"`
	Email           string `gorm:"size:255" json:"email"`
	Address         string `gorm:"type:text" json:"address"`
	City            string `gorm:"size:100" json:"city"`
	State           string `gorm:"size:100" json:"state"`
	Country         string `gorm:"size:100" json:"country"`
	Pincode         string `gorm:"size:20" json:"pincode"`
	GSTNumber       string `gorm:"size:50" json:"gst_number"`
	PANNumber       string `gorm:"size:20" json:"pan_number"`
	Website         string `gorm:"size:255" json:"website"`
	VendorType      string `gorm:"size:50" json:"vendor_type"` // manufacturer, distributor, wholesaler
	PaymentTerms    string `gorm:"size:100" json:"payment_terms"`
	CreditLimit     float64 `gorm:"type:decimal(12,2);default:0.00" json:"credit_limit"`
	LeadTime        int    `gorm:"default:0" json:"lead_time"` // days
	MinimumOrder    float64 `gorm:"type:decimal(12,2);default:0.00" json:"minimum_order"`
	Rating          float64 `gorm:"type:decimal(3,2);default:0.00" json:"rating"`
	IsPreferred     bool   `gorm:"default:false" json:"is_preferred"`
	Notes           string `gorm:"type:text" json:"notes"`
	IsActive        bool   `gorm:"default:true" json:"is_active"`
	PurchaseOrders  []PurchaseOrder `gorm:"foreignKey:VendorID" json:"purchase_orders"`
}

// ==================== SALES MANAGEMENT ====================

type SalesOrder struct {
	BaseEntity
	OrderNumber   string    `gorm:"uniqueIndex;not null;size:50" json:"order_number" validate:"required"`
	CustomerID    string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	OrderDate     time.Time `gorm:"not null" json:"order_date"`
	DueDate       *time.Time `json:"due_date"`
	Status        string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft confirmed processing shipped delivered cancelled"`
	SubTotal      float64   `gorm:"type:decimal(12,2);default:0.00" json:"sub_total"`
	TaxAmount     float64   `gorm:"type:decimal(12,2);default:0.00" json:"tax_amount"`
	DiscountAmount float64  `gorm:"type:decimal(12,2);default:0.00" json:"discount_amount"`
	TotalAmount   float64   `gorm:"type:decimal(12,2);default:0.00" json:"total_amount"`
	PaidAmount    float64   `gorm:"type:decimal(12,2);default:0.00" json:"paid_amount"`
	BalanceAmount float64   `gorm:"type:decimal(12,2);default:0.00" json:"balance_amount"`
	PaymentStatus string    `gorm:"not null;default:pending;size:20" json:"payment_status" validate:"oneof=pending partial_paid paid overdue"`
	ShippingAddress string  `gorm:"type:text" json:"shipping_address"`
	BillingAddress  string  `gorm:"type:text" json:"billing_address"`
	ShippingMethod  string `gorm:"size:100" json:"shipping_method"`
	TrackingNumber  string `gorm:"size:100" json:"tracking_number"`
	Notes           string `gorm:"type:text" json:"notes"`
	SalespersonID   *string `gorm:"index" json:"salesperson_id"`
	Customer        Customer `gorm:"foreignKey:CustomerID" json:"customer"`
	Items           []SalesOrderItem `gorm:"foreignKey:SalesOrderID" json:"items"`
}

type SalesOrderItem struct {
	BaseEntity
	SalesOrderID    string  `gorm:"not null;index" json:"sales_order_id" validate:"required"`
	ProductID       string  `gorm:"not null;index" json:"product_id" validate:"required"`
	Quantity        int     `gorm:"not null" json:"quantity" validate:"min=1"`
	UnitPrice       float64 `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	DiscountPercent float64 `gorm:"type:decimal(5,2);default:0.00" json:"discount_percent"`
	TaxPercent      float64 `gorm:"type:decimal(5,2);default:0.00" json:"tax_percent"`
	LineTotal       float64 `gorm:"type:decimal(12,2);default:0.00" json:"line_total"`
	Notes           string  `gorm:"type:text" json:"notes"`
	Product         Product `gorm:"foreignKey:ProductID" json:"product"`
}

type Invoice struct {
	BaseEntity
	InvoiceNumber  string    `gorm:"uniqueIndex;not null;size:50" json:"invoice_number" validate:"required"`
	SalesOrderID   *string   `gorm:"index" json:"sales_order_id"`
	CustomerID     string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	InvoiceDate    time.Time `gorm:"not null" json:"invoice_date"`
	DueDate        *time.Time `json:"due_date"`
	SubTotal       float64   `gorm:"type:decimal(12,2);default:0.00" json:"sub_total"`
	TaxAmount      float64   `gorm:"type:decimal(12,2);default:0.00" json:"tax_amount"`
	DiscountAmount float64   `gorm:"type:decimal(12,2);default:0.00" json:"discount_amount"`
	TotalAmount    float64   `gorm:"type:decimal(12,2);default:0.00" json:"total_amount"`
	PaidAmount     float64   `gorm:"type:decimal(12,2);default:0.00" json:"paid_amount"`
	BalanceAmount  float64   `gorm:"type:decimal(12,2);default:0.00" json:"balance_amount"`
	Status         string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft sent paid overdue cancelled"`
	PaymentStatus  string    `gorm:"not null;default:pending;size:20" json:"payment_status" validate:"oneof=pending partial_paid paid overdue"`
	Notes          string    `gorm:"type:text" json:"notes"`
	Customer       Customer  `gorm:"foreignKey:CustomerID" json:"customer"`
}

// ==================== PURCHASE MANAGEMENT ====================

type PurchaseOrder struct {
	BaseEntity
	PONumber      string    `gorm:"uniqueIndex;not null;size:50" json:"po_number" validate:"required"`
	VendorID      string    `gorm:"not null;index" json:"vendor_id" validate:"required"`
	OrderDate     time.Time `gorm:"not null" json:"order_date"`
	ExpectedDate  *time.Time `json:"expected_date"`
	Status        string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft sent partial_received received cancelled"`
	SubTotal      float64   `gorm:"type:decimal(12,2);default:0.00" json:"sub_total"`
	TaxAmount     float64   `gorm:"type:decimal(12,2);default:0.00" json:"tax_amount"`
	DiscountAmount float64  `gorm:"type:decimal(12,2);default:0.00" json:"discount_amount"`
	TotalAmount   float64   `gorm:"type:decimal(12,2);default:0.00" json:"total_amount"`
	ReceivedQty   int       `gorm:"default:0" json:"received_qty"`
	ShippingAddress string  `gorm:"type:text" json:"shipping_address"`
	BillingAddress  string  `gorm:"type:text" json:"billing_address"`
	Notes         string    `gorm:"type:text" json:"notes"`
	PaymentTerms  string    `gorm:"size:100" json:"payment_terms"`
	ApprovedBy    *string   `gorm:"index" json:"approved_by"`
	ApprovedAt    *time.Time `json:"approved_at"`
	Vendor        Vendor    `gorm:"foreignKey:VendorID" json:"vendor"`
	Items         []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID" json:"items"`
}

type PurchaseOrderItem struct {
	BaseEntity
	PurchaseOrderID string  `gorm:"not null;index" json:"purchase_order_id" validate:"required"`
	ProductID       string  `gorm:"not null;index" json:"product_id" validate:"required"`
	Quantity        int     `gorm:"not null" json:"quantity" validate:"min=1"`
	UnitPrice       float64 `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	DiscountPercent float64 `gorm:"type:decimal(5,2);default:0.00" json:"discount_percent"`
	TaxPercent      float64 `gorm:"type:decimal(5,2);default:0.00" json:"tax_percent"`
	LineTotal       float64 `gorm:"type:decimal(12,2);default:0.00" json:"line_total"`
	ReceivedQty     int     `gorm:"default:0" json:"received_qty"`
	Notes           string  `gorm:"type:text" json:"notes"`
	Product         Product `gorm:"foreignKey:ProductID" json:"product"`
}

// ==================== FINANCIAL MANAGEMENT ====================

type Ledger struct {
	BaseEntity
	Code        string  `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string  `gorm:"not null;size:255" json:"name" validate:"required"`
	Type        string  `gorm:"not null;size:50" json:"type" validate:"oneof=asset liability equity income expense"`
	Group       string  `gorm:"size:100" json:"group"`
	SubGroup    string  `gorm:"size:100" json:"sub_group"`
	OpeningBalance float64 `gorm:"type:decimal(15,2);default:0.00" json:"opening_balance"`
	CurrentBalance float64 `gorm:"type:decimal(15,2);default:0.00" json:"current_balance"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
	Transactions []Transaction `gorm:"foreignKey:LedgerID" json:"transactions"`
}

type Transaction struct {
	BaseEntity
	TransactionNumber string    `gorm:"uniqueIndex;not null;size:50" json:"transaction_number" validate:"required"`
	Date              time.Time `gorm:"not null" json:"date"`
	Type              string    `gorm:"not null;size:50" json:"type" validate:"oneof=debit credit"`
	Amount            float64   `gorm:"type:decimal(15,2);not null" json:"amount" validate:"min=0"`
	Description       string    `gorm:"size:255" json:"description"`
	ReferenceNumber   string    `gorm:"size:100" json:"reference_number"`
	LedgerID          string    `gorm:"not null;index" json:"ledger_id" validate:"required"`
	RelatedLedgerID   *string   `gorm:"index" json:"related_ledger_id"`
	Narration         string    `gorm:"type:text" json:"narration"`
	PostedBy          *string   `gorm:"index" json:"posted_by"`
	PostedAt          *time.Time `json:"posted_at"`
	IsPosted          bool      `gorm:"default:false" json:"is_posted"`
	Ledger            Ledger    `gorm:"foreignKey:LedgerID" json:"ledger"`
}

// ==================== HR MANAGEMENT ====================

type Employee struct {
	BaseEntity
	EmployeeCode  string    `gorm:"uniqueIndex;not null;size:50" json:"employee_code" validate:"required"`
	FirstName     string    `gorm:"not null;size:100" json:"first_name" validate:"required"`
	LastName      string    `gorm:"size:100" json:"last_name"`
	Email         string    `gorm:"uniqueIndex;size:255" json:"email"`
	Phone         string    `gorm:"size:20" json:"phone"`
	Address       string    `gorm:"type:text" json:"address"`
	City          string    `gorm:"size:100" json:"city"`
	State         string    `gorm:"size:100" json:"state"`
	Country       string    `gorm:"size:100" json:"country"`
	Pincode       string    `gorm:"size:20" json:"pincode"`
	DateOfBirth   *time.Time `json:"date_of_birth"`
	Gender        string    `gorm:"size:10" json:"gender"`
	MaritalStatus string    `gorm:"size:20" json:"marital_status"`
	DepartmentID  *string   `gorm:"index" json:"department_id"`
	DesignationID *string   `gorm:"index" json:"designation_id"`
	BranchID      *string   `gorm:"index" json:"branch_id"`
	DateOfJoining *time.Time `json:"date_of_joining"`
	DateOfLeaving *time.Time `json:"date_of_leaving"`
	Salary        float64   `gorm:"type:decimal(12,2);default:0.00" json:"salary"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	UserID        *string   `gorm:"uniqueIndex" json:"user_id"`
	User          User      `gorm:"foreignKey:UserID" json:"user"`
}

type Department struct {
	BaseEntity
	Code        string `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string `gorm:"not null;size:100" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	HeadID      *string `gorm:"index" json:"head_id"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	Employees   []Employee `gorm:"foreignKey:DepartmentID" json:"employees"`
}

type Designation struct {
	BaseEntity
	Code        string `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string `gorm:"not null;size:100" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	Level       int    `gorm:"default:1" json:"level"`
	DepartmentID *string `gorm:"index" json:"department_id"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	Employees   []Employee `gorm:"foreignKey:DesignationID" json:"employees"`
}

// ==================== MARKETING & CRM ====================

type Campaign struct {
	BaseEntity
	Code         string    `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name         string    `gorm:"not null;size:255" json:"name" validate:"required"`
	Description  string    `gorm:"type:text" json:"description"`
	CampaignType string    `gorm:"not null;size:50" json:"campaign_type" validate:"oneof=email sms whatsapp social_media"`
	StartDate    time.Time `gorm:"not null" json:"start_date"`
	EndDate      *time.Time `json:"end_date"`
	Budget       float64   `gorm:"type:decimal(12,2);default:0.00" json:"budget"`
	Spent        float64   `gorm:"type:decimal(12,2);default:0.00" json:"spent"`
	Status       string    `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft active paused completed cancelled"`
	TargetAudience string  `gorm:"type:text" json:"target_audience"`
	Channels     []string  `gorm:"type:jsonb" json:"channels"`
	Metrics      map[string]interface{} `gorm:"type:jsonb" json:"metrics"`
	CreatedBy    *string   `gorm:"index" json:"created_by"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
}

type Lead struct {
	BaseEntity
	LeadNumber     string    `gorm:"uniqueIndex;not null;size:50" json:"lead_number" validate:"required"`
	FirstName      string    `gorm:"not null;size:100" json:"first_name" validate:"required"`
	LastName       string    `gorm:"size:100" json:"last_name"`
	Email          string    `gorm:"size:255" json:"email"`
	Phone          string    `gorm:"size:20" json:"phone"`
	Company        string    `gorm:"size:255" json:"company"`
	Source         string    `gorm:"size:100" json:"source"`
	Status         string    `gorm:"not null;default:new;size:20" json:"status" validate:"oneof=new contacted qualified proposal negotiation closed lost"`
	Value          float64   `gorm:"type:decimal(12,2);default:0.00" json:"value"`
	Probability    float64   `gorm:"type:decimal(5,2);default:0.00" json:"probability"`
	ExpectedClose  *time.Time `json:"expected_close"`
	AssignedTo     *string   `gorm:"index" json:"assigned_to"`
	Notes          string    `gorm:"type:text" json:"notes"`
	FollowUps      []FollowUp `gorm:"foreignKey:LeadID" json:"follow_ups"`
}

type FollowUp struct {
	BaseEntity
	LeadID       string    `gorm:"not null;index" json:"lead_id" validate:"required"`
	Subject      string    `gorm:"not null;size:255" json:"subject" validate:"required"`
	Description  string    `gorm:"type:text" json:"description"`
	FollowUpDate time.Time `gorm:"not null" json:"follow_up_date"`
	Status       string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending completed rescheduled cancelled"`
	AssignedTo   *string   `gorm:"index" json:"assigned_to"`
	Lead         Lead      `gorm:"foreignKey:LeadID" json:"lead"`
}

// ==================== SYSTEM CONFIGURATION ====================

type SystemSetting struct {
	BaseEntity
	Key          string `gorm:"uniqueIndex;not null;size:100" json:"key" validate:"required"`
	Value        string `gorm:"type:text" json:"value"`
	Description  string `gorm:"size:255" json:"description"`
	Category     string `gorm:"size:50" json:"category"`
	DataType     string `gorm:"not null;size:20" json:"data_type" validate:"oneof=string number boolean json"`
	IsSystem     bool   `gorm:"default:false" json:"is_system"`
	IsEditable   bool   `gorm:"default:true" json:"is_editable"`
}

type AuditLog struct {
	BaseEntity
	UserID      *string `gorm:"index" json:"user_id"`
	Action      string  `gorm:"not null;size:100" json:"action" validate:"required"`
	Resource    string  `gorm:"not null;size:100" json:"resource" validate:"required"`
	ResourceID  string  `gorm:"size:100" json:"resource_id"`
	OldValues   map[string]interface{} `gorm:"type:jsonb" json:"old_values"`
	NewValues   map[string]interface{} `gorm:"type:jsonb" json:"new_values"`
	IPAddress   string  `gorm:"size:45" json:"ip_address"`
	UserAgent   string  `gorm:"size:500" json:"user_agent"`
	Success     bool    `gorm:"default:true" json:"success"`
	ErrorMessage string `gorm:"type:text" json:"error_message"`
}

// ==================== CMS & CONTENT ====================

type Page struct {
	BaseEntity
	Title       string `gorm:"not null;size:255" json:"title" validate:"required"`
	Slug        string `gorm:"uniqueIndex;not null;size:255" json:"slug" validate:"required"`
	Content     string `gorm:"type:text" json:"content"`
	Excerpt     string `gorm:"size:500" json:"excerpt"`
	MetaTitle   string `gorm:"size:255" json:"meta_title"`
	MetaDescription string `gorm:"size:500" json:"meta_description"`
	FeaturedImage string `gorm:"size:500" json:"featured_image"`
	Template    string `gorm:"size:100" json:"template"`
	Status      string `gorm:"not null;default:draft;size:20" json:"status" validate:"oneof=draft published archived"`
	PublishedAt *time.Time `json:"published_at"`
	AuthorID    *string `gorm:"index" json:"author_id"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

type MediaFile struct {
	BaseEntity
	FileName    string `gorm:"not null;size:255" json:"file_name" validate:"required"`
	OriginalName string `gorm:"not null;size:255" json:"original_name" validate:"required"`
	FilePath    string `gorm:"not null;size:500" json:"file_path" validate:"required"`
	FileSize    int64  `gorm:"default:0" json:"file_size"`
	MimeType    string `gorm:"not null;size:100" json:"mime_type" validate:"required"`
	FileType    string `gorm:"not null;size:20" json:"file_type" validate:"oneof=image video audio document other"`
	AltText     string `gorm:"size:255" json:"alt_text"`
	Description string `gorm:"type:text" json:"description"`
	UploadedBy  *string `gorm:"index" json:"uploaded_by"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

// ==================== AI & ANALYTICS ====================

type AIModel struct {
	BaseEntity
	Name         string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description  string `gorm:"type:text" json:"description"`
	ModelType    string `gorm:"not null;size:50" json:"model_type" validate:"oneof=classification regression clustering recommendation"`
	Version      string `gorm:"not null;size:50" json:"version" validate:"required"`
	Status       string `gorm:"not null;default:training;size:20" json:"status" validate:"oneof=training ready failed deprecated"`
	Accuracy     float64 `gorm:"type:decimal(5,4)" json:"accuracy"`
	TrainingData string `gorm:"type:text" json:"training_data"`
	ModelFile    string `gorm:"size:500" json:"model_file"`
	IsActive     bool   `gorm:"default:true" json:"is_active"`
}

type AnalyticsEvent struct {
	BaseEntity
	EventType   string                 `gorm:"not null;size:100" json:"event_type" validate:"required"`
	EventName   string                 `gorm:"not null;size:255" json:"event_name" validate:"required"`
	UserID      *string                `gorm:"index" json:"user_id"`
	SessionID   string                 `gorm:"size:255" json:"session_id"`
	Properties  map[string]interface{} `gorm:"type:jsonb" json:"properties"`
	IPAddress   string                 `gorm:"size:45" json:"ip_address"`
	UserAgent   string                 `gorm:"size:500" json:"user_agent"`
	Referer     string                 `gorm:"size:500" json:"referer"`
	Timestamp   time.Time              `gorm:"not null" json:"timestamp"`
}

// ==================== WORKFLOW & AUTOMATION ====================

type WorkflowDefinition struct {
	BaseEntity
	Name         string                 `gorm:"not null;size:255" json:"name" validate:"required,min=3,max=255"`
	Description  string                 `gorm:"type:text" json:"description"`
	Category     string                 `gorm:"not null;size:100" json:"category" validate:"required"`
	Steps        []WorkflowStep         `gorm:"foreignKey:WorkflowDefinitionID" json:"steps"`
	Triggers     []WorkflowTrigger      `gorm:"foreignKey:WorkflowDefinitionID" json:"triggers"`
	AutomationRules []AutomationRule     `gorm:"foreignKey:WorkflowDefinitionID" json:"automation_rules"`
	SLAHours     *int                   `gorm:"default:24" json:"sla_hours"`
	Priority     string                 `gorm:"not null;default:medium;size:20" json:"priority" validate:"oneof=low medium high critical"`
	Executions   []WorkflowExecution    `gorm:"foreignKey:WorkflowDefinitionID" json:"executions,omitempty"`
	IsActive     bool                   `gorm:"default:true" json:"is_active"`
}

type WorkflowExecution struct {
	BaseEntity
	WorkflowDefinitionID string                 `gorm:"not null;index" json:"workflow_definition_id"`
	Status               string                 `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending running completed failed cancelled"`
	StartTime            time.Time              `gorm:"not null;autoCreateTime" json:"start_time"`
	EndTime              *time.Time             `gorm:"null" json:"end_time"`
	CurrentStep          string                 `gorm:"size:255" json:"current_step"`
	ExecutedSteps        []string               `gorm:"type:jsonb" json:"executed_steps"`
	StepExecutions       []StepExecution        `gorm:"foreignKey:WorkflowExecutionID" json:"step_executions"`
	TriggeredBy          string                 `gorm:"not null;size:100" json:"triggered_by" validate:"required"`
	TriggerType          string                 `gorm:"not null;size:50" json:"trigger_type" validate:"required"`
	Variables            map[string]interface{} `gorm:"type:jsonb" json:"variables"`
	Errors               []WorkflowError        `gorm:"foreignKey:WorkflowExecutionID" json:"errors"`
}

type WorkflowStep struct {
	BaseEntity
	WorkflowDefinitionID string                 `gorm:"not null;index" json:"workflow_definition_id"`
	Name                 string                 `gorm:"not null;size:255" json:"name" validate:"required"`
	Description          string                 `gorm:"type:text" json:"description"`
	StepType             string                 `gorm:"not null;size:50" json:"step_type" validate:"required"`
	Order                int                    `gorm:"not null" json:"order" validate:"min=0"`
	EstimatedDuration    int                    `gorm:"default:5" json:"estimated_duration"` // minutes
	RequiredPermissions  []string               `gorm:"type:jsonb" json:"required_permissions"`
	InputData            map[string]interface{} `gorm:"type:jsonb" json:"input_data"`
	OutputData           map[string]interface{} `gorm:"type:jsonb" json:"output_data"`
	Conditions           []WorkflowCondition    `gorm:"foreignKey:WorkflowStepID" json:"conditions"`
	Actions              []WorkflowAction       `gorm:"foreignKey:WorkflowStepID" json:"actions"`
	NextSteps            []string               `gorm:"type:jsonb" json:"next_steps"`
	ParallelSteps        []string               `gorm:"type:jsonb" json:"parallel_steps"`
}

type WorkflowTrigger struct {
	BaseEntity
	WorkflowDefinitionID string             `gorm:"not null;index" json:"workflow_definition_id"`
	EventType            string             `gorm:"not null;size:100" json:"event_type" validate:"required"`
	Conditions           []WorkflowCondition `gorm:"foreignKey:WorkflowTriggerID" json:"conditions"`
	Schedule             *TriggerSchedule   `gorm:"embedded" json:"schedule"`
}

type TriggerSchedule struct {
	Frequency   string `gorm:"size:50" json:"frequency" validate:"oneof=once daily weekly monthly"`
	Time        string `gorm:"size:8" json:"time"` // HH:MM format
	DaysOfWeek  []int  `gorm:"type:jsonb" json:"days_of_week"`
	DaysOfMonth []int  `gorm:"type:jsonb" json:"days_of_month"`
}

type WorkflowCondition struct {
	BaseEntity
	WorkflowStepID    *string     `gorm:"index" json:"workflow_step_id,omitempty"`
	WorkflowTriggerID *string     `gorm:"index" json:"workflow_trigger_id,omitempty"`
	Field             string      `gorm:"not null;size:255" json:"field" validate:"required"`
	Operator          string      `gorm:"not null;size:20" json:"operator" validate:"oneof=equals not_equals greater_than less_than contains starts_with ends_with"`
	Value             interface{} `gorm:"type:jsonb" json:"value"`
	LogicalOperator   string      `gorm:"default:AND;size:3" json:"logical_operator" validate:"oneof=AND OR"`
}

type WorkflowAction struct {
	BaseEntity
	WorkflowStepID   *string                `gorm:"index" json:"workflow_step_id,omitempty"`
	ActionType       string                 `gorm:"not null;size:100" json:"action_type" validate:"required"`
	ActionData       map[string]interface{} `gorm:"type:jsonb" json:"action_data"`
}

type StepExecution struct {
	BaseEntity
	WorkflowExecutionID string    `gorm:"not null;index" json:"workflow_execution_id"`
	WorkflowStepID      string    `gorm:"not null;index" json:"workflow_step_id"`
	Status              string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending running completed failed skipped"`
	StartTime           *time.Time `json:"start_time"`
	EndTime             *time.Time `json:"end_time"`
	Duration            int       `gorm:"default:0" json:"duration"` // seconds
	Result              map[string]interface{} `gorm:"type:jsonb" json:"result"`
	Error               string    `gorm:"type:text" json:"error"`
}

type WorkflowError struct {
	BaseEntity
	WorkflowExecutionID string    `gorm:"not null;index" json:"workflow_execution_id"`
	WorkflowStepID      *string   `gorm:"index" json:"workflow_step_id"`
	ErrorCode           string    `gorm:"size:100" json:"error_code"`
	ErrorMessage        string    `gorm:"type:text" json:"error_message"`
	StackTrace          string    `gorm:"type:text" json:"stack_trace"`
	RetryCount          int       `gorm:"default:0" json:"retry_count"`
	MaxRetries          int       `gorm:"default:3" json:"max_retries"`
}

type AutomationRule struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	TriggerEvent string `gorm:"not null;size:100" json:"trigger_event" validate:"required"`
	Conditions  map[string]interface{} `gorm:"type:jsonb" json:"conditions"`
	Actions     []map[string]interface{} `gorm:"type:jsonb" json:"actions"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	Priority    int    `gorm:"default:0" json:"priority"`
}

// ==================== COMMUNICATION & EMAIL ====================

type EmailTemplate struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Subject     string `gorm:"not null;size:255" json:"subject" validate:"required"`
	Body        string `gorm:"type:text" json:"body"`
	BodyHTML    string `gorm:"type:text" json:"body_html"`
	Variables   []string `gorm:"type:jsonb" json:"variables"`
	Category    string `gorm:"size:100" json:"category"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

type EmailQueue struct {
	BaseEntity
	RecipientEmail string    `gorm:"not null;size:255" json:"recipient_email" validate:"required,email"`
	RecipientName  string    `gorm:"size:255" json:"recipient_name"`
	Subject        string    `gorm:"not null;size:255" json:"subject" validate:"required"`
	Body           string    `gorm:"type:text" json:"body"`
	BodyHTML       string    `gorm:"type:text" json:"body_html"`
	TemplateID     *string   `gorm:"index" json:"template_id"`
	Variables      map[string]interface{} `gorm:"type:jsonb" json:"variables"`
	Status         string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending sent failed"`
	SentAt         *time.Time `json:"sent_at"`
	ErrorMessage   string    `gorm:"type:text" json:"error_message"`
	RetryCount     int       `gorm:"default:0" json:"retry_count"`
	MaxRetries     int       `gorm:"default:3" json:"max_retries"`
	ScheduledAt    *time.Time `json:"scheduled_at"`
	SentBy         *string   `gorm:"index" json:"sent_by"`
}

// ==================== ADDITIONAL MASTER TABLES ====================

// Tax Management
type TaxRate struct {
	BaseEntity
	Code        string  `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string  `gorm:"not null;size:255" json:"name" validate:"required"`
	Rate        float64 `gorm:"type:decimal(5,2);not null" json:"rate" validate:"min=0,max=100"`
	Type        string  `gorm:"not null;size:20" json:"type" validate:"oneof=percentage fixed"`
	Description string  `gorm:"type:text" json:"description"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
}

// Unit of Measurement
type UOM struct {
	BaseEntity
	Code       string  `gorm:"uniqueIndex;not null;size:10" json:"code" validate:"required"`
	Name       string  `gorm:"not null;size:100" json:"name" validate:"required"`
	Type       string  `gorm:"not null;size:20" json:"type" validate:"oneof=weight volume length area time"`
	BaseUnitID *string `gorm:"index" json:"base_unit_id"`
	Factor     float64 `gorm:"type:decimal(10,4);default:1.0000" json:"factor"`
	IsActive   bool    `gorm:"default:true" json:"is_active"`
}

// Payment Terms
type PaymentTerm struct {
	BaseEntity
	Code        string `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	Days        int    `gorm:"default:0" json:"days"`
	Type        string `gorm:"not null;size:20" json:"type" validate:"oneof=net due_date end_of_month"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

// Currency
type Currency struct {
	BaseEntity
	Code         string  `gorm:"uniqueIndex;not null;size:3" json:"code" validate:"required"`
	Name         string  `gorm:"not null;size:100" json:"name" validate:"required"`
	Symbol       string  `gorm:"not null;size:5" json:"symbol" validate:"required"`
	ExchangeRate float64 `gorm:"type:decimal(12,4);default:1.0000" json:"exchange_rate"`
	IsBase       bool    `gorm:"default:false" json:"is_base"`
	IsActive     bool    `gorm:"default:true" json:"is_active"`
}

// Region/Country/State/City
type Region struct {
	BaseEntity
	Code       string `gorm:"uniqueIndex;not null;size:10" json:"code" validate:"required"`
	Name       string `gorm:"not null;size:100" json:"name" validate:"required"`
	Type       string `gorm:"not null;size:20" json:"type" validate:"oneof=country state city"`
	ParentID   *string `gorm:"index" json:"parent_id"`
	IsActive   bool   `gorm:"default:true" json:"is_active"`
}

// Business Rules
type BusinessRule struct {
	BaseEntity
	Code        string `gorm:"uniqueIndex;not null;size:50" json:"code" validate:"required"`
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Description string `gorm:"type:text" json:"description"`
	RuleType    string `gorm:"not null;size:50" json:"rule_type"`
	Conditions  map[string]interface{} `gorm:"type:jsonb" json:"conditions"`
	Actions     []map[string]interface{} `gorm:"type:jsonb" json:"actions"`
	Priority    int    `gorm:"default:0" json:"priority"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

// Integration Settings
type Integration struct {
	BaseEntity
	Name        string `gorm:"not null;size:255" json:"name" validate:"required"`
	Type        string `gorm:"not null;size:50" json:"type" validate:"oneof=api webhook database"`
	Endpoint    string `gorm:"size:500" json:"endpoint"`
	Username    string `gorm:"size:100" json:"username"`
	Password    string `gorm:"size:255" json:"password"`
	APIKey      string `gorm:"size:255" json:"api_key"`
	Settings    map[string]interface{} `gorm:"type:jsonb" json:"settings"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	LastSync    *time.Time `json:"last_sync"`
}

// ==================== SETUP DATABASE MIGRATION ====================

func SetupDatabase(db *gorm.DB) error {
	return db.AutoMigrate(
		// Core entities
		&User{}, &UserGroup{}, &Permission{},

		// Company & Organization
		&Company{}, &Branch{},

		// Product Management
		&Category{}, &Brand{}, &Unit{}, &Product{},

		// Inventory Management
		&Warehouse{}, &InventoryItem{}, &StockAdjustment{},

		// Customer Management
		&Customer{},

		// Vendor Management
		&Vendor{},

		// Sales Management
		&SalesOrder{}, &SalesOrderItem{}, &Invoice{},

		// Purchase Management
		&PurchaseOrder{}, &PurchaseOrderItem{},

		// Financial Management
		&Ledger{}, &Transaction{},

		// HR Management
		&Employee{}, &Department{}, &Designation{},

		// Marketing & CRM
		&Campaign{}, &Lead{}, &FollowUp{},

		// System Configuration
		&SystemSetting{}, &AuditLog{},

		// CMS & Content
		&Page{}, &MediaFile{},

		// AI & Analytics
		&AIModel{}, &AnalyticsEvent{},

		// Workflow & Automation
		&WorkflowDefinition{}, &WorkflowExecution{}, &WorkflowStep{},
		&WorkflowTrigger{}, &WorkflowCondition{}, &WorkflowAction{},
		&StepExecution{}, &WorkflowError{}, &AutomationRule{},

		// Communication & Email
		&EmailTemplate{}, &EmailQueue{},

		// Additional Master Tables
		&TaxRate{}, &UOM{}, &PaymentTerm{}, &Currency{},
		&Region{}, &BusinessRule{}, &Integration{},
	)
}
