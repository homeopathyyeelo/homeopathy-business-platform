package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type CustomerGroupHandler struct {
	customerGroupService *services.CustomerGroupService
}

func NewCustomerGroupHandler() *CustomerGroupHandler {
	return &CustomerGroupHandler{
		customerGroupService: services.NewCustomerGroupService(),
	}
}

// ListCustomerGroups returns paginated list of customer groups
func (h *CustomerGroupHandler) ListCustomerGroups(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	customerGroups, total, err := h.customerGroupService.ListCustomerGroups(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customer groups"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customerGroups": customerGroups,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetCustomerGroup returns a single customer group by ID
func (h *CustomerGroupHandler) GetCustomerGroup(c *gin.Context) {
	id := c.Param("id")
	customerGroup, err := h.customerGroupService.GetCustomerGroupByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer group not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": customerGroup})
}

// CreateCustomerGroup creates a new customer group
func (h *CustomerGroupHandler) CreateCustomerGroup(c *gin.Context) {
	var customerGroup models.CustomerGroup
	if err := c.ShouldBindJSON(&customerGroup); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.customerGroupService.CreateCustomerGroup(&customerGroup); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer group"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": customerGroup})
}

// UpdateCustomerGroup updates an existing customer group
func (h *CustomerGroupHandler) UpdateCustomerGroup(c *gin.Context) {
	id := c.Param("id")
	var updates models.CustomerGroup
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.customerGroupService.UpdateCustomerGroup(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer group updated successfully"})
}

// DeleteCustomerGroup deletes a customer group
func (h *CustomerGroupHandler) DeleteCustomerGroup(c *gin.Context) {
	id := c.Param("id")
	if err := h.customerGroupService.DeleteCustomerGroup(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer group deleted successfully"})
}

// GetCustomerGroups is an alias for ListCustomerGroups
func (h *CustomerGroupHandler) GetCustomerGroups(c *gin.Context) {
	h.ListCustomerGroups(c)
}
