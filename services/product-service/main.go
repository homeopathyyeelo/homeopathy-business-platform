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
)

// Config holds application configuration
type Config struct {
	Port         string
	DatabaseURL  string
	RedisURL     string
	KafkaBrokers string
	ServiceName  string
}

// Product model
type Product struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null"`
	SKU         string    `json:"sku" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	CategoryID  string    `json:"category_id" gorm:"type:uuid"`
	BrandID     string    `json:"brand_id" gorm:"type:uuid"`
	Price       float64   `json:"price" gorm:"not null"`
	MRP         float64   `json:"mrp"`
	HSNCode     string    `json:"hsn_code"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Category model
type Category struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null"`
	ParentID  *string   `json:"parent_id" gorm:"type:uuid"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Brand model
type Brand struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null;uniqueIndex"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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
	db.AutoMigrate(&Product{}, &Category{}, &Brand{})

	// Initialize Gin router
	router := setupRouter()

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + config.Port,
		Handler: router,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 Product Service starting on port %s", config.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}

func loadConfig() Config {
	return Config{
		Port:         getEnv("PORT", "8001"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379/0"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		ServiceName:  getEnv("SERVICE_NAME", "product-service"),
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

func setupRouter() *gin.Engine {
	router := gin.Default()

	// Middleware
	router.Use(corsMiddleware())
	router.Use(traceMiddleware())

	// Health check
	router.GET("/health", healthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Products
		products := v1.Group("/products")
		{
			products.GET("", listProducts)
			products.POST("", createProduct)
			products.GET("/:id", getProduct)
			products.PUT("/:id", updateProduct)
			products.DELETE("/:id", deleteProduct)
			products.POST("/bulk-import", bulkImportProducts)
		}

		// Categories
		categories := v1.Group("/categories")
		{
			categories.GET("", listCategories)
			categories.POST("", createCategory)
			categories.GET("/:id", getCategory)
			categories.PUT("/:id", updateCategory)
			categories.DELETE("/:id", deleteCategory)
		}

		// Brands
		brands := v1.Group("/brands")
		{
			brands.GET("", listBrands)
			brands.POST("", createBrand)
			brands.GET("/:id", getBrand)
			brands.PUT("/:id", updateBrand)
			brands.DELETE("/:id", deleteBrand)
		}

		// Barcodes
		v1.POST("/barcodes/generate", generateBarcode)
	}

	return router
}

// Middleware
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func traceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		c.Set("trace_id", traceID)
		c.Writer.Header().Set("X-Trace-ID", traceID)
		c.Next()
	}
}

// Handlers
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "product-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func listProducts(c *gin.Context) {
	var products []Product
	
	query := db.Model(&Product{})
	
	// Pagination
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")
	
	var total int64
	query.Count(&total)
	
	query.Limit(20).Offset(0).Find(&products)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"products": products,
			"total":    total,
			"page":     page,
			"limit":    limit,
		},
	})
}

func createProduct(c *gin.Context) {
	var product Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to create product",
		})
		return
	}

	// TODO: Publish event to Kafka (product.created)

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    product,
		Message: "Product created successfully",
	})
}

func getProduct(c *gin.Context) {
	id := c.Param("id")
	var product Product

	if err := db.First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Product not found",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    product,
	})
}

func updateProduct(c *gin.Context) {
	id := c.Param("id")
	var product Product

	if err := db.First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Product not found",
		})
		return
	}

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to update product",
		})
		return
	}

	// TODO: Publish event to Kafka (product.updated)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    product,
		Message: "Product updated successfully",
	})
}

func deleteProduct(c *gin.Context) {
	id := c.Param("id")

	if err := db.Delete(&Product{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to delete product",
		})
		return
	}

	// TODO: Publish event to Kafka (product.deleted)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Product deleted successfully",
	})
}

func bulkImportProducts(c *gin.Context) {
	// TODO: Implement bulk import logic
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Bulk import endpoint - to be implemented",
	})
}

// Category handlers
func listCategories(c *gin.Context) {
	var categories []Category
	db.Find(&categories)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    categories,
	})
}

func createCategory(c *gin.Context) {
	var category Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to create category",
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    category,
	})
}

func getCategory(c *gin.Context) {
	id := c.Param("id")
	var category Category

	if err := db.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Category not found",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    category,
	})
}

func updateCategory(c *gin.Context) {
	id := c.Param("id")
	var category Category

	if err := db.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Category not found",
		})
		return
	}

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to update category",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    category,
	})
}

func deleteCategory(c *gin.Context) {
	id := c.Param("id")

	if err := db.Delete(&Category{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to delete category",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Category deleted successfully",
	})
}

// Brand handlers
func listBrands(c *gin.Context) {
	var brands []Brand
	db.Find(&brands)

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    brands,
	})
}

func createBrand(c *gin.Context) {
	var brand Brand
	if err := c.ShouldBindJSON(&brand); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Create(&brand).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to create brand",
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    brand,
	})
}

func getBrand(c *gin.Context) {
	id := c.Param("id")
	var brand Brand

	if err := db.First(&brand, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Brand not found",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    brand,
	})
}

func updateBrand(c *gin.Context) {
	id := c.Param("id")
	var brand Brand

	if err := db.First(&brand, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Brand not found",
		})
		return
	}

	if err := c.ShouldBindJSON(&brand); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := db.Save(&brand).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to update brand",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    brand,
	})
}

func deleteBrand(c *gin.Context) {
	id := c.Param("id")

	if err := db.Delete(&Brand{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to delete brand",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Brand deleted successfully",
	})
}

func generateBarcode(c *gin.Context) {
	// TODO: Implement barcode generation
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Barcode generation endpoint - to be implemented",
	})
}
