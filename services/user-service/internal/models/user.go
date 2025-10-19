package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID             string         `gorm:"type:uuid;primary_key" json:"id"`
	Username       string         `gorm:"uniqueIndex;not null" json:"username"`
	Email          string         `gorm:"uniqueIndex;not null" json:"email"`
	Phone          string         `gorm:"index" json:"phone"`
	FirstName      string         `gorm:"not null" json:"first_name"`
	LastName       string         `gorm:"not null" json:"last_name"`
	PasswordHash   string         `gorm:"not null" json:"-"`
	RoleID         string         `gorm:"type:uuid;index" json:"role_id"`
	Role           *Role          `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	DepartmentID   *string        `gorm:"type:uuid;index" json:"department_id"`
	Department     *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	BranchID       *string        `gorm:"type:uuid;index" json:"branch_id"`
	Branch         *Branch        `gorm:"foreignKey:BranchID" json:"branch,omitempty"`
	EmployeeCode   *string        `gorm:"uniqueIndex" json:"employee_code"`
	Designation    *string        `json:"designation"`
	DateOfJoining  *time.Time     `json:"date_of_joining"`
	IsActive       bool           `gorm:"default:true" json:"is_active"`
	LastLogin      *time.Time     `json:"last_login"`
	ProfileImage   *string        `json:"profile_image"`
	EmailVerified  bool           `gorm:"default:false" json:"email_verified"`
	PhoneVerified  bool           `gorm:"default:false" json:"phone_verified"`
	TwoFactorEnabled bool         `gorm:"default:false" json:"two_factor_enabled"`
	Metadata       map[string]interface{} `gorm:"type:jsonb" json:"metadata"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

type Role struct {
	ID           string         `gorm:"type:uuid;primary_key" json:"id"`
	Name         string         `gorm:"uniqueIndex;not null" json:"name"`
	Description  *string        `json:"description"`
	Permissions  []Permission   `gorm:"many2many:role_permissions;" json:"permissions"`
	IsSystemRole bool           `gorm:"default:false" json:"is_system_role"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

type Permission struct {
	ID          string         `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code"`
	Module      string         `gorm:"index" json:"module"`
	Action      string         `json:"action"`
	Description *string        `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

type Department struct {
	ID          string         `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code"`
	Description *string        `json:"description"`
	HeadID      *string        `gorm:"type:uuid" json:"head_id"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (d *Department) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return nil
}

type Branch struct {
	ID            string         `gorm:"type:uuid;primary_key" json:"id"`
	Name          string         `gorm:"not null" json:"name"`
	Code          string         `gorm:"uniqueIndex;not null" json:"code"`
	Address       string         `json:"address"`
	City          string         `json:"city"`
	State         string         `json:"state"`
	Pincode       string         `json:"pincode"`
	Phone         string         `json:"phone"`
	Email         *string        `json:"email"`
	ManagerID     *string        `gorm:"type:uuid" json:"manager_id"`
	IsHeadOffice  bool           `gorm:"default:false" json:"is_head_office"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	WorkingHours  map[string]interface{} `gorm:"type:jsonb" json:"working_hours"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *Branch) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}

type UserSession struct {
	ID           string         `gorm:"type:uuid;primary_key" json:"id"`
	UserID       string         `gorm:"type:uuid;index;not null" json:"user_id"`
	User         *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	RefreshToken string         `gorm:"uniqueIndex;not null" json:"-"`
	IPAddress    string         `json:"ip_address"`
	UserAgent    string         `json:"user_agent"`
	ExpiresAt    time.Time      `gorm:"index" json:"expires_at"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

func (s *UserSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

type AuditLog struct {
	ID         string                 `gorm:"type:uuid;primary_key" json:"id"`
	UserID     *string                `gorm:"type:uuid;index" json:"user_id"`
	Action     string                 `gorm:"index" json:"action"`
	Resource   string                 `gorm:"index" json:"resource"`
	ResourceID *string                `json:"resource_id"`
	Changes    map[string]interface{} `gorm:"type:jsonb" json:"changes"`
	IPAddress  string                 `json:"ip_address"`
	UserAgent  string                 `json:"user_agent"`
	Status     string                 `json:"status"`
	CreatedAt  time.Time              `gorm:"index" json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
