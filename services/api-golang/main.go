// Enhanced Golang API Service for Homeopathy ERP
// Advanced features for Golang developer mastery

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
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

func (c *CacheService) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, key, data, expiration).Err()
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

// Enhanced HTTP Handlers with Context and Error Handling (defined in handlers.go)

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
	workflowService := NewWorkflowService(db, validator, cache, circuitBreaker)
	inventoryService := NewInventoryService(db, validator, cache, circuitBreaker)
	customerService := NewCustomerServiceService(db, validator, cache, circuitBreaker)
	financialService := NewFinancialService(db, validator, cache, circuitBreaker)
	workflowProcessor := NewWorkflowProcessor(db, 10) // 10 worker goroutines

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
			inventory.GET("", handler.GetInventory)
			inventory.GET("/:id", handler.GetInventoryItem)
			inventory.POST("", middleware.AuthRequired(), handler.CreateInventoryItem)
			inventory.PUT("/:id", middleware.AuthRequired(), handler.UpdateInventoryItem)
			inventory.DELETE("/:id", middleware.AuthRequired(), handler.DeleteInventoryItem)
			inventory.GET("/low-stock", handler.GetLowStockItems)
			inventory.PUT("/:id/stock", middleware.AuthRequired(), handler.UpdateStock)
		}

		// Customer Service routes
		customerService := api.Group("/customer-service")
		customerService.Use(middleware.RateLimit(100))
		customerService.Use(middleware.Cache(3 * time.Minute))
		{
			customerService.GET("/metrics", handler.GetCustomerServiceMetrics)
			customerService.GET("/agents/:id", handler.GetAgentPerformance)
			customerService.GET("/departments/:department", handler.GetDepartmentMetrics)
		}

		// Products routes
		products := api.Group("/products")
		products.Use(middleware.RateLimit(100))
		products.Use(middleware.Cache(2 * time.Minute))
		{
			products.GET("", handler.GetProducts)
			products.GET("/:id", handler.GetProduct)
			products.POST("", middleware.AuthRequired(), handler.CreateProduct)
			products.PUT("/:id", middleware.AuthRequired(), handler.UpdateProduct)
			products.DELETE("/:id", middleware.AuthRequired(), handler.DeleteProduct)
		}

		// Master data import routes
		imports := api.Group("/imports")
		imports.Use(middleware.AuthRequired())
		{
			imports.POST("/products/excel", HandleImportProducts)
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
