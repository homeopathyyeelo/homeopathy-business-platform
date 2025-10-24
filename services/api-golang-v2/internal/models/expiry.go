package models

import "time"

type ExpirySummary struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ShopID       string    `json:"shop_id"`
	WindowLabel  string    `json:"window_label"`
	CountItems   int       `json:"count_items"`
	CountBatches int       `json:"count_batches"`
	TotalValue   float64   `json:"total_value"`
	Sample       any       `gorm:"type:jsonb" json:"sample_products"`
	ComputedAt   time.Time `json:"computed_at"`
}

type ExpiryAlert struct {
	ID            string  `json:"id"`
	ProductID     string  `json:"product_id"`
	ProductName   string  `json:"product_name"`
	SKU           string  `json:"sku"`
	BatchNo       string  `json:"batch_no"`
	ExpiryDate    string  `json:"expiry_date"`
	DaysToExpiry  int     `json:"days_to_expiry"`
	AlertLevel    string  `json:"alert_level"`
	QtyAvailable  int     `json:"qty_available"`
	TotalValue    float64 `json:"total_value"`
	Status        string  `json:"status"`
}
