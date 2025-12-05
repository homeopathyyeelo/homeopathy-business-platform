package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

// GetPostsHistory returns paginated GMB posts with filters
func (h *GMBHandler) GetPostsHistory(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	// Parse filter parameters
	status := c.Query("status")      // "PUBLISHED", "FAILED", "PENDING"
	dateFrom := c.Query("date_from") // ISO date string
	dateTo := c.Query("date_to")     // ISO date string
	search := c.Query("search")      // Search in title/content

	// Build query
	query := h.DB.Model(&models.GMBPost{})

	// Filter by user's GMB accounts
	var userAccounts []models.GMBAccount
	h.DB.Where("created_by = ?", userID).Find(&userAccounts)

	if len(userAccounts) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"posts": []models.GMBPost{},
				"total": 0,
				"page":  page,
				"limit": limit,
				"pages": 0,
			},
		})
		return
	}

	// Join with gmb_accounts to filter by user's accounts
	query = query.Joins("JOIN gmb_accounts ON gmb_accounts.id = gmb_posts.gmb_account_id").
		Where("gmb_accounts.created_by = ?", userID)

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if dateFrom != "" {
		if fromTime, err := time.Parse("2006-01-02", dateFrom); err == nil {
			query = query.Where("created_at >= ?", fromTime)
		}
	}

	if dateTo != "" {
		if toTime, err := time.Parse("2006-01-02", dateTo); err == nil {
			// Add 1 day to include the entire day
			toTime = toTime.Add(24 * time.Hour)
			query = query.Where("created_at < ?", toTime)
		}
	}

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR content ILIKE ?", searchPattern, searchPattern)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated posts
	var posts []models.GMBPost
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch posts: " + err.Error(),
		})
		return
	}

	// Calculate total pages
	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"posts": posts,
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": totalPages,
		},
	})
}

// RetryFailedPost attempts to republish a failed post
func (h *GMBHandler) RetryFailedPost(c *gin.Context) {
	postID := c.Param("id")

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	// Get post
	var post models.GMBPost
	err := h.DB.Preload("Account").First(&post, "id = ?", postID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Post not found",
		})
		return
	}

	// Verify ownership
	var account models.GMBAccount
	h.DB.First(&account, post.AccountID)
	if account.CreatedBy != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Not authorized to retry this post",
		})
		return
	}

	// Reset status and retry
	post.Status = "PUBLISHING"
	post.ErrorMessage = ""
	h.DB.Save(&post)

	// Attempt to publish
	go h.publishToGMB(&post, &account)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Post retry initiated",
		"data": gin.H{
			"id":     post.ID,
			"status": post.Status,
		},
	})
}
