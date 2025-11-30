package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RecommendationCache stores pre-computed product recommendations
type RecommendationCache struct {
	ID                  uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProductID           string         `json:"product_id" gorm:"index;unique"`
	RecommendationsJSON string         `json:"recommendations_json" gorm:"type:jsonb"` // Stores []ProductRecommendation as JSON
	LastComputedAt      time.Time      `json:"last_computed_at"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
