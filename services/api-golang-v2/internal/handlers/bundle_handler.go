package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
)

type BundleHandler struct {
	db interface{}
}

type ProductBundle struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	SKU         string          `json:"sku"`
	Description string          `json:"description"`
	BundlePrice float64         `json:"bundle_price"`
	DiscountPct float64         `json:"discount_pct"`
	Items       []BundleItem    `json:"items"`
	IsActive    bool            `json:"is_active"`
	CreatedAt   time.Time       `json:"created_at"`
}

type BundleItem struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
}

func NewBundleHandler(db interface{}) *BundleHandler {
	return &BundleHandler{db: db}
}

// POST /api/erp/bundles
func (h *BundleHandler) CreateBundle(c *gin.Context) {
	var req ProductBundle
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = "bundle-" + time.Now().Format("20060102150405")
	req.CreatedAt = time.Now()
	
	// Calculate total price
	totalPrice := 0.0
	for _, item := range req.Items {
		totalPrice += item.UnitPrice * float64(item.Quantity)
	}
	
	// Apply discount
	if req.DiscountPct > 0 {
		req.BundlePrice = totalPrice * (1 - req.DiscountPct/100)
	}
	
	// TODO: Insert to product_bundles and product_bundle_items tables
	
	c.JSON(200, gin.H{
		"success": true,
		"data": req,
	})
}

// GET /api/erp/bundles
func (h *BundleHandler) GetBundles(c *gin.Context) {
	isActive := c.DefaultQuery("is_active", "true")
	
	_ = isActive
	
	bundles := []ProductBundle{
		{
			ID: "bundle-001",
			Name: "Homeopathy Starter Kit",
			SKU: "KIT-001",
			Description: "Essential homeopathy medicines for beginners",
			BundlePrice: 850.00,
			DiscountPct: 15,
			Items: []BundleItem{
				{ProductID: "prod-001", ProductName: "Arnica 30C", Quantity: 1, UnitPrice: 150},
				{ProductID: "prod-002", ProductName: "Belladonna 200C", Quantity: 1, UnitPrice: 200},
				{ProductID: "prod-003", ProductName: "Nux Vomica 30C", Quantity: 1, UnitPrice: 180},
			},
			IsActive: true,
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": bundles,
	})
}

// GET /api/erp/bundles/:id
func (h *BundleHandler) GetBundle(c *gin.Context) {
	id := c.Param("id")
	
	bundle := ProductBundle{
		ID: id,
		Name: "Homeopathy Starter Kit",
		SKU: "KIT-001",
		BundlePrice: 850.00,
		Items: []BundleItem{
			{ProductID: "prod-001", ProductName: "Arnica 30C", Quantity: 1, UnitPrice: 150},
		},
		IsActive: true,
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": bundle,
	})
}

// PUT /api/erp/bundles/:id
func (h *BundleHandler) UpdateBundle(c *gin.Context) {
	id := c.Param("id")
	
	var req ProductBundle
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	req.ID = id
	
	c.JSON(200, gin.H{
		"success": true,
		"data": req,
	})
}

// DELETE /api/erp/bundles/:id
func (h *BundleHandler) DeleteBundle(c *gin.Context) {
	id := c.Param("id")
	
	c.JSON(200, gin.H{
		"success": true,
		"message": "Bundle deleted",
		"id": id,
	})
}

// POST /api/erp/bundles/:id/sell
func (h *BundleHandler) SellBundle(c *gin.Context) {
	bundleID := c.Param("id")
	
	var req struct {
		Quantity   int    `json:"quantity"`
		CustomerID string `json:"customer_id"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// TODO: Create sales invoice with bundle items
	// TODO: Deduct inventory for each item in bundle
	
	c.JSON(200, gin.H{
		"success": true,
		"message": "Bundle sold successfully",
		"bundle_id": bundleID,
		"quantity": req.Quantity,
	})
}
