package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// BarcodeHandler handles barcode operations
type BarcodeHandler struct {
	db *gorm.DB
}

// NewBarcodeHandler creates a new barcode handler
func NewBarcodeHandler(db *gorm.DB) *BarcodeHandler {
	return &BarcodeHandler{db: db}
}

// BarcodeResponse represents barcode data
type BarcodeResponse struct {
	ID          uint   `json:"id"`
	ProductID   uint   `json:"product_id"`
	ProductName string `json:"product_name"`
	SKU         string `json:"sku"`
	Potency     string `json:"potency"`
	Form        string `json:"form"`
	Brand       string `json:"brand"`
	Category    string `json:"category"`
	BatchID     uint   `json:"batch_id"`
	BatchNo     string `json:"batch_no"`
	Barcode     string `json:"barcode"`
	BarcodeType string `json:"barcode_type"`
	MRP         float64 `json:"mrp"`
	ExpDate     string `json:"exp_date"`
	Quantity    int    `json:"quantity"`
	Warehouse   string `json:"warehouse"`
	GeneratedAt string `json:"generated_at"`
	Status      string `json:"status"`
	ExpiryStatus string `json:"expiry_status"`
	CreatedBy   string `json:"created_by"`
}

// GetBarcodes returns all generated barcodes
// GET /api/erp/products/barcode
func (h *BarcodeHandler) GetBarcodes(c *gin.Context) {
	var barcodes []BarcodeResponse

	query := h.db.Table("product_barcodes pb").
		Select(`
			pb.id,
			pb.product_id,
			p.name as product_name,
			p.sku,
			
			
			
			
			pb.batch_id,
			pb.batch_no,
			pb.barcode,
			pb.barcode_type,
			pb.mrp,
			pb.exp_date,
			pb.quantity,
			'Main Store' as warehouse,
			pb.generated_at,
			pb.status,
			CASE
				WHEN pb.exp_date < CURRENT_DATE THEN 'expired'
				WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'
				WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'
				ELSE 'fresh'
			END as expiry_status,
			'System' as created_by
		`).
		Joins("LEFT JOIN products p ON p.id = pb.product_id").
		Order("pb.generated_at DESC")

	// Apply search filter
	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("p.name ILIKE ? OR p.sku ILIKE ? OR pb.batch_no ILIKE ? OR pb.barcode ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Apply status filter
	if status := c.Query("status"); status != "" {
		query = query.Where("pb.status = ?", status)
	}

	// Apply expiry filter
	if expiryStatus := c.Query("expiry_status"); expiryStatus != "" {
		query = query.Where("CASE\n"+
			"WHEN pb.exp_date < CURRENT_DATE THEN 'expired'\n"+
			"WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'\n"+
			"WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'\n"+
			"ELSE 'fresh'\n"+
			"END = ?", expiryStatus)
	}

	// Pagination
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	query = query.Limit(limit).Offset(offset)

	if err := query.Find(&barcodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch barcodes: " + err.Error(),
		})
		return
	}

	// Get total count
	var total int64
	countQuery := h.db.Table("product_barcodes pb").
		Joins("LEFT JOIN products p ON p.id = pb.product_id")

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		countQuery = countQuery.Where("p.name ILIKE ? OR p.sku ILIKE ? OR pb.batch_no ILIKE ? OR pb.barcode ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if status := c.Query("status"); status != "" {
		countQuery = countQuery.Where("pb.status = ?", status)
	}

	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    barcodes,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GenerateBarcode generates a new barcode for a product batch
// POST /api/erp/products/barcode/generate
func (h *BarcodeHandler) GenerateBarcode(c *gin.Context) {
	var req struct {
		ProductID uint   `json:"product_id" binding:"required"`
		BatchID   *uint  `json:"batch_id"`
		BatchNo   string `json:"batch_no"`
		Quantity  int    `json:"quantity"`
		BarcodeType string `json:"barcode_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Validate request
	if req.BatchID == nil && req.BatchNo == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Either batch_id or batch_no is required",
		})
		return
	}

	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	if req.BarcodeType == "" {
		req.BarcodeType = "EAN13"
	}

	// Get product details
	var product models.Product
	if err := h.db.First(&product, req.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Product not found",
		})
		return
	}

	// Get batch details if batch_id provided
	var batchNo string
	var mrp float64
	var expDate *time.Time

	if req.BatchID != nil {
		var batch models.InventoryBatch
		if err := h.db.First(&batch, *req.BatchID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Batch not found",
			})
			return
		}
		batchNo = batch.BatchNumber
		mrp = batch.MRP
		expDate = batch.ExpiryDate
	} else {
		batchNo = req.BatchNo
		// Get MRP from product or use default
		mrp = product.MRP
	}

	// Generate unique barcode
	barcode := h.generateUniqueBarcode(product.SKU, batchNo, req.BarcodeType)

	// Get current user (placeholder - should come from auth middleware)
	currentUserID := uint(1)
	var currentUser models.User
	h.db.First(&currentUser, currentUserID)

	// Create barcode record
	barcodeRecord := models.ProductBarcode{
		ID:          uuid.New().String(),
		ProductID:   strconv.FormatUint(uint64(req.ProductID), 10),
		BatchNo:     batchNo,
		Barcode:     barcode,
		BarcodeType: req.BarcodeType,
		MRP:         mrp,
		ExpDate:     expDate,
		Quantity:    req.Quantity,
		WarehouseID: nil, // Default warehouse
		Status:      "active",
		GeneratedAt: time.Now(),
		CreatedBy:   strconv.FormatUint(uint64(currentUserID), 10),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if req.BatchID != nil {
		batchIDStr := strconv.FormatUint(uint64(*req.BatchID), 10)
		barcodeRecord.BatchID = &batchIDStr
	}

	if err := h.db.Create(&barcodeRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate barcode: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Barcode generated successfully",
		"data": gin.H{
			"id":           barcodeRecord.ID,
			"product_name": product.Name,
			"sku":          product.SKU,
			"batch_no":     batchNo,
			"barcode":      barcode,
			"barcode_type": req.BarcodeType,
			"mrp":          mrp,
			"quantity":     req.Quantity,
		},
	})
}

// PrintBarcodes handles barcode printing requests
// POST /api/erp/products/barcode/print
func (h *BarcodeHandler) PrintBarcodes(c *gin.Context) {
	var req struct {
		BarcodeIDs  []uint `json:"barcode_ids" binding:"required"`
		LabelSize   string `json:"label_size"`
		Copies      int    `json:"copies"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	if len(req.BarcodeIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No barcode IDs provided",
		})
		return
	}

	if req.Copies <= 0 {
		req.Copies = 1
	}

	if req.LabelSize == "" {
		req.LabelSize = "medium"
	}

	// Get barcode details
	var barcodes []BarcodeResponse
	query := h.db.Table("product_barcodes pb").
		Select(`
			pb.id,
			pb.product_id,
			p.name as product_name,
			p.sku,
			
			
			
			
			pb.batch_id,
			pb.batch_no,
			pb.barcode,
			pb.barcode_type,
			pb.mrp,
			pb.exp_date,
			pb.quantity,
			'Main Store' as warehouse,
			pb.generated_at,
			pb.status,
			CASE
				WHEN pb.exp_date < CURRENT_DATE THEN 'expired'
				WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7d'
				WHEN pb.exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_1m'
				ELSE 'fresh'
			END as expiry_status,
			'System' as created_by
		`).
		Joins("LEFT JOIN products p ON p.id = pb.product_id").
		Where("pb.id IN ?", req.BarcodeIDs)

	if err := query.Find(&barcodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch barcodes for printing: " + err.Error(),
		})
		return
	}

	// Generate print data
	printData := gin.H{
		"barcodes":   barcodes,
		"label_size": req.LabelSize,
		"copies":     req.Copies,
		"total_labels": len(barcodes) * req.Copies,
		"print_ready": true,
		"generated_at": time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Print data generated successfully",
		"data":    printData,
	})
}

// UpdateBarcode updates barcode information
// PUT /api/erp/products/barcode/:id
func (h *BarcodeHandler) UpdateBarcode(c *gin.Context) {
	barcodeID := c.Param("id")

	var req struct {
		MRP      *float64 `json:"mrp"`
		Quantity *int     `json:"quantity"`
		Status   *string  `json:"status"`
		Notes    *string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Build update map
	updates := gin.H{
		"updated_at": time.Now(),
	}

	if req.MRP != nil {
		updates["mrp"] = *req.MRP
	}
	if req.Quantity != nil {
		updates["quantity"] = *req.Quantity
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	result := h.db.Model(&models.ProductBarcode{}).
		Where("id = ?", barcodeID).
		Updates(updates)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update barcode: " + result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Barcode not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Barcode updated successfully",
	})
}

// DeleteBarcode deletes a barcode record
// DELETE /api/erp/products/barcode/:id
func (h *BarcodeHandler) DeleteBarcode(c *gin.Context) {
	barcodeID := c.Param("id")

	result := h.db.Delete(&models.ProductBarcode{}, barcodeID)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete barcode: " + result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Barcode not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Barcode deleted successfully",
	})
}

// GetBarcodeStats returns barcode statistics
// GET /api/erp/products/barcode/stats
func (h *BarcodeHandler) GetBarcodeStats(c *gin.Context) {
	var stats struct {
		TotalBarcodes    int `json:"total_barcodes"`
		ActiveBarcodes   int `json:"active_barcodes"`
		ExpiredBarcodes  int `json:"expired_barcodes"`
		ExpiringSoon     int `json:"expiring_soon"`
		TotalBatches     int `json:"total_batches"`
		TotalProducts    int `json:"total_products"`
		RecentGenerated  int `json:"recent_generated"`
	}

	// Get overall statistics
	h.db.Raw(`
		SELECT
			COUNT(*) as total_barcodes,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active_barcodes,
			COUNT(CASE WHEN exp_date < CURRENT_DATE THEN 1 END) as expired_barcodes,
			COUNT(CASE WHEN exp_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon,
			COUNT(DISTINCT batch_no) as total_batches,
			COUNT(DISTINCT product_id) as total_products,
			COUNT(CASE WHEN generated_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_generated
		FROM product_barcodes
	`).Scan(&stats)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// generateUniqueBarcode generates a unique barcode for the product batch
func (h *BarcodeHandler) generateUniqueBarcode(sku, batchNo, barcodeType string) string {
	// Clean inputs
	sku = strings.ReplaceAll(strings.ToUpper(sku), "-", "")
	batchNo = strings.ReplaceAll(strings.ToUpper(batchNo), "-", "")

	// Generate base number from SKU and batch
	baseStr := fmt.Sprintf("%s%s%d", sku, batchNo, time.Now().Unix()%1000)

	// Generate EAN-13 format (12 digits + check digit)
	if barcodeType == "EAN13" || barcodeType == "" {
		// Take first 12 digits, pad or truncate as needed
		var barcodeNum string
		if len(baseStr) >= 12 {
			barcodeNum = baseStr[:12]
		} else {
			// Pad with random digits
			for len(barcodeNum) < 12 {
				barcodeNum += fmt.Sprintf("%d", rand.Intn(10))
			}
		}

		// Calculate check digit (EAN-13 algorithm)
		checkDigit := h.calculateEAN13CheckDigit(barcodeNum)
		return barcodeNum + checkDigit
	}

	// Generate Code 128 format
	if barcodeType == "CODE128" {
		// Simple implementation - use timestamp + random
		return fmt.Sprintf("C%s%d", baseStr[:10], rand.Intn(10000))
	}

	// Default fallback
	return fmt.Sprintf("%s%d", baseStr[:10], rand.Intn(1000))
}

// calculateEAN13CheckDigit calculates the check digit for EAN-13 barcode
func (h *BarcodeHandler) calculateEAN13CheckDigit(barcode string) string {
	if len(barcode) != 12 {
		return "0"
	}

	var sum int
	for i, char := range barcode {
		digit := int(char - '0')
		if i%2 == 0 {
			sum += digit // Even positions (0-based)
		} else {
			sum += digit * 3 // Odd positions (0-based)
		}
	}

	checkDigit := (10 - (sum % 10)) % 10
	return fmt.Sprintf("%d", checkDigit)
}
