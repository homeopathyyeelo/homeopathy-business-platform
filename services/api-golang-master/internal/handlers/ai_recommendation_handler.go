package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

// AIRecommendationHandler handles AI recommendation endpoints
type AIRecommendationHandler struct {
	service *services.AIRecommendationService
}

// NewAIRecommendationHandler creates a new AI recommendation handler
func NewAIRecommendationHandler(db *gorm.DB) *AIRecommendationHandler {
	return &AIRecommendationHandler{
		service: services.NewAIRecommendationService(db),
	}
}

// GetProductRecommendations returns AI-powered product recommendations
// @Summary Get product recommendations
// @Description Get AI-powered product recommendations based on cart items
// @Tags AI
// @Accept json
// @Produce json
// @Param productIds query string true "Comma-separated product IDs"
// @Param limit query int false "Number of recommendations (default 6)"
// @Success 200 {object} map[string]interface{}
// @Router /api/ai/recommendations [get]
func (h *AIRecommendationHandler) GetProductRecommendations(c *gin.Context) {
	// Get product IDs from query params
	productIDsStr := c.Query("productIds")
	if productIDsStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "productIds parameter is required"})
		return
	}

	// Parse comma-separated IDs
	productIDs := parseCommaSeparatedIDs(productIDsStr)

	// Get limit (default 6)
	limit := 6
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := parseIntParam(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get recommendations
	recommendations, err := h.service.GetRecommendations(productIDs, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    recommendations,
		"count":   len(recommendations),
	})
}

// Helper functions
func parseCommaSeparatedIDs(str string) []string {
	if str == "" {
		return []string{}
	}

	ids := []string{}
	for _, id := range splitByComma(str) {
		trimmed := trimSpace(id)
		if trimmed != "" {
			ids = append(ids, trimmed)
		}
	}
	return ids
}

func splitByComma(s string) []string {
	result := []string{}
	current := ""
	for _, char := range s {
		if char == ',' {
			result = append(result, current)
			current = ""
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)

	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n') {
		start++
	}

	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n') {
		end--
	}

	return s[start:end]
}

func parseIntParam(s string) (int, error) {
	result := 0
	for _, char := range s {
		if char < '0' || char > '9' {
			return 0, http.ErrAbortHandler
		}
		result = result*10 + int(char-'0')
	}
	return result, nil
}
