package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type POSSessionHandler struct {
	service *services.POSSessionService
}

func NewPOSSessionHandler() *POSSessionHandler {
	return &POSSessionHandler{
		service: services.NewPOSSessionService(),
	}
}

// CreateSession creates a new POS session
// @Summary Create new POS session
// @Tags POS
// @Accept json
// @Produce json
// @Param body body object true "Session data"
// @Success 201 {object} models.POSSession
// @Router /api/pos/sessions [post]
func (h *POSSessionHandler) CreateSession(c *gin.Context) {
	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		BranchID string `json:"branch_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	var branchID uuid.UUID
	if req.BranchID != "" {
		branchID, err = uuid.Parse(req.BranchID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid branch_id"})
			return
		}
	}

	session, err := h.service.CreateSession(c.Request.Context(), userID, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": session})
}

// GetSession retrieves a POS session
// @Summary Get POS session
// @Tags POS
// @Produce json
// @Param id path string true "Session ID"
// @Success 200 {object} models.POSSession
// @Router /api/pos/sessions/{id} [get]
func (h *POSSessionHandler) GetSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	session, err := h.service.GetSession(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": session})
}

// GetUserSessions retrieves all sessions for a user
// @Summary Get user sessions
// @Tags POS
// @Produce json
// @Param user_id query string true "User ID"
// @Success 200 {array} models.POSSession
// @Router /api/pos/sessions [get]
func (h *POSSessionHandler) GetUserSessions(c *gin.Context) {
	userID, err := uuid.Parse(c.Query("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	sessions, err := h.service.GetUserSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": sessions})
}

// AddItemToSession adds an item to a session
// @Summary Add item to session
// @Tags POS
// @Accept json
// @Produce json
// @Param id path string true "Session ID"
// @Param body body object true "Item data"
// @Success 200 {object} object
// @Router /api/pos/sessions/{id}/items [post]
func (h *POSSessionHandler) AddItemToSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	var req struct {
		ProductID string  `json:"product_id" binding:"required"`
		Quantity  int     `json:"quantity" binding:"required,min=1"`
		UnitPrice float64 `json:"unit_price" binding:"required,min=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product_id"})
		return
	}

	if err := h.service.AddItemToSession(c.Request.Context(), sessionID, productID, req.Quantity, req.UnitPrice); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Item added to session"})
}

// PauseSession pauses a session
// @Summary Pause session
// @Tags POS
// @Param id path string true "Session ID"
// @Success 200 {object} object
// @Router /api/pos/sessions/{id}/pause [post]
func (h *POSSessionHandler) PauseSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	if err := h.service.PauseSession(c.Request.Context(), sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Session paused"})
}

// ResumeSession resumes a session
// @Summary Resume session
// @Tags POS
// @Param id path string true "Session ID"
// @Success 200 {object} object
// @Router /api/pos/sessions/{id}/resume [post]
func (h *POSSessionHandler) ResumeSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	if err := h.service.ResumeSession(c.Request.Context(), sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Session resumed"})
}

// CompleteSession completes a session
// @Summary Complete session
// @Tags POS
// @Param id path string true "Session ID"
// @Success 200 {object} object
// @Router /api/pos/sessions/{id}/complete [post]
func (h *POSSessionHandler) CompleteSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	if err := h.service.CompleteSession(c.Request.Context(), sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Session completed"})
}

// DeleteSession deletes a session
// @Summary Delete session
// @Tags POS
// @Param id path string true "Session ID"
// @Success 200 {object} object
// @Router /api/pos/sessions/{id} [delete]
func (h *POSSessionHandler) DeleteSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	if err := h.service.DeleteSession(c.Request.Context(), sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Session deleted"})
}

// GetSessionItems retrieves all items for a session
// @Summary Get session items
// @Tags POS
// @Produce json
// @Param id path string true "Session ID"
// @Success 200 {array} models.POSSessionItem
// @Router /api/pos/sessions/{id}/items [get]
func (h *POSSessionHandler) GetSessionItems(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session_id"})
		return
	}

	items, err := h.service.GetSessionItems(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}
