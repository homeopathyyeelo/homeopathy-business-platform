package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LegacyAppSetting struct {
	ID          string          `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Key         string          `gorm:"uniqueIndex;size:200;not null" json:"key"`
	Category    string          `gorm:"index;size:100;not null" json:"category"`
	Type        string          `gorm:"size:50;not null;default:'json'" json:"type"`
	Value       json.RawMessage `gorm:"type:jsonb" json:"value"`
	Description string          `gorm:"size:500" json:"description"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type SettingsHandler struct {
	DB *gorm.DB
}

func NewSettingsHandler(db *gorm.DB) *SettingsHandler {
	return &SettingsHandler{DB: db}
}

// GET /api/erp/settings?category=ui&limit=100&offset=0
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	category := c.Query("category")
	limit := 100
	offset := 0
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			offset = n
		}
	}

	var list []LegacyAppSetting
	q := h.DB.Model(&LegacyAppSetting{})
	if category != "" {
		q = q.Where("category = ?", strings.ToLower(category))
	}
	var total int64
	q.Count(&total)
	if err := q.Order("key asc").Limit(limit).Offset(offset).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": list, "total": total})
}

// GET /api/erp/settings/:key
func (h *SettingsHandler) GetSetting(c *gin.Context) {
	key := c.Param("key")
	var s LegacyAppSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": s})
}

// PUT /api/erp/settings/:key  body: { value: any, category?: string, type?: string, description?: string }
func (h *SettingsHandler) UpsertSetting(c *gin.Context) {
	key := c.Param("key")
	var body struct {
		Value       json.RawMessage `json:"value"`
		Category    string          `json:"category"`
		Type        string          `json:"type"`
		Description string          `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	if body.Category == "" {
		// infer category from key prefix e.g. ai.inventoryAgentThreshold -> ai
		if i := strings.Index(key, "."); i > 0 {
			body.Category = key[:i]
		} else {
			body.Category = "system"
		}
	}
	if body.Type == "" {
		body.Type = "json"
	}

	var s LegacyAppSetting
	err := h.DB.Where("key = ?", key).First(&s).Error
	if err == nil {
		// update
		s.Category = strings.ToLower(body.Category)
		s.Type = body.Type
		s.Value = body.Value
		s.Description = body.Description
		if err := h.DB.Save(&s).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "data": s})
		return
	}
	if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	// create
	s = LegacyAppSetting{
		Key:         key,
		Category:    strings.ToLower(body.Category),
		Type:        body.Type,
		Value:       body.Value,
		Description: body.Description,
	}
	if err := h.DB.Create(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": s})
}
