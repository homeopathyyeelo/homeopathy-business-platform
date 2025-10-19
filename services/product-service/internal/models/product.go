package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type Product struct {
	ID                    string          `gorm:"type:uuid;primary_key" json:"id"`
	Name                  string          `gorm:"not null;index" json:"name"`
	Code                  string          `gorm:"uniqueIndex;not null" json:"code"`
	Description           string          `json:"description"`
	CategoryID            string          `gorm:"type:uuid;index" json:"category_id"`
	Category              *Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	BrandID               *string         `gorm:"type:uuid;index" json:"brand_id"`
	Brand                 *Brand          `gorm:"foreignKey:BrandID" json:"brand,omitempty"`
	PotencyID             *string         `gorm:"type:uuid" json:"potency_id"`
	PackingSizeID         string          `gorm:"type:uuid" json:"packing_size_id"`
	HSNCode               string          `gorm:"index" json:"hsn_code"`
	Barcode               *string         `gorm:"uniqueIndex" json:"barcode"`
	SKU                   string          `gorm:"uniqueIndex;not null" json:"sku"`
	BasePrice             decimal.Decimal `gorm:"type:decimal(10,2)" json:"base_price"`
	SellingPrice          decimal.Decimal `gorm:"type:decimal(10,2)" json:"selling_price"`
	MRP                   decimal.Decimal `gorm:"type:decimal(10,2)" json:"mrp"`
	CostPrice             decimal.Decimal `gorm:"type:decimal(10,2)" json:"cost_price"`
	TaxRate               decimal.Decimal `gorm:"type:decimal(5,2)" json:"tax_rate"`
	ReorderLevel          int             `gorm:"default:0" json:"reorder_level"`
	MinStockLevel         int             `gorm:"default:0" json:"min_stock_level"`
	MaxStockLevel         int             `gorm:"default:0" json:"max_stock_level"`
	IsPrescriptionRequired bool           `gorm:"default:false" json:"is_prescription_required"`
	IsActive              bool            `gorm:"default:true;index" json:"is_active"`
	IsFeatured            bool            `gorm:"default:false" json:"is_featured"`
	ImageURL              *string         `json:"image_url"`
	Images                []string        `gorm:"type:text[]" json:"images"`
	Tags                  []string        `gorm:"type:text[]" json:"tags"`
	Metadata              map[string]interface{} `gorm:"type:jsonb" json:"metadata"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`
	DeletedAt             gorm.DeletedAt  `gorm:"index" json:"-"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

type Category struct {
	ID          string         `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null;index" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code"`
	ParentID    *string        `gorm:"type:uuid;index" json:"parent_id"`
	Parent      *Category      `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Description *string        `json:"description"`
	ImageURL    *string        `json:"image_url"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	Metadata    map[string]interface{} `gorm:"type:jsonb" json:"metadata"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}

type Brand struct {
	ID          string         `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null;index" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code"`
	Description *string        `json:"description"`
	Country     *string        `json:"country"`
	Website     *string        `json:"website"`
	LogoURL     *string        `json:"logo_url"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *Brand) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}

type Inventory struct {
	ID              string          `gorm:"type:uuid;primary_key" json:"id"`
	ProductID       string          `gorm:"type:uuid;index;not null" json:"product_id"`
	Product         *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	WarehouseID     *string         `gorm:"type:uuid;index" json:"warehouse_id"`
	BatchNumber     *string         `gorm:"index" json:"batch_number"`
	Quantity        int             `gorm:"not null" json:"quantity"`
	AvailableQty    int             `gorm:"not null" json:"available_qty"`
	ReservedQty     int             `gorm:"default:0" json:"reserved_qty"`
	DamagedQty      int             `gorm:"default:0" json:"damaged_qty"`
	ManufactureDate *time.Time      `json:"manufacture_date"`
	ExpiryDate      *time.Time      `gorm:"index" json:"expiry_date"`
	CostPrice       decimal.Decimal `gorm:"type:decimal(10,2)" json:"cost_price"`
	SellingPrice    decimal.Decimal `gorm:"type:decimal(10,2)" json:"selling_price"`
	Location        *string         `json:"location"`
	IsActive        bool            `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       gorm.DeletedAt  `gorm:"index" json:"-"`
}

func (i *Inventory) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}

type StockMovement struct {
	ID            string          `gorm:"type:uuid;primary_key" json:"id"`
	ProductID     string          `gorm:"type:uuid;index;not null" json:"product_id"`
	Product       *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	InventoryID   *string         `gorm:"type:uuid;index" json:"inventory_id"`
	Type          string          `gorm:"index;not null" json:"type"` // in, out, adjustment, transfer, return
	Quantity      int             `gorm:"not null" json:"quantity"`
	FromLocation  *string         `json:"from_location"`
	ToLocation    *string         `json:"to_location"`
	Reason        *string         `json:"reason"`
	ReferenceType *string         `json:"reference_type"` // purchase, sale, adjustment
	ReferenceID   *string         `json:"reference_id"`
	UserID        *string         `gorm:"type:uuid" json:"user_id"`
	Notes         *string         `json:"notes"`
	CreatedAt     time.Time       `json:"created_at"`
}

func (s *StockMovement) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}
