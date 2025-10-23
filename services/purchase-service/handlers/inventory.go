package handlers

import (
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"purchase-service/models"
	"purchase-service/services"
)

// BulkUpdateBatches - Update inventory batches from GRN
func BulkUpdateBatches(c *gin.Context) {
	var req struct {
		Batches []models.InventoryBatchUpdate `json:"batches"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results := []gin.H{}

	for _, batch := range req.Batches {
		// Check if batch exists
		existing, err := services.FindBatch(batch.ShopID, batch.ProductID, batch.BatchNo)
		
		if err == nil && existing != nil {
			// Update existing batch
			existing.Quantity += batch.Qty
			existing.LandedCost = batch.LandedUnitCost
			existing.LastRestocked = time.Now()
			
			if err := services.UpdateBatch(existing); err != nil {
				results = append(results, gin.H{
					"product_id": batch.ProductID,
					"batch_no":   batch.BatchNo,
					"success":    false,
					"error":      err.Error(),
				})
				continue
			}

			// Publish inventory.restocked event
			event := &models.OutboxEvent{
				ID:            uuid.New().String(),
				AggregateType: "inventory",
				AggregateID:   existing.ID,
				EventType:     "inventory.restocked.v1",
				Payload: gin.H{
					"shop_id":    batch.ShopID,
					"product_id": batch.ProductID,
					"batch_no":   batch.BatchNo,
					"qty_added":  batch.Qty,
					"new_qty":    existing.Quantity,
				},
				CreatedAt: time.Now(),
			}
			services.PublishEvent(event)

			results = append(results, gin.H{
				"product_id": batch.ProductID,
				"batch_no":   batch.BatchNo,
				"success":    true,
				"action":     "updated",
				"new_qty":    existing.Quantity,
			})
		} else {
			// Create new batch
			newBatch := &models.InventoryBatch{
				ID:            uuid.New().String(),
				ShopID:        batch.ShopID,
				ProductID:     batch.ProductID,
				BatchNo:       batch.BatchNo,
				ExpiryDate:    batch.ExpiryDate,
				Quantity:      batch.Qty,
				Reserved:      0,
				Available:     batch.Qty,
				LandedCost:    batch.LandedUnitCost,
				LastRestocked: time.Now(),
				CreatedAt:     time.Now(),
			}

			if err := services.CreateBatch(newBatch); err != nil {
				results = append(results, gin.H{
					"product_id": batch.ProductID,
					"batch_no":   batch.BatchNo,
					"success":    false,
					"error":      err.Error(),
				})
				continue
			}

			// Publish event
			event := &models.OutboxEvent{
				ID:            uuid.New().String(),
				AggregateType: "inventory",
				AggregateID:   newBatch.ID,
				EventType:     "inventory.batch.created.v1",
				Payload:       newBatch,
				CreatedAt:     time.Now(),
			}
			services.PublishEvent(event)

			results = append(results, gin.H{
				"product_id": batch.ProductID,
				"batch_no":   batch.BatchNo,
				"success":    true,
				"action":     "created",
				"qty":        batch.Qty,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
		"total":   len(results),
	})
}

// GetProductStock - Get total stock for a product across all batches
func GetProductStock(c *gin.Context) {
	productID := c.Param("product_id")
	shopID := c.Query("shop_id")

	batches, err := services.GetProductBatches(shopID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get batches"})
		return
	}

	totalQty := 0.0
	totalReserved := 0.0
	totalAvailable := 0.0

	for _, batch := range batches {
		totalQty += batch.Quantity
		totalReserved += batch.Reserved
		totalAvailable += batch.Available
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"product_id":      productID,
			"shop_id":         shopID,
			"total_quantity":  totalQty,
			"total_reserved":  totalReserved,
			"total_available": totalAvailable,
			"batches":         batches,
			"batch_count":     len(batches),
		},
	})
}

// GetExpiringBatches - Get batches expiring soon
func GetExpiringBatches(c *gin.Context) {
	shopID := c.Query("shop_id")
	days := c.DefaultQuery("days", "90") // Default 90 days

	batches, err := services.GetExpiringBatches(shopID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expiring batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"total":   len(batches),
	})
}

// ListBatches - List all inventory batches
func ListBatches(c *gin.Context) {
	shopID := c.Query("shop_id")
	productID := c.Query("product_id")

	batches, err := services.ListBatches(shopID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"total":   len(batches),
	})
}

// GetBatch - Get single batch
func GetBatch(c *gin.Context) {
	batchID := c.Param("id")

	batch, err := services.GetBatchByID(batchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batch,
	})
}

// CreateBatch - Create new inventory batch
func CreateBatch(c *gin.Context) {
	var batch models.InventoryBatch
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	batch.ID = uuid.New().String()
	batch.Available = batch.Quantity - batch.Reserved
	batch.CreatedAt = time.Now()

	if err := services.CreateBatch(&batch); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    batch,
	})
}

// UpdateBatch - Update inventory batch
func UpdateBatch(c *gin.Context) {
	batchID := c.Param("id")

	batch, err := services.GetBatchByID(batchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}

	if err := c.ShouldBindJSON(batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	batch.Available = batch.Quantity - batch.Reserved

	if err := services.UpdateBatch(batch); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update batch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batch,
	})
}
