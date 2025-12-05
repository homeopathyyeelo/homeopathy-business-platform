package services

import (
	"encoding/json"
	"log"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type AuditService struct {
	DB *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{DB: db}
}

// LogAction records an action in the audit log
func (s *AuditService) LogAction(userID *string, action, entityType, entityID string, details interface{}) {
	// Run in a goroutine to avoid blocking the main request flow
	go func() {
		detailsJSON, err := json.Marshal(details)
		if err != nil {
			log.Printf("Failed to marshal audit details: %v", err)
			detailsJSON = []byte("{}")
		}

		auditLog := models.GMBAuditLog{
			UserID:     userID,
			Action:     action,
			EntityType: entityType,
			EntityID:   entityID,
			Details:    string(detailsJSON),
		}

		if err := s.DB.Create(&auditLog).Error; err != nil {
			log.Printf("Failed to create audit log: %v", err)
		}
	}()
}
