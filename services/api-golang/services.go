package main

import (
	"context"
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// Validation Service
type ValidationService struct {
	validator *validator.Validate
}

func NewValidationService() *ValidationService {
	return &ValidationService{
		validator: validator.New(),
	}
}

func (v *ValidationService) ValidateStruct(s interface{}) error {
	return v.validator.Struct(s)
}

// Generic Service Layer with Business Logic
type BaseService[T any] struct {
	repo      GORMRepository[T]
	validator *ValidationService
	cache     *CacheService
	cb        *CircuitBreakerService
}

func NewBaseService[T any](repo GORMRepository[T], validator *ValidationService, cache *CacheService, cb *CircuitBreakerService) *BaseService[T] {
	return &BaseService[T]{
		repo:      repo,
		validator: validator,
		cache:     cache,
		cb:        cb,
	}
}

func (s *BaseService[T]) Create(ctx context.Context, entity *T) (*T, error) {
	// Validate entity
	if err := s.validator.ValidateStruct(entity); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Set default values
	setDefaults(entity)

	// Create with circuit breaker
	result, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return s.repo.Create(ctx, entity)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create entity: %w", err)
	}

	created := result.(*T)

	// Invalidate cache
	cacheKey := fmt.Sprintf("%T:all", entity)
	s.cache.client.Del(ctx, cacheKey)

	return created, nil
}

func (s *BaseService[T]) GetByID(ctx context.Context, id string) (*T, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("%T:%s", s.repo, id)
	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if entity, ok := cached.(*T); ok {
			return entity, nil
		}
	}

	// Get from database with circuit breaker
	result, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return s.repo.GetByID(ctx, id)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get entity: %w", err)
	}

	entity := result.(*T)

	// Cache the result
	s.cache.Set(ctx, cacheKey, entity, 5*time.Minute)

	return entity, nil
}

func (s *BaseService[T]) GetAll(ctx context.Context, filters map[string]interface{}) ([]T, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("%T:all:%v", s.repo, filters)
	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if entities, ok := cached.([]T); ok {
			return entities, nil
		}
	}

	// Get from database with circuit breaker
	result, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return s.repo.GetAll(ctx, filters)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get entities: %w", err)
	}

	entities := result.([]T)

	// Cache the result
	s.cache.Set(ctx, cacheKey, entities, 2*time.Minute)

	return entities, nil
}

func (s *BaseService[T]) Update(ctx context.Context, id string, entity *T) (*T, error) {
	// Validate entity
	if err := s.validator.ValidateStruct(entity); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Update with circuit breaker
	result, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return s.repo.Update(ctx, id, entity)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to update entity: %w", err)
	}

	updated := result.(*T)

	// Invalidate cache
	cacheKey := fmt.Sprintf("%T:%s", s.repo, id)
	s.cache.client.Del(ctx, cacheKey)
	cacheKeyAll := fmt.Sprintf("%T:all", s.repo)
	s.cache.client.Del(ctx, cacheKeyAll)

	return updated, nil
}

func (s *BaseService[T]) Delete(ctx context.Context, id string) error {
	// Delete with circuit breaker
	_, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return nil, s.repo.Delete(ctx, id)
	})

	if err != nil {
		return fmt.Errorf("failed to delete entity: %w", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("%T:%s", s.repo, id)
	s.cache.client.Del(ctx, cacheKey)
	cacheKeyAll := fmt.Sprintf("%T:all", s.repo)
	s.cache.client.Del(ctx, cacheKeyAll)

	return nil
}

func (s *BaseService[T]) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
	result, err := s.cb.breaker.Execute(func() (interface{}, error) {
		return s.repo.Count(ctx, filters)
	})

	if err != nil {
		return 0, fmt.Errorf("failed to count entities: %w", err)
	}

	return result.(int64), nil
}

// Helper function to set default values
func setDefaults(entity interface{}) {
	switch e := entity.(type) {
	case *WorkflowDefinition:
		if e.ID == "" {
			e.ID = uuid.New().String()
		}
		if e.CreatedAt.IsZero() {
			e.CreatedAt = time.Now()
		}
		if e.UpdatedAt.IsZero() {
			e.UpdatedAt = time.Now()
		}
		if e.IsActive == false {
			e.IsActive = true
		}
		if e.Priority == "" {
			e.Priority = "medium"
		}
	case *WorkflowExecution:
		if e.ID == "" {
			e.ID = uuid.New().String()
		}
		if e.CreatedAt.IsZero() {
			e.CreatedAt = time.Now()
		}
		if e.UpdatedAt.IsZero() {
			e.UpdatedAt = time.Now()
		}
		if e.IsActive == false {
			e.IsActive = true
		}
		if e.Status == "" {
			e.Status = "pending"
		}
		if e.StartTime.IsZero() {
			e.StartTime = time.Now()
		}
	// Add more cases for other entities as needed
	}
}

// Specific Service for Workflow Management
type WorkflowService struct {
	*BaseService[WorkflowDefinition]
	repo *WorkflowRepository
}

func NewWorkflowService(db *GORMDatabase, validator *ValidationService, cache *CacheService, cb *CircuitBreakerService) *WorkflowService {
	baseRepo := NewWorkflowRepository(db)
	return &WorkflowService{
		BaseService: NewBaseService(baseRepo, validator, cache, cb),
		repo:        baseRepo,
	}
}

// Specific methods for WorkflowService
func (s *WorkflowService) GetWorkflowsByCategory(ctx context.Context, category string) ([]WorkflowDefinition, error) {
	filters := map[string]interface{}{"category": category}
	return s.GetAll(ctx, filters)
}

func (s *WorkflowService) GetActiveWorkflows(ctx context.Context) ([]WorkflowDefinition, error) {
	filters := map[string]interface{}{"is_active": true}
	return s.GetAll(ctx, filters)
}

// Inventory Service
type InventoryService struct {
	*BaseService[InventoryLevel]
	repo *BaseGORMRepository[InventoryLevel]
}

func NewInventoryService(db *GORMDatabase, validator *ValidationService, cache *CacheService, cb *CircuitBreakerService) *InventoryService {
	baseRepo := NewBaseGORMRepository(db, InventoryLevel{}, "inventory_levels")
	return &InventoryService{
		BaseService: NewBaseService(baseRepo, validator, cache, cb),
		repo:        baseRepo,
	}
}

// Business logic for inventory
func (s *InventoryService) GetLowStockItems(ctx context.Context) ([]InventoryLevel, error) {
	var items []InventoryLevel
	query := s.repo.db.DB.WithContext(ctx).Where("is_active = ? AND current_stock <= reorder_level", true)
	if err := query.Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to get low stock items: %w", err)
	}
	return items, nil
}

func (s *InventoryService) UpdateStock(ctx context.Context, productID string, newStock int) (*InventoryLevel, error) {
	// Get current item
	item, err := s.GetByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, fmt.Errorf("inventory item not found")
	}

	// Update stock and calculate total value
	item.CurrentStock = newStock
	item.AvailableStock = newStock - item.ReservedStock
	item.TotalValue = float64(newStock) * item.UnitCost
	item.LastUpdated = time.Now()

	return s.Update(ctx, productID, item)
}

// Customer Service Metrics Service
type CustomerServiceService struct {
	*BaseService[CustomerServiceMetric]
	repo *BaseGORMRepository[CustomerServiceMetric]
}

func NewCustomerServiceService(db *GORMDatabase, validator *ValidationService, cache *CacheService, cb *CircuitBreakerService) *CustomerServiceService {
	baseRepo := NewBaseGORMRepository(db, CustomerServiceMetric{}, "customer_service_metrics")
	return &CustomerServiceService{
		BaseService: NewBaseService(baseRepo, validator, cache, cb),
		repo:        baseRepo,
	}
}

// Business logic for customer service
func (s *CustomerServiceService) GetAgentPerformance(ctx context.Context, agentID string) (*CustomerServiceMetric, error) {
	return s.GetByID(ctx, agentID)
}

func (s *CustomerServiceService) GetDepartmentMetrics(ctx context.Context, department string) ([]CustomerServiceMetric, error) {
	filters := map[string]interface{}{"department": department}
	return s.GetAll(ctx, filters)
}

// Financial Metrics Service
type FinancialService struct {
	*BaseService[FinancialMetric]
	repo *BaseGORMRepository[FinancialMetric]
}

func NewFinancialService(db *GORMDatabase, validator *ValidationService, cache *CacheService, cb *CircuitBreakerService) *FinancialService {
	baseRepo := NewBaseGORMRepository(db, FinancialMetric{}, "financial_metrics")
	return &FinancialService{
		BaseService: NewBaseService(baseRepo, validator, cache, cb),
		repo:        baseRepo,
	}
}

// Business logic for financial metrics
func (s *FinancialService) GetLatestMetrics(ctx context.Context) (*FinancialMetric, error) {
	var metric FinancialMetric
	if err := s.repo.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("period_end DESC").First(&metric).Error; err != nil {
		return nil, fmt.Errorf("failed to get latest financial metrics: %w", err)
	}
	return &metric, nil
}

func (s *FinancialService) GetMetricsByPeriod(ctx context.Context, periodType string, startDate, endDate time.Time) ([]FinancialMetric, error) {
	var metrics []FinancialMetric
	query := s.repo.db.DB.WithContext(ctx).Where("is_active = ? AND period_type = ? AND period_start >= ? AND period_end <= ?", true, periodType, startDate, endDate)
	if err := query.Find(&metrics).Error; err != nil {
		return nil, fmt.Errorf("failed to get financial metrics by period: %w", err)
	}
	return metrics, nil
}
