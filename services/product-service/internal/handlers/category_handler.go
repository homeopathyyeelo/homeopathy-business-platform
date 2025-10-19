package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/service"
	"go.uber.org/zap"
)

type CategoryHandler struct {
	service service.CategoryService
	logger  *zap.Logger
}

func NewCategoryHandler(service service.CategoryService, logger *zap.Logger) *CategoryHandler {
	return &CategoryHandler{
		service: service,
		logger:  logger,
	}
}

func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var category models.Category
	if err := c.BodyParser(&category); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Create(c.Context(), &category); err != nil {
		h.logger.Error("Failed to create category", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create category"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": category})
}

func (h *CategoryHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	category, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Category not found"})
	}

	return c.JSON(fiber.Map{"data": category})
}

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "50"))

	categories, total, err := h.service.List(c.Context(), page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list categories", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list categories"})
	}

	return c.JSON(fiber.Map{
		"data": categories,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *CategoryHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	category, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Category not found"})
	}

	if err := c.BodyParser(category); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Update(c.Context(), category); err != nil {
		h.logger.Error("Failed to update category", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update category"})
	}

	return c.JSON(fiber.Map{"data": category})
}

func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Delete(c.Context(), id); err != nil {
		h.logger.Error("Failed to delete category", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete category"})
	}

	return c.JSON(fiber.Map{"message": "Category deleted successfully"})
}
