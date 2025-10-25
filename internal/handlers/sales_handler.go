package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type SalesHandler struct {
	salesService *services.SalesService
}

func NewSalesHandler(salesService *services.SalesService) *SalesHandler {
	return &SalesHandler{salesService: salesService}
}

func (h *SalesHandler) GetSales(c *gin.Context) {
	var filter services.SaleFilter

	// Parse query parameters
	if shopID := c.Query("shop_id"); shopID != "" {
		if id, err := strconv.ParseUint(shopID, 10, 32); err == nil {
			uintID := uint(id)
			filter.ShopID = &uintID
		}
	}

	if customerID := c.Query("customer_id"); customerID != "" {
		if id, err := strconv.ParseUint(customerID, 10, 32); err == nil {
			uintID := uint(id)
			filter.CustomerID = &uintID
		}
	}

	filter.SaleType = c.Query("sale_type")
	filter.PaymentStatus = c.Query("payment_status")
	filter.Search = c.Query("search")
	filter.Limit = parseInt(c.Query("limit"), 50)
	filter.Offset = parseInt(c.Query("offset"), 0)

	// Parse date filters
	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			filter.StartDate = &t
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			filter.EndDate = &t
		}
	}

	sales, total, err := h.salesService.GetSales(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
		"total":   total,
		"limit":   filter.Limit,
		"offset":  filter.Offset,
	})
}

func (h *SalesHandler) GetSale(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale ID"})
		return
	}

	sale, err := h.salesService.GetSale(uint(uintID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sale not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sale,
	})
}

func (h *SalesHandler) CreateSale(c *gin.Context) {
	var sale database.Sale
	if err := c.ShouldBindJSON(&sale); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	if sale.SaleDate.IsZero() {
		sale.SaleDate = time.Now()
	}
	if sale.PaymentStatus == "" {
		sale.PaymentStatus = "Pending"
	}

	if err := h.salesService.CreateSale(&sale); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    sale,
	})
}

func (h *SalesHandler) UpdateSale(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.salesService.UpdateSale(uint(uintID), updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Sale updated successfully",
	})
}

func (h *SalesHandler) ProcessReturn(c *gin.Context) {
	var request struct {
		SaleID     uint                `json:"sale_id" binding:"required"`
		ReturnItems []database.SaleItem `json:"return_items" binding:"required"`
		Reason     string              `json:"reason"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.salesService.ProcessReturn(request.SaleID, request.ReturnItems); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Return processed successfully",
	})
}
