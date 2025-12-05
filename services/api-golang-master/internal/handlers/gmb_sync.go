package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"golang.org/x/oauth2"
)

// SyncGMBPosts pulls all posts from GMB and stores in local database
func (h *GMBHandler) SyncGMBPosts(c *gin.Context) {
	// Get connected GMB account from database
	var account models.GMBAccount
	if err := h.DB.Where("is_active = ?", true).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No active GMB account found. Please connect your GMB account first.",
		})
		return
	}

	// Check if token needs refresh
	if time.Now().After(account.TokenExpiresAt) {
		token, err := h.refreshToken(&account)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Failed to refresh GMB token. Please reconnect your account.",
			})
			return
		}
		account.AccessToken = token.AccessToken
	}

	// Create HTTP client with token
	config := h.getOAuthConfig()
	token := &oauth2.Token{
		AccessToken:  account.AccessToken,
		RefreshToken: account.RefreshToken,
		Expiry:       account.TokenExpiresAt,
	}
	client := config.Client(context.Background(), token)

	// Get location ID
	locationID := account.LocationID
	if locationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Account has no Location ID. Please reconnect.",
		})
		return
	}

	// Fetch posts from GMB using raw HTTP request to v4 API
	// Note: Even though v4 is deprecated, it's often still the endpoint for Posts until fully migrated to new Business Profile APIs
	// We will try the v4 endpoint. If it fails, we might need to look for the specific new API endpoint.
	// URL: https://mybusiness.googleapis.com/v4/{parent}/localPosts
	// Parent should be: accounts/{accountId}/locations/{locationId}
	// DB values already include prefixes "accounts/" and "locations/"
	parent := fmt.Sprintf("%s/%s", account.AccountID, account.LocationID)

	var allPosts []map[string]interface{}
	pageToken := ""

	for {
		url := fmt.Sprintf("https://mybusiness.googleapis.com/v4/%s/localPosts?pageSize=100", parent)
		if pageToken != "" {
			url += "&pageToken=" + pageToken
		}

		log.Printf("Calling GMB API: %s", url) // Debug log

		resp, err := client.Get(url)
		if err != nil {
			log.Printf("Failed to fetch GMB posts: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call GMB API"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(resp.Body)
			log.Printf("GMB API Error: %s", string(bodyBytes))
			// If v4 fails, we might return partial success or error
			// For now, let's break and process what we have or return error
			if len(allPosts) == 0 {
				c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("GMB API returned error: %s", string(bodyBytes))})
				return
			}
			break
		}

		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			break
		}

		if posts, ok := result["localPosts"].([]interface{}); ok {
			for _, p := range posts {
				if postMap, ok := p.(map[string]interface{}); ok {
					allPosts = append(allPosts, postMap)
				}
			}
		}

		if token, ok := result["nextPageToken"].(string); ok && token != "" {
			pageToken = token
		} else {
			break
		}
	}

	// Store posts in database
	syncedCount := 0
	for _, gmbPost := range allPosts {
		postName, _ := gmbPost["name"].(string) // Format: accounts/.../locations/.../localPosts/...
		if postName == "" {
			continue
		}

		// Check if post already exists
		var existingPost models.GMBPost
		result := h.DB.Where("post_url = ?", postName).First(&existingPost)

		if result.Error != nil {
			// Create new post
			summary, _ := gmbPost["summary"].(string)
			createTimeStr, _ := gmbPost["createTime"].(string)

			// Handle event title if summary is empty
			if summary == "" {
				if event, ok := gmbPost["event"].(map[string]interface{}); ok {
					summary, _ = event["title"].(string)
				}
			}

			if summary == "" {
				summary = "GMB Post"
			}

			// Parse time
			var publishedAt *time.Time
			if t, err := time.Parse(time.RFC3339, createTimeStr); err == nil {
				publishedAt = &t
			} else {
				now := time.Now()
				publishedAt = &now
			}

			post := models.GMBPost{
				AccountID:   account.ID,
				Title:       truncateString(summary, 100),
				Content:     summary,
				Status:      "PUBLISHED",
				PublishedAt: publishedAt,
				PostURL:     postName,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}

			if err := h.DB.Create(&post).Error; err == nil {
				syncedCount++

				// Trigger AI categorization for the new post
				go func(p models.GMBPost) {
					// Create a new service instance since we are in a goroutine
					aiService := services.NewGMBAIService(os.Getenv("OPENAI_API_KEY"))
					result, err := aiService.CategorizePost(p.Content)
					if err == nil {
						p.Category = result.MainCategory
						p.SubCategory = result.SubCategory
						p.Brand = result.Brand
						p.Purpose = result.Purpose
						h.DB.Save(&p)
					}
				}(post)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     fmt.Sprintf("Synced %d posts from GMB", syncedCount),
		"total_posts": len(allPosts),
		"synced":      syncedCount,
	})
}

func truncateString(s string, max int) string {
	if len(s) > max {
		return s[:max]
	}
	return s
}
