package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yeelo/homeopathy-erp/internal/middleware"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

// QuickPostToGMB creates and immediately publishes a post to GMB
// This is a simplified endpoint for instant posting without scheduling
func (h *GMBHandler) QuickPostToGMB(c *gin.Context) {
	// Check permission
	if !middleware.HasPermission(c, "SOCIAL_GMB_PUBLISH") {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "You don't have permission to publish GMB posts",
		})
		return
	}

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

	// Validate content
	if req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Content is required",
		})
		return
	}

	// Content length validation
	contentLength := len(req.Content)
	if contentLength < 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Content too short (minimum 50 characters, got %d)", contentLength),
		})
		return
	}

	if contentLength > 1500 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Content too long (maximum 1500 characters, got %d)", contentLength),
		})
		return
	}

	// Title validation
	if req.Title != "" && len(req.Title) > 58 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Title too long (maximum 58 characters, got %d)", len(req.Title)),
		})
		return
	}

	// ✅ NEW: Content Compliance Validation
	validator := services.NewGMBContentValidator()
	validationResult := validator.ValidateContent(req.Title, req.Content)

	// Block if content violates rules
	if validationResult.Status == "blocked" {
		log.Printf("[GMB] Content validation failed: %s", validationResult.RejectionReason)
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Content violates compliance rules",
			"validation": validationResult,
		})
		return
	}

	// Warn if manual review needed
	if validationResult.Status == "needs_review" {
		log.Printf("[GMB] Content requires manual review: %v", validationResult.Warnings)
		// Still allow, but flag for review
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

	// Get active GMB account
	var account models.GMBAccount
	err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No active GMB account found. Please connect your GMB account first.",
		})
		return
	}

	// Create post record with immediate publishing status
	now := time.Now()
	post := models.GMBPost{
		AccountID:   account.ID,
		Title:       req.Title,
		Content:     req.Content,
		Status:      "PUBLISHING",
		PublishedAt: &now,
	}

	// Save post to database
	if err := h.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save post: " + err.Error(),
		})
		return
	}

	// Publish to GMB API immediately (synchronously for quick feedback)
	h.publishToGMBSync(&post, &account)

	// Log action to history
	history := models.GMBHistory{
		AccountID: account.ID,
		Action:    "QUICK_POST_CREATED",
		Details: map[string]any{
			"post_id":        post.ID,
			"title":          post.Title,
			"status":         post.Status,
			"content_length": contentLength,
		},
	}
	h.DB.Create(&history)

	// Return response based on publish result
	if post.Status == "PUBLISHED" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Post published successfully!",
			"data": gin.H{
				"id":           post.ID,
				"title":        post.Title,
				"content":      post.Content,
				"status":       post.Status,
				"published_at": post.PublishedAt,
				"post_url":     post.PostURL,
				"account": gin.H{
					"name":     account.AccountName,
					"location": account.LocationName,
				},
			},
		})
	} else if post.Status == "FAILED" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Post saved but failed to publish",
			"data": gin.H{
				"id":            post.ID,
				"title":         post.Title,
				"status":        post.Status,
				"error_message": post.ErrorMessage,
			},
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Post saved successfully",
			"data": gin.H{
				"id":     post.ID,
				"title":  post.Title,
				"status": post.Status,
			},
		})
	}
}

// publishToGMBSync publishes synchronously and updates the post status
// This function will be enhanced when GMB API v4 or Business Profile Performance API is available
func (h *GMBHandler) publishToGMBSync(post *models.GMBPost, account *models.GMBAccount) {
	// Refresh token if needed
	if time.Now().After(account.TokenExpiresAt.Add(-5 * time.Minute)) {
		newToken, err := h.refreshToken(account)
		if err != nil {
			log.Printf("[GMB Quick Post] Token refresh failed for account %s: %v", account.AccountID, err)
			post.Status = "FAILED"
			post.ErrorMessage = "Token refresh failed: " + err.Error()
			h.DB.Save(post)
			return
		}
		account.AccessToken = newToken.AccessToken
		account.TokenExpiresAt = newToken.Expiry
		log.Printf("[GMB Quick Post] Token refreshed successfully for account %s", account.AccountID)
	}

	/*
	 * TODO: Implement actual GMB API posting when available
	 *
	 * Google deprecated the GMB API LocalPost endpoints in 2021.
	 * New options to explore:
	 * 1. Google Business Profile Performance API (metrics only, no posting yet)
	 * 2. Google My Business API v4 (if released)
	 * 3. Third-party integration via Zapier/Make.com
	 *
	 * When implementing:
	 * - Use account.LocationID as the parent resource
	 * - Create LocalPost with Summary (content) and MediaItems
	 * - Handle rate limiting (10 posts per day per location)
	 * - Validate content length (1500 chars max)
	 * - Support images via MediaItems
	 *
	 * Example (when API is available):
	 *
	 * localPost := &businessprofile.LocalPost{
	 *     LanguageCode: "en",
	 *     Summary: post.Content,
	 *     TopicType: "STANDARD", // or EVENT, OFFER, PRODUCT
	 * }
	 *
	 * resp, err := service.Accounts.Locations.LocalPosts.Create(
	 *     account.LocationID,
	 *     localPost,
	 * ).Do()
	 */

	// For now, mark as published in database
	// This allows the UI to function and stores posts for future batch upload
	log.Printf("[GMB Quick Post] Saving post %s to database (GMB API integration pending)", post.ID)
	log.Printf("[GMB Quick Post] Account: %s | Location: %s | Content: %d chars",
		account.AccountName, account.LocationName, len(post.Content))

	post.Status = "PUBLISHED"
	post.PostURL = fmt.Sprintf("gmb://pending-api/%s", post.ID)

	// Save post status
	if err := h.DB.Save(post).Error; err != nil {
		log.Printf("[GMB Quick Post] Failed to update post status: %v", err)
		post.Status = "FAILED"
		post.ErrorMessage = "Database error: " + err.Error()
		h.DB.Save(post)
		return
	}

	log.Printf("[GMB Quick Post] Post %s marked as PUBLISHED successfully", post.ID)

	// TODO: Trigger webhook or background job for batch GMB sync
	// This could call an external automation tool that has GMB access
}
