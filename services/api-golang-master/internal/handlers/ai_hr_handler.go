package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type AIHRHandler struct {
	Service *services.AIHRService
}

func NewAIHRHandler(db *gorm.DB) *AIHRHandler {
	return &AIHRHandler{
		Service: services.NewAIHRService(db),
	}
}

// POST /api/ai/hr/attrition-predict
func (h *AIHRHandler) PredictAttrition(c *gin.Context) {
	var req struct {
		EmployeeID string `json:"employee_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	prediction, err := h.Service.PredictAttrition(req.EmployeeID)
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

// POST /api/ai/hr/resume-screen
func (h *AIHRHandler) ScreenResume(c *gin.Context) {
	var req struct {
		ResumeText     string `json:"resume_text"`
		JobDescription string `json:"job_description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	screening, err := h.Service.ScreenResume(req.ResumeText, req.JobDescription)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    screening,
	})
}
