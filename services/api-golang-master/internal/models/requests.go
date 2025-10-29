package models

import "time"

// ==================== PRODUCT REQUESTS ====================

type CreateProductRequest struct {
	Name        string  `json:"name" binding:"required,min=3,max=100"`
	Description string  `json:"description" binding:"max=500"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	MRP         float64 `json:"mrp" binding:"omitempty,gt=0"`
	Stock       int     `json:"stock" binding:"required,gte=0"`
	CategoryID  string  `json:"category_id" binding:"required,uuid"`
	BrandID     string  `json:"brand_id" binding:"omitempty,uuid"`
	UnitID      string  `json:"unit_id" binding:"required,uuid"`
	SKU         string  `json:"sku" binding:"required,min=3,max=50"`
	Barcode     string  `json:"barcode" binding:"omitempty,max=50"`
	ReorderLevel int    `json:"reorder_level" binding:"omitempty,gte=0"`
	IsActive    *bool   `json:"is_active" binding:"omitempty"`
}

type UpdateProductRequest struct {
	Name         string  `json:"name" binding:"omitempty,min=3,max=100"`
	Description  string  `json:"description" binding:"omitempty,max=500"`
	Price        float64 `json:"price" binding:"omitempty,gt=0"`
	MRP          float64 `json:"mrp" binding:"omitempty,gt=0"`
	Stock        int     `json:"stock" binding:"omitempty,gte=0"`
	CategoryID   string  `json:"category_id" binding:"omitempty,uuid"`
	BrandID      string  `json:"brand_id" binding:"omitempty,uuid"`
	UnitID       string  `json:"unit_id" binding:"omitempty,uuid"`
	SKU          string  `json:"sku" binding:"omitempty,min=3,max=50"`
	Barcode      string  `json:"barcode" binding:"omitempty,max=50"`
	ReorderLevel int     `json:"reorder_level" binding:"omitempty,gte=0"`
	IsActive     *bool   `json:"is_active" binding:"omitempty"`
}

// ==================== CUSTOMER REQUESTS ====================

type CreateCustomerRequest struct {
	Name         string `json:"name" binding:"required,min=3,max=100"`
	Email        string `json:"email" binding:"omitempty,email,max=100"`
	Phone        string `json:"phone" binding:"required,min=10,max=15"`
	Address      string `json:"address" binding:"omitempty,max=500"`
	City         string `json:"city" binding:"omitempty,max=100"`
	State        string `json:"state" binding:"omitempty,max=100"`
	Pincode      string `json:"pincode" binding:"omitempty,len=6,numeric"`
	GSTIN        string `json:"gstin" binding:"omitempty,len=15,alphanum"`
	CustomerType string `json:"customer_type" binding:"omitempty,oneof=retail wholesale b2b b2c"`
	CreditLimit  float64 `json:"credit_limit" binding:"omitempty,gte=0"`
}

type UpdateCustomerRequest struct {
	Name         string  `json:"name" binding:"omitempty,min=3,max=100"`
	Email        string  `json:"email" binding:"omitempty,email,max=100"`
	Phone        string  `json:"phone" binding:"omitempty,min=10,max=15"`
	Address      string  `json:"address" binding:"omitempty,max=500"`
	City         string  `json:"city" binding:"omitempty,max=100"`
	State        string  `json:"state" binding:"omitempty,max=100"`
	Pincode      string  `json:"pincode" binding:"omitempty,len=6,numeric"`
	GSTIN        string  `json:"gstin" binding:"omitempty,len=15,alphanum"`
	CustomerType string  `json:"customer_type" binding:"omitempty,oneof=retail wholesale b2b b2c"`
	CreditLimit  float64 `json:"credit_limit" binding:"omitempty,gte=0"`
	IsActive     *bool   `json:"is_active" binding:"omitempty"`
}

// ==================== SALES REQUESTS ====================

type SalesOrderItemRequest struct {
	ProductID    string  `json:"product_id" binding:"required,uuid"`
	Quantity     int     `json:"quantity" binding:"required,gt=0"`
	UnitPrice    float64 `json:"unit_price" binding:"required,gt=0"`
	DiscountPct  float64 `json:"discount_pct" binding:"omitempty,gte=0,lte=100"`
	TaxPct       float64 `json:"tax_pct" binding:"omitempty,gte=0,lte=100"`
	BatchNumber  string  `json:"batch_number" binding:"omitempty,max=50"`
}

type CreateSalesOrderRequest struct {
	CustomerID   string                  `json:"customer_id" binding:"required,uuid"`
	OrderDate    time.Time               `json:"order_date" binding:"required"`
	Items        []SalesOrderItemRequest `json:"items" binding:"required,min=1,dive"`
	Notes        string                  `json:"notes" binding:"omitempty,max=500"`
	ShippingAddr string                  `json:"shipping_address" binding:"omitempty,max=500"`
	DiscountPct  float64                 `json:"discount_pct" binding:"omitempty,gte=0,lte=100"`
	TaxPct       float64                 `json:"tax_pct" binding:"omitempty,gte=0,lte=100"`
}

type UpdateSalesOrderRequest struct {
	CustomerID   string                  `json:"customer_id" binding:"omitempty,uuid"`
	OrderDate    *time.Time              `json:"order_date" binding:"omitempty"`
	Items        []SalesOrderItemRequest `json:"items" binding:"omitempty,min=1,dive"`
	Notes        string                  `json:"notes" binding:"omitempty,max=500"`
	ShippingAddr string                  `json:"shipping_address" binding:"omitempty,max=500"`
	DiscountPct  float64                 `json:"discount_pct" binding:"omitempty,gte=0,lte=100"`
	TaxPct       float64                 `json:"tax_pct" binding:"omitempty,gte=0,lte=100"`
	Status       string                  `json:"status" binding:"omitempty,oneof=pending confirmed processing shipped delivered cancelled"`
}

// ==================== INVENTORY REQUESTS ====================

type AdjustStockRequest struct {
	ProductID  string  `json:"product_id" binding:"required,uuid"`
	Adjustment int     `json:"adjustment" binding:"required"`
	Reason     string  `json:"reason" binding:"required,min=5,max=200"`
	Notes      string  `json:"notes" binding:"omitempty,max=500"`
}

type TransferStockRequest struct {
	ProductID      string `json:"product_id" binding:"required,uuid"`
	FromLocationID string `json:"from_location_id" binding:"required,uuid"`
	ToLocationID   string `json:"to_location_id" binding:"required,uuid"`
	Quantity       int    `json:"quantity" binding:"required,gt=0"`
	Notes          string `json:"notes" binding:"omitempty,max=500"`
}

// ==================== SETTINGS REQUESTS ====================

type CreateBranchRequest struct {
	Name      string `json:"name" binding:"required,min=3,max=100"`
	Code      string `json:"code" binding:"required,min=2,max=20,alphanum"`
	Address   string `json:"address" binding:"omitempty,max=500"`
	City      string `json:"city" binding:"omitempty,max=100"`
	State     string `json:"state" binding:"omitempty,max=100"`
	Pincode   string `json:"pincode" binding:"omitempty,len=6,numeric"`
	Phone     string `json:"phone" binding:"omitempty,min=10,max=15"`
	Email     string `json:"email" binding:"omitempty,email,max=100"`
	GSTIN     string `json:"gstin" binding:"omitempty,len=15,alphanum"`
	IsActive  *bool  `json:"is_active" binding:"omitempty"`
}

type UpdateBranchRequest struct {
	Name     string `json:"name" binding:"omitempty,min=3,max=100"`
	Code     string `json:"code" binding:"omitempty,min=2,max=20,alphanum"`
	Address  string `json:"address" binding:"omitempty,max=500"`
	City     string `json:"city" binding:"omitempty,max=100"`
	State    string `json:"state" binding:"omitempty,max=100"`
	Pincode  string `json:"pincode" binding:"omitempty,len=6,numeric"`
	Phone    string `json:"phone" binding:"omitempty,min=10,max=15"`
	Email    string `json:"email" binding:"omitempty,email,max=100"`
	GSTIN    string `json:"gstin" binding:"omitempty,len=15,alphanum"`
	IsActive *bool  `json:"is_active" binding:"omitempty"`
}

type UpsertSettingRequest struct {
	Value       string `json:"value" binding:"required"`
	Description string `json:"description" binding:"omitempty,max=500"`
	Category    string `json:"category" binding:"omitempty,max=50"`
	IsPublic    *bool  `json:"is_public" binding:"omitempty"`
}

// ==================== CATEGORY REQUESTS ====================

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Description string `json:"description" binding:"omitempty,max=500"`
	ParentID    string `json:"parent_id" binding:"omitempty,uuid"`
	IsActive    *bool  `json:"is_active" binding:"omitempty"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name" binding:"omitempty,min=2,max=100"`
	Description string `json:"description" binding:"omitempty,max=500"`
	ParentID    string `json:"parent_id" binding:"omitempty,uuid"`
	IsActive    *bool  `json:"is_active" binding:"omitempty"`
}
