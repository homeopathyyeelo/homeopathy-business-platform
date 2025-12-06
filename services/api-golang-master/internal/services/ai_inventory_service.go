package services

import (
	"math"

	"gorm.io/gorm"
)

type AIInventoryService struct {
	DB *gorm.DB
}

func NewAIInventoryService(db *gorm.DB) *AIInventoryService {
	return &AIInventoryService{DB: db}
}

type DemandForecast struct {
	ProductID         string  `json:"product_id"`
	ProductName       string  `json:"product_name"`
	CurrentStock      int     `json:"current_stock"`
	PredictedDemand   int     `json:"predicted_demand"` // Next 30 days
	StockoutRisk      string  `json:"stockout_risk"`    // HIGH, MEDIUM, LOW
	DaysUntilStockout int     `json:"days_until_stockout"`
	SeasonalityScore  float64 `json:"seasonality_score"`
	Trend             string  `json:"trend"` // UP, DOWN, STABLE
}

// ForecastDemand generates demand forecasts for inventory items
func (s *AIInventoryService) ForecastDemand() ([]DemandForecast, error) {
	// 1. Get sales history and current stock
	type ProductStats struct {
		ProductID    string
		ProductName  string
		CurrentStock int
		SalesLast90d int
		SalesLast30d int
	}

	var stats []ProductStats
	err := s.DB.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			COALESCE(SUM(ib.available_quantity), 0) as current_stock,
			COALESCE(SUM(CASE WHEN si.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN sii.quantity ELSE 0 END), 0) as sales_last_90d,
			COALESCE(SUM(CASE WHEN si.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN sii.quantity ELSE 0 END), 0) as sales_last_30d
		FROM products p
		LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.is_active = true
		LEFT JOIN sales_invoice_items sii ON sii.product_id = p.id
		LEFT JOIN sales_invoices si ON si.id = sii.sales_invoice_id
		WHERE p.is_active = true
		GROUP BY p.id, p.name
		HAVING COALESCE(SUM(CASE WHEN si.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN sii.quantity ELSE 0 END), 0) > 0
		ORDER BY sales_last_30d DESC
		LIMIT 50
	`).Scan(&stats).Error
	if err != nil {
		return nil, err
	}

	var forecasts []DemandForecast

	for _, stat := range stats {
		// Calculate average daily sales (weighted towards recent)
		avgDailySales90 := float64(stat.SalesLast90d) / 90.0
		avgDailySales30 := float64(stat.SalesLast30d) / 30.0

		// Weight recent sales higher (70% recent, 30% long-term)
		weightedAvgDaily := (avgDailySales30 * 0.7) + (avgDailySales90 * 0.3)

		// Predict demand for next 30 days
		predictedDemand := int(math.Ceil(weightedAvgDaily * 30))

		// Determine trend
		trend := "STABLE"
		if avgDailySales30 > avgDailySales90*1.1 {
			trend = "UP"
		} else if avgDailySales30 < avgDailySales90*0.9 {
			trend = "DOWN"
		}

		// Calculate days until stockout
		daysUntilStockout := 999
		if weightedAvgDaily > 0 {
			daysUntilStockout = int(float64(stat.CurrentStock) / weightedAvgDaily)
		}

		// Determine risk
		risk := "LOW"
		if daysUntilStockout <= 7 {
			risk = "HIGH"
		} else if daysUntilStockout <= 21 {
			risk = "MEDIUM"
		}

		// Seasonality score (placeholder logic)
		seasonality := 1.0
		if trend == "UP" {
			seasonality = 1.2
		}

		forecasts = append(forecasts, DemandForecast{
			ProductID:         stat.ProductID,
			ProductName:       stat.ProductName,
			CurrentStock:      stat.CurrentStock,
			PredictedDemand:   predictedDemand,
			StockoutRisk:      risk,
			DaysUntilStockout: daysUntilStockout,
			SeasonalityScore:  seasonality,
			Trend:             trend,
		})
	}

	return forecasts, nil
}
