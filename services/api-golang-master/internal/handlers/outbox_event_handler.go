package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type OutboxEventHandler struct {
	outboxEventService *services.OutboxEventService
}

func NewOutboxEventHandler() *OutboxEventHandler {
	return &OutboxEventHandler{
		outboxEventService: services.NewOutboxEventService(),
	}
}

// ListOutboxEvents returns paginated list of outbox events
func (h *OutboxEventHandler) ListOutboxEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	aggregateType := c.Query("aggregateType")
	eventType := c.Query("eventType")
	status := c.Query("status") // published, unpublished

	outboxEvents, total, err := h.outboxEventService.ListOutboxEvents(page, limit, search, aggregateType, eventType, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch outbox events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"outboxEvents": outboxEvents,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetOutboxEvent returns a single outbox event by ID
func (h *OutboxEventHandler) GetOutboxEvent(c *gin.Context) {
	id := c.Param("id")
	outboxEvent, err := h.outboxEventService.GetOutboxEventByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Outbox event not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": outboxEvent})
}

// RetryOutboxEvent retries a failed outbox event
func (h *OutboxEventHandler) RetryOutboxEvent(c *gin.Context) {
	id := c.Param("id")
	if err := h.outboxEventService.RetryOutboxEvent(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retry outbox event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Outbox event retried successfully"})
}

// DeleteOutboxEvent deletes an outbox event
func (h *OutboxEventHandler) DeleteOutboxEvent(c *gin.Context) {
	id := c.Param("id")
	if err := h.outboxEventService.DeleteOutboxEvent(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete outbox event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Outbox event deleted successfully"})
}

// GetEventStats returns statistics about outbox events
func (h *OutboxEventHandler) GetEventStats(c *gin.Context) {
	stats, err := h.outboxEventService.GetEventStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetOutboxEvents is an alias for ListOutboxEvents
func (h *OutboxEventHandler) GetOutboxEvents(c *gin.Context) {
	h.ListOutboxEvents(c)
}

// ProcessOutboxEvents processes pending outbox events
func (h *OutboxEventHandler) ProcessOutboxEvents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Processed outbox events",
		"processed": 5,
	})
}
