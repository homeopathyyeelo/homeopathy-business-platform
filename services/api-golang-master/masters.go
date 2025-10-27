// =============================================
// COMPREHENSIVE HOMEOPATHY MASTER DATA MODELS
// =============================================
// All master data models for homeopathy business

package main

import (
	"time"
)

// ==================== BASE ENTITY ====================

type BaseEntity struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ==================== SYSTEM-WIDE MASTERS ====================

// 1. Company Profile Master
type CompanyProfile struct {
	BaseEntity
	Name             string     `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	LegalName        string     `json:"legal_name" gorm:"size:255"`
	Logo             string     `json:"logo" gorm:"size:500"`
	Address          string     `json:"address" gorm:"type:text"`
	City             string     `json:"city" gorm:"size:100"`
	State            string     `json:"state" gorm:"size:100"`
	Pincode          string     `json:"pincode" gorm:"size:10"`
	Country          string     `json:"country" gorm:"size:100;default:India"`
	Phone            string    `json:"phone" gorm:"size:20"`
	Email            string    `json:"email" gorm:"size:255;unique" validate:"email"`
	Website          string    `json:"website" gorm:"size:255"`
	GSTNumber        string    `json:"gst_number" gorm:"size:15;unique"`
	PANNumber        string    `json:"pan_number" gorm:"size:10;unique"`
	TANNumber        string    `json:"tan_number" gorm:"size:10;unique"`
	LicenseNumber    string    `json:"license_number" gorm:"size:50;unique"`
	LicenseExpiry    *time.Time `json:"license_expiry"`
	BusinessType     string    `json:"business_type" gorm:"size:50"` // Retail, Wholesale, Manufacturing
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 2. Branch / Store Master
type Branch struct {
	ID               string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code             string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name             string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Address          string    `json:"address" gorm:"type:text"`
	City             string    `json:"city" gorm:"size:100"`
	State            string    `json:"state" gorm:"size:100"`
	Pincode          string    `json:"pincode" gorm:"size:10"`
	Country          string    `json:"country" gorm:"size:100;default:India"`
	Phone            string    `json:"phone" gorm:"size:20"`
	Email            string    `json:"email" gorm:"size:255" validate:"email"`
	ManagerID        string    `json:"manager_id" gorm:"type:uuid"`
	Manager          *User     `json:"manager" gorm:"foreignKey:ManagerID"`
	BranchType       string    `json:"branch_type" gorm:"size:50"` // Main, Sub-branch, Warehouse
	Region           string    `json:"region" gorm:"size:100"`
	IsHeadOffice     bool      `json:"is_head_office" gorm:"default:false"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	OperatingHours   interface{}      `json:"operating_hours" gorm:"type:jsonb"` // Store hours
	Coordinates      interface{}      `json:"coordinates" gorm:"type:jsonb"` // Lat, Lng
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 3. Department Master
type Department struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *Department `json:"parent" gorm:"foreignKey:ParentID"`
	HeadID       string    `json:"head_id" gorm:"type:uuid"`
	Head         *User     `json:"head" gorm:"foreignKey:HeadID"`
	BranchID     string    `json:"branch_id" gorm:"type:uuid"`
	Branch       *Branch   `json:"branch" gorm:"foreignKey:BranchID"`
	DepartmentType string  `json:"department_type" gorm:"size:50"` // Sales, HR, Inventory, etc.
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Role & Permission Master
type Role struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code        string    `json:"code" gorm:"unique;not null;size:50" validate:"required,max=50"`
	Name        string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description string    `json:"description" gorm:"type:text"`
	Permissions interface{}      `json:"permissions" gorm:"type:jsonb"` // Array of permission codes
	IsSystemRole bool     `json:"is_system_role" gorm:"default:false"` // Super Admin, Admin, etc.
	IsActive     bool     `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. User / Staff Master
type User struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username     string    `json:"username" gorm:"unique;not null;size:50" validate:"required,min=3,max=50"`
	Email        string    `json:"email" gorm:"unique;not null;size:255" validate:"required,email"`
	Phone        string    `json:"phone" gorm:"size:20"`
	FirstName    string    `json:"first_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	LastName     string    `json:"last_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Password     string    `json:"-" gorm:"not null;size:255" validate:"required,min=6"`
	RoleID       string    `json:"role_id" gorm:"type:uuid;not null"`
	Role         *Role     `json:"role" gorm:"foreignKey:RoleID"`
	DepartmentID string    `json:"department_id" gorm:"type:uuid"`
	Department   *Department `json:"department" gorm:"foreignKey:DepartmentID"`
	BranchID     string    `json:"branch_id" gorm:"type:uuid"`
	Branch       *Branch   `json:"branch" gorm:"foreignKey:BranchID"`
	EmployeeCode string    `json:"employee_code" gorm:"unique;size:20"`
	DateOfBirth  *time.Time `json:"date_of_birth"`
	DateOfJoining *time.Time `json:"date_of_joining"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	ProfileImage string    `json:"profile_image" gorm:"size:500"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Currency Master
type Currency struct {
	ID         string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code       string    `json:"code" gorm:"unique;not null;size:3" validate:"required,len=3"` // INR, USD
	Name       string    `json:"name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Symbol     string    `json:"symbol" gorm:"not null;size:5" validate:"required,max=5"` // ₹, $
	Rate       float64   `json:"rate" gorm:"type:decimal(10,4);default:1.0000"` // Exchange rate to base currency
	IsBase     bool      `json:"is_base" gorm:"default:false"` // INR is base currency
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// 7. Tax/GST Master
type TaxSlab struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Percentage   float64   `json:"percentage" gorm:"type:decimal(5,2);not null" validate:"required,min=0,max=100"`
	Description  string    `json:"description" gorm:"type:text"`
	TaxType      string    `json:"tax_type" gorm:"size:50;not null"` // GST, VAT, Excise
	Category     string    `json:"category" gorm:"size:50"` // Input, Output, Exempt
	EffectiveFrom *time.Time `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. Units of Measure (UOM)
type UOM struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:10" validate:"required,max=10"`
	Name         string    `json:"name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Description  string    `json:"description" gorm:"type:text"`
	Category     string    `json:"category" gorm:"size:50"` // Weight, Volume, Count, Length
	BaseUnitID   *string   `json:"base_unit_id" gorm:"type:uuid"`
	BaseUnit     *UOM      `json:"base_unit" gorm:"foreignKey:BaseUnitID"`
	ConversionFactor float64 `json:"conversion_factor" gorm:"type:decimal(10,4);default:1.0000"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 9. Payment Methods
type PaymentMethod struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Cash, Card, UPI, Credit, Cheque
	Description  string    `json:"description" gorm:"type:text"`
	ProcessingFee float64  `json:"processing_fee" gorm:"type:decimal(5,2);default:0.00"`
	IsOnline     bool      `json:"is_online" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 10. Notification Templates
type NotificationTemplate struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:50" validate:"required,max=50"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // SMS, WhatsApp, Email
	Subject      string    `json:"subject" gorm:"size:500"`
	Body         string    `json:"body" gorm:"type:text;not null" validate:"required"`
	Variables    interface{}      `json:"variables" gorm:"type:jsonb"` // Template variables like {{name}}, {{amount}}
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedByID  string    `json:"created_by_id" gorm:"type:uuid"`
	CreatedBy    *User     `json:"created_by" gorm:"foreignKey:CreatedByID"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 11. AI Model Settings
type AIModelSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	ModelType    string    `json:"model_type" gorm:"size:50;not null"` // Content, Forecast, Classification
	Provider     string    `json:"provider" gorm:"size:50"` // OpenAI, Google, Custom
	ModelName    string    `json:"model_name" gorm:"size:100"`
	APIKey       string    `json:"-" gorm:"size:500"` // Encrypted
	APIEndpoint  string    `json:"api_endpoint" gorm:"size:500"`
	Temperature  float64   `json:"temperature" gorm:"type:decimal(3,2);default:0.7"`
	MaxTokens    int       `json:"max_tokens" gorm:"default:1000"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Provider-specific settings
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 12. Integration Keys
type IntegrationKey struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // WhatsApp, SMS, GMB, Payment Gateway
	Provider     string    `json:"provider" gorm:"size:100"`
	APIKey       string    `json:"-" gorm:"size:500"` // Encrypted
	APISecret    string    `json:"-" gorm:"size:500"` // Encrypted
	WebhookURL   string    `json:"webhook_url" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Provider-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== PRODUCT & INVENTORY MASTERS ====================

// 1. Product Master
type Product struct {
	ID               string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code             string    `json:"code" gorm:"unique;not null;size:50" validate:"required,max=50"`
	Name             string    `json:"name" gorm:"not null;size:500" validate:"required,min=2,max=500"`
	Description      string    `json:"description" gorm:"type:text"`
	CategoryID       string    `json:"category_id" gorm:"type:uuid;not null"`
	Category         *ProductCategory `json:"category" gorm:"foreignKey:CategoryID"`
	SubcategoryID    *string   `json:"subcategory_id" gorm:"type:uuid"`
	Subcategory      *ProductSubcategory `json:"subcategory" gorm:"foreignKey:SubcategoryID"`
	BrandID          *string   `json:"brand_id" gorm:"type:uuid"`
	Brand            *ProductBrand `json:"brand" gorm:"foreignKey:BrandID"`
	PotencyID        *string   `json:"potency_id" gorm:"type:uuid"`
	Potency          *ProductPotency `json:"potency" gorm:"foreignKey:PotencyID"`
	SizeID           *string   `json:"size_id" gorm:"type:uuid"`
	Size             *ProductSize `json:"size" gorm:"foreignKey:SizeID"`
	VariantID        *string   `json:"variant_id" gorm:"type:uuid"`
	Variant          *ProductVariant `json:"variant" gorm:"foreignKey:VariantID"`
	GroupID          *string   `json:"group_id" gorm:"type:uuid"`
	Group            *ProductGroup `json:"group" gorm:"foreignKey:GroupID"`
	HSNCode          string    `json:"hsn_code" gorm:"size:8"`
	TaxSlabID        string    `json:"tax_slab_id" gorm:"type:uuid;not null"`
	TaxSlab          *TaxSlab  `json:"tax_slab" gorm:"foreignKey:TaxSlabID"`
	UOMID            string    `json:"uom_id" gorm:"type:uuid;not null"`
	UOM              *UOM      `json:"uom" gorm:"foreignKey:UOMID"`
	ReorderLevel     int       `json:"reorder_level" gorm:"default:10"`
	MinStock         int       `json:"min_stock" gorm:"default:5"`
	MaxStock         int       `json:"max_stock" gorm:"default:1000"`
	PurchasePrice    float64   `json:"purchase_price" gorm:"type:decimal(10,2);default:0.00"`
	MRP              float64   `json:"mrp" gorm:"type:decimal(10,2);default:0.00"`
	SellingPrice     float64   `json:"selling_price" gorm:"type:decimal(10,2);default:0.00"`
	DiscountPercent  float64   `json:"discount_percent" gorm:"type:decimal(5,2);default:0.00"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 2. SKU / Item Code Master
type SKU struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:50" validate:"required,max=50"`
	ProductID    string    `json:"product_id" gorm:"type:uuid;not null"`
	Product      *Product  `json:"product" gorm:"foreignKey:ProductID"`
	BatchNumber  string    `json:"batch_number" gorm:"size:50"`
	ExpiryDate   *time.Time `json:"expiry_date"`
	ManufactureDate *time.Time `json:"manufacture_date"`
	Quantity     int       `json:"quantity" gorm:"default:0"`
	LocationID   *string   `json:"location_id" gorm:"type:uuid"`
	Location     *RackLocation `json:"location" gorm:"foreignKey:LocationID"`
	WarehouseID  string    `json:"warehouse_id" gorm:"type:uuid"`
	Warehouse    *Warehouse `json:"warehouse" gorm:"foreignKey:WarehouseID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Category Master
type ProductCategory struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *ProductCategory `json:"parent" gorm:"foreignKey:ParentID"`
	Image        string    `json:"image" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Subcategory Master
type ProductSubcategory struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	CategoryID   string    `json:"category_id" gorm:"type:uuid;not null"`
	Category     *ProductCategory `json:"category" gorm:"foreignKey:CategoryID"`
	Description  string    `json:"description" gorm:"type:text"`
	Image        string    `json:"image" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Brand / Manufacturer Master
type ProductBrand struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Country      string    `json:"country" gorm:"size:100;default:India"`
	Website      string    `json:"website" gorm:"size:255"`
	Logo         string    `json:"logo" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Product Group / Segment
type ProductGroup struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Potency Master
type ProductPotency struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Value        string    `json:"value" gorm:"size:50"` // 30C, 200C, 1M, etc.
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. Size / Packing Master
type ProductSize struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 9. Variant Master
type ProductVariant struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 10. Batch Master
type Batch struct {
	ID               string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BatchNumber      string    `json:"batch_number" gorm:"not null;size:50" validate:"required,max=50"`
	ProductID        string    `json:"product_id" gorm:"type:uuid;not null"`
	Product          *Product  `json:"product" gorm:"foreignKey:ProductID"`
	Quantity         int       `json:"quantity" gorm:"default:0"`
	ManufactureDate  *time.Time `json:"manufacture_date"`
	ExpiryDate       *time.Time `json:"expiry_date"`
	VendorID         string    `json:"vendor_id" gorm:"type:uuid"`
	Vendor           *Vendor   `json:"vendor" gorm:"foreignKey:VendorID"`
	PurchasePrice    float64   `json:"purchase_price" gorm:"type:decimal(10,2);default:0.00"`
	MRP              float64   `json:"mrp" gorm:"type:decimal(10,2);default:0.00"`
	Status           string    `json:"status" gorm:"size:20;default:active"` // active, expired, recalled
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 11. Rack / Shelf / Location Master
type RackLocation struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	WarehouseID  string    `json:"warehouse_id" gorm:"type:uuid;not null"`
	Warehouse    *Warehouse `json:"warehouse" gorm:"foreignKey:WarehouseID"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 12. Warehouse / Godown Master
type Warehouse struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Address      string    `json:"address" gorm:"type:text"`
	City         string    `json:"city" gorm:"size:100"`
	State        string    `json:"state" gorm:"size:100"`
	Pincode      string    `json:"pincode" gorm:"size:10"`
	Phone        string    `json:"phone" gorm:"size:20"`
	ManagerID    string    `json:"manager_id" gorm:"type:uuid"`
	Manager      *User     `json:"manager" gorm:"foreignKey:ManagerID"`
	Capacity     int       `json:"capacity" gorm:"default:1000"` // Max items
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 13. HSN Code Master
type HSNCode struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:8" validate:"required,len=8"`
	Description  string    `json:"description" gorm:"not null;size:500" validate:"required,min=2,max=500"`
	Chapter      string    `json:"chapter" gorm:"size:2"` // HSN Chapter
	Heading      string    `json:"heading" gorm:"size:4"` // HSN Heading
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 14. Price List / Rate Master
type PriceList struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Purchase, Sale, MRP
	CurrencyID   string    `json:"currency_id" gorm:"type:uuid;not null"`
	Currency     *Currency `json:"currency" gorm:"foreignKey:CurrencyID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	EffectiveFrom *time.Time `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 15. Discount/Offer Master
type Discount struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Percentage, Fixed Amount
	Value        float64   `json:"value" gorm:"type:decimal(10,2);not null" validate:"required,min=0"`
	MinAmount    float64   `json:"min_amount" gorm:"type:decimal(10,2);default:0.00"`
	MaxDiscount  float64   `json:"max_discount" gorm:"type:decimal(10,2);default:0.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	EffectiveFrom *time.Time `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== SALES MASTERS ====================

// 1. Sales Type Master
type SalesType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsRetail     bool      `json:"is_retail" gorm:"default:false"`
	IsWholesale  bool      `json:"is_wholesale" gorm:"default:false"`
	IsOnline     bool      `json:"is_online" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Invoice Series Master
type InvoiceSeries struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Prefix       string    `json:"prefix" gorm:"size:10"` // INV, RET, etc.
	StartNumber  int       `json:"start_number" gorm:"default:1"`
	CurrentNumber int      `json:"current_number" gorm:"default:1"`
	EndNumber    int       `json:"end_number" gorm:"default:999999"`
	SalesTypeID  string    `json:"sales_type_id" gorm:"type:uuid;not null"`
	SalesType    *SalesType `json:"sales_type" gorm:"foreignKey:SalesTypeID"`
	BranchID     string    `json:"branch_id" gorm:"type:uuid;not null"`
	Branch       *Branch   `json:"branch" gorm:"foreignKey:BranchID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Price Level Master
type PriceLevel struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	DiscountPercent float64 `json:"discount_percent" gorm:"type:decimal(5,2);default:0.00"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Salesperson / Agent Master
type Salesperson struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Phone        string    `json:"phone" gorm:"size:20"`
	Email        string    `json:"email" gorm:"size:255" validate:"email"`
	Address      string    `json:"address" gorm:"type:text"`
	CommissionPercent float64 `json:"commission_percent" gorm:"type:decimal(5,2);default:0.00"`
	TargetAmount float64   `json:"target_amount" gorm:"type:decimal(12,2);default:0.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Payment Terms Master
type PaymentTerm struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Days         int       `json:"days" gorm:"default:0"` // 0 = Immediate, 30 = Net 30, etc.
	Description  string    `json:"description" gorm:"type:text"`
	InterestRate float64   `json:"interest_rate" gorm:"type:decimal(5,2);default:0.00"` // Late payment interest
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Credit Limit Master
type CreditLimit struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CustomerID   string    `json:"customer_id" gorm:"type:uuid;not null"`
	Customer     *Customer `json:"customer" gorm:"foreignKey:CustomerID"`
	LimitAmount  float64   `json:"limit_amount" gorm:"type:decimal(12,2);not null" validate:"required,min=0"`
	UsedAmount   float64   `json:"used_amount" gorm:"type:decimal(12,2);default:0.00"`
	AvailableAmount float64 `json:"available_amount" gorm:"type:decimal(12,2);default:0.00"`
	EffectiveFrom *time.Time `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. POS Settings Master
type POSSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BranchID     string    `json:"branch_id" gorm:"type:uuid;not null"`
	Branch       *Branch   `json:"branch" gorm:"foreignKey:BranchID"`
	Settings     interface{}      `json:"settings" gorm:"type:jsonb"` // POS configuration
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. E-Invoice Template Master
type EInvoiceTemplate struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Template     string    `json:"template" gorm:"type:text;not null"` // HTML template
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 9. Return Reason Master
type ReturnReason struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Sales Return, Purchase Return
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== PURCHASE MASTERS ====================

// 1. Vendor Master
type Vendor struct {
	ID               string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code             string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name             string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type             string    `json:"type" gorm:"size:50;not null"` // Manufacturer, Distributor, Wholesaler
	ContactPerson    string    `json:"contact_person" gorm:"size:255"`
	Phone            string    `json:"phone" gorm:"size:20"`
	Email            string    `json:"email" gorm:"size:255" validate:"email"`
	Address          string    `json:"address" gorm:"type:text"`
	City             string    `json:"city" gorm:"size:100"`
	State            string    `json:"state" gorm:"size:100"`
	Pincode          string    `json:"pincode" gorm:"size:10"`
	GSTNumber        string    `json:"gst_number" gorm:"size:15;unique"`
	PANNumber        string    `json:"pan_number" gorm:"size:10;unique"`
	PaymentTerms     int       `json:"payment_terms" gorm:"default:30"` // Days
	CreditLimit      float64   `json:"credit_limit" gorm:"type:decimal(12,2);default:0.00"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 2. Vendor Type Master
type VendorType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Purchase Order Terms
type PurchaseOrderTerm struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	PaymentDays  int       `json:"payment_days" gorm:"default:30"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. PO Status Master
type PurchaseOrderStatus struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Color        string    `json:"color" gorm:"size:7;default:#6B7280"` // Hex color for UI
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Freight/Charges Master
type FreightCharge struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Fixed, Percentage
	Value        float64   `json:"value" gorm:"type:decimal(10,2);not null" validate:"required,min=0"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Purchase Return Reason Master
type PurchaseReturnReason struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. GRN Template Master
type GRNTemplate struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Template     string    `json:"template" gorm:"type:text;not null"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== CUSTOMER / CRM MASTERS ====================

// 1. Customer Master
type Customer struct {
	ID               string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code             string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name             string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type             string    `json:"type" gorm:"size:20;not null"` // Individual, Business
	Email            string    `json:"email" gorm:"size:255" validate:"email"`
	Phone            string    `json:"phone" gorm:"size:20"`
	AlternatePhone   string    `json:"alternate_phone" gorm:"size:20"`
	DateOfBirth      *time.Time `json:"date_of_birth"`
	Anniversary      *time.Time `json:"anniversary"`
	Gender           string    `json:"gender" gorm:"size:10"` // Male, Female, Other
	GroupID          *string   `json:"group_id" gorm:"type:uuid"`
	Group            *CustomerGroup `json:"group" gorm:"foreignKey:GroupID"`
	LoyaltyPoints    int       `json:"loyalty_points" gorm:"default:0"`
	LoyaltyTier      string    `json:"loyalty_tier" gorm:"size:50;default:Bronze"`
	TotalPurchase    float64   `json:"total_purchase" gorm:"type:decimal(12,2);default:0.00"`
	LastPurchase     *time.Time `json:"last_purchase"`
	MarketingConsent bool      `json:"marketing_consent" gorm:"default:true"`
	ReferralSource   string    `json:"referral_source" gorm:"size:100"`
	CreditLimit      float64   `json:"credit_limit" gorm:"type:decimal(12,2);default:0.00"`
	PaymentTerms     int       `json:"payment_terms" gorm:"default:30"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// 2. Customer Group Master
type CustomerGroup struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	DiscountPercent float64 `json:"discount_percent" gorm:"type:decimal(5,2);default:0.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Contact Type Master
type ContactType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Address Book Master
type AddressBook struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CustomerID   string    `json:"customer_id" gorm:"type:uuid;not null"`
	Customer     *Customer `json:"customer" gorm:"foreignKey:CustomerID"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Billing, Shipping, Home, Office
	Address      string    `json:"address" gorm:"type:text;not null" validate:"required"`
	City         string    `json:"city" gorm:"size:100;not null" validate:"required"`
	State        string    `json:"state" gorm:"size:100;not null" validate:"required"`
	Pincode      string    `json:"pincode" gorm:"size:10;not null" validate:"required"`
	Country      string    `json:"country" gorm:"size:100;default:India"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Loyalty Program Master
type LoyaltyProgram struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	PointValue   float64   `json:"point_value" gorm:"type:decimal(10,2);default:1.00"` // 1 point = ₹1
	ExpiryDays   int       `json:"expiry_days" gorm:"default:365"` // Points expire after
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Feedback Type Master
type FeedbackType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Lead Source Master
type LeadSource struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. Follow-up Status Master
type FollowUpStatus struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Color        string    `json:"color" gorm:"size:7;default:#6B7280"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 9. Ticket Category Master
type TicketCategory struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *TicketCategory `json:"parent" gorm:"foreignKey:ParentID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== HR & STAFF MASTERS ====================

// 1. Employee Master
type Employee struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	FirstName    string    `json:"first_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	LastName     string    `json:"last_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Email        string    `json:"email" gorm:"unique;size:255" validate:"email"`
	Phone        string    `json:"phone" gorm:"size:20"`
	Address      string    `json:"address" gorm:"type:text"`
	City         string    `json:"city" gorm:"size:100"`
	State        string    `json:"state" gorm:"size:100"`
	Pincode      string    `json:"pincode" gorm:"size:10"`
	DateOfBirth  *time.Time `json:"date_of_birth"`
	DateOfJoining *time.Time `json:"date_of_joining"`
	DepartmentID string    `json:"department_id" gorm:"type:uuid;not null"`
	Department   *Department `json:"department" gorm:"foreignKey:DepartmentID"`
	DesignationID string   `json:"designation_id" gorm:"type:uuid;not null"`
	Designation  *Designation `json:"designation" gorm:"foreignKey:DesignationID"`
	ManagerID    *string   `json:"manager_id" gorm:"type:uuid"`
	Manager      *Employee `json:"manager" gorm:"foreignKey:ManagerID"`
	Salary       float64   `json:"salary" gorm:"type:decimal(10,2);default:0.00"`
	ShiftID      string    `json:"shift_id" gorm:"type:uuid"`
	Shift        *Shift    `json:"shift" gorm:"foreignKey:ShiftID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Designation Master
type Designation struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	DepartmentID string    `json:"department_id" gorm:"type:uuid;not null"`
	Department   *Department `json:"department" gorm:"foreignKey:DepartmentID"`
	Level        int       `json:"level" gorm:"default:1"` // Hierarchy level
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Shift Master
type Shift struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	StartTime    string    `json:"start_time" gorm:"size:5;not null"` // HH:MM format
	EndTime      string    `json:"end_time" gorm:"size:5;not null"` // HH:MM format
	HoursPerDay  float64   `json:"hours_per_day" gorm:"type:decimal(4,2);not null"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Attendance Rule Master
type AttendanceRule struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	WorkDays     string    `json:"work_days" gorm:"type:jsonb"` // ["MON", "TUE", "WED", "THU", "FRI"]
	StartTime    string    `json:"start_time" gorm:"size:5"` // HH:MM
	EndTime      string    `json:"end_time" gorm:"size:5"` // HH:MM
	BreakTime    int       `json:"break_time" gorm:"default:60"` // Minutes
	GraceTime    int       `json:"grace_time" gorm:"default:15"` // Late arrival grace minutes
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Leave Type Master
type LeaveType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	MaxDays      int       `json:"max_days" gorm:"default:0"` // 0 = unlimited
	CarryForward bool      `json:"carry_forward" gorm:"default:false"`
	IsPaid       bool      `json:"is_paid" gorm:"default:true"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Salary Structure Master
type SalaryStructure struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	BasicPercent float64   `json:"basic_percent" gorm:"type:decimal(5,2);default:40.00"`
	HraPercent   float64   `json:"hra_percent" gorm:"type:decimal(5,2);default:20.00"`
	DaPercent    float64   `json:"da_percent" gorm:"type:decimal(5,2);default:10.00"`
	TaPercent    float64   `json:"ta_percent" gorm:"type:decimal(5,2);default:5.00"`
	OtherPercent float64   `json:"other_percent" gorm:"type:decimal(5,2);default:25.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Commission Rule Master
type CommissionRule struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Percentage, Fixed
	Value        float64   `json:"value" gorm:"type:decimal(10,2);not null" validate:"required,min=0"`
	MinAmount    float64   `json:"min_amount" gorm:"type:decimal(10,2);default:0.00"`
	MaxAmount    float64   `json:"max_amount" gorm:"type:decimal(10,2);default:0.00"` // 0 = no limit
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	EffectiveFrom *time.Time `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. Performance Metric Master
type PerformanceMetric struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Unit         string    `json:"unit" gorm:"size:20"` // Count, Amount, Percentage
	TargetType   string    `json:"target_type" gorm:"size:20"` // Daily, Weekly, Monthly, Quarterly
	TargetValue  float64   `json:"target_value" gorm:"type:decimal(10,2);default:0.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== FINANCE & ACCOUNTING MASTERS ====================

// 1. Ledger Master (Chart of Accounts)
type Ledger struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Asset, Liability, Income, Expense, Equity
	SubType      string    `json:"sub_type" gorm:"size:50"` // Current Asset, Fixed Asset, etc.
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *Ledger   `json:"parent" gorm:"foreignKey:ParentID"`
	Description  string    `json:"description" gorm:"type:text"`
	OpeningBalance float64 `json:"opening_balance" gorm:"type:decimal(12,2);default:0.00"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Cost Center Master
type CostCenter struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Branch, Department, Project
	Description  string    `json:"description" gorm:"type:text"`
	BranchID     *string   `json:"branch_id" gorm:"type:uuid"`
	Branch       *Branch   `json:"branch" gorm:"foreignKey:BranchID"`
	DepartmentID *string   `json:"department_id" gorm:"type:uuid"`
	Department   *Department `json:"department" gorm:"foreignKey:DepartmentID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Payment Voucher Type
type PaymentVoucherType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Receipt, Payment, Contra, Journal
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Expense Category Master
type ExpenseCategory struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *ExpenseCategory `json:"parent" gorm:"foreignKey:ParentID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. GST Return Period Master
type GSTReturnPeriod struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Monthly, Quarterly
	Month        int       `json:"month" gorm:"default:1"` // 1-12 for monthly
	Quarter      int       `json:"quarter" gorm:"default:1"` // 1-4 for quarterly
	Year         int       `json:"year" gorm:"not null"`
	DueDate      *time.Time `json:"due_date"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Bank Master
type Bank struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Branch       string    `json:"branch" gorm:"size:255"`
	AccountNumber string   `json:"account_number" gorm:"size:20"`
	IFSCCode     string    `json:"ifsc_code" gorm:"size:11"`
	AccountType  string    `json:"account_type" gorm:"size:20"` // Savings, Current, etc.
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Cheque Book Master
type ChequeBook struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BankID       string    `json:"bank_id" gorm:"type:uuid;not null"`
	Bank         *Bank     `json:"bank" gorm:"foreignKey:BankID"`
	BookNumber   string    `json:"book_number" gorm:"size:50;not null"`
	StartNumber  int       `json:"start_number" gorm:"not null"`
	EndNumber    int       `json:"end_number" gorm:"not null"`
	CurrentNumber int      `json:"current_number" gorm:"default:0"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== MARKETING & CAMPAIGN MASTERS ====================

// 1. Campaign Type Master
type CampaignType struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Channel      string    `json:"channel" gorm:"size:50;not null"` // WhatsApp, SMS, Email, Social Media
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Template Master
type Template struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // WhatsApp, SMS, Email
	Subject      string    `json:"subject" gorm:"size:500"`
	Content      string    `json:"content" gorm:"type:text;not null" validate:"required"`
	Variables    interface{}      `json:"variables" gorm:"type:jsonb"` // Template variables
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Offer/Coupon Master
type Offer struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Percentage, Fixed Amount
	Value        float64   `json:"value" gorm:"type:decimal(10,2);not null" validate:"required,min=0"`
	MinAmount    float64   `json:"min_amount" gorm:"type:decimal(10,2);default:0.00"`
	MaxDiscount  float64   `json:"max_discount" gorm:"type:decimal(10,2);default:0.00"`
	UsageLimit   int       `json:"usage_limit" gorm:"default:0"` // 0 = unlimited
	UsedCount    int       `json:"used_count" gorm:"default:0"`
	ValidFrom    *time.Time `json:"valid_from"`
	ValidTo      *time.Time `json:"valid_to"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Target Segment Master
type TargetSegment struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Criteria     interface{}      `json:"criteria" gorm:"type:jsonb"` // Customer selection criteria
	CustomerCount int      `json:"customer_count" gorm:"default:0"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Channel Config Master
type ChannelConfig struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Channel      string    `json:"channel" gorm:"size:50;not null"` // WhatsApp, SMS, Email, etc.
	APIKey       string    `json:"-" gorm:"size:500"` // Encrypted
	APISecret    string    `json:"-" gorm:"size:500"` // Encrypted
	WebhookURL   string    `json:"webhook_url" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Channel-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Post Scheduler Master
type PostScheduler struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Platform     string    `json:"platform" gorm:"size:50;not null"` // Facebook, Instagram, WhatsApp
	Frequency    string    `json:"frequency" gorm:"size:20;not null"` // Daily, Weekly, Monthly
	ScheduleTime string    `json:"schedule_time" gorm:"size:5;not null"` // HH:MM
	Days         string    `json:"days" gorm:"type:jsonb"` // ["MON", "WED", "FRI"]
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. AI Prompt Template Master
type AIPromptTemplate struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Content, Product Description, Email
	Prompt       string    `json:"prompt" gorm:"type:text;not null" validate:"required"`
	Variables    interface{}      `json:"variables" gorm:"type:jsonb"` // Template variables
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 8. Festival/Event Master
type Festival struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Date         *time.Time `json:"date"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20"` // Festival, Event, Holiday
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== SOCIAL MEDIA & AUTOMATION MASTERS ====================

// 1. Social Account Master
type SocialAccount struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Platform     string    `json:"platform" gorm:"size:50;not null"` // Facebook, Instagram, WhatsApp Business
	AccountName  string    `json:"account_name" gorm:"size:255;not null" validate:"required,min=2,max=255"`
	AccountID    string    `json:"account_id" gorm:"size:100;not null"`
	AccessToken  string    `json:"-" gorm:"size:500"` // Encrypted
	RefreshToken string    `json:"-" gorm:"size:500"` // Encrypted
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	LastSyncAt   *time.Time `json:"last_sync_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Hashtag Library Master
type HashtagLibrary struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Hashtag      string    `json:"hashtag" gorm:"size:100;not null;unique" validate:"required,max=100"`
	Category     string    `json:"category" gorm:"size:50"`
	Description  string    `json:"description" gorm:"type:text"`
	UsageCount   int       `json:"usage_count" gorm:"default:0"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Blog Category Master
type BlogCategory struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	ParentID     *string   `json:"parent_id" gorm:"type:uuid"`
	Parent       *BlogCategory `json:"parent" gorm:"foreignKey:ParentID"`
	Image        string    `json:"image" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Auto Post Schedule Master
type AutoPostSchedule struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Platform     string    `json:"platform" gorm:"size:50;not null"`
	Frequency    string    `json:"frequency" gorm:"size:20;not null"` // Daily, Weekly, etc.
	ScheduleTime string    `json:"schedule_time" gorm:"size:5;not null"` // HH:MM
	ContentType  string    `json:"content_type" gorm:"size:50"` // Blog, Product, Educational
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Media Library Master
type MediaLibrary struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	FilePath     string    `json:"file_path" gorm:"size:500;not null" validate:"required"`
	FileType     string    `json:"file_type" gorm:"size:50"` // image, video, document
	FileSize     int64     `json:"file_size" gorm:"default:0"` // bytes
	AltText      string    `json:"alt_text" gorm:"size:500"`
	Description  string    `json:"description" gorm:"type:text"`
	Category     string    `json:"category" gorm:"size:50"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Workflow Rule Master
type WorkflowRule struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Trigger      string    `json:"trigger" gorm:"size:50;not null"` // Order Created, Customer Registered, etc.
	Conditions   interface{}      `json:"conditions" gorm:"type:jsonb"` // Rule conditions
	Actions      interface{}      `json:"actions" gorm:"type:jsonb"` // Actions to perform
	Priority     int       `json:"priority" gorm:"default:1"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== AI & INSIGHTS MASTERS ====================

// 1. AI Agent Master
type AIAgent struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Content, Inventory, Sales, Customer Service
	Description  string    `json:"description" gorm:"type:text"`
	ModelID      string    `json:"model_id" gorm:"type:uuid;not null"`
	Model        *AIModelSetting `json:"model" gorm:"foreignKey:ModelID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Agent-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. AI Task Master
type AITask struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Demand Forecast, Reorder Suggestion, etc.
	Description  string    `json:"description" gorm:"type:text"`
	AgentID      string    `json:"agent_id" gorm:"type:uuid;not null"`
	Agent        *AIAgent  `json:"agent" gorm:"foreignKey:AgentID"`
	Schedule     string    `json:"schedule" gorm:"size:20"` // Daily, Weekly, Monthly, On-Demand
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Task-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. AI Prompt Library
type AIPromptLibrary struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Content, Classification, Generation
	Prompt       string    `json:"prompt" gorm:"type:text;not null" validate:"required"`
	Variables    interface{}      `json:"variables" gorm:"type:jsonb"` // Input variables
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Model Version Master
type ModelVersion struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ModelID      string    `json:"model_id" gorm:"type:uuid;not null"`
	Model        *AIModelSetting `json:"model" gorm:"foreignKey:ModelID"`
	Version      string    `json:"version" gorm:"size:50;not null"`
	Description  string    `json:"description" gorm:"type:text"`
	Performance  interface{}      `json:"performance" gorm:"type:jsonb"` // Accuracy, F1-score, etc.
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Vector Index Master
type VectorIndex struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Product, Customer, Content
	Description  string    `json:"description" gorm:"type:text"`
	EmbeddingModel string  `json:"embedding_model" gorm:"size:100"`
	VectorDimension int    `json:"vector_dimension" gorm:"default:384"`
	IndexSize    int64     `json:"index_size" gorm:"default:0"`
	LastUpdated  *time.Time `json:"last_updated"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. AI Action Template
type AIActionTemplate struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Suggestion, Classification, Generation
	Template     interface{}      `json:"template" gorm:"type:jsonb"` // Action template
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Business Rule Master
type BusinessRule struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:20" validate:"required,max=20"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:50;not null"` // Pricing, Inventory, Customer
	Description  string    `json:"description" gorm:"type:text"`
	Rule         string    `json:"rule" gorm:"type:text;not null" validate:"required"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Priority     int       `json:"priority" gorm:"default:1"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== SETTINGS MASTERS ====================

// 1. System Settings
type SystemSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Key          string    `json:"key" gorm:"unique;not null;size:100" validate:"required,max=100"`
	Value        string    `json:"value" gorm:"type:text"`
	Description  string    `json:"description" gorm:"type:text"`
	Type         string    `json:"type" gorm:"size:20;not null"` // string, number, boolean, json
	Category     string    `json:"category" gorm:"size:50"` // General, Database, Security, etc.
	IsSystem     bool      `json:"is_system" gorm:"default:false"` // Cannot be deleted
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. SMS/Email Gateway
type GatewayConfig struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // SMS, Email, WhatsApp
	Provider     string    `json:"provider" gorm:"size:100"` // Twilio, AWS SES, etc.
	APIKey       string    `json:"-" gorm:"size:500"` // Encrypted
	APISecret    string    `json:"-" gorm:"size:500"` // Encrypted
	FromEmail    string    `json:"from_email" gorm:"size:255"`
	FromNumber   string    `json:"from_number" gorm:"size:20"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Provider-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. WhatsApp Gateway
type WhatsAppConfig struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	PhoneNumber  string    `json:"phone_number" gorm:"size:20;not null" validate:"required"`
	APIKey       string    `json:"-" gorm:"size:500"` // Encrypted
	APIURL       string    `json:"api_url" gorm:"size:500"`
	WebhookURL   string    `json:"webhook_url" gorm:"size:500"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	IsDefault    bool      `json:"is_default" gorm:"default:false"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // WhatsApp-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 4. Backup Settings
type BackupSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Full, Incremental
	Schedule     string    `json:"schedule" gorm:"size:20;not null"` // Daily, Weekly, Monthly
	Time         string    `json:"time" gorm:"size:5;not null"` // HH:MM
	RetentionDays int      `json:"retention_days" gorm:"default:30"`
	Location     string    `json:"location" gorm:"size:500"` // S3 bucket, Local path
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Config       interface{}      `json:"config" gorm:"type:jsonb"` // Backup-specific config
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Notification Preference
type NotificationPreference struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null"`
	User         *User     `json:"user" gorm:"foreignKey:UserID"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Email, SMS, WhatsApp, Push
	Category     string    `json:"category" gorm:"size:50"` // Orders, Inventory, Reports, etc.
	IsEnabled    bool      `json:"is_enabled" gorm:"default:true"`
	Frequency    string    `json:"frequency" gorm:"size:20"` // Immediate, Daily, Weekly
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 6. Audit Log Settings
type AuditLogSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	TableName    string    `json:"table_name" gorm:"size:100;not null"`
	IsEnabled    bool      `json:"is_enabled" gorm:"default:true"`
	RetentionDays int      `json:"retention_days" gorm:"default:90"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 7. Security Policy
type SecurityPolicy struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Type         string    `json:"type" gorm:"size:20;not null"` // Password, Session, IP, etc.
	Value        string    `json:"value" gorm:"type:text;not null"`
	Description  string    `json:"description" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ==================== USER PROFILE / SECURITY MASTERS ====================

// 1. User Profile Master
type UserProfile struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null"`
	User         *User     `json:"user" gorm:"foreignKey:UserID"`
	Theme        string    `json:"theme" gorm:"size:20;default:light"` // light, dark, auto
	Language     string    `json:"language" gorm:"size:10;default:en"`
	Timezone     string    `json:"timezone" gorm:"size:50;default:Asia/Kolkata"`
	DateFormat   string    `json:"date_format" gorm:"size:20;default:DD/MM/YYYY"`
	TimeFormat   string    `json:"time_format" gorm:"size:10;default:12h"` // 12h, 24h
	Currency     string    `json:"currency" gorm:"size:3;default:INR"`
	Settings     interface{}      `json:"settings" gorm:"type:jsonb"` // User-specific settings
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 2. Permission Master
type Permission struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string    `json:"code" gorm:"unique;not null;size:50" validate:"required,max=50"`
	Name         string    `json:"name" gorm:"not null;size:255" validate:"required,min=2,max=255"`
	Description  string    `json:"description" gorm:"type:text"`
	Module       string    `json:"module" gorm:"size:50"` // Products, Sales, Inventory, etc.
	Action       string    `json:"action" gorm:"size:20"` // Create, Read, Update, Delete
	Resource     string    `json:"resource" gorm:"size:50"` // Specific resource
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 3. Activity Log Master
type ActivityLog struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null"`
	User         *User     `json:"user" gorm:"foreignKey:UserID"`
	Action       string    `json:"action" gorm:"size:100;not null"`
	Resource     string    `json:"resource" gorm:"size:50"`
	ResourceID   string    `json:"resource_id" gorm:"size:100"`
	Details      interface{}      `json:"details" gorm:"type:jsonb"` // Additional data
	IPAddress    string    `json:"ip_address" gorm:"size:45"`
	UserAgent    string    `json:"user_agent" gorm:"size:500"`
	Timestamp    time.Time `json:"timestamp"`
}

// 4. 2FA Settings Master
type TwoFactorSetting struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null"`
	User         *User     `json:"user" gorm:"foreignKey:UserID"`
	Type         string    `json:"type" gorm:"size:20;not null"` // SMS, Email, App
	IsEnabled    bool      `json:"is_enabled" gorm:"default:false"`
	Secret       string    `json:"-" gorm:"size:100"` // Encrypted TOTP secret
	BackupCodes  string    `json:"-" gorm:"size:500"` // Encrypted backup codes
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// 5. Session Master
type Session struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null"`
	User         *User     `json:"user" gorm:"foreignKey:UserID"`
	Token        string    `json:"-" gorm:"size:500;not null"`
	RefreshToken string    `json:"-" gorm:"size:500"`
	IPAddress    string    `json:"ip_address" gorm:"size:45"`
	UserAgent    string    `json:"user_agent" gorm:"size:500"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}
