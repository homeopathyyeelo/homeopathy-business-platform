package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type SocialHandler struct {
	DB *gorm.DB
}

func NewSocialHandler(db *gorm.DB) *SocialHandler {
	return &SocialHandler{DB: db}
}

// GetAccounts returns all social accounts
func (h *SocialHandler) GetAccounts(c *gin.Context) {
	var accounts []models.SocialAccount
	if err := h.DB.Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": accounts})
}

// ConnectAccount creates a new social account (mock implementation for now)
func (h *SocialHandler) ConnectAccount(c *gin.Context) {
	var req struct {
		Platform    string `json:"platform" binding:"required"`
		AccountName string `json:"accountName" binding:"required"`
		AccountID   string `json:"accountId" binding:"required"`
		AccessToken string `json:"accessToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account := models.SocialAccount{
		ID:          uuid.New().String(),
		Platform:    req.Platform,
		AccountName: req.AccountName,
		AccountID:   req.AccountID,
		AccessToken: req.AccessToken,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": account})
}

// GetPosts returns posts for an account
func (h *SocialHandler) GetPosts(c *gin.Context) {
	accountID := c.Query("accountId")
	var posts []models.SocialPost
	query := h.DB.Preload("Analytics")

	if accountID != "" {
		query = query.Where("account_id = ?", accountID)
	}

	if err := query.Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": posts})
}

// CreatePost creates a new post
func (h *SocialHandler) CreatePost(c *gin.Context) {
	var req struct {
		AccountID     string     `json:"accountId" binding:"required"`
		Platform      string     `json:"platform" binding:"required"`
		Content       string     `json:"content"`
		MediaURLs     string     `json:"mediaUrls"`
		ScheduledTime *time.Time `json:"scheduledTime"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post := models.SocialPost{
		ID:            uuid.New().String(),
		AccountID:     req.AccountID,
		Platform:      req.Platform,
		Content:       req.Content,
		MediaURLs:     req.MediaURLs,
		ScheduledTime: req.ScheduledTime,
		Status:        "draft",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if req.ScheduledTime != nil {
		post.Status = "scheduled"
	}

	if err := h.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": post})
}

// GetAnalytics returns analytics for a post
func (h *SocialHandler) GetAnalytics(c *gin.Context) {
	// Placeholder
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Analytics not implemented yet"})
}
