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

// AIFraudCheckRequest represents request for fraud detection
type AIFraudCheckRequest struct {
	TransactionID   string            `json:"transaction_id" binding:"required"`
	UserID          string            `json:"user_id" binding:"required"`
	Amount          float64           `json:"amount" binding:"required"`
	PaymentMethod   string            `json:"payment_method" binding:"required"`
	UserBehavior    map[string]interface{} `json:"user_behavior"`
}

// AIBatchRecommendationRequest represents request for batch recommendations
type AIBatchRecommendationRequest struct {
	CustomerIDs []string `json:"customer_ids" binding:"required"`
	Limit       int      `json:"limit" default:"10"`
}

// GetAIFraudDetection checks transaction for fraud patterns
func (h *PaymentHandler) GetAIFraudDetection(c *gin.Context) {
	var req AIFraudCheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for fraud detection
	endpoint := "/v2/fraud/check"
	payload := map[string]interface{}{
		"transaction_id": req.TransactionID,
		"user_id": req.UserID,
		"amount": req.Amount,
		"payment_method": req.PaymentMethod,
		"user_behavior": req.UserBehavior,
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
		"fraud_analysis": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIBatchRecommendations returns recommendations for multiple customers
func (h *CustomerHandler) GetAIBatchRecommendations(c *gin.Context) {
	var req AIBatchRecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for batch recommendations
	endpoint := "/v2/recommendations/batch"
	payload := map[string]interface{}{
		"customer_ids": req.CustomerIDs,
		"limit": req.Limit,
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
		"batch_recommendations": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIChatbotResponse returns AI-powered chatbot response
func (h *AIHandler) GetAIChatbotResponse(c *gin.Context) {
	var req struct {
		UserID  string `json:"user_id" binding:"required"`
		Message string `json:"message" binding:"required"`
		Context map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for chatbot response
	endpoint := "/v2/chatbot"
	payload := map[string]interface{}{
		"user_id": req.UserID,
		"message": req.Message,
		"context": req.Context,
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
		"chat_response": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIProductRecommendationsByCustomer returns personalized recommendations for a customer
func (h *ProductHandler) GetAIProductRecommendationsByCustomer(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Customer ID is required",
		})
		return
	}

	// Get customer's recent purchase history
	var recentProducts []string
	// This would query the database for customer's recent purchases

	// Call AI service with customer context
	endpoint := "/v2/recommendations/customer"
	payload := map[string]interface{}{
		"customer_id": customerID,
		"recent_products": recentProducts,
		"limit": 10,
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
		"recommendations": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIInventoryAlerts returns AI-powered inventory alerts
func (h *InventoryHandler) GetAIInventoryAlerts(c *gin.Context) {
	// Call AI service for inventory insights
	endpoint := "/v2/analytics/inventory"
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
		"inventory_insights": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAICustomerInsights returns AI-powered customer insights
func (h *CustomerHandler) GetAICustomerInsights(c *gin.Context) {
	// Call AI service for customer analytics
	endpoint := "/v2/analytics/customers"
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
		"customer_insights": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAISalesForecast returns AI-powered sales forecasting
func (h *SalesHandler) GetAISalesForecast(c *gin.Context) {
	var req struct {
		ProductIDs []string `json:"product_ids"`
		Months     int      `json:"months_ahead" default:"3"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service for sales forecasting
	endpoint := "/v2/forecast/sales"
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
		"sales_forecast": aiResponse,
		"generated_at": time.Now(),
	})
}
