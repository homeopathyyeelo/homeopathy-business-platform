package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/user-service/internal/service"
	"go.uber.org/zap"
)

type AuthHandler struct {
	service service.AuthService
	logger  *zap.Logger
}

func NewAuthHandler(service service.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		service: service,
		logger:  logger,
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type RegisterRequest struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Password  string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tokenPair, err := h.service.Login(c.Context(), req.Username, req.Password)
	if err != nil {
		h.logger.Error("Login failed", zap.Error(err))
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	return c.JSON(fiber.Map{"data": tokenPair})
}

func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tokenPair, err := h.service.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		h.logger.Error("Token refresh failed", zap.Error(err))
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid refresh token"})
	}

	return c.JSON(fiber.Map{"data": tokenPair})
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Registration logic would go here
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{"error": "Registration not implemented"})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Logout logic (invalidate token, clear session, etc.)
	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}
