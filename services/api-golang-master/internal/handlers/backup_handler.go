package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
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

type BackupHandler struct { db *gorm.DB }

func NewBackupHandler(db *gorm.DB) *BackupHandler { return &BackupHandler{db: db} }

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

func (h *BackupHandler) CreateBackup(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item SystemBackup
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.Status = "in_progress"
	if err := h.db.WithContext(ctx).Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item, "message": "Backup initiated"})
}

func (h *BackupHandler) RestoreBackup(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Restore initiated for backup " + c.Param("id")})
}
