package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ExpiryHandler struct {
	db interface{}
}

type ExpiryAlert struct {
	ID            string    `json:"id"`
	ProductID     string    `json:"product_id"`
	ProductName   string    `json:"product_name"`
	BatchNo       string    `json:"batch_no"`
	ExpiryDate    time.Time `json:"expiry_date"`
	Quantity      int       `json:"quantity"`
	ShopID        string    `json:"shop_id"`
	ShopName      string    `json:"shop_name"`
	DaysRemaining int       `json:"days_remaining"`
	MRP           float64   `json:"mrp"`
	TotalValue    float64   `json:"total_value"`
}

type ExpirySummary struct {
	Window        string         `json:"window"`
	WindowLabel   string         `json:"window_label"`
	Count         int            `json:"count"`
	TotalValue    float64        `json:"total_value"`
	SampleBatches []ExpiryAlert  `json:"sample_batches"`
}

// GET /api/v2/inventory/expiries
func (h *ExpiryHandler) GetExpiries(c *gin.Context) {
	window := c.DefaultQuery("window", "all")
	shopID := c.Query("shop_id")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	// Mock data - replace with actual DB query
	now := time.Now()
	expiries := []ExpiryAlert{
		{
			ID:            uuid.New().String(),
			ProductID:     uuid.New().String(),
			ProductName:   "SBL Arnica Montana 30C",
			BatchNo:       "ARM-30C-2024",
			ExpiryDate:    now.AddDate(0, 0, 15),
			Quantity:      25,
			ShopID:        uuid.New().String(),
			ShopName:      "Main Branch",
			DaysRemaining: 15,
			MRP:           85.00,
			TotalValue:    2125.00,
		},
		{
			ID:            uuid.New().String(),
			ProductID:     uuid.New().String(),
			ProductName:   "Reckeweg R1 Drops",
			BatchNo:       "R1-2024-01",
			ExpiryDate:    now.AddDate(0, 0, 45),
			Quantity:      12,
			ShopID:        uuid.New().String(),
			ShopName:      "Main Branch",
			DaysRemaining: 45,
			MRP:           245.00,
			TotalValue:    2940.00,
		},
		{
			ID:            uuid.New().String(),
			ProductID:     uuid.New().String(),
			ProductName:   "Allen Arsenicum Album 200",
			BatchNo:       "ARS-200-2024",
			ExpiryDate:    now.AddDate(0, 2, 0),
			Quantity:      40,
			ShopID:        uuid.New().String(),
			ShopName:      "Branch 2",
			DaysRemaining: 60,
			MRP:           95.00,
			TotalValue:    3800.00,
		},
	}

	// Filter by window
	var filtered []ExpiryAlert
	for _, exp := range expiries {
		include := false
		switch window {
		case "7d":
			include = exp.DaysRemaining <= 7
		case "1m":
			include = exp.DaysRemaining <= 30
		case "3m":
			include = exp.DaysRemaining <= 90
		case "6m":
			include = exp.DaysRemaining <= 180
		case "1y":
			include = exp.DaysRemaining <= 365
		default:
			include = true
		}
		if include {
			filtered = append(filtered, exp)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    filtered,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": len(filtered),
		},
	})
}

// GET /api/v2/dashboard/expiry-summary
func (h *ExpiryHandler) GetExpirySummary(c *gin.Context) {
	shopID := c.Query("shop_id")

	// Mock data - replace with actual DB query
	now := time.Now()
	summaries := []ExpirySummary{
		{
			Window:      "7d",
			WindowLabel: "Next 7 Days",
			Count:       3,
			TotalValue:  12450.00,
			SampleBatches: []ExpiryAlert{
				{
					ProductName:   "SBL Arnica 30C",
					BatchNo:       "ARM-30C-2024",
					ExpiryDate:    now.AddDate(0, 0, 5),
					Quantity:      15,
					DaysRemaining: 5,
				},
			},
		},
		{
			Window:      "1m",
			WindowLabel: "Next 30 Days",
			Count:       12,
			TotalValue:  45320.00,
			SampleBatches: []ExpiryAlert{
				{
					ProductName:   "Reckeweg R1",
					BatchNo:       "R1-2024-01",
					ExpiryDate:    now.AddDate(0, 0, 25),
					Quantity:      8,
					DaysRemaining: 25,
				},
			},
		},
		{
			Window:      "3m",
			WindowLabel: "Next 3 Months",
			Count:       35,
			TotalValue:  128900.00,
			SampleBatches: []ExpiryAlert{
				{
					ProductName:   "Allen Arsenicum 200",
					BatchNo:       "ARS-200-2024",
					ExpiryDate:    now.AddDate(0, 2, 15),
					Quantity:      22,
					DaysRemaining: 75,
				},
			},
		},
		{
			Window:      "6m",
			WindowLabel: "Next 6 Months",
			Count:       78,
			TotalValue:  312450.00,
			SampleBatches: []ExpiryAlert{},
		},
		{
			Window:      "1y",
			WindowLabel: "Next 1 Year",
			Count:       145,
			TotalValue:  587200.00,
			SampleBatches: []ExpiryAlert{},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summaries,
	})
}

// POST /api/v2/inventory/expiry-alert
func (h *ExpiryHandler) CreateExpiryAlert(c *gin.Context) {
	var req struct {
		ProductID   string    `json:"product_id" binding:"required"`
		BatchNo     string    `json:"batch_no" binding:"required"`
		ExpiryDate  time.Time `json:"expiry_date" binding:"required"`
		Quantity    int       `json:"quantity" binding:"required"`
		ShopID      string    `json:"shop_id" binding:"required"`
		AlertBefore int       `json:"alert_before"` // days before expiry
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// TODO: Insert into expiry_alerts table
	// TODO: Publish to Kafka inventory.expiry.created

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Expiry alert created successfully",
	})
}

func NewExpiryHandler(db interface{}) *ExpiryHandler {
	return &ExpiryHandler{db: db}
}
