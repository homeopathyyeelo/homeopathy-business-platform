package services

import (
	"math"
	"strings"
	"time"

	"gorm.io/gorm"
)

type AICRMService struct {
	DB *gorm.DB
}

func NewAICRMService(db *gorm.DB) *AICRMService {
	return &AICRMService{DB: db}
}

type CLVPrediction struct {
	CustomerID       string  `json:"customer_id"`
	CustomerName     string  `json:"customer_name"`
	CurrentValue     float64 `json:"current_value"`      // Total spent so far
	PredictedCLV     float64 `json:"predicted_clv"`      // Predicted total lifetime value
	ChurnRisk        float64 `json:"churn_risk"`         // 0-1 score
	NextPurchaseDate string  `json:"next_purchase_date"` // Estimated date
	CustomerSegment  string  `json:"customer_segment"`   // VIP, Loyal, At Risk, New
}

type SentimentAnalysis struct {
	Text       string   `json:"text"`
	Sentiment  string   `json:"sentiment"` // Positive, Negative, Neutral
	Score      float64  `json:"score"`     // -1 to 1
	Keywords   []string `json:"keywords"`
	Actionable bool     `json:"actionable"`
}

// PredictCLV calculates Customer Lifetime Value based on purchase history
func (s *AICRMService) PredictCLV(customerID string) (*CLVPrediction, error) {
	// 1. Get customer purchase history
	type PurchaseStats struct {
		TotalSpent     float64
		OrderCount     int
		FirstOrderDate time.Time
		LastOrderDate  time.Time
		AvgOrderValue  float64
	}

	var stats PurchaseStats
	// Mocking query for now as we might not have full schema visibility,
	// but assuming standard sales_invoices table structure
	err := s.DB.Raw(`
		SELECT 
			COALESCE(SUM(total_amount), 0) as total_spent,
			COUNT(id) as order_count,
			MIN(created_at) as first_order_date,
			MAX(created_at) as last_order_date,
			COALESCE(AVG(total_amount), 0) as avg_order_value
		FROM sales_invoices 
		WHERE customer_id = ?
	`, customerID).Scan(&stats).Error

	if err != nil {
		return nil, err
	}

	// Get Customer Name
	var customerName string
	s.DB.Raw("SELECT name FROM customers WHERE id = ?", customerID).Scan(&customerName)

	// 2. Calculate CLV metrics
	if stats.OrderCount == 0 {
		return &CLVPrediction{
			CustomerID:      customerID,
			CustomerName:    customerName,
			CurrentValue:    0,
			PredictedCLV:    0,
			ChurnRisk:       1.0,
			CustomerSegment: "New",
		}, nil
	}

	// Calculate Average Purchase Frequency (days between orders)
	daysActive := stats.LastOrderDate.Sub(stats.FirstOrderDate).Hours() / 24
	avgDaysBetweenOrders := 30.0 // Default
	if stats.OrderCount > 1 && daysActive > 0 {
		avgDaysBetweenOrders = daysActive / float64(stats.OrderCount-1)
	}

	// Calculate Recency (days since last order)
	daysSinceLastOrder := time.Since(stats.LastOrderDate).Hours() / 24

	// Churn Risk Calculation (Simple heuristic)
	// If days since last order > 3x average frequency, high risk
	churnRisk := 0.0
	if daysSinceLastOrder > avgDaysBetweenOrders*3 {
		churnRisk = 0.9
	} else if daysSinceLastOrder > avgDaysBetweenOrders*2 {
		churnRisk = 0.6
	} else if daysSinceLastOrder > avgDaysBetweenOrders {
		churnRisk = 0.3
	} else {
		churnRisk = 0.1
	}

	// CLV Prediction (Simple projection: Avg Value * Frequency * Lifespan)
	// Assuming average customer lifespan of 2 years (730 days) for this business model
	remainingLifespan := 730.0 - daysActive
	if remainingLifespan < 0 {
		remainingLifespan = 365
	} // Extend for loyal customers

	expectedFutureOrders := remainingLifespan / avgDaysBetweenOrders
	predictedFutureValue := expectedFutureOrders * stats.AvgOrderValue * (1 - churnRisk)

	predictedCLV := stats.TotalSpent + predictedFutureValue

	// Segment
	segment := "New"
	if stats.TotalSpent > 50000 {
		segment = "VIP"
	} else if stats.OrderCount > 5 {
		segment = "Loyal"
	} else if churnRisk > 0.7 {
		segment = "At Risk"
	}

	// Next Purchase Date
	nextPurchase := stats.LastOrderDate.Add(time.Duration(avgDaysBetweenOrders) * 24 * time.Hour)

	return &CLVPrediction{
		CustomerID:       customerID,
		CustomerName:     customerName,
		CurrentValue:     math.Round(stats.TotalSpent*100) / 100,
		PredictedCLV:     math.Round(predictedCLV*100) / 100,
		ChurnRisk:        churnRisk,
		NextPurchaseDate: nextPurchase.Format("2006-01-02"),
		CustomerSegment:  segment,
	}, nil
}

// AnalyzeSentiment analyzes text feedback
func (s *AICRMService) AnalyzeSentiment(text string) (*SentimentAnalysis, error) {
	textLower := strings.ToLower(text)

	positiveWords := []string{"great", "good", "excellent", "amazing", "love", "happy", "thanks", "helpful", "best", "satisfied"}
	negativeWords := []string{"bad", "poor", "terrible", "hate", "unhappy", "worst", "slow", "rude", "broken", "issue", "problem"}
	urgentWords := []string{"urgent", "immediately", "asap", "emergency", "now"}

	score := 0.0
	var foundKeywords []string

	for _, word := range positiveWords {
		if strings.Contains(textLower, word) {
			score += 0.2
			foundKeywords = append(foundKeywords, word)
		}
	}

	for _, word := range negativeWords {
		if strings.Contains(textLower, word) {
			score -= 0.2
			foundKeywords = append(foundKeywords, word)
		}
	}

	// Cap score
	if score > 1 {
		score = 1
	}
	if score < -1 {
		score = -1
	}

	sentiment := "Neutral"
	if score >= 0.2 {
		sentiment = "Positive"
	} else if score <= -0.2 {
		sentiment = "Negative"
	}

	actionable := false
	if sentiment == "Negative" || containsAny(textLower, urgentWords) {
		actionable = true
	}

	return &SentimentAnalysis{
		Text:       text,
		Sentiment:  sentiment,
		Score:      score,
		Keywords:   foundKeywords,
		Actionable: actionable,
	}, nil
}
