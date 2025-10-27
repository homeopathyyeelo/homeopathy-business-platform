package handlers

import (
	"time"
	"github.com/gin-gonic/gin"
)

type ExpenseHandler struct {
	db interface{}
}

func NewExpenseHandler(db interface{}) *ExpenseHandler {
	return &ExpenseHandler{db: db}
}

func (h *ExpenseHandler) Create(c *gin.Context) {
	var req struct {
		Category string  `json:"category"`
		Amount   float64 `json:"amount"`
		Date     string  `json:"date"`
		Notes    string  `json:"notes"`
	}
	c.ShouldBindJSON(&req)
	
	c.JSON(200, gin.H{
		"success": true,
		"id": "exp-" + time.Now().Format("20060102150405"),
	})
}

func (h *ExpenseHandler) List(c *gin.Context) {
	expenses := []gin.H{
		{"id": "exp-001", "category": "Rent", "amount": 15000, "date": "2024-10-01"},
		{"id": "exp-002", "category": "Electricity", "amount": 2500, "date": "2024-10-05"},
	}
	
	c.JSON(200, gin.H{
		"success": true,
		"data": expenses,
	})
}
