package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type GMBAnalyticsHandler struct {
	DB               *gorm.DB
	AnalyticsService *services.GMBAnalyticsService
	AIService        *services.GMBAIService
}

func NewGMBAnalyticsHandler(db *gorm.DB) *GMBAnalyticsHandler {
	return &GMBAnalyticsHandler{
		DB:               db,
		AnalyticsService: services.NewGMBAnalyticsService(db),
		AIService:        services.NewGMBAIService(os.Getenv("OPENAI_API_KEY")),
	}
}

func (h *GMBAnalyticsHandler) GetAnalytics(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get active account for user
	var account models.GMBAccount
	if err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active GMB account found"})
		return
	}

	groupBy := c.Query("groupBy")

	switch groupBy {
	case "category":
		stats, err := h.AnalyticsService.GroupByCategory(account.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": stats})

	case "month":
		stats, err := h.AnalyticsService.GroupByMonth(account.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": stats})

	case "subcategory":
		stats, err := h.AnalyticsService.GroupBySubCategory(account.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": stats})

	case "missing":
		missing, err := h.AnalyticsService.GetMissingCategories(account.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": missing})

	case "ai":
		missing, err := h.AnalyticsService.GetMissingCategories(account.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Limit to top 5 to avoid token limits
		if len(missing) > 5 {
			missing = missing[:5]
		}

		suggestions, err := h.AIService.GenerateSuggestions(missing)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": suggestions})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid groupBy parameter. Use: category, subcategory, month, missing, ai"})
	}
}

// BatchCategorize categorizes all posts that have missing categories
func (h *GMBAnalyticsHandler) BatchCategorize(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get active account for user
	var account models.GMBAccount
	if err := h.DB.Where("created_by = ? AND is_active = ?", userID, true).First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active GMB account found"})
		return
	}

	// Find posts with empty category
	var posts []models.GMBPost
	if err := h.DB.Where("gmb_account_id = ? AND (category = '' OR category IS NULL)", account.ID).Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts: " + err.Error()})
		return
	}

	updatedCount := 0
	for _, post := range posts {
		result, err := h.AIService.CategorizePost(post.Content)
		if err == nil {
			post.Category = result.MainCategory
			post.SubCategory = result.SubCategory
			post.Brand = result.Brand
			post.Purpose = result.Purpose

			// Save updates
			h.DB.Save(&post)
			updatedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"updated": updatedCount,
		"status":  "categories applied",
	})
}
