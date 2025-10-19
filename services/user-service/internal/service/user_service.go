package service

import (
	"context"
	"fmt"
	"time"

	"github.com/yeelo/user-service/internal/kafka"
	"github.com/yeelo/user-service/internal/models"
	"github.com/yeelo/user-service/internal/redis"
	"github.com/yeelo/user-service/internal/repository"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Create(ctx context.Context, user *models.User, password string) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, pageSize int) ([]*models.User, int64, error)
	Search(ctx context.Context, query string, page, pageSize int) ([]*models.User, int64, error)
	ChangePassword(ctx context.Context, userID, oldPassword, newPassword string) error
}

type userService struct {
	repo     repository.UserRepository
	redis    *redis.Client
	kafka    *kafka.Producer
	logger   *zap.Logger
}

func NewUserService(
	repo repository.UserRepository,
	redis *redis.Client,
	kafka *kafka.Producer,
	logger *zap.Logger,
) UserService {
	return &userService{
		repo:   repo,
		redis:  redis,
		kafka:  kafka,
		logger: logger,
	}
}

func (s *userService) Create(ctx context.Context, user *models.User, password string) error {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	user.PasswordHash = string(hashedPassword)

	// Create user
	if err := s.repo.Create(ctx, user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Publish event
	go func() {
		if err := s.kafka.PublishUserCreated(context.Background(), user.ID, map[string]interface{}{
			"email":      user.Email,
			"username":   user.Username,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		}); err != nil {
			s.logger.Error("Failed to publish user created event", zap.Error(err))
		}
	}()

	// Cache user
	cacheKey := fmt.Sprintf("user:%s", user.ID)
	if err := s.redis.Set(ctx, cacheKey, user, 15*time.Minute); err != nil {
		s.logger.Warn("Failed to cache user", zap.Error(err))
	}

	return nil
}

func (s *userService) GetByID(ctx context.Context, id string) (*models.User, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("user:%s", id)
	var user models.User
	if err := s.redis.Get(ctx, cacheKey, &user); err == nil {
		return &user, nil
	}

	// Get from database
	dbUser, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache for future requests
	if err := s.redis.Set(ctx, cacheKey, dbUser, 15*time.Minute); err != nil {
		s.logger.Warn("Failed to cache user", zap.Error(err))
	}

	return dbUser, nil
}

func (s *userService) Update(ctx context.Context, user *models.User) error {
	if err := s.repo.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("user:%s", user.ID)
	if err := s.redis.Delete(ctx, cacheKey); err != nil {
		s.logger.Warn("Failed to invalidate cache", zap.Error(err))
	}

	// Publish event
	go func() {
		if err := s.kafka.PublishUserUpdated(context.Background(), user.ID, map[string]interface{}{
			"email":      user.Email,
			"username":   user.Username,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
		}); err != nil {
			s.logger.Error("Failed to publish user updated event", zap.Error(err))
		}
	}()

	return nil
}

func (s *userService) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("user:%s", id)
	if err := s.redis.Delete(ctx, cacheKey); err != nil {
		s.logger.Warn("Failed to invalidate cache", zap.Error(err))
	}

	// Publish event
	go func() {
		if err := s.kafka.PublishUserDeleted(context.Background(), id); err != nil {
			s.logger.Error("Failed to publish user deleted event", zap.Error(err))
		}
	}()

	return nil
}

func (s *userService) List(ctx context.Context, page, pageSize int) ([]*models.User, int64, error) {
	offset := (page - 1) * pageSize
	return s.repo.List(ctx, offset, pageSize)
}

func (s *userService) Search(ctx context.Context, query string, page, pageSize int) ([]*models.User, int64, error) {
	offset := (page - 1) * pageSize
	return s.repo.Search(ctx, query, offset, pageSize)
}

func (s *userService) ChangePassword(ctx context.Context, userID, oldPassword, newPassword string) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return fmt.Errorf("invalid old password")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.PasswordHash = string(hashedPassword)
	return s.repo.Update(ctx, user)
}
