package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIDemandForecastRequest struct {
	ProductIDs []string `json:"product_ids" binding:"required"`
	Months     int      `json:"months_ahead" default:"1"`
}

type AIInventoryOptimizationRequest struct {
	ProductIDs         []string `json:"product_ids" binding:"required"`
	OptimizationType   string   `json:"optimization_type" default:"both"`
}

type InventoryBatch struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	BatchNo     string    `json:"batch_no"`
	Quantity    int       `json:"quantity"`
	Reserved    int       `json:"reserved"`
	Available   int       `json:"available"`
	ExpiryDate  time.Time `json:"expiry_date"`
	MRP         float64   `json:"mrp"`
	UnitCost    float64   `json:"unit_cost"`
	ShopID      string    `json:"shop_id"`
	ShopName    string    `json:"shop_name"`
	CreatedAt   time.Time `json:"created_at"`
}

type StockAdjustment struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	BatchNo     string    `json:"batch_no"`
	QtyBefore   int       `json:"qty_before"`
	QtyAfter    int       `json:"qty_after"`
	QtyDelta    int       `json:"qty_delta"`
	Reason      string    `json:"reason"`
	Notes       string    `json:"notes"`
	AdjustedBy  string    `json:"adjusted_by"`
	ShopID      string    `json:"shop_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type StockTransfer struct {
	ID            string    `json:"id"`
	ProductID     string    `json:"product_id"`
	ProductName   string    `json:"product_name"`
	BatchNo       string    `json:"batch_no"`
	Quantity      int       `json:"quantity"`
	FromShopID    string    `json:"from_shop_id"`
	FromShopName  string    `json:"from_shop_name"`
	ToShopID      string    `json:"to_shop_id"`
	ToShopName    string    `json:"to_shop_name"`
	Reference     string    `json:"reference"`
	Status        string    `json:"status"` // pending, in_transit, completed, cancelled
	TransferredBy string    `json:"transferred_by"`
	CreatedAt     time.Time `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at"`
}

type InventoryHandler struct {
	db interface{}
}

func NewInventoryHandler(db interface{}) *InventoryHandler {
	return &InventoryHandler{db: db}
}

// GET /api/erp/inventory
func (h *InventoryHandler) GetInventory(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// Mock data - replace with actual DB query
	inventory := []InventoryBatch{
		{
			ID:          uuid.New().String(),
			ProductID:   uuid.New().String(),
			ProductName: "SBL Arnica Montana 30C",
			BatchNo:     "ARM-30C-2024-01",
			Quantity:    150,
			Reserved:    10,
			Available:   140,
			ExpiryDate:  time.Now().AddDate(2, 0, 0),
			MRP:         85.00,
			UnitCost:    45.00,
			ShopID:      uuid.New().String(),
			ShopName:    "Main Branch",
			CreatedAt:   time.Now().AddDate(0, -3, 0),
		},
		{
			ID:          uuid.New().String(),
			ProductID:   uuid.New().String(),
			ProductName: "Reckeweg R1 Drops",
			BatchNo:     "R1-2024-01",
			Quantity:    45,
			Reserved:    5,
			Available:   40,
			ExpiryDate:  time.Now().AddDate(1, 6, 0),
			MRP:         245.00,
			UnitCost:    185.00,
			ShopID:      uuid.New().String(),
			ShopName:    "Main Branch",
			CreatedAt:   time.Now().AddDate(0, -1, 0),
		},
		{
			ID:          uuid.New().String(),
			ProductID:   uuid.New().String(),
			ProductName: "Allen Arsenicum Album 200",
			BatchNo:     "ARS-200-2024",
			Quantity:    8,
			Reserved:    2,
			Available:   6,
			ExpiryDate:  time.Now().AddDate(1, 0, 0),
			MRP:         95.00,
			UnitCost:    55.00,
			ShopID:      uuid.New().String(),
			ShopName:    "Branch 2",
			CreatedAt:   time.Now().AddDate(0, -2, 0),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    inventory,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": len(inventory),
		},
	})
}

// POST /api/erp/inventory/adjust
func (h *InventoryHandler) AdjustStock(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		BatchNo   string `json:"batch_no"`
		ShopID    string `json:"shop_id" binding:"required"`
		QtyDelta  int    `json:"qty_delta" binding:"required"` // +/- value
		Reason    string `json:"reason" binding:"required"`
		Notes     string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// TODO: Begin transaction
	// TODO: Find batch and get current qty
	// TODO: Update inventory_batches set qty = qty + delta
	// TODO: Insert into stock_movements
	// TODO: Publish to Kafka inventory.adjusted
	// TODO: Commit transaction

	adjustmentID := uuid.New().String()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":      adjustmentID,
			"message": "Stock adjusted successfully",
		},
	})
}

// GET /api/erp/inventory/adjustments
func (h *InventoryHandler) GetAdjustments(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// Mock data - replace with actual DB query
	adjustments := []StockAdjustment{
		{
			ID:          uuid.New().String(),
			ProductID:   uuid.New().String(),
			ProductName: "SBL Arnica Montana 30C",
			BatchNo:     "ARM-30C-2024-01",
			QtyBefore:   150,
			QtyAfter:    145,
			QtyDelta:    -5,
			Reason:      "Damaged Stock",
			Notes:       "5 bottles damaged during handling",
			AdjustedBy:  "admin@homeoerp.com",
			ShopID:      uuid.New().String(),
			CreatedAt:   time.Now().Add(-2 * time.Hour),
		},
		{
			ID:          uuid.New().String(),
			ProductID:   uuid.New().String(),
			ProductName: "Reckeweg R1 Drops",
			BatchNo:     "R1-2024-01",
			QtyBefore:   40,
			QtyAfter:    45,
			QtyDelta:    5,
			Reason:      "Stock Audit Correction",
			Notes:       "Found 5 additional bottles during audit",
			AdjustedBy:  "admin@homeoerp.com",
			ShopID:      uuid.New().String(),
			CreatedAt:   time.Now().Add(-24 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    adjustments,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": len(adjustments),
		},
	})
}

// POST /api/erp/inventory/transfer
func (h *InventoryHandler) TransferStock(c *gin.Context) {
	var req struct {
		ProductID  string `json:"product_id" binding:"required"`
		BatchNo    string `json:"batch_no"`
		FromShopID string `json:"from_shop_id" binding:"required"`
		ToShopID   string `json:"to_shop_id" binding:"required"`
		Quantity   int    `json:"quantity" binding:"required"`
		Reference  string `json:"reference"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Validation
	if req.FromShopID == req.ToShopID {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Cannot transfer to the same shop",
		})
		return
	}

	if req.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Quantity must be greater than 0",
		})
		return
	}

	// TODO: Begin transaction
	// TODO: Check if source shop has sufficient stock
	// TODO: Decrement from source shop inventory
	// TODO: Increment to destination shop inventory
	// TODO: Insert into stock_transfers table
	// TODO: Insert into stock_movements for both shops
	// TODO: Publish to Kafka inventory.transferred
	// TODO: Commit transaction

	transferID := uuid.New().String()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":      transferID,
			"message": "Stock transfer initiated successfully",
		},
	})
}

// GET /api/erp/inventory/transfers
func (h *InventoryHandler) GetTransfers(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// Mock data - replace with actual DB query
	now := time.Now()
	transfers := []StockTransfer{
		{
			ID:            uuid.New().String(),
			ProductID:     uuid.New().String(),
			ProductName:   "SBL Arnica Montana 30C",
			BatchNo:       "ARM-30C-2024-01",
			Quantity:      20,
			FromShopID:    uuid.New().String(),
			FromShopName:  "Main Branch",
			ToShopID:      uuid.New().String(),
			ToShopName:    "Branch 2",
			Reference:     "TRF-001",
			Status:        "completed",
			TransferredBy: "admin@homeoerp.com",
			CreatedAt:     now.Add(-48 * time.Hour),
			CompletedAt:   &now,
		},
		{
			ID:            uuid.New().String(),
			ProductID:     uuid.New().String(),
			ProductName:   "Reckeweg R1 Drops",
			BatchNo:       "R1-2024-01",
			Quantity:      10,
			FromShopID:    uuid.New().String(),
			FromShopName:  "Branch 2",
			ToShopID:      uuid.New().String(),
			ToShopName:    "Main Branch",
			Reference:     "TRF-002",
			Status:        "in_transit",
			TransferredBy: "admin@homeoerp.com",
			CreatedAt:     now.Add(-2 * time.Hour),
			CompletedAt:   nil,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transfers,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": len(transfers),
		},
	})
}

// GET /api/erp/inventory/alerts
func (h *InventoryHandler) GetAlerts(c *gin.Context) {

	alerts := gin.H{
		"low_stock": []gin.H{
			{
				"product_name": "Allen Arsenicum Album 200",
				"batch_no":     "ARS-200-2024",
				"quantity":     6,
				"min_stock":    10,
				"shop_name":    "Branch 2",
			},
		},
		"expiring_soon": []gin.H{
			{
				"product_name":   "SBL Arnica Montana 30C",
				"batch_no":       "ARM-30C-2024",
				"expiry_date":    time.Now().AddDate(0, 0, 15),
				"days_remaining": 15,
				"quantity":       25,
				"shop_name":      "Main Branch",
			},
		},
		"negative_stock": []gin.H{},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
	})
}

// AI-POWERED METHODS (Integration with Python ML Service)

// GetAIDemandForecast returns AI-powered demand forecasting
func (h *InventoryHandler) GetAIDemandForecast(c *gin.Context) {
	var req AIDemandForecastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/forecast/demand"
	payload := map[string]interface{}{
		"product_ids": req.ProductIDs,
		"months_ahead": req.Months,
		"include_confidence": true,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"forecasts": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIInventoryOptimization returns AI-powered inventory optimization
func (h *InventoryHandler) GetAIInventoryOptimization(c *gin.Context) {
	var req AIInventoryOptimizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Call AI service
	endpoint := "/v2/optimization/inventory"
	payload := map[string]interface{}{
		"product_ids": req.ProductIDs,
		"optimization_type": req.OptimizationType,
	}

	aiResponse, err := callAIService(endpoint, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"optimization": aiResponse,
		"generated_at": time.Now(),
	})
}

// GetAIInventoryAlerts returns AI-powered inventory alerts
func (h *InventoryHandler) GetAIInventoryAlerts(c *gin.Context) {
	// Call AI service for inventory insights
	endpoint := "/v2/analytics/inventory"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"inventory_insights": aiResponse,
		"generated_at": time.Now(),
	})
}
