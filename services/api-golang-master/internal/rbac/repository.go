package rbac

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Repository interface {
	// Roles
	CreateRole(ctx context.Context, role *Role) error
	GetRoleByID(ctx context.Context, id uuid.UUID) (*Role, error)
	GetRoleByCode(ctx context.Context, code string) (*Role, error)
	GetAllRoles(ctx context.Context) ([]Role, error)
	UpdateRole(ctx context.Context, role *Role) error
	DeleteRole(ctx context.Context, id uuid.UUID) error

	// Permissions
	CreatePermission(ctx context.Context, perm *Permission) error
	GetPermissionByID(ctx context.Context, id uuid.UUID) (*Permission, error)
	GetPermissionByCode(ctx context.Context, code string) (*Permission, error)
	GetAllPermissions(ctx context.Context) ([]Permission, error)
	UpdatePermission(ctx context.Context, perm *Permission) error
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

	// Menus
	CreateMenu(ctx context.Context, menu *Menu) error
	GetMenuByID(ctx context.Context, id uuid.UUID) (*Menu, error)
	GetAllMenus(ctx context.Context) ([]Menu, error)
	GetMenuTree(ctx context.Context) ([]MenuTree, error)
	GetUserMenus(ctx context.Context, userID uuid.UUID) ([]MenuTree, error)
	UpdateMenu(ctx context.Context, menu *Menu) error
	DeleteMenu(ctx context.Context, id uuid.UUID) error
}

type repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) Repository {
	return &repository{db: db}
}

// ============================================================================
// ROLES
// ============================================================================

func (r *repository) CreateRole(ctx context.Context, role *Role) error {
	query := `
		INSERT INTO roles (id, name, code, description, level, is_system, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, created_at`

	role.ID = uuid.New()
	return r.db.QueryRowContext(ctx, query,
		role.ID, role.Name, role.Code, role.Description, role.Level, role.IsSystem, role.IsActive,
	).Scan(&role.ID, &role.CreatedAt)
}

func (r *repository) GetRoleByID(ctx context.Context, id uuid.UUID) (*Role, error) {
	var role Role
	query := `SELECT * FROM roles WHERE id = $1`
	err := r.db.GetContext(ctx, &role, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	return &role, err
}

func (r *repository) GetRoleByCode(ctx context.Context, code string) (*Role, error) {
	var role Role
	query := `SELECT * FROM roles WHERE code = $1`
	err := r.db.GetContext(ctx, &role, query, code)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("role not found")
	}
	return &role, err
}

func (r *repository) GetAllRoles(ctx context.Context) ([]Role, error) {
	var roles []Role
	query := `SELECT * FROM roles WHERE is_active = true ORDER BY level, name`
	err := r.db.SelectContext(ctx, &roles, query)
	return roles, err
}

func (r *repository) UpdateRole(ctx context.Context, role *Role) error {
	query := `
		UPDATE roles 
		SET name = $1, description = $2, level = $3, is_active = $4, updated_at = NOW()
		WHERE id = $5`

	_, err := r.db.ExecContext(ctx, query,
		role.Name, role.Description, role.Level, role.IsActive, role.ID,
	)
	return err
}

func (r *repository) DeleteRole(ctx context.Context, id uuid.UUID) error {
	// Check if it's a system role
	role, err := r.GetRoleByID(ctx, id)
	if err != nil {
		return err
	}
	if role.IsSystem {
		return fmt.Errorf("cannot delete system role")
	}

	query := `DELETE FROM roles WHERE id = $1`
	_, err = r.db.ExecContext(ctx, query, id)
	return err
}

// ============================================================================
// PERMISSIONS
// ============================================================================

func (r *repository) CreatePermission(ctx context.Context, perm *Permission) error {
	query := `
		INSERT INTO permissions (id, name, code, module, action, description, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, created_at`

	perm.ID = uuid.New()
	return r.db.QueryRowContext(ctx, query,
		perm.ID, perm.Name, perm.Code, perm.Module, perm.Action, perm.Description, perm.IsActive,
	).Scan(&perm.ID, &perm.CreatedAt)
}

func (r *repository) GetPermissionByID(ctx context.Context, id uuid.UUID) (*Permission, error) {
	var perm Permission
	query := `SELECT * FROM permissions WHERE id = $1`
	err := r.db.GetContext(ctx, &perm, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}
	return &perm, err
}

func (r *repository) GetPermissionByCode(ctx context.Context, code string) (*Permission, error) {
	var perm Permission
	query := `SELECT * FROM permissions WHERE code = $1`
	err := r.db.GetContext(ctx, &perm, query, code)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("permission not found")
	}
	return &perm, err
}

func (r *repository) GetAllPermissions(ctx context.Context) ([]Permission, error) {
	var perms []Permission
	query := `SELECT * FROM permissions WHERE is_active = true ORDER BY module, action, name`
	err := r.db.SelectContext(ctx, &perms, query)
	return perms, err
}

func (r *repository) UpdatePermission(ctx context.Context, perm *Permission) error {
	query := `
		UPDATE permissions 
		SET name = $1, description = $2, is_active = $3
		WHERE id = $4`

	_, err := r.db.ExecContext(ctx, query,
		perm.Name, perm.Description, perm.IsActive, perm.ID,
	)
	return err
}

func (r *repository) DeletePermission(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM permissions WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

func (r *repository) AssignPermissionsToRole(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	// Start transaction
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete existing permissions
	_, err = tx.ExecContext(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, roleID)
	if err != nil {
		return err
	}

	// Insert new permissions
	query := `INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES ($1, $2, $3, NOW())`
	for _, permID := range permissionIDs {
		_, err = tx.ExecContext(ctx, query, uuid.New(), roleID, permID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *repository) RemovePermissionFromRole(ctx context.Context, roleID, permissionID uuid.UUID) error {
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`
	_, err := r.db.ExecContext(ctx, query, roleID, permissionID)
	return err
}

func (r *repository) GetRolePermissions(ctx context.Context, roleID uuid.UUID) ([]Permission, error) {
	var perms []Permission
	query := `
		SELECT p.* FROM permissions p
		INNER JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1 AND p.is_active = true
		ORDER BY p.module, p.action`

	err := r.db.SelectContext(ctx, &perms, query, roleID)
	return perms, err
}

// ============================================================================
// USER ROLES
// ============================================================================

func (r *repository) AssignRoleToUser(ctx context.Context, userID, roleID uuid.UUID, branchID *uuid.UUID) error {
	query := `
		INSERT INTO user_roles (id, user_id, role_id, branch_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, role_id, branch_id) DO NOTHING`

	_, err := r.db.ExecContext(ctx, query, uuid.New(), userID, roleID, branchID)
	return err
}

func (r *repository) RemoveRoleFromUser(ctx context.Context, userID, roleID uuid.UUID) error {
	query := `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, roleID)
	return err
}

func (r *repository) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]Role, error) {
	var roles []Role
	query := `
		SELECT r.* FROM roles r
		INNER JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.is_active = true
		ORDER BY r.level`

	err := r.db.SelectContext(ctx, &roles, query, userID)
	return roles, err
}

func (r *repository) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	var permissions []string
	query := `
		SELECT DISTINCT p.code FROM permissions p
		INNER JOIN role_permissions rp ON p.id = rp.permission_id
		INNER JOIN user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.is_active = true`

	err := r.db.SelectContext(ctx, &permissions, query, userID)
	return permissions, err
}

// ============================================================================
// MENUS
// ============================================================================

func (r *repository) CreateMenu(ctx context.Context, menu *Menu) error {
	query := `
		INSERT INTO menus (id, name, code, parent_id, path, icon, sort_order, permission_code, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		RETURNING id, created_at`

	menu.ID = uuid.New()
	return r.db.QueryRowContext(ctx, query,
		menu.ID, menu.Name, menu.Code, menu.ParentID, menu.Path, menu.Icon, menu.SortOrder, menu.PermissionCode, menu.IsActive,
	).Scan(&menu.ID, &menu.CreatedAt)
}

func (r *repository) GetMenuByID(ctx context.Context, id uuid.UUID) (*Menu, error) {
	var menu Menu
	query := `SELECT * FROM menus WHERE id = $1`
	err := r.db.GetContext(ctx, &menu, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("menu not found")
	}
	return &menu, err
}

func (r *repository) GetAllMenus(ctx context.Context) ([]Menu, error) {
	var menus []Menu
	query := `SELECT * FROM menus WHERE is_active = true ORDER BY sort_order, name`
	err := r.db.SelectContext(ctx, &menus, query)
	return menus, err
}

func (r *repository) GetMenuTree(ctx context.Context) ([]MenuTree, error) {
	menus, err := r.GetAllMenus(ctx)
	if err != nil {
		return nil, err
	}
	return buildMenuTree(menus, nil), nil
}

func (r *repository) GetUserMenus(ctx context.Context, userID uuid.UUID) ([]MenuTree, error) {
	// Get user permissions
	permissions, err := r.GetUserPermissions(ctx, userID)
	if err != nil {
		return nil, err
	}

	permMap := make(map[string]bool)
	for _, p := range permissions {
		permMap[p] = true
	}

	// Get all menus
	allMenus, err := r.GetAllMenus(ctx)
	if err != nil {
		return nil, err
	}

	// Filter menus by permissions
	var filteredMenus []Menu
	for _, menu := range allMenus {
		if menu.PermissionCode == "" || permMap[menu.PermissionCode] {
			filteredMenus = append(filteredMenus, menu)
		}
	}

	return buildMenuTree(filteredMenus, nil), nil
}

func (r *repository) UpdateMenu(ctx context.Context, menu *Menu) error {
	query := `
		UPDATE menus 
		SET name = $1, parent_id = $2, path = $3, icon = $4, sort_order = $5, permission_code = $6, is_active = $7
		WHERE id = $8`

	_, err := r.db.ExecContext(ctx, query,
		menu.Name, menu.ParentID, menu.Path, menu.Icon, menu.SortOrder, menu.PermissionCode, menu.IsActive, menu.ID,
	)
	return err
}

func (r *repository) DeleteMenu(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM menus WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func buildMenuTree(menus []Menu, parentID *uuid.UUID) []MenuTree {
	var tree []MenuTree

	for _, menu := range menus {
		if (parentID == nil && menu.ParentID == nil) || (parentID != nil && menu.ParentID != nil && *menu.ParentID == *parentID) {
			node := MenuTree{
				Menu:     menu,
				Children: buildMenuTree(menus, &menu.ID),
			}
			tree = append(tree, node)
		}
	}

	return tree
}
