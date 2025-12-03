package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BatchBarcodeHandler struct {
	db *gorm.DB
}

func NewBatchBarcodeHandler(db *gorm.DB) *BatchBarcodeHandler {
	return &BatchBarcodeHandler{db: db}
}

// CreateBatch - POST /api/erp/inventory/batches
// Creates new batch with optional barcode generation
func (h *BatchBarcodeHandler) CreateBatch(c *gin.Context) {
	var req struct {
		ProductID         string    `json:"product_id" binding:"required"`
		BatchNumber       string    `json:"batch_number" binding:"required"`
		Quantity          float64   `json:"quantity" binding:"required"`
		UnitCost          float64   `json:"unit_cost"`
		SellingPrice      float64   `json:"selling_price"`
		MRP               float64   `json:"mrp"`
		ExpiryDate        time.Time `json:"expiry_date"`
		ManufacturingDate time.Time `json:"manufacturing_date"`
		GenerateBarcode   bool      `json:"generate_barcode"` // Option 2: batch-level barcode
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get product info for barcode generation
	var product struct {
		ID      string
		SKU     string
		Barcode string
		Name    string
	}
	if err := h.db.Table("products").Select("id, sku, barcode, name").
		Where("id = ?", req.ProductID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Create batch record
	batch := map[string]interface{}{
		"id":                 uuid.New().String(),
		"product_id":         req.ProductID,
		"batch_number":       req.BatchNumber,
		"quantity":           req.Quantity,
		"available_quantity": req.Quantity,
		"unit_cost":          req.UnitCost,
		"selling_price":      req.SellingPrice,
		"mrp":                req.MRP,
		"expiry_date":        req.ExpiryDate,
		"manufacturing_date": req.ManufacturingDate,
		"is_active":          true,
		"created_at":         time.Now(),
	}

	// Option 2: Generate unique barcode for this batch
	if req.GenerateBarcode {
		// Format: PRODUCTSKU-BATCHNUMBER (e.g., SULPH30-B001)
		batchBarcode := fmt.Sprintf("%s-%s", product.SKU, req.BatchNumber)
		batch["batch_barcode"] = batchBarcode
	}

	if err := h.db.Table("inventory_batches").Create(batch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    batch,
		"message": "Batch created successfully",
	})
}

// GetBatchesByProduct - GET /api/erp/products/:id/batches
// Returns all batches for a product sorted by FEFO
func (h *BatchBarcodeHandler) GetBatchesByProduct(c *gin.Context) {
	productID := c.Param("id")

	var batches []map[string]interface{}
	query := h.db.Table("inventory_batches").
		Where("product_id = ? AND is_active = true AND available_quantity > 0", productID).
		Order("expiry_date ASC") // FEFO - First Expiry First Out

	if err := query.Find(&batches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"count":   len(batches),
	})
}

// AllocateBatch - POST /api/erp/inventory/batches/allocate
// Smart batch allocation for billing (FEFO strategy)
func (h *BatchBarcodeHandler) AllocateBatch(c *gin.Context) {
	var req struct {
		ProductID string  `json:"product_id" binding:"required"`
		Quantity  float64 `json:"quantity" binding:"required"`
		Strategy  string  `json:"strategy"` // "fefo", "fifo", "manual"
		BatchID   string  `json:"batch_id"` // For manual selection
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	strategy := req.Strategy
	if strategy == "" {
		strategy = "fefo" // Default
	}

	var allocations []map[string]interface{}
	remainingQty := req.Quantity

	if strategy == "manual" && req.BatchID != "" {
		// User selected specific batch
		var batch struct {
			ID                string
			BatchNumber       string
			AvailableQuantity float64
			SellingPrice      float64
			ExpiryDate        time.Time
		}
		if err := h.db.Table("inventory_batches").
			Where("id = ? AND product_id = ? AND is_active = true", req.BatchID, req.ProductID).
			First(&batch).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
			return
		}

		if batch.AvailableQuantity < remainingQty {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient quantity in selected batch"})
			return
		}

		allocations = append(allocations, map[string]interface{}{
			"batch_id":      batch.ID,
			"batch_number":  batch.BatchNumber,
			"quantity":      remainingQty,
			"selling_price": batch.SellingPrice,
			"expiry_date":   batch.ExpiryDate,
		})
	} else {
		// Auto-allocate using FEFO/FIFO
		var batches []struct {
			ID                string
			BatchNumber       string
			AvailableQuantity float64
			SellingPrice      float64
			ExpiryDate        time.Time
			CreatedAt         time.Time
		}

		orderBy := "expiry_date ASC" // FEFO
		if strategy == "fifo" {
			orderBy = "created_at ASC" // FIFO
		}

		if err := h.db.Table("inventory_batches").
			Where("product_id = ? AND is_active = true AND available_quantity > 0", req.ProductID).
			Order(orderBy).
			Find(&batches).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
			return
		}

		// Allocate across multiple batches if needed
		for _, batch := range batches {
			if remainingQty <= 0 {
				break
			}

			allocQty := remainingQty
			if batch.AvailableQuantity < allocQty {
				allocQty = batch.AvailableQuantity
			}

			allocations = append(allocations, map[string]interface{}{
				"batch_id":      batch.ID,
				"batch_number":  batch.BatchNumber,
				"quantity":      allocQty,
				"selling_price": batch.SellingPrice,
				"expiry_date":   batch.ExpiryDate,
			})

			remainingQty -= allocQty
		}

		if remainingQty > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":     "Insufficient stock",
				"requested": req.Quantity,
				"available": req.Quantity - remainingQty,
				"short_by":  remainingQty,
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"allocations": allocations,
		"strategy":    strategy,
	})
}

// GetAllBatches - GET /api/erp/products/batches
// Returns all inventory batches with product details, filtering, and pagination
func (h *BatchBarcodeHandler) GetAllBatches(c *gin.Context) {
	// Query parameters
	search := c.Query("search")
	status := c.DefaultQuery("status", "all") // all, active, expired, low_stock
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	type BatchResult struct {
		ID                string     `json:"id"`
		ProductID         string     `json:"product_id"`
		ProductName       string     `json:"product_name"`
		SKU               string     `json:"sku"`
		Barcode           string     `json:"barcode"`
		CategoryName      string     `json:"category_name"`
		BrandName         string     `json:"brand_name"`
		BatchNumber       string     `json:"batch_number"`
		Quantity          float64    `json:"quantity"`
		AvailableQuantity float64    `json:"available_quantity"`
		UnitCost          float64    `json:"unit_cost"`
		SellingPrice      float64    `json:"selling_price"`
		MRP               float64    `json:"mrp"`
		ExpiryDate        *time.Time `json:"expiry_date"`
		ManufacturingDate *time.Time `json:"manufacturing_date"`
		Location          string     `json:"location"`
		IsActive          bool       `json:"is_active"`
		IsExpired         bool       `json:"is_expired"`
		DaysToExpiry      int        `json:"days_to_expiry"`
		CreatedAt         time.Time  `json:"created_at"`
	}

	var batches []BatchResult
	query := h.db.Table("inventory_batches AS ib").
		Select(`
			ib.id, ib.product_id, ib.batch_number,
			ib.quantity, ib.available_quantity,
			ib.unit_cost, ib.selling_price, ib.mrp,
			ib.expiry_date, ib.manufacturing_date,
			ib.location, ib.is_active, ib.is_expired,
			ib.created_at,
			p.name AS product_name, p.sku, p.barcode,
			c.name AS category_name,
			b.name AS brand_name,
			CASE 
				WHEN ib.expiry_date IS NULL THEN 999999
				ELSE EXTRACT(DAY FROM (ib.expiry_date - NOW()))::int
			END AS days_to_expiry
		`).
		Joins("LEFT JOIN products p ON p.id = ib.product_id").
		Joins("LEFT JOIN categories c ON c.id = p.category_id").
		Joins("LEFT JOIN brands b ON b.id = p.brand_id")

	// Apply filters
	if search != "" {
		query = query.Where("LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ? OR LOWER(ib.batch_number) LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	switch status {
	case "active":
		query = query.Where("ib.is_active = true AND ib.is_expired = false")
	case "expired":
		query = query.Where("ib.is_expired = true OR ib.expiry_date < NOW()")
	case "low_stock":
		query = query.Where("ib.available_quantity > 0 AND ib.available_quantity < 10")
	}

	// Count total
	var total int64
	countQuery := *query
	countQuery.Count(&total)

	// Pagination
	query = query.Limit(100).Offset(0)
	if limit != "" {
		query = query.Limit(100) // Max 100
	}
	if offset != "" {
		query = query.Offset(0)
	}

	query = query.Order("ib.created_at DESC")

	if err := query.Find(&batches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"count":   len(batches),
		"total":   total,
	})
}

// GetExpiringBatches - GET /api/erp/inventory/batches/expiring
// Returns batches expiring within specified days
func (h *BatchBarcodeHandler) GetExpiringBatches(c *gin.Context) {
	days := c.DefaultQuery("days", "90") // Default 90 days

	var batches []map[string]interface{}
	query := h.db.Table("inventory_batches AS ib").
		Select("ib.*, p.name AS product_name, p.sku").
		Joins("LEFT JOIN products p ON p.id = ib.product_id").
		Where("ib.is_active = true AND ib.available_quantity > 0").
		Where("ib.expiry_date <= NOW() + INTERVAL '? days'", days).
		Order("ib.expiry_date ASC")

	if err := query.Find(&batches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiring batches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    batches,
		"count":   len(batches),
	})
}
