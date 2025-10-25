package main

import (
    "log"
    "os"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"

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

        // Barcode routes
        erp.GET("/products/barcode", productHandler.GetBarcodes)
        erp.POST("/products/barcode/generate", productHandler.GenerateBarcode)
        erp.POST("/products/barcode/print", productHandler.PrintBarcodes)
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = cfg.Port
        if port == "" {
            port = "3005"
        }
    }

    log.Printf("Golang v2 Server starting on port %s", port)
    log.Fatal(r.Run(":" + port))
}
