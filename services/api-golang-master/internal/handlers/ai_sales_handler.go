package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AISalesHandler struct {
	Service *services.AISalesService
}

func NewAISalesHandler(db *gorm.DB) *AISalesHandler {
	return &AISalesHandler{
		Service: services.NewAISalesService(db),
	}
}

// POST /api/ai/sales/forecast
func (h *AISalesHandler) GetForecast(c *gin.Context) {
	var req struct {
		Days int `json:"days"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// Default to 30 days if not provided or invalid
		req.Days = 30
	}

	if req.Days <= 0 {
		req.Days = 30
	}

	forecast, err := h.Service.GenerateSalesForecast(req.Days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    forecast,
	})
}
