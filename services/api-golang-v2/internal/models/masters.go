package models

import (
	"time"
	"gorm.io/gorm"
)

// ==================== PRODUCT MASTERS ====================

// Brand Master
type Brand struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"uniqueIndex;not null"`
	Description string     `json:"description"`
	Logo        string     `json:"logo"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Category Master
type Category struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	ParentID    *string    `json:"parentId" gorm:"index"` // For hierarchical categories
	Image       string     `json:"image"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Batch Master
type Batch struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	ExpiryDate  *time.Time `json:"expiryDate"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Potency Master (Homeopathy specific)
type Potency struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"` // e.g., "30CH", "200CH", "1M"
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Rack Master
type Rack struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	Location    string     `json:"location"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// HSN Master (Harmonized System of Nomenclature)
type HSN struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code        string     `json:"code" gorm:"uniqueIndex;not null"`
	Description string     `json:"description"`
	TaxRate     float64    `json:"taxRate" gorm:"default:0"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== INVENTORY MASTERS ====================

// Warehouse Master
type Warehouse struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Address     string     `json:"address"`
	City        string     `json:"city"`
	State       string     `json:"state"`
	Pincode     string     `json:"pincode"`
	Contact     string     `json:"contact"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Location Master (within warehouse)
type Location struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	WarehouseID  string     `json:"warehouseId" gorm:"not null"`
	Name         string     `json:"name" gorm:"not null"`
	Description  string     `json:"description"`
	IsActive     bool       `json:"isActive" gorm:"default:true"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// UOM Master (Unit of Measurement)
type UOM struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"uniqueIndex;not null"` // e.g., "ml", "tablet", "bottle"
	Description string     `json:"description"`
	BaseUnit    string     `json:"baseUnit"` // For conversion
	Conversion  float64    `json:"conversion" gorm:"default:1"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Reorder Level Master
type ReorderLevel struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID   string     `json:"productId" gorm:"not null"`
	WarehouseID string     `json:"warehouseId" gorm:"not null"`
	MinLevel    int        `json:"minLevel" gorm:"default:0"`
	MaxLevel    int        `json:"maxLevel" gorm:"default:0"`
	ReorderQty  int        `json:"reorderQty" gorm:"default:0"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== SALES MASTERS ====================

// Invoice Series Master
type InvoiceSeries struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Prefix      string     `json:"prefix"` // e.g., "INV"
	StartNumber int        `json:"startNumber" gorm:"default:1"`
	CurrentNumber int      `json:"currentNumber" gorm:"default:1"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Payment Terms Master
type PaymentTerms struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	Days        int        `json:"days" gorm:"default:0"` // Payment due in days
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Credit Limit Master
type CreditLimit struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CustomerID  string     `json:"customerId" gorm:"not null"`
	Limit       float64    `json:"limit" gorm:"default:0"`
	Used        float64    `json:"used" gorm:"default:0"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== CUSTOMER MASTERS ====================

// Customer Group Master
type CustomerGroup struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	Discount    float64    `json:"discount" gorm:"default:0"` // Default discount percentage
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Loyalty Program Master
type LoyaltyProgram struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	PointsRate  float64    `json:"pointsRate" gorm:"default:1"` // Points per rupee
	RedeemRate  float64    `json:"redeemRate" gorm:"default:1"` // Rupees per point
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Feedback Type Master
type FeedbackType struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== HR MASTERS ====================

// Department Master
type Department struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	HeadID      *string    `json:"headId" gorm:"index"` // Employee ID
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Designation Master
type Designation struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	Level       int        `json:"level" gorm:"default:1"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Shift Master
type Shift struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	StartTime   string     `json:"startTime"` // HH:MM format
	EndTime     string     `json:"endTime"`   // HH:MM format
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== FINANCE MASTERS ====================

// Ledger Master
type Ledger struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Type        string     `json:"type"` // Asset, Liability, Income, Expense
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Cost Center Master
type CostCenter struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Expense Category Master
type ExpenseCategory struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== MARKETING MASTERS ====================

// Campaign Type Master
type CampaignType struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Template Master (for marketing content)
type Template struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Type        string     `json:"type"` // Email, SMS, WhatsApp, Social
	Content     string     `json:"content" gorm:"type:text"`
	Variables   string     `json:"variables"` // JSON array of variables
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Target Segment Master
type TargetSegment struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description"`
	Criteria    string     `json:"criteria"` // JSON criteria for targeting
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// ==================== SYSTEM MASTERS ====================

// Tax Master
type Tax struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Rate        float64    `json:"rate" gorm:"default:0"`
	Type        string     `json:"type"` // GST, VAT, etc.
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Unit Master
type Unit struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Symbol      string     `json:"symbol"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Settings Master (Dynamic configuration)
type Setting struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Key         string     `json:"key" gorm:"uniqueIndex;not null"`
	Value       string     `json:"value"`
	Type        string     `json:"type"` // text, number, boolean, json
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}
