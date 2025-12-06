package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIEmailHandler struct {
	Service *services.AIEmailService
}

func NewAIEmailHandler(db *gorm.DB) *AIEmailHandler {
	return &AIEmailHandler{
		Service: services.NewAIEmailService(db),
	}
}

// POST /api/ai/marketing/email-generate
func (h *AIEmailHandler) GenerateEmail(c *gin.Context) {
	var req struct {
		CustomerName string   `json:"customer_name"`
		Purpose      string   `json:"purpose"`
		Tone         string   `json:"tone"`
		KeyPoints    []string `json:"key_points"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	draft, err := h.Service.GenerateEmail(req.CustomerName, req.Purpose, req.Tone, req.KeyPoints)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    draft,
	})
}
