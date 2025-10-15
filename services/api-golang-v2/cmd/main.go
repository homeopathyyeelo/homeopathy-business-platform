package main

import (
	"log"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/config"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/middleware"
	"github.com/yeelo/homeopathy-erp/api/routes"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db := database.Init(cfg.DatabaseURL)
	defer db.Close()

	// Initialize Gin router
	r := gin.Default()

	// Global middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.SecurityHeaders())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "homeopathy-erp",
			"version": "1.0.0",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		routes.AuthRoutes(api.Group("/auth"))
		routes.UserRoutes(api.Group("/users"))
		routes.EmailRoutes(api.Group("/email"))
		routes.CMSRoutes(api.Group("/cms"))
		routes.ERPRoutes(api.Group("/erp"))
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3004"
	}

	log.Printf("🚀 Homeopathy ERP Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
