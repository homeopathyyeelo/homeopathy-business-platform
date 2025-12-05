package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIReorderHandler struct {
	Service *services.AIReorderService
}

func NewAIReorderHandler(db *gorm.DB) *AIReorderHandler {
	return &AIReorderHandler{
		Service: services.NewAIReorderService(db),
	}
}

// GET /api/erp/purchases/ai-reorder/suggestions
func (h *AIReorderHandler) GetSuggestions(c *gin.Context) {
	suggestions, err := h.Service.GetReorderSuggestions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    suggestions,
		"count":   len(suggestions),
	})
}

// POST /api/erp/purchases/ai-reorder/generate
func (h *AIReorderHandler) GeneratePO(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
		VendorID  string `json:"vendor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	poNumber, err := h.Service.GeneratePOFromSuggestion(req.ProductID, req.Quantity, req.VendorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"message":   "Purchase order created successfully",
		"po_number": poNumber,
	})
}

// GET /api/erp/purchases/ai-reorder/stats
func (h *AIReorderHandler) GetStats(c *gin.Context) {
	// Get basic stats about suggestions
	suggestions, err := h.Service.GetReorderSuggestions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	highPriority := 0
	mediumPriority := 0
	lowPriority := 0
	totalEstimatedCost := 0.0

	for _, s := range suggestions {
		switch s.Priority {
		case "HIGH":
			highPriority++
		case "MEDIUM":
			mediumPriority++
		case "LOW":
			lowPriority++
		}
		totalEstimatedCost += s.EstimatedCost
	}

	stats := map[string]interface{}{
		"total_suggestions":     len(suggestions),
		"high_priority_items":   highPriority,
		"medium_priority_items": mediumPriority,
		"low_priority_items":    lowPriority,
		"total_estimated_cost":  totalEstimatedCost,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
