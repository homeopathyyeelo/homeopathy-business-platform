package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type JobHandler struct {
	jobService *services.JobService
}

func NewJobHandler(jobService *services.JobService) *JobHandler {
	return &JobHandler{
		jobService: jobService,
	}
}

// GetJob retrieves a specific job by ID
// @Summary Get job details
// @Description Get details of a background job by ID
// @Tags Jobs
// @Accept json
// @Produce json
// @Param id path string true "Job ID"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/{id} [get]
func (h *JobHandler) GetJob(c *gin.Context) {
	jobID := c.Param("id")

	job, err := h.jobService.GetJob(jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Job not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    job,
	})
}

// ListJobs lists all jobs with optional filters
// @Summary List jobs
// @Description List all background jobs with optional filters
// @Tags Jobs
// @Accept json
// @Produce json
// @Param status query string false "Filter by status (pending, running, completed, failed)"
// @Param type query string false "Filter by job type"
// @Param limit query int false "Limit results" default(50)
// @Success 200 {object} map[string]interface{}
// @Router /jobs [get]
func (h *JobHandler) ListJobs(c *gin.Context) {
	// Parse query parameters
	statusStr := c.Query("status")
	jobTypeStr := c.Query("type")
	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := c.GetQuery("limit"); err {
			if parsed, parseErr := parseToInt(l); parseErr == nil {
				limit = parsed
			}
		}
	}

	var status *services.JobStatus
	if statusStr != "" {
		s := services.JobStatus(statusStr)
		status = &s
	}

	var jobType *services.JobType
	if jobTypeStr != "" {
		jt := services.JobType(jobTypeStr)
		jobType = &jt
	}

	// Get user ID from context (if authenticated)
	var createdBy *string
	if userID, exists := c.Get("user_id"); exists {
		uid := userID.(string)
		createdBy = &uid
	}

	jobs, err := h.jobService.ListJobs(status, jobType, createdBy, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list jobs",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
		"total":   len(jobs),
	})
}

// GetJobStatus returns the status of a job
// @Summary Get job status
// @Description Get current status of a background job
// @Tags Jobs
// @Accept json
// @Produce json
// @Param id path string true "Job ID"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/{id}/status [get]
func (h *JobHandler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("id")

	job, err := h.jobService.GetJob(jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Job not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"id":       job.ID,
		"status":   job.Status,
		"progress": job.Progress,
		"total":    job.Total,
		"result":   job.Result,
		"error":    job.ErrorMessage,
	})
}

// GetNotifications retrieves user notifications
// @Summary Get user notifications
// @Description Get unread notifications for the current user
// @Tags Jobs
// @Accept json
// @Produce json
// @Param limit query int false "Limit results" default(20)
// @Success 200 {object} map[string]interface{}
// @Router /jobs/notifications [get]
func (h *JobHandler) GetNotifications(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
		})
		return
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, ok := c.GetQuery("limit"); ok {
			if parsed, err := parseToInt(l); err == nil {
				limit = parsed
			}
		}
	}

	notifications, err := h.jobService.GetUserNotifications(userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get notifications",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    notifications,
		"total":   len(notifications),
	})
}

// MarkNotificationRead marks a notification as read
// @Summary Mark notification as read
// @Description Mark a notification as read
// @Tags Jobs
// @Accept json
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/notifications/{id}/read [post]
func (h *JobHandler) MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")

	if err := h.jobService.MarkNotificationRead(notificationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to mark notification as read",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification marked as read",
	})
}

// GetJobStats returns statistics about background jobs
// @Summary Get job statistics
// @Description Get statistics about pending and running jobs
// @Tags Jobs
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /jobs/stats [get]
func (h *JobHandler) GetJobStats(c *gin.Context) {
	pendingCount, err := h.jobService.GetPendingJobCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get job stats",
		})
		return
	}

	runningCount, err := h.jobService.GetRunningJobCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get job stats",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"pending": pendingCount,
			"running": runningCount,
		},
	})
}

// Helper function to parse string to int
func parseToInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}
