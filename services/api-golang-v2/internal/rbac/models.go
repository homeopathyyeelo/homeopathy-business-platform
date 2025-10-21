package rbac

import (
	"time"

	"github.com/google/uuid"
)

// Role represents a user role in the system
type Role struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name" binding:"required"`
	Code        string     `json:"code" db:"code" binding:"required"`
	Description string     `json:"description" db:"description"`
	Level       int        `json:"level" db:"level"`
	IsSystem    bool       `json:"is_system" db:"is_system"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at" db:"updated_at"`
}

// Permission represents a system permission
type Permission struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name" binding:"required"`
	Code        string     `json:"code" db:"code" binding:"required"`
	Module      string     `json:"module" db:"module" binding:"required"`
	Action      string     `json:"action" db:"action" binding:"required"`
	Description string     `json:"description" db:"description"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// RolePermission represents the many-to-many relationship
type RolePermission struct {
	ID           uuid.UUID `json:"id" db:"id"`
	RoleID       uuid.UUID `json:"role_id" db:"role_id"`
	PermissionID uuid.UUID `json:"permission_id" db:"permission_id"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// UserRole represents user role assignment
type UserRole struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	RoleID    uuid.UUID  `json:"role_id" db:"role_id"`
	BranchID  *uuid.UUID `json:"branch_id" db:"branch_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// Menu represents a navigation menu item
type Menu struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	Name           string     `json:"name" db:"name" binding:"required"`
	Code           string     `json:"code" db:"code" binding:"required"`
	ParentID       *uuid.UUID `json:"parent_id" db:"parent_id"`
	Path           string     `json:"path" db:"path"`
	Icon           string     `json:"icon" db:"icon"`
	SortOrder      int        `json:"sort_order" db:"sort_order"`
	PermissionCode string     `json:"permission_code" db:"permission_code"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// MenuTree represents a hierarchical menu structure
type MenuTree struct {
	Menu
	Children []MenuTree `json:"children,omitempty"`
}

// RoleWithPermissions includes role and its permissions
type RoleWithPermissions struct {
	Role
	Permissions []Permission `json:"permissions"`
}

// UserWithRoles includes user and their roles
type UserWithRoles struct {
	UserID      uuid.UUID `json:"user_id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	Roles       []Role    `json:"roles"`
	Permissions []string  `json:"permissions"` // permission codes
}

// CreateRoleRequest for creating a new role
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Level       int    `json:"level"`
}

// UpdateRoleRequest for updating a role
type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Level       int    `json:"level"`
	IsActive    bool   `json:"is_active"`
}

// CreatePermissionRequest for creating a new permission
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Module      string `json:"module" binding:"required"`
	Action      string `json:"action" binding:"required"`
	Description string `json:"description"`
}

// AssignPermissionsRequest for assigning permissions to a role
type AssignPermissionsRequest struct {
	PermissionIDs []uuid.UUID `json:"permission_ids" binding:"required"`
}

// CreateMenuRequest for creating a new menu
type CreateMenuRequest struct {
	Name           string     `json:"name" binding:"required"`
	Code           string     `json:"code" binding:"required"`
	ParentID       *uuid.UUID `json:"parent_id"`
	Path           string     `json:"path"`
	Icon           string     `json:"icon"`
	SortOrder      int        `json:"sort_order"`
	PermissionCode string     `json:"permission_code"`
}

// UpdateMenuRequest for updating a menu
type UpdateMenuRequest struct {
	Name           string     `json:"name"`
	ParentID       *uuid.UUID `json:"parent_id"`
	Path           string     `json:"path"`
	Icon           string     `json:"icon"`
	SortOrder      int        `json:"sort_order"`
	PermissionCode string     `json:"permission_code"`
	IsActive       bool       `json:"is_active"`
}
