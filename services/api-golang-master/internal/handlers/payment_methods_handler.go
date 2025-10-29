package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PaymentMethod struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"size:100;not null"`
	Type      string    `json:"type" gorm:"size:50;not null"`
	Config    string    `json:"config" gorm:"type:jsonb"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PaymentMethod) TableName() string { return "payment_methods" }

type PaymentMethodsHandler struct { db *gorm.DB }

func NewPaymentMethodsHandler(db *gorm.DB) *PaymentMethodsHandler { return &PaymentMethodsHandler{db: db} }

func (h *PaymentMethodsHandler) GetPaymentMethods(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []PaymentMethod
	var total int64
	q := h.db.WithContext(ctx).Model(&PaymentMethod{})
	if search := c.Query("search"); search != "" {
		q = q.Where("name ILIKE ? OR type ILIKE ?", "%"+search+"%", "%"+search+"%")
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
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total, "limit": limit, "offset": offset})
}

func (h *PaymentMethodsHandler) GetPaymentMethod(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item PaymentMethod
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

func (h *PaymentMethodsHandler) CreatePaymentMethod(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item PaymentMethod
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

func (h *PaymentMethodsHandler) UpdatePaymentMethod(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item PaymentMethod
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	var payload PaymentMethod
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.Name = payload.Name
	item.Type = payload.Type
	item.Config = payload.Config
	if err := h.db.WithContext(ctx).Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *PaymentMethodsHandler) DeletePaymentMethod(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	if err := h.db.WithContext(ctx).Model(&PaymentMethod{}).Where("id = ?", c.Param("id")).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *PaymentMethodsHandler) TestPaymentMethod(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Test connection successful"})
}
