package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Branch struct {
	ID        string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CompanyID string     `json:"company_id" gorm:"type:uuid;index;not null"`
	ParentID  *string    `json:"parent_id" gorm:"type:uuid;index"`
	Name      string     `json:"name" gorm:"size:150;not null"`
	Code      string     `json:"code" gorm:"size:50;uniqueIndex;not null"`
	ManagerID *string    `json:"manager_id" gorm:"type:uuid"`
	Address   string     `json:"address" gorm:"type:text"`
	City      string     `json:"city" gorm:"size:100"`
	State     string     `json:"state" gorm:"size:100"`
	Pincode   string     `json:"pincode" gorm:"size:10"`
	Phone     string     `json:"phone" gorm:"size:20"`
	Email     string     `json:"email" gorm:"size:255"`
	IsActive  bool       `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Branch) TableName() string { return "branches" }

type BranchHandler struct { db *gorm.DB }

func NewBranchHandler(db *gorm.DB) *BranchHandler { return &BranchHandler{db: db} }

// GET /api/erp/branches
func (h *BranchHandler) GetBranches(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var items []Branch
	var total int64
	q := h.db.WithContext(ctx).Model(&Branch{})
	if companyID := c.Query("company_id"); companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR code ILIKE ? OR city ILIKE ?", like, like, like)
	}
	if status := c.Query("is_active"); status != "" {
		q = q.Where("is_active = ?", status == "true")
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"}); return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err := q.Limit(limit).Offset(offset).Order("created_at DESC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"}); return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total, "limit": limit, "offset": offset})
}

// GET /api/erp/branches/:id
func (h *BranchHandler) GetBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second); defer cancel()
	var item Branch
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"}); return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

// POST /api/erp/branches
func (h *BranchHandler) CreateBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second); defer cancel()
	var item Branch
	if err := c.ShouldBindJSON(&item); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	item.IsActive = true
	if err := h.db.WithContext(ctx).Create(&item).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"}); return }
	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// PUT /api/erp/branches/:id
func (h *BranchHandler) UpdateBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second); defer cancel()
	var item Branch
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound { c.JSON(http.StatusNotFound, gin.H{"error": "not found"}); return }
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"}); return
	}
	var payload Branch
	if err := c.ShouldBindJSON(&payload); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	item.Name = payload.Name
	item.Code = payload.Code
	item.CompanyID = payload.CompanyID
	item.ParentID = payload.ParentID
	item.ManagerID = payload.ManagerID
	item.Address = payload.Address
	item.City = payload.City
	item.State = payload.State
	item.Pincode = payload.Pincode
	item.Phone = payload.Phone
	item.Email = payload.Email
	if err := h.db.WithContext(ctx).Save(&item).Error; err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"}); return }
	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DELETE /api/erp/branches/:id (soft)
func (h *BranchHandler) DeleteBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second); defer cancel()
	if err := h.db.WithContext(ctx).Model(&Branch{}).Where("id = ?", c.Param("id")).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"}); return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
