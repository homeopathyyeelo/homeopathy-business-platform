// Enhanced Golang API Service for Homeopathy ERP
// Advanced features for Golang developer mastery

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"github.com/sony/gobreaker"
	"golang.org/x/time/rate"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Advanced Golang Features Demonstrated:
// 1. Generics for type-safe operations
// 2. Context for request cancellation and timeouts
// 3. Channels and goroutines for concurrency
// 4. Interface composition and dependency injection
// 5. Error handling with custom error types
// 6. Middleware composition
// 7. Database connection pooling with pgx
// 8. Redis caching
// 9. Circuit breaker pattern
// 10. Rate limiting
// 11. Structured logging
// 12. Configuration management
// 13. Graceful shutdown
// 14. Metrics and monitoring
// 15. Testing patterns

// Configuration Management
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Redis    RedisConfig    `json:"redis"`
	JWT      JWTConfig      `json:"jwt"`
	Cache    CacheConfig    `json:"cache"`
}

type ServerConfig struct {
	Port         string        `json:"port"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
	IdleTimeout  time.Duration `json:"idle_timeout"`
}

type DatabaseConfig struct {
	Host            string        `json:"host"`
	Port            int           `json:"port"`
	Username        string        `json:"username"`
	Password        string        `json:"password"`
	Database        string        `json:"database"`
	SSLMode         string        `json:"ssl_mode"`
	MaxOpenConns    int           `json:"max_open_conns"`
	MaxIdleConns    int           `json:"max_idle_conns"`
	ConnMaxLifetime time.Duration `json:"conn_max_lifetime"`
}

type RedisConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Password string `json:"password"`
	DB       int    `json:"db"`
}

type JWTConfig struct {
	Secret     string        `json:"secret"`
	Expiration time.Duration `json:"expiration"`
}

type CacheConfig struct {
	DefaultTTL time.Duration `json:"default_ttl"`
}

// Generic Repository Pattern with Type Safety
type Repository[T any] interface {
	GetByID(ctx context.Context, id string) (*T, error)
	GetAll(ctx context.Context, filters map[string]interface{}) ([]T, error)
	Create(ctx context.Context, entity *T) (*T, error)
	Update(ctx context.Context, id string, entity *T) (*T, error)
	Delete(ctx context.Context, id string) error
}

type BaseEntity struct {
	ID        string    `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	IsActive  bool      `json:"is_active" db:"is_active"`
}

// Enhanced Models with Advanced Features (moved to models.go)

// WorkflowDefinition struct moved to models.go

// Advanced Database Layer with GORM
type GORMDatabase struct {
	DB *gorm.DB
}

func NewGORMDatabase(config DatabaseConfig) (*GORMDatabase, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=UTC",
		config.Host, config.Username, config.Password, config.Database, config.Port, config.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)

	// Auto-migrate all models
	if err := db.AutoMigrate(
		&WorkflowDefinition{}, &WorkflowExecution{}, &WorkflowStep{},
		&WorkflowTrigger{}, &WorkflowCondition{}, &WorkflowAction{},
		&StepExecution{}, &WorkflowError{}, &AutomationRule{},
		&InventoryLevel{}, &CustomerServiceMetric{}, &FinancialMetric{},
		&MedicinePreparation{}, &QualityControl{}, &Certification{},
		&DrugInteraction{}, &ComplianceAudit{}, &AuditFinding{},
		&SupplyChainWorkflow{}, &SupplyChainMilestone{},
		&TransportationWorkflow{}, &InternationalWorkflow{},
		&CurrencyWorkflow{}, &LanguageWorkflow{},
		&CRMLifecycle{}, &CRMInteraction{}, &LoyaltyProgram{},
		&LoyaltyTier{}, &AnalyticsWorkflow{}, &MLModel{},
	); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return &GORMDatabase{DB: db}, nil
}

func (d *GORMDatabase) Close() {
	sqlDB, _ := d.DB.DB()
	sqlDB.Close()
}

// Generic Repository Pattern with Type Safety (using GORM)
type GORMRepository[T any] interface {
	GetByID(ctx context.Context, id string) (*T, error)
	GetAll(ctx context.Context, filters map[string]interface{}) ([]T, error)
	Create(ctx context.Context, entity *T) (*T, error)
	Update(ctx context.Context, id string, entity *T) (*T, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context, filters map[string]interface{}) (int64, error)
}

// Generic GORM Repository Implementation
type BaseGORMRepository[T any] struct {
	db        *GORMDatabase
	model     T
	tableName string
}

func NewBaseGORMRepository[T any](db *GORMDatabase, model T, tableName string) *BaseGORMRepository[T] {
	return &BaseGORMRepository[T]{
		db:        db,
		model:     model,
		tableName: tableName,
	}
}

func (r *BaseGORMRepository[T]) Create(ctx context.Context, entity *T) (*T, error) {
	if err := r.db.DB.WithContext(ctx).Create(entity).Error; err != nil {
		return nil, fmt.Errorf("failed to create %s: %w", r.tableName, err)
	}
	return entity, nil
}

func (r *BaseGORMRepository[T]) GetByID(ctx context.Context, id string) (*T, error) {
	var entity T
	if err := r.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get %s by ID: %w", r.tableName, err)
	}
	return &entity, nil
}

func (r *BaseGORMRepository[T]) GetAll(ctx context.Context, filters map[string]interface{}) ([]T, error) {
	var entities []T
	query := r.db.DB.WithContext(ctx).Where("is_active = ?", true)

	// Apply filters
	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}

	if err := query.Find(&entities).Error; err != nil {
		return nil, fmt.Errorf("failed to get all %s: %w", r.tableName, err)
	}
	return entities, nil
}

func (r *BaseGORMRepository[T]) Update(ctx context.Context, id string, entity *T) (*T, error) {
	if err := r.db.DB.WithContext(ctx).Where("id = ?", id).Updates(entity).Error; err != nil {
		return nil, fmt.Errorf("failed to update %s: %w", r.tableName, err)
	}
	return entity, nil
}

func (r *BaseGORMRepository[T]) Delete(ctx context.Context, id string) error {
	// Soft delete by setting is_active to false
	if err := r.db.DB.WithContext(ctx).Model(r.model).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete %s: %w", r.tableName, err)
	}
	return nil
}

func (r *BaseGORMRepository[T]) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
	var count int64
	query := r.db.DB.WithContext(ctx).Model(r.model).Where("is_active = ?", true)

	// Apply filters
	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count %s: %w", r.tableName, err)
	}
	return count, nil
}

// Workflow Repository using GORM
type WorkflowRepository struct {
	db *GORMDatabase
}

func NewWorkflowRepository(db *GORMDatabase) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

func (r *WorkflowRepository) GetByID(ctx context.Context, id string) (*WorkflowDefinition, error) {
	var workflow WorkflowDefinition
	if err := r.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&workflow).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}
	return &workflow, nil
}

func (r *WorkflowRepository) GetAll(ctx context.Context, filters map[string]interface{}) ([]WorkflowDefinition, error) {
	var workflows []WorkflowDefinition
	query := r.db.DB.WithContext(ctx).Where("is_active = ?", true)

	// Apply filters
	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}

	query = query.Order("created_at DESC")

	if err := query.Find(&workflows).Error; err != nil {
		return nil, fmt.Errorf("failed to query workflows: %w", err)
	}
	return workflows, nil
}

func (r *WorkflowRepository) Create(ctx context.Context, workflow *WorkflowDefinition) (*WorkflowDefinition, error) {
	if err := r.db.DB.WithContext(ctx).Create(workflow).Error; err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}
	return workflow, nil
}

func (r *WorkflowRepository) Update(ctx context.Context, id string, workflow *WorkflowDefinition) (*WorkflowDefinition, error) {
	if err := r.db.DB.WithContext(ctx).Where("id = ?", id).Updates(workflow).Error; err != nil {
		return nil, fmt.Errorf("failed to update workflow: %w", err)
	}
	return workflow, nil
}

func (r *WorkflowRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.DB.WithContext(ctx).Model(&WorkflowDefinition{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete workflow: %w", err)
	}
	return nil
}

// Advanced Caching Layer with Redis
type CacheService struct {
	client *redis.Client
	config CacheConfig
}

func NewCacheService(config RedisConfig, cacheConfig CacheConfig) (*CacheService, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", config.Host, config.Port),
		Password: config.Password,
		DB:       config.DB,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &CacheService{client: client, config: cacheConfig}, nil
}

func (c *CacheService) Get(ctx context.Context, key string) (interface{}, error) {
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss
	}
	if err != nil {
		return nil, err
	}

	var result interface{}
	if err := json.Unmarshal([]byte(val), &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (c *CacheService) DeletePattern(ctx context.Context, pattern string) error {
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}
	if len(keys) > 0 {
		return c.client.Del(ctx, keys...).Err()
	}
	return nil
}

// Circuit Breaker for External Services
type CircuitBreakerService struct {
	breaker *gobreaker.CircuitBreaker
}

func NewCircuitBreakerService() *CircuitBreakerService {
	settings := gobreaker.Settings{
		Name:        "external-services",
		MaxRequests: 5,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures > 3
		},
	}

	return &CircuitBreakerService{
		breaker: gobreaker.NewCircuitBreaker(settings),
	}
}

// Rate Limiter
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
	}
}

func (rl *RateLimiter) GetLimiter(key string, rps int) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[key]
	if !exists {
		limiter = rate.NewLimiter(rate.Limit(rps), rps)
		rl.limiters[key] = limiter
	}

	return limiter
}

// Advanced Middleware with Dependency Injection
type Middleware struct {
	db             *Database
	cache          *CacheService
	circuitBreaker *CircuitBreakerService
	rateLimiter    *RateLimiter
	config         Config
}

func NewMiddleware(db *Database, cache *CacheService, cb *CircuitBreakerService, rl *RateLimiter, config Config) *Middleware {
	return &Middleware{
		db:             db,
		cache:          cache,
		circuitBreaker: cb,
		rateLimiter:    rl,
		config:         config,
	}
}

// CORS Middleware
func (m *Middleware) CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Authentication Middleware with JWT
func (m *Middleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(m.config.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.Sub)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

// Rate Limiting Middleware
func (m *Middleware) RateLimit(rps int) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		limiter := m.rateLimiter.GetLimiter(clientIP, rps)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Caching Middleware
func (m *Middleware) Cache(ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip caching for non-GET requests
		if c.Request.Method != "GET" {
			c.Next()
			return
		}

		key := fmt.Sprintf("cache:%s:%s", c.Request.Method, c.Request.URL.Path)
		if cached, err := m.cache.Get(c.Request.Context(), key); err == nil && cached != nil {
			c.JSON(http.StatusOK, cached)
			c.Abort()
			return
		}

		c.Next()

		// Cache successful responses
		if c.Writer.Status() == http.StatusOK {
			var response interface{}
			if err := json.Unmarshal([]byte(c.GetString("response_body")), &response); err == nil {
				m.cache.Set(c.Request.Context(), key, response, ttl)
			}
		}
	}
}

// Logging Middleware with Structured Logging
func (m *Middleware) Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
			param.ClientIP,
		)
	})
}

// Service Layer with Dependency Injection
type WorkflowService struct {
	repo           *WorkflowRepository
	cache          *CacheService
	circuitBreaker *CircuitBreakerService
}

func NewWorkflowService(db *Database, cache *CacheService, cb *CircuitBreakerService) *WorkflowService {
	return &WorkflowService{
		repo:           NewWorkflowRepository(db),
		cache:          cache,
		circuitBreaker: cb,
	}
}

func (s *WorkflowService) GetWorkflow(ctx context.Context, id string) (*WorkflowDefinition, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("workflow:%s", id)
	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if workflow, ok := cached.(*WorkflowDefinition); ok {
			return workflow, nil
		}
	}

	// Get from database with circuit breaker
	result, err := s.circuitBreaker.breaker.Execute(func() (interface{}, error) {
		return s.repo.GetByID(ctx, id)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}

	workflow := result.(*WorkflowDefinition)

	// Cache the result
	s.cache.Set(ctx, cacheKey, workflow, 5*time.Minute)

	return workflow, nil
}

func (s *WorkflowService) GetWorkflows(ctx context.Context, filters map[string]interface{}) ([]WorkflowDefinition, error) {
	cacheKey := fmt.Sprintf("workflows:%v", filters)
	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if workflows, ok := cached.([]WorkflowDefinition); ok {
			return workflows, nil
		}
	}

	result, err := s.circuitBreaker.breaker.Execute(func() (interface{}, error) {
		return s.repo.GetAll(ctx, filters)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get workflows: %w", err)
	}

	workflows := result.([]WorkflowDefinition)

	// Cache the result
	s.cache.Set(ctx, cacheKey, workflows, 2*time.Minute)

	return workflows, nil
}

// Concurrent Workflow Processor with Goroutines
type WorkflowProcessor struct {
	db       *Database
	workers  int
	jobQueue chan WorkflowExecution
	wg       sync.WaitGroup
}

func NewWorkflowProcessor(db *Database, workers int) *WorkflowProcessor {
	return &WorkflowProcessor{
		db:       db,
		workers:  workers,
		jobQueue: make(chan WorkflowExecution, 100),
	}
}

func (wp *WorkflowProcessor) Start(ctx context.Context) {
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(ctx)
	}
}

func (wp *WorkflowProcessor) Stop() {
	close(wp.jobQueue)
	wp.wg.Wait()
}

func (wp *WorkflowProcessor) worker(ctx context.Context) {
	defer wp.wg.Done()

	for execution := range wp.jobQueue {
		wp.processWorkflow(ctx, execution)
	}
}

func (wp *WorkflowProcessor) processWorkflow(ctx context.Context, execution WorkflowExecution) {
	// Simulate workflow processing with context cancellation
	select {
	case <-ctx.Done():
		log.Printf("Workflow processing cancelled: %s", execution.ID)
		return
	case <-time.After(100 * time.Millisecond): // Simulate processing time
		log.Printf("Processed workflow execution: %s", execution.ID)
	}
}

// Sales Handler for invoices, orders, returns, and commissions
type SalesHandler struct {
	repo *GORMDatabase
	cache *CacheService
}



// Main Application Setup
func main() {
	// Load configuration
	config := loadConfig()

	// Initialize database
	db, err := NewGORMDatabase(config.Database)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize Redis cache
	cache, err := NewCacheService(config.Redis, config.Cache)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	// Initialize circuit breaker
	circuitBreaker := NewCircuitBreakerService()

	// Initialize rate limiter
	rateLimiter := NewRateLimiter()

	// Initialize validator
	validator := NewValidationService()

	// Initialize middleware
	middleware := NewMiddleware(db, cache, circuitBreaker, rateLimiter, config)

	// Initialize services
	productService := NewProductService(db, cache)
	inventoryService := NewInventoryService(db, cache)
	customerService := NewCustomerService(db, cache)
	financialService := NewFinancialService(db, validator, cache, circuitBreaker)
	workflowService := NewWorkflowService(db, cache, circuitBreaker)
	workflowProcessor := NewWorkflowProcessor(db, 10) // 10 worker goroutines
	companyBranchHandler := NewCompanyBranchHandler(db, cache)

	// Initialize payment services
	stripeService := NewStripeService("sk_test_mock", "whsec_mock")
	razorpayService := NewRazorpayService("rzp_test_mock", "mock_secret")

	// Initialize offline services
	storageService := NewOfflineStorageService("/tmp/offline_storage")
	syncService := NewSyncService()

	offlineHandler := NewOfflineHandler(db, cache, storageService, syncService)

	// Initialize multi-PC sharing services
	sessionStore := NewSharedSessionStore()
	syncManager := NewPCSyncManager()

	multiPCSharingHandler := NewMultiPCSharingHandler(db, cache, sessionStore, syncManager)

	// Initialize hardware services
	serialService := NewSerialPortService("/dev/ttyUSB0", 9600)
	printerService := NewPrinterService("PRINTER_001")
	displayService := NewCustomerDisplayService("DISPLAY_001")

	hardwareIntegrationHandler := NewHardwareIntegrationHandler(db, cache, serialService, printerService, displayService)

// ...
	// Start workflow processor
	ctx := context.Background()
	workflowProcessor.Start(ctx)

	// Initialize handlers
	handler := &Handler{
		workflowService:   workflowService,
		inventoryService:  inventoryService,
		customerService:   customerService,
		financialService:  financialService,
		workflowProcessor: workflowProcessor,
	}
	productHandler := NewProductHandler(productService, db, cache, config)
	inventoryHandler := NewInventoryHandler(inventoryService)

	// Setup Gin router with advanced middleware
	router := gin.New()

	// Global middleware
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	// API routes with advanced features
	api := router.Group("/api")
	{
		// Public routes
		api.GET("/health", handler.HealthCheck)
		api.GET("/metrics", handler.GetMetrics)

		// Workflow routes with rate limiting and caching
		workflows := api.Group("/workflows")
		workflows.Use(middleware.RateLimit(100)) // 100 requests per second
		workflows.Use(middleware.Cache(5 * time.Minute))
		{
			workflows.GET("", handler.GetWorkflows)
			workflows.GET("/:id", handler.GetWorkflow)
			workflows.POST("", middleware.AuthRequired(), handler.CreateWorkflow)
			workflows.PUT("/:id", middleware.AuthRequired(), handler.UpdateWorkflow)
			workflows.DELETE("/:id", middleware.AuthRequired(), handler.DeleteWorkflow)
			workflows.GET("/active", handler.GetActiveWorkflows)
		}

		// Inventory routes
		inventory := api.Group("/inventory")
		inventory.Use(middleware.RateLimit(100))
		inventory.Use(middleware.Cache(2 * time.Minute))
		{
			inventory.GET("", inventoryHandler.GetInventoryItems)
			inventory.GET("/:id", inventoryHandler.GetInventoryItem)
			inventory.POST("", middleware.AuthRequired(), inventoryHandler.CreateInventoryItem)
			inventory.PUT("/:id", middleware.AuthRequired(), inventoryHandler.UpdateInventoryItem)
			inventory.DELETE("/:id", middleware.AuthRequired(), inventoryHandler.DeleteInventoryItem)
			inventory.GET("/low-stock", inventoryHandler.GetLowStockItems)
			inventory.PUT("/:id/stock", middleware.AuthRequired(), inventoryHandler.UpdateStock)
			inventory.GET("/:id/adjustments", inventoryHandler.GetStockAdjustments)
			inventory.GET("/reports/summary", inventoryHandler.GetInventorySummary)
			inventory.GET("/reports/utilization", inventoryHandler.GetWarehouseUtilization)
		}

		// Customer routes
		customers := api.Group("/customers")
		customers.Use(middleware.RateLimit(100))
		customers.Use(middleware.Cache(3 * time.Minute))
		{
			customers.GET("", customerHandler.GetCustomers)
			// Offline mode routes
			offline := api.Group("/offline")
			offline.Use(middleware.RateLimit(100))
			offline.Use(middleware.Cache(5 * time.Minute))
			{
				// Offline status
				offline.GET("/status", offlineHandler.GetOfflineStatus)
				offline.POST("/mode", middleware.AuthRequired(), offlineHandler.SetOfflineMode)

				// Offline storage
				storage := offline.Group("/storage")
				{
					storage.GET("/:entity_type/:entity_id", offlineHandler.GetOfflineData)
					storage.POST("/:entity_type/:entity_id", offlineHandler.StoreOfflineData)
					storage.DELETE("/:entity_type/:entity_id", offlineHandler.DeleteOfflineData)
				}

				// Offline queue
				queue := offline.Group("/queue")
				{
					queue.GET("", offlineHandler.GetOfflineQueue)
					queue.POST("/operations", offlineHandler.QueueOfflineOperation)
					queue.POST("/process", middleware.AuthRequired(), offlineHandler.ProcessOfflineQueue)
				}

				// Data synchronization
				sync := offline.Group("/sync")
				{
					sync.POST("", offlineHandler.SyncOfflineData)
					sync.GET("/status", offlineHandler.GetSyncStatus)
					sync.GET("/conflicts", offlineHandler.GetSyncConflicts)
					sync.POST("/conflicts/:conflict_id/resolve", middleware.AuthRequired(), offlineHandler.ResolveSyncConflict)
				}

				// Offline reporting
				reports := offline.Group("/reports")
				{
					reports.GET("", offlineHandler.GetOfflineReports)
					reports.POST("/:report_id/generate", offlineHandler.GenerateOfflineReport)
				}
			}
			multiPC := api.Group("/multi-pc")
			multiPC.Use(middleware.RateLimit(100))
			multiPC.Use(middleware.Cache(5 * time.Minute))
			{
				// Shared sessions
				sessions := multiPC.Group("/sessions")
				{
					sessions.POST("", middleware.AuthRequired(), multiPCSharingHandler.CreateSharedSession)
					sessions.GET("/users/:user_id", multiPCSharingHandler.GetSharedSessions)
					sessions.POST("/:session_id/join", multiPCSharingHandler.JoinSharedSession)
					sessions.POST("/:session_id/leave", multiPCSharingHandler.LeaveSharedSession)
				}

				// Shared carts
				carts := multiPC.Group("/carts")
				{
					carts.POST("", middleware.AuthRequired(), multiPCSharingHandler.CreateSharedCart)
					carts.GET("/:cart_id", multiPCSharingHandler.GetSharedCart)
					carts.PUT("/:cart_id", middleware.AuthRequired(), multiPCSharingHandler.UpdateSharedCart)
				}

				// Shared billing
				billing := multiPC.Group("/billing")
				{
					billing.POST("/hold", middleware.AuthRequired(), multiPCSharingHandler.HoldSharedBill)
					billing.POST("/:bill_id/resume", middleware.AuthRequired(), multiPCSharingHandler.ResumeSharedBill)
				}

				// Device management
				devices := multiPC.Group("/devices")
				{
					devices.GET("/sessions/:session_id", multiPCSharingHandler.GetConnectedDevices)
					devices.POST("/:device_id/message", middleware.AuthRequired(), multiPCSharingHandler.SendMessageToDevice)
				}

				// WebSocket for real-time sync
				multiPC.GET("/ws", multiPCSharingHandler.HandleWebSocket)
			}
			customers.POST("", middleware.AuthRequired(), customerHandler.CreateCustomer)
			customers.PUT("/:id", middleware.AuthRequired(), customerHandler.UpdateCustomer)
			customers.DELETE("/:id", middleware.AuthRequired(), customerHandler.DeleteCustomer)

			// Customer groups
			customers.GET("/groups", customerHandler.GetCustomerGroups)
			customers.POST("/groups", middleware.AuthRequired(), customerHandler.CreateCustomerGroup)
			customers.POST("/:customer_id/groups/:group_id", middleware.AuthRequired(), customerHandler.AddCustomerToGroup)
			customers.DELETE("/:customer_id/groups/:group_id", middleware.AuthRequired(), customerHandler.RemoveCustomerFromGroup)

			// Loyalty programs
			customers.GET("/loyalty/programs", customerHandler.GetLoyaltyPrograms)
			customers.POST("/loyalty/programs", middleware.AuthRequired(), customerHandler.CreateLoyaltyProgram)
			customers.POST("/:customer_id/loyalty/points", middleware.AuthRequired(), customerHandler.AddLoyaltyPoints)
			customers.POST("/:customer_id/loyalty/redeem", middleware.AuthRequired(), customerHandler.RedeemLoyaltyPoints)
			customers.GET("/:customer_id/loyalty/transactions", customerHandler.GetLoyaltyTransactions)

			// Customer interactions
			customers.POST("/:customer_id/interactions", middleware.AuthRequired(), customerHandler.CreateInteraction)
			customers.GET("/:customer_id/interactions", customerHandler.GetCustomerInteractions)

			// Analytics
			customers.GET("/analytics", customerHandler.GetCustomerAnalytics)
			customers.GET("/:customer_id/lifetime-value", customerHandler.GetCustomerLifetimeValue)
			customers.GET("/segments", customerHandler.SegmentCustomers)
		}

		// Products routes
		products := api.Group("/products")
		products.Use(middleware.RateLimit(100))
		products.Use(middleware.Cache(2 * time.Minute))
		{
			products.GET("", productHandler.GetProducts)
			products.GET("/:id", productHandler.GetProduct)
			products.POST("", middleware.AuthRequired(), productHandler.CreateProduct)
			products.PUT("/:id", middleware.AuthRequired(), productHandler.UpdateProduct)
			products.DELETE("/:id", middleware.AuthRequired(), productHandler.DeleteProduct)
			products.GET("/low-stock", productHandler.GetLowStockProducts)
		}

		// Categories routes
		categories := api.Group("/categories")
		categories.Use(middleware.RateLimit(100))
		categories.Use(middleware.Cache(5 * time.Minute))
		{
			categories.GET("", productHandler.GetCategories)
			categories.POST("", middleware.AuthRequired(), productHandler.CreateCategory)
		}

		// Brands routes
		brands := api.Group("/brands")
		brands.Use(middleware.RateLimit(100))
		brands.Use(middleware.Cache(5 * time.Minute))
		{
			brands.GET("", productHandler.GetBrands)
			brands.POST("", middleware.AuthRequired(), productHandler.CreateBrand)
		}

		// Units routes
		units := api.Group("/units")
		units.Use(middleware.RateLimit(100))
		units.Use(middleware.Cache(5 * time.Minute))
		{
			units.GET("", productHandler.GetUnits)
			units.POST("", middleware.AuthRequired(), productHandler.CreateUnit)
		}

		// Sales routes
		// Invoice routes
		invoices := api.Group("/invoices")
		invoices.Use(middleware.RateLimit(100))
		invoices.Use(middleware.Cache(2 * time.Minute))
		{
			invoices.GET("", salesHandler.GetInvoices)
			invoices.GET("/:id", salesHandler.GetInvoice)
			invoices.POST("", middleware.AuthRequired(), salesHandler.CreateInvoice)
			invoices.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdateInvoice)
			invoices.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeleteInvoice)
			invoices.GET("/customer/:customer_id", salesHandler.GetInvoicesByCustomer)
			invoices.GET("/salesman/:salesman_id", salesHandler.GetInvoicesBySalesman)
			invoices.PUT("/:id/status", middleware.AuthRequired(), salesHandler.UpdateInvoiceStatus)
			invoices.PUT("/:id/approve", middleware.AuthRequired(), salesHandler.ApproveInvoice)
			invoices.GET("/reports/summary", salesHandler.GetInvoiceSummary)
			invoices.GET("/reports/outstanding", salesHandler.GetOutstandingInvoices)
		}

		// Sales Order routes
		orders := api.Group("/sales-orders")
		orders.Use(middleware.RateLimit(100))
		orders.Use(middleware.Cache(3 * time.Minute))
		{
			orders.GET("", salesHandler.GetSalesOrders)
			orders.GET("/:id", salesHandler.GetSalesOrder)
			orders.POST("", middleware.AuthRequired(), salesHandler.CreateSalesOrder)
			orders.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdateSalesOrder)
			orders.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeleteSalesOrder)
			orders.POST("/:id/convert", middleware.AuthRequired(), salesHandler.ConvertOrderToInvoice)
			orders.GET("/customer/:customer_id", salesHandler.GetOrdersByCustomer)
		}

		// Return routes
		returns := api.Group("/returns")
		returns.Use(middleware.RateLimit(100))
		returns.Use(middleware.Cache(2 * time.Minute))
		{
			returns.GET("", salesHandler.GetReturns)
			returns.GET("/:id", salesHandler.GetReturn)
			returns.POST("", middleware.AuthRequired(), salesHandler.CreateReturn)
			returns.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdateReturn)
			returns.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeleteReturn)
			returns.PUT("/:id/approve", middleware.AuthRequired(), salesHandler.ApproveReturn)
			returns.GET("/invoice/:invoice_id", salesHandler.GetReturnsByInvoice)
		}

		// Invoice Series routes
		invoiceSeries := api.Group("/invoice-series")
		invoiceSeries.Use(middleware.RateLimit(100))
		invoiceSeries.Use(middleware.Cache(5 * time.Minute))
		{
			invoiceSeries.GET("", salesHandler.GetInvoiceSeries)
			invoiceSeries.GET("/:id", salesHandler.GetInvoiceSeriesByID)
			invoiceSeries.POST("", middleware.AuthRequired(), salesHandler.CreateInvoiceSeries)
			invoiceSeries.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdateInvoiceSeries)
			invoiceSeries.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeleteInvoiceSeries)
		}

		// Commission routes
		commissions := api.Group("/commissions")
		commissions.Use(middleware.RateLimit(100))
		commissions.Use(middleware.Cache(3 * time.Minute))
		{
			commissions.GET("", salesHandler.GetCommissions)
			commissions.GET("/:id", salesHandler.GetCommission)
			commissions.POST("", middleware.AuthRequired(), salesHandler.CreateCommission)
			commissions.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdateCommission)
			commissions.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeleteCommission)
			commissions.PUT("/:id/approve", middleware.AuthRequired(), salesHandler.ApproveCommission)
			commissions.GET("/salesman/:salesman_id", salesHandler.GetCommissionsBySalesman)
		}

		// Payment routes
		payments := api.Group("/payments")
		payments.Use(middleware.RateLimit(100))
		payments.Use(middleware.Cache(2 * time.Minute))
		{
			payments.GET("", salesHandler.GetPayments)
			payments.GET("/:id", salesHandler.GetPayment)
			payments.POST("", middleware.AuthRequired(), salesHandler.CreatePayment)
			payments.PUT("/:id", middleware.AuthRequired(), salesHandler.UpdatePayment)
			payments.DELETE("/:id", middleware.AuthRequired(), salesHandler.DeletePayment)
			// Purchase Order routes
		purchaseOrders := api.Group("/purchase-orders")
		purchaseOrders.Use(middleware.RateLimit(100))
		purchaseOrders.Use(middleware.Cache(3 * time.Minute))
		{
			purchaseOrders.GET("", purchaseHandler.GetPurchaseOrders)
			purchaseOrders.GET("/:id", purchaseHandler.GetPurchaseOrder)
			purchaseOrders.POST("", middleware.AuthRequired(), purchaseHandler.CreatePurchaseOrder)
			purchaseOrders.PUT("/:id", middleware.AuthRequired(), purchaseHandler.UpdatePurchaseOrder)
			purchaseOrders.DELETE("/:id", middleware.AuthRequired(), purchaseHandler.DeletePurchaseOrder)
			purchaseOrders.PUT("/:id/approve", middleware.AuthRequired(), purchaseHandler.ApprovePurchaseOrder)
			purchaseOrders.GET("/vendor/:vendor_id", purchaseHandler.GetOrdersByVendor)
		}

		// GRN routes
		grn := api.Group("/grn")
		grn.Use(middleware.RateLimit(100))
		grn.Use(middleware.Cache(2 * time.Minute))
		{
			grn.GET("", purchaseHandler.GetGRN)
			grn.GET("/:id", purchaseHandler.GetGRNByID)
			grn.POST("", middleware.AuthRequired(), purchaseHandler.CreateGRN)
			grn.PUT("/:id", middleware.AuthRequired(), purchaseHandler.UpdateGRN)
			grn.DELETE("/:id", middleware.AuthRequired(), purchaseHandler.DeleteGRN)
			grn.GET("/po/:po_id", purchaseHandler.GetGRNByPurchaseOrder)
		}

		// Vendor Invoice routes
		vendorInvoices := api.Group("/vendor-invoices")
		vendorInvoices.Use(middleware.RateLimit(100))
		vendorInvoices.Use(middleware.Cache(2 * time.Minute))
		{
			vendorInvoices.GET("", purchaseHandler.GetVendorInvoices)
			vendorInvoices.GET("/:id", purchaseHandler.GetVendorInvoice)
			vendorInvoices.POST("", middleware.AuthRequired(), purchaseHandler.CreateVendorInvoice)
			vendorInvoices.PUT("/:id", middleware.AuthRequired(), purchaseHandler.UpdateVendorInvoice)
			vendorInvoices.DELETE("/:id", middleware.AuthRequired(), purchaseHandler.DeleteVendorInvoice)
			vendorInvoices.PUT("/:id/approve", middleware.AuthRequired(), purchaseHandler.ApproveVendorInvoice)
		}

		// Vendor routes
		vendors := api.Group("/vendors")
		vendors.Use(middleware.RateLimit(100))
		vendors.Use(middleware.Cache(3 * time.Minute))
		{
			vendors.GET("", purchaseHandler.GetVendors)
			vendors.GET("/:id", purchaseHandler.GetVendor)
			vendors.POST("", middleware.AuthRequired(), purchaseHandler.CreateVendor)
			vendors.PUT("/:id", middleware.AuthRequired(), purchaseHandler.UpdateVendor)
			vendors.DELETE("/:id", middleware.AuthRequired(), purchaseHandler.DeleteVendor)
			vendors.GET("/performance", purchaseHandler.GetVendorPerformance)
			// Finance routes
		// Ledger routes
		ledgers := api.Group("/ledgers")
		ledgers.Use(middleware.RateLimit(100))
		ledgers.Use(middleware.Cache(5 * time.Minute))
		{
			ledgers.GET("/sales", financeHandler.GetSalesLedger)
			ledgers.GET("/purchase", financeHandler.GetPurchaseLedger)
			ledgers.GET("/customer/:customer_id", financeHandler.GetCustomerLedger)
			ledgers.GET("/vendor/:vendor_id", financeHandler.GetVendorLedger)
		}

		// Cash Book routes
		cashbook := api.Group("/cashbook")
		cashbook.Use(middleware.RateLimit(100))
		cashbook.Use(middleware.Cache(3 * time.Minute))
		{
			cashbook.GET("", financeHandler.GetCashBook)
			cashbook.POST("", middleware.AuthRequired(), financeHandler.CreateCashBookEntry)
		}

		// Bank Book routes
		bankbook := api.Group("/bankbook")
		bankbook.Use(middleware.RateLimit(100))
		bankbook.Use(middleware.Cache(3 * time.Minute))
		{
			bankbook.GET("", financeHandler.GetBankBook)
			bankbook.POST("", middleware.AuthRequired(), financeHandler.CreateBankBookEntry)
		}

		// Expense routes
		expenses := api.Group("/expenses")
		expenses.Use(middleware.RateLimit(100))
		expenses.Use(middleware.Cache(2 * time.Minute))
		{
			expenses.GET("", financeHandler.GetExpenses)
			expenses.GET("/:id", financeHandler.GetExpense)
			expenses.POST("", middleware.AuthRequired(), financeHandler.CreateExpense)
			expenses.PUT("/:id", middleware.AuthRequired(), financeHandler.UpdateExpense)
			expenses.DELETE("/:id", middleware.AuthRequired(), financeHandler.DeleteExpense)
			expenses.GET("/categories", financeHandler.GetExpenseCategories)
		}

		// GST routes
		gst := api.Group("/gst")
		gst.Use(middleware.RateLimit(100))
		gst.Use(middleware.Cache(5 * time.Minute))
		{
			gst.GET("/returns", financeHandler.GetGSTReturns)
			gst.POST("/returns", middleware.AuthRequired(), financeHandler.CreateGSTReturn)
			gst.GET("/eway-bills", financeHandler.GetEWayBills)
			gst.POST("/eway-bills", middleware.AuthRequired(), financeHandler.CreateEWayBill)
			gst.PUT("/eway-bills/:eway_bill_number/cancel", middleware.AuthRequired(), financeHandler.CancelEWayBill)
		}

		// Financial Reports routes
		financeReports := api.Group("/finance")
		financeReports.Use(middleware.RateLimit(100))
		financeReports.Use(middleware.Cache(10 * time.Minute))
		{
			financeReports.GET("/trial-balance", financeHandler.GetTrialBalance)
			financeReports.GET("/balance-sheet", financeHandler.GetBalanceSheet)
			financeReports.GET("/profit-loss", financeHandler.GetProfitLoss)
			financeReports.GET("/cash-flow", financeHandler.GetCashFlow)
			financeReports.GET("/receivables", financeHandler.GetAccountsReceivable)
			// Reports routes
		reports := api.Group("/reports")
		reports.Use(middleware.RateLimit(100))
		reports.Use(middleware.Cache(10 * time.Minute))
		{
			// Sales Reports
			reports.GET("/sales/daily", reportsHandler.GetDailySalesReport)
			reports.GET("/sales/weekly", reportsHandler.GetWeeklySalesReport)
			reports.GET("/sales/monthly", reportsHandler.GetMonthlySalesReport)
			reports.GET("/sales/product", reportsHandler.GetProductWiseSales)
			reports.GET("/sales/customer", reportsHandler.GetCustomerWiseSales)
			reports.GET("/sales/salesman", reportsHandler.GetSalesmanPerformance)

			// Inventory Reports
			reports.GET("/inventory/stock", reportsHandler.GetStockSummary)
			reports.GET("/inventory/expiry", reportsHandler.GetExpiryReports)
			reports.GET("/inventory/movement", reportsHandler.GetStockMovement)
			reports.GET("/inventory/valuation", reportsHandler.GetInventoryValuation)

			// Purchase Reports
			reports.GET("/purchases/vendor", reportsHandler.GetVendorPerformance)
			reports.GET("/purchases/product", reportsHandler.GetProductPurchaseAnalysis)

			// Financial Reports
			reports.GET("/finance/profit", reportsHandler.GetProfitAnalysis)

			// Homeopathy-Specific Reports
			reports.GET("/doctor/patients", reportsHandler.GetDoctorPatientReports)
			reports.GET("/prescription/analysis", reportsHandler.GetPrescriptionAnalysis)
			// Marketing routes
		marketing := api.Group("/marketing")
		marketing.Use(middleware.RateLimit(100))
		marketing.Use(middleware.Cache(5 * time.Minute))
		{
			// Campaign routes
			campaigns := marketing.Group("/campaigns")
			{
				campaigns.GET("", marketingHandler.GetCampaigns)
				campaigns.GET("/:id", marketingHandler.GetCampaign)
				campaigns.POST("", middleware.AuthRequired(), marketingHandler.CreateCampaign)
				campaigns.PUT("/:id", middleware.AuthRequired(), marketingHandler.UpdateCampaign)
				campaigns.DELETE("/:id", middleware.AuthRequired(), marketingHandler.DeleteCampaign)
				campaigns.POST("/:id/launch", middleware.AuthRequired(), marketingHandler.LaunchCampaign)
				campaigns.GET("/:id/analytics", marketingHandler.GetCampaignAnalytics)
			}

			// WhatsApp routes
			whatsapp := marketing.Group("/whatsapp")
			{
				whatsapp.POST("/send", middleware.AuthRequired(), marketingHandler.SendWhatsApp)
				whatsapp.POST("/bulk", middleware.AuthRequired(), marketingHandler.SendBulkWhatsApp)
				whatsapp.GET("/templates", marketingHandler.GetWhatsAppTemplates)
				whatsapp.POST("/templates", middleware.AuthRequired(), marketingHandler.CreateWhatsAppTemplate)
			}

			// SMS routes
			sms := marketing.Group("/sms")
			{
				sms.POST("/send", middleware.AuthRequired(), marketingHandler.SendSMS)
			}

			// Email routes
			email := marketing.Group("/email")
			{
				email.POST("/send", middleware.AuthRequired(), marketingHandler.SendEmail)
			}

			// Communication history
			communication := marketing.Group("/communication")
			{
				communication.GET("/history", marketingHandler.GetCommunicationHistory)
			}
			// Company and Branch routes
			companyBranch := api.Group("/company-branch")
			companyBranch.Use(middleware.RateLimit(100))
			companyBranch.Use(middleware.Cache(5 * time.Minute))
			{
				// Company routes
				companies := companyBranch.Group("/companies")
				{
					companies.GET("", companyBranchHandler.GetCompanies)
					companies.GET("/user", companyBranchHandler.GetUserCompanies)
					companies.GET("/:id", companyBranchHandler.GetCompany)
					companies.POST("", middleware.AuthRequired(), companyBranchHandler.CreateCompany)
					companies.PUT("/:id", middleware.AuthRequired(), companyBranchHandler.UpdateCompany)
					companies.GET("/:company_id/branches", companyBranchHandler.GetCompanyBranches)
					companies.GET("/:company_id/stats", companyBranchHandler.GetCompanyStats)
				}

				// Branch routes
				branches := companyBranch.Group("/branches")
				{
					branches.GET("", companyBranchHandler.GetBranches)
					branches.GET("/:id", companyBranchHandler.GetBranch)
					branches.POST("", middleware.AuthRequired(), companyBranchHandler.CreateBranch)
					branches.PUT("/:id", middleware.AuthRequired(), companyBranchHandler.UpdateBranch)
				}

				// Multi-tenancy context
				companyBranch.POST("/context", companyBranchHandler.SetCompanyContext)

				// Payment Gateway routes
				payments := api.Group("/payments")
				payments.Use(middleware.RateLimit(100))
				payments.Use(middleware.Cache(5 * time.Minute))
				{
					// Stripe routes
					stripe := payments.Group("/stripe")
					{
						stripe.POST("/payment-intent", paymentGatewayHandler.CreateStripePaymentIntent)
						stripe.POST("/payment-intent/:payment_intent_id/confirm", paymentGatewayHandler.ConfirmStripePayment)
						stripe.POST("/refund", paymentGatewayHandler.CreateStripeRefund)
					}

					// Razorpay routes
					razorpay := payments.Group("/razorpay")
					{
						razorpay.POST("/order", paymentGatewayHandler.CreateRazorpayOrder)
						razorpay.POST("/verify", paymentGatewayHandler.VerifyRazorpayPayment)
						razorpay.POST("/refund", paymentGatewayHandler.CreateRazorpayRefund)
					}

					// Payment logs and analytics
					payments.GET("/logs", paymentGatewayHandler.GetPaymentLogs)
					payments.GET("/logs/:id", paymentGatewayHandler.GetPaymentLog)
					payments.GET("/refunds", paymentGatewayHandler.GetRefundLogs)
					payments.GET("/analytics", paymentGatewayHandler.GetPaymentAnalytics)
					payments.GET("/config", paymentGatewayHandler.GetPaymentGatewayConfig)

					// Webhook handlers
					webhooks := payments.Group("/webhooks")
					{
						webhooks.POST("/stripe", paymentGatewayHandler.HandleStripeWebhook)
						webhooks.POST("/razorpay", paymentGatewayHandler.HandleRazorpayWebhook)
					}
					// Hardware Integration routes
					hardware := api.Group("/hardware")
					hardware.Use(middleware.RateLimit(100))
					hardware.Use(middleware.Cache(5 * time.Minute))
					{
						// Weighing machine routes
						weighing := hardware.Group("/weighing")
						{
							weighing.GET("/weight", hardwareIntegrationHandler.GetWeight)
							weighing.POST("/calibrate", middleware.AuthRequired(), hardwareIntegrationHandler.CalibrateScale)
						}

						// Barcode scanner routes
						barcode := hardware.Group("/barcode")
						{
							barcode.POST("/scan", hardwareIntegrationHandler.ScanBarcode)
							barcode.GET("/history", hardwareIntegrationHandler.GetBarcodeHistory)
						}

						// Customer display routes
						display := hardware.Group("/display")
						{
							display.POST("/update", hardwareIntegrationHandler.UpdateCustomerDisplay)
							display.GET("/:display_id/status", hardwareIntegrationHandler.GetCustomerDisplayStatus)
						}

						// Printer routes
						printer := hardware.Group("/printer")
						{
							printer.POST("/receipt", hardwareIntegrationHandler.PrintReceipt)
							printer.POST("/report", hardwareIntegrationHandler.PrintReport)
						}

						// POS features
						pos := hardware.Group("/pos")
						{
							pos.POST("/hold-bill", hardwareIntegrationHandler.HoldBill)
							pos.GET("/held-bills", hardwareIntegrationHandler.GetHeldBills)
							pos.POST("/held-bills/:bill_id/resume", hardwareIntegrationHandler.ResumeHeldBill)
							pos.POST("/switch-panel", hardwareIntegrationHandler.SwitchPOSPanel)
							pos.GET("/layout", hardwareIntegrationHandler.GetPOSLayout)
						}

						// Hardware status
						hardware.GET("/status", hardwareIntegrationHandler.GetHardwareStatus)

						// Loyalty system routes
						loyalty := api.Group("/loyalty")
						loyalty.Use(middleware.RateLimit(100))
						loyalty.Use(middleware.Cache(5 * time.Minute))
						{
							// Loyalty program management
							programs := loyalty.Group("/programs")
							{
								programs.GET("", loyaltyHandler.GetLoyaltyPrograms)
								programs.GET("/:id", loyaltyHandler.GetLoyaltyProgram)
								programs.POST("", middleware.AuthRequired(), loyaltyHandler.CreateLoyaltyProgram)
								programs.PUT("/:id", middleware.AuthRequired(), loyaltyHandler.UpdateLoyaltyProgram)
							}

							// Customer loyalty
							customerLoyalty := loyalty.Group("/customers")
							{
								customerLoyalty.GET("/:customer_id", loyaltyHandler.GetCustomerLoyalty)
								customerLoyalty.POST("/:customer_id/earn", middleware.AuthRequired(), loyaltyHandler.EarnLoyaltyPoints)
								customerLoyalty.POST("/:customer_id/redeem", middleware.AuthRequired(), loyaltyHandler.RedeemLoyaltyPoints)
								customerLoyalty.GET("/:customer_id/transactions", loyaltyHandler.GetLoyaltyTransactions)
							}

							// Rewards management
							rewards := loyalty.Group("/rewards")
							{
								rewards.GET("", loyaltyHandler.GetRewards)
								rewards.GET("/:id", loyaltyHandler.GetReward)
								rewards.POST("", middleware.AuthRequired(), loyaltyHandler.CreateReward)
								rewards.PUT("/:id", middleware.AuthRequired(), loyaltyHandler.UpdateReward)
							}

							// Gift cards
							giftCards := loyalty.Group("/gift-cards")
							{
								giftCards.GET("", loyaltyHandler.GetGiftCards)
								giftCards.POST("", middleware.AuthRequired(), loyaltyHandler.CreateGiftCard)
							}

							loyalty.GET("/analytics", loyaltyHandler.GetLoyaltyAnalytics)
						}
					}
				}
			}
		}
	}

	// Graceful shutdown
	srv := &http.Server{
		Addr:         ":" + config.Server.Port,
		Handler:      router,
		ReadTimeout:  config.Server.ReadTimeout,
		WriteTimeout: config.Server.WriteTimeout,
		IdleTimeout:  config.Server.IdleTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", config.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	// signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	// <-quit

	log.Println("Server shutting down...")

	// Stop workflow processor
	workflowProcessor.Stop()

	// Close database connection
	db.Close()

	// Close cache connection
	cache.client.Close()

	log.Println("Server exited")
}

// Configuration Loading
func loadConfig() Config {
	return Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
			IdleTimeout:  120 * time.Second,
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnvAsInt("DB_PORT", 5432),
			Username:        getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", "password"),
			Database:        getEnv("DB_NAME", "yeelo_homeopathy"),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: 5 * time.Minute,
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			Expiration: 24 * time.Hour,
		},
		Cache: CacheConfig{
			DefaultTTL: 5 * time.Minute,
		},
	}
}

// Utility functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
