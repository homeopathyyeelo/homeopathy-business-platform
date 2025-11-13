package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// MasterRecord represents a master record
type MasterRecord struct {
	ID        string `json:"id" gorm:"primaryKey"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// StreamingImportHandler handles real-time streaming imports
type StreamingImportHandler struct {
	db *gorm.DB
	importHandler *ProductImportHandler
	clientDisconnected bool
}

func NewStreamingImportHandler(db *gorm.DB) *StreamingImportHandler {
	return &StreamingImportHandler{
		db: db,
		importHandler: NewProductImportHandler(db),
	}
}

// ProgressMessage represents a progress update
type ProgressMessage struct {
	Type       string      `json:"type"`        // "progress", "log", "master", "error", "complete"
	Message    string      `json:"message"`
	Percentage float64     `json:"percentage"`
	RowNumber  int         `json:"row_number"`
	Data       interface{} `json:"data,omitempty"`
	Timestamp  string      `json:"timestamp"`
}

// POST /api/erp/products/import/stream - Streaming import with live updates
func (h *StreamingImportHandler) StreamingImport(c *gin.Context) {
	// Reset disconnection flag
	h.clientDisconnected = false
	
	// Set headers for Server-Sent Events
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no") // Disable nginx buffering

	// Get file from form (Gin handles multipart parsing automatically)
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("❌ Form file error: %v", err)
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "No file uploaded: " + err.Error(),
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer file.Close()
	
	log.Printf("📁 File received: %s (size: %d bytes)", header.Filename, header.Size)

	// Validate file size
	if header.Size > 10*1024*1024 {
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "File too large (max 10MB)",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Save temp file
	tmpPath := filepath.Join(os.TempDir(), fmt.Sprintf("stream_import_%s_%s", uuid.New().String()[:8], filepath.Base(header.Filename)))
	
	// Open and save the file
	src, err := header.Open()
	if err != nil {
		log.Printf("❌ Failed to open file: %v", err)
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "Failed to open file",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer src.Close()
	
	dst, err := os.Create(tmpPath)
	if err != nil {
		log.Printf("❌ Failed to create temp file: %v", err)
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "Failed to save file",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer dst.Close()
	
	if _, err = dst.ReadFrom(src); err != nil {
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "Failed to save file",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	defer os.Remove(tmpPath)

	// Send initial progress
	h.sendProgress(c, ProgressMessage{
		Type:       "log",
		Message:    "📁 File uploaded successfully",
		Percentage: 5,
		Timestamp:  time.Now().Format(time.RFC3339),
	})

	// Check database connection
	if err := h.checkDBConnection(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed", "success": false})
		return
	}

	// Parse file
	h.sendProgress(c, ProgressMessage{
		Type:       "log",
		Message:    "🔍 Parsing file...",
		Percentage: 10,
		Timestamp:  time.Now().Format(time.RFC3339),
	})

	// Parse file based on extension
	rows, err := h.importHandler.parseFile(tmpPath)
	if err != nil {
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "Failed to parse file: " + err.Error(),
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}
	
	// Get brand_id from form (optional)
	brandID := c.PostForm("brand_id")

	totalRows := len(rows) - 1 // exclude header
	h.sendProgress(c, ProgressMessage{
		Type:       "log",
		Message:    fmt.Sprintf("✅ Found %d products to import", totalRows),
		Percentage: 15,
		Timestamp:  time.Now().Format(time.RFC3339),
	})

	// Validate and process with streaming
	h.streamingProcess(c, rows, totalRows, brandID)
}

// streamingProcess processes rows with real-time updates
func (h *StreamingImportHandler) streamingProcess(c *gin.Context, rows [][]string, totalRows int, brandID string) {
	startTime := time.Now()
	inserted := 0
	updated := 0
	skipped := 0
	var errors []string

	// Build column index (case-insensitive)
	header := rows[0]
	colIdx := make(map[string]int)
	for i, col := range header {
		normalized := strings.ToLower(strings.TrimSpace(col))
		if normalized != "" {  // Only add non-empty column names
			colIdx[normalized] = i
		}
	}
	
	// Debug: Log detected columns for troubleshooting
	columnNames := []string{}
	for _, col := range header {
		if strings.TrimSpace(col) != "" {
			columnNames = append(columnNames, strings.TrimSpace(col))
		}
	}
	h.sendProgress(c, ProgressMessage{
		Type:      "log",
		Message:   fmt.Sprintf("📋 Detected columns: %v", columnNames),
		Timestamp: time.Now().Format(time.RFC3339),
	})
	
	// Debug: Log first data row to verify parsing
	if len(rows) > 1 {
		firstRow := rows[1]
		h.sendProgress(c, ProgressMessage{
			Type:      "log",
			Message:   fmt.Sprintf("🔍 First row sample (length=%d): %v", len(firstRow), firstRow),
			Timestamp: time.Now().Format(time.RFC3339),
		})
	}

	// Process each row with progress updates
	for rowNum, row := range rows[1:] {
		lineNum := rowNum + 2
		percentage := 15 + float64(rowNum+1)/float64(totalRows)*75 // 15-90%

		// Ensure row has same length as header (pad if needed)
		if len(row) < len(header) {
			padding := make([]string, len(header)-len(row))
			row = append(row, padding...)
		}

		// Parse row
		product, validationErr := h.parseRow(row, colIdx, lineNum)
		
		if validationErr != "" {
			errors = append(errors, validationErr)
			skipped++
			h.sendProgress(c, ProgressMessage{
				Type:       "log",
				Message:    fmt.Sprintf("⚠️  Row %d: %s", lineNum, validationErr),
				Percentage: percentage,
				RowNumber:  lineNum,
				Timestamp:  time.Now().Format(time.RFC3339),
			})
			continue
		}
		
		// Override brand if brand_id was provided
		if brandID != "" && product.Brand == "" {
			// Look up brand name by ID
			var brand models.Brand
			if err := h.db.First(&brand, "id = ?", brandID).Error; err == nil {
				product.Brand = brand.Name
			}
		}

		// Auto-create masters with transaction
		if err := h.ensureMasters(c, &product, lineNum); err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: %s", lineNum, err.Error()))
			skipped++
			h.sendProgress(c, ProgressMessage{
				Type:       "log",
				Message:    fmt.Sprintf("❌ Row %d: %s - %s", lineNum, product.Name, err.Error()),
				Percentage: percentage,
				RowNumber:  lineNum,
				Timestamp:  time.Now().Format(time.RFC3339),
			})
			continue
		}

		// Insert/Update product
		isNew, err := h.upsertProduct(product)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: %s", rowNum, err.Error()))
			skipped++
			h.sendProgress(c, ProgressMessage{
// ...
				Type:       "log",
				Message:    fmt.Sprintf("❌ Row %d: %s - %s", lineNum, product.Name, err.Error()),
				Percentage: percentage,
				RowNumber:  lineNum,
				Timestamp:  time.Now().Format(time.RFC3339),
			})
		} else {
			if isNew {
				inserted++
				h.sendProgress(c, ProgressMessage{
					Type:       "log",
					Message:    fmt.Sprintf("✅ Row %d: Created '%s' (SKU: %s)", lineNum, product.Name, product.SKU),
					Percentage: percentage,
					RowNumber:  lineNum,
					Timestamp:  time.Now().Format(time.RFC3339),
				})
			} else {
				updated++
				h.sendProgress(c, ProgressMessage{
					Type:       "log",
					Message:    fmt.Sprintf("🔄 Row %d: Updated '%s' (SKU: %s)", lineNum, product.Name, product.SKU),
					Percentage: percentage,
					RowNumber:  lineNum,
					Timestamp:  time.Now().Format(time.RFC3339),
				})
			}
		}

		// Check if client disconnected
		if h.clientDisconnected {
			log.Printf("⚠️  Client disconnected, stopping import")
			return
		}
		
		// Small delay for visual effect (reduced to speed up import)
		if rowNum%10 == 0 { // Only delay every 10 rows
			time.Sleep(10 * time.Millisecond)
		}
	}

	// Send completion
	processTime := time.Since(startTime).String()
	successRate := 0.0
	if totalRows > 0 {
		successRate = float64(inserted+updated) / float64(totalRows) * 100
	}

	// Calculate category and brand wise stats
	categoryStats := make(map[string]int)
	brandStats := make(map[string]int)
	
	for rowNum, row := range rows[1:] {
		if rowNum >= len(rows)-1 {
			break
		}
		product, _ := h.parseRow(row, colIdx, rowNum+2)
		if product.Category != "" {
			categoryStats[product.Category]++
		}
		if product.Brand != "" {
			brandStats[product.Brand]++
		}
	}

	finalData := map[string]interface{}{
		"total_rows":      totalRows,
		"inserted":        inserted,
		"updated":         updated,
		"skipped":         skipped,
		"errors":          errors,
		"process_time":    processTime,
		"success_rate":    successRate,
		"category_wise":   categoryStats,
		"brand_wise":      brandStats,
		"validation_pass": inserted + updated,
		"validation_fail": skipped,
	}
	
	log.Printf("📊 Sending FINAL SUMMARY: total=%d, inserted=%d, updated=%d, categories=%d, brands=%d", 
		totalRows, inserted, updated, len(categoryStats), len(brandStats))
	
	h.sendProgress(c, ProgressMessage{
		Type:       "complete",
		Message:    "🎉 Import completed successfully!",
		Percentage: 100,
		Timestamp:  time.Now().Format(time.RFC3339),
		Data:       finalData,
	})
	
	// Only send completion if client is still connected
	if !h.clientDisconnected {
		log.Printf("📤 Sending final completion events...")
		
		// Send final "done" event to signal completion
		fmt.Fprintf(c.Writer, "event: done\ndata: {\"status\":\"complete\"}\n\n")
		if flusher, ok := c.Writer.(http.Flusher); ok {
			flusher.Flush()
		}
		
		// Wait to ensure all data is transmitted before closing connection
		time.Sleep(1 * time.Second)
		
		log.Printf("✅ Import stream completed and flushed")
	} else {
		log.Printf("⚠️  Client disconnected before completion")
	}
}

// ProductImportTemp represents a product import record (temporary struct for parsing)
type ProductImportTemp struct {
	SKU          string
	Name         string
	Category     string
	Type         string
	Brand        string
	Potency      string
	Form         string
	PackSize     string
	UOM          string
	CostPrice    float64
	SellingPrice float64
	MRP          float64
	TaxPercent   float64
	HSNCode      string
	Manufacturer string
	Description  string
	Barcode      string
	ReorderLevel int
	MinStock     int
	MaxStock     int
	CurrentStock int
	IsActive     bool
	Tags         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// ensureMasters auto-creates master data if not exists using unified entities
func (h *StreamingImportHandler) ensureMasters(c *gin.Context, product *ProductImportTemp, rowNum int) error {
	// Start transaction for atomic master creation
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Auto-create Category and get ID
	if product.Category != "" {
		var category models.Category
		categoryCode := strings.ToUpper(strings.ReplaceAll(product.Category, " ", "_"))
		
		// Check by both name and code to avoid duplicates
		err := tx.Where("name = ? OR code = ?", product.Category, categoryCode).First(&category).Error

		if err == gorm.ErrRecordNotFound {
			// Create new category
			category.ID = uuid.New().String()
			category.Name = product.Category
			category.Code = categoryCode
			category.IsActive = true
			category.CreatedAt = time.Now()

			if err := tx.Create(&category).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to create category: %v", err)
			}

			h.sendProgress(c, ProgressMessage{
				Type:      "master",
				Message:   fmt.Sprintf("  🏷️  Created category: %s", product.Category),
				RowNumber: rowNum,
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to query category: %v", err)
		}
	}

	// Auto-create Brand and get ID
	if product.Brand != "" {
		var brand models.Brand
		brandCode := strings.ToUpper(strings.ReplaceAll(product.Brand, " ", "_"))
		
		// Check by both name and code to avoid duplicates
		err := tx.Where("name = ? OR code = ?", product.Brand, brandCode).First(&brand).Error

		if err == gorm.ErrRecordNotFound {
			brand.ID = uuid.New().String()
			brand.Name = product.Brand
			brand.Code = brandCode
			brand.IsActive = true
			brand.CreatedAt = time.Now()

			if err := tx.Create(&brand).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to create brand: %v", err)
			}

			h.sendProgress(c, ProgressMessage{
				Type:      "master",
				Message:   fmt.Sprintf("  🏢 Created brand: %s", product.Brand),
				RowNumber: rowNum,
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to query brand: %v", err)
		}
	}

	// Auto-create Potency and get ID
	if product.Potency != "" {
		var potency models.Potency
		err := tx.Where("code = ? OR name = ?", product.Potency, product.Potency).First(&potency).Error

		if err == gorm.ErrRecordNotFound {
			potency.ID = uuid.New().String()
			potency.Name = product.Potency
			potency.Code = product.Potency
			potency.PotencyType = "CENTESIMAL" // Default type
			potency.IsActive = true
			potency.CreatedAt = time.Now()

			if err := tx.Create(&potency).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to create potency: %v", err)
			}

			h.sendProgress(c, ProgressMessage{
				Type:      "master",
				Message:   fmt.Sprintf("  💊 Created potency: %s", product.Potency),
				RowNumber: rowNum,
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to query potency: %v", err)
		}
	}

	// Auto-create Form and get ID
	if product.Form != "" {
		var form models.Form
		formCode := strings.ToUpper(strings.ReplaceAll(product.Form, " ", "_"))
		err := tx.Where("name = ? OR code = ?", product.Form, formCode).First(&form).Error

		if err == gorm.ErrRecordNotFound {
			form.ID = uuid.New().String()
			form.Name = product.Form
			form.Code = formCode
			form.FormType = "LIQUID" // Default type
			form.IsActive = true
			form.CreatedAt = time.Now()

			if err := tx.Create(&form).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to create form: %v", err)
			}

			h.sendProgress(c, ProgressMessage{
				Type:      "master",
				Message:   fmt.Sprintf("  📦 Created form: %s", product.Form),
				RowNumber: rowNum,
				Timestamp: time.Now().Format(time.RFC3339),
			})
		} else if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to query form: %v", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit master data: %v", err)
	}

	return nil
}

// parseRow converts a row to ProductImportTemp
func (h *StreamingImportHandler) parseRow(row []string, colIdx map[string]int, lineNum int) (ProductImportTemp, string) {
	getValue := func(col string) string {
		if idx, ok := colIdx[strings.ToLower(col)]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}

	parseFloat := func(s string) float64 {
		if s == "" {
			return 0
		}
		val, _ := strconv.ParseFloat(s, 64)
		return val
	}

	parseInt := func(s string) int {
		if s == "" {
			return 0
		}
		val, _ := strconv.Atoi(s)
		return val
	}

	parseBool := func(s string) bool {
		s = strings.ToLower(s)
		return s == "true" || s == "1" || s == "yes" || s == "active"
	}

	sku := getValue("sku")
	name := getValue("name")

	if sku == "" {
		return ProductImportTemp{}, "SKU is required"
	}
	if name == "" {
		return ProductImportTemp{}, "Name is required"
	}

	// Get raw values from CSV
	potency := getValue("potency")
	size := getValue("size")
	
	// Auto-detect category and form from potency and size
	category, form := autoDetectCategoryAndForm(potency, size)
	
	// Override with explicit values if provided in CSV
	if csvCategory := getValue("category"); csvCategory != "" {
		category = csvCategory
	}
	if csvForm := getValue("form"); csvForm != "" {
		form = csvForm
	}
	
	// Map Size column to PackSize
	packSize := getValue("pack_size")
	if packSize == "" {
		packSize = size // Use Size if PackSize not provided
	}
	
	// Map Qty column to CurrentStock
	currentStock := parseInt(getValue("current_stock"))
	if currentStock == 0 {
		currentStock = parseInt(getValue("qty"))
	}

	product := ProductImportTemp{
		SKU:          sku,
		Name:         name,
		Category:     category,
		Type:         getValue("type"),
		Brand:        getValue("brand"),
		Potency:      potency,
		Form:         form,
		PackSize:     packSize,
		UOM:          getValue("uom"),
		CostPrice:    parseFloat(getValue("cost_price")),
		SellingPrice: parseFloat(getValue("selling_price")),
		MRP:          parseFloat(getValue("mrp")),
		TaxPercent:   parseFloat(getValue("tax_percent")),
		HSNCode:      getValue("hsn_code"),
		Manufacturer: getValue("manufacturer"),
		Description:  getValue("description"),
		Barcode:      getValue("barcode"),
		ReorderLevel: parseInt(getValue("reorder_level")),
		MinStock:     parseInt(getValue("min_stock")),
		MaxStock:     parseInt(getValue("max_stock")),
		CurrentStock: currentStock,
		IsActive:     parseBool(getValue("is_active")),
		Tags:         getValue("tags"),
	}

	return product, ""
}

// autoDetectCategoryAndForm intelligently detects category and form from potency and size codes
func autoDetectCategoryAndForm(potency, size string) (string, string) {
	potency = strings.ToUpper(strings.TrimSpace(potency))
	size = strings.ToLower(strings.TrimSpace(size))
	
	// Bio Combination: BC1, BC2, BC28, etc.
	if strings.HasPrefix(potency, "BC") {
		return "Bio Combination", "Tablet"
	}
	
	// Mother Tincture: MT, Q
	if potency == "MT" || potency == "Q" || potency == "Θ" {
		return "Mother Tincture", "Liquid"
	}
	
	// Dilutions: CM, CH, M, LM with ml
	if (potency == "CM" || potency == "CH" || potency == "M" || potency == "LM" || strings.HasSuffix(potency, "C") || strings.HasSuffix(potency, "M")) && strings.Contains(size, "ml") {
		return "Dilutions", "Liquid"
	}
	
	// Bio Chemics / Biochemic Salts: Potencies with X and size with gm
	if strings.Contains(potency, "X") && strings.Contains(size, "gm") {
		return "Bio Chemics", "Tablet"
	}
	
	// Drops: R1, R2, RN prefix
	if strings.HasPrefix(potency, "R") {
		return "Drops", "Liquid"
	}
	
	// Syrup
	if strings.Contains(strings.ToLower(potency), "syrup") || strings.Contains(size, "syrup") {
		return "Syrup", "Liquid"
	}
	
	// Spray
	if strings.Contains(strings.ToLower(potency), "spray") || strings.Contains(size, "spray") {
		return "Spray", "Liquid"
	}
	
	// Ointment / Gel / Cream: LP or size indicators
	if potency == "LP" || strings.Contains(size, "ointment") || strings.Contains(size, "gel") || strings.Contains(size, "cream") {
		return "External", "Ointment"
	}
	
	// Default: Dilutions with Liquid if contains ml
	if strings.Contains(size, "ml") {
		return "Dilutions", "Liquid"
	}
	
	// Default: Bio Chemics with Tablet if contains gm
	if strings.Contains(size, "gm") || strings.Contains(size, "g") {
		return "Bio Chemics", "Tablet"
	}
	
	// Final fallback
	return "Dilutions", "Liquid"
}

// checkDBConnection verifies database connectivity
func (h *StreamingImportHandler) checkDBConnection() error {
	sqlDB, err := h.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database: %v", err)
	}
	
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %v", err)
	}
	
	return nil
}

// upsertProduct inserts or updates a product using the Product model with foreign keys
func (h *StreamingImportHandler) upsertProduct(productTemp ProductImportTemp) (bool, error) {
	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Convert to Product model
	product := h.convertToProduct(productTemp)
	
	// Lookup and set master IDs (category, brand, potency, form)
	if err := h.lookupMasterIDs(tx, &product, productTemp); err != nil {
		tx.Rollback()
		return false, fmt.Errorf("master lookup failed: %v", err)
	}

	// Check if product exists
	var existing models.Product
	err := tx.Where("sku = ?", productTemp.SKU).First(&existing).Error
	
	var isNew bool
	
	if err == gorm.ErrRecordNotFound {
		// Insert new product
		product.ID = uuid.New().String()
		product.CreatedAt = time.Now()
		product.UpdatedAt = time.Now()
		
		if err := tx.Create(&product).Error; err != nil {
			tx.Rollback()
			return false, fmt.Errorf("insert failed: %v", err)
		}
		isNew = true
	} else if err != nil {
		tx.Rollback()
		return false, fmt.Errorf("query failed: %v", err)
	} else {
		// Update existing product
		product.ID = existing.ID
		product.CreatedAt = existing.CreatedAt
		product.UpdatedAt = time.Now()
		
		if err := tx.Model(&existing).Updates(&product).Error; err != nil {
			tx.Rollback()
			return false, fmt.Errorf("update failed: %v", err)
		}
		isNew = false
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return false, fmt.Errorf("commit failed: %v", err)
	}

	return isNew, nil
}

// convertToProduct converts ProductImportTemp to unified Product entity
func (h *StreamingImportHandler) convertToProduct(temp ProductImportTemp) models.Product {
	return models.Product{
		SKU:                    temp.SKU,
		Name:                   temp.Name,
		CategoryID:             nil, // Will be set by lookupMasterIDs
		BrandID:                nil, // Will be set by lookupMasterIDs
		PotencyID:              nil, // Will be set by lookupMasterIDs
		FormID:                 nil, // Will be set by lookupMasterIDs
		HSNCodeID:              nil, // Will be set by lookupMasterIDs
		UnitID:                 nil, // Will be set by lookupMasterIDs
		CostPrice:              temp.CostPrice,
		SellingPrice:           temp.SellingPrice,
		MRP:                    temp.MRP,
		TaxRate:                temp.TaxPercent,
		PackSize:               temp.PackSize,
		ReorderLevel:           temp.ReorderLevel,
		MinStock:               temp.MinStock,
		MaxStock:               temp.MaxStock,
		CurrentStock:           float64(temp.CurrentStock),
		Barcode:                temp.Barcode,
		Description:            temp.Description,
		Manufacturer:           temp.Manufacturer,
		IsPrescriptionRequired: false,
		IsActive:               temp.IsActive,
		Tags:                   temp.Tags,
	}
}

// lookupMasterIDs looks up and sets master data IDs for the product with intelligent tax rate detection
func (h *StreamingImportHandler) lookupMasterIDs(tx *gorm.DB, product *models.Product, temp ProductImportTemp) error {
	// Lookup Category ID
	if product.CategoryID == nil && temp.Category != "" {
		var category models.Category
		if err := tx.Where("name = ?", temp.Category).First(&category).Error; err == nil {
			product.CategoryID = &category.ID
		}
	}

	// Lookup Brand ID
	if product.BrandID == nil && temp.Brand != "" {
		var brand models.Brand
		if err := tx.Where("name = ?", temp.Brand).First(&brand).Error; err == nil {
			product.BrandID = &brand.ID
		}
	}

	// Lookup Potency ID
	if product.PotencyID == nil && temp.Potency != "" {
		var potency models.Potency
		if err := tx.Where("code = ? OR name = ?", temp.Potency, temp.Potency).First(&potency).Error; err == nil {
			product.PotencyID = &potency.ID
		}
	}

	// Lookup Form ID
	if product.FormID == nil && temp.Form != "" {
		var form models.Form
		if err := tx.Where("name = ?", temp.Form).First(&form).Error; err == nil {
			product.FormID = &form.ID
		}
	}

	// Lookup Unit ID (default to first unit if not specified)
	if product.UnitID == nil {
		var unit models.Unit
		if err := tx.First(&unit).Error; err == nil {
			product.UnitID = &unit.ID
		}
	}

	// 🔍 INTELLIGENT HSN CODE & TAX RATE MATCHING
	// Try to find HSN code from hsn_codes master table
	var hsnCodeRecord models.HSNCode
	hsnFound := false
	
	if temp.HSNCode != "" {
		// First try exact match by code
		if err := tx.Where("code = ?", temp.HSNCode).First(&hsnCodeRecord).Error; err == nil {
			product.HSNCodeID = &hsnCodeRecord.ID
			hsnFound = true
			
			// If tax rate not provided in CSV, use HSN's GST rate
			if temp.TaxPercent == 0 && hsnCodeRecord.GSTRate > 0 {
				product.TaxRate = hsnCodeRecord.GSTRate
			}
		}
	}
	
	// If HSN not found or not provided, apply intelligent defaults based on category
	if !hsnFound || temp.TaxPercent == 0 {
		categoryName := strings.ToLower(temp.Category)
		
		// Homeopathy medicines: 5% GST (HSN: 3003 or 3004)
		isHomeopathyMedicine := strings.Contains(categoryName, "dilution") ||
			strings.Contains(categoryName, "mother tincture") ||
			strings.Contains(categoryName, "bio combination") ||
			strings.Contains(categoryName, "bio chemic") ||
			strings.Contains(categoryName, "drop") ||
			strings.Contains(categoryName, "tablet") ||
			strings.Contains(categoryName, "syrup")
		
		// Cosmetics/External: 18% GST (HSN: 3304 or 3307)
		isCosmetic := strings.Contains(categoryName, "external") ||
			strings.Contains(categoryName, "ointment") ||
			strings.Contains(categoryName, "cream") ||
			strings.Contains(categoryName, "gel") ||
			strings.Contains(categoryName, "lotion") ||
			strings.Contains(categoryName, "cosmetic")
		
		// Auto-assign tax rate if not provided
		if temp.TaxPercent == 0 {
			if isHomeopathyMedicine {
				product.TaxRate = 5.0  // 5% for medicines
			} else if isCosmetic {
				product.TaxRate = 18.0 // 18% for cosmetics
			} else {
				product.TaxRate = 5.0  // Default to 5% for homeopathy products
			}
		}
		
		// Auto-assign HSN code if not found
		if !hsnFound {
			var defaultHSN models.HSNCode
			var hsnCode string
			
			if isHomeopathyMedicine {
				hsnCode = "3003" // Medicaments
			} else if isCosmetic {
				hsnCode = "3304" // Beauty/makeup preparations
			} else {
				hsnCode = "3003" // Default to medicaments
			}
			
			// Try to find this default HSN in table
			if err := tx.Where("code = ?", hsnCode).First(&defaultHSN).Error; err == nil {
				product.HSNCodeID = &defaultHSN.ID
			}
		}
	}

	return nil
}

// sendProgress sends a progress message via SSE
func (h *StreamingImportHandler) sendProgress(c *gin.Context, msg ProgressMessage) {
	// If already disconnected, don't try to send
	if h.clientDisconnected {
		return
	}
	
	// Check if writer is still valid
	if c.Writer == nil {
		log.Printf("⚠️  Writer is nil, marking client as disconnected")
		h.clientDisconnected = true
		return
	}
	
	// Check if client closed connection
	if c.Request != nil && c.Request.Context().Err() != nil {
		log.Printf("⚠️  Client context cancelled: %v", c.Request.Context().Err())
		h.clientDisconnected = true
		return
	}
	
	// Try to send with error handling
	defer func() {
		if r := recover(); r != nil {
			log.Printf("⚠️  Panic in sendProgress (client likely disconnected): %v", r)
			h.clientDisconnected = true
		}
	}()
	
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("⚠️  Failed to marshal message: %v", err)
		return
	}
	
	// Try to write
	n, err := fmt.Fprintf(c.Writer, "data: %s\n\n", data)
	if err != nil {
		log.Printf("⚠️  Failed to write to client: %v (client disconnected)", err)
		h.clientDisconnected = true
		return
	}
	
	if n == 0 {
		log.Printf("⚠️  Wrote 0 bytes (client disconnected)")
		h.clientDisconnected = true
		return
	}
	
	// Flush immediately
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}
}
