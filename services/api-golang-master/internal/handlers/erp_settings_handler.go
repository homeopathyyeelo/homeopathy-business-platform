package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ERPSetting struct {
	ID           string `gorm:"type:uuid;primaryKey" json:"id"`
	SettingKey   string `gorm:"uniqueIndex;size:100;not null;column:setting_key" json:"settingKey"`
	SettingValue string `gorm:"type:text;not null;column:setting_value" json:"settingValue"`
	SettingType  string `gorm:"size:20;default:'string';column:setting_type" json:"settingType"`
	Category     string `gorm:"index;size:50;not null" json:"category"`
	Label        string `gorm:"size:255;not null" json:"label"`
	Description  string `gorm:"type:text;column:description" json:"description"`
	IsEditable   bool   `gorm:"default:true;column:is_editable" json:"isEditable"`
	CreatedAt    string `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    string `gorm:"column:updated_at" json:"updatedAt"`
}

func (ERPSetting) TableName() string {
	return "erp_settings"
}

type ERPSettingsHandler struct {
	db *gorm.DB
}

func NewERPSettingsHandler(db *gorm.DB) *ERPSettingsHandler {
	return &ERPSettingsHandler{db: db}
}

// GET /api/erp/settings - Get all settings
func (h *ERPSettingsHandler) GetSettings(c *gin.Context) {
	category := c.Query("category")

	var settings []ERPSetting
	query := h.db.Model(&ERPSetting{})

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Order("category, setting_key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

// GET /api/erp/settings/:key - Get single setting by key
func (h *ERPSettingsHandler) GetSetting(c *gin.Context) {
	key := c.Param("key")

	var setting ERPSetting
	if err := h.db.Where("setting_key = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    setting,
	})
}

// PUT /api/erp/settings/:key - Update setting value
func (h *ERPSettingsHandler) UpdateSetting(c *gin.Context) {
	key := c.Param("key")

	var req struct {
		SettingValue string `json:"settingValue" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if setting exists and is editable
	var setting ERPSetting
	if err := h.db.Where("setting_key = ?", key).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	if !setting.IsEditable {
		c.JSON(http.StatusForbidden, gin.H{"error": "This setting is not editable"})
		return
	}

	// Validate value based on type
	if !validateSettingValue(req.SettingValue, setting.SettingType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid value for setting type"})
		return
	}

	// Update setting
	if err := h.db.Model(&ERPSetting{}).
		Where("setting_key = ?", key).
		Updates(map[string]interface{}{
			"setting_value": req.SettingValue,
			"updated_at":    "NOW()",
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch updated setting
	h.db.Where("setting_key = ?", key).First(&setting)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    setting,
		"message": "Setting updated successfully",
	})
}

// POST /api/erp/settings/bulk-update - Update multiple settings at once
func (h *ERPSettingsHandler) BulkUpdateSettings(c *gin.Context) {
	var req struct {
		Settings []struct {
			Key   string `json:"key" binding:"required"`
			Value string `json:"value" binding:"required"`
		} `json:"settings" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	updatedCount := 0
	for _, item := range req.Settings {
		var setting ERPSetting
		if err := tx.Where("setting_key = ? AND is_editable = true", item.Key).First(&setting).Error; err != nil {
			continue
		}

		if !validateSettingValue(item.Value, setting.SettingType) {
			continue
		}

		if err := tx.Model(&ERPSetting{}).
			Where("setting_key = ?", item.Key).
			Update("setting_value", item.Value).Error; err != nil {
			continue
		}
		updatedCount++
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Settings updated",
		"updated": updatedCount,
	})
}

// GET /api/erp/settings/categories - Get all setting categories
func (h *ERPSettingsHandler) GetCategories(c *gin.Context) {
	var categories []struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	if err := h.db.Model(&ERPSetting{}).
		Select("category, COUNT(*) as count").
		Group("category").
		Order("category").
		Scan(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    categories,
	})
}

// Helper function to validate setting value based on type
func validateSettingValue(value, settingType string) bool {
	switch settingType {
	case "number":
		_, err := strconv.ParseFloat(value, 64)
		return err == nil
	case "boolean":
		return value == "true" || value == "false"
	case "string", "json":
		return true
	default:
		return true
	}
}
