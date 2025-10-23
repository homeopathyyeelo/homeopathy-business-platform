package service

import (
	"context"

	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/redis"
	"github.com/yeelo/product-service/internal/repository"
	"go.uber.org/zap"
)

type BrandService interface {
	Create(ctx context.Context, brand *models.Brand) error
	GetByID(ctx context.Context, id string) (*models.Brand, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Brand, int64, error)
	Update(ctx context.Context, brand *models.Brand) error
	Delete(ctx context.Context, id string) error
}

type brandService struct {
	repo   repository.BrandRepository
	redis  *redis.Client
	logger *zap.Logger
}

func NewBrandService(repo repository.BrandRepository, redis *redis.Client, logger *zap.Logger) BrandService {
	return &brandService{
		repo:   repo,
		redis:  redis,
		logger: logger,
	}
}

func (s *brandService) Create(ctx context.Context, brand *models.Brand) error {
	return s.repo.Create(ctx, brand)
}

func (s *brandService) GetByID(ctx context.Context, id string) (*models.Brand, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *brandService) List(ctx context.Context, page, pageSize int) ([]*models.Brand, int64, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *brandService) Update(ctx context.Context, brand *models.Brand) error {
	return s.repo.Update(ctx, brand)
}

func (s *brandService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
