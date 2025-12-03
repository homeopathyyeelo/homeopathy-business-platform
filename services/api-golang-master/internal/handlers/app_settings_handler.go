package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AppSettingsHandler struct {
	db *gorm.DB
}

func NewAppSettingsHandler(db *gorm.DB) *AppSettingsHandler {
	return &AppSettingsHandler{db: db}
}

// AppSetting model
type AppSetting struct {
	ID          string          `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Key         string          `json:"key" gorm:"uniqueIndex;not null;size:200"`
	Category    string          `json:"category" gorm:"not null;size:100"`
	Type        string          `json:"type" gorm:"not null;size:50"` // string, number, boolean, json
	Value       json.RawMessage `json:"value" gorm:"type:jsonb;not null"`
	Description string          `json:"description" gorm:"size:500"`
	IsSecret    bool            `json:"is_secret" gorm:"default:false"`
	IsActive    bool            `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func (AppSetting) TableName() string {
	return "app_settings"
}

// GetAllSettings - GET /api/settings
func (h *AppSettingsHandler) GetAllSettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var settings []AppSetting
	category := c.Query("category")

	query := h.db.WithContext(ctx).Where("is_active = ?", true)

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Order("category, key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	// Mask secret values
	for i := range settings {
		if settings[i].IsSecret {
			settings[i].Value = json.RawMessage(`"***MASKED***"`)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

// GetSettingsByCategory - GET /api/settings/category/:category
func (h *AppSettingsHandler) GetSettingsByCategory(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	category := c.Param("category")
	var settings []AppSetting

	if err := h.db.WithContext(ctx).
		Where("category = ? AND is_active = ?", category, true).
		Order("key").
		Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	// Mask secret values
	for i := range settings {
		if settings[i].IsSecret {
			settings[i].Value = json.RawMessage(`"***MASKED***"`)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

// GetSetting - GET /api/settings/:key
func (h *AppSettingsHandler) GetSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	key := c.Param("key")
	// Replace dots with slashes in URL, then convert back
	key = strings.ReplaceAll(key, "/", ".")

	var setting AppSetting
	if err := h.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch setting"})
		return
	}

	// Mask secret values
	if setting.IsSecret {
		setting.Value = json.RawMessage(`"***MASKED***"`)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    setting,
	})
}

// UpsertSetting - PUT /api/settings/:key
func (h *AppSettingsHandler) UpsertSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	key := c.Param("key")
	key = strings.ReplaceAll(key, "/", ".")

	var req struct {
		Value       interface{} `json:"value" binding:"required"`
		Category    string      `json:"category"`
		Type        string      `json:"type"`
		Description string      `json:"description"`
		IsSecret    bool        `json:"is_secret"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert value to JSONB
	valueBytes, err := json.Marshal(req.Value)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid value format"})
		return
	}

	var setting AppSetting
	err = h.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error

	if err == gorm.ErrRecordNotFound {
		// Create new setting
		if req.Category == "" || req.Type == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "category and type required for new settings"})
			return
		}

		setting = AppSetting{
			Key:         key,
			Category:    req.Category,
			Type:        req.Type,
			Value:       valueBytes,
			Description: req.Description,
			IsSecret:    req.IsSecret,
			IsActive:    true,
		}

		if err := h.db.WithContext(ctx).Create(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create setting"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch setting"})
		return
	} else {
		// Update existing setting
		setting.Value = valueBytes
		if req.Description != "" {
			setting.Description = req.Description
		}

		if err := h.db.WithContext(ctx).Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    setting,
		"message": "Setting saved successfully",
	})
}

// BulkUpsertSettings - POST /api/settings/bulk
func (h *AppSettingsHandler) BulkUpsertSettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	var req struct {
		Settings []struct {
			Key         string      `json:"key" binding:"required"`
			Value       interface{} `json:"value" binding:"required"`
			Category    string      `json:"category"`
			Type        string      `json:"type"`
			Description string      `json:"description"`
			IsSecret    bool        `json:"is_secret"`
		} `json:"settings" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var updated []AppSetting
	for _, item := range req.Settings {
		// Convert value to JSONB
		valueBytes, err := json.Marshal(item.Value)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid value format for " + item.Key})
			return
		}

		var setting AppSetting
		err = tx.Where("key = ?", item.Key).First(&setting).Error

		if err == gorm.ErrRecordNotFound {
			// Create new
			if item.Category == "" || item.Type == "" {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "category and type required for " + item.Key})
				return
			}

			setting = AppSetting{
				Key:         item.Key,
				Category:    item.Category,
				Type:        item.Type,
				Value:       valueBytes,
				Description: item.Description,
				IsSecret:    item.IsSecret,
				IsActive:    true,
			}

			if err := tx.Create(&setting).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create " + item.Key})
				return
			}
		} else if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch " + item.Key})
			return
		} else {
			// Update existing
			setting.Value = valueBytes
			if item.Description != "" {
				setting.Description = item.Description
			}

			if err := tx.Save(&setting).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update " + item.Key})
				return
			}
		}

		updated = append(updated, setting)
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    updated,
		"message": "Settings saved successfully",
		"count":   len(updated),
	})
}

// DeleteSetting - DELETE /api/settings/:key
func (h *AppSettingsHandler) DeleteSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	key := c.Param("key")
	key = strings.ReplaceAll(key, "/", ".")

	var setting AppSetting
	if err := h.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch setting"})
		return
	}

	// Soft delete by setting is_active = false
	setting.IsActive = false
	if err := h.db.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Setting deleted successfully",
	})
}

// GetCategories - GET /api/settings/categories
func (h *AppSettingsHandler) GetCategories(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var categories []struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	if err := h.db.WithContext(ctx).
		Model(&AppSetting{}).
		Select("category, COUNT(*) as count").
		Where("is_active = ?", true).
		Group("category").
		Order("category").
		Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    categories,
	})
}
