package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/config"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db := database.Init(cfg.DatabaseURL)
	defer db.Close()

	// Initialize services
	productService := services.NewProductService(db)
	inventoryService := services.NewInventoryService(db)
	salesService := services.NewSalesService(db)
	purchaseService := services.NewPurchaseService(db)
	customerService := services.NewCustomerService(db)
	vendorService := services.NewVendorService(db)
	financeService := services.NewFinanceService(db)
	hrService := services.NewHRService(db)
	aiService := services.NewAIService(cfg.AIServiceURL)

	// Initialize handlers
	productHandler := handlers.NewProductHandler(productService)
	inventoryHandler := handlers.NewInventoryHandler(inventoryService)
	salesHandler := handlers.NewSalesHandler(salesService)
	purchaseHandler := handlers.NewPurchaseHandler(purchaseService)
	customerHandler := handlers.NewCustomerHandler(customerService)
	vendorHandler := handlers.NewVendorHandler(vendorService)
	financeHandler := handlers.NewFinanceHandler(financeService)
	hrHandler := handlers.NewHRHandler(hrService)
	dashboardHandler := handlers.NewDashboardHandler(db)
	aiHandler := handlers.NewAIHandler(aiService)

	// Setup Gin router
	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "homeopathy-erp-api",
			"version": "2.1.0",
		})
	})

	// API routes
	api := r.Group("/api/erp")
	{
		// Dashboard
		api.GET("/dashboard/summary", dashboardHandler.GetSummary)
		api.GET("/dashboard/stats", dashboardHandler.GetStats)
		api.GET("/dashboard/activity", dashboardHandler.GetActivity)
		api.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
		api.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)

		// Products
		api.GET("/products", productHandler.GetProducts)
		api.GET("/products/:id", productHandler.GetProduct)
		api.POST("/products", productHandler.CreateProduct)
		api.PUT("/products/:id", productHandler.UpdateProduct)
		api.DELETE("/products/:id", productHandler.DeleteProduct)
		api.GET("/products/categories", productHandler.GetCategories)
		api.GET("/products/brands", productHandler.GetBrands)
		api.GET("/products/potencies", productHandler.GetPotencies)
		api.GET("/products/forms", productHandler.GetForms)

		// Inventory
		api.GET("/inventory", inventoryHandler.GetInventory)
		api.GET("/inventory/:id", inventoryHandler.GetInventoryItem)
		api.POST("/inventory/adjust", inventoryHandler.AdjustStock)
		api.GET("/inventory/expiry", inventoryHandler.GetExpiryAlerts)
		api.GET("/inventory/low-stock", inventoryHandler.GetLowStock)

		// Sales
		api.GET("/sales", salesHandler.GetSales)
		api.GET("/sales/:id", salesHandler.GetSale)
		api.POST("/sales", salesHandler.CreateSale)
		api.PUT("/sales/:id", salesHandler.UpdateSale)
		api.POST("/sales/return", salesHandler.ProcessReturn)

		// Purchases
		api.GET("/purchases", purchaseHandler.GetPurchases)
		api.GET("/purchases/:id", purchaseHandler.GetPurchase)
		api.POST("/purchases", purchaseHandler.CreatePurchase)
		api.PUT("/purchases/:id", purchaseHandler.UpdatePurchase)
		api.POST("/purchases/receive", purchaseHandler.ProcessReceipt)

		// Customers
		api.GET("/customers", customerHandler.GetCustomers)
		api.GET("/customers/:id", customerHandler.GetCustomer)
		api.POST("/customers", customerHandler.CreateCustomer)
		api.PUT("/customers/:id", customerHandler.UpdateCustomer)
		api.DELETE("/customers/:id", customerHandler.DeleteCustomer)

		// Vendors
		api.GET("/vendors", vendorHandler.GetVendors)
		api.GET("/vendors/:id", vendorHandler.GetVendor)
		api.POST("/vendors", vendorHandler.CreateVendor)
		api.PUT("/vendors/:id", vendorHandler.UpdateVendor)
		api.DELETE("/vendors/:id", vendorHandler.DeleteVendor)

		// Finance
		api.GET("/finance/ledger", financeHandler.GetLedger)
		api.POST("/finance/expense", financeHandler.CreateExpense)
		api.GET("/finance/reports", financeHandler.GetReports)

		// HR
		api.GET("/hr/employees", hrHandler.GetEmployees)
		api.GET("/hr/employees/:id", hrHandler.GetEmployee)
		api.POST("/hr/employees", hrHandler.CreateEmployee)
		api.PUT("/hr/employees/:id", hrHandler.UpdateEmployee)

		// AI
		api.POST("/ai/insights", aiHandler.GetInsights)
		api.POST("/ai/reorder", aiHandler.GenerateReorder)
		api.POST("/ai/pricing", aiHandler.OptimizePricing)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}

	log.Printf("HomeoERP API server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
