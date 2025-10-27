package rbac

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service interface {
	// Roles
	CreateRole(ctx context.Context, req CreateRoleRequest) (*Role, error)
	GetRole(ctx context.Context, id uuid.UUID) (*Role, error)
	GetAllRoles(ctx context.Context) ([]Role, error)
	UpdateRole(ctx context.Context, id uuid.UUID, req UpdateRoleRequest) (*Role, error)
	DeleteRole(ctx context.Context, id uuid.UUID) error
	GetRoleWithPermissions(ctx context.Context, id uuid.UUID) (*RoleWithPermissions, error)

	// Permissions
	CreatePermission(ctx context.Context, req CreatePermissionRequest) (*Permission, error)
	GetPermission(ctx context.Context, id uuid.UUID) (*Permission, error)
	GetAllPermissions(ctx context.Context) ([]Permission, error)
	UpdatePermission(ctx context.Context, id uuid.UUID, name, description string, isActive bool) (*Permission, error)
	DeletePermission(ctx context.Context, id uuid.UUID) error

	// Role Permissions
	AssignPermissionsToRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error
	RemovePermissionFromRole(ctx context.Context, roleID, permissionID uuid.UUID) error
	GetRolePermissions(ctx context.Context, roleID uuid.UUID) ([]Permission, error)

	// User Roles
	AssignRoleToUser(ctx context.Context, userID, roleID uuid.UUID, branchID *uuid.UUID) error
	RemoveRoleFromUser(ctx context.Context, userID, roleID uuid.UUID) error
	GetUserRoles(ctx context.Context, userID uuid.UUID) ([]Role, error)
	GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error)
	CheckUserPermission(ctx context.Context, userID uuid.UUID, permissionCode string) (bool, error)

	// Menus
	CreateMenu(ctx context.Context, req CreateMenuRequest) (*Menu, error)
	GetMenu(ctx context.Context, id uuid.UUID) (*Menu, error)
	GetAllMenus(ctx context.Context) ([]Menu, error)
	GetMenuTree(ctx context.Context) ([]MenuTree, error)
	GetUserMenus(ctx context.Context, userID uuid.UUID) ([]MenuTree, error)
	UpdateMenu(ctx context.Context, id uuid.UUID, req UpdateMenuRequest) (*Menu, error)
	DeleteMenu(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

// ============================================================================
// ROLES
// ============================================================================

func (s *service) CreateRole(ctx context.Context, req CreateRoleRequest) (*Role, error) {
	// Check if code already exists
	existing, _ := s.repo.GetRoleByCode(ctx, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("role with code %s already exists", req.Code)
	}

	role := &Role{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Level:       req.Level,
		IsSystem:    false,
		IsActive:    true,
	}

	err := s.repo.CreateRole(ctx, role)
	if err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return role, nil
}

func (s *service) GetRole(ctx context.Context, id uuid.UUID) (*Role, error) {
	return s.repo.GetRoleByID(ctx, id)
}

func (s *service) GetAllRoles(ctx context.Context) ([]Role, error) {
	return s.repo.GetAllRoles(ctx)
}

func (s *service) UpdateRole(ctx context.Context, id uuid.UUID, req UpdateRoleRequest) (*Role, error) {
	role, err := s.repo.GetRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if role.IsSystem {
		return nil, fmt.Errorf("cannot update system role")
	}

	role.Name = req.Name
	role.Description = req.Description
	role.Level = req.Level
	role.IsActive = req.IsActive

	err = s.repo.UpdateRole(ctx, role)
	if err != nil {
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	return role, nil
}

func (s *service) DeleteRole(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRole(ctx, id)
}

func (s *service) GetRoleWithPermissions(ctx context.Context, id uuid.UUID) (*RoleWithPermissions, error) {
	role, err := s.repo.GetRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}

	permissions, err := s.repo.GetRolePermissions(ctx, id)
	if err != nil {
		return nil, err
	}

	return &RoleWithPermissions{
		Role:        *role,
		Permissions: permissions,
	}, nil
}

// ============================================================================
// PERMISSIONS
// ============================================================================

func (s *service) CreatePermission(ctx context.Context, req CreatePermissionRequest) (*Permission, error) {
	// Check if code already exists
	existing, _ := s.repo.GetPermissionByCode(ctx, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("permission with code %s already exists", req.Code)
	}

	perm := &Permission{
		Name:        req.Name,
		Code:        req.Code,
		Module:      req.Module,
		Action:      req.Action,
		Description: req.Description,
		IsActive:    true,
	}

	err := s.repo.CreatePermission(ctx, perm)
	if err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	return perm, nil
}

func (s *service) GetPermission(ctx context.Context, id uuid.UUID) (*Permission, error) {
	return s.repo.GetPermissionByID(ctx, id)
}

func (s *service) GetAllPermissions(ctx context.Context) ([]Permission, error) {
	return s.repo.GetAllPermissions(ctx)
}

func (s *service) UpdatePermission(ctx context.Context, id uuid.UUID, name, description string, isActive bool) (*Permission, error) {
	perm, err := s.repo.GetPermissionByID(ctx, id)
	if err != nil {
		return nil, err
	}

	perm.Name = name
	perm.Description = description
	perm.IsActive = isActive

	err = s.repo.UpdatePermission(ctx, perm)
	if err != nil {
		return nil, fmt.Errorf("failed to update permission: %w", err)
	}

	return perm, nil
}

func (s *service) DeletePermission(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeletePermission(ctx, id)
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

func (s *service) AssignPermissionsToRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	// Verify role exists
	_, err := s.repo.GetRoleByID(ctx, roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Verify all permissions exist
	for _, permID := range permissionIDs {
		_, err := s.repo.GetPermissionByID(ctx, permID)
		if err != nil {
			return fmt.Errorf("permission %s not found: %w", permID, err)
		}
	}

	return s.repo.AssignPermissionsToRole(ctx, roleID, permissionIDs)
}

func (s *service) RemovePermissionFromRole(ctx context.Context, roleID, permissionID uuid.UUID) error {
	return s.repo.RemovePermissionFromRole(ctx, roleID, permissionID)
}

func (s *service) GetRolePermissions(ctx context.Context, roleID uuid.UUID) ([]Permission, error) {
	return s.repo.GetRolePermissions(ctx, roleID)
}

// ============================================================================
// USER ROLES
// ============================================================================

func (s *service) AssignRoleToUser(ctx context.Context, userID, roleID uuid.UUID, branchID *uuid.UUID) error {
	// Verify role exists
	_, err := s.repo.GetRoleByID(ctx, roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	return s.repo.AssignRoleToUser(ctx, userID, roleID, branchID)
}

func (s *service) RemoveRoleFromUser(ctx context.Context, userID, roleID uuid.UUID) error {
	return s.repo.RemoveRoleFromUser(ctx, userID, roleID)
}

func (s *service) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]Role, error) {
	return s.repo.GetUserRoles(ctx, userID)
}

func (s *service) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	return s.repo.GetUserPermissions(ctx, userID)
}

func (s *service) CheckUserPermission(ctx context.Context, userID uuid.UUID, permissionCode string) (bool, error) {
	permissions, err := s.repo.GetUserPermissions(ctx, userID)
	if err != nil {
		return false, err
	}

	for _, p := range permissions {
		if p == permissionCode {
			return true, nil
		}
	}

	return false, nil
}

// ============================================================================
// MENUS
// ============================================================================

func (s *service) CreateMenu(ctx context.Context, req CreateMenuRequest) (*Menu, error) {
	// Check if code already exists
	menus, err := s.repo.GetAllMenus(ctx)
	if err != nil {
		return nil, err
	}

	for _, m := range menus {
		if m.Code == req.Code {
			return nil, fmt.Errorf("menu with code %s already exists", req.Code)
		}
	}

	menu := &Menu{
		Name:           req.Name,
		Code:           req.Code,
		ParentID:       req.ParentID,
		Path:           req.Path,
		Icon:           req.Icon,
		SortOrder:      req.SortOrder,
		PermissionCode: req.PermissionCode,
		IsActive:       true,
	}

	err = s.repo.CreateMenu(ctx, menu)
	if err != nil {
		return nil, fmt.Errorf("failed to create menu: %w", err)
	}

	return menu, nil
}

func (s *service) GetMenu(ctx context.Context, id uuid.UUID) (*Menu, error) {
	return s.repo.GetMenuByID(ctx, id)
}

func (s *service) GetAllMenus(ctx context.Context) ([]Menu, error) {
	return s.repo.GetAllMenus(ctx)
}

func (s *service) GetMenuTree(ctx context.Context) ([]MenuTree, error) {
	return s.repo.GetMenuTree(ctx)
}

func (s *service) GetUserMenus(ctx context.Context, userID uuid.UUID) ([]MenuTree, error) {
	return s.repo.GetUserMenus(ctx, userID)
}

func (s *service) UpdateMenu(ctx context.Context, id uuid.UUID, req UpdateMenuRequest) (*Menu, error) {
	menu, err := s.repo.GetMenuByID(ctx, id)
	if err != nil {
		return nil, err
	}

	menu.Name = req.Name
	menu.ParentID = req.ParentID
	menu.Path = req.Path
	menu.Icon = req.Icon
	menu.SortOrder = req.SortOrder
	menu.PermissionCode = req.PermissionCode
	menu.IsActive = req.IsActive

	err = s.repo.UpdateMenu(ctx, menu)
	if err != nil {
		return nil, fmt.Errorf("failed to update menu: %w", err)
	}

	return menu, nil
}

func (s *service) DeleteMenu(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteMenu(ctx, id)
}
