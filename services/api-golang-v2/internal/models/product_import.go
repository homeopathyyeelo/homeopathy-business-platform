package models

import "time"

// ProductImport represents a product for bulk import/export
type ProductImport struct {
	ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SKU           string    `gorm:"uniqueIndex;size:128;not null" json:"sku"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Category      string    `gorm:"size:128" json:"category"`
	Type          string    `gorm:"size:64" json:"type"`           // Medicine/MotherTincture/Dilution
	Brand         string    `gorm:"size:128" json:"brand"`
	Potency       string    `gorm:"size:64" json:"potency"`        // 30C, 200C, 1M, Q, 6X
	Form          string    `gorm:"size:64" json:"form"`           // tablet, liquid, drops, globules
	PackSize      string    `gorm:"size:64" json:"pack_size"`      // 10g, 30ml, 100ml
	UOM           string    `gorm:"size:32" json:"uom"`            // piece, ml, gm
	CostPrice     float64   `gorm:"type:decimal(12,2)" json:"cost_price"`
	SellingPrice  float64   `gorm:"type:decimal(12,2)" json:"selling_price"`
	MRP           float64   `gorm:"type:decimal(12,2)" json:"mrp"`
	TaxPercent    float64   `gorm:"type:decimal(5,2)" json:"tax_percent"`
	HSNCode       string    `gorm:"size:64" json:"hsn_code"`
	Manufacturer  string    `gorm:"size:128" json:"manufacturer"`
	Description   string    `gorm:"type:text" json:"description"`
	Barcode       string    `gorm:"size:64" json:"barcode"`
	ReorderLevel  int       `json:"reorder_level"`
	MinStock      int       `json:"min_stock"`
	MaxStock      int       `json:"max_stock"`
	CurrentStock  int       `json:"current_stock"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	Tags          string    `gorm:"size:255" json:"tags"`          // semicolon separated
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName specifies the table name
func (ProductImport) TableName() string {
	return "products"
}

// ImportResult contains the result of bulk import
type ImportResult struct {
	TotalRows    int      `json:"total_rows"`
	Inserted     int      `json:"inserted"`
	Updated      int      `json:"updated"`
	Skipped      int      `json:"skipped"`
	Errors       []string `json:"errors"`
	ProcessTime  string   `json:"process_time"`
	SuccessRate  float64  `json:"success_rate"`
}
