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

	// Initialize ALL handlers
	authHandler := handlers.NewAuthHandler(db)
	aiModelHandler := handlers.NewAIModelHandler(db)
	analyticsHandler := handlers.NewAnalyticsHandler(db)
	barcodeHandler := handlers.NewBarcodeHandler(db)
	bugsHandler := handlers.NewBugsHandler(db)
	bulkOperationsHandler := handlers.NewBulkOperationsHandler(db)
	bundleHandler := handlers.NewBundleHandler(db)
	categoriesHandler := handlers.NewCategoryHandler(db)
	commissionHandler := handlers.NewCommissionHandler(db)
	counterSyncHandler := handlers.NewCounterSyncHandler(db)
	customerGroupHandler := handlers.NewCustomerGroupHandler(db)
	damageHandler := handlers.NewDamageHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)
	estimateHandler := handlers.NewEstimateHandler(db)
	expenseHandler := handlers.NewExpenseHandler(db)
	expiryHandler := handlers.NewExpiryHandler(db)
	giftcardHandler := handlers.NewGiftcardHandler(db)
	hsnCodeHandler := handlers.NewHSNCodeHandler(db)
	inventoryHandler := handlers.NewInventoryHandler(db)
	enhancedInventoryHandler := handlers.NewEnhancedInventoryHandler(db)
	loyaltyHandler := handlers.NewLoyaltyHandler(db)
	outboxEventHandler := handlers.NewOutboxEventHandler(db)
	paymentGatewayHandler := handlers.NewPaymentGatewayHandler(db)
	posHandler := handlers.NewPOSHandler(db)
	posSessionHandler := handlers.NewPOSSessionHandler(db)
	priceListHandler := handlers.NewPriceListHandler(db)
	productHandler := handlers.NewProductHandler(db)
	productImportHandler := handlers.NewProductImportHandler(db)
	streamingImportHandler := handlers.NewStreamingImportHandler(db)
	enhancedPurchaseHandler := handlers.NewEnhancedPurchaseHandler(db)
	purchaseIngestHandler := handlers.NewPurchaseIngestHandler(db)
	rackHandler := handlers.NewRackHandler(db)
	salesHandler := handlers.NewSalesHandler(db)
	systemHandler := handlers.NewSystemHandler()
	userHandler := handlers.NewUserHandler(db)
	whatsappHandler := handlers.NewWhatsappHandler(db)

	r := gin.Default()

	// CORS middleware - Allow frontend on port 3000
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"},
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
			"service": "golang-v2-complete",
			"timestamp": time.Now(),
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/me", authHandler.GetCurrentUser)
		}

		// ERP routes (comprehensive)
		erp := api.Group("/erp")
		{
			// Dashboard
			erp.GET("/dashboard/stats", dashboardHandler.GetStats)
			erp.GET("/dashboard/activity", dashboardHandler.GetActivity)
			erp.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)
			erp.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
			erp.GET("/dashboard/alerts", dashboardHandler.GetAlerts)
			erp.GET("/dashboard/revenue-chart", dashboardHandler.GetRevenueChart)

			// Products - Complete CRUD
			erp.GET("/products", productHandler.GetProducts)
			erp.GET("/products/:id", productHandler.GetProduct)
			erp.POST("/products", productHandler.CreateProduct)
			erp.PUT("/products/:id", productHandler.UpdateProduct)
			erp.DELETE("/products/:id", productHandler.DeleteProduct)

			// Product Import
			erp.POST("/products/import", productImportHandler.ImportProducts)
			erp.POST("/products/import/stream", streamingImportHandler.StreamImport)

			// Categories - Complete CRUD
			erp.GET("/categories", categoriesHandler.GetCategories)
			erp.GET("/categories/:id", categoriesHandler.GetCategory)
			erp.POST("/categories", categoriesHandler.CreateCategory)
			erp.PUT("/categories/:id", categoriesHandler.UpdateCategory)
			erp.DELETE("/categories/:id", categoriesHandler.DeleteCategory)

			// Brands - Complete CRUD
			erp.GET("/brands", productHandler.GetBrands)
			erp.POST("/brands", productHandler.CreateBrand)
			erp.PUT("/brands/:id", productHandler.UpdateBrand)
			erp.DELETE("/brands/:id", productHandler.DeleteBrand)

			// Potencies - Complete CRUD
			erp.GET("/potencies", productHandler.GetPotencies)
			erp.POST("/potencies", productHandler.CreatePotency)
			erp.PUT("/potencies/:id", productHandler.UpdatePotency)
			erp.DELETE("/potencies/:id", productHandler.DeletePotency)

			// Forms - Complete CRUD
			erp.GET("/forms", productHandler.GetForms)
			erp.POST("/forms", productHandler.CreateForm)
			erp.PUT("/forms/:id", productHandler.UpdateForm)
			erp.DELETE("/forms/:id", productHandler.DeleteForm)

			// Units - Complete CRUD
			erp.GET("/units", productHandler.GetUnits)
			erp.POST("/units", productHandler.CreateUnit)
			erp.PUT("/units/:id", productHandler.UpdateUnit)
			erp.DELETE("/units/:id", productHandler.DeleteUnit)

			// HSN Codes - Complete CRUD
			erp.GET("/hsn-codes", hsnCodeHandler.GetHSNCodes)
			erp.GET("/hsn-codes/:id", hsnCodeHandler.GetHSNCode)
			erp.POST("/hsn-codes", hsnCodeHandler.CreateHSNCode)
			erp.PUT("/hsn-codes/:id", hsnCodeHandler.UpdateHSNCode)
			erp.DELETE("/hsn-codes/:id", hsnCodeHandler.DeleteHSNCode)

			// Customers - Complete CRUD
			erp.GET("/customers", productHandler.GetCustomers)
			erp.GET("/customers/:id", productHandler.GetCustomer)
			erp.POST("/customers", productHandler.CreateCustomer)
			erp.PUT("/customers/:id", productHandler.UpdateCustomer)
			erp.DELETE("/customers/:id", productHandler.DeleteCustomer)

			// Customer Groups
			erp.GET("/customer-groups", customerGroupHandler.GetCustomerGroups)
			erp.GET("/customer-groups/:id", customerGroupHandler.GetCustomerGroup)
			erp.POST("/customer-groups", customerGroupHandler.CreateCustomerGroup)
			erp.PUT("/customer-groups/:id", customerGroupHandler.UpdateCustomerGroup)
			erp.DELETE("/customer-groups/:id", customerGroupHandler.DeleteCustomerGroup)

			// Vendors - Complete CRUD
			erp.GET("/vendors", productHandler.GetVendors)
			erp.GET("/vendors/:id", productHandler.GetVendor)
			erp.POST("/vendors", productHandler.CreateVendor)
			erp.PUT("/vendors/:id", productHandler.UpdateVendor)
			erp.DELETE("/vendors/:id", productHandler.DeleteVendor)

			// Inventory Management
			erp.GET("/inventory", inventoryHandler.GetInventory)
			erp.POST("/inventory/adjust", inventoryHandler.AdjustStock)
			erp.GET("/inventory/adjustments", inventoryHandler.GetAdjustments)
			erp.POST("/inventory/transfer", inventoryHandler.TransferStock)
			erp.GET("/inventory/transfers", inventoryHandler.GetTransfers)
			erp.GET("/inventory/alerts", inventoryHandler.GetAlerts)

			// Enhanced Inventory
			inventory := erp.Group("/inventory")
			{
				inventory.GET("/stock", enhancedInventoryHandler.GetEnhancedStockList)
				inventory.POST("/stock", enhancedInventoryHandler.AddManualStock)
				inventory.GET("/transactions", enhancedInventoryHandler.GetStockTransactions)
				inventory.GET("/alerts/low-stock", enhancedInventoryHandler.GetLowStockAlerts)
				inventory.GET("/alerts/expiry", enhancedInventoryHandler.GetExpiryAlerts)
				inventory.GET("/valuation", enhancedInventoryHandler.GetStockValuation)
				inventory.GET("/reports/stock", enhancedInventoryHandler.GenerateStockReport)
				inventory.PUT("/alerts/low-stock/:id/resolve", enhancedInventoryHandler.ResolveLowStockAlert)
				inventory.PUT("/alerts/expiry/:id/resolve", enhancedInventoryHandler.ResolveExpiryAlert)
			}

			// Racks (Warehouse locations)
			erp.GET("/racks", rackHandler.GetRacks)
			erp.GET("/racks/:id", rackHandler.GetRack)
			erp.POST("/racks", rackHandler.CreateRack)
			erp.PUT("/racks/:id", rackHandler.UpdateRack)
			erp.DELETE("/racks/:id", rackHandler.DeleteRack)

			// Sales Management
			erp.GET("/sales/orders", salesHandler.GetSalesOrders)
			erp.GET("/sales/orders/:id", salesHandler.GetSalesOrder)
			erp.POST("/sales/orders", salesHandler.CreateSalesOrder)
			erp.PUT("/sales/orders/:id", salesHandler.UpdateSalesOrder)
			erp.DELETE("/sales/orders/:id", salesHandler.DeleteSalesOrder)
			erp.GET("/sales/invoices", salesHandler.GetSalesInvoices)
			erp.POST("/sales/invoices", salesHandler.CreateSalesInvoice)

			// POS System
			pos := erp.Group("/pos")
			{
				pos.GET("/sessions", posSessionHandler.GetPOSSessions)
				pos.POST("/sessions", posSessionHandler.CreatePOSSession)
				pos.PUT("/sessions/:id", posSessionHandler.UpdatePOSSession)
				pos.DELETE("/sessions/:id", posSessionHandler.DeletePOSSession)
				pos.GET("/counters", systemHandler.GetPOSCounters)
				pos.POST("/billing", posHandler.CreatePOSBilling)
			}

			// Purchase Management
			erp.GET("/purchases/orders", enhancedPurchaseHandler.GetEnhancedPurchases)
			erp.GET("/purchases/orders/:id", enhancedPurchaseHandler.GetEnhancedPurchase)
			erp.POST("/purchases/orders", enhancedPurchaseHandler.CreateEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/approve", enhancedPurchaseHandler.ApproveEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/reject", enhancedPurchaseHandler.RejectEnhancedPurchase)
			erp.GET("/purchases/pending", enhancedPurchaseHandler.GetPendingPurchases)
			erp.GET("/purchases/receipts", enhancedPurchaseHandler.GetPurchaseReceipts)
			erp.POST("/purchases/receipts", enhancedPurchaseHandler.CreatePurchaseReceipt)

			// Purchase Invoice Ingestion
			erp.POST("/purchases/invoices/upload", purchaseIngestHandler.UploadInvoice)
			erp.GET("/purchases/invoices/:id/parsed", purchaseIngestHandler.GetParsedInvoice)
			erp.POST("/purchases/invoices/:id/lines/:lineId/match", purchaseIngestHandler.MatchInvoiceLine)
			erp.POST("/purchases/invoices/:id/confirm", purchaseIngestHandler.ConfirmInvoice)

			// Finance & Payments
			erp.GET("/finance/ledgers", analyticsHandler.GetFinanceLedgers)
			erp.GET("/finance/reports", analyticsHandler.GetFinanceReports)
			erp.GET("/payments", productHandler.GetPayments)
			erp.POST("/payments", productHandler.CreatePayment)
			erp.PUT("/payments/:id", productHandler.UpdatePayment)

			// Price Management
			erp.GET("/price-lists", priceListHandler.GetPriceLists)
			erp.GET("/price-lists/:id", priceListHandler.GetPriceList)
			erp.POST("/price-lists", priceListHandler.CreatePriceList)
			erp.PUT("/price-lists/:id", priceListHandler.UpdatePriceList)
			erp.DELETE("/price-lists/:id", priceListHandler.DeletePriceList)

			// User Management & RBAC
			erp.GET("/users", userHandler.GetUsers)
			erp.GET("/users/:id", userHandler.GetUser)
			erp.POST("/users", userHandler.CreateUser)
			erp.PUT("/users/:id", userHandler.UpdateUser)
			erp.DELETE("/users/:id", userHandler.DeleteUser)
			erp.GET("/roles", userHandler.GetRoles)
			erp.POST("/roles", userHandler.CreateRole)
			erp.GET("/permissions", userHandler.GetPermissions)

			// AI & ML Integration (Enhanced)
			ai := erp.Group("/ai")
			{
				// Product Recommendations
				ai.POST("/recommendations/products", productHandler.GetAIProductRecommendations)
				ai.GET("/recommendations/customers/:customer_id", productHandler.GetAIProductRecommendationsByCustomer)
				ai.POST("/recommendations/batch", productHandler.GetAIBatchRecommendations)

				// Demand Forecasting
				ai.POST("/forecast/demand", inventoryHandler.GetAIDemandForecast)
				ai.POST("/forecast/sales", salesHandler.GetAISalesForecast)

				// Customer Analytics
				ai.POST("/segmentation/customers", productHandler.GetAICustomerSegmentation)
				ai.GET("/segmentation/batch", productHandler.GetAIBatchRecommendations)

				// Inventory Optimization
				ai.POST("/optimization/inventory", inventoryHandler.GetAIInventoryOptimization)
				ai.GET("/optimization/alerts", inventoryHandler.GetAIInventoryAlerts)

				// Fraud Detection
				ai.POST("/fraud/check", productHandler.GetAIFraudDetection)

				// Business Insights
				ai.GET("/insights/business", dashboardHandler.GetAIBusinessInsights)
				ai.GET("/insights/customers", productHandler.GetAICustomerInsights)

				// Chatbot Integration
				ai.POST("/chatbot", aiModelHandler.GetAIChatbotResponse)

				// Model Management
				ai.GET("/models/status", aiModelHandler.GetAIModelStatus)
				ai.POST("/models/train", aiModelHandler.TrainAIModels)
				ai.POST("/data/prepare", aiModelHandler.PrepareAIData)
			}

			// Event Sourcing
			erp.GET("/outbox/events", outboxEventHandler.GetOutboxEvents)
			erp.POST("/outbox/events", outboxEventHandler.CreateOutboxEvent)
			erp.PUT("/outbox/events/:id/publish", outboxEventHandler.PublishEvent)
			erp.DELETE("/outbox/events/:id", outboxEventHandler.DeleteOutboxEvent)

			// System Management
			erp.GET("/system/health", systemHandler.GetSystemHealth)
			erp.GET("/system/info", systemHandler.GetSystemInfo)
			erp.GET("/bugs", bugsHandler.ListBugs)
			erp.GET("/bugs/:id", bugsHandler.GetBugByID)
			erp.POST("/bugs", bugsHandler.CreateBugReport)
			erp.PUT("/bugs/:id/resolve", bugsHandler.ResolveBug)

			// Expiry Management
			erp.GET("/inventory/expiries", expiryHandler.GetExpiries)
			erp.GET("/dashboard/expiry-summary", expiryHandler.GetExpirySummary)
			erp.POST("/inventory/expiry-alert", expiryHandler.CreateExpiryAlert)

			// Barcode Management
			erp.GET("/products/barcode", barcodeHandler.GetBarcodes)
			erp.POST("/products/barcode/generate", barcodeHandler.GenerateBarcode)
			erp.POST("/products/barcode/print", barcodeHandler.PrintBarcodes)
			erp.PUT("/products/barcode/:id", barcodeHandler.UpdateBarcode)
			erp.DELETE("/products/barcode/:id", barcodeHandler.DeleteBarcode)
			erp.GET("/products/barcode/stats", barcodeHandler.GetBarcodeStats)

			// Loyalty & CRM
			erp.GET("/loyalty/points", loyaltyHandler.GetLoyaltyPoints)
			erp.POST("/loyalty/points", loyaltyHandler.AddLoyaltyPoints)
			erp.GET("/loyalty/transactions", loyaltyHandler.GetLoyaltyTransactions)

			// Bulk Operations
			erp.POST("/bulk/products", bulkOperationsHandler.BulkCreateProducts)
			erp.PUT("/bulk/products", bulkOperationsHandler.BulkUpdateProducts)
			erp.DELETE("/bulk/products", bulkOperationsHandler.BulkDeleteProducts)
		}

		// Legacy routes for backward compatibility
		masters := api.Group("/masters")
		{
			masters.GET("/categories", categoriesHandler.GetCategories)
			masters.GET("/brands", productHandler.GetBrands)
			masters.GET("/potencies", productHandler.GetPotencies)
			masters.GET("/forms", productHandler.GetForms)
			masters.GET("/units", productHandler.GetUnits)
			masters.GET("/hsn-codes", hsnCodeHandler.GetHSNCodes)
		}

		// WhatsApp Integration
		erp.POST("/whatsapp/send", whatsappHandler.SendMessage)
		erp.GET("/whatsapp/templates", whatsappHandler.GetTemplates)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
		if port == "" {
			port = "3004" // Changed to 3004 to avoid conflict with frontend
		}
	}

	log.Printf("🚀 HomeoERP API Server starting on port %s", port)
	log.Printf("📊 Total API endpoints: %d+", 100)
	log.Printf("🔗 Frontend URL: http://localhost:3000")
	log.Printf("🔗 API Base URL: http://localhost:%s/api", port)

	log.Fatal(r.Run(":" + port))
}
