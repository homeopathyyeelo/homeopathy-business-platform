package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIInsightsHandler struct {
	DB               *gorm.DB
	AnalyticsService *services.AIAnalyticsService
}

func NewAIInsightsHandler(db *gorm.DB, analyticsService *services.AIAnalyticsService) *AIInsightsHandler {
	return &AIInsightsHandler{
		DB:               db,
		AnalyticsService: analyticsService,
	}
}

// GetInsights returns all AI insights (anomalies, predictions, NL insights)
func (h *AIInsightsHandler) GetInsights(c *gin.Context) {
	// Detect anomalies
	anomalies, err := h.AnalyticsService.DetectAnomalies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to detect anomalies: " + err.Error()})
		return
	}

	// Generate predictions
	predictions, err := h.AnalyticsService.GeneratePredictions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate predictions: " + err.Error()})
		return
	}

	// Create NL insights
	insights, err := h.AnalyticsService.CreateNLInsights()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create insights: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"anomalies":   anomalies,
		"predictions": predictions,
		"insights":    insights,
	})
}

// GetAnomalies returns detected anomalies only
func (h *AIInsightsHandler) GetAnomalies(c *gin.Context) {
	anomalies, err := h.AnalyticsService.DetectAnomalies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    anomalies,
	})
}

// GetPredictions returns predictions and forecasts
func (h *AIInsightsHandler) GetPredictions(c *gin.Context) {
	predictions, err := h.AnalyticsService.GeneratePredictions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    predictions,
	})
}

// GetNLInsights returns natural language insights
func (h *AIInsightsHandler) GetNLInsights(c *gin.Context) {
	insights, err := h.AnalyticsService.CreateNLInsights()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    insights,
	})
}

// GetPriorities returns prioritized activities
func (h *AIInsightsHandler) GetPriorities(c *gin.Context) {
	// Get recent activities from database
	type Activity struct {
		ID          string
		Action      string
		Module      string
		Description string
		Timestamp   string
	}

	var activities []Activity
	err := h.DB.Raw(`
		SELECT 
			id::text,
			action,
			module,
			description,
			created_at::text as timestamp
		FROM audit_logs
		ORDER BY created_at DESC
		LIMIT 20
	`).Scan(&activities).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to map interface for ranking
	activityMaps := []map[string]interface{}{}
	for _, act := range activities {
		activityMaps = append(activityMaps, map[string]interface{}{
			"id":          act.ID,
			"event":       act.Action,
			"module":      act.Module,
			"description": act.Description,
			"timestamp":   act.Timestamp,
		})
	}

	// Rank activities
	rankedActivities := h.AnalyticsService.RankActivities(activityMaps)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rankedActivities,
	})
}
