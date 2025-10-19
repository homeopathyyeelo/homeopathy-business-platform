package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/service"
	"go.uber.org/zap"
)

type BrandHandler struct {
	service service.BrandService
	logger  *zap.Logger
}

func NewBrandHandler(service service.BrandService, logger *zap.Logger) *BrandHandler {
	return &BrandHandler{
		service: service,
		logger:  logger,
	}
}

func (h *BrandHandler) Create(c *fiber.Ctx) error {
	var brand models.Brand
	if err := c.BodyParser(&brand); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Create(c.Context(), &brand); err != nil {
		h.logger.Error("Failed to create brand", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create brand"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": brand})
}

func (h *BrandHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	brand, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Brand not found"})
	}

	return c.JSON(fiber.Map{"data": brand})
}

func (h *BrandHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "50"))

	brands, total, err := h.service.List(c.Context(), page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list brands", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list brands"})
	}

	return c.JSON(fiber.Map{
		"data": brands,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *BrandHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	brand, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Brand not found"})
	}

	if err := c.BodyParser(brand); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Update(c.Context(), brand); err != nil {
		h.logger.Error("Failed to update brand", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update brand"})
	}

	return c.JSON(fiber.Map{"data": brand})
}

func (h *BrandHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Delete(c.Context(), id); err != nil {
		h.logger.Error("Failed to delete brand", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete brand"})
	}

	return c.JSON(fiber.Map{"message": "Brand deleted successfully"})
}
