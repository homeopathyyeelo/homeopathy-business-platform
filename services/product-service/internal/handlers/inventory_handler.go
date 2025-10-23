package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yeelo/product-service/internal/service"
	"go.uber.org/zap"
)

type InventoryHandler struct {
	service service.InventoryService
	logger  *zap.Logger
}

func NewInventoryHandler(service service.InventoryService, logger *zap.Logger) *InventoryHandler {
	return &InventoryHandler{
		service: service,
		logger:  logger,
	}
}

func (h *InventoryHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	inventory, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Inventory not found"})
	}

	return c.JSON(fiber.Map{"data": inventory})
}

func (h *InventoryHandler) GetByProduct(c *fiber.Ctx) error {
	productID := c.Params("product_id")

	inventories, err := h.service.GetByProductID(c.Context(), productID)
	if err != nil {
		h.logger.Error("Failed to get inventory", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get inventory"})
	}

	return c.JSON(fiber.Map{"data": inventories})
}

func (h *InventoryHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	inventories, total, err := h.service.List(c.Context(), page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list inventory", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list inventory"})
	}

	return c.JSON(fiber.Map{
		"data": inventories,
		"meta": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (h *InventoryHandler) GetLowStock(c *fiber.Ctx) error {
	inventories, err := h.service.GetLowStock(c.Context())
	if err != nil {
		h.logger.Error("Failed to get low stock", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get low stock"})
	}

	return c.JSON(fiber.Map{"data": inventories})
}

func (h *InventoryHandler) AdjustStock(c *fiber.Ctx) error {
	var req struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
		Type      string `json:"type"`
		Reason    string `json:"reason"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.AdjustStock(c.Context(), req.ProductID, req.Quantity, req.Type, req.Reason); err != nil {
		h.logger.Error("Failed to adjust stock", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to adjust stock"})
	}

	return c.JSON(fiber.Map{"message": "Stock adjusted successfully"})
}
