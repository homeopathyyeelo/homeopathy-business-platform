package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Role struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	Code        string    `json:"code" gorm:"size:50;uniqueIndex;not null"`
	Description string    `json:"description" gorm:"type:text"`
	Level       int       `json:"level" gorm:"default:0"`
	IsSystem    bool      `json:"is_system" gorm:"default:false"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	UpdatedBy   *string   `json:"updated_by" gorm:"type:uuid"`
}

type Permission struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Module      string    `json:"module" gorm:"size:50;not null;index"`
	Action      string    `json:"action" gorm:"size:50;not null"`
	Code        string    `json:"code" gorm:"size:100;uniqueIndex;not null"`
	Description string    `json:"description" gorm:"type:text"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RolePermission struct {
	RoleID       string    `json:"role_id" gorm:"type:uuid;primaryKey"`
	PermissionID string    `json:"permission_id" gorm:"type:uuid;primaryKey"`
	Granted      bool      `json:"granted" gorm:"default:true"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Role) TableName() string           { return "roles" }
func (Permission) TableName() string     { return "permissions" }
func (RolePermission) TableName() string { return "role_permissions" }

type RBACHandler struct { db *gorm.DB }

func NewRBACHandler(db *gorm.DB) *RBACHandler { return &RBACHandler{db: db} }

// GET /api/erp/rbac/roles
func (h *RBACHandler) GetRoles(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []Role
	var total int64
	q := h.db.WithContext(ctx).Model(&Role{})
	if search := c.Query("search"); search != "" {
		q = q.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if status := c.Query("is_active"); status != "" {
		q = q.Where("is_active = ?", status == "true")
	}
	if module := c.Query("module"); module != "" {
		q = q.Where("code ILIKE ?", "%"+module+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	sort := c.DefaultQuery("sort", "created_at DESC")
	if err := q.Limit(limit).Offset(offset).Order(sort).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total, "limit": limit, "offset": offset})
}

// GET /api/erp/rbac/roles/:id
func (h *RBACHandler) GetRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var role Role
	if err := h.db.WithContext(ctx).First(&role, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	var rps []RolePermission
	h.db.WithContext(ctx).Where("role_id = ?", role.ID).Find(&rps)
	var permIDs []string
	for _, rp := range rps {
		if rp.Granted {
			permIDs = append(permIDs, rp.PermissionID)
		}
	}
	var perms []Permission
	if len(permIDs) > 0 {
		h.db.WithContext(ctx).Where("id IN ?", permIDs).Find(&perms)
	}
	c.JSON(http.StatusOK, gin.H{"data": role, "permissions": perms})
}

// POST /api/erp/rbac/roles
func (h *RBACHandler) CreateRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item Role
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

// PUT /api/erp/rbac/roles/:id
func (h *RBACHandler) UpdateRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var item Role
	if err := h.db.WithContext(ctx).First(&item, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	if item.IsSystem {
		c.JSON(http.StatusForbidden, gin.H{"error": "system role cannot be modified"})
		return
	}
	var payload Role
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.Name = payload.Name
	item.Description = payload.Description
	item.Level = payload.Level
	item.IsActive = payload.IsActive
	if err := h.db.WithContext(ctx).Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DELETE /api/erp/rbac/roles/:id
func (h *RBACHandler) DeleteRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var role Role
	if err := h.db.WithContext(ctx).First(&role, "id = ?", c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	if role.IsSystem {
		c.JSON(http.StatusForbidden, gin.H{"error": "system role cannot be deleted"})
		return
	}
	if err := h.db.WithContext(ctx).Model(&Role{}).Where("id = ?", c.Param("id")).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// PUT /api/erp/rbac/roles/:id/permissions
func (h *RBACHandler) UpdateRolePermissions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	roleID := c.Param("id")
	var payload struct {
		PermissionIDs []string `json:"permission_ids"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Delete existing
	h.db.WithContext(ctx).Where("role_id = ?", roleID).Delete(&RolePermission{})
	// Insert new
	for _, pid := range payload.PermissionIDs {
		rp := RolePermission{RoleID: roleID, PermissionID: pid, Granted: true, UpdatedAt: time.Now()}
		h.db.WithContext(ctx).Create(&rp)
	}
	c.JSON(http.StatusOK, gin.H{"message": "permissions updated"})
}

// GET /api/erp/rbac/permissions
func (h *RBACHandler) GetPermissions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()
	var items []Permission
	var total int64
	q := h.db.WithContext(ctx).Model(&Permission{}).Where("is_active = ?", true)
	if module := c.Query("module"); module != "" {
		q = q.Where("module = ?", module)
	}
	if action := c.Query("action"); action != "" {
		q = q.Where("action = ?", action)
	}
	if search := c.Query("search"); search != "" {
		q = q.Where("code ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "count failed"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "200"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err := q.Limit(limit).Offset(offset).Order("module, action").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}
