package models

import (
	"time"
	
	"gorm.io/gorm"
)

// User model with all required fields
type User struct {
	ID                string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Email             string     `json:"email" gorm:"uniqueIndex;not null"`
	Username          string     `json:"username" gorm:"uniqueIndex;not null"`
	FullName          string     `json:"fullName" gorm:"not null"`
	Password          string     `json:"-" gorm:"not null"`
	IsActive          bool       `json:"isActive" gorm:"default:true"`
	IsEmailVerified   bool       `json:"isEmailVerified" gorm:"default:false"`
	EmailVerifiedAt   *time.Time `json:"emailVerifiedAt"`
	TwoFactorEnabled  bool       `json:"twoFactorEnabled" gorm:"default:false"`
	TwoFactorSecret   string     `json:"-" gorm:"column:two_factor_secret"`
	LastLoginIP       string     `json:"lastLoginIp"`
	LastLoginAt       *time.Time `json:"lastLoginAt"`
	LoginAttempts     int        `json:"loginAttempts" gorm:"default:0"`
	LockedUntil       *time.Time `json:"lockedUntil"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Groups []UserGroup `json:"groups" gorm:"many2many:user_group_members;"`
}

// User Group model
type UserGroup struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"uniqueIndex;not null"`
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	ParentID    *string    `json:"parentId" gorm:"index"` // For hierarchical groups
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Relationships
	Parent      *UserGroup           `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []UserGroup          `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Users       []User               `json:"users" gorm:"many2many:user_group_members;"`
	Permissions []PermissionGroup    `json:"permissions" gorm:"many2many:group_permissions;"`
}

// Permission model
type Permission struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"uniqueIndex;not null"` // e.g., "users.create", "products.read"
	Resource    string     `json:"resource" gorm:"not null"`        // e.g., "users", "products"
	Action      string     `json:"action" gorm:"not null"`          // e.g., "create", "read", "update", "delete"
	Description string     `json:"description"`
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Permission Group (many-to-many with groups)
type PermissionGroup struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	GroupID      string     `json:"groupId" gorm:"not null"`
	PermissionID string     `json:"permissionId" gorm:"not null"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// User Group Member (many-to-many)
type UserGroupMember struct {
	ID        string `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string `json:"userId" gorm:"not null"`
	GroupID   string `json:"groupId" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
}

// Social Login model
type SocialAccount struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string     `json:"userId" gorm:"not null"`
	Provider    string     `json:"provider" gorm:"not null"` // google, facebook, twitter, linkedin
	ProviderID  string     `json:"providerId" gorm:"not null"`
	Email       string     `json:"email"`
	FullName    string     `json:"fullName"`
	Avatar      string     `json:"avatar"`
	AccessToken string     `json:"-"` // Don't expose in JSON
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Session model for session management
type UserSession struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string     `json:"userId" gorm:"not null"`
	Token        string     `json:"-" gorm:"uniqueIndex;not null"`
	RefreshToken string     `json:"-" gorm:"uniqueIndex"`
	IPAddress    string     `json:"ipAddress" gorm:"not null"`
	UserAgent    string     `json:"userAgent"`
	IsActive     bool       `json:"isActive" gorm:"default:true"`
	ExpiresAt    time.Time  `json:"expiresAt" gorm:"not null"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// Audit Log model
type AuditLog struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      *string    `json:"userId" gorm:"index"`
	Action      string     `json:"action" gorm:"not null"`      // e.g., "user.login", "product.create"
	Resource    string     `json:"resource" gorm:"not null"`    // e.g., "users", "products"
	ResourceID  string     `json:"resourceId"`                  // ID of the affected resource
	Description string     `json:"description"`
	IPAddress   string     `json:"ipAddress" gorm:"not null"`
	UserAgent   string     `json:"userAgent"`
	OldValues   string     `json:"oldValues"`                   // JSON string of old data
	NewValues   string     `json:"newValues"`                   // JSON string of new data
	CreatedAt   time.Time  `json:"createdAt"`
}

// Email Template model
type EmailTemplate struct {
	ID          string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"`
	Subject     string     `json:"subject" gorm:"not null"`
	Body        string     `json:"body" gorm:"type:text;not null"`
	Variables   string     `json:"variables"`                   // JSON array of variable names
	IsActive    bool       `json:"isActive" gorm:"default:true"`
	CreatedBy   string     `json:"createdBy" gorm:"not null"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Email Queue model for scheduled emails
type EmailQueue struct {
	ID           string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	TemplateID   string     `json:"templateId" gorm:"not null"`
	FromEmail    string     `json:"fromEmail" gorm:"not null"`
	ToEmails     string     `json:"toEmails" gorm:"type:text;not null"` // JSON array
	Subject      string     `json:"subject" gorm:"not null"`
	Body         string     `json:"body" gorm:"type:text;not null"`
	Variables    string     `json:"variables"`                         // JSON object for template variables
	Status       string     `json:"status" gorm:"default:pending"`     // pending, sent, failed
	ScheduledAt  *time.Time `json:"scheduledAt"`
	SentAt       *time.Time `json:"sentAt"`
	ErrorMessage string     `json:"errorMessage"`
	CreatedBy    string     `json:"createdBy" gorm:"not null"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// Password Reset model
type PasswordReset struct {
	ID        string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string     `json:"userId" gorm:"not null"`
	Token     string     `json:"token" gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time  `json:"expiresAt" gorm:"not null"`
	IsUsed    bool       `json:"isUsed" gorm:"default:false"`
	CreatedAt time.Time  `json:"createdAt"`
}
