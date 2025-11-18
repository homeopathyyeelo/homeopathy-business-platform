package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MarketingHandler struct {
	db *gorm.DB
}

func NewMarketingHandler(db *gorm.DB) *MarketingHandler {
	return &MarketingHandler{db: db}
}

// MarketingCampaign struct
type MarketingCampaign struct {
	ID             string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name           string     `json:"name" gorm:"not null"`
	Type           string     `json:"type" gorm:"not null"`          // whatsapp, sms, email
	Status         string     `json:"status" gorm:"default:'draft'"` // draft, active, completed, scheduled
	TargetAudience string     `json:"target_audience"`
	Message        string     `json:"message" gorm:"type:text"`
	ScheduledAt    *time.Time `json:"scheduled_at"`
	SentCount      int        `json:"sent_count" gorm:"default:0"`
	DeliveredCount int        `json:"delivered_count" gorm:"default:0"`
	ReadCount      int        `json:"read_count" gorm:"default:0"`
	ClickCount     int        `json:"click_count" gorm:"default:0"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (MarketingCampaign) TableName() string {
	return "marketing_campaigns"
}

// GET /api/erp/marketing/campaigns
func (h *MarketingHandler) GetCampaigns(c *gin.Context) {
	var campaigns []MarketingCampaign

	query := h.db.Model(&MarketingCampaign{})

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by type
	if campaignType := c.Query("type"); campaignType != "" {
		query = query.Where("type = ?", campaignType)
	}

	if err := query.Order("created_at DESC").Find(&campaigns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch campaigns",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    campaigns,
		"total":   len(campaigns),
	})
}

// POST /api/erp/marketing/campaigns
func (h *MarketingHandler) CreateCampaign(c *gin.Context) {
	var campaign MarketingCampaign

	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if err := h.db.Create(&campaign).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create campaign",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    campaign,
	})
}

// GET /api/erp/marketing/campaigns/:id
func (h *MarketingHandler) GetCampaign(c *gin.Context) {
	id := c.Param("id")
	var campaign MarketingCampaign

	if err := h.db.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Campaign not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    campaign,
	})
}

// PUT /api/erp/marketing/campaigns/:id
func (h *MarketingHandler) UpdateCampaign(c *gin.Context) {
	id := c.Param("id")
	var campaign MarketingCampaign

	if err := h.db.First(&campaign, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Campaign not found",
		})
		return
	}

	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if err := h.db.Save(&campaign).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update campaign",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    campaign,
	})
}

// DELETE /api/erp/marketing/campaigns/:id
func (h *MarketingHandler) DeleteCampaign(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Delete(&MarketingCampaign{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete campaign",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Campaign deleted successfully",
	})
}

// GET /api/erp/marketing/stats
func (h *MarketingHandler) GetStats(c *gin.Context) {
	var totalCampaigns int64
	var activeCampaigns int64
	var completedCampaigns int64
	var scheduledCampaigns int64

	h.db.Model(&MarketingCampaign{}).Count(&totalCampaigns)
	h.db.Model(&MarketingCampaign{}).Where("status = ?", "active").Count(&activeCampaigns)
	h.db.Model(&MarketingCampaign{}).Where("status = ?", "completed").Count(&completedCampaigns)
	h.db.Model(&MarketingCampaign{}).Where("status = ?", "scheduled").Count(&scheduledCampaigns)

	// Channel stats
	var whatsappSent, whatsappDelivered, whatsappRead int64
	var smsSent, smsDelivered int64
	var emailSent, emailOpened, emailClicked int64

	h.db.Model(&MarketingCampaign{}).Where("type = ?", "whatsapp").Select("COALESCE(SUM(sent_count), 0)").Scan(&whatsappSent)
	h.db.Model(&MarketingCampaign{}).Where("type = ?", "whatsapp").Select("COALESCE(SUM(delivered_count), 0)").Scan(&whatsappDelivered)
	h.db.Model(&MarketingCampaign{}).Where("type = ?", "whatsapp").Select("COALESCE(SUM(read_count), 0)").Scan(&whatsappRead)

	h.db.Model(&MarketingCampaign{}).Where("type = ?", "sms").Select("COALESCE(SUM(sent_count), 0)").Scan(&smsSent)
	h.db.Model(&MarketingCampaign{}).Where("type = ?", "sms").Select("COALESCE(SUM(delivered_count), 0)").Scan(&smsDelivered)

	h.db.Model(&MarketingCampaign{}).Where("type = ?", "email").Select("COALESCE(SUM(sent_count), 0)").Scan(&emailSent)
	h.db.Model(&MarketingCampaign{}).Where("type = ?", "email").Select("COALESCE(SUM(read_count), 0)").Scan(&emailOpened)
	h.db.Model(&MarketingCampaign{}).Where("type = ?", "email").Select("COALESCE(SUM(click_count), 0)").Scan(&emailClicked)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"campaigns": gin.H{
				"total":     totalCampaigns,
				"active":    activeCampaigns,
				"completed": completedCampaigns,
				"scheduled": scheduledCampaigns,
			},
			"channels": gin.H{
				"whatsapp": gin.H{
					"sent":      whatsappSent,
					"delivered": whatsappDelivered,
					"read":      whatsappRead,
				},
				"sms": gin.H{
					"sent":      smsSent,
					"delivered": smsDelivered,
				},
				"email": gin.H{
					"sent":    emailSent,
					"opened":  emailOpened,
					"clicked": emailClicked,
				},
			},
		},
	})
}

// Message Template
type MessageTemplate struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null"`
	Type      string    `json:"type" gorm:"not null"` // whatsapp, sms, email
	Subject   string    `json:"subject"`
	Body      string    `json:"body" gorm:"type:text;not null"`
	Variables []string  `json:"variables" gorm:"type:jsonb"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GET /api/erp/marketing/templates
func (h *MarketingHandler) GetTemplates(c *gin.Context) {
	var templates []MessageTemplate

	query := h.db.Model(&MessageTemplate{})

	if templateType := c.Query("type"); templateType != "" {
		query = query.Where("type = ?", templateType)
	}

	if err := query.Order("created_at DESC").Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch templates",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    templates,
		"total":   len(templates),
	})
}

// POST /api/erp/marketing/templates
func (h *MarketingHandler) CreateTemplate(c *gin.Context) {
	var template MessageTemplate

	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if err := h.db.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create template",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    template,
	})
}
