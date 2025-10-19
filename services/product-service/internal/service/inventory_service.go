package service

import (
	"context"
	"time"

	"github.com/yeelo/product-service/internal/kafka"
	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/redis"
	"github.com/yeelo/product-service/internal/repository"
	"go.uber.org/zap"
)

type InventoryService interface {
	Create(ctx context.Context, inventory *models.Inventory) error
	GetByID(ctx context.Context, id string) (*models.Inventory, error)
	GetByProductID(ctx context.Context, productID string) ([]*models.Inventory, error)
	List(ctx context.Context, page, pageSize int) ([]*models.Inventory, int64, error)
	GetLowStock(ctx context.Context) ([]*models.Inventory, error)
	Update(ctx context.Context, inventory *models.Inventory) error
	Delete(ctx context.Context, id string) error
	AdjustStock(ctx context.Context, productID string, quantity int, movementType string, reason string) error
}

type inventoryService struct {
	repo   repository.InventoryRepository
	redis  *redis.Client
	kafka  *kafka.Producer
	logger *zap.Logger
}

func NewInventoryService(repo repository.InventoryRepository, redis *redis.Client, kafka *kafka.Producer, logger *zap.Logger) InventoryService {
	return &inventoryService{
		repo:   repo,
		redis:  redis,
		kafka:  kafka,
		logger: logger,
	}
}

func (s *inventoryService) Create(ctx context.Context, inventory *models.Inventory) error {
	return s.repo.Create(ctx, inventory)
}

func (s *inventoryService) GetByID(ctx context.Context, id string) (*models.Inventory, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *inventoryService) GetByProductID(ctx context.Context, productID string) ([]*models.Inventory, error) {
	return s.repo.GetByProductID(ctx, productID)
}

func (s *inventoryService) List(ctx context.Context, page, pageSize int) ([]*models.Inventory, int64, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *inventoryService) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	return s.repo.GetLowStock(ctx)
}

func (s *inventoryService) Update(ctx context.Context, inventory *models.Inventory) error {
	return s.repo.Update(ctx, inventory)
}

func (s *inventoryService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *inventoryService) AdjustStock(ctx context.Context, productID string, quantity int, movementType string, reason string) error {
	if err := s.repo.AdjustStock(ctx, productID, quantity, movementType); err != nil {
		return err
	}

	// Publish event
	event := map[string]interface{}{
		"type":       "inventory.adjusted",
		"product_id": productID,
		"quantity":   quantity,
		"movement":   movementType,
		"reason":     reason,
		"timestamp":  time.Now(),
	}
	s.kafka.PublishEvent("inventory-events", event)

	return nil
}
