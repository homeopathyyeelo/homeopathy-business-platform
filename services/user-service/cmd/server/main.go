package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/yeelo/user-service/internal/config"
	"github.com/yeelo/user-service/internal/database"
	"github.com/yeelo/user-service/internal/handlers"
	"github.com/yeelo/user-service/internal/kafka"
	"github.com/yeelo/user-service/internal/middleware"
	"github.com/yeelo/user-service/internal/redis"
	"github.com/yeelo/user-service/internal/repository"
	"github.com/yeelo/user-service/internal/service"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Auto-migrate models
	if err := database.AutoMigrate(db); err != nil {
		logger.Fatal("Failed to migrate database", zap.Error(err))
	}

	// Initialize Redis
	redisClient := redis.NewRedisClient(cfg)
	defer redisClient.Close()

	// Initialize Kafka
	kafkaProducer := kafka.NewProducer(cfg)
	defer kafkaProducer.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo, redisClient, kafkaProducer, logger)
	authService := service.NewAuthService(userRepo, cfg, logger)
	roleService := service.NewRoleService(roleRepo, redisClient, logger)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService, logger)
	authHandler := handlers.NewAuthHandler(authService, logger)
	roleHandler := handlers.NewRoleHandler(roleService, logger)
	healthHandler := handlers.NewHealthHandler(db, redisClient, logger)

	// Setup Fiber app
	app := setupFiberApp(cfg, userHandler, authHandler, roleHandler, healthHandler, logger)

	// Start server in goroutine
	go func() {
		logger.Info("Starting User Service", zap.String("port", cfg.Server.Port))
		if err := app.Listen(fmt.Sprintf(":%s", cfg.Server.Port)); err != nil {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown
	if err := app.ShutdownWithTimeout(5 * time.Second); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

func setupFiberApp(
	cfg *config.Config,
	userHandler *handlers.UserHandler,
	authHandler *handlers.AuthHandler,
	roleHandler *handlers.RoleHandler,
	healthHandler *handlers.HealthHandler,
	logger *zap.Logger,
) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "User Service",
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

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)

	// User routes (protected)
	users := api.Group("/users", middleware.AuthMiddleware(cfg))
	users.Get("/", userHandler.List)
	users.Get("/:id", userHandler.Get)
	users.Post("/", userHandler.Create)
	users.Put("/:id", userHandler.Update)
	users.Delete("/:id", userHandler.Delete)
	users.Get("/profile", userHandler.GetProfile)
	users.Put("/profile", userHandler.UpdateProfile)
	users.Put("/password", userHandler.ChangePassword)

	// Role routes (protected)
	roles := api.Group("/roles", middleware.AuthMiddleware(cfg))
	roles.Get("/", roleHandler.List)
	roles.Get("/:id", roleHandler.Get)
	roles.Post("/", roleHandler.Create)
	roles.Put("/:id", roleHandler.Update)
	roles.Delete("/:id", roleHandler.Delete)

	return app
}
