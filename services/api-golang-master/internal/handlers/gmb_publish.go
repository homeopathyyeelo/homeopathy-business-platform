package handlers

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/yeelo/homeopathy-erp/internal/automation"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

// Global browser automation instance (reused across requests)
var browserAutomation *automation.GMBBrowserAutomation

// InitBrowserAutomation initializes the browser for GMB posting
func InitBrowserAutomation() {
	browserAutomation = automation.NewGMBBrowserAutomation()
	log.Println("✅ GMB Browser automation initialized")
}

// CloseBrowserAutomation closes the browser
func CloseBrowserAutomation() {
	if browserAutomation != nil {
		browserAutomation.Close()
	}
}

// publishToGMB publishes a post to Google My Business using browser automation
func (h *GMBHandler) publishToGMB(post *models.GMBPost, account *models.GMBAccount) {
	log.Printf("[GMB Publish] Starting browser automation for post %d", post.ID)

	// Get credentials from env
	email := os.Getenv("GMB_EMAIL")
	password := os.Getenv("GMB_PASSWORD")

	if email == "" || password == "" {
		log.Printf("[GMB Publish] Missing GMB_EMAIL or GMB_PASSWORD in environment")
		post.Status = "FAILED"
		post.ErrorMessage = "GMB credentials not configured in environment variables"
		h.DB.Save(post)
		return
	}

	// Initialize browser if not already done
	if browserAutomation == nil {
		InitBrowserAutomation()
	}

	// Create the post via browser automation
	err := browserAutomation.CreatePost(email, password, post.Title, post.Content)
	if err != nil {
		log.Printf("[GMB Publish] Browser automation failed: %v", err)
		post.Status = "FAILED"
		post.ErrorMessage = fmt.Sprintf("Browser automation error: %v", err)
		h.DB.Save(post)
		return
	}

	// Update post as published
	post.Status = "PUBLISHED"
	publishedAt := time.Now()
	post.PublishedAt = &publishedAt
	post.PostURL = "https://business.google.com"

	if err := h.DB.Save(post).Error; err != nil {
		log.Printf("[GMB Publish] Failed to update post status: %v", err)
	}

	// Log to history
	history := models.GMBHistory{
		AccountID: account.ID,
		Action:    "POST_PUBLISHED",
		Details: map[string]any{
			"post_id": post.ID,
			"title":   post.Title,
			"status":  post.Status,
			"method":  "browser_automation",
		},
	}
	h.DB.Create(&history)

	log.Printf("[GMB Publish] Post %d published successfully via browser automation", post.ID)
}
