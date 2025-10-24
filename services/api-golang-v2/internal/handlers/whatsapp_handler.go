package handlers

import (
	"github.com/gin-gonic/gin"
)

type WhatsAppHandler struct {
	db interface{}
}

func NewWhatsAppHandler(db interface{}) *WhatsAppHandler {
	return &WhatsAppHandler{db: db}
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
