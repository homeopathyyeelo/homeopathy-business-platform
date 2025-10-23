package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	godotenv.Load()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Initialize database
	InitDB()

	// Routes
	setupRoutes(app)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8004"
	}

	log.Printf("🚀 User Service starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "user-service",
		})
	})

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", Login)
	auth.Post("/register", Register)
	auth.Post("/logout", Logout)
	auth.Post("/refresh", RefreshToken)
	auth.Get("/me", AuthMiddleware, GetCurrentUser)

	// User routes (protected)
	users := api.Group("/users", AuthMiddleware)
	users.Get("/", GetUsers)
	users.Get("/:id", GetUser)
	users.Post("/", CreateUser)
	users.Put("/:id", UpdateUser)
	users.Delete("/:id", DeleteUser)
	users.Get("/:id/permissions", GetUserPermissions)
	users.Post("/:id/roles", AssignRole)
	users.Delete("/:id/roles/:roleId", RemoveRole)

	// Role routes (protected)
	roles := api.Group("/roles", AuthMiddleware, AdminOnly)
	roles.Get("/", GetRoles)
	roles.Get("/:id", GetRole)
	roles.Post("/", CreateRole)
	roles.Put("/:id", UpdateRole)
	roles.Delete("/:id", DeleteRole)
	roles.Post("/:id/permissions", AssignPermission)
	roles.Delete("/:id/permissions/:permissionId", RemovePermission)

	// Permission routes (protected)
	permissions := api.Group("/permissions", AuthMiddleware)
	permissions.Get("/", GetPermissions)
	permissions.Get("/check", CheckPermission)
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error":   message,
	})
}
