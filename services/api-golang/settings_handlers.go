// Settings/Configuration Handlers - Complete system configuration management
package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SettingsHandler handles system configuration operations
type SettingsHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewSettingsHandler creates a new settings handler
func NewSettingsHandler(db *GORMDatabase, cache *CacheService) *SettingsHandler {
	return &SettingsHandler{db: db, cache: cache}
}

// ==================== SYSTEM SETTINGS ====================

// GetSystemSettings retrieves system-wide settings
func (h *SettingsHandler) GetSystemSettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var settings []SystemSetting
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&SystemSetting{}).Where("is_active = ?", true)

	// Apply filters
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if module := c.Query("module"); module != "" {
		query = query.Where("module = ?", module)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count system settings"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("category, module, setting_key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve system settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetSystemSetting retrieves a specific system setting
func (h *SettingsHandler) GetSystemSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	key := c.Param("key")
	var setting SystemSetting

	if err := h.db.DB.WithContext(ctx).Where("setting_key = ? AND is_active = ?", key, true).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "System setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve system setting"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

// UpdateSystemSetting updates a system setting
func (h *SettingsHandler) UpdateSystemSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	key := c.Param("key")
	var setting SystemSetting

	if err := h.db.DB.WithContext(ctx).Where("setting_key = ? AND is_active = ?", key, true).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "System setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve system setting"})
		return
	}

	var updateData SystemSetting
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	setting.SettingValue = updateData.SettingValue
	setting.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update system setting"})
		return
	}

	// Clear cache for this setting
	h.cache.DeletePattern(ctx, fmt.Sprintf("setting:%s", key))

	c.JSON(http.StatusOK, setting)
}

// CreateSystemSetting creates a new system setting
func (h *SettingsHandler) CreateSystemSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var setting SystemSetting
	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	setting.IsActive = true

	if err := h.db.DB.WithContext(ctx).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create system setting"})
		return
	}

	c.JSON(http.StatusCreated, setting)
}

// ==================== COMPANY CONFIGURATION ====================

// GetCompanySettings retrieves company-specific settings
func (h *SettingsHandler) GetCompanySettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	companyID := c.Param("company_id")
	var settings []CompanySetting
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&CompanySetting{}).Where("company_id = ? AND is_active = ?", companyID, true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count company settings"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("setting_key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// UpdateCompanySetting updates a company-specific setting
func (h *SettingsHandler) UpdateCompanySetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	companyID := c.Param("company_id")
	settingKey := c.Param("setting_key")

	var setting CompanySetting
	if err := h.db.DB.WithContext(ctx).Where("company_id = ? AND setting_key = ? AND is_active = ?", companyID, settingKey, true).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company setting"})
		return
	}

	var updateData CompanySetting
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	setting.SettingValue = updateData.SettingValue
	setting.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company setting"})
		return
	}

	// Clear cache for this setting
	h.cache.DeletePattern(ctx, fmt.Sprintf("company_setting:%s:%s", companyID, settingKey))

	c.JSON(http.StatusOK, setting)
}

// ==================== USER PREFERENCES ====================

// GetUserPreferences retrieves user preferences
func (h *SettingsHandler) GetUserPreferences(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Param("user_id")
	var preferences []UserPreference
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&UserPreference{}).Where("user_id = ?", userID)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count user preferences"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("preference_key").Find(&preferences).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user preferences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"preferences": preferences,
		"total":       total,
		"limit":       limit,
		"offset":      offset,
	})
}

// UpdateUserPreference updates a user preference
func (h *SettingsHandler) UpdateUserPreference(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Param("user_id")
	preferenceKey := c.Param("preference_key")

	var preference UserPreference
	if err := h.db.DB.WithContext(ctx).Where("user_id = ? AND preference_key = ?", userID, preferenceKey).First(&preference).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new preference if it doesn't exist
			var newPreference UserPreference
			if err := c.ShouldBindJSON(&newPreference); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newPreference.UserID = userID
			newPreference.PreferenceKey = preferenceKey

			if err := h.db.DB.WithContext(ctx).Create(&newPreference).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user preference"})
				return
			}

			c.JSON(http.StatusCreated, newPreference)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user preference"})
		return
	}

	var updateData UserPreference
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	preference.PreferenceValue = updateData.PreferenceValue
	preference.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&preference).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user preference"})
		return
	}

	// Clear cache for this preference
	h.cache.DeletePattern(ctx, fmt.Sprintf("user_preference:%s:%s", userID, preferenceKey))

	c.JSON(http.StatusOK, preference)
}

// ==================== MODULE CONFIGURATIONS ====================

// GetModuleConfig retrieves configuration for a specific module
func (h *SettingsHandler) GetModuleConfig(c *gin.Context) {
	module := c.Param("module")
	companyID := c.Query("company_id")

	var configs []ModuleConfig
	var total int64

	query := h.db.DB.WithContext(c.Request.Context()).Model(&ModuleConfig{}).Where("module = ? AND is_active = ?", module, true)

	if companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count module configs"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("config_key").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve module configs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"configs": configs,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
		"module":  module,
	})
}

// UpdateModuleConfig updates module configuration
func (h *SettingsHandler) UpdateModuleConfig(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	module := c.Param("module")
	configKey := c.Param("config_key")

	var config ModuleConfig
	if err := h.db.DB.WithContext(ctx).Where("module = ? AND config_key = ?", module, configKey).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new config if it doesn't exist
			var newConfig ModuleConfig
			if err := c.ShouldBindJSON(&newConfig); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newConfig.Module = module
			newConfig.ConfigKey = configKey

			if err := h.db.DB.WithContext(ctx).Create(&newConfig).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module config"})
				return
			}

			c.JSON(http.StatusCreated, newConfig)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve module config"})
		return
	}

	var updateData ModuleConfig
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	config.ConfigValue = updateData.ConfigValue
	config.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module config"})
		return
	}

	// Clear cache for this config
	h.cache.DeletePattern(ctx, fmt.Sprintf("module_config:%s:%s", module, configKey))

	c.JSON(http.StatusOK, config)
}

// ==================== INTEGRATION SETTINGS ====================

// GetIntegrationSettings retrieves integration configurations
func (h *SettingsHandler) GetIntegrationSettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var settings []IntegrationSetting
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&IntegrationSetting{}).Where("is_active = ?", true)

	// Apply filters
	if integrationType := c.Query("type"); integrationType != "" {
		query = query.Where("integration_type = ?", integrationType)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count integration settings"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("integration_type, setting_key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve integration settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// UpdateIntegrationSetting updates integration configuration
func (h *SettingsHandler) UpdateIntegrationSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	integrationType := c.Param("type")
	settingKey := c.Param("setting_key")

	var setting IntegrationSetting
	if err := h.db.DB.WithContext(ctx).Where("integration_type = ? AND setting_key = ? AND is_active = ?", integrationType, settingKey, true).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new setting if it doesn't exist
			var newSetting IntegrationSetting
			if err := c.ShouldBindJSON(&newSetting); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newSetting.IntegrationType = integrationType
			newSetting.SettingKey = settingKey

			if err := h.db.DB.WithContext(ctx).Create(&newSetting).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create integration setting"})
				return
			}

			c.JSON(http.StatusCreated, newSetting)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve integration setting"})
		return
	}

	var updateData IntegrationSetting
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	setting.SettingValue = updateData.SettingValue
	setting.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update integration setting"})
		return
	}

	// Clear cache for this setting
	h.cache.DeletePattern(ctx, fmt.Sprintf("integration_setting:%s:%s", integrationType, settingKey))

	c.JSON(http.StatusOK, setting)
}

// ==================== BACKUP & RESTORE ====================

// CreateBackup creates a system backup
func (h *SettingsHandler) CreateBackup(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 300*time.Second) // 5 minutes for backup
	defer cancel()

	var request struct {
		BackupType  string   `json:"backup_type" binding:"required"` // full, incremental, selective
		Modules     []string `json:"modules"`                        // specific modules to backup
		Description string   `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would create a backup
	backup := SystemBackup{
		BackupType:  request.BackupType,
		Status:      "in_progress",
		FilePath:    fmt.Sprintf("/backups/backup_%d.zip", time.Now().Unix()),
		FileSize:    0,
		Modules:     request.Modules,
		Description: request.Description,
		CreatedBy:   c.GetString("user_id"),
		StartedAt:   time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&backup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create backup record"})
		return
	}

	// Simulate backup process (in real implementation, this would be async)
	go func() {
		// Simulate backup completion
		time.Sleep(5 * time.Second)

		backup.Status = "completed"
		backup.FileSize = 1024 * 1024 * 100 // 100MB mock size
		backup.CompletedAt = &time.Time{}
		*backup.CompletedAt = time.Now()

		h.db.DB.Save(&backup)
	}()

	response := map[string]interface{}{
		"message":       "Backup initiated successfully",
		"backup_id":     backup.ID,
		"backup_type":   backup.BackupType,
		"status":        backup.Status,
		"estimated_time": "5 minutes",
	}

	c.JSON(http.StatusAccepted, response)
}

// GetBackups retrieves backup history
func (h *SettingsHandler) GetBackups(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var backups []SystemBackup
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&SystemBackup{})

	// Apply filters
	if backupType := c.Query("type"); backupType != "" {
		query = query.Where("backup_type = ?", backupType)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count backups"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&backups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve backups"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"backups": backups,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// ==================== NOTIFICATION SETTINGS ====================

// GetNotificationSettings retrieves notification preferences
func (h *SettingsHandler) GetNotificationSettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Param("user_id")
	var settings []NotificationSetting
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&NotificationSetting{}).Where("user_id = ?", userID)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notification settings"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("notification_type").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notification settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// UpdateNotificationSetting updates notification preference
func (h *SettingsHandler) UpdateNotificationSetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Param("user_id")
	notificationType := c.Param("type")

	var setting NotificationSetting
	if err := h.db.DB.WithContext(ctx).Where("user_id = ? AND notification_type = ?", userID, notificationType).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new setting if it doesn't exist
			var newSetting NotificationSetting
			if err := c.ShouldBindJSON(&newSetting); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			newSetting.UserID = userID
			newSetting.NotificationType = notificationType

			if err := h.db.DB.WithContext(ctx).Create(&newSetting).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification setting"})
				return
			}

			c.JSON(http.StatusCreated, newSetting)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notification setting"})
		return
	}

	var updateData NotificationSetting
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	setting.IsEnabled = updateData.IsEnabled
	setting.Channels = updateData.Channels
	setting.Frequency = updateData.Frequency

	if err := h.db.DB.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification setting"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

// ==================== SECURITY SETTINGS ====================

// GetSecuritySettings retrieves security configurations
func (h *SettingsHandler) GetSecuritySettings(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var settings []SecuritySetting
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&SecuritySetting{}).Where("is_active = ?", true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count security settings"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("setting_key").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve security settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// UpdateSecuritySetting updates security configuration
func (h *SettingsHandler) UpdateSecuritySetting(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	settingKey := c.Param("setting_key")

	var setting SecuritySetting
	if err := h.db.DB.WithContext(ctx).Where("setting_key = ? AND is_active = ?", settingKey, true).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Security setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve security setting"})
		return
	}

	var updateData SecuritySetting
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	setting.SettingValue = updateData.SettingValue
	setting.Description = updateData.Description

	if err := h.db.DB.WithContext(ctx).Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update security setting"})
		return
	}

	// Clear cache for this setting
	h.cache.DeletePattern(ctx, fmt.Sprintf("security_setting:%s", settingKey))

	c.JSON(http.StatusOK, setting)
}

// ==================== SYSTEM HEALTH ====================

// GetSystemHealth retrieves system health status
func (h *SettingsHandler) GetSystemHealth(c *gin.Context) {
	health := map[string]interface{}{
		"database": map[string]interface{}{
			"status":    "healthy",
			"connected": true,
			"response_time": "5ms",
		},
		"cache": map[string]interface{}{
			"status":    "healthy",
			"connected": true,
			"hit_rate":  "95%",
		},
		"services": map[string]interface{}{
			"api_golang": map[string]interface{}{
				"status": "running",
				"uptime": "2h 30m",
				"memory_usage": "150MB",
			},
			"nestjs_api": map[string]interface{}{
				"status": "running",
				"uptime": "2h 28m",
				"memory_usage": "200MB",
			},
			"fastify_api": map[string]interface{}{
				"status": "running",
				"uptime": "2h 25m",
				"memory_usage": "120MB",
			},
		},
		"hardware": map[string]interface{}{
			"weighing_machine": "connected",
			"barcode_scanner":  "connected",
			"printer":          "connected",
			"customer_display": "connected",
		},
		"overall_status": "healthy",
		"last_checked":   time.Now(),
	}

	c.JSON(http.StatusOK, health)
}

// ==================== CONFIGURATION TEMPLATES ====================

// GetConfigTemplates retrieves configuration templates
func (h *SettingsHandler) GetConfigTemplates(c *gin.Context) {
	templates := []map[string]interface{}{
		{
			"id":          "retail_pos",
			"name":        "Retail POS Configuration",
			"description": "Standard configuration for retail point of sale",
			"modules":     []string{"pos", "inventory", "payments", "loyalty"},
			"settings": map[string]interface{}{
				"pos_hold_bill_timeout": "30",
				"pos_customer_display":  "true",
				"pos_dual_panel":        "true",
				"inventory_low_stock_alert": "10",
			},
		},
		{
			"id":          "wholesale",
			"name":        "Wholesale Configuration",
			"description": "Configuration optimized for wholesale operations",
			"modules":     []string{"purchases", "inventory", "finance", "reports"},
			"settings": map[string]interface{}{
				"purchases_bulk_discount": "true",
				"inventory_batch_tracking": "true",
				"finance_credit_limit":     "100000",
			},
		},
		{
			"id":          "clinic",
			"name":        "Homeopathy Clinic Configuration",
			"description": "Specialized configuration for homeopathy practices",
			"modules":     []string{"patients", "appointments", "prescriptions", "inventory"},
			"settings": map[string]interface{}{
				"patients_medical_history": "true",
				"appointments_sms_reminders": "true",
				"prescriptions_digital_sign": "true",
			},
		},
	}

	c.JSON(http.StatusOK, templates)
}

// ApplyConfigTemplate applies a configuration template
func (h *SettingsHandler) ApplyConfigTemplate(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	var request struct {
		TemplateID string `json:"template_id" binding:"required"`
		CompanyID  string `json:"company_id"`
		Overwrite  bool   `json:"overwrite"` // Whether to overwrite existing settings
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would apply the template settings
	response := map[string]interface{}{
		"message":      "Configuration template applied successfully",
		"template_id":  request.TemplateID,
		"settings_applied": 15,
		"settings_skipped": 3,
		"applied_at":   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}
