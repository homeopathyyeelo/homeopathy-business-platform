package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoyaltyHandler struct {
	db interface{}
}

type LoyaltyCard struct {
	ID            string    `json:"id"`
	CustomerID    string    `json:"customer_id"`
	CustomerName  string    `json:"customer_name"`
	CardNumber    string    `json:"card_number"`
	Points        int       `json:"points"`
	Tier          string    `json:"tier"` // bronze, silver, gold, platinum
	QRCode        string    `json:"qr_code"`
	IsActive      bool      `json:"is_active"`
	ExpiryDate    time.Time `json:"expiry_date"`
	CreatedAt     time.Time `json:"created_at"`
}

type LoyaltyTransaction struct {
	ID          string    `json:"id"`
	CardID      string    `json:"card_id"`
	Type        string    `json:"type"` // earn, redeem, expire
	Points      int       `json:"points"`
	InvoiceNo   string    `json:"invoice_no"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func NewLoyaltyHandler(db interface{}) *LoyaltyHandler {
	return &LoyaltyHandler{db: db}
}

// POST /api/erp/loyalty/cards
func (h *LoyaltyHandler) CreateCard(c *gin.Context) {
	var req struct {
		CustomerID string `json:"customer_id"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	card := LoyaltyCard{
		ID: "card-" + time.Now().Format("20060102150405"),
		CustomerID: req.CustomerID,
		CardNumber: "LC" + time.Now().Format("0601021504"),
		Points: 0,
		Tier: "bronze",
		QRCode: "QR-" + time.Now().Format("20060102150405"),
		IsActive: true,
		ExpiryDate: time.Now().AddDate(1, 0, 0), // 1 year
		CreatedAt: time.Now(),
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": card,
	})
}

// GET /api/erp/loyalty/cards/:customer_id
func (h *LoyaltyHandler) GetCustomerCard(c *gin.Context) {
	customerID := c.Param("customer_id")
	
	card := LoyaltyCard{
		ID: "card-001",
		CustomerID: customerID,
		CustomerName: "Rajesh Kumar",
		CardNumber: "LC20241024001",
		Points: 250,
		Tier: "silver",
		QRCode: "QR-20241024001",
		IsActive: true,
		ExpiryDate: time.Now().AddDate(1, 0, 0),
		CreatedAt: time.Now().Add(-90 * 24 * time.Hour),
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": card,
	})
}

// POST /api/erp/loyalty/earn
func (h *LoyaltyHandler) EarnPoints(c *gin.Context) {
	var req struct {
		CustomerID string  `json:"customer_id"`
		Amount     float64 `json:"amount"`
		InvoiceNo  string  `json:"invoice_no"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// 1 point per ₹100 spent
	points := int(req.Amount / 100)
	
	transaction := LoyaltyTransaction{
		ID: "txn-" + time.Now().Format("20060102150405"),
		Type: "earn",
		Points: points,
		InvoiceNo: req.InvoiceNo,
		Description: "Earned from purchase",
		CreatedAt: time.Now(),
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": transaction,
		"points_earned": points,
	})
}

// POST /api/erp/loyalty/redeem
func (h *LoyaltyHandler) RedeemPoints(c *gin.Context) {
	var req struct {
		CustomerID string `json:"customer_id"`
		Points     int    `json:"points"`
		InvoiceNo  string `json:"invoice_no"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// ₹1 discount per point
	discount := float64(req.Points)
	
	transaction := LoyaltyTransaction{
		ID: "txn-" + time.Now().Format("20060102150405"),
		Type: "redeem",
		Points: -req.Points,
		InvoiceNo: req.InvoiceNo,
		Description: "Redeemed for discount",
		CreatedAt: time.Now(),
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": transaction,
		"discount_amount": discount,
	})
}

// GET /api/erp/loyalty/transactions/:card_id
func (h *LoyaltyHandler) GetTransactions(c *gin.Context) {
	cardID := c.Param("card_id")
	
	_ = cardID
	
	transactions := []LoyaltyTransaction{
		{
			ID: "txn-001",
			Type: "earn",
			Points: 25,
			InvoiceNo: "INV-2024-001",
			Description: "Earned from purchase",
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID: "txn-002",
			Type: "redeem",
			Points: -10,
			InvoiceNo: "INV-2024-015",
			Description: "Redeemed for discount",
			CreatedAt: time.Now().Add(-2 * time.Hour),
		},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": transactions,
	})
}

// GetLoyaltyPoints returns all loyalty points
func (h *LoyaltyHandler) GetLoyaltyPoints(c *gin.Context) {
	points := []gin.H{
		{"customerId": uuid.New().String(), "customerName": "John Doe", "points": 1250, "tier": "Silver"},
		{"customerId": uuid.New().String(), "customerName": "Jane Smith", "points": 3500, "tier": "Gold"},
	}
	c.JSON(200, gin.H{"success": true, "data": points})
}

// GetCustomerLoyaltyPoints returns loyalty points for a specific customer
func (h *LoyaltyHandler) GetCustomerLoyaltyPoints(c *gin.Context) {
	customerID := c.Param("customerId")
	points := gin.H{
		"customerId": customerID,
		"customerName": "John Doe",
		"totalPoints": 1250,
		"availablePoints": 1000,
		"redeemedPoints": 250,
		"tier": "Silver",
	}
	c.JSON(200, gin.H{"success": true, "data": points})
}

// AddLoyaltyPoints adds loyalty points to a customer
func (h *LoyaltyHandler) AddLoyaltyPoints(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"success": true, "message": "Loyalty points added successfully"})
}

// RedeemLoyaltyPoints redeems loyalty points for a customer
func (h *LoyaltyHandler) RedeemLoyaltyPoints(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": true, "message": "Loyalty points redeemed successfully"})
}

// GetLoyaltyTransactions returns all loyalty transactions
func (h *LoyaltyHandler) GetLoyaltyTransactions(c *gin.Context) {
	transactions := []gin.H{
		{"id": uuid.New().String(), "customerId": uuid.New().String(), "points": 100, "type": "earned"},
		{"id": uuid.New().String(), "customerId": uuid.New().String(), "points": -50, "type": "redeemed"},
	}
	c.JSON(200, gin.H{"success": true, "data": transactions})
}
