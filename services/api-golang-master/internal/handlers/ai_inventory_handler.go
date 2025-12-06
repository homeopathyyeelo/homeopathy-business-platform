package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIInventoryHandler struct {
	Service *services.AIInventoryService
}

func NewAIInventoryHandler(db *gorm.DB) *AIInventoryHandler {
	return &AIInventoryHandler{
		Service: services.NewAIInventoryService(db),
	}
}

// GET /api/ai/inventory/demand-forecast
func (h *AIInventoryHandler) GetDemandForecast(c *gin.Context) {
	forecasts, err := h.Service.ForecastDemand()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    forecasts,
	})
}
