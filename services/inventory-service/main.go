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
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config holds application configuration
type Config struct {
	Port         string
	DatabaseURL  string
	RedisURL     string
	KafkaBrokers string
	ServiceName  string
}

// Stock model
type Stock struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID string    `json:"product_id" gorm:"type:uuid;not null;index"`
	ShopID    string    `json:"shop_id" gorm:"type:uuid;not null;index"`
	Quantity  float64   `json:"quantity" gorm:"not null;default:0"`
	Reserved  float64   `json:"reserved" gorm:"not null;default:0"`
	Available float64   `json:"available" gorm:"not null;default:0"`
	RackID    *string   `json:"rack_id" gorm:"type:uuid"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Batch model
type Batch struct {
	ID         string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID  string    `json:"product_id" gorm:"type:uuid;not null;index"`
	BatchNo    string    `json:"batch_no" gorm:"not null;index"`
	MfgDate    time.Time `json:"mfg_date"`
	ExpiryDate time.Time `json:"expiry_date" gorm:"index"`
	Quantity   float64   `json:"quantity" gorm:"not null"`
	MRP        float64   `json:"mrp"`
	PurchasePrice float64 `json:"purchase_price"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// StockMovement model
type StockMovement struct {
	ID            string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID     string    `json:"product_id" gorm:"type:uuid;not null;index"`
	ShopID        string    `json:"shop_id" gorm:"type:uuid;not null;index"`
	MovementType  string    `json:"movement_type" gorm:"not null"` // IN, OUT, ADJUST, TRANSFER
	Quantity      float64   `json:"quantity" gorm:"not null"`
	Reason        string    `json:"reason"`
	ReferenceType string    `json:"reference_type"` // SALE, PURCHASE, ADJUSTMENT, TRANSFER
	ReferenceID   string    `json:"reference_id" gorm:"type:uuid"`
	CreatedBy     string    `json:"created_by" gorm:"type:uuid"`
	CreatedAt     time.Time `json:"created_at"`
}

// Response wrapper
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

var db *gorm.DB

func main() {
	// Load environment variables
	godotenv.Load()

	config := loadConfig()

	// Initialize database
	var err error
	db, err = initDB(config.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate models
	db.AutoMigrate(&Stock{}, &Batch{}, &StockMovement{})

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "Inventory Service",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())
	app.Use(traceMiddleware())

	// Routes
	setupRoutes(app)

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")
		app.Shutdown()
	}()

	// Start server
	log.Printf("🚀 Inventory Service starting on port %s", config.Port)
	if err := app.Listen(":" + config.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

	log.Println("Server exited")
}

func loadConfig() Config {
	return Config{
		Port:         getEnv("PORT", "8002"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379/1"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		ServiceName:  getEnv("SERVICE_NAME", "inventory-service"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func initDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func traceMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		traceID := c.Get("X-Trace-ID")
		if traceID == "" {
			traceID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		c.Locals("trace_id", traceID)
		c.Set("X-Trace-ID", traceID)
		return c.Next()
	}
}

func setupRoutes(app *fiber.App) {
	// Health check
	app.Get("/health", healthCheck)

	// API v1
	v1 := app.Group("/api/v1")

	// Stock endpoints
	stock := v1.Group("/inventory")
	stock.Get("/stock", listStock)
	stock.Get("/stock/:product_id", getStockByProduct)
	stock.Post("/adjust", adjustStock)
	stock.Post("/transfer", transferStock)
	stock.Post("/reconcile", reconcileStock)

	// Batch endpoints
	batches := v1.Group("/inventory/batches")
	batches.Get("", listBatches)
	batches.Get("/:id", getBatch)
	batches.Post("", createBatch)
	batches.Get("/expiry-alerts", getExpiryAlerts)

	// Movement history
	v1.Get("/inventory/movements", listMovements)
}

// Handlers
func healthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "healthy",
		"service": "inventory-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func listStock(c *fiber.Ctx) error {
	var stocks []Stock
	
	query := db.Model(&Stock{})
	
	// Filter by shop
	if shopID := c.Query("shop_id"); shopID != "" {
		query = query.Where("shop_id = ?", shopID)
	}
	
	// Filter low stock
	if c.Query("low_stock") == "true" {
		query = query.Where("available < ?", 10)
	}
	
	query.Find(&stocks)

	return c.JSON(Response{
		Success: true,
		Data:    stocks,
	})
}

func getStockByProduct(c *fiber.Ctx) error {
	productID := c.Params("product_id")
	shopID := c.Query("shop_id")

	var stock Stock
	query := db.Where("product_id = ?", productID)
	
	if shopID != "" {
		query = query.Where("shop_id = ?", shopID)
	}

	if err := query.First(&stock).Error; err != nil {
		return c.Status(404).JSON(Response{
			Success: false,
			Error:   "Stock not found",
		})
	}

	return c.JSON(Response{
		Success: true,
		Data:    stock,
	})
}

func adjustStock(c *fiber.Ctx) error {
	type AdjustRequest struct {
		ProductID string  `json:"product_id"`
		ShopID    string  `json:"shop_id"`
		Quantity  float64 `json:"quantity"`
		Reason    string  `json:"reason"`
	}

	var req AdjustRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(Response{
			Success: false,
			Error:   err.Error(),
		})
	}

	// Begin transaction
	tx := db.Begin()

	// Update stock
	var stock Stock
	if err := tx.Where("product_id = ? AND shop_id = ?", req.ProductID, req.ShopID).First(&stock).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new stock record
			stock = Stock{
				ProductID: req.ProductID,
				ShopID:    req.ShopID,
				Quantity:  req.Quantity,
				Available: req.Quantity,
			}
			if err := tx.Create(&stock).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(Response{
					Success: false,
					Error:   "Failed to create stock",
				})
			}
		} else {
			tx.Rollback()
			return c.Status(500).JSON(Response{
				Success: false,
				Error:   "Database error",
			})
		}
	} else {
		// Update existing stock
		stock.Quantity += req.Quantity
		stock.Available += req.Quantity
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(Response{
				Success: false,
				Error:   "Failed to update stock",
			})
		}
	}

	// Record movement
	movement := StockMovement{
		ProductID:     req.ProductID,
		ShopID:        req.ShopID,
		MovementType:  "ADJUST",
		Quantity:      req.Quantity,
		Reason:        req.Reason,
		ReferenceType: "ADJUSTMENT",
	}
	if err := tx.Create(&movement).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(Response{
			Success: false,
			Error:   "Failed to record movement",
		})
	}

	// Commit transaction
	tx.Commit()

	// TODO: Publish event to Kafka (inventory.adjusted)

	return c.JSON(Response{
		Success: true,
		Data:    stock,
		Message: "Stock adjusted successfully",
	})
}

func transferStock(c *fiber.Ctx) error {
	type TransferRequest struct {
		ProductID    string  `json:"product_id"`
		FromShopID   string  `json:"from_shop_id"`
		ToShopID     string  `json:"to_shop_id"`
		Quantity     float64 `json:"quantity"`
		Reason       string  `json:"reason"`
	}

	var req TransferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(Response{
			Success: false,
			Error:   err.Error(),
		})
	}

	// TODO: Implement stock transfer logic with transaction

	return c.JSON(Response{
		Success: true,
		Message: "Stock transfer endpoint - to be implemented",
	})
}

func reconcileStock(c *fiber.Ctx) error {
	// TODO: Implement stock reconciliation
	return c.JSON(Response{
		Success: true,
		Message: "Stock reconciliation endpoint - to be implemented",
	})
}

func listBatches(c *fiber.Ctx) error {
	var batches []Batch
	
	query := db.Model(&Batch{})
	
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	
	query.Order("expiry_date ASC").Find(&batches)

	return c.JSON(Response{
		Success: true,
		Data:    batches,
	})
}

func getBatch(c *fiber.Ctx) error {
	id := c.Params("id")
	var batch Batch

	if err := db.First(&batch, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(Response{
			Success: false,
			Error:   "Batch not found",
		})
	}

	return c.JSON(Response{
		Success: true,
		Data:    batch,
	})
}

func createBatch(c *fiber.Ctx) error {
	var batch Batch
	if err := c.BodyParser(&batch); err != nil {
		return c.Status(400).JSON(Response{
			Success: false,
			Error:   err.Error(),
		})
	}

	if err := db.Create(&batch).Error; err != nil {
		return c.Status(500).JSON(Response{
			Success: false,
			Error:   "Failed to create batch",
		})
	}

	return c.Status(201).JSON(Response{
		Success: true,
		Data:    batch,
		Message: "Batch created successfully",
	})
}

func getExpiryAlerts(c *fiber.Ctx) error {
	days := c.QueryInt("days", 30)
	
	var batches []Batch
	expiryThreshold := time.Now().AddDate(0, 0, days)
	
	db.Where("expiry_date <= ? AND expiry_date > ? AND quantity > 0", 
		expiryThreshold, time.Now()).
		Order("expiry_date ASC").
		Find(&batches)

	return c.JSON(Response{
		Success: true,
		Data:    batches,
	})
}

func listMovements(c *fiber.Ctx) error {
	var movements []StockMovement
	
	query := db.Model(&StockMovement{})
	
	if productID := c.Query("product_id"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	
	if shopID := c.Query("shop_id"); shopID != "" {
		query = query.Where("shop_id = ?", shopID)
	}
	
	query.Order("created_at DESC").Limit(100).Find(&movements)

	return c.JSON(Response{
		Success: true,
		Data:    movements,
	})
}
