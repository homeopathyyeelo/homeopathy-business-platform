package models

import (
	"time"
)

// GMBAccount represents a connected Google My Business account
type GMBAccount struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AccountName    string    `gorm:"not null" json:"account_name"`
	AccountID      string    `gorm:"not null;unique" json:"account_id"`
	LocationID     string    `gorm:"not null" json:"location_id"`
	LocationName   string    `gorm:"not null" json:"location_name"`
	AccessToken    string    `gorm:"not null" json:"-"`
	RefreshToken   string    `gorm:"not null" json:"-"`
	TokenExpiresAt time.Time `gorm:"not null" json:"token_expires_at"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedBy      string    `gorm:"type:uuid;references:users(id)" json:"created_by"`
	CreatedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// GMBPost represents a post in Google My Business
type GMBPost struct {
	ID           string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AccountID    string     `gorm:"column:gmb_account_id;not null" json:"account_id"` // Maps to gmb_account_id bigint in database
	Title        string     `gorm:"not null" json:"title"`
	Content      string     `gorm:"type:text;not null" json:"content"`
	Status       string     `gorm:"type:varchar(50);default:'DRAFT'" json:"status"`
	ScheduledFor *time.Time `gorm:"type:timestamp with time zone" json:"scheduled_for,omitempty"`
	PublishedAt  *time.Time `gorm:"type:timestamp with time zone" json:"published_at,omitempty"`
	PostURL      string     `gorm:"type:varchar(255)" json:"post_url,omitempty"`
	ErrorMessage string     `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// GMBHistory tracks actions taken on GMB
type GMBHistory struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AccountID string         `gorm:"type:uuid;not null" json:"account_id"`
	Action    string         `gorm:"type:varchar(50);not null" json:"action"`
	Details   map[string]any `gorm:"type:jsonb" json:"details,omitempty"`
	CreatedAt time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

// GMBSchedule represents the scheduling configuration
type GMBSchedule struct {
	ID           string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AccountID    string     `gorm:"type:uuid;not null" json:"account_id"`
	ScheduleType string     `gorm:"type:varchar(50);not null" json:"schedule_type"` // DAILY, WEEKLY, CUSTOM
	Days         []string   `gorm:"type:text[]" json:"days,omitempty"`              // MONDAY, TUESDAY etc
	Time         string     `gorm:"type:varchar(5);not null" json:"time"`           // HH:MM
	Topics       []string   `gorm:"type:text[]" json:"topics,omitempty"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	LastRunAt    *time.Time `gorm:"type:timestamp with time zone" json:"last_run_at,omitempty"`
	NextRunAt    *time.Time `gorm:"type:timestamp with time zone" json:"next_run_at,omitempty"`
	CreatedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// GMBScheduledPost represents a specific post scheduled for future publication
type GMBScheduledPost struct {
	ID                string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	GMBAccountID      string    `gorm:"type:uuid;not null" json:"gmb_account_id"`
	Content           string    `gorm:"type:text;not null" json:"content"`
	MediaURL          string    `gorm:"type:text" json:"media_url,omitempty"`
	ScheduledTime     time.Time `gorm:"type:timestamp with time zone;not null" json:"scheduled_time"`
	IsRecurring       bool      `gorm:"default:false" json:"is_recurring"`
	RecurrencePattern string    `gorm:"type:varchar(50)" json:"recurrence_pattern,omitempty"` // DAILY, WEEKLY, MONTHLY
	Status            string    `gorm:"type:varchar(20);default:'SCHEDULED'" json:"status"`   // SCHEDULED, PUBLISHED, FAILED, CANCELLED
	CreatedBy         string    `gorm:"type:uuid" json:"created_by"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Relationships
	Account GMBAccount `gorm:"foreignKey:GMBAccountID" json:"account,omitempty"`
}

// GMBAuditLog represents an audit log entry for GMB actions
type GMBAuditLog struct {
	ID         string    `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserID     *string   `gorm:"type:uuid"` // Nullable for system actions
	Action     string    `gorm:"not null"`  // POST_CREATED, POST_PUBLISHED, etc.
	EntityType string    `gorm:"not null"`  // GMB_POST, GMB_ACCOUNT
	EntityID   string    `gorm:"not null"`
	Details    string    `gorm:"type:text"` // JSON string
	CreatedAt  time.Time `gorm:"autoCreateTime"`
}
