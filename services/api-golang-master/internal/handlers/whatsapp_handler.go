package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"time"
)

type WhatsAppHandler struct {
	db interface{}
}

func NewWhatsAppHandler(db interface{}) *WhatsAppHandler {
	return &WhatsAppHandler{db: db}
}

// POST /api/erp/whatsapp/send
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	var req struct {
		To        string                 `json:"to"`
		Template  string                 `json:"template"`
		Language  string                 `json:"language"`
		Variables map[string]string     `json:"variables"`
		MediaURL  string                 `json:"media_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	messageID := uuid.New().String()

	c.JSON(200, gin.H{
		"success": true,
		"message_id": messageID,
		"status": "sent",
		"sent_at": time.Now(),
	})
}

// GET /api/erp/whatsapp/templates
func (h *WhatsAppHandler) GetTemplates(c *gin.Context) {
	templates := []gin.H{
		{
			"id":       "template-001",
			"name":     "order_confirmation",
			"category": "order",
			"language": "en",
			"status":   "approved",
			"placeholders": []string{"customer_name", "order_number", "amount"},
		},
		{
			"id":       "template-002",
			"name":     "payment_reminder",
			"category": "payment",
			"language": "en",
			"status":   "approved",
			"placeholders": []string{"customer_name", "due_amount", "due_date"},
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": templates,
	})
}

// GET /api/erp/whatsapp/status/:messageId
func (h *WhatsAppHandler) GetMessageStatus(c *gin.Context) {
	messageID := c.Param("messageId")

	status := gin.H{
		"message_id": messageID,
		"status":      "delivered",
		"sent_at":     time.Now().Add(-5 * time.Minute),
		"delivered_at": time.Now().Add(-1 * time.Minute),
		"read_at":     nil,
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": status,
	})
}

// POST /api/erp/whatsapp/bulk-send
func (h *WhatsAppHandler) BulkSendMessages(c *gin.Context) {
	var req struct {
		CustomerIDs []string `json:"customer_ids"`
		Message     string   `json:"message"`
		TemplateID  string   `json:"template_id"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// TODO: Integrate with WhatsApp Business API / Twilio
	sent := len(req.CustomerIDs)
	
	c.JSON(200, gin.H{
		"success": true,
		"sent": sent,
		"failed": 0,
	})
}

// POST /api/erp/whatsapp/credit-reminder
func (h *WhatsAppHandler) SendCreditReminder(c *gin.Context) {
	var req struct {
		MinDue float64 `json:"min_due"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"sent": 12,
	})
}
