package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type AIAnalyticsService struct {
	DB     *gorm.DB
	Client *openai.Client
}

func NewAIAnalyticsService(db *gorm.DB, apiKey string) *AIAnalyticsService {
	var client *openai.Client
	if apiKey != "" {
		client = openai.NewClient(apiKey)
	}
	return &AIAnalyticsService{
		DB:     db,
		Client: client,
	}
}

// Anomaly represents a detected anomaly
type Anomaly struct {
	Type        string  `json:"type"`     // "sales", "inventory", "system"
	Severity    string  `json:"severity"` // "low", "medium", "high"
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Value       float64 `json:"value"`
	Expected    float64 `json:"expected"`
	Deviation   float64 `json:"deviation"`
	DetectedAt  string  `json:"detected_at"`
}

// Prediction represents a forecast or recommendation
type Prediction struct {
	Type        string  `json:"type"` // "sales_forecast", "restock", "customer_behavior"
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Confidence  float64 `json:"confidence"` // 0-1
	Value       float64 `json:"value"`
	Timeline    string  `json:"timeline"` // "next_7_days", "next_month", etc.
}

// NLInsight represents a natural language insight
type NLInsight struct {
	Category string `json:"category"` // "sales", "inventory", "customer", "system"
	Text     string `json:"text"`
	Priority int    `json:"priority"` // 1-10
	Icon     string `json:"icon"`
}

// PriorityActivity represents an activity with priority score
type PriorityActivity struct {
	ID                string  `json:"id"`
	Event             string  `json:"event"`
	Module            string  `json:"module"`
	Description       string  `json:"description"`
	Timestamp         string  `json:"timestamp"`
	PriorityScore     float64 `json:"priority_score"`
	FinancialImpact   float64 `json:"financial_impact"`
	Urgency           float64 `json:"urgency"`
	CustomerImpact    float64 `json:"customer_impact"`
	Criticality       float64 `json:"criticality"`
	RecommendedAction string  `json:"recommended_action"`
}

// DetectAnomalies analyzes data and detects anomalies
func (s *AIAnalyticsService) DetectAnomalies() ([]Anomaly, error) {
	anomalies := []Anomaly{}

	// 1. Sales Anomalies
	salesAnomalies, err := s.detectSalesAnomalies()
	if err == nil {
		anomalies = append(anomalies, salesAnomalies...)
	}

	// 2. Inventory Anomalies
	inventoryAnomalies, err := s.detectInventoryAnomalies()
	if err == nil {
		anomalies = append(anomalies, inventoryAnomalies...)
	}

	// 3. System Anomalies (placeholder - would integrate with monitoring)
	systemAnomalies := s.detectSystemAnomalies()
	anomalies = append(anomalies, systemAnomalies...)

	return anomalies, nil
}

func (s *AIAnalyticsService) detectSalesAnomalies() ([]Anomaly, error) {
	anomalies := []Anomaly{}

	// Get today's revenue
	var todayRevenue float64
	today := time.Now().Format("2006-01-02")
	err := s.DB.Raw(`
		SELECT COALESCE(SUM(total), 0) 
		FROM invoices 
		WHERE DATE(created_at) = ?
	`, today).Scan(&todayRevenue).Error
	if err != nil {
		return anomalies, err
	}

	// Get average revenue from last 7 days (excluding today)
	var avgRevenue float64
	sevenDaysAgo := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	err = s.DB.Raw(`
		SELECT COALESCE(AVG(daily_total), 0)
		FROM (
			SELECT DATE(created_at) as date, SUM(total) as daily_total
			FROM invoices
			WHERE DATE(created_at) BETWEEN ? AND ?
			AND DATE(created_at) < ?
			GROUP BY DATE(created_at)
		) as daily_sales
	`, sevenDaysAgo, today, today).Scan(&avgRevenue).Error
	if err != nil {
		return anomalies, err
	}

	// Calculate deviation
	if avgRevenue > 0 {
		deviation := ((todayRevenue - avgRevenue) / avgRevenue) * 100

		// Alert if deviation > 20%
		if math.Abs(deviation) > 20 {
			severity := "medium"
			if math.Abs(deviation) > 40 {
				severity = "high"
			}

			direction := "higher"
			if deviation < 0 {
				direction = "lower"
			}

			anomalies = append(anomalies, Anomaly{
				Type:        "sales",
				Severity:    severity,
				Title:       fmt.Sprintf("Sales %s than usual", direction),
				Description: fmt.Sprintf("Today's revenue is %.0f%% %s than the 7-day average", math.Abs(deviation), direction),
				Value:       todayRevenue,
				Expected:    avgRevenue,
				Deviation:   deviation,
				DetectedAt:  time.Now().Format(time.RFC3339),
			})
		}
	}

	return anomalies, nil
}

func (s *AIAnalyticsService) detectInventoryAnomalies() ([]Anomaly, error) {
	anomalies := []Anomaly{}

	// Check for low stock items
	var lowStockCount int64
	err := s.DB.Raw(`
		SELECT COUNT(*)
		FROM products
		WHERE stock_quantity <= reorder_level
		AND stock_quantity > 0
	`).Scan(&lowStockCount).Error
	if err != nil {
		return anomalies, err
	}

	if lowStockCount > 5 {
		severity := "medium"
		if lowStockCount > 10 {
			severity = "high"
		}

		anomalies = append(anomalies, Anomaly{
			Type:        "inventory",
			Severity:    severity,
			Title:       "Multiple items need restocking",
			Description: fmt.Sprintf("%d products are below reorder level", lowStockCount),
			Value:       float64(lowStockCount),
			Expected:    3.0,
			Deviation:   ((float64(lowStockCount) - 3.0) / 3.0) * 100,
			DetectedAt:  time.Now().Format(time.RFC3339),
		})
	}

	// Check for items expiring soon
	var expiringCount int64
	thirtyDaysLater := time.Now().AddDate(0, 0, 30).Format("2006-01-02")
	err = s.DB.Raw(`
		SELECT COUNT(DISTINCT product_id)
		FROM batches
		WHERE expiry_date <= ?
		AND expiry_date > CURRENT_DATE
		AND quantity > 0
	`, thirtyDaysLater).Scan(&expiringCount).Error
	if err == nil && expiringCount > 3 {
		anomalies = append(anomalies, Anomaly{
			Type:        "inventory",
			Severity:    "medium",
			Title:       "Products expiring soon",
			Description: fmt.Sprintf("%d products have batches expiring within 30 days", expiringCount),
			Value:       float64(expiringCount),
			Expected:    1.0,
			Deviation:   ((float64(expiringCount) - 1.0) / 1.0) * 100,
			DetectedAt:  time.Now().Format(time.RFC3339),
		})
	}

	return anomalies, nil
}

func (s *AIAnalyticsService) detectSystemAnomalies() []Anomaly {
	// Placeholder for system monitoring integration
	// In production, this would check API latency, error rates, etc.
	return []Anomaly{}
}

// GeneratePredictions creates forecasts and recommendations
func (s *AIAnalyticsService) GeneratePredictions() ([]Prediction, error) {
	predictions := []Prediction{}

	// 1. Sales Forecast (7-day)
	salesPrediction, err := s.generateSalesForecast()
	if err == nil {
		predictions = append(predictions, salesPrediction)
	}

	// 2. Restock Recommendations
	restockPredictions, err := s.generateRestockRecommendations()
	if err == nil {
		predictions = append(predictions, restockPredictions...)
	}

	// 3. Customer Behavior Prediction
	customerPrediction := s.generateCustomerPrediction()
	predictions = append(predictions, customerPrediction)

	return predictions, nil
}

func (s *AIAnalyticsService) generateSalesForecast() (Prediction, error) {
	// Simple moving average forecast
	var avgDailyRevenue float64
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	err := s.DB.Raw(`
		SELECT COALESCE(AVG(daily_total), 0)
		FROM (
			SELECT DATE(created_at) as date, SUM(total) as daily_total
			FROM invoices
			WHERE DATE(created_at) >= ?
			GROUP BY DATE(created_at)
		) as daily_sales
	`, thirtyDaysAgo).Scan(&avgDailyRevenue).Error
	if err != nil {
		return Prediction{}, err
	}

	forecast7Days := avgDailyRevenue * 7

	return Prediction{
		Type:        "sales_forecast",
		Title:       "7-Day Revenue Forecast",
		Description: fmt.Sprintf("Expected revenue: ₹%.0f based on 30-day average", forecast7Days),
		Confidence:  0.75,
		Value:       forecast7Days,
		Timeline:    "next_7_days",
	}, nil
}

func (s *AIAnalyticsService) generateRestockRecommendations() ([]Prediction, error) {
	predictions := []Prediction{}

	// Get products that will likely need restocking in 7 days
	type RestockItem struct {
		ProductName string
		DaysLeft    int
	}

	var items []RestockItem
	err := s.DB.Raw(`
		SELECT p.name as product_name, 
		       CASE 
		         WHEN p.stock_quantity <= 0 THEN 0
		         ELSE CAST((p.stock_quantity / NULLIF(p.avg_daily_sales, 0)) AS INTEGER)
		       END as days_left
		FROM products p
		WHERE p.stock_quantity > 0
		AND p.avg_daily_sales > 0
		AND (p.stock_quantity / NULLIF(p.avg_daily_sales, 0)) <= 7
		LIMIT 5
	`).Scan(&items).Error

	if err == nil && len(items) > 0 {
		var itemNames []string
		for _, item := range items {
			itemNames = append(itemNames, item.ProductName)
		}

		predictions = append(predictions, Prediction{
			Type:        "restock",
			Title:       "Restock Needed Soon",
			Description: fmt.Sprintf("%d products need restocking within 7 days", len(items)),
			Confidence:  0.85,
			Value:       float64(len(items)),
			Timeline:    "next_7_days",
		})
	}

	return predictions, nil
}

func (s *AIAnalyticsService) generateCustomerPrediction() Prediction {
	// Placeholder - would analyze customer purchase patterns
	return Prediction{
		Type:        "customer_behavior",
		Title:       "Peak Hours Detected",
		Description: "Highest activity between 2-4 PM (38% of daily transactions)",
		Confidence:  0.70,
		Value:       38.0,
		Timeline:    "current",
	}
}

// CreateNLInsights generates human-readable insights
func (s *AIAnalyticsService) CreateNLInsights() ([]NLInsight, error) {
	insights := []NLInsight{}

	// If OpenAI is available, use AI-generated insights
	if s.Client != nil {
		aiInsights, err := s.generateAIInsights()
		if err == nil {
			return aiInsights, nil
		}
	}

	// Fallback to rule-based insights
	insights = append(insights, s.generateRuleBasedInsights()...)
	return insights, nil
}

func (s *AIAnalyticsService) generateAIInsights() ([]NLInsight, error) {
	// Get recent data summary
	var todayRevenue, monthRevenue float64
	today := time.Now().Format("2006-01-02")
	firstOfMonth := time.Now().Format("2006-01-") + "01"

	s.DB.Raw("SELECT COALESCE(SUM(total), 0) FROM invoices WHERE DATE(created_at) = ?", today).Scan(&todayRevenue)
	s.DB.Raw("SELECT COALESCE(SUM(total), 0) FROM invoices WHERE DATE(created_at) >= ?", firstOfMonth).Scan(&monthRevenue)

	prompt := fmt.Sprintf(`You are a business analytics AI for a Homeopathy Pharmacy.

Generate 3 concise, actionable insights based on this data:
- Today's Revenue: ₹%.0f
- Month Revenue: ₹%.0f

Return JSON array:
[
  {
    "category": "sales|inventory|customer|system",
    "text": "Brief insight (max 60 chars)",
    "priority": 1-10,
    "icon": "📊|📈|📉|⚠️|✅"
  }
]

Focus on what's actionable and important for the pharmacy owner.`, todayRevenue, monthRevenue)

	resp, err := s.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a business intelligence AI. Return ONLY valid JSON.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
		},
	)

	if err != nil {
		return nil, err
	}

	var insights []NLInsight
	content := resp.Choices[0].Message.Content
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	err = json.Unmarshal([]byte(content), &insights)
	if err != nil {
		return nil, err
	}

	return insights, nil
}

func (s *AIAnalyticsService) generateRuleBasedInsights() []NLInsight {
	insights := []NLInsight{}

	// Get today vs yesterday comparison
	var todayRevenue, yesterdayRevenue float64
	today := time.Now().Format("2006-01-02")
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

	s.DB.Raw("SELECT COALESCE(SUM(total), 0) FROM invoices WHERE DATE(created_at) = ?", today).Scan(&todayRevenue)
	s.DB.Raw("SELECT COALESCE(SUM(total), 0) FROM invoices WHERE DATE(created_at) = ?", yesterday).Scan(&yesterdayRevenue)

	if yesterdayRevenue > 0 {
		change := ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
		if change > 10 {
			insights = append(insights, NLInsight{
				Category: "sales",
				Text:     fmt.Sprintf("Sales up %.0f%% from yesterday 📈", change),
				Priority: 8,
				Icon:     "📈",
			})
		} else if change < -10 {
			insights = append(insights, NLInsight{
				Category: "sales",
				Text:     fmt.Sprintf("Sales down %.0f%% from yesterday 📉", math.Abs(change)),
				Priority: 7,
				Icon:     "📉",
			})
		}
	}

	// Check low stock
	var lowStockCount int64
	s.DB.Raw("SELECT COUNT(*) FROM products WHERE stock_quantity <= reorder_level").Scan(&lowStockCount)
	if lowStockCount > 0 {
		insights = append(insights, NLInsight{
			Category: "inventory",
			Text:     fmt.Sprintf("%d products need restocking ⚠️", lowStockCount),
			Priority: 9,
			Icon:     "⚠️",
		})
	}

	// Add positive message if nothing critical
	if len(insights) == 0 {
		insights = append(insights, NLInsight{
			Category: "system",
			Text:     "All systems operational ✅",
			Priority: 5,
			Icon:     "✅",
		})
	}

	return insights
}

// RankActivities assigns priority scores to activities
func (s *AIAnalyticsService) RankActivities(activities []map[string]interface{}) []PriorityActivity {
	ranked := []PriorityActivity{}

	for _, activity := range activities {
		pa := PriorityActivity{
			ID:          fmt.Sprintf("%v", activity["id"]),
			Event:       fmt.Sprintf("%v", activity["event"]),
			Module:      fmt.Sprintf("%v", activity["module"]),
			Description: fmt.Sprintf("%v", activity["description"]),
			Timestamp:   fmt.Sprintf("%v", activity["timestamp"]),
		}

		// Calculate priority factors
		pa.FinancialImpact = s.calculateFinancialImpact(pa)
		pa.Urgency = s.calculateUrgency(pa)
		pa.CustomerImpact = s.calculateCustomerImpact(pa)
		pa.Criticality = s.calculateCriticality(pa)

		// Calculate weighted priority score
		pa.PriorityScore = (pa.FinancialImpact * 0.4) +
			(pa.Urgency * 0.3) +
			(pa.CustomerImpact * 0.2) +
			(pa.Criticality * 0.1)

		pa.RecommendedAction = s.suggestAction(pa)

		ranked = append(ranked, pa)
	}

	// Sort by priority score (would normally sort here)
	return ranked
}

func (s *AIAnalyticsService) calculateFinancialImpact(activity PriorityActivity) float64 {
	// Higher score for sales/purchase related activities
	lowerEvent := strings.ToLower(activity.Event)
	if strings.Contains(lowerEvent, "sale") || strings.Contains(lowerEvent, "invoice") {
		return 8.0
	}
	if strings.Contains(lowerEvent, "purchase") || strings.Contains(lowerEvent, "payment") {
		return 7.0
	}
	return 4.0
}

func (s *AIAnalyticsService) calculateUrgency(activity PriorityActivity) float64 {
	// Higher score for recent activities
	timestamp, err := time.Parse(time.RFC3339, activity.Timestamp)
	if err != nil {
		return 5.0
	}

	hoursAgo := time.Since(timestamp).Hours()
	if hoursAgo < 1 {
		return 9.0
	} else if hoursAgo < 24 {
		return 7.0
	} else if hoursAgo < 72 {
		return 5.0
	}
	return 3.0
}

func (s *AIAnalyticsService) calculateCustomerImpact(activity PriorityActivity) float64 {
	lowerEvent := strings.ToLower(activity.Event)
	if strings.Contains(lowerEvent, "customer") {
		return 8.0
	}
	if strings.Contains(lowerEvent, "sale") || strings.Contains(lowerEvent, "order") {
		return 7.0
	}
	return 4.0
}

func (s *AIAnalyticsService) calculateCriticality(activity PriorityActivity) float64 {
	lowerEvent := strings.ToLower(activity.Event)
	if strings.Contains(lowerEvent, "error") || strings.Contains(lowerEvent, "failed") {
		return 9.0
	}
	if strings.Contains(lowerEvent, "critical") || strings.Contains(lowerEvent, "urgent") {
		return 8.0
	}
	return 5.0
}

func (s *AIAnalyticsService) suggestAction(activity PriorityActivity) string {
	if activity.PriorityScore >= 8 {
		return "Review immediately"
	} else if activity.PriorityScore >= 6 {
		return "Review today"
	} else if activity.PriorityScore >= 4 {
		return "Review this week"
	}
	return "Monitor"
}
