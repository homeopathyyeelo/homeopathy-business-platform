package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/yeelo/homeopathy-erp/internal/config"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Init database connection
	db := database.Init(cfg.DatabaseURL)

	// Initialize only the handlers we need
	productHandler := handlers.NewProductHandler(db)
	inventoryHandler := handlers.NewInventoryHandler(db)
	systemHandler := handlers.NewSystemHandler()

	// Initialize enhanced inventory handler
	enhancedInventoryHandler := handlers.NewEnhancedInventoryHandler(db)

	// Initialize enhanced purchase handler
	enhancedPurchaseHandler := handlers.NewEnhancedPurchaseHandler(db)

	// Initialize barcode handler
	barcodeHandler := handlers.NewBarcodeHandler(db)

	r := gin.Default()

	// CORS middleware - Allow frontend on port 3000
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "golang-v2",
		})
	})

	// System routes (v1 API)
	v1 := r.Group("/api/v1")
	{
		system := v1.Group("/system")
		{
			system.GET("/health", systemHandler.GetSystemHealth)
			system.GET("/info", systemHandler.GetSystemInfo)
		}
	}

	// ERP routes (shared prefix)
	erp := r.Group("/api/erp")
	{
		// Product routes
		erp.GET("/products", productHandler.GetProducts)
		erp.GET("/products/:id", productHandler.GetProduct)
		erp.POST("/products", productHandler.CreateProduct)
		erp.PUT("/products/:id", productHandler.UpdateProduct)
		erp.DELETE("/products/:id", productHandler.DeleteProduct)

		// Categories CRUD
		erp.GET("/categories", productHandler.GetCategories)
		erp.GET("/categories/:id", productHandler.GetCategory)
		erp.POST("/categories", productHandler.CreateCategory)
		erp.PUT("/categories/:id", productHandler.UpdateCategory)
		erp.DELETE("/categories/:id", productHandler.DeleteCategory)

		// Brands CRUD
		erp.GET("/brands", productHandler.GetBrands)
		erp.POST("/brands", productHandler.CreateBrand)
		erp.PUT("/brands/:id", productHandler.UpdateBrand)
		erp.DELETE("/brands/:id", productHandler.DeleteBrand)

		erp.GET("/potencies", productHandler.GetPotencies)
		erp.POST("/potencies", productHandler.CreatePotency)
		erp.PUT("/potencies/:id", productHandler.UpdatePotency)
		erp.DELETE("/potencies/:id", productHandler.DeletePotency)

		erp.GET("/forms", productHandler.GetForms)
		erp.POST("/forms", productHandler.CreateForm)
		erp.PUT("/forms/:id", productHandler.UpdateForm)
		erp.DELETE("/forms/:id", productHandler.DeleteForm)

		erp.GET("/units", productHandler.GetUnits)
		erp.POST("/units", productHandler.CreateUnit)
		erp.PUT("/units/:id", productHandler.UpdateUnit)
		erp.DELETE("/units/:id", productHandler.DeleteUnit)

		erp.GET("/hsn-codes", productHandler.GetHSNCodes)
		erp.POST("/hsn-codes", productHandler.CreateHSNCode)
		erp.PUT("/hsn-codes/:id", productHandler.UpdateHSNCode)
		erp.DELETE("/hsn-codes/:id", productHandler.DeleteHSNCode)

		// Inventory routes
		erp.GET("/warehouses", inventoryHandler.GetWarehouses)
		erp.POST("/warehouses", inventoryHandler.CreateWarehouse)
		erp.PUT("/warehouses/:id", inventoryHandler.UpdateWarehouse)
		erp.DELETE("/warehouses/:id", inventoryHandler.DeleteWarehouse)

		// Enhanced Inventory routes
		inventory := erp.Group("/inventory")
		{
			inventory.GET("/stock", enhancedInventoryHandler.GetEnhancedStockList)
			inventory.POST("/stock", enhancedInventoryHandler.AddManualStock)
			inventory.GET("/transactions", enhancedInventoryHandler.GetStockTransactions)
			inventory.GET("/alerts/low-stock", enhancedInventoryHandler.GetLowStockAlerts)
			inventory.GET("/alerts/expiry", enhancedInventoryHandler.GetExpiryAlerts)
			inventory.GET("/valuation", enhancedInventoryHandler.GetStockValuation)
			inventory.GET("/reports/stock", enhancedInventoryHandler.GenerateStockReport)

			// Alert resolution
			inventory.PUT("/alerts/low-stock/:id/resolve", enhancedInventoryHandler.ResolveLowStockAlert)
			inventory.PUT("/alerts/expiry/:id/resolve", enhancedInventoryHandler.ResolveExpiryAlert)
		}
		purchases := erp.Group("/purchases")
		{
			purchases.GET("", enhancedPurchaseHandler.GetEnhancedPurchases)
			purchases.GET("/:id", enhancedPurchaseHandler.GetEnhancedPurchase)
			purchases.POST("", enhancedPurchaseHandler.CreateEnhancedPurchase)
			purchases.PUT("/:id/approve", enhancedPurchaseHandler.ApproveEnhancedPurchase)
			purchases.PUT("/:id/reject", enhancedPurchaseHandler.RejectEnhancedPurchase)
			purchases.GET("/pending", enhancedPurchaseHandler.GetPendingPurchases)

			// Purchase items management
			purchases.GET("/:id/items", enhancedPurchaseHandler.GetPurchaseItems)
			purchases.POST("/:id/items", enhancedPurchaseHandler.AddPurchaseItem)
			purchases.PUT("/:id/items/:itemId", enhancedPurchaseHandler.UpdatePurchaseItem)
			purchases.DELETE("/:id/items/:itemId", enhancedPurchaseHandler.DeletePurchaseItem)
		}

		// Barcode routes
		erp.GET("/products/barcode", productHandler.GetBarcodes)
		erp.POST("/products/barcode/generate", productHandler.GenerateBarcode)
		erp.POST("/products/barcode/print", productHandler.PrintBarcodes)

		// POS routes
		pos := erp.Group("/pos")
		{
			pos.GET("/counters", systemHandler.GetPOSCounters)
		}

		// Barcode routes
		erp.GET("/products/barcode", barcodeHandler.GetBarcodes)
		erp.POST("/products/barcode/generate", barcodeHandler.GenerateBarcode)
		erp.POST("/products/barcode/print", barcodeHandler.PrintBarcodes)
		erp.PUT("/products/barcode/:id", barcodeHandler.UpdateBarcode)
		erp.DELETE("/products/barcode/:id", barcodeHandler.DeleteBarcode)
		erp.GET("/products/barcode/stats", barcodeHandler.GetBarcodeStats)
	}

	// Masters routes (for frontend compatibility)
	masters := r.Group("/api/masters")
	{
		masters.GET("/subcategories", productHandler.GetSubcategories)
		masters.GET("/categories", productHandler.GetCategories)
		masters.GET("/brands", productHandler.GetBrands)
		masters.GET("/potencies", productHandler.GetPotencies)
		masters.GET("/forms", productHandler.GetForms)
		masters.GET("/units", productHandler.GetUnits)
	}

	// Products routes (for frontend compatibility)
	products := r.Group("/api/products")
	{
		products.GET("/batches", inventoryHandler.GetBatches)
		products.POST("/batches", inventoryHandler.CreateBatch)
		products.PUT("/batches/:id", inventoryHandler.UpdateBatch)
		products.DELETE("/batches/:id", inventoryHandler.DeleteBatch)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
		if port == "" {
			port = "3005" // Changed to 3005 to match frontend expectations
		}
	}

	log.Printf("🚀 HomeoERP API Server starting on port %s", port)
	log.Printf("📊 Total API endpoints: %d+", 100)
	log.Printf("🔗 Frontend URL: http://localhost:3000")
	log.Printf("🔗 API Base URL: http://localhost:%s/api", port)

	log.Fatal(r.Run(":" + port))
}
