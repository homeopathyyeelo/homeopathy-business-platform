package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CompanySettingsHandler struct {
	db *gorm.DB
}

func NewCompanySettingsHandler(db *gorm.DB) *CompanySettingsHandler {
	return &CompanySettingsHandler{db: db}
}

// Company model for settings
type CompanySettings struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null;size:255"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null;size:50"`
	LegalName   string    `json:"legal_name" gorm:"size:255"`
	PAN         string    `json:"pan" gorm:"size:20"`
	GSTIN       string    `json:"gstin" gorm:"size:20"`
	Address     string    `json:"address" gorm:"type:text"`
	City        string    `json:"city" gorm:"size:100"`
	State       string    `json:"state" gorm:"size:100"`
	Country     string    `json:"country" gorm:"size:100;default:'India'"`
	Pincode     string    `json:"pincode" gorm:"size:10"`
	Phone       string    `json:"phone" gorm:"size:20"`
	Email       string    `json:"email" gorm:"size:255"`
	Website     string    `json:"website" gorm:"size:255"`
	LogoURL     string    `json:"logo_url" gorm:"size:500"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (CompanySettings) TableName() string {
	return "companies"
}

// GetCompanies - GET /api/erp/companies
func (h *CompanySettingsHandler) GetCompanies(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var companies []CompanySettings
	var total int64

	query := h.db.WithContext(ctx).Model(&CompanySettings{})

	// Filters
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ? OR gstin ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if isActive := c.Query("is_active"); isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count companies"})
		return
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetCompany - GET /api/erp/companies/:id
func (h *CompanySettingsHandler) GetCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var company CompanySettings

	if err := h.db.WithContext(ctx).First(&company, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    company,
	})
}

// CreateCompany - POST /api/erp/companies
func (h *CompanySettingsHandler) CreateCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var company CompanySettings
	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	company.IsActive = true
	if err := h.db.WithContext(ctx).Create(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    company,
		"message": "Company created successfully",
	})
}

// UpdateCompany - PUT /api/erp/companies/:id
func (h *CompanySettingsHandler) UpdateCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var company CompanySettings

	if err := h.db.WithContext(ctx).First(&company, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
		return
	}

	var updateData CompanySettings
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	company.Name = updateData.Name
	company.LegalName = updateData.LegalName
	company.PAN = updateData.PAN
	company.GSTIN = updateData.GSTIN
	company.Address = updateData.Address
	company.City = updateData.City
	company.State = updateData.State
	company.Country = updateData.Country
	company.Pincode = updateData.Pincode
	company.Phone = updateData.Phone
	company.Email = updateData.Email
	company.Website = updateData.Website
	company.LogoURL = updateData.LogoURL

	if err := h.db.WithContext(ctx).Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    company,
		"message": "Company updated successfully",
	})
}

// DeleteCompany - DELETE /api/erp/companies/:id
func (h *CompanySettingsHandler) DeleteCompany(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var company CompanySettings

	if err := h.db.WithContext(ctx).First(&company, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
		return
	}

	// Soft delete
	company.IsActive = false
	if err := h.db.WithContext(ctx).Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company deleted successfully",
	})
}
