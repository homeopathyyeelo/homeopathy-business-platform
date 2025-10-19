package service

import (
	"context"

	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/redis"
	"github.com/yeelo/product-service/internal/repository"
	"go.uber.org/zap"
)

type CategoryService interface {
	Create(ctx context.Context, category *models.Category) error
	GetByID(ctx context.Context, id string) (*models.Category, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Category, int64, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id string) error
}

type categoryService struct {
	repo   repository.CategoryRepository
	redis  *redis.Client
	logger *zap.Logger
}

func NewCategoryService(repo repository.CategoryRepository, redis *redis.Client, logger *zap.Logger) CategoryService {
	return &categoryService{
		repo:   repo,
		redis:  redis,
		logger: logger,
	}
}

func (s *categoryService) Create(ctx context.Context, category *models.Category) error {
	return s.repo.Create(ctx, category)
}

func (s *categoryService) GetByID(ctx context.Context, id string) (*models.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *categoryService) List(ctx context.Context, page, pageSize int) ([]*models.Category, int64, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *categoryService) Update(ctx context.Context, category *models.Category) error {
	return s.repo.Update(ctx, category)
}

func (s *categoryService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
