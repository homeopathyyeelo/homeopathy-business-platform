package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// POSSession represents a POS billing session for dual-panel mode
type POSSession struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	BranchID  uuid.UUID      `json:"branch_id" gorm:"type:uuid"`
	Status    string         `json:"status" gorm:"type:varchar(20);default:'active'"` // active, paused, completed
	CartData  datatypes.JSON `json:"cart_data" gorm:"type:jsonb"`
	CustomerID *uuid.UUID    `json:"customer_id" gorm:"type:uuid"`
	TotalAmount float64      `json:"total_amount" gorm:"type:decimal(15,2);default:0"`
	ItemCount  int           `json:"item_count" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// POSSessionItem represents individual items in a POS session
type POSSessionItem struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	SessionID   uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	ProductID   uuid.UUID `json:"product_id" gorm:"type:uuid;not null"`
	ProductName string    `json:"product_name" gorm:"type:varchar(255)"`
	Quantity    int       `json:"quantity" gorm:"not null"`
	UnitPrice   float64   `json:"unit_price" gorm:"type:decimal(10,2);not null"`
	Discount    float64   `json:"discount" gorm:"type:decimal(10,2);default:0"`
	TaxRate     float64   `json:"tax_rate" gorm:"type:decimal(5,2);default:0"`
	LineTotal   float64   `json:"line_total" gorm:"type:decimal(15,2)"`
	CreatedAt   time.Time `json:"created_at"`
}

// TableName specifies the table name for POSSession
func (POSSession) TableName() string {
	return "pos_sessions"
}

// TableName specifies the table name for POSSessionItem
func (POSSessionItem) TableName() string {
	return "pos_session_items"
}
