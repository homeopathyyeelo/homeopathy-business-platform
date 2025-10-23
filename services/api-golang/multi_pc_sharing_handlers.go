// Multi-PC Sharing Handlers - Shared sessions, carts, and real-time sync
package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// MultiPCSharingHandler handles multi-PC sharing operations
type MultiPCSharingHandler struct {
	db           *GORMDatabase
	cache        *CacheService
	sessionStore *SharedSessionStore
	syncManager  *PCSyncManager
	upgrader     websocket.Upgrader
	connections  map[string]*websocket.Conn
	connMutex    sync.RWMutex
}

// NewMultiPCSharingHandler creates a new multi-PC sharing handler
func NewMultiPCSharingHandler(db *GORMDatabase, cache *CacheService, sessionStore *SharedSessionStore, syncManager *PCSyncManager) *MultiPCSharingHandler {
	return &MultiPCSharingHandler{
		db:           db,
		cache:        cache,
		sessionStore: sessionStore,
		syncManager:  syncManager,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // In production, implement proper origin checking
			},
		},
		connections: make(map[string]*websocket.Conn),
	}
}

// ==================== SHARED SESSIONS ====================

// CreateSharedSession creates a new shared session across multiple PCs
func (h *MultiPCSharingHandler) CreateSharedSession(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		SessionName string   `json:"session_name" binding:"required"`
		DeviceIDs   []string `json:"device_ids" binding:"required"`
		UserID      string   `json:"user_id" binding:"required"`
		Settings    map[string]interface{} `json:"settings"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session := SharedSession{
		SessionName: request.SessionName,
		UserID:      request.UserID,
		DeviceIDs:   request.DeviceIDs,
		Status:      "active",
		Settings:    request.Settings,
		CreatedAt:   time.Now(),
		LastActivity: time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shared session"})
		return
	}

	// Initialize session in store
	h.sessionStore.CreateSession(session.ID, request.DeviceIDs)

	response := map[string]interface{}{
		"message":      "Shared session created successfully",
		"session_id":   session.ID,
		"session_name": session.SessionName,
		"device_count": len(request.DeviceIDs),
		"created_at":   session.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// JoinSharedSession allows a device to join an existing shared session
func (h *MultiPCSharingHandler) JoinSharedSession(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	sessionID := c.Param("session_id")
	deviceID := c.Query("device_id")

	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	// Find and validate session
	var session SharedSession
	if err := h.db.DB.WithContext(ctx).Where("id = ? AND status = ?", sessionID, "active").First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Shared session not found or inactive"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared session"})
		return
	}

	// Add device to session if not already present
	deviceExists := false
	for _, existingDeviceID := range session.DeviceIDs {
		if existingDeviceID == deviceID {
			deviceExists = true
			break
		}
	}

	if !deviceExists {
		session.DeviceIDs = append(session.DeviceIDs, deviceID)
		session.LastActivity = time.Now()

		if err := h.db.DB.WithContext(ctx).Save(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update shared session"})
			return
		}

		// Update session store
		h.sessionStore.AddDeviceToSession(sessionID, deviceID)
	}

	// Notify other devices about new device
	h.syncManager.NotifySessionUpdate(sessionID, "device_joined", map[string]interface{}{
		"device_id": deviceID,
		"joined_at": time.Now(),
	})

	response := map[string]interface{}{
		"message":      "Successfully joined shared session",
		"session_id":   sessionID,
		"session_name": session.SessionName,
		"device_count": len(session.DeviceIDs),
		"joined_at":    time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// LeaveSharedSession removes a device from a shared session
func (h *MultiPCSharingHandler) LeaveSharedSession(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	sessionID := c.Param("session_id")
	deviceID := c.Query("device_id")

	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	// Remove device from session
	h.sessionStore.RemoveDeviceFromSession(sessionID, deviceID)

	// Notify other devices about device leaving
	h.syncManager.NotifySessionUpdate(sessionID, "device_left", map[string]interface{}{
		"device_id": deviceID,
		"left_at":   time.Now(),
	})

	response := map[string]interface{}{
		"message":   "Successfully left shared session",
		"session_id": sessionID,
		"left_at":   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetSharedSessions retrieves shared sessions for a user
func (h *MultiPCSharingHandler) GetSharedSessions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Param("user_id")
	var sessions []SharedSession
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&SharedSession{}).Where("user_id = ?", userID)

	// Apply filters
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count shared sessions"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("last_activity DESC").Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// ==================== SHARED CARTS ====================

// CreateSharedCart creates a shared cart across multiple devices
func (h *MultiPCSharingHandler) CreateSharedCart(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		SessionID   string      `json:"session_id" binding:"required"`
		CustomerID  string      `json:"customer_id"`
		Items       []CartItem  `json:"items"`
		Description string      `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify session exists and is active
	var session SharedSession
	if err := h.db.DB.WithContext(ctx).Where("id = ? AND status = ?", request.SessionID, "active").First(&session).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or inactive shared session"})
		return
	}

	cart := SharedCart{
		SessionID:   request.SessionID,
		CustomerID:  request.CustomerID,
		Items:       request.Items,
		Status:      "active",
		Description: request.Description,
		CreatedAt:   time.Now(),
		LastModified: time.Now(),
		ModifiedBy:  c.GetString("user_id"),
	}

	if err := h.db.DB.WithContext(ctx).Create(&cart).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shared cart"})
		return
	}

	// Notify other devices about new cart
	h.syncManager.NotifyCartUpdate(request.SessionID, "cart_created", map[string]interface{}{
		"cart_id": cart.ID,
		"items_count": len(request.Items),
	})

	response := map[string]interface{}{
		"message":    "Shared cart created successfully",
		"cart_id":    cart.ID,
		"session_id": request.SessionID,
		"created_at": cart.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateSharedCart updates a shared cart
func (h *MultiPCSharingHandler) UpdateSharedCart(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	cartID := c.Param("cart_id")
	deviceID := c.Query("device_id")

	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	var request struct {
		Items []CartItem `json:"items"`
		Notes string     `json:"notes"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find and update cart
	var cart SharedCart
	if err := h.db.DB.WithContext(ctx).Where("id = ?", cartID).First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Shared cart not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared cart"})
		return
	}

	// Update cart
	cart.Items = request.Items
	cart.LastModified = time.Now()
	cart.ModifiedBy = deviceID
	cart.Notes = request.Notes

	if err := h.db.DB.WithContext(ctx).Save(&cart).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update shared cart"})
		return
	}

	// Notify other devices about cart update
	h.syncManager.NotifyCartUpdate(cart.SessionID, "cart_updated", map[string]interface{}{
		"cart_id":      cart.ID,
		"items_count":  len(request.Items),
		"modified_by":  deviceID,
		"modified_at":  cart.LastModified,
	})

	response := map[string]interface{}{
		"message":      "Shared cart updated successfully",
		"cart_id":      cart.ID,
		"modified_at":  cart.LastModified,
		"modified_by":  deviceID,
	}

	c.JSON(http.StatusOK, response)
}

// GetSharedCart retrieves a shared cart
func (h *MultiPCSharingHandler) GetSharedCart(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	cartID := c.Param("cart_id")
	var cart SharedCart

	if err := h.db.DB.WithContext(ctx).Where("id = ?", cartID).First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Shared cart not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve shared cart"})
		return
	}

	c.JSON(http.StatusOK, cart)
}

// ==================== REAL-TIME SYNCHRONIZATION ====================

// HandleWebSocket handles WebSocket connections for real-time sync
func (h *MultiPCSharingHandler) HandleWebSocket(c *gin.Context) {
	sessionID := c.Query("session_id")
	deviceID := c.Query("device_id")

	if sessionID == "" || deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID and Device ID are required"})
		return
	}

	// Upgrade connection to WebSocket
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	// Store connection
	h.connMutex.Lock()
	h.connections[deviceID] = conn
	h.connMutex.Unlock()

	// Handle WebSocket messages
	defer func() {
		h.connMutex.Lock()
		delete(h.connections, deviceID)
		h.connMutex.Unlock()
		conn.Close()
	}()

	// Listen for messages
	for {
		var message map[string]interface{}
		err := conn.ReadJSON(&message)
		if err != nil {
			break
		}

		// Process message based on type
		h.processWebSocketMessage(sessionID, deviceID, message)
	}
}

// processWebSocketMessage processes incoming WebSocket messages
func (h *MultiPCSharingHandler) processWebSocketMessage(sessionID, deviceID string, message map[string]interface{}) {
	messageType := message["type"].(string)

	switch messageType {
	case "cart_update":
		h.handleCartUpdate(sessionID, deviceID, message)
	case "bill_update":
		h.handleBillUpdate(sessionID, deviceID, message)
	case "inventory_update":
		h.handleInventoryUpdate(sessionID, deviceID, message)
	case "ping":
		h.sendWebSocketMessage(deviceID, map[string]interface{}{
			"type": "pong",
			"timestamp": time.Now(),
		})
	}
}

// handleCartUpdate handles cart update messages
func (h *MultiPCSharingHandler) handleCartUpdate(sessionID, deviceID string, message map[string]interface{}) {
	// Broadcast cart update to other devices in session
	devices := h.sessionStore.GetSessionDevices(sessionID)
	for _, otherDeviceID := range devices {
		if otherDeviceID != deviceID {
			h.sendWebSocketMessage(otherDeviceID, map[string]interface{}{
				"type":        "cart_update",
				"session_id":  sessionID,
				"device_id":   deviceID,
				"data":        message["data"],
				"timestamp":   time.Now(),
			})
		}
	}
}

// handleBillUpdate handles bill update messages
func (h *MultiPCSharingHandler) handleBillUpdate(sessionID, deviceID string, message map[string]interface{}) {
	// Broadcast bill update to other devices in session
	devices := h.sessionStore.GetSessionDevices(sessionID)
	for _, otherDeviceID := range devices {
		if otherDeviceID != deviceID {
			h.sendWebSocketMessage(otherDeviceID, map[string]interface{}{
				"type":        "bill_update",
				"session_id":  sessionID,
				"device_id":   deviceID,
				"data":        message["data"],
				"timestamp":   time.Now(),
			})
		}
	}
}

// handleInventoryUpdate handles inventory update messages
func (h *MultiPCSharingHandler) handleInventoryUpdate(sessionID, deviceID string, message map[string]interface{}) {
	// Broadcast inventory update to other devices in session
	devices := h.sessionStore.GetSessionDevices(sessionID)
	for _, otherDeviceID := range devices {
		if otherDeviceID != deviceID {
			h.sendWebSocketMessage(otherDeviceID, map[string]interface{}{
				"type":        "inventory_update",
				"session_id":  sessionID,
				"device_id":   deviceID,
				"data":        message["data"],
				"timestamp":   time.Now(),
			})
		}
	}
}

// sendWebSocketMessage sends a message to a specific device
func (h *MultiPCSharingHandler) sendWebSocketMessage(deviceID string, message map[string]interface{}) {
	h.connMutex.RLock()
	conn, exists := h.connections[deviceID]
	h.connMutex.RUnlock()

	if exists {
		conn.WriteJSON(message)
	}
}

// ==================== SHARED BILLING ====================

// HoldSharedBill holds a bill across multiple devices
func (h *MultiPCSharingHandler) HoldSharedBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		SessionID   string      `json:"session_id" binding:"required"`
		CustomerID  string      `json:"customer_id"`
		Items       []BillItem  `json:"items" binding:"required"`
		Total       float64     `json:"total" binding:"required"`
		Notes       string      `json:"notes"`
		HoldReason  string      `json:"hold_reason"`
		DeviceID    string      `json:"device_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create held bill
	heldBill := SharedHeldBill{
		SessionID:   request.SessionID,
		CustomerID:  request.CustomerID,
		Items:       request.Items,
		Total:       request.Total,
		Status:      "held",
		Notes:       request.Notes,
		HoldReason:  request.HoldReason,
		HeldAt:      time.Now(),
		HeldBy:      request.DeviceID,
	}

	if err := h.db.DB.WithContext(ctx).Create(&heldBill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hold shared bill"})
		return
	}

	// Notify other devices about held bill
	h.syncManager.NotifySessionUpdate(request.SessionID, "bill_held", map[string]interface{}{
		"bill_id":   heldBill.ID,
		"held_by":   request.DeviceID,
		"total":     request.Total,
		"items_count": len(request.Items),
	})

	response := map[string]interface{}{
		"message":    "Bill held successfully across devices",
		"bill_id":    heldBill.ID,
		"session_id": request.SessionID,
		"held_at":    heldBill.HeldAt,
	}

	c.JSON(http.StatusOK, response)
}

// ResumeSharedBill resumes a held bill across devices
func (h *MultiPCSharingHandler) ResumeSharedBill(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	billID := c.Param("bill_id")
	deviceID := c.Query("device_id")

	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	var heldBill SharedHeldBill
	if err := h.db.DB.WithContext(ctx).Where("id = ? AND status = ?", billID, "held").First(&heldBill).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Held bill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve held bill"})
		return
	}

	// Resume the bill
	updates := map[string]interface{}{
		"status":     "resumed",
		"resumed_at": time.Now(),
		"resumed_by": deviceID,
	}

	if err := h.db.DB.WithContext(ctx).Model(&heldBill).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resume held bill"})
		return
	}

	// Notify other devices about bill resume
	h.syncManager.NotifySessionUpdate(heldBill.SessionID, "bill_resumed", map[string]interface{}{
		"bill_id":    heldBill.ID,
		"resumed_by": deviceID,
		"resumed_at": time.Now(),
	})

	response := map[string]interface{}{
		"message":     "Bill resumed successfully across devices",
		"bill_id":     heldBill.ID,
		"resumed_at":  time.Now(),
		"bill_data":   heldBill,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== DEVICE MANAGEMENT ====================

// GetConnectedDevices retrieves devices connected to a session
func (h *MultiPCSharingHandler) GetConnectedDevices(c *gin.Context) {
	sessionID := c.Param("session_id")

	devices := h.sessionStore.GetSessionDevices(sessionID)

	deviceInfo := make([]map[string]interface{}, 0, len(devices))
	for _, deviceID := range devices {
		info := map[string]interface{}{
			"device_id":      deviceID,
			"connection_status": "connected",
			"last_activity":  time.Now(),
			"is_online":      true,
		}
		deviceInfo = append(deviceInfo, info)
	}

	response := map[string]interface{}{
		"session_id": sessionID,
		"devices":    deviceInfo,
		"total_devices": len(devices),
	}

	c.JSON(http.StatusOK, response)
}

// SendMessageToDevice sends a message to a specific device
func (h *MultiPCSharingHandler) SendMessageToDevice(c *gin.Context) {
	deviceID := c.Param("device_id")

	var request struct {
		MessageType string                 `json:"message_type" binding:"required"`
		Data        map[string]interface{} `json:"data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Send message to device
	h.sendWebSocketMessage(deviceID, map[string]interface{}{
		"type":      request.MessageType,
		"data":      request.Data,
		"timestamp": time.Now(),
	})

	response := map[string]interface{}{
		"message":     "Message sent to device",
		"device_id":   deviceID,
		"message_type": request.MessageType,
		"sent_at":     time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

