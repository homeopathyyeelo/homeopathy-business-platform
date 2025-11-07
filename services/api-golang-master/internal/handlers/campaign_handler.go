package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CampaignHandler struct {
	DB *gorm.DB
}

func NewCampaignHandler(db *gorm.DB) *CampaignHandler {
	return &CampaignHandler{DB: db}
}

type Campaign struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name             string     `json:"name"`
	Type             string     `json:"type"` // email, sms, whatsapp, push
	Status           string     `json:"status" gorm:"default:'draft'"` // draft, scheduled, running, completed, paused
	TargetAudience   string     `json:"target_audience"` // all, segment, custom
	SegmentID        *uuid.UUID `json:"segment_id"`
	Subject          string     `json:"subject"`
	Content          string     `json:"content" gorm:"type:text"`
	TemplateID       *uuid.UUID `json:"template_id"`
	TotalRecipients  int        `json:"total_recipients"`
	SentCount        int        `json:"sent_count"`
	DeliveredCount   int        `json:"delivered_count"`
	FailedCount      int        `json:"failed_count"`
	OpenedCount      int        `json:"opened_count"`
	ClickedCount     int        `json:"clicked_count"`
	ConversionCount  int        `json:"conversion_count"`
	ScheduledAt      *time.Time `json:"scheduled_at"`
	StartedAt        *time.Time `json:"started_at"`
	CompletedAt      *time.Time `json:"completed_at"`
	Metadata         string     `json:"metadata" gorm:"type:jsonb"`
	CreatedBy        uuid.UUID  `json:"created_by"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CampaignRecipient struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CampaignID    uuid.UUID  `json:"campaign_id" gorm:"index"`
	CustomerID    uuid.UUID  `json:"customer_id"`
	Email         string     `json:"email"`
	Phone         string     `json:"phone"`
	Status        string     `json:"status"` // pending, sent, delivered, failed, opened, clicked
	SentAt        *time.Time `json:"sent_at"`
	DeliveredAt   *time.Time `json:"delivered_at"`
	OpenedAt      *time.Time `json:"opened_at"`
	ClickedAt     *time.Time `json:"clicked_at"`
	ErrorMessage  string     `json:"error_message"`
	CreatedAt     time.Time  `json:"created_at"`
}

type CampaignTemplate struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `json:"name"`
	Type        string    `json:"type"` // email, sms, whatsapp
	Subject     string    `json:"subject"`
	Content     string    `json:"content" gorm:"type:text"`
	Variables   string    `json:"variables" gorm:"type:jsonb"` // {{customer_name}}, {{product_name}}, etc.
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Get campaigns
func (h *CampaignHandler) GetCampaigns(c *gin.Context) {
	var campaigns []Campaign
	query := h.DB.Model(&Campaign{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if campaignType := c.Query("type"); campaignType != "" {
		query = query.Where("type = ?", campaignType)
	}

	query.Order("created_at DESC").Find(&campaigns)
	c.JSON(http.StatusOK, gin.H{"success": true, "campaigns": campaigns})
}

// Get single campaign
func (h *CampaignHandler) GetCampaign(c *gin.Context) {
	id := c.Param("id")
	var campaign Campaign
	
	if err := h.DB.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "campaign": campaign})
}

// Create campaign
func (h *CampaignHandler) CreateCampaign(c *gin.Context) {
	var campaign Campaign
	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	campaign.ID = uuid.New()
	campaign.Status = "draft"

	if err := h.DB.Create(&campaign).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "campaign": campaign})
}

// Update campaign
func (h *CampaignHandler) UpdateCampaign(c *gin.Context) {
	id := c.Param("id")
	var campaign Campaign
	
	if err := h.DB.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&campaign).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "campaign": campaign})
}

// Schedule campaign
func (h *CampaignHandler) ScheduleCampaign(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		ScheduledAt time.Time `json:"scheduled_at" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var campaign Campaign
	if err := h.DB.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	campaign.Status = "scheduled"
	campaign.ScheduledAt = &req.ScheduledAt
	h.DB.Save(&campaign)

	c.JSON(http.StatusOK, gin.H{"success": true, "campaign": campaign})
}

// Send campaign
func (h *CampaignHandler) SendCampaign(c *gin.Context) {
	id := c.Param("id")
	var campaign Campaign
	
	if err := h.DB.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	// Start campaign
	now := time.Now()
	campaign.Status = "running"
	campaign.StartedAt = &now
	h.DB.Save(&campaign)

	// Send to recipients (background job in production)
	go h.processCampaignRecipients(campaign.ID)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Campaign started"})
}

// Get campaign stats
func (h *CampaignHandler) GetCampaignStats(c *gin.Context) {
	id := c.Param("id")
	var campaign Campaign
	
	if err := h.DB.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	stats := gin.H{
		"total_recipients": campaign.TotalRecipients,
		"sent_count":       campaign.SentCount,
		"delivered_count":  campaign.DeliveredCount,
		"failed_count":     campaign.FailedCount,
		"opened_count":     campaign.OpenedCount,
		"clicked_count":    campaign.ClickedCount,
		"conversion_count": campaign.ConversionCount,
		"open_rate":        float64(campaign.OpenedCount) / float64(campaign.SentCount) * 100,
		"click_rate":       float64(campaign.ClickedCount) / float64(campaign.SentCount) * 100,
		"conversion_rate":  float64(campaign.ConversionCount) / float64(campaign.SentCount) * 100,
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "stats": stats})
}

// Campaign templates
func (h *CampaignHandler) GetTemplates(c *gin.Context) {
	var templates []CampaignTemplate
	h.DB.Where("is_active = ?", true).Order("name ASC").Find(&templates)
	c.JSON(http.StatusOK, gin.H{"success": true, "templates": templates})
}

func (h *CampaignHandler) CreateTemplate(c *gin.Context) {
	var template CampaignTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template.ID = uuid.New()
	if err := h.DB.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "template": template})
}

// Background processing
func (h *CampaignHandler) processCampaignRecipients(campaignID uuid.UUID) {
	// Simulate sending emails/SMS
	time.Sleep(2 * time.Second)
	
	var campaign Campaign
	h.DB.First(&campaign, "id = ?", campaignID)
	
	campaign.Status = "completed"
	now := time.Now()
	campaign.CompletedAt = &now
	campaign.SentCount = campaign.TotalRecipients
	campaign.DeliveredCount = campaign.TotalRecipients
	h.DB.Save(&campaign)
}
