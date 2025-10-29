package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InventoryHandler struct {
	db interface{}
}

func NewInventoryHandler(db interface{}) *InventoryHandler {
	return &InventoryHandler{db: db}
}

// GET /api/erp/inventory/stock - Get stock levels
func (h *InventoryHandler) GetStock(c *gin.Context) {
	stock := []gin.H{
		{
			"id":            uuid.New().String(),
			"productName":   "Arnica Montana 30C",
			"productCode":   "ARM-30C-10ML",
			"category":      "Dilutions",
			"brand":         "SBL",
			"currentStock":  150,
			"minStock":      20,
			"maxStock":      500,
			"reorderLevel":  30,
			"unit":          "bottle",
			"status":        "adequate",
			"lastUpdated":   time.Now().Format(time.RFC3339),
		},
		{
			"id":            uuid.New().String(),
			"productName":   "Belladonna 200C",
			"productCode":   "BEL-200C-10ML",
			"category":      "Dilutions",
			"brand":         "Dr. Reckeweg",
			"currentStock":  15,
			"minStock":      25,
			"maxStock":      600,
			"reorderLevel":  40,
			"unit":          "bottle",
			"status":        "low",
			"lastUpdated":   time.Now().Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stock,
	})
}

// GET /api/erp/inventory/expiries/alerts - Expiry alerts
func (h *InventoryHandler) GetExpiryAlerts(c *gin.Context) {
	alerts := []gin.H{
		{
			"id":          uuid.New().String(),
			"productName": "Arnica Montana 30C",
			"batchNo":     "BATCH-2024-001",
			"expiryDate":  time.Now().AddDate(0, 1, 15).Format("2006-01-02"),
			"daysLeft":    45,
			"quantity":    25,
			"severity":    "warning",
			"location":    "Main Store",
		},
		{
			"id":          uuid.New().String(),
			"productName": "Calendula MT",
			"batchNo":     "BATCH-2024-045",
			"expiryDate":  time.Now().AddDate(0, 0, 20).Format("2006-01-02"),
			"daysLeft":    20,
			"quantity":    12,
			"severity":    "critical",
			"location":    "Main Store",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
	})
}

// GET /api/erp/inventory/batches - Get all batches
func (h *InventoryHandler) GetBatches(c *gin.Context) {
	batches := []gin.H{
		{
			"id":          uuid.New().String(),
			"productName": "Arnica Montana 30C",
			"batchNo":     "BATCH-2024-001",
			"mfgDate":     time.Now().AddDate(0, -6, 0).Format("2006-01-02"),
			"expiryDate":  time.Now().AddDate(2, 0, 0).Format("2006-01-02"),
			"quantity":    150,
			"mrp":         75.00,
			"costPrice":   45.00,
			"location":    "Main Store",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
	})
}

// GET /api/erp/inventory/low-stock - Low stock products
func (h *InventoryHandler) GetLowStock(c *gin.Context) {
	lowStock := []gin.H{
		{
			"id":           uuid.New().String(),
			"productName":  "Belladonna 200C",
			"productCode":  "BEL-200C-10ML",
			"currentStock": 15,
			"minStock":     25,
			"reorderLevel": 40,
			"deficit":      25,
			"status":       "urgent",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    lowStock,
	})
}

// GET /api/erp/inventory/adjustments - Stock adjustments
func (h *InventoryHandler) GetAdjustments(c *gin.Context) {
	adjustments := []gin.H{
		{
			"id":          uuid.New().String(),
			"adjustmentNo": "ADJ-2024-001",
			"date":        time.Now().Format("2006-01-02"),
			"productName": "Arnica Montana 30C",
			"type":        "increase",
			"quantity":    10,
			"reason":      "Stock count correction",
			"createdBy":   "Admin",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    adjustments,
	})
}

// POST /api/erp/inventory/adjustments - Create adjustment
func (h *InventoryHandler) CreateAdjustment(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment := gin.H{
		"id":           uuid.New().String(),
		"adjustmentNo": "ADJ-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:6],
		"date":         time.Now().Format("2006-01-02"),
		"productId":    req["productId"],
		"type":         req["type"],
		"quantity":     req["quantity"],
		"reason":       req["reason"],
		"status":       "completed",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    adjustment,
		"message": "Adjustment created successfully",
	})
}

// GET /api/erp/inventory/transfers - Stock transfers
func (h *InventoryHandler) GetTransfers(c *gin.Context) {
	transfers := []gin.H{
		{
			"id":          uuid.New().String(),
			"transferNo":  "TRF-2024-001",
			"date":        time.Now().Format("2006-01-02"),
			"fromBranch":  "Main Store",
			"toBranch":    "Branch 1",
			"productName": "Arnica Montana 30C",
			"quantity":    50,
			"status":      "completed",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transfers,
	})
}

// POST /api/erp/inventory/transfers - Create transfer
func (h *InventoryHandler) CreateTransfer(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transfer := gin.H{
		"id":         uuid.New().String(),
		"transferNo": "TRF-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:6],
		"date":       time.Now().Format("2006-01-02"),
		"fromBranch": req["fromBranch"],
		"toBranch":   req["toBranch"],
		"items":      req["items"],
		"status":     "pending",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    transfer,
		"message": "Transfer created successfully",
	})
}

// POST /api/products/batches - Create batch
func (h *InventoryHandler) CreateBatch(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	batch := gin.H{
		"id":                uuid.New().String(),
		"product_id":        req["product_id"],
		"batch_no":          req["batch_no"],
		"mfg_date":          req["mfg_date"],
		"exp_date":          req["exp_date"],
		"mrp":               req["mrp"],
		"purchase_rate":     req["purchase_rate"],
		"sale_rate":         req["sale_rate"],
		"quantity":          req["quantity"],
		"reserved_quantity": 0,
		"available_quantity": req["quantity"],
		"warehouse_id":      req["warehouse_id"],
		"rack_location":     req["rack_location"],
		"supplier_id":       req["supplier_id"],
		"purchase_invoice_no": req["purchase_invoice_no"],
		"purchase_date":     req["purchase_date"],
		"notes":             req["notes"],
		"is_active":         true,
		"created_at":        time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    batch,
		"message": "Batch created successfully",
	})
}

// PUT /api/products/batches/:id - Update batch
func (h *InventoryHandler) UpdateBatch(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	batch := gin.H{
		"id":                id,
		"product_id":        req["product_id"],
		"batch_no":          req["batch_no"],
		"mfg_date":          req["mfg_date"],
		"exp_date":          req["exp_date"],
		"mrp":               req["mrp"],
		"purchase_rate":     req["purchase_rate"],
		"sale_rate":         req["sale_rate"],
		"quantity":          req["quantity"],
		"warehouse_id":      req["warehouse_id"],
		"rack_location":     req["rack_location"],
		"notes":             req["notes"],
		"updated_at":        time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batch,
		"message": "Batch updated successfully",
	})
}

// DELETE /api/products/batches/:id - Delete batch
func (h *InventoryHandler) DeleteBatch(c *gin.Context) {
	id := c.Param("id")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Batch deleted successfully",
		"id":      id,
	})
}

// ==================== WAREHOUSES ====================

// GET /api/erp/warehouses - Get all warehouses
func (h *InventoryHandler) GetWarehouses(c *gin.Context) {
	warehouses := []gin.H{
		{
			"id":         uuid.New().String(),
			"name":       "Main Warehouse",
			"code":       "WH-MAIN",
			"location":   "Main Store",
			"is_default": true,
			"is_active":  true,
		},
		{
			"id":         uuid.New().String(),
			"name":       "Branch Warehouse",
			"code":       "WH-BRANCH",
			"location":   "Branch Store",
			"is_default": false,
			"is_active":  true,
		},
		{
			"id":         uuid.New().String(),
			"name":       "Online Warehouse",
			"code":       "WH-ONLINE",
			"location":   "E-commerce Stock",
			"is_default": false,
			"is_active":  true,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    warehouses,
	})
}

// POST /api/erp/warehouses - Create warehouse
func (h *InventoryHandler) CreateWarehouse(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse := gin.H{
		"id":         uuid.New().String(),
		"name":       req["name"],
		"code":       req["code"],
		"location":   req["location"],
		"is_default": false,
		"is_active":  true,
		"created_at": time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    warehouse,
		"message": "Warehouse created successfully",
	})
}

// PUT /api/erp/warehouses/:id - Update warehouse
func (h *InventoryHandler) UpdateWarehouse(c *gin.Context) {
	id := c.Param("id")
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	warehouse := gin.H{
		"id":         id,
		"name":       req["name"],
		"code":       req["code"],
		"location":   req["location"],
		"updated_at": time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    warehouse,
		"message": "Warehouse updated successfully",
	})
}

// DELETE /api/erp/warehouses/:id - Delete warehouse
func (h *InventoryHandler) DeleteWarehouse(c *gin.Context) {
	id := c.Param("id")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Warehouse deleted successfully",
		"id":      id,
	})
}

// ==================== INVENTORY BASIC OPERATIONS ====================

// GetInventory returns overall inventory data
func (h *InventoryHandler) GetInventory(c *gin.Context) {
	inventory := []gin.H{
		{
			"id":            uuid.New().String(),
			"productName":   "Arnica Montana 30C",
			"batchNo":       "BATCH-001",
			"quantity":      500,
			"unit":          "bottles",
			"location":      "Warehouse A",
			"reorderLevel":  100,
			"status":        "sufficient",
		},
		{
			"id":            uuid.New().String(),
			"productName":   "Belladonna 200C",
			"batchNo":       "BATCH-002",
			"quantity":      50,
			"unit":          "bottles",
			"location":      "Warehouse B",
			"reorderLevel":  100,
			"status":        "low",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    inventory,
	})
}

// AdjustStock adjusts stock quantity
func (h *InventoryHandler) AdjustStock(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment := gin.H{
		"id":          uuid.New().String(),
		"productID":   req["product_id"],
		"adjustment":  req["adjustment"],
		"reason":      req["reason"],
		"adjustedBy":  req["adjusted_by"],
		"adjustedAt":  time.Now().Format(time.RFC3339),
		"newQuantity": req["new_quantity"],
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    adjustment,
		"message": "Stock adjusted successfully",
	})
}

// TransferStock transfers stock between locations
func (h *InventoryHandler) TransferStock(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transfer := gin.H{
		"id":           uuid.New().String(),
		"productID":    req["product_id"],
		"fromLocation": req["from_location"],
		"toLocation":   req["to_location"],
		"quantity":     req["quantity"],
		"transferredBy": req["transferred_by"],
		"transferredAt": time.Now().Format(time.RFC3339),
		"status":       "completed",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    transfer,
		"message": "Stock transferred successfully",
	})
}

// GetAlerts returns inventory alerts (low stock, expiring, etc.)
func (h *InventoryHandler) GetAlerts(c *gin.Context) {
	alerts := []gin.H{
		{
			"id":          uuid.New().String(),
			"type":        "low_stock",
			"productName": "Belladonna 200C",
			"currentQty":  50,
			"minQty":      100,
			"severity":    "medium",
			"createdAt":   time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		},
		{
			"id":          uuid.New().String(),
			"type":        "expiring_soon",
			"productName": "Nux Vomica 30C",
			"batchNo":     "BATCH-045",
			"expiryDate":  time.Now().Add(30 * 24 * time.Hour).Format("2006-01-02"),
			"quantity":    150,
			"severity":    "high",
			"createdAt":   time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
	})
}
