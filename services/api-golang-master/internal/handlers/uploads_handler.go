package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UploadsHandler struct {
	db *gorm.DB
}

func NewUploadsHandler(db *gorm.DB) *UploadsHandler {
	return &UploadsHandler{db: db}
}

// GetPurchaseSessions returns purchase upload sessions pending approval
func (h *UploadsHandler) GetPurchaseSessions(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")

	// Query upload_sessions table
	var sessions []map[string]interface{}
	query := h.db.Table("upload_sessions").
		Where("upload_type = ?", "purchase")

	if status != "all" {
		query = query.Where("approval_status = ?", status)
	}

	if err := query.
		Order("uploaded_at DESC").
		Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch upload sessions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"sessions": sessions,
		"total":    len(sessions),
	})
}

// GetInventorySessions returns inventory upload sessions pending approval
func (h *UploadsHandler) GetInventorySessions(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")

	var sessions []map[string]interface{}
	query := h.db.Table("upload_sessions").
		Where("upload_type = ?", "inventory")

	if status != "all" {
		query = query.Where("approval_status = ?", status)
	}

	if err := query.
		Order("uploaded_at DESC").
		Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch upload sessions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"sessions": sessions,
		"total":    len(sessions),
	})
}

// GetSessionDetails returns detailed information about an upload session
func (h *UploadsHandler) GetSessionDetails(c *gin.Context) {
	sessionID := c.Param("sessionId")

	// Get session info
	var session map[string]interface{}
	if err := h.db.Table("upload_sessions").
		Where("id = ?", sessionID).
		First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Session not found",
		})
		return
	}

	// Get purchase/invoice details
	var purchase map[string]interface{}
	h.db.Table("purchase_orders").
		Where("upload_session_id = ?", sessionID).
		First(&purchase)

	// Get items
	var items []map[string]interface{}
	h.db.Table("purchase_order_items").
		Where("purchase_order_id = ?", purchase["id"]).
		Find(&items)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"data": gin.H{
			"session":  session,
			"purchase": purchase,
			"items":    items,
		},
	})
}

// ApproveOrRejectUpload handles approval or rejection of uploads
func (h *UploadsHandler) ApproveOrRejectUpload(c *gin.Context) {
	var req struct {
		SessionID string `json:"sessionId" binding:"required"`
		Action    string `json:"action" binding:"required,oneof=approve reject"`
		Reason    string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Begin transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update approval status
	updates := map[string]interface{}{
		"approval_status": req.Action + "d", // "approved" or "rejected"
	}

	if req.Action == "reject" && req.Reason != "" {
		updates["rejection_reason"] = req.Reason
	}

	if err := tx.Table("upload_sessions").
		Where("id = ?", req.SessionID).
		Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update session",
		})
		return
	}

	// If approved, trigger import process
	if req.Action == "approve" {
		// TODO: Implement actual import logic here
		// For now, just mark as approved
		// In production, this should:
		// 1. Import purchase order into inventory
		// 2. Update stock levels
		// 3. Create inventory batches
		// 4. Update product MRP if needed
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Upload " + req.Action + "d successfully",
	})
}
