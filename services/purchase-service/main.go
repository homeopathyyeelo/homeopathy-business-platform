package main

import (
	"log"
	"github.com/gin-gonic/gin"
	"purchase-service/handlers"
	"purchase-service/middleware"
	"purchase-service/db"
)

func main() {
	// Initialize database
	database, err := db.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Initialize Gin router
	r := gin.Default()
	
	// Middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	
	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// GRN (Goods Receipt Note) - Fast CRUD
		grn := v1.Group("/grn")
		{
			grn.GET("", handlers.ListGRN)
			grn.GET("/:id", handlers.GetGRN)
			grn.POST("", handlers.CreateGRN)
			grn.PUT("/:id", handlers.UpdateGRN)
			grn.DELETE("/:id", handlers.DeleteGRN)
			grn.POST("/:id/confirm", handlers.ConfirmGRN)
			grn.POST("/:id/post", handlers.PostGRN)
		}

		// Inventory Batch Operations
		inventory := v1.Group("/inventory")
		{
			inventory.GET("/batches", handlers.ListBatches)
			inventory.GET("/batches/:id", handlers.GetBatch)
			inventory.POST("/batches", handlers.CreateBatch)
			inventory.PUT("/batches/:id", handlers.UpdateBatch)
			inventory.POST("/batches/bulk-update", handlers.BulkUpdateBatches)
			inventory.GET("/stock/:product_id", handlers.GetProductStock)
			inventory.GET("/expiring", handlers.GetExpiringBatches)
		}

		// Vendor Price List
		vendors := v1.Group("/vendors")
		{
			vendors.GET("/:vendor_id/prices", handlers.GetVendorPrices)
			vendors.POST("/:vendor_id/prices", handlers.UpdateVendorPrices)
			vendors.GET("/:vendor_id/mappings", handlers.GetVendorMappings)
			vendors.POST("/:vendor_id/mappings", handlers.CreateVendorMapping)
		}

		// Discount Rules
		discounts := v1.Group("/discounts")
		{
			discounts.GET("", handlers.ListDiscountRules)
			discounts.POST("", handlers.CreateDiscountRule)
			discounts.PUT("/:id", handlers.UpdateDiscountRule)
			discounts.POST("/calculate", handlers.CalculateDiscounts)
		}

		// Products (Fast Search)
		products := v1.Group("/products")
		{
			products.GET("/search", handlers.SearchProducts)
			products.GET("/:id/batches", handlers.GetProductBatches)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "purchase-service"})
	})

	log.Println("Purchase Service (Golang) starting on :8006")
	r.Run(":8006")
}
