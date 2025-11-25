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
	AccountID    string     `gorm:"type:uuid;not null" json:"account_id"`
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
	ID             string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AccountID      string     `gorm:"type:uuid;not null" json:"account_id"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	ScheduleType   string     `gorm:"type:varchar(50);not null" json:"schedule_type"` // DAILY, WEEKLY, MONTHLY, SEASONAL
	TimeOfDay      string     `gorm:"type:time;not null" json:"time_of_day"`
	DayOfWeek      *int       `gorm:"type:integer" json:"day_of_week,omitempty"`         // 0-6 (Sunday-Saturday)
	DayOfMonth     *int       `gorm:"type:integer" json:"day_of_month,omitempty"`        // 1-31
	SeasonalPreset *string    `gorm:"type:varchar(50)" json:"seasonal_preset,omitempty"` // WINTER, SUMMER, MONSOON, FESTIVE
	LastRunAt      *time.Time `gorm:"type:timestamp with time zone" json:"last_run_at,omitempty"`
	NextRunAt      *time.Time `gorm:"type:timestamp with time zone" json:"next_run_at,omitempty"`
	CreatedAt      time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}
