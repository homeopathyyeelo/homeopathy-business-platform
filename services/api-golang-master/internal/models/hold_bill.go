package models

import (
	"time"

	"github.com/google/uuid"
)

// HoldBill represents a temporarily held POS bill
type HoldBill struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	BillNumber    string     `gorm:"type:varchar(50);unique;not null" json:"bill_number"`
	CounterID     *string    `gorm:"type:varchar(50)" json:"counter_id"`
	CustomerID    *uuid.UUID `gorm:"type:uuid" json:"customer_id"`
	CustomerName  string     `gorm:"type:varchar(255)" json:"customer_name"`
	CustomerPhone string     `gorm:"type:varchar(20)" json:"customer_phone"`

	// Cart Data (stored as JSONB)
	Items []byte `gorm:"type:jsonb" json:"items"` // Store cart items as JSON

	// Financial Summary
	SubTotal        float64 `gorm:"type:decimal(15,2);default:0" json:"sub_total"`
	DiscountAmount  float64 `gorm:"type:decimal(15,2);default:0" json:"discount_amount"`
	DiscountPercent float64 `gorm:"type:decimal(5,2);default:0" json:"discount_percent"`
	TaxAmount       float64 `gorm:"type:decimal(15,2);default:0" json:"tax_amount"`
	TotalAmount     float64 `gorm:"type:decimal(15,2);default:0" json:"total_amount"`

	// Additional Info
	TotalItems  int    `gorm:"default:0" json:"total_items"`
	BillingType string `gorm:"type:varchar(50);default:'RETAIL'" json:"billing_type"` // RETAIL, WHOLESALE, etc.
	Notes       string `gorm:"type:text" json:"notes"`

	// Audit fields
	HeldBy       *uuid.UUID `gorm:"type:uuid" json:"held_by"` // Employee/User who held the bill
	HeldByName   string     `gorm:"type:varchar(255)" json:"held_by_name"`
	ResumedCount int        `gorm:"default:0" json:"resumed_count"` // Track how many times resumed

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for HoldBill
func (HoldBill) TableName() string {
	return "pos_hold_bills"
}
