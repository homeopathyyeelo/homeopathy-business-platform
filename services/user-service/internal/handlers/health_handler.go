package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/user-service/internal/redis"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db     *gorm.DB
	redis  *redis.Client
	logger *zap.Logger
}

func NewHealthHandler(db *gorm.DB, redis *redis.Client, logger *zap.Logger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		redis:  redis,
		logger: logger,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Services  map[string]string `json:"services"`
}

func (h *HealthHandler) Health(c *fiber.Ctx) error {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Services:  make(map[string]string),
	}

	// Check database
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		response.Services["database"] = "unhealthy"
		response.Status = "unhealthy"
	} else {
		response.Services["database"] = "healthy"
	}

	// Check Redis
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := h.redis.Ping(ctx); err != nil {
		response.Services["redis"] = "unhealthy"
		response.Status = "unhealthy"
	} else {
		response.Services["redis"] = "healthy"
	}

	statusCode := fiber.StatusOK
	if response.Status == "unhealthy" {
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(response)
}

func (h *HealthHandler) Ready(c *fiber.Ctx) error {
	// Check if service is ready to accept traffic
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "not ready",
			"reason": "database connection failed",
		})
	}

	return c.JSON(fiber.Map{
		"status": "ready",
	})
}

func (h *HealthHandler) Live(c *fiber.Ctx) error {
	// Check if service is alive
	return c.JSON(fiber.Map{
		"status": "alive",
	})
}
