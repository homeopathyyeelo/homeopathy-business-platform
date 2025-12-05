package services

import (
	"fmt"
	"math"
	"time"

	"gorm.io/gorm"
)

type AISalesService struct {
	DB *gorm.DB
}

func NewAISalesService(db *gorm.DB) *AISalesService {
	return &AISalesService{DB: db}
}

type SalesForecast struct {
	Period          string            `json:"period"` // "30_days", "60_days", "90_days"
	TotalRevenue    float64           `json:"total_revenue"`
	GrowthRate      float64           `json:"growth_rate"`
	ConfidenceScore float64           `json:"confidence_score"`
	TopProducts     []ProductForecast `json:"top_products"`
	DailyForecasts  []DailyForecast   `json:"daily_forecasts"`
	Insights        []string          `json:"insights"`
}

type ProductForecast struct {
	ProductID        string  `json:"product_id"`
	ProductName      string  `json:"product_name"`
	PredictedSales   float64 `json:"predicted_sales"`
	PredictedRevenue float64 `json:"predicted_revenue"`
	Trend            string  `json:"trend"` // "UP", "DOWN", "STABLE"
}

type DailyForecast struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

// GenerateSalesForecast generates a sales forecast for the given period
func (s *AISalesService) GenerateSalesForecast(days int) (*SalesForecast, error) {
	// 1. Get historical sales data (last 90 days)
	type DailySales struct {
		Date   time.Time
		Amount float64
	}
	var history []DailySales

	err := s.DB.Raw(`
		SELECT 
			DATE(created_at) as date, 
			SUM(total_amount) as amount 
		FROM sales_invoices 
		WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
		GROUP BY DATE(created_at) 
		ORDER BY date ASC
	`).Scan(&history).Error
	if err != nil {
		return nil, err
	}

	if len(history) < 10 {
		return nil, fmt.Errorf("insufficient data for forecasting (need at least 10 days)")
	}

	// 2. Calculate average daily growth rate
	var totalGrowth float64
	var count int
	for i := 1; i < len(history); i++ {
		if history[i-1].Amount > 0 {
			growth := (history[i].Amount - history[i-1].Amount) / history[i-1].Amount
			totalGrowth += growth
			count++
		}
	}
	avgGrowthRate := 0.0
	if count > 0 {
		avgGrowthRate = totalGrowth / float64(count)
	}

	// Cap extreme growth rates for realism
	if avgGrowthRate > 0.05 {
		avgGrowthRate = 0.05
	}
	if avgGrowthRate < -0.05 {
		avgGrowthRate = -0.05
	}

	// 3. Generate daily forecasts
	var dailyForecasts []DailyForecast
	lastAmount := history[len(history)-1].Amount
	// Use a moving average for the base
	if len(history) >= 7 {
		var sum float64
		for i := len(history) - 7; i < len(history); i++ {
			sum += history[i].Amount
		}
		lastAmount = sum / 7.0
	}

	currentDate := time.Now()
	totalPredictedRevenue := 0.0

	for i := 1; i <= days; i++ {
		// Add some randomness and seasonality (e.g., weekends might be higher/lower)
		dayOfWeek := currentDate.AddDate(0, 0, i).Weekday()
		seasonality := 1.0
		if dayOfWeek == time.Saturday || dayOfWeek == time.Sunday {
			seasonality = 1.1 // Assume weekends are 10% busier
		}

		// Apply growth
		predictedAmount := lastAmount * math.Pow(1+avgGrowthRate, float64(i)) * seasonality

		// Ensure non-negative
		if predictedAmount < 0 {
			predictedAmount = 0
		}

		dailyForecasts = append(dailyForecasts, DailyForecast{
			Date:   currentDate.AddDate(0, 0, i).Format("2006-01-02"),
			Amount: math.Round(predictedAmount*100) / 100,
		})
		totalPredictedRevenue += predictedAmount
	}

	// 4. Get top product trends
	var topProducts []ProductForecast
	s.DB.Raw(`
		WITH product_sales AS (
			SELECT 
				p.id, 
				p.name, 
				SUM(sii.quantity) as total_qty,
				SUM(sii.total_amount) as total_rev
			FROM sales_invoice_items sii
			JOIN products p ON p.id = sii.product_id
			JOIN sales_invoices si ON si.id = sii.sales_invoice_id
			WHERE si.created_at >= CURRENT_DATE - INTERVAL '30 days'
			GROUP BY p.id, p.name
			ORDER BY total_rev DESC
			LIMIT 5
		)
		SELECT 
			id as product_id,
			name as product_name,
			total_qty * (1 + ?) as predicted_sales,
			total_rev * (1 + ?) as predicted_revenue,
			'UP' as trend
		FROM product_sales
	`, avgGrowthRate*30, avgGrowthRate*30).Scan(&topProducts)

	// 5. Generate insights
	insights := []string{
		fmt.Sprintf("Projected revenue for next %d days is ₹%.2f", days, totalPredictedRevenue),
	}
	if avgGrowthRate > 0 {
		insights = append(insights, fmt.Sprintf("Sales are trending upwards with a daily growth of %.1f%%", avgGrowthRate*100))
	} else {
		insights = append(insights, fmt.Sprintf("Sales are showing a slight decline of %.1f%% daily", math.Abs(avgGrowthRate*100)))
	}

	return &SalesForecast{
		Period:          fmt.Sprintf("%d_days", days),
		TotalRevenue:    math.Round(totalPredictedRevenue*100) / 100,
		GrowthRate:      math.Round(avgGrowthRate*100*100) / 100, // Percentage
		ConfidenceScore: 0.85,                                    // Placeholder confidence
		TopProducts:     topProducts,
		DailyForecasts:  dailyForecasts,
		Insights:        insights,
	}, nil
}
