package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIManufacturingHandler struct {
	Service *services.AIManufacturingService
}

func NewAIManufacturingHandler(db *gorm.DB) *AIManufacturingHandler {
	return &AIManufacturingHandler{
		Service: services.NewAIManufacturingService(db),
	}
}

// POST /api/ai/manufacturing/optimize
func (h *AIManufacturingHandler) OptimizeProduction(c *gin.Context) {
	var req struct {
		ProductID      string `json:"product_id"`
		TargetQuantity int    `json:"target_quantity"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	optimization, err := h.Service.OptimizeProduction(req.ProductID, req.TargetQuantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    optimization,
	})
}
