package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIFinanceHandler struct {
	Service *services.AIExpenseService
}

func NewAIFinanceHandler(db *gorm.DB) *AIFinanceHandler {
	return &AIFinanceHandler{
		Service: services.NewAIExpenseService(db),
	}
}

// POST /api/ai/finance/categorize
func (h *AIFinanceHandler) CategorizeExpense(c *gin.Context) {
	var req struct {
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	category, err := h.Service.CategorizeExpense(req.Description, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    category,
	})
}
