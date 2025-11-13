package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// HSN Codes Handlers

// GET /api/erp/hsn-codes
func (h *ProductHandler) GetHSNCodes(c *gin.Context) {
	var hsnCodes []MasterData
	result := h.db.Table("hsn_codes").Order("code ASC").Find(&hsnCodes)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch HSN codes: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    hsnCodes,
	})
}

// POST /api/erp/hsn-codes
func (h *ProductHandler) CreateHSNCode(c *gin.Context) {
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	if err := h.db.Table("hsn_codes").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "HSN code created"})
}

// PUT /api/erp/hsn-codes/:id
func (h *ProductHandler) UpdateHSNCode(c *gin.Context) {
	id := c.Param("id")
	var req MasterData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("hsn_codes").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "HSN code updated"})
}

// DELETE /api/erp/hsn-codes/:id
func (h *ProductHandler) DeleteHSNCode(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Table("hsn_codes").Where("id = ?", id).Delete(&MasterData{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "HSN code deleted"})
}

// POS Counters Handlers

type POSCounter struct {
	ID              string    `json:"id" gorm:"type:uuid;primaryKey"`
	CounterName     string    `json:"counter_name"`
	CounterNumber   string    `json:"counter_number"`
	Location        string    `json:"location"`
	AssignedUserID  string    `json:"assigned_user_id" gorm:"type:uuid"`
	Status          string    `json:"status"`
	OpeningBalance  float64   `json:"opening_balance"`
	ClosingBalance  float64   `json:"closing_balance"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// GET /api/erp/pos/counters
func (h *ProductHandler) GetPOSCounters(c *gin.Context) {
	var counters []POSCounter
	result := h.db.Table("pos_counters").Where("is_active = ?", true).Order("counter_name ASC").Find(&counters)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch POS counters: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    counters,
	})
}

// POST /api/erp/pos/counters
func (h *ProductHandler) CreatePOSCounter(c *gin.Context) {
	var req POSCounter
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.ID = uuid.New().String()
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()
	req.IsActive = true
	req.Status = "active"
	if err := h.db.Table("pos_counters").Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": req, "message": "POS counter created"})
}

// PUT /api/erp/pos/counters/:id
func (h *ProductHandler) UpdatePOSCounter(c *gin.Context) {
	id := c.Param("id")
	var req POSCounter
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.db.Table("pos_counters").Where("id = ?", id).Updates(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "POS counter updated"})
}
