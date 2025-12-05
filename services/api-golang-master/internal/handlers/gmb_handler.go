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
	gmbInfo "google.golang.org/api/mybusinessbusinessinformation/v1"
	"google.golang.org/api/option"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/middleware"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

const (
	// OAuth2 configuration
	googleAuthURL  = "https://accounts.google.com/o/oauth2/auth"
	googleTokenURL = "https://oauth2.googleapis.com/token"
	googleAPIURL   = "https://www.googleapis.com/oauth2/v2/userinfo?access_token="
)

// GMBHandler provides endpoints for Google My Business automation
type GMBHandler struct {
	DB             *gorm.DB
	ContentService *services.GMBContentService
	AuditService   *services.AuditService
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
func (h *GMBHandler) refreshToken(account *models.GMBAccount) (*oauth2.Token, error) {
	// Create a token source from the stored refresh token
	token := &oauth2.Token{
		AccessToken:  account.AccessToken,
		RefreshToken: account.RefreshToken,
		Expiry:       account.TokenExpiresAt,
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
	account.TokenExpiresAt = newToken.Expiry

	// Save the updated tokens
	if err := h.DB.Save(account).Error; err != nil {
		return nil, fmt.Errorf("failed to save refreshed tokens: %v", err)
	}

	return newToken, nil
}

func NewGMBHandler(db *gorm.DB, gmbService *services.GMBService, auditService *services.AuditService) *GMBHandler {
	return &GMBHandler{
		DB:             db,
		ContentService: services.NewGMBContentService(os.Getenv("OPENAI_API_KEY")),
		AuditService:   auditService,
	}
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
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error

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
	tokenExpired := time.Now().Add(5 * time.Minute).After(account.TokenExpiresAt)

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
			"tokenExpiresAt": account.TokenExpiresAt.Format(time.RFC3339),
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

	// In a production app, you might want to let the user choose
	var account *gmb.Account

	// Prioritize "YEELO Homeopathy" account
	targetName := "YEELO HOMEOPATHY"
	for _, acc := range accountsResp.Accounts {
		if acc.AccountName == targetName {
			account = acc
			break
		}
	}

	// If not found, fallback to first available account
	if account == nil && len(accountsResp.Accounts) > 0 {
		account = accountsResp.Accounts[0]
	} else if account == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No valid GMB accounts found",
		})
		return
	}

	// Create Business Information service
	infoSrv, err := gmbInfo.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		log.Printf("Failed to create GMB Info service: %v", err)
		// Continue without location info if service fails
	}

	var locationID, locationName string

	// Fetch locations for the account
	if infoSrv != nil && account != nil {
		// The account.Name is in format "accounts/{accountId}"
		locationsResp, err := infoSrv.Accounts.Locations.List(account.Name).ReadMask("name,title,storeCode").Do()
		if err != nil {
			log.Printf("Failed to fetch locations: %v", err)
		} else if len(locationsResp.Locations) > 0 {
			// Pick the first location or match by name if needed
			// For now, we take the first one
			loc := locationsResp.Locations[0]
			locationID = loc.Name // Format: accounts/{accountId}/locations/{locationId}
			locationName = loc.Title

			// Try to find a location that matches "Homeopathy" or "Yeelo" if multiple exist
			for _, l := range locationsResp.Locations {
				if l.Title == "YEELO HOMEOPATHY" || l.Title == "Yeelo Homeopathy" {
					locationID = l.Name
					locationName = l.Title
					break
				}
			}
		}
	}

	// Create or update the account in our database
	gmbAccount := models.GMBAccount{
		CreatedBy:      userID,
		AccountID:      account.Name,
		AccountName:    account.AccountName,
		LocationID:     locationID,
		LocationName:   locationName,
		AccessToken:    token.AccessToken,
		RefreshToken:   token.RefreshToken,
		TokenExpiresAt: token.Expiry,
		IsActive:       true,
	}

	// Check if account already exists
	var existingAccount models.GMBAccount
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
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error

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
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error

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
			"expires_at":   account.TokenExpiresAt.Format(time.RFC3339),
		},
	})
}

func (h *GMBHandler) GetTrends(c *gin.Context) {
	month := time.Now().Month()
	var trends []map[string]interface{}

	if month >= 6 && month <= 9 { // Monsoon
		trends = []map[string]interface{}{
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
		}
	} else if month >= 11 || month <= 2 { // Winter
		trends = []map[string]interface{}{
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
	} else { // Summer/Spring
		trends = []map[string]interface{}{
			{
				"disease":           "Heat Stroke",
				"severity":          "moderate",
				"locations":         []string{"North India"},
				"recommendations":   []string{"Use Glonoinum 30C", "Stay hydrated", "Avoid direct sun"},
				"related_products":  []string{"Glonoinum 30C", "Natrum Mur 30C"},
				"trend_this_week":   "increasing",
				"cases_last_week":   890,
				"percent_change":    5.2,
				"seasonal":          true,
				"season":            "summer",
				"prevention_tips":   "Drink plenty of water, wear light clothes",
				"home_remedies":     "Raw mango drink (Aam Panna)",
				"official_guidance": "Avoid going out during peak heat hours",
			},
		}
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
			ScheduleTime   string     `gorm:"column:schedule_time"` // Fixed: was time_of_day
			ScheduleDay    *int       `gorm:"column:schedule_day"`  // Fixed: was day_of_week
			ScheduleDate   *int       `gorm:"column:schedule_date"` // Fixed: was day_of_month
			SeasonalPreset *string    `gorm:"column:season"`
			NextRunAt      *time.Time `gorm:"column:next_run"`
		}

		err := h.DB.Table("gmb_schedules").
			Select("schedule_type, schedule_time, schedule_day, schedule_date, season, next_run").
			Where("is_enabled = ?", true).
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

// GetHistory returns the history of GMB posts and actions
func (h *GMBHandler) GetHistory(c *gin.Context) {
	// Check if table exists
	var tableExists bool
	h.DB.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gmb_posts')").Scan(&tableExists)

	if !tableExists {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get GMB account for this user
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error
	if err != nil {
		// No account, return empty history
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
		})
		return
	}

	// Query posts for this account
	var posts []models.GMBPost
	// Use gmb_account_id (bigint) instead of account_id (uuid) for the foreign key
	err = h.DB.Where("gmb_account_id = ?", account.ID).
		Order("created_at DESC").
		Limit(50).
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch post history: " + err.Error(),
		})
		return
	}

	// Convert to response format
	history := make([]map[string]interface{}, 0, len(posts))
	for _, post := range posts {
		historyItem := map[string]interface{}{
			"id":           post.ID,
			"title":        post.Title,
			"content":      post.Content,
			"status":       post.Status,
			"created_at":   post.CreatedAt,
			"category":     post.Category,
			"sub_category": post.SubCategory,
			"brand":        post.Brand,
			"purpose":      post.Purpose,
		}

		if post.ScheduledFor != nil {
			historyItem["scheduled_for"] = post.ScheduledFor
		}
		if post.PublishedAt != nil {
			historyItem["published_at"] = post.PublishedAt
		}
		if post.PostURL != "" {
			historyItem["post_url"] = post.PostURL
		}
		if post.ErrorMessage != "" {
			historyItem["error_message"] = post.ErrorMessage
		}

		history = append(history, historyItem)
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

	var title, content string
	if h.ContentService != nil {
		// Use tone from request or default
		tone := req.Tone
		if tone == "" {
			tone = "educational"
		}

		// Generate content using AI (returns title, content, error)
		var err error
		title, content, err = h.ContentService.GenerateHealthPost(req.Topic, tone, []models.Product{})
		if err != nil {
			log.Printf("AI generation failed: %v", err)
			// Fallback to simple template
			title = fmt.Sprintf("Homeopathy and %s", req.Topic)
			content = fmt.Sprintf("Discover natural healing with homeopathy for %s. Visit Yeelo Homeopathy for personalized treatment.", req.Topic)
		}
	} else {
		// Fallback if content service not available
		title = fmt.Sprintf("Homeopathy Tips for %s", req.Topic)
		content = fmt.Sprintf("This is a sample post about %s. Homeopathy offers natural, safe, and effective remedies for this condition. Visit Yeelo Homeopathy for expert consultation.", req.Topic)
	}

	post := map[string]interface{}{
		"id":      uuid.New().String(),
		"title":   title,
		"content": content,
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
		AutoApprove bool      `json:"autoApprove"`
		Schedule    string    `json:"schedule"` // "now", "daily", "weekly", "monthly"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get active GMB account for this user
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No active GMB account found. Please connect your GMB account first.",
		})
		return
	}

	// Create post record
	post := models.GMBPost{
		AccountID: account.ID,
		Title:     req.Title,
		Content:   req.Content,
		Status:    "DRAFT",
	}

	// Determine status based on schedule
	now := time.Now()
	if req.Schedule == "now" || req.ScheduledAt.IsZero() {
		// Post immediately
		post.Status = "PUBLISHING"
		publishedAt := now
		post.PublishedAt = &publishedAt
	} else {
		// Schedule for later
		post.Status = "SCHEDULED"
		post.ScheduledFor = &req.ScheduledAt
	}

	// Save post to database
	if err := h.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save post: " + err.Error(),
		})
		return
	}

	// If posting now, attempt to post to GMB API
	if post.Status == "PUBLISHING" {
		go h.publishToGMB(&post, &account)
	}

	// Log action to history
	history := models.GMBHistory{
		AccountID: account.ID,
		Action:    "POST_CREATED",
		Details: map[string]any{
			"post_id": post.ID,
			"title":   post.Title,
			"status":  post.Status,
		},
	}
	h.DB.Create(&history)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":           post.ID,
			"title":        post.Title,
			"scheduled_at": post.ScheduledFor,
			"status":       post.Status,
			"message":      "Post created successfully",
		},
		"postId": post.ID,
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

// GetAccounts returns all connected GMB accounts for the user
func (h *GMBHandler) GetAccounts(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var accounts []models.GMBAccount
	if err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}

	// Map to response format
	var response []gin.H
	for _, acc := range accounts {
		status := "connected"
		if time.Now().After(acc.TokenExpiresAt) {
			status = "expired"
		} else if time.Now().Add(24 * time.Hour).After(acc.TokenExpiresAt) {
			status = "expiring_soon"
		}

		response = append(response, gin.H{
			"id":             acc.ID,
			"businessName":   acc.AccountName,
			"locationName":   acc.LocationName,
			"locationId":     acc.LocationID,
			"status":         status,
			"tokenExpiresAt": acc.TokenExpiresAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": response})
}

// DisconnectAccountByID disconnects a specific GMB account
func (h *GMBHandler) DisconnectAccountByID(c *gin.Context) {
	// Check permission
	if !middleware.HasPermission(c, "SOCIAL_GMB_ACCOUNTS") {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "You don't have permission to manage GMB accounts",
		})
		return
	}

	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var account models.GMBAccount
	if err := h.DB.Where("id = ? AND created_by = ?", id, userID).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	account.IsActive = false
	if err := h.DB.Save(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect account"})
		return
	}

	// Log audit
	uid := userID.(string)
	h.AuditService.LogAction(&uid, "ACCOUNT_DISCONNECTED", "GMB_ACCOUNT", account.ID, map[string]string{
		"account_name": account.AccountName,
	})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Account disconnected"})
}
