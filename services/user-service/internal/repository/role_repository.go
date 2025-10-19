package repository

import (
	"context"
	"fmt"

	"github.com/yeelo/user-service/internal/models"
	"gorm.io/gorm"
)

type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	GetByID(ctx context.Context, id string) (*models.Role, error)
	GetByName(ctx context.Context, name string) (*models.Role, error)
	Update(ctx context.Context, role *models.Role) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, offset, limit int) ([]*models.Role, int64, error)
	AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error
}

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) Create(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *roleRepository) GetByID(ctx context.Context, id string) (*models.Role, error) {
	var role models.Role
	err := r.db.WithContext(ctx).
		Preload("Permissions").
		First(&role, "id = ?", id).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("role not found")
		}
		return nil, err
	}
	
	return &role, nil
}

func (r *roleRepository) GetByName(ctx context.Context, name string) (*models.Role, error) {
	var role models.Role
	err := r.db.WithContext(ctx).
		Preload("Permissions").
		First(&role, "name = ?", name).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("role not found")
		}
		return nil, err
	}
	
	return &role, nil
}

func (r *roleRepository) Update(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Save(role).Error
}

func (r *roleRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Role{}, "id = ?", id).Error
}

func (r *roleRepository) List(ctx context.Context, offset, limit int) ([]*models.Role, int64, error) {
	var roles []*models.Role
	var total int64

	if err := r.db.WithContext(ctx).Model(&models.Role{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Permissions").
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&roles).Error

	return roles, total, err
}

func (r *roleRepository) AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	var role models.Role
	if err := r.db.WithContext(ctx).First(&role, "id = ?", roleID).Error; err != nil {
		return err
	}

	var permissions []models.Permission
	if err := r.db.WithContext(ctx).Find(&permissions, "id IN ?", permissionIDs).Error; err != nil {
		return err
	}

	return r.db.WithContext(ctx).Model(&role).Association("Permissions").Replace(permissions)
}
