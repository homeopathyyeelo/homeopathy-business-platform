package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"github.com/yeelo/homeopathy-erp/internal/cron"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"github.com/yeelo/homeopathy-erp/internal/middleware"
)

func main() {
	// Database connection
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize Gin
	r := gin.Default()

	// Middleware
	errorLogger := middleware.NewErrorLogger(db)
	r.Use(errorLogger.Handler())

	// Health endpoint
	healthHandler := handlers.NewHealthHandler()
	r.GET("/health", healthHandler.Health)

	// API v1
	v1 := r.Group("/api/v1")
	{
		// System bugs
		bugsHandler := handlers.NewBugsHandler(db)
		bugs := v1.Group("/system/bugs")
		{
			bugs.GET("", bugsHandler.ListBugs)
			bugs.GET("/summary", bugsHandler.GetBugSummary)
			bugs.GET("/:id", bugsHandler.GetBugByID)
			bugs.POST("/ingest", bugsHandler.IngestBug)
			bugs.POST("/:id/approve", bugsHandler.ApproveFix)
		}

		// System health
		v1.GET("/system/health", healthHandler.SystemHealth)
		v1.POST("/system/health/check", healthHandler.CheckServices)
	}

	// API v2
	v2 := r.Group("/api/v2")
	{
		// Expiry
		expiryHandler := handlers.NewExpiryHandler(db)
		v2.GET("/inventory/expiries", expiryHandler.GetExpiries)
		v2.GET("/dashboard/expiry-summary", expiryHandler.GetExpirySummary)
		v2.POST("/inventory/expiry-alert", expiryHandler.CreateExpiryAlert)
	}

	// API ERP
	erp := r.Group("/api/erp")
	{
		// Dashboard
		dashboardHandler := handlers.NewDashboardHandler(db)
		erp.GET("/dashboard/stats", dashboardHandler.GetStats)
		erp.GET("/dashboard/activity", dashboardHandler.GetActivity)
		erp.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)
		erp.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
		erp.GET("/dashboard/alerts", dashboardHandler.GetAlerts)
		erp.GET("/dashboard/revenue-chart", dashboardHandler.GetRevenueChart)

		// Inventory
		inventoryHandler := handlers.NewInventoryHandler(db)
		erp.GET("/inventory", inventoryHandler.GetInventory)
		erp.POST("/inventory/adjust", inventoryHandler.AdjustStock)
		erp.GET("/inventory/adjustments", inventoryHandler.GetAdjustments)
		erp.POST("/inventory/transfer", inventoryHandler.TransferStock)
		erp.GET("/inventory/transfers", inventoryHandler.GetTransfers)
		erp.GET("/inventory/alerts", inventoryHandler.GetAlerts)

		// Categories
		categoryHandler := handlers.NewCategoryHandler(db)
		erp.GET("/categories", categoryHandler.GetCategories)
		erp.GET("/categories/root", categoryHandler.GetRootCategories)
		erp.GET("/categories/:id", categoryHandler.GetCategory)
		erp.POST("/categories", categoryHandler.CreateCategory)
		erp.PUT("/categories/:id", categoryHandler.UpdateCategory)
		erp.DELETE("/categories/:id", categoryHandler.DeleteCategory)
		erp.GET("/categories/:id/subcategories", categoryHandler.GetSubcategories)
	}

	// Start cron scheduler
	scheduler := cron.NewScheduler(db)
	scheduler.Start()
	defer scheduler.Stop()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
