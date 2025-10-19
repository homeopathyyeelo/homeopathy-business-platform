package service

import (
	"context"
	"fmt"
	"time"

	"github.com/yeelo/user-service/internal/models"
	"github.com/yeelo/user-service/internal/redis"
	"github.com/yeelo/user-service/internal/repository"
	"go.uber.org/zap"
)

type RoleService interface {
	Create(ctx context.Context, role *models.Role) error
	GetByID(ctx context.Context, id string) (*models.Role, error)
	Update(ctx context.Context, role *models.Role) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, pageSize int) ([]*models.Role, int64, error)
	AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error
}

type roleService struct {
	repo   repository.RoleRepository
	redis  *redis.Client
	logger *zap.Logger
}

func NewRoleService(
	repo repository.RoleRepository,
	redis *redis.Client,
	logger *zap.Logger,
) RoleService {
	return &roleService{
		repo:   repo,
		redis:  redis,
		logger: logger,
	}
}

func (s *roleService) Create(ctx context.Context, role *models.Role) error {
	return s.repo.Create(ctx, role)
}

func (s *roleService) GetByID(ctx context.Context, id string) (*models.Role, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("role:%s", id)
	var role models.Role
	if err := s.redis.Get(ctx, cacheKey, &role); err == nil {
		return &role, nil
	}

	// Get from database
	dbRole, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache for future requests
	if err := s.redis.Set(ctx, cacheKey, dbRole, 30*time.Minute); err != nil {
		s.logger.Warn("Failed to cache role", zap.Error(err))
	}

	return dbRole, nil
}

func (s *roleService) Update(ctx context.Context, role *models.Role) error {
	if err := s.repo.Update(ctx, role); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("role:%s", role.ID)
	if err := s.redis.Delete(ctx, cacheKey); err != nil {
		s.logger.Warn("Failed to invalidate cache", zap.Error(err))
	}

	return nil
}

func (s *roleService) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("role:%s", id)
	if err := s.redis.Delete(ctx, cacheKey); err != nil {
		s.logger.Warn("Failed to invalidate cache", zap.Error(err))
	}

	return nil
}

func (s *roleService) List(ctx context.Context, page, pageSize int) ([]*models.Role, int64, error) {
	offset := (page - 1) * pageSize
	return s.repo.List(ctx, offset, pageSize)
}

func (s *roleService) AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	if err := s.repo.AssignPermissions(ctx, roleID, permissionIDs); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("role:%s", roleID)
	if err := s.redis.Delete(ctx, cacheKey); err != nil {
		s.logger.Warn("Failed to invalidate cache", zap.Error(err))
	}

	return nil
}
