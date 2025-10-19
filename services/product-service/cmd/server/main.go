package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/yeelo/product-service/internal/config"
	"github.com/yeelo/product-service/internal/database"
	"github.com/yeelo/product-service/internal/handlers"
	"github.com/yeelo/product-service/internal/kafka"
	"github.com/yeelo/product-service/internal/middleware"
	"github.com/yeelo/product-service/internal/redis"
	"github.com/yeelo/product-service/internal/repository"
	"github.com/yeelo/product-service/internal/service"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger_zap, _ := zap.NewProduction()
	defer logger_zap.Sync()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger_zap.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		logger_zap.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Auto-migrate models
	if err := database.AutoMigrate(db); err != nil {
		logger_zap.Fatal("Failed to migrate database", zap.Error(err))
	}

	// Initialize Redis
	redisClient := redis.NewRedisClient(cfg)
	defer redisClient.Close()

	// Initialize Kafka
	kafkaProducer := kafka.NewProducer(cfg)
	defer kafkaProducer.Close()

	// Initialize repositories
	productRepo := repository.NewProductRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	brandRepo := repository.NewBrandRepository(db)
	inventoryRepo := repository.NewInventoryRepository(db)

	// Initialize services
	productService := service.NewProductService(productRepo, redisClient, kafkaProducer, logger_zap)
	categoryService := service.NewCategoryService(categoryRepo, redisClient, logger_zap)
	brandService := service.NewBrandService(brandRepo, redisClient, logger_zap)
	inventoryService := service.NewInventoryService(inventoryRepo, redisClient, kafkaProducer, logger_zap)

	// Initialize handlers
	productHandler := handlers.NewProductHandler(productService, logger_zap)
	categoryHandler := handlers.NewCategoryHandler(categoryService, logger_zap)
	brandHandler := handlers.NewBrandHandler(brandService, logger_zap)
	inventoryHandler := handlers.NewInventoryHandler(inventoryService, logger_zap)
	healthHandler := handlers.NewHealthHandler(db, redisClient, logger_zap)

	// Setup Fiber app
	app := setupFiberApp(cfg, productHandler, categoryHandler, brandHandler, inventoryHandler, healthHandler, logger_zap)

	// Start server in goroutine
	go func() {
		logger_zap.Info("Starting Product Service", zap.String("port", cfg.Server.Port))
		if err := app.Listen(fmt.Sprintf(":%s", cfg.Server.Port)); err != nil {
			logger_zap.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger_zap.Info("Shutting down server...")

	// Graceful shutdown
	if err := app.ShutdownWithTimeout(5 * time.Second); err != nil {
		logger_zap.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger_zap.Info("Server exited")
}

func setupFiberApp(
	cfg *config.Config,
	productHandler *handlers.ProductHandler,
	categoryHandler *handlers.CategoryHandler,
	brandHandler *handlers.BrandHandler,
	inventoryHandler *handlers.InventoryHandler,
	healthHandler *handlers.HealthHandler,
	logger_zap *zap.Logger,
) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "Product Service",
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
		ErrorHandler: middleware.ErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} | ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
	}))

	// Health check endpoints
	app.Get("/health", healthHandler.Health)
	app.Get("/health/ready", healthHandler.Ready)
	app.Get("/health/live", healthHandler.Live)

	// Metrics endpoint
	app.Get("/metrics", middleware.PrometheusHandler())

	// API v1 routes
	api := app.Group("/api/v1")

	// Product routes
	products := api.Group("/products")
	products.Get("/", productHandler.List)
	products.Get("/:id", productHandler.Get)
	products.Post("/", middleware.AuthMiddleware(cfg), productHandler.Create)
	products.Put("/:id", middleware.AuthMiddleware(cfg), productHandler.Update)
	products.Delete("/:id", middleware.AuthMiddleware(cfg), productHandler.Delete)
	products.Get("/search", productHandler.Search)
	products.Get("/barcode/:barcode", productHandler.GetByBarcode)

	// Category routes
	categories := api.Group("/categories")
	categories.Get("/", categoryHandler.List)
	categories.Get("/:id", categoryHandler.Get)
	categories.Post("/", middleware.AuthMiddleware(cfg), categoryHandler.Create)
	categories.Put("/:id", middleware.AuthMiddleware(cfg), categoryHandler.Update)
	categories.Delete("/:id", middleware.AuthMiddleware(cfg), categoryHandler.Delete)

	// Brand routes
	brands := api.Group("/brands")
	brands.Get("/", brandHandler.List)
	brands.Get("/:id", brandHandler.Get)
	brands.Post("/", middleware.AuthMiddleware(cfg), brandHandler.Create)
	brands.Put("/:id", middleware.AuthMiddleware(cfg), brandHandler.Update)
	brands.Delete("/:id", middleware.AuthMiddleware(cfg), brandHandler.Delete)

	// Inventory routes
	inventory := api.Group("/inventory", middleware.AuthMiddleware(cfg))
	inventory.Get("/", inventoryHandler.List)
	inventory.Get("/:id", inventoryHandler.Get)
	inventory.Post("/adjust", inventoryHandler.AdjustStock)
	inventory.Get("/low-stock", inventoryHandler.GetLowStock)
	inventory.Get("/product/:product_id", inventoryHandler.GetByProduct)

	return app
}
