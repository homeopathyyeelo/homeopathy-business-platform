package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type WhatsAppHandler struct {
	db        *gorm.DB
	aiService *services.MarketingAIService
}

func NewWhatsAppHandler(db *gorm.DB, aiService *services.MarketingAIService) *WhatsAppHandler {
	return &WhatsAppHandler{
		db:        db,
		aiService: aiService,
	}
}

// POST /api/erp/whatsapp/send
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	var req struct {
		To        string            `json:"to"`
		Template  string            `json:"template"`
		Language  string            `json:"language"`
		Variables map[string]string `json:"variables"`
		MediaURL  string            `json:"media_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Log the single message attempt
	h.sendToWhatsApp(req.To, "Template: "+req.Template, "single-send", "transactional")

	messageID := uuid.New().String()

	c.JSON(200, gin.H{
		"success":    true,
		"message_id": messageID,
		"status":     "sent",
		"sent_at":    time.Now(),
	})
}

// GET /api/erp/whatsapp/templates
func (h *WhatsAppHandler) GetTemplates(c *gin.Context) {
	templates := []gin.H{
		{
			"id":           "template-001",
			"name":         "order_confirmation",
			"category":     "order",
			"language":     "en",
			"status":       "approved",
			"placeholders": []string{"customer_name", "order_number", "amount"},
		},
		{
			"id":           "template-002",
			"name":         "payment_reminder",
			"category":     "payment",
			"language":     "en",
			"status":       "approved",
			"placeholders": []string{"customer_name", "due_amount", "due_date"},
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    templates,
	})
}

// GET /api/erp/whatsapp/status/:messageId
func (h *WhatsAppHandler) GetMessageStatus(c *gin.Context) {
	messageID := c.Param("messageId")

	status := gin.H{
		"message_id":   messageID,
		"status":       "delivered",
		"sent_at":      time.Now().Add(-5 * time.Minute),
		"delivered_at": time.Now().Add(-1 * time.Minute),
		"read_at":      nil,
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    status,
	})
}

// WhatsAppBulkRequest represents a bulk message request
type WhatsAppBulkRequest struct {
	SessionID   string                 `json:"session_id"`
	MessageType string                 `json:"message_type"`
	Group       []string               `json:"group"` // List of phone numbers
	Content     string                 `json:"content"`
	Personalize bool                   `json:"personalize"`
	UserData    []services.UserProfile `json:"user_data"`
}

// POST /api/erp/whatsapp/bulk-send
func (h *WhatsAppHandler) BulkSendMessages(c *gin.Context) {
	var req WhatsAppBulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// If personalization is needed, get AI recommendations per user
	if req.Personalize && len(req.UserData) > 0 {
		for _, user := range req.UserData {
			// Check Opt-Out Status
			var customer models.Customer
			if err := h.db.Where("phone = ?", user.PhoneNumber).First(&customer).Error; err == nil {
				if customer.OptOutMarketing {
					// Skip this user
					h.logMessage(req.SessionID, user.PhoneNumber, "whatsapp", req.MessageType, "Skipped: Opt-out", "SKIPPED", "")
					continue
				}
			}

			// Call AI service
			personalizedMsg, err := h.aiService.GenerateMessage(user, req.MessageType, req.Content)
			if err != nil {
				// Fallback to generic content on error
				personalizedMsg = "Hello " + user.Name + ", " + req.Content
			}

			h.sendToWhatsApp(user.PhoneNumber, personalizedMsg, req.SessionID, req.MessageType)
		}
		c.JSON(200, gin.H{"success": true, "message": "Personalized messages sent (simulated)!"})
		return
	}

	// Non-personalized bulk message
	for _, number := range req.Group {
		// Check Opt-Out (if possible by number)
		var customer models.Customer
		if err := h.db.Where("phone = ?", number).First(&customer).Error; err == nil {
			if customer.OptOutMarketing {
				h.logMessage(req.SessionID, number, "whatsapp", req.MessageType, "Skipped: Opt-out", "SKIPPED", "")
				continue
			}
		}

		h.sendToWhatsApp(number, req.Content, req.SessionID, req.MessageType)
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Bulk messages sent!",
		"count":   len(req.Group),
	})
}

// sendToWhatsApp sends a single message via the local/external WhatsApp endpoint
func (h *WhatsAppHandler) sendToWhatsApp(to, message, sessionID, msgType string) {
	payload := map[string]interface{}{
		"to":         to,
		"message":    message,
		"session_id": sessionID,
	}
	jsonPayload, _ := json.Marshal(payload)

	// In a real scenario, this would be your local or external WhatsApp API endpoint
	endpoint := "http://localhost:3000/marketing/whatsapp"

	req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)

	status := "SENT"
	errorMsg := ""
	if err != nil {
		status = "FAILED"
		errorMsg = err.Error()
	} else {
		defer resp.Body.Close()
		if resp.StatusCode >= 400 {
			status = "FAILED"
			errorMsg = "HTTP Error"
		}
	}

	// Log the message
	h.logMessage(sessionID, to, "whatsapp", msgType, message, status, errorMsg)
}

func (h *WhatsAppHandler) logMessage(campaignID, recipient, channel, msgType, content, status, errorMsg string) {
	log := models.MarketingLog{
		ID:          uuid.New().String(),
		CampaignID:  campaignID,
		Recipient:   recipient,
		Channel:     channel,
		MessageType: msgType,
		Content:     content,
		Status:      status,
		Error:       errorMsg,
		SentAt:      time.Now(),
	}
	h.db.Create(&log)
}
