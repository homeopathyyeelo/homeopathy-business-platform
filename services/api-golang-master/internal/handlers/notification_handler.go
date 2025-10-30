package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// NotificationHandler handles notification operations
type NotificationHandler struct {
	db *sql.DB
}

// Notification represents a system notification
type Notification struct {
	ID          string     `json:"id"`
	UserID      *string    `json:"user_id,omitempty"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Message     string     `json:"message"`
	Priority    string     `json:"priority"`
	Category    string     `json:"category"`
	IsRead      bool       `json:"is_read"`
	ReadAt      *time.Time `json:"read_at,omitempty"`
	ActionURL   *string    `json:"action_url,omitempty"`
	ActionLabel *string    `json:"action_label,omitempty"`
	Metadata    *string    `json:"metadata,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(db *sql.DB) *NotificationHandler {
	handler := &NotificationHandler{db: db}
	
	// Ensure table exists on initialization
	if err := handler.ensureTableExists(); err != nil {
		fmt.Printf("⚠️  Warning: Failed to create notifications table: %v\n", err)
	} else {
		fmt.Println("✅ Notifications table ready")
	}
	
	return handler
}

// ensureTableExists creates the notifications table if it doesn't exist
func (h *NotificationHandler) ensureTableExists() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS notifications (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID,
		type VARCHAR(50) NOT NULL DEFAULT 'info',
		title VARCHAR(255) NOT NULL,
		message TEXT NOT NULL,
		priority VARCHAR(20) NOT NULL DEFAULT 'normal',
		category VARCHAR(50) NOT NULL DEFAULT 'general',
		is_read BOOLEAN NOT NULL DEFAULT false,
		read_at TIMESTAMP,
		action_url TEXT,
		action_label VARCHAR(100),
		metadata JSONB,
		expires_at TIMESTAMP,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
	CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
	CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
	CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
	CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

	COMMENT ON TABLE notifications IS 'System notifications for users';
	COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error, alert';
	COMMENT ON COLUMN notifications.priority IS 'Priority: low, normal, high, urgent';
	COMMENT ON COLUMN notifications.category IS 'Category: general, inventory, sales, purchase, finance, system';
	`

	_, err := h.db.ExecContext(ctx, createTableSQL)
	return err
}

// GetRecentNotifications returns the latest notifications for the dashboard
func (h *NotificationHandler) GetRecentNotifications(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	if h.db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database not initialized"})
		return
	}

	if err := h.ensureTableExists(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize notifications table"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	query := `
		SELECT id, user_id, type, title, message, priority, category,
		       is_read, read_at, action_url, action_label, metadata,
		       expires_at, created_at, updated_at
		FROM notifications
		WHERE expires_at IS NULL OR expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT $1
	`

	rows, err := h.db.QueryContext(ctx, query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load notifications", "details": err.Error()})
		return
	}
	defer rows.Close()

	var recent []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(
			&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message,
			&n.Priority, &n.Category, &n.IsRead, &n.ReadAt,
			&n.ActionURL, &n.ActionLabel, &n.Metadata,
			&n.ExpiresAt, &n.CreatedAt, &n.UpdatedAt,
		); err != nil {
			continue
		}
		recent = append(recent, n)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    recent,
		"count":   len(recent),
	})
}

// GetNotifications retrieves notifications with filters
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Ensure table exists
	if err := h.ensureTableExists(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize notifications table"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	userID := c.Query("user_id")
	isRead := c.Query("is_read")
	category := c.Query("category")
	priority := c.Query("priority")
	notificationType := c.Query("type")

	// Build query
	query := `
		SELECT id, user_id, type, title, message, priority, category, 
		       is_read, read_at, action_url, action_label, metadata, 
		       expires_at, created_at, updated_at
		FROM notifications
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	// Apply filters
	if userID != "" {
		query += fmt.Sprintf(" AND user_id = $%d", argCount)
		args = append(args, userID)
		argCount++
	}

	if isRead != "" {
		query += fmt.Sprintf(" AND is_read = $%d", argCount)
		args = append(args, isRead == "true")
		argCount++
	}

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argCount)
		args = append(args, category)
		argCount++
	}

	if priority != "" {
		query += fmt.Sprintf(" AND priority = $%d", argCount)
		args = append(args, priority)
		argCount++
	}

	if notificationType != "" {
		query += fmt.Sprintf(" AND type = $%d", argCount)
		args = append(args, notificationType)
		argCount++
	}

	// Exclude expired notifications
	query += " AND (expires_at IS NULL OR expires_at > NOW())"

	// Count total
	countQuery := "SELECT COUNT(*) FROM (" + query + ") AS count_query"
	var total int64
	err := h.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	// Add ordering and pagination
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.QueryContext(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notifications", "details": err.Error()})
		return
	}
	defer rows.Close()

	notifications := []Notification{}
	for rows.Next() {
		var n Notification
		err := rows.Scan(
			&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message,
			&n.Priority, &n.Category, &n.IsRead, &n.ReadAt,
			&n.ActionURL, &n.ActionLabel, &n.Metadata,
			&n.ExpiresAt, &n.CreatedAt, &n.UpdatedAt,
		)
		if err != nil {
			continue
		}
		notifications = append(notifications, n)
	}

	// Get unread count
	unreadQuery := `SELECT COUNT(*) FROM notifications WHERE is_read = false`
	if userID != "" {
		unreadQuery += " AND user_id = $1"
	}
	var unreadCount int64
	if userID != "" {
		h.db.QueryRowContext(ctx, unreadQuery, userID).Scan(&unreadCount)
	} else {
		h.db.QueryRowContext(ctx, unreadQuery).Scan(&unreadCount)
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"total":         total,
		"unread_count":  unreadCount,
		"limit":         limit,
		"offset":        offset,
	})
}

// GetNotification retrieves a single notification
func (h *NotificationHandler) GetNotification(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	id := c.Param("id")

	query := `
		SELECT id, user_id, type, title, message, priority, category, 
		       is_read, read_at, action_url, action_label, metadata, 
		       expires_at, created_at, updated_at
		FROM notifications
		WHERE id = $1
	`

	var n Notification
	err := h.db.QueryRowContext(ctx, query, id).Scan(
		&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message,
		&n.Priority, &n.Category, &n.IsRead, &n.ReadAt,
		&n.ActionURL, &n.ActionLabel, &n.Metadata,
		&n.ExpiresAt, &n.CreatedAt, &n.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notification"})
		return
	}

	c.JSON(http.StatusOK, n)
}

// CreateNotification creates a new notification
func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var input struct {
		UserID      *string    `json:"user_id"`
		Type        string     `json:"type" binding:"required"`
		Title       string     `json:"title" binding:"required"`
		Message     string     `json:"message" binding:"required"`
		Priority    string     `json:"priority"`
		Category    string     `json:"category"`
		ActionURL   *string    `json:"action_url"`
		ActionLabel *string    `json:"action_label"`
		Metadata    *string    `json:"metadata"`
		ExpiresAt   *time.Time `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if input.Priority == "" {
		input.Priority = "normal"
	}
	if input.Category == "" {
		input.Category = "general"
	}

	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO notifications (
			id, user_id, type, title, message, priority, category,
			action_url, action_label, metadata, expires_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at
	`

	var notification Notification
	err := h.db.QueryRowContext(ctx, query,
		id, input.UserID, input.Type, input.Title, input.Message,
		input.Priority, input.Category, input.ActionURL, input.ActionLabel,
		input.Metadata, input.ExpiresAt, now, now,
	).Scan(&notification.ID, &notification.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification", "details": err.Error()})
		return
	}

	notification.UserID = input.UserID
	notification.Type = input.Type
	notification.Title = input.Title
	notification.Message = input.Message
	notification.Priority = input.Priority
	notification.Category = input.Category
	notification.IsRead = false

	c.JSON(http.StatusCreated, notification)
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	now := time.Now()

	query := `
		UPDATE notifications
		SET is_read = true, read_at = $1, updated_at = $2
		WHERE id = $3
		RETURNING id
	`

	var notificationID string
	err := h.db.QueryRowContext(ctx, query, now, now, id).Scan(&notificationID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read", "id": notificationID})
}

// MarkAllAsRead marks all notifications as read for a user
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	userID := c.Query("user_id")
	now := time.Now()

	query := `
		UPDATE notifications
		SET is_read = true, read_at = $1, updated_at = $2
		WHERE is_read = false
	`
	args := []interface{}{now, now}

	if userID != "" {
		query += " AND user_id = $3"
		args = append(args, userID)
	}

	result, err := h.db.ExecContext(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notifications as read"})
		return
	}

	rowsAffected, _ := result.RowsAffected()

	c.JSON(http.StatusOK, gin.H{
		"message":       "All notifications marked as read",
		"rows_affected": rowsAffected,
	})
}

// DeleteNotification deletes a notification
func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	id := c.Param("id")

	query := `DELETE FROM notifications WHERE id = $1`
	result, err := h.db.ExecContext(ctx, query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

// GetUnreadCount gets the count of unread notifications
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	userID := c.Query("user_id")

	query := `SELECT COUNT(*) FROM notifications WHERE is_read = false`
	args := []interface{}{}

	if userID != "" {
		query += " AND user_id = $1"
		args = append(args, userID)
	}

	var count int64
	err := h.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// CleanupExpiredNotifications removes expired notifications
func (h *NotificationHandler) CleanupExpiredNotifications(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	query := `DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()`
	result, err := h.db.ExecContext(ctx, query)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cleanup expired notifications"})
		return
	}

	rowsAffected, _ := result.RowsAffected()

	c.JSON(http.StatusOK, gin.H{
		"message":       "Expired notifications cleaned up",
		"rows_affected": rowsAffected,
	})
}
