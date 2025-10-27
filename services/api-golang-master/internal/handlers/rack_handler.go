package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type RackHandler struct {
	rackService *services.RackService
}

func NewRackHandler() *RackHandler {
	return &RackHandler{
		rackService: services.NewRackService(),
	}
}

// ListRacks returns paginated list of racks
func (h *RackHandler) ListRacks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	rackType := c.Query("rackType")

	racks, total, err := h.rackService.ListRacks(page, limit, search, rackType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch racks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"racks": racks,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetRack returns a single rack by ID
func (h *RackHandler) GetRack(c *gin.Context) {
	id := c.Param("id")
	rack, err := h.rackService.GetRackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rack not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rack})
}

// CreateRack creates a new rack
func (h *RackHandler) CreateRack(c *gin.Context) {
	var rack models.Rack
	if err := c.ShouldBindJSON(&rack); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.rackService.CreateRack(&rack); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create rack"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": rack})
}

// UpdateRack updates an existing rack
func (h *RackHandler) UpdateRack(c *gin.Context) {
	id := c.Param("id")
	var updates models.Rack
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.rackService.UpdateRack(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rack"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rack updated successfully"})
}

// DeleteRack deletes a rack
func (h *RackHandler) DeleteRack(c *gin.Context) {
	id := c.Param("id")
	if err := h.rackService.DeleteRack(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rack"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rack deleted successfully"})
}
