package models

import (
	"time"
)

type MarketingLog struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CampaignID  string    `json:"campaignId"` // SessionID or CampaignID
	Recipient   string    `json:"recipient"`  // Phone number or Email
	Channel     string    `json:"channel"`    // WHATSAPP, EMAIL, SMS
	MessageType string    `json:"messageType"`
	Content     string    `json:"content"`
	Status      string    `json:"status"` // SENT, FAILED, DELIVERED
	Error       string    `json:"error"`
	SentAt      time.Time `json:"sentAt" gorm:"default:now()"`
}

func (MarketingLog) TableName() string { return "marketing_logs" }
