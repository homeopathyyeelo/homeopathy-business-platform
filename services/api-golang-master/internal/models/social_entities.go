package models

import (
	"time"
)

// ============================================================================
// SOCIAL MARKETING STRUCTS
// ============================================================================

type SocialAccount struct {
	ID           string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Platform     string     `json:"platform" gorm:"not null"` // facebook, instagram
	AccountName  string     `json:"accountName" gorm:"not null"`
	AccountID    string     `json:"accountId" gorm:"not null"` // External ID
	AccessToken  string     `json:"accessToken" gorm:"not null"`
	RefreshToken string     `json:"refreshToken"`
	TokenExpiry  *time.Time `json:"tokenExpiry"`
	IsActive     bool       `json:"isActive" gorm:"default:true"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// Relationships
	Posts []SocialPost `json:"posts" gorm:"foreignKey:AccountID"`
}

func (SocialAccount) TableName() string { return "social_accounts" }

type SocialPost struct {
	ID             string     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AccountID      string     `json:"accountId" gorm:"type:uuid;not null"`
	Platform       string     `json:"platform" gorm:"not null"`
	Content        string     `json:"content"`
	MediaURLs      string     `json:"mediaUrls" gorm:"type:text"` // JSON array of URLs
	ScheduledTime  *time.Time `json:"scheduledTime"`
	PostedTime     *time.Time `json:"postedTime"`
	Status         string     `json:"status" gorm:"default:'draft'"` // draft, scheduled, posted, failed
	ExternalPostID string     `json:"externalPostId"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`

	// Relationships
	Account   *SocialAccount   `json:"account" gorm:"foreignKey:AccountID"`
	Analytics *SocialAnalytics `json:"analytics" gorm:"foreignKey:PostID"`
}

func (SocialPost) TableName() string { return "social_posts" }

type SocialAnalytics struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PostID      string    `json:"postId" gorm:"type:uuid;not null"`
	AccountID   string    `json:"accountId" gorm:"type:uuid;not null"`
	Platform    string    `json:"platform" gorm:"not null"`
	Likes       int       `json:"likes" gorm:"default:0"`
	Comments    int       `json:"comments" gorm:"default:0"`
	Shares      int       `json:"shares" gorm:"default:0"`
	Reach       int       `json:"reach" gorm:"default:0"`
	Impressions int       `json:"impressions" gorm:"default:0"`
	Clicks      int       `json:"clicks" gorm:"default:0"`
	RecordedAt  time.Time `json:"recordedAt"`
}

func (SocialAnalytics) TableName() string { return "social_analytics" }
