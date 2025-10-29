package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type HSNCodeHandler struct {
	hsnCodeService *services.HSNCodeService
}

func NewHSNCodeHandler() *HSNCodeHandler {
	return &HSNCodeHandler{
		hsnCodeService: services.NewHSNCodeService(),
	}
}

// ListHSNCodes returns paginated list of HSN codes
func (h *HSNCodeHandler) ListHSNCodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	hsnCodes, total, err := h.hsnCodeService.ListHSNCodes(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch HSN codes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hsnCodes": hsnCodes,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetHSNCode returns a single HSN code by ID
func (h *HSNCodeHandler) GetHSNCode(c *gin.Context) {
	id := c.Param("id")
	hsnCode, err := h.hsnCodeService.GetHSNCodeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "HSN code not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": hsnCode})
}

// CreateHSNCode creates a new HSN code
func (h *HSNCodeHandler) CreateHSNCode(c *gin.Context) {
	var hsnCode models.HSNCode
	if err := c.ShouldBindJSON(&hsnCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.hsnCodeService.CreateHSNCode(&hsnCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create HSN code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": hsnCode})
}

// UpdateHSNCode updates an existing HSN code
func (h *HSNCodeHandler) UpdateHSNCode(c *gin.Context) {
	id := c.Param("id")
	var updates models.HSNCode
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.hsnCodeService.UpdateHSNCode(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update HSN code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "HSN code updated successfully"})
}

// DeleteHSNCode deletes an HSN code
func (h *HSNCodeHandler) DeleteHSNCode(c *gin.Context) {
	id := c.Param("id")
	if err := h.hsnCodeService.DeleteHSNCode(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete HSN code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "HSN code deleted successfully"})
}

// GetHSNCodes is an alias for ListHSNCodes
func (h *HSNCodeHandler) GetHSNCodes(c *gin.Context) {
	h.ListHSNCodes(c)
}
