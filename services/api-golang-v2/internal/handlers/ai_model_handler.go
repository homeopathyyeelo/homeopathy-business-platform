package handlers

import (
	"net/http"
	"strconv"
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
