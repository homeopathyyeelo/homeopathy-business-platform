package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/yeelo/product-service/internal/kafka"
	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/redis"
	"github.com/yeelo/product-service/internal/repository"
	"go.uber.org/zap"
)

type ProductService interface {
	Create(ctx context.Context, product *models.Product) error
	GetByID(ctx context.Context, id string) (*models.Product, error)
	GetByBarcode(ctx context.Context, barcode string) (*models.Product, error)
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Product, int64, error)
	Search(ctx context.Context, query string, page, pageSize int) ([]*models.Product, int64, error)
	Update(ctx context.Context, product *models.Product) error
	Delete(ctx context.Context, id string) error
}

type productService struct {
	repo     repository.ProductRepository
	redis    *redis.Client
	kafka    *kafka.Producer
	logger   *zap.Logger
}

func NewProductService(repo repository.ProductRepository, redis *redis.Client, kafka *kafka.Producer, logger *zap.Logger) ProductService {
	return &productService{
		repo:   repo,
		redis:  redis,
		kafka:  kafka,
		logger: logger,
	}
}

func (s *productService) Create(ctx context.Context, product *models.Product) error {
	if err := s.repo.Create(ctx, product); err != nil {
		return err
	}

	// Publish event
	event := map[string]interface{}{
		"type":       "product.created",
		"product_id": product.ID,
		"name":       product.Name,
		"sku":        product.SKU,
		"timestamp":  time.Now(),
	}
	s.kafka.PublishEvent("product-events", event)

	return nil
}

func (s *productService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("product:%s", id)
	cached, err := s.redis.Get(ctx, cacheKey)
	if err == nil && cached != "" {
		var product models.Product
		if err := json.Unmarshal([]byte(cached), &product); err == nil {
			return &product, nil
		}
	}

	// Get from DB
	product, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache it
	data, _ := json.Marshal(product)
	s.redis.Set(ctx, cacheKey, string(data), 30*time.Minute)

	return product, nil
}

func (s *productService) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	return s.repo.GetByBarcode(ctx, barcode)
}

func (s *productService) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	return s.repo.GetBySKU(ctx, sku)
}

func (s *productService) List(ctx context.Context, page, pageSize int) ([]*models.Product, int64, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *productService) Search(ctx context.Context, query string, page, pageSize int) ([]*models.Product, int64, error) {
	return s.repo.Search(ctx, query, page, pageSize)
}

func (s *productService) Update(ctx context.Context, product *models.Product) error {
	if err := s.repo.Update(ctx, product); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("product:%s", product.ID)
	s.redis.Del(ctx, cacheKey)

	// Publish event
	event := map[string]interface{}{
		"type":       "product.updated",
		"product_id": product.ID,
		"timestamp":  time.Now(),
	}
	s.kafka.PublishEvent("product-events", event)

	return nil
}

func (s *productService) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("product:%s", id)
	s.redis.Del(ctx, cacheKey)

	// Publish event
	event := map[string]interface{}{
		"type":       "product.deleted",
		"product_id": id,
		"timestamp":  time.Now(),
	}
	s.kafka.PublishEvent("product-events", event)

	return nil
}
