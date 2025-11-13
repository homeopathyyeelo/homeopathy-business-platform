package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"marketplace-integration/internal/models"
	"marketplace-integration/internal/services"
)

type WebhookHandler struct {
	service *services.WebhookService
}

func NewWebhookHandler(service *services.WebhookService) *WebhookHandler {
	return &WebhookHandler{service: service}
}

// HandleAmazon processes Amazon marketplace webhooks
func (h *WebhookHandler) HandleAmazon(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Store raw webhook
	webhook := &models.MarketplaceWebhook{
		ID:          uuid.New().String(),
		Marketplace: "amazon",
		EventType:   getEventType(payload, "NotificationType"),
		RawPayload:  payload,
		CreatedAt:   time.Now(),
	}

	if err := h.service.StoreWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store webhook"})
		return
	}

	// Queue for processing
	if err := h.service.QueueWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue webhook"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"webhook_id": webhook.ID,
		"message": "Webhook received and queued for processing",
	})
}

// HandleFlipkart processes Flipkart marketplace webhooks
func (h *WebhookHandler) HandleFlipkart(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	webhook := &models.MarketplaceWebhook{
		ID:          uuid.New().String(),
		Marketplace: "flipkart",
		EventType:   getEventType(payload, "eventType"),
		RawPayload:  payload,
		CreatedAt:   time.Now(),
	}

	if err := h.service.StoreWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store webhook"})
		return
	}

	if err := h.service.QueueWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue webhook"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"webhook_id": webhook.ID,
	})
}

// HandleMeesho processes Meesho marketplace webhooks
func (h *WebhookHandler) HandleMeesho(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	webhook := &models.MarketplaceWebhook{
		ID:          uuid.New().String(),
		Marketplace: "meesho",
		EventType:   getEventType(payload, "event"),
		RawPayload:  payload,
		CreatedAt:   time.Now(),
	}

	if err := h.service.StoreWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store webhook"})
		return
	}

	if err := h.service.QueueWebhook(webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue webhook"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetOrders returns marketplace orders
func (h *WebhookHandler) GetOrders(c *gin.Context) {
	marketplace := c.Query("marketplace")
	status := c.Query("status")
	limit := c.DefaultQuery("limit", "50")

	orders, err := h.service.GetOrders(marketplace, status, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": orders,
	})
}

// GetOrder returns a single marketplace order
func (h *WebhookHandler) GetOrder(c *gin.Context) {
	id := c.Param("id")
	
	order, err := h.service.GetOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": order,
	})
}

// SyncOrder manually syncs an order
func (h *WebhookHandler) SyncOrder(c *gin.Context) {
	id := c.Param("id")
	
	if err := h.service.SyncOrder(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order sync initiated",
	})
}

// GetWebhooks returns webhook history
func (h *WebhookHandler) GetWebhooks(c *gin.Context) {
	marketplace := c.Query("marketplace")
	status := c.DefaultQuery("status", "all")
	limit := c.DefaultQuery("limit", "100")

	webhooks, err := h.service.GetWebhooks(marketplace, status, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": webhooks,
	})
}

func getEventType(payload map[string]interface{}, key string) string {
	if val, ok := payload[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return "unknown"
}
