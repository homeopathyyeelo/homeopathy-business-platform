package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/product-service/internal/models"
	"github.com/yeelo/product-service/internal/service"
	"go.uber.org/zap"
)

type ProductHandler struct {
	service service.ProductService
	logger  *zap.Logger
}

func NewProductHandler(service service.ProductService, logger *zap.Logger) *ProductHandler {
	return &ProductHandler{
		service: service,
		logger:  logger,
	}
}

func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var product models.Product
	if err := c.BodyParser(&product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Create(c.Context(), &product); err != nil {
		h.logger.Error("Failed to create product", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create product"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": product})
}

func (h *ProductHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	product, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(fiber.Map{"data": product})
}

func (h *ProductHandler) GetByBarcode(c *fiber.Ctx) error {
	barcode := c.Params("barcode")

	product, err := h.service.GetByBarcode(c.Context(), barcode)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(fiber.Map{"data": product})
}

func (h *ProductHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	products, total, err := h.service.List(c.Context(), page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list products", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list products"})
	}

	return c.JSON(fiber.Map{
		"data": products,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *ProductHandler) Search(c *fiber.Ctx) error {
	query := c.Query("q")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	products, total, err := h.service.Search(c.Context(), query, page, pageSize)
	if err != nil {
		h.logger.Error("Failed to search products", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to search products"})
	}

	return c.JSON(fiber.Map{
		"data": products,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	product, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Product not found"})
	}

	if err := c.BodyParser(product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.Update(c.Context(), product); err != nil {
		h.logger.Error("Failed to update product", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update product"})
	}

	return c.JSON(fiber.Map{"data": product})
}

func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Delete(c.Context(), id); err != nil {
		h.logger.Error("Failed to delete product", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete product"})
	}

	return c.JSON(fiber.Map{"message": "Product deleted successfully"})
}
