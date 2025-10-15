package handlers

import (
	"net/http"
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"github.com/google/uuid"
)

// InventoryHandler handles all inventory-related operations
type InventoryHandler struct {
	inventoryService *services.InventoryService
	productService   *services.ProductService
	warehouseService *services.WarehouseService
}

// NewInventoryHandler creates a new inventory handler
func NewInventoryHandler() *InventoryHandler {
	return &InventoryHandler{
		inventoryService: services.NewInventoryService(),
		productService:   services.NewProductService(),
		warehouseService: services.NewWarehouseService(),
	}
}

// GetInventory returns current inventory levels
func (h *InventoryHandler) GetInventory(c *gin.Context) {
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	lowStockOnly, _ := strconv.ParseBool(c.DefaultQuery("low_stock_only", "false"))

	inventory, err := h.inventoryService.GetInventory(productID, warehouseID, lowStockOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": inventory,
		"count":     len(inventory),
	})
}

// GetInventoryHistory returns inventory transaction history
func (h *InventoryHandler) GetInventoryHistory(c *gin.Context) {
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	transactions, total, err := h.inventoryService.GetInventoryHistory(productID, warehouseID, startDate, endDate, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// AdjustStock adjusts inventory for a product
func (h *InventoryHandler) AdjustStock(c *gin.Context) {
	var req AdjustStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate product exists
	if _, err := h.productService.GetProductByID(req.ProductID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Validate warehouse exists if specified
	if req.WarehouseID != "" {
		if _, err := h.warehouseService.GetWarehouseByID(req.WarehouseID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
			return
		}
	}

	// Create inventory transaction
	transaction := &models.InventoryTransaction{
		ID:          uuid.New().String(),
		ProductID:   req.ProductID,
		WarehouseID: req.WarehouseID,
		Type:        req.Type,
		Quantity:    req.Quantity,
		UnitCost:    req.UnitCost,
		TotalCost:   float64(req.Quantity) * req.UnitCost,
		Reference:   req.Reference,
		Notes:       req.Notes,
		CreatedBy:   c.GetString("user_id"),
		CreatedAt:   time.Now(),
	}

	if err := h.inventoryService.CreateInventoryTransaction(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inventory transaction"})
		return
	}

	// Update product stock
	var stockChange int
	switch req.Type {
	case "IN":
		stockChange = req.Quantity
	case "OUT":
		stockChange = -req.Quantity
	case "ADJUSTMENT":
		// For adjustment, calculate difference from current stock
		currentStock, _ := h.inventoryService.GetProductStock(req.ProductID)
		stockChange = req.Quantity - currentStock
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction type"})
		return
	}

	if err := h.productService.UpdateStock(req.ProductID, stockChange); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product stock"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Inventory adjusted successfully",
		"transaction": transaction,
	})
}

// TransferStock transfers stock between warehouses
func (h *InventoryHandler) TransferStock(c *gin.Context) {
	var req TransferStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate product and warehouses
	if _, err := h.productService.GetProductByID(req.ProductID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	if _, err := h.warehouseService.GetWarehouseByID(req.FromWarehouseID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from warehouse ID"})
		return
	}
	if _, err := h.warehouseService.GetWarehouseByID(req.ToWarehouseID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to warehouse ID"})
		return
	}

	// Create OUT transaction for source warehouse
	outTransaction := &models.InventoryTransaction{
		ID:          uuid.New().String(),
		ProductID:   req.ProductID,
		WarehouseID: req.FromWarehouseID,
		Type:        "OUT",
		Quantity:    req.Quantity,
		Reference:   "TRANSFER-" + uuid.New().String(),
		Notes:       "Transfer to " + req.ToWarehouseID,
		CreatedBy:   c.GetString("user_id"),
		CreatedAt:   time.Now(),
	}

	// Create IN transaction for destination warehouse
	inTransaction := &models.InventoryTransaction{
		ID:          uuid.New().String(),
		ProductID:   req.ProductID,
		WarehouseID: req.ToWarehouseID,
		Type:        "IN",
		Quantity:    req.Quantity,
		Reference:   outTransaction.Reference,
		Notes:       "Transfer from " + req.FromWarehouseID,
		CreatedBy:   c.GetString("user_id"),
		CreatedAt:   time.Now(),
	}

	// Execute transactions
	if err := h.inventoryService.CreateInventoryTransaction(outTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create out transaction"})
		return
	}
	if err := h.inventoryService.CreateInventoryTransaction(inTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create in transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Stock transferred successfully",
		"out_transaction": outTransaction,
		"in_transaction":  inTransaction,
	})
}

// GetStockAlerts returns products with low stock or expiring items
func (h *InventoryHandler) GetStockAlerts(c *gin.Context) {
	alerts, err := h.inventoryService.GetStockAlerts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
	})
}

// GetInventoryValuation returns current inventory value
func (h *InventoryHandler) GetInventoryValuation(c *gin.Context) {
	warehouseID := c.Query("warehouse_id")

	valuation, err := h.inventoryService.GetInventoryValuation(warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate inventory valuation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valuation": valuation,
		"calculated_at": time.Now(),
	})
}

// GetInventoryHistory returns inventory transaction history
func (h *InventoryHandler) GetInventoryHistory(c *gin.Context) {
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	transactions, total, err := h.inventoryService.GetInventoryHistory(productID, warehouseID, startDate, endDate, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// TransferStock transfers stock between warehouses
func (h *InventoryHandler) TransferStock(c *gin.Context) {
	var req TransferStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate product and warehouses
	if _, err := h.productService.GetProductByID(req.ProductID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	if _, err := h.warehouseService.GetWarehouseByID(req.FromWarehouseID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from warehouse ID"})
		return
	}
	if _, err := h.warehouseService.GetWarehouseByID(req.ToWarehouseID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to warehouse ID"})
		return
	}

	// Create OUT transaction for source warehouse
	outTransaction := &models.InventoryTransaction{
		ID:          uuid.New().String(),
		ProductID:   req.ProductID,
		WarehouseID: req.FromWarehouseID,
		Type:        "OUT",
		Quantity:    req.Quantity,
		Reference:   "TRANSFER-" + uuid.New().String(),
		Notes:       "Transfer to " + req.ToWarehouseID,
		CreatedBy:   c.GetString("user_id"),
		CreatedAt:   time.Now(),
	}

	// Create IN transaction for destination warehouse
	inTransaction := &models.InventoryTransaction{
		ID:          uuid.New().String(),
		ProductID:   req.ProductID,
		WarehouseID: req.ToWarehouseID,
		Type:        "IN",
		Quantity:    req.Quantity,
		Reference:   outTransaction.Reference,
		Notes:       "Transfer from " + req.FromWarehouseID,
		CreatedBy:   c.GetString("user_id"),
		CreatedAt:   time.Now(),
	}

	// Execute transactions
	if err := h.inventoryService.CreateInventoryTransaction(outTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create out transaction"})
		return
	}
	if err := h.inventoryService.CreateInventoryTransaction(inTransaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create in transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Stock transferred successfully",
		"out_transaction": outTransaction,
		"in_transaction":  inTransaction,
	})
}

// GetStockAlerts returns products with low stock or expiring items
func (h *InventoryHandler) GetStockAlerts(c *gin.Context) {
	alerts, err := h.inventoryService.GetStockAlerts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock alerts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"count":  len(alerts),
	})
}

// GetInventoryValuation returns current inventory value
func (h *InventoryHandler) GetInventoryValuation(c *gin.Context) {
	warehouseID := c.Query("warehouse_id")

	valuation, err := h.inventoryService.GetInventoryValuation(warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate inventory valuation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valuation": valuation,
		"calculated_at": time.Now(),
	})
}
