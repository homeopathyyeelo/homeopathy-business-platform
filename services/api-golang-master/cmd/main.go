package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "github.com/yeelo/homeopathy-erp/docs"
	"github.com/yeelo/homeopathy-erp/internal/config"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"github.com/yeelo/homeopathy-erp/internal/middleware"
	"github.com/yeelo/homeopathy-erp/internal/services"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Init database connection
	db := database.Init(cfg.DatabaseURL)

	// Get underlying sql.DB for specific handlers
	var sqlDB *sql.DB
	if tempDB, err := db.DB(); err == nil {
		sqlDB = tempDB
	}

	// Initialize services
	bugService := services.NewBugService(db)
	expiryService := services.NewExpiryService(db)

	// Initialize handlers (only ones we actually use)
	authHandler := handlers.NewAuthHandler()
	aiModelHandler := handlers.NewAIModelHandler()
	barcodeHandler := handlers.NewBarcodeHandler(db)
	bugsHandler := handlers.NewBugHandler(bugService)
	categoriesHandler := handlers.NewCategoryHandler(db)
	customerGroupHandler := handlers.NewCustomerGroupHandler()
	dashboardHandler := handlers.NewDashboardHandler(db)
	expiryHandler := handlers.NewExpiryHandler(expiryService)
	inventoryHandler := handlers.NewInventoryHandler(db)
	enhancedInventoryHandler := handlers.NewEnhancedInventoryHandler(db)
	posSessionHandler := handlers.NewPOSSessionHandler()
	productHandler := handlers.NewProductHandler(db)
	enhancedPurchaseHandler := handlers.NewEnhancedPurchaseHandler(db)
	salesHandler := handlers.NewSalesHandler(db)
	systemHandler := handlers.NewSystemHandler()
	userHandler := handlers.NewUserHandler()
	
	// Settings handlers
	branchHandler := handlers.NewBranchHandler(db)
	taxHandler := handlers.NewTaxHandler(db)
	rbacHandler := handlers.NewRBACHandler(db)
	paymentMethodsHandler := handlers.NewPaymentMethodsHandler(db)
	gatewayHandler := handlers.NewGatewayHandler(db)
	integrationHandler := handlers.NewIntegrationHandler(db)
	aiModelsHandler := handlers.NewAIModelsHandler(db)
	backupHandler := handlers.NewBackupHandler(db)
	unitsHandler := handlers.NewUnitsHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)

	// Additional handlers
	enrichHandler := handlers.NewEnrichHandler(db)
	employeeHandler := handlers.NewEmployeeHandler(db)
	customerHandler := handlers.NewCustomerHandler(db)
	notificationHandler := handlers.NewNotificationHandler(sqlDB)
	hsnCodeHandler := handlers.NewHSNCodeHandler()
	priceListHandler := handlers.NewPriceListHandler()
	loyaltyHandler := handlers.NewLoyaltyHandler(db)
	bulkOperationsHandler := handlers.NewBulkOperationsHandler(db)
	outboxEventHandler := handlers.NewOutboxEventHandler()
	whatsappHandler := handlers.NewWhatsAppHandler(db)
	rackHandler := handlers.NewRackHandler()
	invoiceParserHandler := handlers.NewInvoiceParserHandler(db)
	financeHandler := handlers.NewFinanceHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	campaignHandler := handlers.NewCampaignHandler(db)

	// Initialize Gin with Recovery middleware
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// Authenticated Swagger docs endpoint
	r.GET("/docs/*any", middleware.RequireAuth(), ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Add custom middleware
	r.Use(middleware.RequestIDMiddleware())   // Add request ID to all requests
	r.Use(middleware.DefaultTimeout())        // Add 30s timeout to all requests

	// CORS middleware - must be before routes
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "golang-v2-complete",
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
			// auth.GET("/me", authHandler.GetMe) // TODO: Method doesn't exist yet
		}

		// System routes (v1 API)
		v1 := api.Group("/v1", middleware.RequireAuth())
		{
			system := v1.Group("/system")
			{
				system.GET("/health", systemHandler.GetSystemHealth)
				system.GET("/info", systemHandler.GetSystemInfo)
			}

			v1.POST("/enrich/invoice/:parsed_invoice_id", enrichHandler.EnrichParsedInvoice)

			customers := v1.Group("/customers")
			{
				customers.GET("", customerHandler.GetCustomers)
				customers.GET("/:id", customerHandler.GetCustomer)
				customers.POST("", customerHandler.CreateCustomer)
				customers.PUT("/:id", customerHandler.UpdateCustomer)
				customers.GET("/loyalty", customerHandler.GetLoyaltyPoints)
				customers.GET("/outstanding", customerHandler.GetOutstanding)
				customers.GET("/credit-limit", customerHandler.GetCreditLimit)
				customers.GET("/feedback", customerHandler.GetFeedback)
				customers.GET("/communication", customerHandler.GetCommunication)
				customers.GET("/appointments", customerHandler.GetAppointments)
			}
		}

		// ERP routes
		erp := api.Group("/erp", middleware.RequireAuth())
		{
			// Dashboard
			erp.GET("/dashboard/stats", dashboardHandler.GetStats)
			erp.GET("/dashboard/activity", dashboardHandler.GetActivity)
			erp.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)
			erp.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
			erp.GET("/dashboard/alerts", dashboardHandler.GetAlerts)
			erp.GET("/dashboard/revenue-chart", dashboardHandler.GetRevenueChart)
			erp.GET("/dashboard/summary", dashboardHandler.GetSummary)
			erp.GET("/notifications/recent", notificationHandler.GetRecentNotifications)
			erp.GET("/favicon.ico", func(c *gin.Context) {
				c.File("favicon.ico")
			})

			// Products
			erp.GET("/products", productHandler.GetProducts)
			erp.GET("/products/:id", productHandler.GetProduct)
			erp.POST("/products", productHandler.CreateProduct)
			erp.PUT("/products/:id", productHandler.UpdateProduct)
			erp.DELETE("/products/:id", productHandler.DeleteProduct)

			// Product Import (methods need to be implemented)
			// erp.POST("/products/import", productImportHandler.ImportProducts) 
			// erp.POST("/products/import/stream", streamingImportHandler.StreamImport)

			// Categories
			erp.GET("/categories", categoriesHandler.GetCategories)
			erp.GET("/categories/:id", categoriesHandler.GetCategory)
			erp.POST("/categories", categoriesHandler.CreateCategory)
			erp.PUT("/categories/:id", categoriesHandler.UpdateCategory)
			erp.DELETE("/categories/:id", categoriesHandler.DeleteCategory)

			// Brands
			erp.GET("/brands", productHandler.GetBrands)
			erp.POST("/brands", productHandler.CreateBrand)
			erp.PUT("/brands/:id", productHandler.UpdateBrand)
			erp.DELETE("/brands/:id", productHandler.DeleteBrand)

			// Potencies
			erp.GET("/potencies", productHandler.GetPotencies)
			erp.POST("/potencies", productHandler.CreatePotency)
			erp.PUT("/potencies/:id", productHandler.UpdatePotency)
			erp.DELETE("/potencies/:id", productHandler.DeletePotency)

			// Forms
			erp.GET("/forms", productHandler.GetForms)
			erp.POST("/forms", productHandler.CreateForm)
			erp.PUT("/forms/:id", productHandler.UpdateForm)
			erp.DELETE("/forms/:id", productHandler.DeleteForm)

			// Units
			erp.GET("/units", productHandler.GetUnits)
			erp.POST("/units", productHandler.CreateUnit)
			erp.PUT("/units/:id", productHandler.UpdateUnit)
			erp.DELETE("/units/:id", productHandler.DeleteUnit)

			// Sales Management
			erp.GET("/sales/orders", salesHandler.GetSalesOrders)
			erp.GET("/sales/orders/:id", salesHandler.GetSalesOrder)
			erp.POST("/sales/orders", salesHandler.CreateSalesOrder)
			erp.PUT("/sales/orders/:id", salesHandler.UpdateSalesOrder)
			erp.DELETE("/sales/orders/:id", salesHandler.DeleteSalesOrder)
			erp.GET("/sales/invoices", salesHandler.GetSalesInvoices)
			erp.POST("/sales/invoices", salesHandler.CreateSalesInvoice)

			// Customers
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

			// Vendors
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

			// Racks Management
			erp.GET("/racks", rackHandler.GetRacks)
			erp.GET("/racks/:id", rackHandler.GetRack)
			erp.POST("/racks", rackHandler.CreateRack)
			erp.PUT("/racks/:id", rackHandler.UpdateRack)
			erp.DELETE("/racks/:id", rackHandler.DeleteRack)

			// Sales (methods need implementation - most don't exist)
			// erp.GET("/sales/orders", salesHandler.GetSalesOrders)
			// erp.GET("/sales/orders/:id", salesHandler.GetSalesOrder)
			// etc...

			// POS System
			pos := erp.Group("/pos")
			{
				pos.GET("/sessions", posSessionHandler.GetPOSSessions)
				pos.POST("/sessions", posSessionHandler.CreatePOSSession)
				pos.PUT("/sessions/:id", posSessionHandler.UpdatePOSSession)
				pos.DELETE("/sessions/:id", posSessionHandler.DeletePOSSession)
				pos.GET("/counters", systemHandler.GetPOSCounters)
			}

			// Purchase Management
			erp.GET("/purchases/orders", enhancedPurchaseHandler.GetEnhancedPurchases)
			erp.GET("/purchases/orders/:id", enhancedPurchaseHandler.GetEnhancedPurchase)
			erp.POST("/purchases/orders", enhancedPurchaseHandler.CreateEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/approve", enhancedPurchaseHandler.ApproveEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/reject", enhancedPurchaseHandler.RejectEnhancedPurchase)
			erp.GET("/purchases/pending", enhancedPurchaseHandler.GetPendingPurchases)
			// erp.GET("/purchases/receipts", enhancedPurchaseHandler.GetPurchaseReceipts) // TODO
			// erp.POST("/purchases/receipts", enhancedPurchaseHandler.CreatePurchaseReceipt) // TODO

			// Finance & Payments (methods need implementation)
			// erp.GET("/finance/ledgers", analyticsHandler.GetFinanceLedgers) // TODO
			// erp.GET("/finance/reports", analyticsHandler.GetFinanceReports) // TODO
			erp.GET("/payments", productHandler.GetPayments)
			erp.POST("/payments", productHandler.CreatePayment)
			erp.PUT("/payments/:id", productHandler.UpdatePayment)

			// Price Management
			erp.GET("/price-lists", priceListHandler.GetPriceLists)
			erp.GET("/price-lists/:id", priceListHandler.GetPriceList)
			erp.POST("/price-lists", priceListHandler.CreatePriceList)
			erp.PUT("/price-lists/:id", priceListHandler.UpdatePriceList)
			erp.DELETE("/price-lists/:id", priceListHandler.DeletePriceList)
			erp.POST("/price-lists/:id/products", priceListHandler.AddProductToPriceList)
			erp.DELETE("/price-lists/:id/products/:productId", priceListHandler.RemoveProductFromPriceList)

			// User Management
			erp.GET("/users", userHandler.GetUsers)
			erp.GET("/users/:id", userHandler.GetUser)
			erp.POST("/users", userHandler.CreateUser)
			erp.PUT("/users/:id", userHandler.UpdateUser)
			erp.DELETE("/users/:id", userHandler.DeleteUser)
			erp.GET("/roles", userHandler.GetRoles)
			erp.POST("/roles", userHandler.CreateRole)
			erp.GET("/permissions", userHandler.GetPermissions)

			// AI & ML (most methods need implementation)
			ai := erp.Group("/ai")
			{
				ai.POST("/recommendations/products", productHandler.GetAIProductRecommendations)
				ai.GET("/recommendations/customers/:customer_id", productHandler.GetAIProductRecommendationsByCustomer)
				ai.POST("/recommendations/batch", productHandler.GetAIBatchRecommendations)
				// ai.POST("/forecast/demand", inventoryHandler.GetAIDemandForecast) // TODO
				ai.POST("/forecast/sales", salesHandler.GetAISalesForecast)
				ai.POST("/segmentation/customers", productHandler.GetAICustomerSegmentation)
				// ai.POST("/optimization/inventory", inventoryHandler.GetAIInventoryOptimization) // TODO
				// ai.GET("/optimization/alerts", inventoryHandler.GetAIInventoryAlerts) // TODO
				ai.POST("/fraud/check", productHandler.GetAIFraudDetection)
				ai.GET("/insights/business", dashboardHandler.GetAIBusinessInsights)
				ai.GET("/insights/customers", productHandler.GetAICustomerInsights)
				ai.POST("/chatbot", aiModelHandler.GetAIChatbotResponse)
				ai.GET("/models/status", aiModelHandler.GetAIModelStatus)
				ai.POST("/models/train", aiModelHandler.TrainAIModels)
				ai.POST("/data/prepare", aiModelHandler.PrepareAIData)
			}

			// Event Sourcing
			erp.GET("/outbox/events", outboxEventHandler.GetOutboxEvents)
			erp.GET("/outbox/events/:id", outboxEventHandler.GetOutboxEvent)
			erp.POST("/outbox/events/process", outboxEventHandler.ProcessOutboxEvents)
			erp.DELETE("/outbox/events/:id", outboxEventHandler.DeleteOutboxEvent)

			// System Management
			erp.GET("/system/health", systemHandler.GetSystemHealth)
			erp.GET("/system/info", systemHandler.GetSystemInfo)
			erp.GET("/bugs", bugsHandler.ListBugs)
			// erp.GET("/bugs/:id", bugsHandler.GetBugByID) // TODO
			// erp.POST("/bugs", bugsHandler.CreateBugReport) // TODO
			// erp.PUT("/bugs/:id/resolve", bugsHandler.ResolveBug) // TODO

			// Expiry Management (methods need implementation)
			// erp.GET("/inventory/expiries", expiryHandler.GetExpiries) // TODO
			erp.GET("/dashboard/expiry-summary", expiryHandler.GetExpirySummary)
			// erp.POST("/inventory/expiry-alert", expiryHandler.CreateExpiryAlert) // TODO

			// Barcode Management
			erp.GET("/products/barcode", barcodeHandler.GetBarcodes)
			erp.POST("/products/barcode/generate", barcodeHandler.GenerateBarcode)
			erp.POST("/products/barcode/print", barcodeHandler.PrintBarcodes)
			erp.PUT("/products/barcode/:id", barcodeHandler.UpdateBarcode)
			erp.DELETE("/products/barcode/:id", barcodeHandler.DeleteBarcode)
			erp.GET("/products/barcode/stats", barcodeHandler.GetBarcodeStats)

			// Loyalty Management
			erp.GET("/loyalty/points", loyaltyHandler.GetLoyaltyPoints)
			erp.GET("/loyalty/points/:customerId", loyaltyHandler.GetCustomerLoyaltyPoints)
			erp.POST("/loyalty/points/add", loyaltyHandler.AddLoyaltyPoints)
			erp.POST("/loyalty/points/redeem", loyaltyHandler.RedeemLoyaltyPoints)
			erp.GET("/loyalty/transactions", loyaltyHandler.GetLoyaltyTransactions)

			// Bulk Operations
			erp.POST("/bulk/products", bulkOperationsHandler.BulkCreateProducts)
			erp.POST("/bulk/products/update", bulkOperationsHandler.BulkUpdateProducts)
			erp.POST("/bulk/products/delete", bulkOperationsHandler.BulkDeleteProducts)
			erp.POST("/bulk/inventory/adjust", bulkOperationsHandler.BulkAdjustInventory)

			// Settings: Branches
			erp.GET("/branches", branchHandler.GetBranches)
			erp.GET("/branches/:id", branchHandler.GetBranch)
			erp.POST("/branches", branchHandler.CreateBranch)
			erp.PUT("/branches/:id", branchHandler.UpdateBranch)
			erp.DELETE("/branches/:id", branchHandler.DeleteBranch)

			// Settings: Tax
			erp.GET("/tax/slabs", taxHandler.GetTaxSlabs)
			erp.GET("/tax/slabs/:id", taxHandler.GetTaxSlab)
			erp.POST("/tax/slabs", taxHandler.CreateTaxSlab)
			erp.PUT("/tax/slabs/:id", taxHandler.UpdateTaxSlab)
			erp.DELETE("/tax/slabs/:id", taxHandler.DeleteTaxSlab)
			erp.GET("/tax/hsn-codes", taxHandler.GetHSNCodes)
			erp.GET("/tax/hsn-codes/:id", taxHandler.GetHSNCode)
			erp.POST("/tax/hsn-codes", taxHandler.CreateHSNCode)
			erp.PUT("/tax/hsn-codes/:id", taxHandler.UpdateHSNCode)
			erp.DELETE("/tax/hsn-codes/:id", taxHandler.DeleteHSNCode)

			// Settings: RBAC
			rbac := erp.Group("/rbac")
			{
				rbac.GET("/roles", rbacHandler.GetRoles)
				rbac.GET("/roles/:id", rbacHandler.GetRole)
				rbac.POST("/roles", rbacHandler.CreateRole)
				rbac.PUT("/roles/:id", rbacHandler.UpdateRole)
				rbac.DELETE("/roles/:id", rbacHandler.DeleteRole)
				rbac.PUT("/roles/:id/permissions", rbacHandler.UpdateRolePermissions)
				rbac.GET("/permissions", rbacHandler.GetPermissions)
			}

			// Settings: Payment Methods
			erp.GET("/payment-methods", paymentMethodsHandler.GetPaymentMethods)
			erp.GET("/payment-methods/:id", paymentMethodsHandler.GetPaymentMethod)
			erp.POST("/payment-methods", paymentMethodsHandler.CreatePaymentMethod)
			erp.PUT("/payment-methods/:id", paymentMethodsHandler.UpdatePaymentMethod)
			erp.DELETE("/payment-methods/:id", paymentMethodsHandler.DeletePaymentMethod)
			erp.POST("/payment-methods/test", paymentMethodsHandler.TestPaymentMethod)

			// Settings: Gateway
			erp.GET("/gateway/configs", gatewayHandler.GetGatewayConfigs)
			erp.GET("/gateway/configs/:id", gatewayHandler.GetGatewayConfig)
			erp.POST("/gateway/configs", gatewayHandler.CreateGatewayConfig)
			erp.PUT("/gateway/configs/:id", gatewayHandler.UpdateGatewayConfig)
			erp.DELETE("/gateway/configs/:id", gatewayHandler.DeleteGatewayConfig)
			erp.POST("/gateway/test/:type", gatewayHandler.TestGatewayConnection)

			// Settings: Integrations
			erp.GET("/integrations", integrationHandler.GetIntegrations)
			erp.GET("/integrations/:id", integrationHandler.GetIntegration)
			erp.POST("/integrations", integrationHandler.CreateIntegration)
			erp.PUT("/integrations/:id", integrationHandler.UpdateIntegration)
			erp.DELETE("/integrations/:id", integrationHandler.DeleteIntegration)

			// Settings: AI Models
			erp.GET("/ai-models", aiModelsHandler.GetAIModels)
			erp.GET("/ai-models/:id", aiModelsHandler.GetAIModel)
			erp.POST("/ai-models", aiModelsHandler.CreateAIModel)
			erp.PUT("/ai-models/:id", aiModelsHandler.UpdateAIModel)
			erp.DELETE("/ai-models/:id", aiModelsHandler.DeleteAIModel)
			erp.POST("/ai-models/test", aiModelsHandler.TestAIModel)

			// Settings: Backup
			erp.GET("/backups", backupHandler.GetBackups)
			erp.POST("/backups", backupHandler.CreateBackup)
			erp.POST("/backups/:id/restore", backupHandler.RestoreBackup)

			// Settings: Units
			erp.GET("/units-settings", unitsHandler.GetUnits)
			erp.GET("/units-settings/:id", unitsHandler.GetUnit)
			erp.POST("/units-settings", unitsHandler.CreateUnit)
			erp.PUT("/units-settings/:id", unitsHandler.UpdateUnit)
			erp.DELETE("/units-settings/:id", unitsHandler.DeleteUnit)

			// Settings: App Key-Value
			erp.GET("/settings", settingsHandler.GetSettings)
			erp.GET("/settings/:key", settingsHandler.GetSetting)
			erp.PUT("/settings/:key", settingsHandler.UpsertSetting)

			// Notifications
			erp.GET("/notifications", notificationHandler.GetNotifications)
			erp.GET("/notifications/:id", notificationHandler.GetNotification)
			erp.POST("/notifications", notificationHandler.CreateNotification)
			erp.PUT("/notifications/:id/read", notificationHandler.MarkAsRead)
			erp.PUT("/notifications/mark-all-read", notificationHandler.MarkAllAsRead)
			erp.DELETE("/notifications/:id", notificationHandler.DeleteNotification)
			erp.GET("/notifications/unread/count", notificationHandler.GetUnreadCount)
			erp.POST("/notifications/cleanup", notificationHandler.CleanupExpiredNotifications)

			// HR Employees
			hr := erp.Group("/hr")
			{
				hr.GET("/employees", employeeHandler.GetEmployees)
				hr.GET("/employees/:id", employeeHandler.GetEmployee)
				hr.POST("/employees", employeeHandler.CreateEmployee)
				hr.PUT("/employees/:id", employeeHandler.UpdateEmployee)
				hr.DELETE("/employees/:id", employeeHandler.DeleteEmployee)
			}
		}

		// Legacy routes
		masters := api.Group("/masters", middleware.RequireAuth())
		{
			masters.GET("/subcategories", productHandler.GetSubcategories)
			masters.GET("/categories", categoriesHandler.GetCategories)
			masters.GET("/brands", productHandler.GetBrands)
			masters.GET("/potencies", productHandler.GetPotencies)
			masters.GET("/forms", productHandler.GetForms)
			masters.GET("/units", productHandler.GetUnits)
			masters.GET("/hsn-codes", hsnCodeHandler.GetHSNCodes)
			masters.GET("/hsn-codes/:id", hsnCodeHandler.GetHSNCode)
			masters.POST("/hsn-codes", hsnCodeHandler.CreateHSNCode)
			masters.PUT("/hsn-codes/:id", hsnCodeHandler.UpdateHSNCode)
			masters.DELETE("/hsn-codes/:id", hsnCodeHandler.DeleteHSNCode)
		}

		// Products routes
		products := api.Group("/products", middleware.RequireAuth())
		{
			products.GET("/batches", inventoryHandler.GetBatches)
			products.POST("/batches", inventoryHandler.CreateBatch)
			products.PUT("/batches/:id", inventoryHandler.UpdateBatch)
			products.DELETE("/batches/:id", inventoryHandler.DeleteBatch)
		}

		// WhatsApp Integration
		whatsapp := api.Group("/whatsapp", middleware.RequireAuth())
		{
			whatsapp.POST("/send", whatsappHandler.SendMessage)
			whatsapp.GET("/templates", whatsappHandler.GetTemplates)
			whatsapp.GET("/status/:messageId", whatsappHandler.GetMessageStatus)
		}

		// Invoice Parser
		invoices := api.Group("/invoices", middleware.RequireAuth())
		{
			invoices.POST("/upload", invoiceParserHandler.UploadInvoice)
			invoices.POST("/:id/parse", invoiceParserHandler.ParseInvoice)
			invoices.POST("/:id/match", invoiceParserHandler.MatchProducts)
			invoices.POST("/:id/reconcile", invoiceParserHandler.ReconcileInvoice)
			invoices.GET("", invoiceParserHandler.GetParsedInvoices)
		}

		// Finance & Accounting
		finance := api.Group("/finance", middleware.RequireAuth())
		{
			finance.GET("/ledgers", financeHandler.GetLedgers)
			finance.POST("/ledgers", financeHandler.CreateLedger)
			finance.GET("/journal-entries", financeHandler.GetJournalEntries)
			finance.POST("/journal-entries", financeHandler.CreateJournalEntry)
			finance.GET("/gst-reports", financeHandler.GetGSTReports)
			finance.POST("/gst-reports/generate", financeHandler.GenerateGSTReport)
			finance.GET("/profit-loss", financeHandler.GetProfitLoss)
			finance.GET("/balance-sheet", financeHandler.GetBalanceSheet)
		}

		// Orders Management
		orders := api.Group("/orders", middleware.RequireAuth())
		{
			orders.GET("", orderHandler.GetOrders)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.POST("", orderHandler.CreateOrder)
			orders.PUT("/:id", orderHandler.UpdateOrder)
			orders.PUT("/:id/status", orderHandler.UpdateOrderStatus)
			orders.POST("/:id/cancel", orderHandler.CancelOrder)
		}

		// Payments Gateway
		payments := api.Group("/payments", middleware.RequireAuth())
		{
			payments.GET("", paymentHandler.GetPayments)
			payments.GET("/:id", paymentHandler.GetPayment)
			payments.POST("", paymentHandler.CreatePayment)
			payments.POST("/:id/process", paymentHandler.ProcessPayment)
			payments.POST("/:id/refund", paymentHandler.RefundPayment)
			payments.GET("/:id/transactions", paymentHandler.GetPaymentTransactions)
		}

		// Marketing Campaigns
		campaigns := api.Group("/campaigns", middleware.RequireAuth())
		{
			campaigns.GET("", campaignHandler.GetCampaigns)
			campaigns.GET("/:id", campaignHandler.GetCampaign)
			campaigns.POST("", campaignHandler.CreateCampaign)
			campaigns.PUT("/:id", campaignHandler.UpdateCampaign)
			campaigns.POST("/:id/schedule", campaignHandler.ScheduleCampaign)
			campaigns.POST("/:id/send", campaignHandler.SendCampaign)
			campaigns.GET("/:id/stats", campaignHandler.GetCampaignStats)
			campaigns.GET("/templates", campaignHandler.GetTemplates)
			campaigns.POST("/templates", campaignHandler.CreateTemplate)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
		if port == "" {
			port = "3005"
		}
	}

	log.Printf("🚀 HomeoERP API Server starting on port %s", port)
	log.Printf("📊 Total API endpoints: 80+ (150+ routes defined, 70+ need implementation)")
	log.Printf("🔗 Frontend URL: http://localhost:3000")
	log.Printf("🔗 API Base URL: http://localhost:%s/api", port)

	log.Fatal(r.Run(":" + port))
}
