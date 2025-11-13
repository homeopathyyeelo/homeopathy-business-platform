package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"marketplace-integration/internal/handlers"
	"marketplace-integration/internal/middleware"
	"marketplace-integration/internal/services"
	"marketplace-integration/pkg/queue"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Initialize database
	db := initDatabase()
	
	// Initialize message queue
	rabbitMQ := queue.NewRabbitMQ(
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"),
		os.Getenv("RABBITMQ_USER"),
		os.Getenv("RABBITMQ_PASSWORD"),
	)
	defer rabbitMQ.Close()

	// Initialize services
	marketplaceService := services.NewMarketplaceService(db, rabbitMQ)
	webhookService := services.NewWebhookService(db, rabbitMQ)
	
	// Initialize handlers
	webhookHandler := handlers.NewWebhookHandler(webhookService)
	healthHandler := handlers.NewHealthHandler(db)

	// Setup Gin router
	router := gin.Default()
	
	// Middleware
	router.Use(middleware.CORS())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.RateLimiter(db))
	router.Use(middleware.Recovery())

	// Health endpoints
	router.GET("/health", healthHandler.Health)
	router.GET("/ready", healthHandler.Ready)

	// Webhook endpoints
	webhooks := router.Group("/webhooks")
	{
		webhooks.POST("/amazon", middleware.HMACVerification("WEBHOOK_SECRET_AMAZON"), webhookHandler.HandleAmazon)
		webhooks.POST("/flipkart", middleware.HMACVerification("WEBHOOK_SECRET_FLIPKART"), webhookHandler.HandleFlipkart)
		webhooks.POST("/meesho", middleware.HMACVerification("WEBHOOK_SECRET_MEESHO"), webhookHandler.HandleMeesho)
	}

	// API endpoints (internal use)
	api := router.Group("/api/v1")
	api.Use(middleware.InternalAPIAuth())
	{
		api.GET("/orders", webhookHandler.GetOrders)
		api.GET("/orders/:id", webhookHandler.GetOrder)
		api.POST("/orders/:id/sync", webhookHandler.SyncOrder)
		api.GET("/webhooks", webhookHandler.GetWebhooks)
	}

	// Start background workers
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start order processor
	go marketplaceService.StartOrderProcessor(ctx)
	
	// Start polling service for marketplaces without webhooks
	go marketplaceService.StartPollingService(ctx)

	// Start server
	port := os.Getenv("MARKETPLACE_SERVICE_PORT")
	if port == "" {
		port = "8001"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("🚀 Marketplace Integration Service starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	cancel() // Stop background workers

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}

func initDatabase() *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("✅ Database connected")
	return db
}
