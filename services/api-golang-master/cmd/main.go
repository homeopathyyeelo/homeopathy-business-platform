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
	"github.com/yeelo/homeopathy-erp/internal/routes"
	"github.com/yeelo/homeopathy-erp/internal/services"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// maskAPIKey masks sensitive API keys for logging
func maskAPIKey(key string) string {
	if key == "" {
		return "[NOT SET]"
	}
	if len(key) < 10 {
		return "[INVALID]"
	}
	return key[:7] + "..." + key[len(key)-4:]
}

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

	// Initialize config service for centralized configuration
	configService := services.GetConfigService(db)
	openaiAPIKey := configService.GetOpenAIAPIKey()
	log.Printf("🔑 OpenAI API Key loaded: %s", maskAPIKey(openaiAPIKey))

	// Initialize job service for background tasks (5 workers)
	jobService := services.NewJobService(db, 5)
	backupService := services.NewBackupService(db)

	// Register job handlers
	services.RegisterBackupJobHandler(jobService, backupService)

	// Start job service workers
	jobService.Start()
	log.Printf("✅ Background job service started with 5 workers")

	// Initialize handlers (only ones we actually use)
	authHandler := handlers.NewAuthHandler(db)
	aiModelHandler := handlers.NewAIModelHandler()
	// barcodeHandler := handlers.NewBarcodeHandler(db) // Moved to POS routes
	bugsHandler := handlers.NewBugHandler(bugService)
	categoriesHandler := handlers.NewCategoryHandler(db)
	customerGroupHandler := handlers.NewCustomerGroupHandler()
	dashboardHandler := handlers.NewDashboardHandler(db)
	dashboardActivityHandler := handlers.NewDashboardActivityHandler(db)
	_ = expiryService // TODO: Use when inventory module is ready
	// expiryHandler := handlers.NewExpiryHandler(expiryService)
	inventoryHandler := handlers.NewInventoryHandler(db)
	enhancedInventoryHandler := handlers.NewEnhancedInventoryHandler(db)
	inventoryAlertsHandler := handlers.NewInventoryAlertsHandler(db)
	posSessionHandler := handlers.NewPOSSessionHandler()
	holdBillHandler := handlers.NewHoldBillHandler(db)
	aiPOSHandler := handlers.NewAIPOSHandler(db, openaiAPIKey)
	searchHandler := handlers.NewSearchHandler(db)
	productHandler := handlers.NewProductHandler(db)
	productStatsHandler := handlers.NewProductStatsHandler(db)
	quickActionsHandler := handlers.NewQuickActionsHandler(db)
	batchBarcodeHandler := handlers.NewBatchBarcodeHandler(db)
	// barcodeLabelHandler := handlers.NewBarcodeLabelHandler(db) // Moved to POS routes
	enhancedPurchaseHandler := handlers.NewEnhancedPurchaseHandler(db)
	salesHandler := handlers.NewSalesHandler(db)
	systemHandler := handlers.NewSystemHandler()
	userHandler := handlers.NewUserHandler()

	// Initialize Marketing AI Service
	marketingAIService := services.NewMarketingAIService(os.Getenv("AI_MODEL_URL"), "mistral")

	socialHandler := handlers.NewSocialHandler(db, marketingAIService)
	aiRecommendationHandler := handlers.NewAIRecommendationHandler(db)

	// Settings handlers
	branchHandler := handlers.NewBranchHandler(db)
	taxHandler := handlers.NewTaxHandler(db)
	rbacHandler := handlers.NewRBACHandler(db)
	paymentMethodsHandler := handlers.NewPaymentMethodsHandler(db)
	gatewayHandler := handlers.NewGatewayHandler(db)
	integrationHandler := handlers.NewIntegrationHandler(db)
	aiModelsHandler := handlers.NewAIModelsHandler(db)
	backupHandler := handlers.NewBackupHandler(db, jobService)
	jobHandler := handlers.NewJobHandler(jobService)
	unitsHandler := handlers.NewUnitsHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)
	erpSettingsHandler := handlers.NewERPSettingsHandler(db)
	companySettingsHandler := handlers.NewCompanySettingsHandler(db)
	appSettingsHandler := handlers.NewAppSettingsHandler(db)

	// Additional handlers
	enrichHandler := handlers.NewEnrichHandler(db)
	employeeHandler := handlers.NewEmployeeHandler(db)
	customerHandler := handlers.NewCustomerHandler(db)
	customerAnalyticsHandler := handlers.NewCustomerAnalyticsHandler(db)
	notificationHandler := handlers.NewNotificationHandler(sqlDB)
	hsnCodeHandler := handlers.NewHSNCodeHandler()
	priceListHandler := handlers.NewPriceListHandler()
	loyaltyHandler := handlers.NewLoyaltyHandler(db)
	bulkOperationsHandler := handlers.NewBulkOperationsHandler(db)
	outboxEventHandler := handlers.NewOutboxEventHandler()
	whatsappHandler := handlers.NewWhatsAppHandler(db, marketingAIService)
	rackHandler := handlers.NewRackHandler()
	invoiceParserHandler := handlers.NewInvoiceParserHandler(db)
	financeHandler := handlers.NewFinanceHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	campaignHandler := handlers.NewCampaignHandler(db)

	groupedProductsHandler := handlers.NewGroupedProductsHandler(db)
	productImportHandler := handlers.NewProductImportHandler(db)
	productImportStreamingHandler := handlers.NewStreamingImportHandler(db)
	uploadsHandler := handlers.NewUploadsHandler(db)
	enhancedUploadsHandler := handlers.NewEnhancedUploadsHandler(db)
	purchaseUploadHandler := handlers.NewPurchaseUploadHandler(db)
	// Initialize services
	gmbService := services.NewGMBService(db)
	auditService := services.NewAuditService(db)

	// Initialize handlers
	gmbHandler := handlers.NewGMBHandler(db, gmbService, auditService)
	approveUploadHandler := handlers.NewApproveUploadHandler(db)
	inventoryUploadHandler := handlers.NewInventoryUploadHandler(db)
	marketingHandler := handlers.NewMarketingHandler(db)
	returnsHandler := handlers.NewReturnsHandler(db)
	gmbContentService := services.NewGMBContentService(os.Getenv("OPENAI_API_KEY"))
	gmbContentHandler := handlers.NewGMBContentHandler(db, gmbContentService)
	gmbSchedulerService := services.NewGMBSchedulerService(db, gmbService)
	gmbSchedulerHandler := handlers.NewGMBSchedulerHandler(db)
	gmbAnalyticsHandler := handlers.NewGMBAnalyticsHandler(db)
	auditHandler := handlers.NewAuditHandler(db)

	// AI Analytics
	aiAnalyticsService := services.NewAIAnalyticsService(db, os.Getenv("OPENAI_API_KEY"))
	aiInsightsHandler := handlers.NewAIInsightsHandler(db, aiAnalyticsService)

	// Start the scheduler
	gmbSchedulerService.Start()
	gmbSchedulerService.StartReCategorizationCron(services.NewGMBAIService(os.Getenv("OPENAI_API_KEY")))

	// Initialize Gin with Recovery middleware
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// Authenticated Swagger docs endpoint
	r.GET("/docs/*any", middleware.RequireAuth(), ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Add custom middleware
	r.Use(middleware.RequestIDMiddleware()) // Add request ID to all requests
	r.Use(middleware.DefaultTimeout())      // Add 30s timeout to all requests

	// CORS middleware - must be before routes
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:38477"},
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
		// Dashboard Activity Feed (Direct Route)
		api.GET("/dashboard/activity-feed", middleware.RequireAuth(), dashboardActivityHandler.GetActivityFeed)

		// Social / GMB Automation
		social := api.Group("/social")
		social.Use(middleware.RequireAuth())
		{
			// FB/Insta Routes
			social.GET("/accounts", socialHandler.GetAccounts)
			social.POST("/accounts/connect", socialHandler.ConnectAccount)
			social.GET("/posts", socialHandler.GetPosts)
			social.POST("/posts", socialHandler.CreatePost)
			social.POST("/post", socialHandler.MultiPost)               // Unified posting
			social.POST("/ai-content", socialHandler.GenerateAIContent) // AI Content
			social.GET("/analytics", socialHandler.GetAnalytics)

			// GMB OAuth routes
			social.GET("/gmb/oauth/initiate", gmbHandler.InitiateOAuth)  // This should exist
			social.POST("/gmb/oauth/initiate", gmbHandler.InitiateOAuth) // This should also exist
			social.GET("/gmb/oauth/callback", gmbHandler.OAuthCallback)

			social.POST("/gmb/oauth/disconnect", gmbHandler.DisconnectAccount)
			social.POST("/gmb/oauth/refresh", gmbHandler.RefreshToken)

			social.GET("/gmb/account", gmbHandler.GetAccount)
			social.GET("/gmb/trends", gmbHandler.GetTrends)
			social.GET("/gmb/history", gmbHandler.GetHistory)

			social.GET("/gmb/schedules", gmbHandler.GetSchedules)
			social.POST("/gmb/schedules", gmbHandler.UpdateSchedules)

			social.POST("/gmb/generate", gmbHandler.GeneratePost)
			social.POST("/gmb/validate", gmbHandler.ValidatePost)
			social.POST("/gmb/post", gmbHandler.PostToGMB)
			social.POST("/gmb/quick-post", gmbHandler.QuickPostToGMB) // Quick instant post
			social.POST("/gmb/automate", gmbHandler.AutomatePost)     // Browser automation trigger

			// NEW: Paginated publishing history
			social.GET("/gmb/posts", gmbHandler.GetPostsHistory)            // Get paginated posts
			social.POST("/gmb/posts/:id/retry", gmbHandler.RetryFailedPost) // Retry failed post

			// AI Content Generation
			social.POST("/gmb/generate/topic", gmbContentHandler.GenerateByTopic)
			social.POST("/gmb/generate/season", gmbContentHandler.GenerateBySeason)
			social.POST("/gmb/generate/disease", gmbContentHandler.GenerateByDisease)

			// Scheduling
			social.POST("/gmb/schedule", gmbSchedulerHandler.CreateScheduledPost)
			social.GET("/gmb/schedule", gmbSchedulerHandler.GetScheduledPosts)
			social.PUT("/gmb/schedule/:id", gmbSchedulerHandler.UpdateScheduledPost)
			social.DELETE("/gmb/schedule/:id", gmbSchedulerHandler.DeleteScheduledPost)

			// Account Management
			social.GET("/gmb/accounts", gmbHandler.GetAccounts)
			social.DELETE("/gmb/accounts/:id", gmbHandler.DisconnectAccountByID)

			// Sync posts from GMB
			social.POST("/gmb/sync", gmbHandler.SyncGMBPosts)

			social.GET("/gmb/suggestions", gmbHandler.GetSuggestions)

			// Audit Logs
			social.GET("/gmb/audit", auditHandler.GetAuditLogs)

			// Analytics & AI
			social.GET("/gmb/analytics", gmbAnalyticsHandler.GetAnalytics)
			social.POST("/gmb/ai/categorize", gmbAnalyticsHandler.BatchCategorize)
		}

		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/me", authHandler.Me)                   // Get current user info
			auth.POST("/validate", authHandler.ValidateToken) // Validate token
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

			// AI Recommendations
			ai := v1.Group("/ai")
			{
				ai.GET("/recommendations", aiRecommendationHandler.GetProductRecommendations)
			}

			customers := v1.Group("/customers")
			{
				customers.GET("", customerHandler.GetCustomers)
				customers.GET("/:id", customerHandler.GetCustomer)
				customers.POST("", customerHandler.CreateCustomer)
				customers.PUT("/:id", customerHandler.UpdateCustomer)

				// Analytics & Insights
				customers.GET("/:id/profile", customerAnalyticsHandler.GetCustomerProfile)
				customers.GET("/:id/bills", customerAnalyticsHandler.GetCustomerBills)
				customers.GET("/:id/products", customerAnalyticsHandler.GetCustomerProducts)
				customers.GET("/outstanding", customerAnalyticsHandler.GetOutstandingCustomers)
				customers.POST("/:id/loyalty/add", customerAnalyticsHandler.AddLoyaltyPoints)
				customers.GET("/analytics/summary", customerAnalyticsHandler.GetCustomerAnalyticsSummary)

				// Legacy routes
				customers.GET("/loyalty", customerHandler.GetLoyaltyPoints)
				customers.GET("/credit-limit", customerHandler.GetCreditLimit)
				customers.GET("/feedback", customerHandler.GetFeedback)
				customers.GET("/communication", customerHandler.GetCommunication)
				customers.GET("/appointments", customerHandler.GetAppointments)
			}
		}

		// ERP routes (public access for POS)
		erp_public := api.Group("/erp")
		{
			// Register POS routes (no auth required for POS operations)
			routes.RegisterPOSRoutes(erp_public, db)

			// Public ERP Settings (read-only)
			erp_public.GET("/erp-settings", erpSettingsHandler.GetSettings)
			erp_public.GET("/erp-settings/categories", erpSettingsHandler.GetCategories)
			erp_public.GET("/erp-settings/:key", erpSettingsHandler.GetSetting)
		}

		// ERP routes (protected)
		erp := api.Group("/erp", middleware.RequireAuth())
		{

			// Dashboard
			erp.GET("/dashboard/stats", dashboardHandler.GetStats)
			erp.GET("/dashboard/activity", dashboardHandler.GetActivity)
			erp.GET("/dashboard/activity-feed", dashboardActivityHandler.GetActivityFeed) // Activity feed route
			erp.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)
			erp.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
			erp.GET("/dashboard/alerts", dashboardHandler.GetAlerts)
			erp.GET("/dashboard/revenue-chart", dashboardHandler.GetRevenueChart)
			erp.GET("/dashboard/category-stats", dashboardHandler.GetCategoryStats)
			erp.GET("/dashboard/summary", dashboardHandler.GetSummary)
			erp.GET("/dashboard/expiry-summary", dashboardHandler.GetExpirySummary)
			erp.GET("/dashboard/quick-actions", quickActionsHandler.GetQuickActions) // Smart insights quick actions

			// AI Insights Routes
			erp.GET("/ai/insights", aiInsightsHandler.GetInsights)
			erp.GET("/ai/anomalies", aiInsightsHandler.GetAnomalies)
			erp.GET("/ai/predictions", aiInsightsHandler.GetPredictions)
			erp.GET("/ai/nl-insights", aiInsightsHandler.GetNLInsights)
			erp.GET("/ai/priorities", aiInsightsHandler.GetPriorities)

			erp.GET("/notifications/recent", notificationHandler.GetRecentNotifications)
			erp.GET("/favicon.ico", func(c *gin.Context) {
				c.File("favicon.ico")
			})

			// Register Ledger Routes
			routes.RegisterLedgerRoutes(erp, db)

			// Products - order matters! Specific routes MUST be before /:id
			erp.GET("/products/stats", productStatsHandler.GetProductStats)                          // Stats - before /:id
			erp.GET("/products/template", productImportHandler.DownloadTemplate)                     // Template download - before /:id
			erp.GET("/products/batches", batchBarcodeHandler.GetAllBatches)                          // List all batches - before /:id
			erp.GET("/products/grouped", groupedProductsHandler.GetGroupedProducts)                  // Grouped view - before /:id
			erp.GET("/products/grouped/:baseName/variants", groupedProductsHandler.GetGroupVariants) // Variants for group

			// Generic products routes
			erp.GET("/products", productHandler.GetProducts)
			erp.GET("/products/:id", productHandler.GetProduct)
			erp.POST("/products", productHandler.CreateProduct)
			erp.PUT("/products/:id", productHandler.UpdateProduct)
			erp.DELETE("/products/:id", productHandler.DeleteProduct)

			// Product Import (no timeout for streaming)
			erp.POST("/products/import/stream", func(c *gin.Context) {
				// Remove timeout for streaming import
				c.Set("no_timeout", true)
				productImportStreamingHandler.StreamingImport(c)
			})

			// Batch Management
			erp.GET("/products/:id/batches", batchBarcodeHandler.GetBatchesByProduct) // Get batches for specific product
			erp.POST("/inventory/batches", batchBarcodeHandler.CreateBatch)
			erp.POST("/inventory/batches/allocate", batchBarcodeHandler.AllocateBatch)
			erp.GET("/inventory/batches/expiring", batchBarcodeHandler.GetExpiringBatches)

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
				inventory.GET("/stock", inventoryAlertsHandler.GetStockSummary)
				inventory.POST("/stock", enhancedInventoryHandler.AddManualStock)
				inventory.GET("/transactions", enhancedInventoryHandler.GetStockTransactions)
				inventory.GET("/alerts/low-stock", inventoryAlertsHandler.GetLowStockAlerts)
				inventory.GET("/alerts/expiry", inventoryAlertsHandler.GetExpiryAlerts)
				inventory.GET("/valuation", enhancedInventoryHandler.GetStockValuation)
				inventory.GET("/reports/stock", enhancedInventoryHandler.GenerateStockReport)
				inventory.PUT("/alerts/low-stock/:id/resolve", enhancedInventoryHandler.ResolveLowStockAlert)
				inventory.PUT("/alerts/expiry/:id/resolve", enhancedInventoryHandler.ResolveExpiryAlert)
			}

			// Global Search
			erp.GET("/search", searchHandler.GlobalSearch)
			erp.GET("/search/products", searchHandler.SearchProducts)

			// Racks Management
			erp.GET("/racks", rackHandler.GetRacks)
			erp.GET("/racks/:id", rackHandler.GetRack)
			erp.POST("/racks", rackHandler.CreateRack)
			erp.PUT("/racks/:id", rackHandler.UpdateRack)
			erp.DELETE("/racks/:id", rackHandler.DeleteRack)

			// Sales Returns
			sales := erp.Group("/sales")
			{
				sales.GET("/returns", returnsHandler.GetReturns)
				sales.POST("/returns", returnsHandler.CreateReturn)
				sales.GET("/returns/stats", returnsHandler.GetStats)
				sales.GET("/returns/fraud-alerts", returnsHandler.GetFraudAlerts)
				sales.GET("/returns/:id", returnsHandler.GetReturnByID)
				sales.POST("/returns/:id/approve", returnsHandler.ApproveReturn)
				sales.POST("/returns/:id/process-refund", returnsHandler.ProcessRefund)
				sales.GET("/invoices/:invoiceNo/eligible-for-return", returnsHandler.CheckEligibility)
			}
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

				// Hold Bills
				pos.POST("/hold-bill", holdBillHandler.HoldBill)
				pos.GET("/hold-bills", holdBillHandler.GetHoldBills)
				pos.GET("/hold-bills/stats", holdBillHandler.GetHoldBillStats)
				pos.GET("/hold-bills/:id", holdBillHandler.GetHoldBill)
				pos.DELETE("/hold-bills/:id", holdBillHandler.DeleteHoldBill)

				// AI Smart Suggestions
				pos.POST("/ai-suggestions", aiPOSHandler.GetAISuggestions)
				pos.POST("/disease-suggestions", aiPOSHandler.GetDiseaseSuggestions)
			}

			// Purchase Management
			erp.GET("/purchases/orders", enhancedPurchaseHandler.GetEnhancedPurchases)
			erp.GET("/purchases/orders/:id", enhancedPurchaseHandler.GetEnhancedPurchase)
			erp.POST("/purchases/orders", enhancedPurchaseHandler.CreateEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/approve", enhancedPurchaseHandler.ApproveEnhancedPurchase)
			erp.PUT("/purchases/orders/:id/reject", enhancedPurchaseHandler.RejectEnhancedPurchase)
			erp.GET("/purchases/pending", enhancedPurchaseHandler.GetPendingPurchases)

			// Purchase Bills
			billsHandler := handlers.NewPurchaseBillsHandler(db)
			erp.GET("/purchases/bills", billsHandler.GetBills)
			erp.GET("/purchases/bills/:id", billsHandler.GetBill)
			erp.POST("/purchases/bills", billsHandler.CreateBill)
			erp.PUT("/purchases/bills/:id/pay", billsHandler.MarkAsPaid)
			erp.DELETE("/purchases/bills/:id", billsHandler.DeleteBill)
			erp.GET("/purchases/bills/stats", billsHandler.GetBillStats)

			// Purchase Payments
			paymentsHandler := handlers.NewPurchasePaymentsHandler(db)
			erp.GET("/purchases/payments", paymentsHandler.GetPayments)
			erp.POST("/purchases/payments", paymentsHandler.CreatePayment)
			erp.GET("/purchases/payments/due", paymentsHandler.GetDuePayments)
			erp.POST("/purchases/payments/:id/void", paymentsHandler.VoidPayment)
			erp.GET("/purchases/payments/stats", paymentsHandler.GetPaymentStats)

			// Purchase Returns
			returnsHandler := handlers.NewPurchaseReturnsHandler(db)
			erp.GET("/purchases/returns", returnsHandler.GetReturns)
			erp.POST("/purchases/returns", returnsHandler.CreateReturn)
			erp.PUT("/purchases/returns/:id/approve", returnsHandler.ApproveReturn)
			erp.POST("/purchases/returns/:id/refund", returnsHandler.ProcessRefund)
			erp.GET("/purchases/returns/stats", returnsHandler.GetReturnStats)

			// Purchase GRN
			grnHandler := handlers.NewPurchaseGRNHandler(db)
			erp.GET("/purchases/grn", grnHandler.GetGRNs)
			erp.GET("/purchases/grn/:id", grnHandler.GetGRN)
			erp.POST("/purchases/grn", grnHandler.CreateGRN)
			erp.PUT("/purchases/grn/:id/approve", grnHandler.ApproveGRN)
			erp.POST("/purchases/grn/:id/qc", grnHandler.UpdateQCStatus)
			erp.GET("/purchases/grn/stats", grnHandler.GetGRNStats)

			// AI Reorder
			aiReorderHandler := handlers.NewAIReorderHandler(db)
			erp.GET("/purchases/ai-reorder/suggestions", aiReorderHandler.GetSuggestions)
			erp.POST("/purchases/ai-reorder/generate", aiReorderHandler.GeneratePO)
			erp.GET("/purchases/ai-reorder/stats", aiReorderHandler.GetStats)

			// Finance & Payments (methods need implementation)
			// erp.GET("/finance/ledgers", analyticsHandler.GetFinanceLedgers) // TODO
			// erp.GET("/finance/reports", analyticsHandler.GetFinanceReports) // TODO
			erp.GET("/payments", productHandler.GetPayments)
			erp.POST("/payments", productHandler.CreatePayment)
			erp.PUT("/payments/:id", productHandler.UpdatePayment)

			// AI Sales Forecasting
			aiSalesHandler := handlers.NewAISalesHandler(db)
			erp.POST("/ai/sales/forecast", aiSalesHandler.GetForecast)

			// AI Finance
			aiFinanceHandler := handlers.NewAIFinanceHandler(db)
			erp.POST("/ai/finance/categorize", aiFinanceHandler.CategorizeExpense)

			// AI Marketing
			aiEmailHandler := handlers.NewAIEmailHandler(db)
			erp.POST("/ai/marketing/email-generate", aiEmailHandler.GenerateEmail)

			// AI Inventory
			aiInventoryHandler := handlers.NewAIInventoryHandler(db)
			erp.GET("/ai/inventory/demand-forecast", aiInventoryHandler.GetDemandForecast)

			// AI CRM
			aiCRMHandler := handlers.NewAICRMHandler(db)
			erp.POST("/ai/crm/clv-predict", aiCRMHandler.PredictCLV)
			erp.POST("/ai/crm/sentiment-analyze", aiCRMHandler.AnalyzeSentiment)

			// AI HR
			aiHRHandler := handlers.NewAIHRHandler(db)
			erp.POST("/ai/hr/attrition-predict", aiHRHandler.PredictAttrition)
			erp.POST("/ai/hr/resume-screen", aiHRHandler.ScreenResume)

			// AI Manufacturing
			aiManufacturingHandler := handlers.NewAIManufacturingHandler(db)
			erp.POST("/ai/manufacturing/optimize", aiManufacturingHandler.OptimizeProduction)

			// Price Management
			erp.GET("/price-lists", priceListHandler.GetPriceLists)
			erp.GET("/price-lists/:id", priceListHandler.GetPriceList)
			erp.POST("/price-lists", priceListHandler.CreatePriceList)
			erp.PUT("/price-lists/:id", priceListHandler.UpdatePriceList)
			erp.DELETE("/price-lists/:id", priceListHandler.DeletePriceList)
			erp.POST("/price-lists/:id/products", priceListHandler.AddProductToPriceList)
			erp.DELETE("/price-lists/:id/products/:productId", priceListHandler.RemoveProductFromPriceList)

			// User Management
			erp.GET("/users/me", userHandler.GetMe) // Get current authenticated user (must be before /:id)
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
				ai.POST("/fraud/check", productHandler.AIFraudDetection)
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
			// erp.GET("/inventory/expiry-summary", expiryHandler.GetExpirySummary)  // TODO: Requires shop_id
			// erp.POST("/inventory/expiry-alert", expiryHandler.CreateExpiryAlert) // TODO

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
			erp.GET("/backups/list", backupHandler.ListBackups)
			erp.GET("/backups/config", backupHandler.GetBackupConfig)
			erp.PUT("/backups/config", backupHandler.SaveBackupConfig)
			erp.GET("/backups/status", backupHandler.GetBackupStatus)
			erp.POST("/backups/create", backupHandler.CreateBackup)
			erp.GET("/backups/:filename/download", backupHandler.DownloadBackup)
			erp.DELETE("/backups/:filename", backupHandler.DeleteBackup)
			erp.POST("/backups/:id/restore", backupHandler.RestoreBackup)
			erp.POST("/settings/database/test", backupHandler.TestDatabaseConnection)

			// Background Jobs
			erp.GET("/jobs", jobHandler.ListJobs)
			erp.GET("/jobs/stats", jobHandler.GetJobStats)
			erp.GET("/jobs/:id", jobHandler.GetJob)
			erp.GET("/jobs/:id/status", jobHandler.GetJobStatus)
			erp.GET("/jobs/notifications", jobHandler.GetNotifications)
			erp.POST("/jobs/notifications/:id/read", jobHandler.MarkNotificationRead)

			// Settings: Units
			erp.GET("/units-settings", unitsHandler.GetUnits)
			erp.GET("/units-settings/:id", unitsHandler.GetUnit)
			erp.POST("/units-settings", unitsHandler.CreateUnit)
			erp.PUT("/units-settings/:id", unitsHandler.UpdateUnit)
			erp.DELETE("/units-settings/:id", unitsHandler.DeleteUnit)

			// Settings: Company
			erp.GET("/companies", companySettingsHandler.GetCompanies)
			erp.GET("/companies/:id", companySettingsHandler.GetCompany)
			erp.POST("/companies", companySettingsHandler.CreateCompany)
			erp.PUT("/companies/:id", companySettingsHandler.UpdateCompany)
			erp.DELETE("/companies/:id", companySettingsHandler.DeleteCompany)

			// Settings: App Settings (Key-Value Storage)
			erp.GET("/settings", appSettingsHandler.GetAllSettings)
			erp.GET("/settings/categories", appSettingsHandler.GetCategories)
			erp.GET("/settings/category/:category", appSettingsHandler.GetSettingsByCategory)
			erp.GET("/settings/:key", appSettingsHandler.GetSetting)
			erp.PUT("/settings/:key", appSettingsHandler.UpsertSetting)
			erp.POST("/settings/bulk", appSettingsHandler.BulkUpsertSettings)
			erp.DELETE("/settings/:key", appSettingsHandler.DeleteSetting)

			// Settings: Legacy Key-Value (keeping for backward compatibility)
			erp.PUT("/settings-old/:key", settingsHandler.UpsertSetting)

			// ERP Settings (Centralized Configuration) - Write operations only (read is public)
			erp.PUT("/erp-settings/:key", erpSettingsHandler.UpdateSetting)
			erp.POST("/erp-settings/bulk-update", erpSettingsHandler.BulkUpdateSettings)

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

			erp.GET("/marketing/campaigns", marketingHandler.GetCampaigns)
			erp.POST("/marketing/campaigns", marketingHandler.CreateCampaign)
			erp.GET("/marketing/campaigns/:id", marketingHandler.GetCampaign)
			erp.PUT("/marketing/campaigns/:id", marketingHandler.UpdateCampaign)
			erp.DELETE("/marketing/campaigns/:id", marketingHandler.DeleteCampaign)

			erp.GET("/marketing/stats", marketingHandler.GetStats)
			erp.GET("/marketing/templates", marketingHandler.GetTemplates)
			erp.POST("/marketing/templates", marketingHandler.CreateTemplate)

		}

		// Uploads & Approvals
		uploads := api.Group("/uploads")
		{
			// Full TypeScript-compatible upload handlers
			uploads.POST("/purchase", purchaseUploadHandler.UploadPurchase)
			uploads.POST("/approve", approveUploadHandler.ApproveSession)
			uploads.POST("/inventory", inventoryUploadHandler.UploadCSV)

			uploads.GET("/inventory", uploadsHandler.GetInventorySessions)
			uploads.GET("/session/:sessionId", uploadsHandler.GetSessionDetails)
			uploads.POST("/approve/simple", uploadsHandler.ApproveOrRejectUpload)

			// Enhanced upload endpoints
			uploads.POST("/parse", enhancedUploadsHandler.ParseUploadFile)
			uploads.POST("/process/purchase", enhancedUploadsHandler.ProcessPurchaseUpload)
			uploads.POST("/process/inventory", enhancedUploadsHandler.ProcessInventoryUpload)
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
			whatsapp.POST("/bulk-send", whatsappHandler.BulkSendMessages) // Bulk send
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

	// Handle 404 for unimplemented API endpoints with graceful stub responses
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// List of API prefixes that should get stub responses
		stubPrefixes := []string{
			"/api/ai/",
			"/api/crm/",
			"/api/finance/",
			"/api/hr/",
			"/api/marketing/",
			"/api/analytics/",
			"/api/reports/",
			"/api/prescriptions/",
		}

		isStubAPI := false
		for _, prefix := range stubPrefixes {
			if len(path) >= len(prefix) && path[:len(prefix)] == prefix {
				isStubAPI = true
				break
			}
		}

		if isStubAPI {
			c.JSON(200, gin.H{
				"success": true,
				"data":    []interface{}{},
				"message": "Feature coming soon - endpoint not yet implemented",
				"stub":    true,
			})
			return
		}

		c.JSON(404, gin.H{
			"success": false,
			"error":   "Endpoint not found",
		})
	})

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
