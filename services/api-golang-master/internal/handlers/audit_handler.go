package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/middleware"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type AuditHandler struct {
	DB *gorm.DB
}

func NewAuditHandler(db *gorm.DB) *AuditHandler {
	return &AuditHandler{DB: db}
}

// GetAuditLogs returns a list of audit logs
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	// Check permission
	if !middleware.HasPermission(c, "SOCIAL_GMB_AUDIT") {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "You don't have permission to view audit logs",
		})
		return
	}

	limit := 50

	var logs []models.GMBAuditLog
	query := h.DB.Order("created_at DESC").Limit(limit)

	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}

	if entityType := c.Query("entity_type"); entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}

	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": logs})
}
