package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	gmb "google.golang.org/api/mybusinessaccountmanagement/v1"
	"google.golang.org/api/option"
	"gorm.io/gorm"
)

const (
	// OAuth2 configuration
	googleAuthURL  = "https://accounts.google.com/o/oauth2/auth"
	googleTokenURL = "https://oauth2.googleapis.com/token"
	googleAPIURL   = "https://www.googleapis.com/oauth2/v2/userinfo?access_token="
)

// GMBHandler provides endpoints for Google My Business automation
type GMBHandler struct {
	DB *gorm.DB
}

// GMBAccount represents a connected Google My Business account
type GMBAccount struct {
	gorm.Model
	UserID       string    `json:"user_id" gorm:"index"`
	AccountID    string    `json:"account_id" gorm:"uniqueIndex"`
	AccountName  string    `json:"account_name"`
	LocationID   string    `json:"location_id" gorm:"index"`
	LocationName string    `json:"location_name"`
	AccessToken  string    `json:"-"`
	RefreshToken string    `json:"-"`
	TokenExpiry  time.Time `json:"-"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	LastSyncedAt time.Time `json:"last_synced_at"`
}

// getOAuthConfig returns the OAuth2 configuration
func (h *GMBHandler) getOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GMB_CLIENT_ID"),
		ClientSecret: os.Getenv("GMB_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GMB_REDIRECT_URIS"),
		Scopes: []string{
			"https://www.googleapis.com/auth/business.manage",
		},
		Endpoint: oauth2.Endpoint{
			AuthURL:  os.Getenv("GMB_AUTH_URI"),
			TokenURL: os.Getenv("GMB_TOKEN_URI"),
		},
	}
}

// refreshToken refreshes the access token using the refresh token
func (h *GMBHandler) refreshToken(account *GMBAccount) (*oauth2.Token, error) {
	// Create a token source from the stored refresh token
	token := &oauth2.Token{
		AccessToken:  account.AccessToken,
		RefreshToken: account.RefreshToken,
		Expiry:       account.TokenExpiry,
	}

	// Get OAuth config
	config := h.getOAuthConfig()

	// Create a token source with automatic refresh
	tokenSource := config.TokenSource(context.Background(), token)

	// Get a new token
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %v", err)
	}

	// Update the account with the new tokens
	account.AccessToken = newToken.AccessToken
	account.RefreshToken = newToken.RefreshToken
	account.TokenExpiry = newToken.Expiry

	// Save the updated tokens
	if err := h.DB.Save(account).Error; err != nil {
		return nil, fmt.Errorf("failed to save refreshed tokens: %v", err)
	}

	return newToken, nil
}

func NewGMBHandler(db *gorm.DB) *GMBHandler {
	return &GMBHandler{DB: db}
}

// GetAccount returns basic connection info for the current GMB account
func (h *GMBHandler) GetAccount(c *gin.Context) {
	// Check if gmb_accounts table exists
	if !h.DB.Migrator().HasTable("gmb_accounts") {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"is_connected": false,
				"message":      "GMB account not connected",
			},
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get active account for user
	var account GMBAccount
	err := h.DB.Where("user_id = ? AND is_active = ?", userID, true).First(&account).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data": gin.H{
					"is_connected": false,
					"message":      "No active GMB account found",
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch GMB account: " + err.Error(),
		})
		return
	}

	// Check if token is expired or about to expire (within 5 minutes)
	tokenExpired := time.Now().Add(5 * time.Minute).After(account.TokenExpiry)

	status := "connected"
	if tokenExpired {
		status = "expired"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			// Shape matched to lib/hooks/gmb.ts GMBAccountInfo
			"businessName":   account.AccountName,
			"locationId":     account.LocationID,
			"connectedUser":  "",
			"tokenExpiresAt": account.TokenExpiry.Format(time.RFC3339),
			"status":         status,
		},
	})
}

// GetTrends returns disease/season trends
// InitiateOAuth starts the GMB OAuth flow
func (h *GMBHandler) InitiateOAuth(c *gin.Context) {
	log.Println("InitiateOAuth handler called") // Add this line

	// Generate a random state token
	state := uuid.New().String()

	// Store state in cookie (secure, httpOnly)
	c.SetCookie("gmb_oauth_state", state, 600, "/", "", false, true)

	// Get OAuth config
	oauthConfig := h.getOAuthConfig()

	// Generate the authorization URL
	url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)

	// Frontend expects JSON with authUrl and will handle redirect client-side
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"authUrl": url,
	})
}

// OAuthCallback handles the OAuth callback
func (h *GMBHandler) OAuthCallback(c *gin.Context) {
	// Get the state and code from the query parameters
	state := c.Query("state")
	code := c.Query("code")
	errorMsg := c.Query("error")

	// Check for OAuth errors
	if errorMsg != "" {
		errorDescription := c.Query("error_description")
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "OAuth error: " + errorMsg,
			"details": errorDescription,
		})
		return
	}

	// Verify state parameter matches what we sent
	cookieState, err := c.Cookie("gmb_oauth_state")
	if err != nil || state == "" || state != cookieState {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid state parameter",
		})
		return
	}

	// Clear the state cookie
	c.SetCookie("gmb_oauth_state", "", -1, "/", "", false, true)

	// Get user ID from context (set by auth middleware)
	userIDValue, exists := c.Get("user_id")
	if !exists {
		log.Println("GMB OAuth Error: user_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(string)
	if !ok || userID == "" {
		log.Printf("GMB OAuth Error: user_id is not a valid string. Found: %v", userIDValue)
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid user identifier"})
		return
	}

	// Exchange the authorization code for a token
	oauthConfig := h.getOAuthConfig()
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to exchange token: " + err.Error(),
		})
		return
	}

	// Create a client with the token
	client := oauthConfig.Client(context.Background(), token)

	// Create a new GMB service
	srv, err := gmb.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create GMB service: " + err.Error(),
		})
		return
	}

	// Get account information
	accountsResp, err := srv.Accounts.List().Do()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch GMB accounts: " + err.Error(),
		})
		return
	}

	if len(accountsResp.Accounts) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No GMB accounts found for this user",
		})
		return
	}

	// For simplicity, we'll use the first account
	// In a production app, you might want to let the user choose
	account := accountsResp.Accounts[0]

	// Get location information (optional).
	// NOTE: mybusinessaccountmanagement API does not expose locations directly on the account
	// service in this client; for now we keep these empty and can later wire to the
	// Business Information API if needed.
	var locationID, locationName string

	// Create or update the account in our database
	gmbAccount := GMBAccount{
		UserID:       userID,
		AccountID:    account.Name,
		AccountName:  account.AccountName,
		LocationID:   locationID,
		LocationName: locationName,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenExpiry:  token.Expiry,
		IsActive:     true,
		LastSyncedAt: time.Now(),
	}

	// Check if account already exists
	var existingAccount GMBAccount
	result := h.DB.Where("account_id = ?", account.Name).First(&existingAccount)

	if result.Error == nil {
		// Update existing account
		gmbAccount.ID = existingAccount.ID
		result = h.DB.Save(&gmbAccount)
	} else if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create new account
		result = h.DB.Create(&gmbAccount)
	}

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save GMB account: " + result.Error.Error(),
		})
		return
	}

	// Redirect back to the frontend with success status
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	redirectURL := fmt.Sprintf("%s/social/gmb?connected=true", frontendURL)
	c.Redirect(http.StatusFound, redirectURL)
}

// DisconnectAccount disconnects the current GMB account
func (h *GMBHandler) DisconnectAccount(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get active account for user
	var account GMBAccount
	err := h.DB.Where("user_id = ? AND is_active = ?", userID, true).First(&account).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "No active GMB account found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch GMB account: " + err.Error(),
		})
		return
	}

	// Mark account as inactive
	account.IsActive = false
	if err := h.DB.Save(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to disconnect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully disconnected GMB account",
	})
}

// RefreshToken refreshes the access token for the current GMB account
func (h *GMBHandler) RefreshToken(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get active account for user
	var account GMBAccount
	err := h.DB.Where("user_id = ? AND is_active = ?", userID, true).First(&account).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "No active GMB account found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch GMB account: " + err.Error(),
		})
		return
	}

	// Refresh the token
	newToken, err := h.refreshToken(&account)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to refresh token: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"access_token": newToken.AccessToken,
			"expires_at":   account.TokenExpiry.Format(time.RFC3339),
		},
	})
}

func (h *GMBHandler) GetTrends(c *gin.Context) {
	trends := []map[string]interface{}{
		{
			"disease":           "Dengue",
			"severity":          "high",
			"locations":         []string{"Mumbai", "Delhi", "Chennai"},
			"recommendations":   []string{"Use Eupatorium Perf 30C", "Remove standing water", "Use mosquito nets"},
			"related_products":  []string{"Eupatorium Perf 30C", "Arnica Montana 30C", "Rhus Tox 30C"},
			"trend_this_week":   "increasing",
			"cases_last_week":   1245,
			"percent_change":    15.5,
			"seasonal":          true,
			"season":            "monsoon",
			"prevention_tips":   "Use mosquito repellent, wear full sleeves, keep surroundings clean",
			"home_remedies":     "Take Eupatorium Perf 30C, 4 pills twice daily as preventive",
			"official_guidance": "As per National Health Portal guidelines",
		},
		{
			"disease":           "Common Cold",
			"severity":          "moderate",
			"locations":         []string{"All regions"},
			"recommendations":   []string{"Use Aconite 30C", "Stay warm", "Drink warm fluids"},
			"related_products":  []string{"Aconite 30C", "Arsenicum Album 30C", "Belladonna 30C"},
			"trend_this_week":   "stable",
			"cases_last_week":   3567,
			"percent_change":    2.3,
			"seasonal":          true,
			"season":            "winter",
			"prevention_tips":   "Dress warmly, avoid cold drinks, use Aconite 30C as preventive",
			"home_remedies":     "Ginger tea with honey, steam inhalation",
			"official_guidance": "Rest and hydration recommended",
		},
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": trends})
}

// GetSchedules returns current scheduler configuration
func (h *GMBHandler) GetSchedules(c *gin.Context) {
	// Default schedule
	schedule := map[string]interface{}{
		"daily":          false,
		"weekly":         false,
		"monthly":        false,
		"diseaseBased":   false,
		"seasonalPreset": "none",
		"cronExpression": "",
		"nextRunAt":      nil,
	}

	// Check if gmb_schedules table exists
	if h.DB.Migrator().HasTable("gmb_schedules") {
		var dbSchedule struct {
			ScheduleType   string     `gorm:"column:schedule_type"`
			TimeOfDay      string     `gorm:"column:time_of_day"`
			DayOfWeek      *int       `gorm:"column:day_of_week"`
			DayOfMonth     *int       `gorm:"column:day_of_month"`
			SeasonalPreset *string    `gorm:"column:seasonal_preset"`
			NextRunAt      *time.Time `gorm:"column:next_run_at"`
		}

		err := h.DB.Table("gmb_schedules").
			Select("schedule_type, time_of_day, day_of_week, day_of_month, seasonal_preset, next_run_at").
			Where("is_active = ?", true).
			First(&dbSchedule).Error

		if err == nil {
			schedule["nextRunAt"] = dbSchedule.NextRunAt
			if dbSchedule.SeasonalPreset != nil {
				schedule["seasonalPreset"] = *dbSchedule.SeasonalPreset
			}
			// Set schedule type flags
			switch dbSchedule.ScheduleType {
			case "DAILY":
				schedule["daily"] = true
			case "WEEKLY":
				schedule["weekly"] = true
			case "MONTHLY":
				schedule["monthly"] = true
			case "SEASONAL":
				schedule["daily"] = false
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedule,
	})
}

// UpdateSchedules updates scheduler configuration
func (h *GMBHandler) UpdateSchedules(c *gin.Context) {
	var req struct {
		Daily      bool    `json:"daily"`
		Weekly     bool    `json:"weekly"`
		Monthly    bool    `json:"monthly"`
		TimeOfDay  string  `json:"time_of_day"`
		DayOfWeek  *int    `json:"day_of_week"`
		DayOfMonth *int    `json:"day_of_month"`
		Seasonal   *string `json:"seasonal_preset"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body: " + err.Error(),
		})
		return
	}

	// Determine schedule type
	var scheduleType string
	switch {
	case req.Daily:
		scheduleType = "DAILY"
	case req.Weekly:
		scheduleType = "WEEKLY"
	case req.Monthly:
		scheduleType = "MONTHLY"
	case req.Seasonal != nil:
		scheduleType = "SEASONAL"
	default:
		scheduleType = "MANUAL"
	}

	// In a real implementation, we would save this to the database
	// For now, just return success and echo back the resolved schedule type
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Schedule updated successfully",
		"data": gin.H{
			"schedule_type": scheduleType,
			"payload":       req,
		},
	})
}

// GetHistory returns post history
func (h *GMBHandler) GetHistory(c *gin.Context) {
	var history []map[string]interface{}

	// Check if gmb_posts table exists
	if h.DB.Migrator().HasTable("gmb_posts") {
		h.DB.Table("gmb_posts").
			Select("id, title, status, scheduled_for, published_at, created_at").
			Order("created_at DESC").
			Limit(50).
			Find(&history)
	}

	// If no history in database, return sample data
	if len(history) == 0 {
		now := time.Now()
		history = []map[string]interface{}{
			{
				"id":           uuid.New().String(),
				"title":        "Sample Post 1",
				"status":       "PUBLISHED",
				"published_at": now.Add(-24 * time.Hour),
				"created_at":   now.Add(-25 * time.Hour),
			},
			{
				"id":            uuid.New().String(),
				"title":         "Sample Post 2",
				"status":        "SCHEDULED",
				"scheduled_for": now.Add(24 * time.Hour),
				"created_at":    now.Add(-1 * time.Hour),
			},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    history,
	})
}

// GeneratePost generates a new post using AI
func (h *GMBHandler) GeneratePost(c *gin.Context) {
	var req struct {
		Topic  string `json:"topic"`
		Preset string `json:"preset"`
		Tone   string `json:"tone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	if req.Topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Topic is required",
		})
		return
	}

	// In a real implementation, this would call OpenAI API
	// For now, return a generated post
	post := map[string]interface{}{
		"id":      uuid.New().String(),
		"title":   fmt.Sprintf("Homeopathy Tips for %s", req.Topic),
		"content": fmt.Sprintf("This is a sample post about %s. In a real implementation, this would be generated by AI based on the topic, preset, and tone.", req.Topic),
		"status":  "DRAFT",
		"preset":  req.Preset,
		"tone":    req.Tone,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    post,
	})
}

// ValidatePost validates a post for GMB guidelines
func (h *GMBHandler) ValidatePost(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// In a real implementation, this would validate against GMB guidelines
	// For now, return a mock validation result
	warnings := []string{}
	success := true

	// Simple validation rules
	if len(req.Title) < 10 {
		warnings = append(warnings, "Title is too short (minimum 10 characters)")
		success = false
	}

	if len(req.Content) < 50 {
		warnings = append(warnings, "Content is too short (minimum 50 characters)")
		success = false
	}

	if len(req.Content) > 1500 {
		warnings = append(warnings, "Content is too long (maximum 1500 characters)")
		success = false
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  success,
		"warnings": warnings,
	})
}

// PostToGMB creates a new post in GMB
func (h *GMBHandler) PostToGMB(c *gin.Context) {
	var req struct {
		Title       string    `json:"title"`
		Content     string    `json:"content"`
		ScheduledAt time.Time `json:"scheduled_at,omitempty"`
		// ScheduleType is currently not used but kept for future implementation
		// ScheduleType string   `json:"schedule_type,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// In a real implementation, this would post to GMB API
	// For now, return a success response with a mock post ID
	postID := uuid.New().String()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":           postID,
			"title":        req.Title,
			"scheduled_at": req.ScheduledAt,
			"status":       "SCHEDULED",
			"message":      "Post scheduled successfully",
		},
	})
}

// GetSuggestions returns post suggestions
func (h *GMBHandler) GetSuggestions(c *gin.Context) {
	suggestions := []string{
		"Monsoon health tips for the family",
		"Homeopathic first aid for common summer ailments",
		"Boosting immunity naturally with homeopathy",
		"Managing stress and anxiety with homeopathic remedies",
		"Seasonal allergies and homeopathic solutions",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    suggestions,
	})
}
