package services

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
)

type ExpiryService struct {
	DB *gorm.DB
}

type ExpiryWindowRow struct {
	WindowLabel  string
	CountItems   int64
	CountBatches int64
	TotalValue   float64
	ComputedAt   time.Time
}

type ExpiryAlertRow struct {
	ID           string
	ProductID    string
	ProductName  string
	SKU          string
	BatchNo      string
	ExpiryDate   time.Time
	DaysToExpiry int64
	AlertLevel   string
	QtyAvailable int64
	TotalValue   float64
	Status       string
}

func NewExpiryService(db *gorm.DB) *ExpiryService {
	return &ExpiryService{DB: db}
}

// ComputeSummary computes expiry windows directly from core.inventory_batches
func (s *ExpiryService) ComputeSummary(ctx context.Context, shopID string) ([]ExpiryWindowRow, error) {
	if shopID == "" {
		return nil, errors.New("shop_id is required")
	}
	// Query batches and bucket into windows
	query := `
	WITH upcoming AS (
	  SELECT 
	    CASE
	      WHEN expiry_date <= now() + interval '7 days' THEN '7_days'
	      WHEN expiry_date <= now() + interval '1 month' THEN '1_month'
	      WHEN expiry_date <= now() + interval '2 months' THEN '2_months'
	      WHEN expiry_date <= now() + interval '3 months' THEN '3_months'
	      WHEN expiry_date <= now() + interval '6 months' THEN '6_months'
	      WHEN expiry_date <= now() + interval '1 year' THEN '1_year'
	      WHEN expiry_date <= now() + interval '60 months' THEN '60_months'
	      ELSE 'later'
	    END AS window_label,
	    qty - reserved_qty AS qty_left,
	    qty * unit_cost AS value
	  FROM core.inventory_batches
	  WHERE shop_id = ?
	    AND expiry_date IS NOT NULL
	    AND expiry_date > now()
	    AND (qty - reserved_qty) > 0
	)
	SELECT window_label,
	       COUNT(*) AS count_batches,
	       SUM(qty_left) AS count_items,
	       COALESCE(SUM(value),0) AS total_value,
	       now() as computed_at
	FROM upcoming
	GROUP BY window_label;`

	rows := []ExpiryWindowRow{}
	if err := s.DB.Raw(query, shopID).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// Alerts returns detailed alerts for a specific window
func (s *ExpiryService) Alerts(ctx context.Context, shopID, window string, limit int) ([]ExpiryAlertRow, error) {
	if shopID == "" { return nil, errors.New("shop_id is required") }
	if limit <= 0 { limit = 50 }

	cond := "expiry_date <= now() + interval '7 days'"
	switch window {
	case "7_days":
		cond = "expiry_date <= now() + interval '7 days'"
	case "1_month":
		cond = "expiry_date <= now() + interval '1 month'"
	case "2_months":
		cond = "expiry_date <= now() + interval '2 months'"
	case "3_months":
		cond = "expiry_date <= now() + interval '3 months'"
	case "6_months":
		cond = "expiry_date <= now() + interval '6 months'"
	case "1_year":
		cond = "expiry_date <= now() + interval '1 year'"
	case "60_months":
		cond = "expiry_date <= now() + interval '60 months'"
	}

	query := `
	SELECT 
	  ib.id,
	  ib.product_id,
	  p.name as product_name,
	  p.sku,
	  ib.batch_no,
	  ib.expiry_date,
	  GREATEST(0, (DATE(ib.expiry_date) - DATE(now()))) AS days_to_expiry,
	  CASE WHEN ib.expiry_date <= now() + interval '7 days' THEN 'critical' ELSE 'warning' END AS alert_level,
	  (ib.qty - ib.reserved_qty) AS qty_available,
	  COALESCE(ib.qty * ib.unit_cost, 0) AS total_value,
	  'open' as status
	FROM core.inventory_batches ib
	JOIN core.products p ON p.id = ib.product_id
	WHERE ib.shop_id = ?
	  AND ib.expiry_date IS NOT NULL
	  AND ib.expiry_date > now()
	  AND (ib.qty - ib.reserved_qty) > 0
	  AND ` + cond + `
	ORDER BY ib.expiry_date ASC
	LIMIT ?;`

	rows := []ExpiryAlertRow{}
	if err := s.DB.Raw(query, shopID, limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
