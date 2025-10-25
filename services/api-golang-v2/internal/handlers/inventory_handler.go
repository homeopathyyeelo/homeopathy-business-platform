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
