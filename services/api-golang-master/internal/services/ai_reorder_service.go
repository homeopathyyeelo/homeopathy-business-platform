package services

import (
	"time"

	"gorm.io/gorm"
)

type AIReorderService struct {
	DB *gorm.DB
}

func NewAIReorderService(db *gorm.DB) *AIReorderService {
	return &AIReorderService{DB: db}
}

type ReorderSuggestion struct {
	ProductID         string  `json:"product_id"`
	ProductName       string  `json:"product_name"`
	CurrentStock      int     `json:"current_stock"`
	AvgDailySales     float64 `json:"avg_daily_sales"`
	DaysUntilStockout int     `json:"days_until_stockout"`
	SuggestedQty      int     `json:"suggested_qty"`
	EstimatedCost     float64 `json:"estimated_cost"`
	Confidence        float64 `json:"confidence"`
	Priority          string  `json:"priority"` // HIGH, MEDIUM, LOW
	ReorderPoint      int     `json:"reorder_point"`
	SafetyStock       int     `json:"safety_stock"`
	VendorID          string  `json:"vendor_id"`
	VendorName        string  `json:"vendor_name"`
	LeadTimeDays      int     `json:"lead_time_days"`
}

// GetReorderSuggestions generates AI-based reorder suggestions
func (s *AIReorderService) GetReorderSuggestions() ([]ReorderSuggestion, error) {
	var suggestions []ReorderSuggestion

	// Query to get products with sales velocity and current stock
	query := `
		WITH sales_velocity AS (
			SELECT 
				p.id as product_id,
				p.name as product_name,
				COALESCE(SUM(sii.quantity), 0) / 90.0 as avg_daily_sales,
				COALESCE(SUM(ib.available_quantity), 0) as current_stock,
				p.min_stock_level,
				COALESCE(v.id, '') as vendor_id,
				COALESCE(v.name, 'Unknown') as vendor_name,
				COALESCE(p.unit_cost, 0) as unit_cost
			FROM products p
			LEFT JOIN sales_invoice_items sii ON sii.product_id = p.id
			LEFT JOIN sales_invoices si ON si.id = sii.sales_invoice_id 
				AND si.created_at >= CURRENT_DATE - INTERVAL '90 days'
			LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
			LEFT JOIN vendors v ON v.id = p.preferred_vendor_id
			WHERE p.is_active = true
			GROUP BY p.id, p.name, p.min_stock_level, v.id, v.name, p.unit_cost
		)
		SELECT 
			product_id,
			product_name,
			current_stock::int,
			avg_daily_sales,
			vendor_id,
			vendor_name,
			unit_cost
		FROM sales_velocity
		WHERE avg_daily_sales > 0
		AND current_stock > 0
		ORDER BY (current_stock / NULLIF(avg_daily_sales, 0)) ASC
		LIMIT 50
	`

	type QueryResult struct {
		ProductID     string
		ProductName   string
		CurrentStock  int
		AvgDailySales float64
		VendorID      string
		VendorName    string
		UnitCost      float64
	}

	var results []QueryResult
	if err := s.DB.Raw(query).Scan(&results).Error; err != nil {
		return nil, err
	}

	// Calculate reorder suggestions for each product
	for _, result := range results {
		// Lead time (default 7 days, can be customized)
		leadTimeDays := 7

		// Safety stock (2 weeks of sales)
		safetyStock := int(result.AvgDailySales * 14)

		// Reorder point
		reorderPoint := int(result.AvgDailySales*float64(leadTimeDays)) + safetyStock

		// Days until stockout
		daysUntilStockout := 0
		if result.AvgDailySales > 0 {
			daysUntilStockout = int(float64(result.CurrentStock) / result.AvgDailySales)
		}

		// Only suggest if below reorder point
		if result.CurrentStock < reorderPoint {
			// Suggested quantity (30 days supply minus current stock)
			suggestedQty := int(result.AvgDailySales*30) - result.CurrentStock
			if suggestedQty < 0 {
				suggestedQty = int(result.AvgDailySales * 30)
			}

			// Calculate confidence score (0-1)
			confidence := s.calculateConfidence(result.AvgDailySales, result.CurrentStock, daysUntilStockout)

			// Determine priority
			priority := "LOW"
			if daysUntilStockout <= 7 {
				priority = "HIGH"
			} else if daysUntilStockout <= 14 {
				priority = "MEDIUM"
			}

			suggestion := ReorderSuggestion{
				ProductID:         result.ProductID,
				ProductName:       result.ProductName,
				CurrentStock:      result.CurrentStock,
				AvgDailySales:     result.AvgDailySales,
				DaysUntilStockout: daysUntilStockout,
				SuggestedQty:      suggestedQty,
				EstimatedCost:     float64(suggestedQty) * result.UnitCost,
				Confidence:        confidence,
				Priority:          priority,
				ReorderPoint:      reorderPoint,
				SafetyStock:       safetyStock,
				VendorID:          result.VendorID,
				VendorName:        result.VendorName,
				LeadTimeDays:      leadTimeDays,
			}

			suggestions = append(suggestions, suggestion)
		}
	}

	return suggestions, nil
}

// calculateConfidence calculates confidence score based on various factors
func (s *AIReorderService) calculateConfidence(avgDailySales float64, currentStock int, daysUntilStockout int) float64 {
	confidence := 0.5 // Base confidence

	// Higher confidence if we have consistent sales data
	if avgDailySales > 1 {
		confidence += 0.2
	}

	// Higher confidence if stockout is imminent
	if daysUntilStockout <= 7 {
		confidence += 0.2
	} else if daysUntilStockout <= 14 {
		confidence += 0.1
	}

	// Lower confidence if current stock is very low (might indicate discontinuation)
	if currentStock < 5 {
		confidence -= 0.1
	}

	// Ensure confidence is between 0 and 1
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.0 {
		confidence = 0.0
	}

	return confidence
}

// GeneratePOFromSuggestion creates a purchase order from a suggestion
func (s *AIReorderService) GeneratePOFromSuggestion(productID string, quantity int, vendorID string) (string, error) {
	// This would create an actual PO in the database
	// For now, return a placeholder
	return "PO-AI-" + time.Now().Format("20060102") + "-001", nil
}
