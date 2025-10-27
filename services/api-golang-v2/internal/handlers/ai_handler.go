package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// AIRecommendationRequest represents request for AI recommendations
type AIRecommendationRequest struct {
	ProductID  string `json:"product_id" binding:"required"`
	CustomerID string `json:"customer_id"`
	Limit      int    `json:"limit" default:"5"`
}

// AIDemandForecastRequest represents request for demand forecasting
type AIDemandForecastRequest struct {
	ProductIDs []string `json:"product_ids" binding:"required"`
	Months     int      `json:"months_ahead" default:"1"`
}

// AICustomerSegmentationRequest represents request for customer segmentation
type AICustomerSegmentationRequest struct {
	CustomerID      string `json:"customer_id" binding:"required"`
	IncludeFeatures bool   `json:"include_features" default:"false"`
}

// AIInventoryOptimizationRequest represents request for inventory optimization
type AIInventoryOptimizationRequest struct {
	ProductIDs         []string `json:"product_ids" binding:"required"`
	OptimizationType   string   `json:"optimization_type" default:"both"`
}

// AI service configuration
const aiServiceURL = "http://localhost:8005"

// callAIService makes HTTP request to Python AI service
func callAIService(endpoint string, payload interface{}) (map[string]interface{}, error) {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	url := fmt.Sprintf("%s%s", aiServiceURL, endpoint)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to call AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode AI service response: %w", err)
	}

	return result, nil
}

// GetAIProductRecommendations returns AI-powered product recommendations
func (h *ProductHandler) GetAIProductRecommendations(c *gin.Context) {
	var req AIRecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/recommendations/product"
	payload := map[string]interface{}{
		"product_id": req.ProductID,
		"customer_id": req.CustomerID,
		"top_n": req.Limit,
		"recommendation_type": "hybrid",
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIDemandForecast returns AI-powered demand forecasting
func (h *InventoryHandler) GetAIDemandForecast(c *gin.Context) {
	var req AIDemandForecastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/forecast/demand"
	payload := map[string]interface{}{
		"product_ids": req.ProductIDs,
		"months_ahead": req.Months,
		"include_confidence": true,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"forecasts": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAICustomerSegmentation returns AI-powered customer segmentation
func (h *CustomerHandler) GetAICustomerSegmentation(c *gin.Context) {
	var req AICustomerSegmentationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/segmentation/customer"
	payload := map[string]interface{}{
		"customer_id": req.CustomerID,
		"include_features": req.IncludeFeatures,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"segment": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIInventoryOptimization returns AI-powered inventory optimization
func (h *InventoryHandler) GetAIInventoryOptimization(c *gin.Context) {
	var req AIInventoryOptimizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/optimization/inventory"
	payload := map[string]interface{}{
		"product_ids": req.ProductIDs,
		"optimization_type": req.OptimizationType,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"optimization": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIBusinessInsights returns AI-powered business insights
func (h *DashboardHandler) GetAIBusinessInsights(c *gin.Context) {
	// Call AI service for business insights
	endpoint := "/v2/analytics/business-insights"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"insights": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIModelStatus returns current status of AI models
func (h *AIHandler) GetAIModelStatus(c *gin.Context) {
	// Call AI service for model status
	endpoint := "/v2/models/status"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"model_status": aiResponse,
		"generated_at": time.Now(),
	})
}

// TrainAIModels triggers training of AI models
func (h *AIHandler) TrainAIModels(c *gin.Context) {
	// Call AI service to trigger model training
	endpoint := "/v2/models/train"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"training_status": aiResponse,
		"generated_at": time.Now(),
	})
}

// PrepareAIData triggers data preparation for AI training
func (h *AIHandler) PrepareAIData(c *gin.Context) {
	// Call AI service to trigger data preparation
	endpoint := "/v2/data/prepare"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data_status": aiResponse,
		"generated_at": time.Now(),
	})
}
