package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
)

type EstimateHandler struct {
	db interface{}
}

type Estimate struct {
	ID           string    `json:"id"`
	EstimateNo   string    `json:"estimate_no"`
	CustomerID   string    `json:"customer_id"`
	CustomerName string    `json:"customer_name"`
	Items        []gin.H   `json:"items"`
	SubTotal     float64   `json:"sub_total"`
	Tax          float64   `json:"tax"`
	Discount     float64   `json:"discount"`
	Total        float64   `json:"total"`
	ValidUntil   time.Time `json:"valid_until"`
	Status       string    `json:"status"` // draft, sent, accepted, rejected, converted
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
}

func NewEstimateHandler(db interface{}) *EstimateHandler {
	return &EstimateHandler{db: db}
}

// POST /api/erp/estimates
func (h *EstimateHandler) CreateEstimate(c *gin.Context) {
	var req Estimate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = "est-" + time.Now().Format("20060102150405")
	req.EstimateNo = "EST-" + time.Now().Format("2006-") + "001"
	req.Status = "draft"
	req.ValidUntil = time.Now().AddDate(0, 0, 7) // 7 days
	req.CreatedAt = time.Now()
	
	c.JSON(200, gin.H{
		"success": true,
		"data": req,
	})
}

// GET /api/erp/estimates
func (h *EstimateHandler) GetEstimates(c *gin.Context) {
	status := c.Query("status")
	_ = status
	
	estimates := []Estimate{
		{
			ID: "est-001",
			EstimateNo: "EST-2024-001",
			CustomerName: "Rajesh Medical",
			Total: 5500,
			Status: "sent",
			ValidUntil: time.Now().AddDate(0, 0, 5),
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": estimates,
	})
}

// POST /api/erp/estimates/:id/convert
func (h *EstimateHandler) ConvertToInvoice(c *gin.Context) {
	estimateID := c.Param("id")
	
	invoice := gin.H{
		"id": "inv-" + time.Now().Format("20060102150405"),
		"invoice_no": "INV-2024-" + time.Now().Format("150405"),
		"estimate_id": estimateID,
		"total": 5500,
		"created_at": time.Now(),
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": invoice,
		"message": "Estimate converted to invoice",
	})
}

// PUT /api/erp/estimates/:id/status
func (h *EstimateHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	
	var req struct {
		Status string `json:"status"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"id": id,
		"status": req.Status,
	})
}
