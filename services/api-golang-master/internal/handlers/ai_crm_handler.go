package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AICRMHandler struct {
	Service *services.AICRMService
}

func NewAICRMHandler(db *gorm.DB) *AICRMHandler {
	return &AICRMHandler{
		Service: services.NewAICRMService(db),
	}
}

// POST /api/ai/crm/clv-predict
func (h *AICRMHandler) PredictCLV(c *gin.Context) {
	var req struct {
		CustomerID string `json:"customer_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	prediction, err := h.Service.PredictCLV(req.CustomerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    prediction,
	})
}

// POST /api/ai/crm/sentiment-analyze
func (h *AICRMHandler) AnalyzeSentiment(c *gin.Context) {
	var req struct {
		Text string `json:"text"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	analysis, err := h.Service.AnalyzeSentiment(req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analysis,
	})
}
