package handlers

import (
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"purchase-service/models"
	"purchase-service/services"
)

// CreateGRN - Create Goods Receipt Note from parsed invoice
func CreateGRN(c *gin.Context) {
	var req models.CreateGRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create GRN
	grn := &models.GRN{
		ID:              uuid.New().String(),
		ReceiptNumber:   generateReceiptNumber(),
		ParsedInvoiceID: req.ParsedInvoiceID,
		VendorID:        req.VendorID,
		ShopID:          req.ShopID,
		ReceiptDate:     time.Now(),
		TotalAmount:     req.TotalAmount,
		TaxAmount:       req.TaxAmount,
		DiscountAmount:  req.DiscountAmount,
		GrandTotal:      req.GrandTotal,
		Status:          "draft",
		CreatedBy:       req.CreatedBy,
		CreatedAt:       time.Now(),
	}

	// Save GRN
	if err := services.SaveGRN(grn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GRN"})
		return
	}

	// Create GRN Lines
	for _, line := range req.Lines {
		grnLine := &models.GRNLine{
			ID:              uuid.New().String(),
			ReceiptID:       grn.ID,
			ProductID:       line.ProductID,
			BatchNo:         line.BatchNo,
			ExpiryDate:      line.ExpiryDate,
			Qty:             line.Qty,
			UnitCost:        line.UnitCost,
			DiscountAmount:  line.DiscountAmount,
			TaxRate:         line.TaxRate,
			TaxAmount:       line.TaxAmount,
			LandedUnitCost:  line.LandedUnitCost,
			LineTotal:       line.LineTotal,
		}

		if err := services.SaveGRNLine(grnLine); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GRN line"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    grn,
		"message": "GRN created successfully",
	})
}

// ConfirmGRN - Confirm GRN and update inventory
func ConfirmGRN(c *gin.Context) {
	grnID := c.Param("id")
	
	var req struct {
		ApprovedBy string `json:"approved_by"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get GRN
	grn, err := services.GetGRNByID(grnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "GRN not found"})
		return
	}

	if grn.Status != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "GRN already confirmed"})
		return
	}

	// Get GRN Lines
	lines, err := services.GetGRNLines(grnID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get GRN lines"})
		return
	}

	// Update inventory for each line
	for _, line := range lines {
		if err := services.UpdateInventoryBatch(line); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory"})
			return
		}
	}

	// Update GRN status
	grn.Status = "confirmed"
	grn.ApprovedBy = &req.ApprovedBy
	now := time.Now()
	grn.ApprovedAt = &now

	if err := services.UpdateGRN(grn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update GRN"})
		return
	}

	// Publish outbox event
	event := &models.OutboxEvent{
		ID:            uuid.New().String(),
		AggregateType: "purchase_receipt",
		AggregateID:   grn.ID,
		EventType:     "purchase.receipt.created.v1",
		Payload:       grn,
		CreatedAt:     time.Now(),
	}
	services.PublishEvent(event)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grn,
		"message": "GRN confirmed and inventory updated",
	})
}

// PostGRN - Post GRN to accounting
func PostGRN(c *gin.Context) {
	grnID := c.Param("id")

	grn, err := services.GetGRNByID(grnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "GRN not found"})
		return
	}

	if grn.Status != "confirmed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "GRN must be confirmed first"})
		return
	}

	// Create accounting entries
	if err := services.CreateAccountingEntries(grn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create accounting entries"})
		return
	}

	// Update status
	grn.Status = "posted"
	now := time.Now()
	grn.PostedAt = &now

	if err := services.UpdateGRN(grn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update GRN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grn,
		"message": "GRN posted to accounting",
	})
}

// ListGRN - List all GRNs with filters
func ListGRN(c *gin.Context) {
	shopID := c.Query("shop_id")
	vendorID := c.Query("vendor_id")
	status := c.Query("status")

	grns, err := services.ListGRNs(shopID, vendorID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list GRNs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grns,
		"total":   len(grns),
	})
}

// GetGRN - Get single GRN with lines
func GetGRN(c *gin.Context) {
	grnID := c.Param("id")

	grn, err := services.GetGRNByID(grnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "GRN not found"})
		return
	}

	lines, err := services.GetGRNLines(grnID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get GRN lines"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"grn":   grn,
			"lines": lines,
		},
	})
}

// UpdateGRN - Update GRN (only if draft)
func UpdateGRN(c *gin.Context) {
	grnID := c.Param("id")

	grn, err := services.GetGRNByID(grnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "GRN not found"})
		return
	}

	if grn.Status != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot update confirmed GRN"})
		return
	}

	if err := c.ShouldBindJSON(grn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.UpdateGRN(grn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update GRN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    grn,
	})
}

// DeleteGRN - Delete GRN (only if draft)
func DeleteGRN(c *gin.Context) {
	grnID := c.Param("id")

	grn, err := services.GetGRNByID(grnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "GRN not found"})
		return
	}

	if grn.Status != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete confirmed GRN"})
		return
	}

	if err := services.DeleteGRN(grnID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete GRN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "GRN deleted successfully",
	})
}

func generateReceiptNumber() string {
	return "GRN-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:8]
}
