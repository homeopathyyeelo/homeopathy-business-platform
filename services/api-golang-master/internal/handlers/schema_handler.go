package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"gorm.io/gorm"
)

type SchemaHandler struct {
	Auditor *database.SchemaAuditor
}

func NewSchemaHandler(db *gorm.DB) *SchemaHandler {
	return &SchemaHandler{
		Auditor: database.NewSchemaAuditor(db),
	}
}

// AuditSchema - GET /api/v1/schema/audit
func (h *SchemaHandler) AuditSchema(c *gin.Context) {
	missingByModule, err := h.Auditor.AuditSchema()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	totalMissing := 0
	for _, tables := range missingByModule {
		totalMissing += len(tables)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"totalMissing": totalMissing,
		"missingByModule": missingByModule,
	})
}

// CreateMissingTables - POST /api/v1/schema/migrate
func (h *SchemaHandler) CreateMissingTables(c *gin.Context) {
	var req struct {
		DryRun bool `json:"dryRun"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		req.DryRun = false // Default to actual execution
	}

	executed, err := h.Auditor.CreateMissingTables(req.DryRun)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
			"executed": executed,
		})
		return
	}

	message := "Tables created successfully"
	if req.DryRun {
		message = "Dry run completed - no tables were created"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": message,
		"created": executed,
		"count":   len(executed),
	})
}

// GetExistingTables - GET /api/v1/schema/tables
func (h *SchemaHandler) GetExistingTables(c *gin.Context) {
	tables, err := h.Auditor.GetExistingTables()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"tables":  tables,
		"count":   len(tables),
	})
}
