// Company/Branch Handlers - Multi-tenancy and branch management
package main

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CompanyBranchHandler handles company and branch management operations
type CompanyBranchHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewCompanyBranchHandler creates a new company/branch handler
func NewCompanyBranchHandler(db *GORMDatabase, cache *CacheService) *CompanyBranchHandler {
	return &CompanyBranchHandler{db: db, cache: cache}
}

// ==================== COMPANY HANDLERS ====================

// GetCompanies retrieves all companies
func (h *CompanyBranchHandler) GetCompanies(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var companies []Company
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&Company{}).Where("is_active = ?", true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count companies"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("name").Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"companies": companies,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetCompany retrieves a specific company
func (h *CompanyBranchHandler) GetCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var company Company

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&company).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company"})
		return
	}

	c.JSON(http.StatusOK, company)
}

// CreateCompany creates a new company
func (h *CompanyBranchHandler) CreateCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var company Company
	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	company.IsActive = true

	if err := h.db.DB.WithContext(ctx).Create(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company"})
		return
	}

	c.JSON(http.StatusCreated, company)
}

// UpdateCompany updates an existing company
func (h *CompanyBranchHandler) UpdateCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var company Company

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&company).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company"})
		return
	}

	var updateData Company
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	company.Name = updateData.Name
	company.Description = updateData.Description
	company.Address = updateData.Address
	company.City = updateData.City
	company.State = updateData.State
	company.Pincode = updateData.Pincode
	company.Phone = updateData.Phone
	company.Email = updateData.Email

	if err := h.db.DB.WithContext(ctx).Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
		return
	}

	c.JSON(http.StatusOK, company)
}

// ==================== BRANCH HANDLERS ====================

// GetBranches retrieves all branches
func (h *CompanyBranchHandler) GetBranches(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var branches []Branch
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&Branch{}).Where("is_active = ?", true)

	// Filter by company if provided
	if companyID := c.Query("company_id"); companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count branches"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("name").Find(&branches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve branches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"branches": branches,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetBranch retrieves a specific branch
func (h *CompanyBranchHandler) GetBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var branch Branch

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&branch).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Branch not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve branch"})
		return
	}

	c.JSON(http.StatusOK, branch)
}

// CreateBranch creates a new branch
func (h *CompanyBranchHandler) CreateBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var branch Branch
	if err := c.ShouldBindJSON(&branch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	branch.IsActive = true

	if err := h.db.DB.WithContext(ctx).Create(&branch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create branch"})
		return
	}

	c.JSON(http.StatusCreated, branch)
}

// UpdateBranch updates an existing branch
func (h *CompanyBranchHandler) UpdateBranch(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var branch Branch

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&branch).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Branch not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve branch"})
		return
	}

	var updateData Branch
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	branch.Name = updateData.Name
	branch.Description = updateData.Description
	branch.Address = updateData.Address
	branch.City = updateData.City
	branch.State = updateData.State
	branch.Pincode = updateData.Pincode
	branch.Phone = updateData.Phone
	branch.Email = updateData.Email

	if err := h.db.DB.WithContext(ctx).Save(&branch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update branch"})
		return
	}

	c.JSON(http.StatusOK, branch)
}

// ==================== MULTI-TENANCY HELPERS ====================

// GetCompanyBranches retrieves all branches for a company
func (h *CompanyBranchHandler) GetCompanyBranches(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	companyID := c.Param("company_id")
	var branches []Branch

	if err := h.db.DB.WithContext(ctx).Where("company_id = ? AND is_active = ?", companyID, true).Order("name").Find(&branches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company branches"})
		return
	}

	c.JSON(http.StatusOK, branches)
}

// SetCompanyContext sets the company context for multi-tenancy
func (h *CompanyBranchHandler) SetCompanyContext(c *gin.Context) {
	companyID := c.Query("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Validate company exists
	var company Company
	if err := h.db.DB.WithContext(c.Request.Context()).Where("id = ? AND is_active = ?", companyID, true).First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	// Set company context for subsequent requests
	c.Set("company_id", companyID)
	c.Set("company", company)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Company context set successfully",
		"company_id":  companyID,
		"company_name": company.Name,
	})
}

// GetUserCompanies retrieves companies accessible to the current user
func (h *CompanyBranchHandler) GetUserCompanies(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Get user from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// In a real implementation, this would check user-company mappings
	// For now, return all active companies
	var companies []Company
	if err := h.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("name").Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user companies"})
		return
	}

	c.JSON(http.StatusOK, companies)
}

// GetCompanyStats retrieves company statistics
func (h *CompanyBranchHandler) GetCompanyStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	companyID := c.Param("company_id")

	// Get company details
	var company Company
	if err := h.db.DB.WithContext(ctx).Where("id = ?", companyID).First(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve company"})
		return
	}

	// Get branch count
	var branchCount int64
	h.db.DB.WithContext(ctx).Model(&Branch{}).Where("company_id = ? AND is_active = ?", companyID, true).Count(&branchCount)

	// Get user count for company
	var userCount int64
	h.db.DB.WithContext(ctx).Model(&User{}).Where("is_active = ?", true).Count(&userCount)

	stats := map[string]interface{}{
		"company_id":    companyID,
		"company_name":  company.Name,
		"branch_count":  branchCount,
		"user_count":    userCount,
		"total_branches": branchCount,
		"active_users":  userCount,
	}

	c.JSON(http.StatusOK, stats)
}
