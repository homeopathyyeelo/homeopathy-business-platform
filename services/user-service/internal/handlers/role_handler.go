package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/user-service/internal/models"
	"github.com/yeelo/user-service/internal/service"
	"go.uber.org/zap"
)

type RoleHandler struct {
	service service.RoleService
	logger  *zap.Logger
}

func NewRoleHandler(service service.RoleService, logger *zap.Logger) *RoleHandler {
	return &RoleHandler{
		service: service,
		logger:  logger,
	}
}

type CreateRoleRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type UpdateRoleRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var req CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	role := &models.Role{
		Name:        req.Name,
		Description: req.Description,
		IsActive:    true,
	}

	if err := h.service.Create(c.Context(), role); err != nil {
		h.logger.Error("Failed to create role", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create role"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	role, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Role not found"})
	}

	return c.JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	roles, total, err := h.service.List(c.Context(), page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list roles", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list roles"})
	}

	return c.JSON(fiber.Map{
		"data": roles,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	role, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Role not found"})
	}

	if req.Name != "" {
		role.Name = req.Name
	}
	if req.Description != nil {
		role.Description = req.Description
	}
	if req.IsActive != nil {
		role.IsActive = *req.IsActive
	}

	if err := h.service.Update(c.Context(), role); err != nil {
		h.logger.Error("Failed to update role", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update role"})
	}

	return c.JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Delete(c.Context(), id); err != nil {
		h.logger.Error("Failed to delete role", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete role"})
	}

	return c.JSON(fiber.Map{"message": "Role deleted successfully"})
}
