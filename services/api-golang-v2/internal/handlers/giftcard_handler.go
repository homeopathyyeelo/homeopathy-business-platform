package handlers

import (
	"math/rand"
	"time"
	"github.com/gin-gonic/gin"
)

type GiftCardHandler struct {
	db interface{}
}

func NewGiftCardHandler(db interface{}) *GiftCardHandler {
	return &GiftCardHandler{db: db}
}

func (h *GiftCardHandler) Create(c *gin.Context) {
	var req struct {
		Amount float64 `json:"amount"`
	}
	c.ShouldBindJSON(&req)
	
	code := generateCode()
	
	c.JSON(200, gin.H{
		"success": true,
		"code": code,
		"amount": req.Amount,
	})
}

func (h *GiftCardHandler) Redeem(c *gin.Context) {
	var req struct {
		Code string `json:"code"`
	}
	c.ShouldBindJSON(&req)
	
	c.JSON(200, gin.H{
		"success": true,
		"amount": 500.00,
	})
}

func generateCode() string {
	rand.Seed(time.Now().UnixNano())
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 12)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}
