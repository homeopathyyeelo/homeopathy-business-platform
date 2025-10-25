package database

import (
	"time"

	"gorm.io/gorm"
)

// Base model with common fields
type BaseModel struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// User roles
type UserRole string

const (
	RoleAdmin      UserRole = "ADMIN"
	RoleManager    UserRole = "MANAGER"
	RoleStaff      UserRole = "STAFF"
	RoleMarketer   UserRole = "MARKETER"
	RoleCashier    UserRole = "CASHIER"
	RoleDoctor     UserRole = "DOCTOR"
	RolePharmacist UserRole = "PHARMACIST"
)

// Permission codes
type PermissionCode string

const (
	// Dashboard
	PermDashboard PermissionCode = "PERM_DASHBOARD"

	// Products
	PermProductsRead    PermissionCode = "PERM_PRODUCTS_READ"
	PermProductsCreate  PermissionCode = "PERM_PRODUCTS_CREATE"
	PermProductsUpdate  PermissionCode = "PERM_PRODUCTS_UPDATE"
	PermProductsDelete  PermissionCode = "PERM_PRODUCTS_DELETE"
	PermProductsCategories PermissionCode = "PERM_PRODUCTS_CATEGORIES"
	PermProductsBrands  PermissionCode = "PERM_PRODUCTS_BRANDS"
	PermProductsBatches PermissionCode = "PERM_PRODUCTS_BATCHES"
	PermProductsPricing PermissionCode = "PERM_PRODUCTS_PRICING"

	// Inventory
	PermInventoryView    PermissionCode = "PERM_INVENTORY_VIEW"
	PermInventoryStock   PermissionCode = "PERM_INVENTORY_STOCK"
	PermInventoryExpireView PermissionCode = "PERM_INVENTORY_EXPIRE_VIEW"
	PermInventoryBulk    PermissionCode = "PERM_INVENTORY_BULK"
	PermInventoryCombo   PermissionCode = "PERM_INVENTORY_COMBO"
	PermInventoryAdjust  PermissionCode = "PERM_INVENTORY_ADJUST"
	PermInventoryTransfer PermissionCode = "PERM_INVENTORY_TRANSFER"
	PermInventoryDamage  PermissionCode = "PERM_INVENTORY_DAMAGE"
	PermStockDirect      PermissionCode = "PERM_STOCK_DIRECT"
	PermBarcodeDesign    PermissionCode = "PERM_BARCODE_DESIGN"

	// Sales
	PermSalesView    PermissionCode = "PERM_SALES_VIEW"
	PermSalesCreate  PermissionCode = "PERM_SALES_CREATE"
	PermSalesUpdate  PermissionCode = "PERM_SALES_UPDATE"
	PermSalesDelete  PermissionCode = "PERM_SALES_DELETE"
	PermSalesReturn  PermissionCode = "PERM_SALES_RETURN"
	PermSalesOrders  PermissionCode = "PERM_SALES_ORDERS"
	PermSalesInvoices PermissionCode = "PERM_SALES_INVOICES"
	PermSalesReceipts PermissionCode = "PERM_SALES_RECEIPTS"
	PermPosUse       PermissionCode = "PERM_POS_USE"
	PermPosDual      PermissionCode = "PERM_POS_DUAL"
	PermPosHold      PermissionCode = "PERM_POS_HOLD"
	PermSalesConvert PermissionCode = "PERM_SALES_CONVERT"
	PermSalesTemplate PermissionCode = "PERM_SALES_TEMPLATE"
	PermSalesGiftcard PermissionCode = "PERM_SALES_GIFTCARD"
)

// User model
type User struct {
	BaseModel
	Email       string    `json:"email" gorm:"uniqueIndex"`
	Password    string    `json:"-" gorm:"not null"`
	Name        string    `json:"name" gorm:"not null"`
	Role        UserRole  `json:"role" gorm:"not null"`
	ShopID      *uint     `json:"shop_id"`
	Shop        *Shop     `json:"shop,omitempty"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	LastLogin   *time.Time `json:"last_login"`
}

// Role model
type Role struct {
	BaseModel
	Name        string          `json:"name" gorm:"uniqueIndex"`
	Description string          `json:"description"`
	Permissions []Permission    `json:"permissions" gorm:"many2many:role_permissions"`
}

// Permission model
type Permission struct {
	BaseModel
	Code        PermissionCode `json:"code" gorm:"uniqueIndex"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
}

// Company model
type Company struct {
	BaseModel
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	GSTIN       string `json:"gstin"`
}

// Shop model
type Shop struct {
	BaseModel
	CompanyID   uint     `json:"company_id" gorm:"not null"`
	Company     *Company `json:"company,omitempty"`
	Name        string   `json:"name" gorm:"not null"`
	Address     string   `json:"address"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	IsActive    bool     `json:"is_active" gorm:"default:true"`
}

// Product models
type Product struct {
	BaseModel
	CompanyID     uint           `json:"company_id" gorm:"not null"`
	Company       *Company       `json:"company,omitempty"`
	Name          string         `json:"name" gorm:"not null"`
	Description   string         `json:"description"`
	CategoryID    *uint          `json:"category_id"`
	Category      *ProductCategory `json:"category,omitempty"`
	BrandID       *uint          `json:"brand_id"`
	Brand         *ProductBrand  `json:"brand,omitempty"`
	HSNCode       string         `json:"hsn_code"`
	Form          string         `json:"form"` // Mother Tincture, Biochemic, Dilution, etc.
	Potency       string         `json:"potency"` // 30C, 200C, 1M, etc.
	PackSize      string         `json:"pack_size"`
	MRP           float64        `json:"mrp"`
	PurchasePrice float64        `json:"purchase_price"`
	SellingPrice  float64        `json:"selling_price"`
	MinStock      int            `json:"min_stock" gorm:"default:10"`
	MaxStock      int            `json:"max_stock"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	Attributes    JSON           `json:"attributes" gorm:"type:jsonb"`
}

type ProductCategory struct {
	BaseModel
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	ParentID    *uint `json:"parent_id"`
	Parent      *ProductCategory `json:"parent,omitempty"`
}

type ProductBrand struct {
	BaseModel
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	Logo        string `json:"logo"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}

// Customer models
type Customer struct {
	BaseModel
	CompanyID     uint           `json:"company_id" gorm:"not null"`
	Company       *Company       `json:"company,omitempty"`
	Name          string         `json:"name" gorm:"not null"`
	Email         string         `json:"email"`
	Phone         string         `json:"phone" gorm:"not null"`
	Address       string         `json:"address"`
	City          string         `json:"city"`
	State         string         `json:"state"`
	Pincode       string         `json:"pincode"`
	GSTIN         string         `json:"gstin"`
	CustomerType  string         `json:"customer_type"` // Retail, Wholesale, Doctor, Distributor
	GroupID       *uint          `json:"group_id"`
	Group         *CustomerGroup `json:"group,omitempty"`
	CreditLimit   float64        `json:"credit_limit" gorm:"default:0"`
	Outstanding   float64        `json:"outstanding" gorm:"default:0"`
	LoyaltyPoints int            `json:"loyalty_points" gorm:"default:0"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	Attributes    JSON           `json:"attributes" gorm:"type:jsonb"`
}

type CustomerGroup struct {
	BaseModel
	Name        string  `json:"name" gorm:"not null"`
	Description string  `json:"description"`
	Discount    float64 `json:"discount" gorm:"default:0"`
	IsActive    bool    `json:"is_active" gorm:"default:true"`
}

// Vendor models
type Vendor struct {
	BaseModel
	CompanyID     uint     `json:"company_id" gorm:"not null"`
	Company       *Company `json:"company,omitempty"`
	Name          string   `json:"name" gorm:"not null"`
	ContactPerson string   `json:"contact_person"`
	Email         string   `json:"email"`
	Phone         string   `json:"phone" gorm:"not null"`
	Address       string   `json:"address"`
	City          string   `json:"city"`
	State         string   `json:"state"`
	Pincode       string   `json:"pincode"`
	GSTIN         string   `json:"gstin"`
	PaymentTerms  string   `json:"payment_terms"`
	CreditLimit   float64  `json:"credit_limit" gorm:"default:0"`
	Rating        float64  `json:"rating" gorm:"default:0"`
	IsActive      bool     `json:"is_active" gorm:"default:true"`
	Attributes    JSON     `json:"attributes" gorm:"type:jsonb"`
}

// Inventory models
type InventoryBatch struct {
	BaseModel
	ShopID       uint     `json:"shop_id" gorm:"not null"`
	Shop         *Shop    `json:"shop,omitempty"`
	ProductID    uint     `json:"product_id" gorm:"not null"`
	Product      *Product `json:"product,omitempty"`
	BatchNo      string   `json:"batch_no" gorm:"not null"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	MfgDate      *time.Time `json:"mfg_date"`
	Quantity     int      `json:"quantity" gorm:"default:0"`
	Reserved     int      `json:"reserved" gorm:"default:0"`
	UnitCost     float64  `json:"unit_cost"`
	LandedCost   float64  `json:"landed_cost"`
	MRP          float64  `json:"mrp"`
	SellingPrice float64  `json:"selling_price"`
	Location     string   `json:"location"`
	Notes        string   `json:"notes"`
}

// Sales models
type Sale struct {
	BaseModel
	ShopID         uint      `json:"shop_id" gorm:"not null"`
	Shop           *Shop     `json:"shop,omitempty"`
	CustomerID     *uint     `json:"customer_id"`
	Customer       *Customer `json:"customer,omitempty"`
	InvoiceNo      string    `json:"invoice_no" gorm:"uniqueIndex"`
	SaleDate       time.Time `json:"sale_date" gorm:"not null"`
	SaleType       string    `json:"sale_type"` // Retail, Wholesale, Online, Doctor
	SubTotal       float64   `json:"sub_total"`
	Discount       float64   `json:"discount"`
	Tax            float64   `json:"tax"`
	Total          float64   `json:"total" gorm:"not null"`
	PaymentStatus  string    `json:"payment_status"` // Paid, Pending, Partially Paid
	PaymentMethod  string    `json:"payment_method"`
	Notes          string    `json:"notes"`
	Items          []SaleItem `json:"items" gorm:"foreignKey:SaleID"`
}

type SaleItem struct {
	BaseModel
	SaleID       uint     `json:"sale_id" gorm:"not null"`
	Sale         *Sale    `json:"sale,omitempty"`
	ProductID    uint     `json:"product_id" gorm:"not null"`
	Product      *Product `json:"product,omitempty"`
	BatchID      *uint    `json:"batch_id"`
	Batch        *InventoryBatch `json:"batch,omitempty"`
	Quantity     int      `json:"quantity" gorm:"not null"`
	UnitPrice    float64  `json:"unit_price" gorm:"not null"`
	Discount     float64  `json:"discount"`
	Tax          float64  `json:"tax"`
	Total        float64  `json:"total" gorm:"not null"`
}

// Purchase models
type Purchase struct {
	BaseModel
	ShopID         uint      `json:"shop_id" gorm:"not null"`
	Shop           *Shop     `json:"shop,omitempty"`
	VendorID       uint      `json:"vendor_id" gorm:"not null"`
	Vendor         *Vendor   `json:"vendor,omitempty"`
	PONo           string    `json:"po_no" gorm:"uniqueIndex"`
	PODate         time.Time `json:"po_date" gorm:"not null"`
	ExpectedDate   *time.Time `json:"expected_date"`
	Status         string    `json:"status"` // Draft, Sent, Approved, Received, Cancelled
	SubTotal       float64   `json:"sub_total"`
	Discount       float64   `json:"discount"`
	Tax            float64   `json:"tax"`
	Total          float64   `json:"total" gorm:"not null"`
	PaymentStatus  string    `json:"payment_status"`
	Notes          string    `json:"notes"`
	Items          []PurchaseItem `json:"items" gorm:"foreignKey:PurchaseID"`
}

type PurchaseItem struct {
	BaseModel
	PurchaseID     uint     `json:"purchase_id" gorm:"not null"`
	Purchase       *Purchase `json:"purchase,omitempty"`
	ProductID      uint     `json:"product_id" gorm:"not null"`
	Product        *Product `json:"product,omitempty"`
	Quantity       int      `json:"quantity" gorm:"not null"`
	UnitPrice      float64  `json:"unit_price" gorm:"not null"`
	Discount       float64  `json:"discount"`
	Tax            float64  `json:"tax"`
	Total          float64  `json:"total" gorm:"not null"`
	ReceivedQty    int      `json:"received_qty" gorm:"default:0"`
}

type PurchaseReceipt struct {
	BaseModel
	PurchaseID     uint      `json:"purchase_id" gorm:"not null"`
	Purchase       *Purchase `json:"purchase,omitempty"`
	ReceiptNo      string    `json:"receipt_no" gorm:"uniqueIndex"`
	ReceiptDate    time.Time `json:"receipt_date" gorm:"not null"`
	Status         string    `json:"status"` // Draft, Posted, Cancelled
	Total          float64   `json:"total"`
	Items          []PurchaseReceiptItem `json:"items" gorm:"foreignKey:ReceiptID"`
}

type PurchaseReceiptItem struct {
	BaseModel
	ReceiptID      uint             `json:"receipt_id" gorm:"not null"`
	Receipt        *PurchaseReceipt `json:"receipt,omitempty"`
	PurchaseItemID uint             `json:"purchase_item_id" gorm:"not null"`
	PurchaseItem   *PurchaseItem    `json:"purchase_item,omitempty"`
	ProductID      uint             `json:"product_id" gorm:"not null"`
	Product        *Product         `json:"product,omitempty"`
	BatchNo        string           `json:"batch_no"`
	ExpiryDate     *time.Time       `json:"expiry_date"`
	Quantity       int              `json:"quantity" gorm:"not null"`
	UnitCost       float64          `json:"unit_cost"`
	LandedCost     float64          `json:"landed_cost"`
}

// Finance models
type Expense struct {
	BaseModel
	ShopID      uint      `json:"shop_id" gorm:"not null"`
	Shop        *Shop     `json:"shop,omitempty"`
	Category    string    `json:"category" gorm:"not null"`
	Amount      float64   `json:"amount" gorm:"not null"`
	Description string    `json:"description"`
	Date        time.Time `json:"date" gorm:"not null"`
	ApprovedBy  *uint     `json:"approved_by"`
	ApprovedByUser *User  `json:"approved_by_user,omitempty"`
	Receipt     string    `json:"receipt"`
}

type Payment struct {
	BaseModel
	SaleID        *uint     `json:"sale_id"`
	Sale          *Sale     `json:"sale,omitempty"`
	PurchaseID    *uint     `json:"purchase_id"`
	Purchase      *Purchase `json:"purchase,omitempty"`
	Amount        float64   `json:"amount" gorm:"not null"`
	PaymentMethod string    `json:"payment_method" gorm:"not null"`
	PaymentDate   time.Time `json:"payment_date" gorm:"not null"`
	Reference     string    `json:"reference"`
	Notes         string    `json:"notes"`
}

// HR models
type Employee struct {
	BaseModel
	CompanyID    uint      `json:"company_id" gorm:"not null"`
	Company      *Company  `json:"company,omitempty"`
	EmployeeID   string    `json:"employee_id" gorm:"uniqueIndex"`
	Name         string    `json:"name" gorm:"not null"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Department   string    `json:"department"`
	Position     string    `json:"position"`
	Salary       float64   `json:"salary"`
	JoiningDate  time.Time `json:"joining_date" gorm:"not null"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Address      string    `json:"address"`
}

type Attendance struct {
	BaseModel
	EmployeeID   uint      `json:"employee_id" gorm:"not null"`
	Employee     *Employee `json:"employee,omitempty"`
	Date         time.Time `json:"date" gorm:"not null"`
	CheckIn      *time.Time `json:"check_in"`
	CheckOut     *time.Time `json:"check_out"`
	HoursWorked  float64   `json:"hours_worked"`
	Status       string    `json:"status"` // Present, Absent, Late, Half Day
	Notes        string    `json:"notes"`
}

type Payroll struct {
	BaseModel
	EmployeeID     uint      `json:"employee_id" gorm:"not null"`
	Employee       *Employee `json:"employee,omitempty"`
	Month          int       `json:"month" gorm:"not null"`
	Year           int       `json:"year" gorm:"not null"`
	BasicSalary    float64   `json:"basic_salary"`
	HRA            float64   `json:"hra"`
	DA             float64   `json:"da"`
	TA             float64   `json:"ta"`
	OtherAllowance float64   `json:"other_allowance"`
	Deductions     float64   `json:"deductions"`
	GrossSalary    float64   `json:"gross_salary"`
	NetSalary      float64   `json:"net_salary"`
	Status         string    `json:"status"` // Draft, Processed, Paid
	ProcessedDate  *time.Time `json:"processed_date"`
}

// AI models
type AISuggestion struct {
	BaseModel
	Type        string    `json:"type"` // reorder, pricing, marketing
	ProductID   *uint     `json:"product_id"`
	Product     *Product  `json:"product,omitempty"`
	Suggestion  string    `json:"suggestion"`
	Confidence  float64   `json:"confidence"`
	Status      string    `json:"status"` // pending, approved, rejected
	Applied     bool      `json:"applied" gorm:"default:false"`
	AppliedDate *time.Time `json:"applied_date"`
}

// Campaign models
type Campaign struct {
	BaseModel
	CompanyID     uint      `json:"company_id" gorm:"not null"`
	Company       *Company  `json:"company,omitempty"`
	Name          string    `json:"name" gorm:"not null"`
	Type          string    `json:"type"` // whatsapp, sms, email
	Target        string    `json:"target"` // all, group, segment
	Message       string    `json:"message"`
	ScheduledDate *time.Time `json:"scheduled_date"`
	SentDate      *time.Time `json:"sent_date"`
	Status        string    `json:"status"` // draft, scheduled, sent, failed
	SentCount     int       `json:"sent_count" gorm:"default:0"`
}

// Custom JSON type for flexible attributes
type JSON map[string]interface{}
