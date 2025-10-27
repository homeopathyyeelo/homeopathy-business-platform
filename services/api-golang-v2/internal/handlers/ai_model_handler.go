package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type AIModelHandler struct {
	aiModelService *services.AIModelService
}

func NewAIModelHandler() *AIModelHandler {
	return &AIModelHandler{
		aiModelService: services.NewAIModelService(),
	}
}

// ListAIModels returns paginated list of AI models
func (h *AIModelHandler) ListAIModels(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	modelType := c.Query("modelType")

	aiModels, total, err := h.aiModelService.ListAIModels(page, limit, search, modelType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch AI models"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"aiModels": aiModels,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetAIModel returns a single AI model by ID
func (h *AIModelHandler) GetAIModel(c *gin.Context) {
	id := c.Param("id")
	aiModel, err := h.aiModelService.GetAIModelByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "AI model not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": aiModel})
}

// CreateAIModel creates a new AI model
func (h *AIModelHandler) CreateAIModel(c *gin.Context) {
	var aiModel models.AIModel
	if err := c.ShouldBindJSON(&aiModel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.aiModelService.CreateAIModel(&aiModel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create AI model"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": aiModel})
}

// UpdateAIModel updates an existing AI model
func (h *AIModelHandler) UpdateAIModel(c *gin.Context) {
	id := c.Param("id")
	var updates models.AIModel
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.aiModelService.UpdateAIModel(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update AI model"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI model updated successfully"})
}

// DeleteAIModel deletes an AI model
func (h *AIModelHandler) DeleteAIModel(c *gin.Context) {
	id := c.Param("id")
	if err := h.aiModelService.DeleteAIModel(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete AI model"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI model deleted successfully"})
}

// ToggleAIModel toggles AI model active status
func (h *AIModelHandler) ToggleAIModel(c *gin.Context) {
	id := c.Param("id")
	if err := h.aiModelService.ToggleAIModel(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle AI model"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI model toggled successfully"})
}

// GetAIChatbotResponse returns AI-powered chatbot response
func (h *AIModelHandler) GetAIChatbotResponse(c *gin.Context) {
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

// GetAIModelStatus returns current status of AI models
func (h *AIModelHandler) GetAIModelStatus(c *gin.Context) {
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
func (h *AIModelHandler) TrainAIModels(c *gin.Context) {
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
func (h *AIModelHandler) PrepareAIData(c *gin.Context) {
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
