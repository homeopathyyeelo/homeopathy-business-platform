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

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

// Invoice model
type Invoice struct {
	ID          string        `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	InvoiceNo   string        `json:"invoice_no" gorm:"uniqueIndex;not null"`
	CustomerID  string        `json:"customer_id" gorm:"type:uuid;index"`
	ShopID      string        `json:"shop_id" gorm:"type:uuid;not null;index"`
	InvoiceDate time.Time     `json:"invoice_date" gorm:"not null"`
	SubTotal    float64       `json:"sub_total" gorm:"not null"`
	TaxAmount   float64       `json:"tax_amount" gorm:"not null;default:0"`
	DiscountAmt float64       `json:"discount_amount" gorm:"not null;default:0"`
	TotalAmount float64       `json:"total_amount" gorm:"not null"`
	PaidAmount  float64       `json:"paid_amount" gorm:"not null;default:0"`
	DueAmount   float64       `json:"due_amount" gorm:"not null;default:0"`
	PaymentMode string        `json:"payment_mode"`                           // CASH, CARD, UPI, CREDIT
	Status      string        `json:"status" gorm:"not null;default:'DRAFT'"` // DRAFT, PAID, PARTIAL, CANCELLED
	Notes       string        `json:"notes"`
	CreatedBy   string        `json:"created_by" gorm:"type:uuid"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	Items       []InvoiceItem `json:"items" gorm:"foreignKey:InvoiceID"`
}

// InvoiceItem model
type InvoiceItem struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	InvoiceID   string    `json:"invoice_id" gorm:"type:uuid;not null;index"`
	ProductID   string    `json:"product_id" gorm:"type:uuid;not null"`
	ProductName string    `json:"product_name" gorm:"not null"`
	Quantity    float64   `json:"quantity" gorm:"not null"`
	Price       float64   `json:"price" gorm:"not null"`
	TaxRate     float64   `json:"tax_rate" gorm:"not null;default:0"`
	TaxAmount   float64   `json:"tax_amount" gorm:"not null;default:0"`
	Discount    float64   `json:"discount" gorm:"not null;default:0"`
	Total       float64   `json:"total" gorm:"not null"`
	BatchNo     string    `json:"batch_no"`
	CreatedAt   time.Time `json:"created_at"`
}

// HeldBill model
type HeldBill struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	BillName  string    `json:"bill_name" gorm:"not null"`
	ShopID    string    `json:"shop_id" gorm:"type:uuid;not null;index"`
	Data      string    `json:"data" gorm:"type:jsonb"` // Store entire bill as JSON
	CreatedBy string    `json:"created_by" gorm:"type:uuid"`
	CreatedAt time.Time `json:"created_at"`
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
	db.AutoMigrate(&Invoice{}, &InvoiceItem{}, &HeldBill{})

	// Initialize Echo
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(traceMiddleware())

	// Routes
	setupRoutes(e)

	// Start server in goroutine
	go func() {
		log.Printf("🚀 Sales Service starting on port %s", config.Port)
		if err := e.Start(":" + config.Port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}

func loadConfig() Config {
	return Config{
		Port:         getEnv("PORT", "8003"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5433/yeelo_homeopathy"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379/2"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		ServiceName:  getEnv("SERVICE_NAME", "sales-service"),
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

func traceMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			traceID := c.Request().Header.Get("X-Trace-ID")
			if traceID == "" {
				traceID = fmt.Sprintf("%d", time.Now().UnixNano())
			}
			c.Set("trace_id", traceID)
			c.Response().Header().Set("X-Trace-ID", traceID)
			return next(c)
		}
	}
}

func setupRoutes(e *echo.Echo) {
	// Health check
	e.GET("/health", healthCheck)

	// API v1
	v1 := e.Group("/api/v1")

	// POS endpoints
	pos := v1.Group("/pos")
	pos.POST("/invoice", createInvoice)
	pos.POST("/hold", holdBill)
	pos.GET("/held-bills", listHeldBills)
	pos.POST("/resume/:id", resumeBill)
	pos.DELETE("/held-bills/:id", deleteHeldBill)

	// Sales orders
	orders := v1.Group("/sales/orders")
	orders.GET("", listOrders)
	orders.POST("", createOrder)
	orders.GET("/:id", getOrder)
	orders.PUT("/:id", updateOrder)
	orders.DELETE("/:id", cancelOrder)

	// Invoices
	invoices := v1.Group("/sales/invoices")
	invoices.GET("", listInvoices)
	invoices.GET("/:id", getInvoice)
	invoices.PUT("/:id", updateInvoice)
	invoices.POST("/:id/cancel", cancelInvoice)

	// Returns
	v1.POST("/sales/returns", createReturn)
	v1.GET("/sales/returns", listReturns)

	// Credit sales / Dues
	v1.GET("/sales/dues", listDues)
	v1.POST("/sales/dues/:id/payment", recordPayment)
}

// Handlers
func healthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"service": "sales-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func createInvoice(c echo.Context) error {
	var invoice Invoice
	if err := c.Bind(&invoice); err != nil {
		return c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
	}

	// Generate invoice number
	if invoice.InvoiceNo == "" {
		invoice.InvoiceNo = fmt.Sprintf("INV-%d", time.Now().Unix())
	}

	// Set defaults
	if invoice.InvoiceDate.IsZero() {
		invoice.InvoiceDate = time.Now()
	}
	if invoice.Status == "" {
		invoice.Status = "DRAFT"
	}

	// Begin transaction
	tx := db.Begin()

	// Create invoice
	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to create invoice",
		})
	}

	// Create invoice items
	for i := range invoice.Items {
		invoice.Items[i].InvoiceID = invoice.ID
		if err := tx.Create(&invoice.Items[i]).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{
				Success: false,
				Error:   "Failed to create invoice items",
			})
		}
	}

	// Commit transaction
	tx.Commit()

	// TODO: Publish event to Kafka (order.created, invoice.issued)
	// TODO: Update inventory (reduce stock)

	return c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    invoice,
		Message: "Invoice created successfully",
	})
}

func holdBill(c echo.Context) error {
	var heldBill HeldBill
	if err := c.Bind(&heldBill); err != nil {
		return c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error:   err.Error(),
		})
	}

	if err := db.Create(&heldBill).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to hold bill",
		})
	}

	return c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    heldBill,
		Message: "Bill held successfully",
	})
}

func listHeldBills(c echo.Context) error {
	shopID := c.QueryParam("shop_id")

	var heldBills []HeldBill
	query := db.Model(&HeldBill{})

	if shopID != "" {
		query = query.Where("shop_id = ?", shopID)
	}

	query.Order("created_at DESC").Find(&heldBills)

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    heldBills,
	})
}

func resumeBill(c echo.Context) error {
	id := c.Param("id")
	var heldBill HeldBill

	if err := db.First(&heldBill, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Held bill not found",
		})
	}

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    heldBill,
	})
}

func deleteHeldBill(c echo.Context) error {
	id := c.Param("id")

	if err := db.Delete(&HeldBill{}, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   "Failed to delete held bill",
		})
	}

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Held bill deleted successfully",
	})
}

func listOrders(c echo.Context) error {
	// TODO: Implement orders list
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Orders list endpoint - to be implemented",
	})
}

func createOrder(c echo.Context) error {
	// TODO: Implement order creation
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Create order endpoint - to be implemented",
	})
}

func getOrder(c echo.Context) error {
	// TODO: Implement get order
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Get order endpoint - to be implemented",
	})
}

func updateOrder(c echo.Context) error {
	// TODO: Implement update order
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Update order endpoint - to be implemented",
	})
}

func cancelOrder(c echo.Context) error {
	// TODO: Implement cancel order
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Cancel order endpoint - to be implemented",
	})
}

func listInvoices(c echo.Context) error {
	var invoices []Invoice

	query := db.Model(&Invoice{}).Preload("Items")

	// Filters
	if shopID := c.QueryParam("shop_id"); shopID != "" {
		query = query.Where("shop_id = ?", shopID)
	}

	if status := c.QueryParam("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	page := 1
	limit := 20

	var total int64
	query.Count(&total)

	query.Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&invoices)

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]interface{}{
			"invoices": invoices,
			"total":    total,
			"page":     page,
			"limit":    limit,
		},
	})
}

func getInvoice(c echo.Context) error {
	id := c.Param("id")
	var invoice Invoice

	if err := db.Preload("Items").First(&invoice, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error:   "Invoice not found",
		})
	}

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    invoice,
	})
}

func updateInvoice(c echo.Context) error {
	// TODO: Implement update invoice
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Update invoice endpoint - to be implemented",
	})
}

func cancelInvoice(c echo.Context) error {
	// TODO: Implement cancel invoice
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Cancel invoice endpoint - to be implemented",
	})
}

func createReturn(c echo.Context) error {
	// TODO: Implement sales return
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Create return endpoint - to be implemented",
	})
}

func listReturns(c echo.Context) error {
	// TODO: Implement list returns
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "List returns endpoint - to be implemented",
	})
}

func listDues(c echo.Context) error {
	var invoices []Invoice

	db.Where("status IN ? AND due_amount > 0", []string{"PARTIAL", "PAID"}).
		Order("invoice_date DESC").
		Find(&invoices)

	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    invoices,
	})
}

func recordPayment(c echo.Context) error {
	// TODO: Implement payment recording
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Record payment endpoint - to be implemented",
	})
}
