package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type PriceListHandler struct {
	priceListService *services.PriceListService
}

func NewPriceListHandler() *PriceListHandler {
	return &PriceListHandler{
		priceListService: services.NewPriceListService(),
	}
}

// ListPriceLists returns paginated list of price lists
func (h *PriceListHandler) ListPriceLists(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	priceLists, total, err := h.priceListService.ListPriceLists(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch price lists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"priceLists": priceLists,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPriceList returns a single price list by ID with items
func (h *PriceListHandler) GetPriceList(c *gin.Context) {
	id := c.Param("id")
	priceList, err := h.priceListService.GetPriceListByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Price list not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": priceList})
}

// CreatePriceList creates a new price list
func (h *PriceListHandler) CreatePriceList(c *gin.Context) {
	var priceList models.PriceList
	if err := c.ShouldBindJSON(&priceList); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.priceListService.CreatePriceList(&priceList); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price list"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": priceList})
}

// UpdatePriceList updates an existing price list
func (h *PriceListHandler) UpdatePriceList(c *gin.Context) {
	id := c.Param("id")
	var updates models.PriceList
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.priceListService.UpdatePriceList(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update price list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price list updated successfully"})
}

// DeletePriceList deletes a price list
func (h *PriceListHandler) DeletePriceList(c *gin.Context) {
	id := c.Param("id")
	if err := h.priceListService.DeletePriceList(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete price list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price list deleted successfully"})
}

// AddProductToPriceList adds a product to a price list
func (h *PriceListHandler) AddProductToPriceList(c *gin.Context) {
	priceListID := c.Param("id")
	var item models.ProductPriceListItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.PriceListID = priceListID
	if err := h.priceListService.AddProductToPriceList(&item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add product to price list"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Product added to price list successfully"})
}

// RemoveProductFromPriceList removes a product from a price list
func (h *PriceListHandler) RemoveProductFromPriceList(c *gin.Context) {
	priceListID := c.Param("id")
	productID := c.Param("productId")

	if err := h.priceListService.RemoveProductFromPriceList(priceListID, productID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove product from price list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product removed from price list successfully"})
}
