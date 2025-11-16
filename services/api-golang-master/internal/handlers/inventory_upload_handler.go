package handlers

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

// ============================================================================
// Inventory Upload Handler
// Handles CSV upload → staging → review → approval workflow
// ============================================================================

type InventoryUploadHandler struct {
	db      *gorm.DB
	matcher *services.ProductMatcher
}

func NewInventoryUploadHandler(db *gorm.DB) *InventoryUploadHandler {
	return &InventoryUploadHandler{
		db:      db,
		matcher: services.NewProductMatcher(db),
	}
}

// ============================================================================
// POST /api/inventory/upload
// Upload CSV file, parse, match products, stage for review
// ============================================================================
func (h *InventoryUploadHandler) UploadCSV(c *gin.Context) {
	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(header.Filename, ".csv") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only CSV files are allowed"})
		return
	}

	// Validate file size (max 10MB)
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 10MB"})
		return
	}

	// Get uploaded_by from context (from auth middleware)
	uploadedBy := c.GetString("user_id")
	if uploadedBy == "" {
		uploadedBy = "system" // fallback for testing
	}

	// Process CSV and stage
	summary, err := h.processCSVAndStage(c.Request.Context(), file, header.Filename, uploadedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// ============================================================================
// GET /api/inventory/uploads/:id
// Get upload details with staged items for review
// ============================================================================
func (h *InventoryUploadHandler) GetUploadDetails(c *gin.Context) {
	uploadID := c.Param("id")

	var upload struct {
		ID                 string    `json:"id"`
		UploadedBy         string    `json:"uploadedBy"`
		Filename           string    `json:"filename"`
		TotalRows          int       `json:"totalRows"`
		MatchedCount       int       `json:"matchedCount"`
		UnmatchedCount     int       `json:"unmatchedCount"`
		FuzzyMatchedCount  int       `json:"fuzzyMatchedCount"`
		Status             string    `json:"status"`
		ApprovedBy         *string   `json:"approvedBy"`
		ApprovedAt         *time.Time `json:"approvedAt"`
		RejectionReason    *string   `json:"rejectionReason"`
		CreatedAt          time.Time `json:"createdAt"`
	}

	if err := h.db.Table("inventory_uploads").Where("id = ?", uploadID).First(&upload).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Upload not found"})
		return
	}

	// Get staged items
	var items []struct {
		ID              string     `json:"id"`
		RowIndex        int        `json:"rowIndex"`
		RawSKU          *string    `json:"rawSku"`
		RawBarcode      *string    `json:"rawBarcode"`
		RawName         *string    `json:"rawName"`
		RawBrand        *string    `json:"rawBrand"`
		RawCategory     *string    `json:"rawCategory"`
		RawPotency      *string    `json:"rawPotency"`
		RawForm         *string    `json:"rawForm"`
		RawPackSize     *string    `json:"rawPackSize"`
		RawQty          float64    `json:"rawQty"`
		RawBatchNo      *string    `json:"rawBatchNo"`
		RawExpiryDate   *time.Time `json:"rawExpiryDate"`
		RawMRP          *float64   `json:"rawMrp"`
		RawGST          *float64   `json:"rawGst"`
		RawHSN          *string    `json:"rawHsn"`
		MatchedProductID *string   `json:"matchedProductId"`
		MatchedBy       *string    `json:"matchedBy"`
		MatchedScore    *float64   `json:"matchedScore"`
		ReviewRequired  bool       `json:"reviewRequired"`
		ReviewNotes     *string    `json:"reviewNotes"`
		IsApplied       bool       `json:"isApplied"`
		ErrorMessage    *string    `json:"errorMessage"`
		ProductName     *string    `json:"productName"` // joined from products
		ProductSKU      *string    `json:"productSku"`
	}

	err := h.db.Table("inventory_upload_items as i").
		Select("i.*, p.name as product_name, p.sku as product_sku").
		Joins("LEFT JOIN products p ON i.matched_product_id = p.id").
		Where("i.upload_id = ?", uploadID).
		Order("i.row_index ASC").
		Find(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"upload": upload,
		"items":  items,
	})
}

// ============================================================================
// POST /api/inventory/uploads/:id/approve
// Approve upload and apply stock to inventory_batches
// Requires super_user role
// ============================================================================
func (h *InventoryUploadHandler) ApproveUpload(c *gin.Context) {
	uploadID := c.Param("id")
	
	// Get user from context
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	
	// Check super user permission
	if userRole != "super_user" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super users can approve uploads"})
		return
	}

	// Apply upload
	if err := h.applyUpload(c.Request.Context(), uploadID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Upload approved and stock applied"})
}

// ============================================================================
// POST /api/inventory/uploads/:id/reject
// Reject upload with reason
// ============================================================================
func (h *InventoryUploadHandler) RejectUpload(c *gin.Context) {
	uploadID := c.Param("id")
	
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	
	err := h.db.Table("inventory_uploads").
		Where("id = ?", uploadID).
		Updates(map[string]interface{}{
			"status":           "rejected",
			"rejection_reason": req.Reason,
			"approved_by":      userID,
			"approved_at":      time.Now(),
		}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject upload"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Upload rejected"})
}

// ============================================================================
// CORE LOGIC: Process CSV and Stage
// ============================================================================
func (h *InventoryUploadHandler) processCSVAndStage(ctx context.Context, file io.Reader, filename, uploadedBy string) (map[string]interface{}, error) {
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Create upload record
	uploadID := uuid.New().String()
	upload := map[string]interface{}{
		"id":          uploadID,
		"uploaded_by": uploadedBy,
		"filename":    filename,
		"status":      "pending",
		"created_at":  time.Now(),
	}

	if err := tx.Table("inventory_uploads").Create(&upload).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create upload record: %w", err)
	}

	// 2. Parse CSV
	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	// Read header
	headers, err := reader.Read()
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	// Build column index map
	colMap := make(map[string]int)
	for i, header := range headers {
		colMap[strings.ToLower(strings.TrimSpace(header))] = i
	}

	// 3. Process rows
	rowIndex := 0
	matchedCount := 0
	unmatchedCount := 0
	fuzzyMatchedCount := 0

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("error reading CSV row %d: %w", rowIndex+1, err)
		}

		rowIndex++

		// Extract values
		sku := getCSVValue(row, colMap, "sku")
		barcode := getCSVValue(row, colMap, "barcode")
		name := getCSVValue(row, colMap, "name")
		brand := getCSVValue(row, colMap, "brand")
		category := getCSVValue(row, colMap, "category")
		potency := getCSVValue(row, colMap, "potency")
		form := getCSVValue(row, colMap, "form")
		packSize := getCSVValue(row, colMap, "pack_size")
		qtyStr := getCSVValue(row, colMap, "qty")
		batchNo := getCSVValue(row, colMap, "batch_no")
		expiryStr := getCSVValue(row, colMap, "expiry_date")
		mrpStr := getCSVValue(row, colMap, "mrp")
		gstStr := getCSVValue(row, colMap, "gst")
		hsn := getCSVValue(row, colMap, "hsn")
		remarks := getCSVValue(row, colMap, "remarks")

		// Parse numeric values
		qty, _ := strconv.ParseFloat(qtyStr, 64)
		mrp, _ := strconv.ParseFloat(mrpStr, 64)
		gst, _ := strconv.ParseFloat(gstStr, 64)

		// Parse expiry date
		var expiryDate *time.Time
		if expiryStr != "" {
			if t, err := time.Parse("2006-01-02", expiryStr); err == nil {
				expiryDate = &t
			}
		}

		// Match product
		matchResult, _ := h.matcher.FindBestMatch(ctx, sku, barcode, name)

		var matchedProductID *string
		var matchedBy *string
		var matchedScore *float64
		reviewRequired := false

		if matchResult != nil {
			matchedProductID = &matchResult.ProductID
			matchedBy = &matchResult.MatchedBy
			matchedScore = &matchResult.MatchScore
			reviewRequired = matchResult.RequireReview
			matchedCount++

			if matchResult.MatchedBy == "fuzzy_name" {
				fuzzyMatchedCount++
			}
		} else {
			unmatchedCount++
			reviewRequired = true
		}

		// Insert staged item
		item := map[string]interface{}{
			"id":                 uuid.New().String(),
			"upload_id":          uploadID,
			"row_index":          rowIndex,
			"raw_sku":            sku,
			"raw_barcode":        barcode,
			"raw_name":           name,
			"raw_brand":          brand,
			"raw_category":       category,
			"raw_potency":        potency,
			"raw_form":           form,
			"raw_pack_size":      packSize,
			"raw_qty":            qty,
			"raw_batch_no":       batchNo,
			"raw_expiry_date":    expiryDate,
			"raw_mrp":            mrp,
			"raw_gst":            gst,
			"raw_hsn":            hsn,
			"matched_product_id": matchedProductID,
			"matched_by":         matchedBy,
			"matched_score":      matchedScore,
			"review_required":    reviewRequired,
			"notes":              remarks,
			"created_at":         time.Now(),
		}

		if err := tx.Table("inventory_upload_items").Create(&item).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create item at row %d: %w", rowIndex, err)
		}
	}

	// 4. Update upload summary
	status := "review"
	if unmatchedCount == 0 && fuzzyMatchedCount == 0 {
		status = "review" // Even perfect matches need approval
	}

	err = tx.Table("inventory_uploads").
		Where("id = ?", uploadID).
		Updates(map[string]interface{}{
			"total_rows":          rowIndex,
			"matched_count":       matchedCount,
			"unmatched_count":     unmatchedCount,
			"fuzzy_matched_count": fuzzyMatchedCount,
			"status":              status,
		}).Error

	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update upload summary: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return map[string]interface{}{
		"uploadId":          uploadID,
		"filename":          filename,
		"totalRows":         rowIndex,
		"matchedCount":      matchedCount,
		"unmatchedCount":    unmatchedCount,
		"fuzzyMatchedCount": fuzzyMatchedCount,
		"status":            status,
		"message":           "Upload processed successfully. Please review before approval.",
	}, nil
}

// ============================================================================
// CORE LOGIC: Apply Upload to Stock
// ============================================================================
func (h *InventoryUploadHandler) applyUpload(ctx context.Context, uploadID, approvedBy string) error {
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get staged items
	var items []struct {
		ID               string
		RawQty           float64
		RawBatchNo       *string
		RawExpiryDate    *time.Time
		RawMRP           *float64
		MatchedProductID *string
		ManualProductID  *string
	}

	err := tx.Table("inventory_upload_items").
		Select("id, raw_qty, raw_batch_no, raw_expiry_date, raw_mrp, matched_product_id, manual_product_id").
		Where("upload_id = ? AND is_applied = FALSE", uploadID).
		Find(&items).Error

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to fetch items: %w", err)
	}

	appliedCount := 0

	for _, item := range items {
		// Determine product ID (manual override takes precedence)
		productID := item.MatchedProductID
		if item.ManualProductID != nil {
			productID = item.ManualProductID
		}

		if productID == nil {
			// Skip items without product match
			tx.Table("inventory_upload_items").
				Where("id = ?", item.ID).
				Update("error_message", "No product matched")
			continue
		}

		// Create or update inventory batch
		batchID := uuid.New().String()
		batch := models.InventoryBatch{
			ID:                *productID,
			ProductID:         *productID,
			BatchNumber:       getStringValue(item.RawBatchNo),
			ExpiryDate:        item.RawExpiryDate,
			Quantity:          item.RawQty,
			AvailableQuantity: item.RawQty,
			ReservedQuantity:  0,
			MRP:               getFloatValue(item.RawMRP),
			StockSource:       "inventory", // Mark as inventory upload
			IsActive:          true,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}
		batch.ID = batchID

		if err := tx.Create(&batch).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to create batch for item %s: %w", item.ID, err)
		}

		// Create stock adjustment (audit trail)
		adjustment := models.StockAdjustment{
			ID:             uuid.New().String(),
			ProductID:      productID,
			BatchID:        &batchID,
			AdjustmentType: "IN",
			QuantityBefore: 0,
			QuantityAfter:  item.RawQty,
			QuantityDelta:  item.RawQty,
			Reason:         "inventory_upload",
			Notes:          fmt.Sprintf("From upload session %s", uploadID),
			ReferenceID:    uploadID,
			AdjustedBy:     approvedBy,
			CreatedAt:      time.Now(),
		}

		if err := tx.Create(&adjustment).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to create stock adjustment: %w", err)
		}

		// Update product stock
		tx.Model(&models.Product{}).
			Where("id = ?", *productID).
			UpdateColumn("current_stock", gorm.Expr("current_stock + ?", item.RawQty))

		// Mark item as applied
		tx.Table("inventory_upload_items").
			Where("id = ?", item.ID).
			Updates(map[string]interface{}{
				"is_applied":      true,
				"applied_batch_id": batchID,
			})

		appliedCount++
	}

	// Mark upload as approved
	err = tx.Table("inventory_uploads").
		Where("id = ?", uploadID).
		Updates(map[string]interface{}{
			"status":      "approved",
			"approved_by": approvedBy,
			"approved_at": time.Now(),
		}).Error

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update upload status: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}

	return nil
}

// ============================================================================
// Helper Functions
// ============================================================================

func getCSVValue(row []string, colMap map[string]int, key string) string {
	if idx, ok := colMap[key]; ok && idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

func getStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func getFloatValue(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}
