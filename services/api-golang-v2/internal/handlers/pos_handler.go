package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
)

type POSHandler struct {
	db interface{}
}

type HoldBill struct {
	ID          string    `json:"id"`
	CounterID   string    `json:"counter_id"`
	Items       []gin.H   `json:"items"`
	SubTotal    float64   `json:"sub_total"`
	Tax         float64   `json:"tax"`
	Total       float64   `json:"total"`
	CustomerID  string    `json:"customer_id"`
	Notes       string    `json:"notes"`
	HeldBy      string    `json:"held_by"`
	HeldAt      time.Time `json:"held_at"`
}

func NewPOSHandler(db interface{}) *POSHandler {
	return &POSHandler{db: db}
}

// POST /api/erp/pos/hold
func (h *POSHandler) HoldBill(c *gin.Context) {
	var req HoldBill
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = "hold-" + time.Now().Format("20060102150405")
	req.HeldAt = time.Now()
	
	c.JSON(200, gin.H{
		"success": true,
		"data": req,
	})
}

// GET /api/erp/pos/held-bills
func (h *POSHandler) GetHeldBills(c *gin.Context) {
	counterID := c.Query("counter_id")
	_ = counterID
	
	bills := []HoldBill{
		{
			ID: "hold-001",
			CounterID: "counter-1",
			SubTotal: 1500,
			Tax: 270,
			Total: 1770,
			HeldBy: "Rajesh",
			HeldAt: time.Now().Add(-30 * time.Minute),
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": bills,
	})
}

// POST /api/erp/pos/resume/:id
func (h *POSHandler) ResumeBill(c *gin.Context) {
	id := c.Param("id")
	
	bill := HoldBill{
		ID: id,
		Items: []gin.H{},
		Total: 1770,
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": bill,
	})
}

// DELETE /api/erp/pos/held-bills/:id
func (h *POSHandler) DeleteHeldBill(c *gin.Context) {
	id := c.Param("id")
	
	c.JSON(200, gin.H{
		"success": true,
		"message": "Held bill deleted",
		"id": id,
	})
}

// GET /api/erp/pos/counters
func (h *POSHandler) GetCounters(c *gin.Context) {
	counters := []gin.H{
		{
			"id": "counter-001",
			"name": "Main Counter",
			"status": "connected",
			"lastActivity": time.Now().Format(time.RFC3339),
			"currentBill": "BILL-2024-001",
			"operator": "Rajesh Kumar",
			"ipAddress": "192.168.1.101",
			"syncStatus": "synced",
		},
		{
			"id": "counter-002",
			"name": "Counter 2",
			"status": "connected",
			"lastActivity": time.Now().Add(-30 * time.Second).Format(time.RFC3339),
			"operator": "Priya Sharma",
			"ipAddress": "192.168.1.102",
			"syncStatus": "synced",
		},
		{
			"id": "counter-003",
			"name": "Mobile POS",
			"status": "disconnected",
			"lastActivity": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
			"operator": "Amit Patel",
			"ipAddress": "192.168.1.103",
			"syncStatus": "pending",
			"batteryLevel": 45,
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": counters,
	})
}

// POST /api/erp/pos/counters/register
func (h *POSHandler) RegisterCounter(c *gin.Context) {
	var req struct {
		CounterID string `json:"counter_id"`
		UserID    string `json:"user_id"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"message": "Counter registered",
		"counter_id": req.CounterID,
	})
}
