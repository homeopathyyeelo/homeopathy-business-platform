package models

import "time"

// Session represents a persisted user session associated with a JWT token.
type Session struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;index;not null" json:"user_id"`
	Token     string    `gorm:"type:varchar(500);uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"type:timestamptz;index;not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"type:timestamptz;autoCreateTime" json:"created_at"`
}

// TableName overrides the table name
func (Session) TableName() string {
	return "sessions"
}
