package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type GMBSchedulerHandler struct {
	DB *gorm.DB
}

func NewGMBSchedulerHandler(db *gorm.DB) *GMBSchedulerHandler {
	return &GMBSchedulerHandler{DB: db}
}

// CreateScheduledPost creates a new scheduled post
func (h *GMBSchedulerHandler) CreateScheduledPost(c *gin.Context) {
	var req struct {
		GMBAccountID      string    `json:"gmb_account_id" binding:"required"`
		Content           string    `json:"content" binding:"required"`
		ScheduledTime     time.Time `json:"scheduled_time" binding:"required"`
		IsRecurring       bool      `json:"is_recurring"`
		RecurrencePattern string    `json:"recurrence_pattern"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	post := models.GMBScheduledPost{
		GMBAccountID:      req.GMBAccountID,
		Content:           req.Content,
		ScheduledTime:     req.ScheduledTime,
		IsRecurring:       req.IsRecurring,
		RecurrencePattern: req.RecurrencePattern,
		Status:            "SCHEDULED",
		CreatedBy:         userID.(string),
	}

	if err := h.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to schedule post"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": post})
}

// GetScheduledPosts returns a list of scheduled posts
func (h *GMBSchedulerHandler) GetScheduledPosts(c *gin.Context) {
	userID, _ := c.Get("user_id")

	start := c.Query("start")
	end := c.Query("end")

	query := h.DB.Where("created_by = ?", userID)

	if start != "" {
		query = query.Where("scheduled_time >= ?", start)
	}
	if end != "" {
		query = query.Where("scheduled_time <= ?", end)
	}

	var posts []models.GMBScheduledPost
	if err := query.Order("scheduled_time ASC").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scheduled posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": posts})
}

// UpdateScheduledPost updates an existing scheduled post
func (h *GMBSchedulerHandler) UpdateScheduledPost(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var post models.GMBScheduledPost
	if err := h.DB.Where("id = ? AND created_by = ?", id, userID).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var req struct {
		Content           string    `json:"content"`
		ScheduledTime     time.Time `json:"scheduled_time"`
		IsRecurring       bool      `json:"is_recurring"`
		RecurrencePattern string    `json:"recurrence_pattern"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if !req.ScheduledTime.IsZero() {
		updates["scheduled_time"] = req.ScheduledTime
	}
	updates["is_recurring"] = req.IsRecurring
	updates["recurrence_pattern"] = req.RecurrencePattern

	if err := h.DB.Model(&post).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": post})
}

// DeleteScheduledPost deletes (cancels) a scheduled post
func (h *GMBSchedulerHandler) DeleteScheduledPost(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	result := h.DB.Where("id = ? AND created_by = ?", id, userID).Delete(&models.GMBScheduledPost{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Post deleted"})
}
