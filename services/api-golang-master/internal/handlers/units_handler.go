package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Unit struct {
	ID               string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name             string    `json:"name" gorm:"size:100;not null"`
	ShortName        string    `json:"short_name" gorm:"size:20;not null"`
	BaseUnitID       *string   `json:"base_unit_id" gorm:"type:uuid"`
	ConversionFactor float64   `json:"conversion_factor" gorm:"default:1"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (Unit) TableName() string { return "units" }

type UnitsHandler struct { db *gorm.DB }

func NewUnitsHandler(db *gorm.DB) *UnitsHandler { return &UnitsHandler{db: db} }

func (h *UnitsHandler) GetUnits(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []Unit
	var total int64
	q := h.db.WithContext(ctx).Model(&Unit{})
	if search := c.Query("search"); search != "" {
		q = q.Where("name ILIKE ? OR short_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if status := c.Query("is_active"); status != "" {
		q = q.Where("is_active = ?", status == "true")
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err := q.Limit(limit).Offset(offset).Order("name").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

func (h *UnitsHandler) GetUnit(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item Unit
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

func (h *UnitsHandler) CreateUnit(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item Unit
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

func (h *UnitsHandler) UpdateUnit(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item Unit
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	var payload Unit
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.Name = payload.Name
	item.ShortName = payload.ShortName
	item.BaseUnitID = payload.BaseUnitID
	item.ConversionFactor = payload.ConversionFactor
	if err := h.db.WithContext(ctx).Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *UnitsHandler) DeleteUnit(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	if err := h.db.WithContext(ctx).Model(&Unit{}).Where("id = ?", c.Param("id")).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
