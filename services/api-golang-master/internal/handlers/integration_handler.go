package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type IntegrationSetting struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Provider  string    `json:"provider" gorm:"size:100;not null"`
	APIKey    string    `json:"api_key" gorm:"size:500"`
	Meta      string    `json:"meta" gorm:"type:jsonb"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (IntegrationSetting) TableName() string { return "integration_settings" }

type IntegrationHandler struct { db *gorm.DB }

func NewIntegrationHandler(db *gorm.DB) *IntegrationHandler { return &IntegrationHandler{db: db} }

func (h *IntegrationHandler) GetIntegrations(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []IntegrationSetting
	var total int64
	q := h.db.WithContext(ctx).Model(&IntegrationSetting{})
	if search := c.Query("search"); search != "" {
		q = q.Where("provider ILIKE ?", "%"+search+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err := q.Limit(limit).Offset(offset).Order("provider").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

func (h *IntegrationHandler) GetIntegration(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item IntegrationSetting
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *IntegrationHandler) CreateIntegration(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item IntegrationSetting
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.IsActive = true
	if err := h.db.WithContext(ctx).Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h *IntegrationHandler) UpdateIntegration(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item IntegrationSetting
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	var payload IntegrationSetting
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.Provider = payload.Provider
	item.APIKey = payload.APIKey
	item.Meta = payload.Meta
	if err := h.db.WithContext(ctx).Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *IntegrationHandler) DeleteIntegration(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	if err := h.db.WithContext(ctx).Model(&IntegrationSetting{}).Where("id = ?", c.Param("id")).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
