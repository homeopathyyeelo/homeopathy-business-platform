package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type SocialHandler struct {
	DB        *gorm.DB
	aiService *services.MarketingAIService
}

func NewSocialHandler(db *gorm.DB, aiService *services.MarketingAIService) *SocialHandler {
	return &SocialHandler{
		DB:        db,
		aiService: aiService,
	}
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
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": account})
}

// GetPosts returns all social posts
func (h *SocialHandler) GetPosts(c *gin.Context) {
	var posts []models.SocialPost
	if err := h.DB.Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": posts})
}

// CreatePost creates a new social post
func (h *SocialHandler) CreatePost(c *gin.Context) {
	var req struct {
		AccountID     string     `json:"accountId" binding:"required"`
		Platform      string     `json:"platform" binding:"required"`
		Content       string     `json:"content" binding:"required"`
		MediaURLs     []string   `json:"mediaUrls"`
		ScheduledTime *time.Time `json:"scheduledTime"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mediaURLsJSON, _ := json.Marshal(req.MediaURLs)

	post := models.SocialPost{
		ID:            uuid.New().String(),
		AccountID:     req.AccountID,
		Platform:      req.Platform,
		Content:       req.Content,
		MediaURLs:     string(mediaURLsJSON),
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

// SocialPostRequest represents the unified posting request
type SocialPostRequest struct {
	Content   string   `json:"content"`
	Platforms []string `json:"platforms"`
	MediaURL  string   `json:"media_url"`
}

// forwardToEndpoint sends the payload to a specific local/remote endpoint
func forwardToEndpoint(endpoint string, payload []byte) (*http.Response, error) {
	req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	return client.Do(req)
}

// MultiPost handles posting to multiple social platforms
func (h *SocialHandler) MultiPost(c *gin.Context) {
	var req SocialPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Configuration for platform endpoints (should ideally be in config/env)
	platformsEndpoints := map[string]string{
		"instagram": "http://localhost:3000/social/instagram",
		"facebook":  "http://localhost:3000/social/facebook",
		"youtube":   "http://localhost:3000/social/youtube",
		"gmb":       "http://localhost:3000/social/gmb/content", // Or our new automate endpoint
		"whatsapp":  "http://localhost:3000/marketing/whatsapp",
	}

	payload, _ := json.Marshal(req)
	results := make(map[string]string)

	for _, p := range req.Platforms {
		endpoint, ok := platformsEndpoints[p]
		if !ok {
			results[p] = "skipped: unknown platform"
			continue
		}

		resp, err := forwardToEndpoint(endpoint, payload)
		if err != nil {
			results[p] = "error: " + err.Error()
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		results[p] = string(body)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"results": results,
	})
}

// GenerateAIContent proxies requests to an AI service
func (h *SocialHandler) GenerateAIContent(c *gin.Context) {
	var req struct {
		Prompt string `json:"prompt"`
		Topic  string `json:"topic"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	aiResponse, err := h.aiService.GenerateSocialContent(req.Prompt, req.Topic)
	if err != nil {
		// Fallback or error
		aiResponse = "Error generating content: " + err.Error()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"content": aiResponse,
	})
}

// GetAnalytics returns analytics for a post
func (h *SocialHandler) GetAnalytics(c *gin.Context) {
	// Placeholder
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Analytics not implemented yet"})
}
