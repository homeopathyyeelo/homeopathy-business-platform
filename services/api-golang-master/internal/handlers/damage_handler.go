package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
)

type DamageHandler struct {
	db interface{}
}

type DamageEntry struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	BatchNo     string    `json:"batch_no"`
	Quantity    int       `json:"quantity"`
	Reason      string    `json:"reason"` // expired, damaged, obsolete, stolen
	Notes       string    `json:"notes"`
	ReportedBy  string    `json:"reported_by"`
	ShopID      string    `json:"shop_id"`
	DamageDate  time.Time `json:"damage_date"`
	CreatedAt   time.Time `json:"created_at"`
}

func NewDamageHandler(db interface{}) *DamageHandler {
	return &DamageHandler{db: db}
}

// POST /api/erp/inventory/damages
func (h *DamageHandler) CreateDamageEntry(c *gin.Context) {
	var req DamageEntry
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = "dmg-" + time.Now().Format("20060102150405")
	req.CreatedAt = time.Now()
	
	// TODO: Insert to inventory_damages table
	// TODO: Adjust stock: UPDATE inventory SET qty = qty - req.Quantity
	
	c.JSON(200, gin.H{
		"success": true,
		"data": req,
	})
}

// GET /api/erp/inventory/damages
func (h *DamageHandler) GetDamageEntries(c *gin.Context) {
	shopID := c.Query("shop_id")
	fromDate := c.Query("from_date")
	toDate := c.Query("to_date")
	
	_ = shopID
	_ = fromDate
	_ = toDate
	
	damages := []DamageEntry{
		{
			ID: "dmg-001",
			ProductID: "prod-123",
			ProductName: "Arnica 30C",
			BatchNo: "BATCH2024001",
			Quantity: 5,
			Reason: "expired",
			Notes: "Batch expired on 2024-10-15",
			ReportedBy: "Rajesh Kumar",
			DamageDate: time.Now().Add(-48 * time.Hour),
			CreatedAt: time.Now().Add(-48 * time.Hour),
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": damages,
	})
}

// GET /api/erp/inventory/damages/summary
func (h *DamageHandler) GetDamageSummary(c *gin.Context) {
	period := c.DefaultQuery("period", "current-month")
	
	summary := gin.H{
		"total_quantity": 25,
		"total_value": 3500.00,
		"by_reason": []gin.H{
			{"reason": "expired", "quantity": 15, "value": 2100.00},
			{"reason": "damaged", "quantity": 8, "value": 1200.00},
			{"reason": "obsolete", "quantity": 2, "value": 200.00},
		},
		"period": period,
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": summary,
	})
}

// DELETE /api/erp/inventory/damages/:id
func (h *DamageHandler) DeleteDamageEntry(c *gin.Context) {
	id := c.Param("id")
	
	// TODO: Delete from inventory_damages WHERE id = ?
	// TODO: Reverse stock adjustment if needed
	
	c.JSON(200, gin.H{
		"success": true,
		"message": "Damage entry deleted",
		"id": id,
	})
}
