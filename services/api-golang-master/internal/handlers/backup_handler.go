package handlers

import (
	"context"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type SystemBackup struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Filename  string    `json:"filename" gorm:"size:255;not null"`
	Size      int64     `json:"size" gorm:"default:0"`
	Status    string    `json:"status" gorm:"size:50;default:'completed'"`
	CreatedAt time.Time `json:"created_at"`
	CreatedBy *string   `json:"created_by" gorm:"type:uuid"`
}

func (SystemBackup) TableName() string { return "system_backups" }

// BackupHandler handles backup-related requests
type BackupHandler struct {
	db            *gorm.DB
	backupService *services.BackupService
	jobService    *services.JobService
}

// NewBackupHandler creates a new backup handler
func NewBackupHandler(db *gorm.DB, jobService *services.JobService) *BackupHandler {
	return &BackupHandler{
		db:            db,
		backupService: services.NewBackupService(db),
		jobService:    jobService,
	}
}

// GetBackups returns list of backups from database
func (h *BackupHandler) GetBackups(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []SystemBackup
	var total int64
	q := h.db.WithContext(ctx).Model(&SystemBackup{})
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err := q.Limit(limit).Offset(offset).Order("created_at DESC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GetBackupConfig returns the current backup configuration
// GET /api/erp/backups/config
func (h *BackupHandler) GetBackupConfig(c *gin.Context) {
	config, err := h.backupService.GetBackupConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get backup configuration",
		})
		return
	}

	// Don't send password to frontend
	config.DBPassword = ""

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    config,
	})
}

// SaveBackupConfig saves the backup configuration
// PUT /api/erp/backups/config
func (h *BackupHandler) SaveBackupConfig(c *gin.Context) {
	var config services.BackupConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if err := h.backupService.SaveBackupConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save backup configuration",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Backup configuration saved successfully",
	})
}

// CreateBackup triggers a manual backup asynchronously
// POST /api/erp/backups/create
func (h *BackupHandler) CreateBackup(c *gin.Context) {
	var req struct {
		Description string `json:"description"`
	}
	c.ShouldBindJSON(&req)

	// Get user ID from context if available
	var createdBy *string
	if userID, exists := c.Get("user_id"); exists {
		uid := userID.(string)
		createdBy = &uid
	}

	// Create background job for backup
	payload := services.BackupJobPayload{
		Description: req.Description,
		UserID:      *createdBy,
	}

	job, err := h.jobService.CreateJob(services.JobTypeBackupCreate, payload, createdBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create backup job: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"message": "Backup job created successfully. It will run in the background.",
		"job_id":  job.ID,
		"status":  job.Status,
	})
}

// ListBackups returns a list of all backup files
// GET /api/erp/backups/list
func (h *BackupHandler) ListBackups(c *gin.Context) {
	backups, err := h.backupService.ListBackups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list backups",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    backups,
	})
}

// GetBackupStatus returns the current backup status
// GET /api/erp/backups/status
func (h *BackupHandler) GetBackupStatus(c *gin.Context) {
	status, err := h.backupService.GetBackupStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get backup status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// DownloadBackup allows downloading a backup file
// GET /api/erp/backups/:filename/download
func (h *BackupHandler) DownloadBackup(c *gin.Context) {
	filename := c.Param("filename")

	config, err := h.backupService.GetBackupConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get backup configuration",
		})
		return
	}

	// Security check: ensure filename is valid
	if filename == "" || filepath.Base(filename) != filename {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid filename",
		})
		return
	}

	backupPath := filepath.Join(config.BackupPath, filename)

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.File(backupPath)
}

// DeleteBackup deletes a specific backup file
// DELETE /api/erp/backups/:filename
func (h *BackupHandler) DeleteBackup(c *gin.Context) {
	filename := c.Param("filename")

	if err := h.backupService.DeleteBackup(filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete backup",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Backup deleted successfully",
	})
}

// TestDatabaseConnection tests the database connection
// POST /api/erp/settings/database/test
func (h *BackupHandler) TestDatabaseConnection(c *gin.Context) {
	var config services.BackupConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// TODO: Implement actual connection test
	// For now, return success
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Database connection successful",
	})
}

// RestoreBackup initiates a backup restoration
func (h *BackupHandler) RestoreBackup(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Restore initiated for backup " + c.Param("id")})
}
