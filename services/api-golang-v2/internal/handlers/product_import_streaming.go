package handlers

import (
	"encoding/json"
	"fmt"
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
	// Set headers for Server-Sent Events
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "File upload failed: " + err.Error(),
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Validate file size
	if file.Size > 10*1024*1024 {
		h.sendProgress(c, ProgressMessage{
			Type:      "error",
			Message:   "File too large (max 10MB)",
			Timestamp: time.Now().Format(time.RFC3339),
		})
		return
	}

	// Save temp file
	tmpPath := filepath.Join(os.TempDir(), fmt.Sprintf("stream_import_%s_%s", uuid.New().String()[:8], filepath.Base(file.Filename)))
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
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

	totalRows := len(rows) - 1 // exclude header
	h.sendProgress(c, ProgressMessage{
		Type:       "log",
		Message:    fmt.Sprintf("✅ Found %d products to import", totalRows),
		Percentage: 15,
		Timestamp:  time.Now().Format(time.RFC3339),
	})

	// Validate and process with streaming
	h.streamingProcess(c, rows, totalRows)
}

// streamingProcess processes rows with real-time updates
func (h *StreamingImportHandler) streamingProcess(c *gin.Context, rows [][]string, totalRows int) {
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
			errors = append(errors, fmt.Sprintf("Row %d: %s", lineNum, err.Error()))
			skipped++
			h.sendProgress(c, ProgressMessage{
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

		// Small delay for visual effect
		time.Sleep(50 * time.Millisecond)
	}

	// Send completion
	processTime := time.Since(startTime).String()
	successRate := 0.0
	if totalRows > 0 {
		successRate = float64(inserted+updated) / float64(totalRows) * 100
	}

	h.sendProgress(c, ProgressMessage{
		Type:       "complete",
		Message:    "🎉 Import completed successfully!",
		Percentage: 100,
		Timestamp:  time.Now().Format(time.RFC3339),
		Data: map[string]interface{}{
			"total_rows":   totalRows,
			"inserted":     inserted,
			"updated":      updated,
			"skipped":      skipped,
			"errors":       errors,
			"process_time": processTime,
			"success_rate": successRate,
		},
	})
	
	// Send final "done" event to signal completion
	fmt.Fprintf(c.Writer, "event: done\ndata: {\"status\":\"complete\"}\n\n")
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
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
		err := tx.Where("name = ?", product.Category).First(&category).Error

		if err == gorm.ErrRecordNotFound {
			// Create new category
			category.ID = uuid.New().String()
			category.Name = product.Category
			category.Code = strings.ToUpper(strings.ReplaceAll(product.Category, " ", "_"))
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
		err := tx.Where("name = ?", product.Brand).First(&brand).Error

		if err == gorm.ErrRecordNotFound {
			brand.ID = uuid.New().String()
			brand.Name = product.Brand
			brand.Code = strings.ToUpper(strings.ReplaceAll(product.Brand, " ", "_"))
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
		err := tx.Where("name = ?", product.Form).First(&form).Error

		if err == gorm.ErrRecordNotFound {
			form.ID = uuid.New().String()
			form.Name = product.Form
			form.Code = strings.ToUpper(strings.ReplaceAll(product.Form, " ", "_"))
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

	product := ProductImportTemp{
		SKU:          sku,
		Name:         name,
		Category:     getValue("category"),
		Type:         getValue("type"),
		Brand:        getValue("brand"),
		Potency:      getValue("potency"),
		Form:         getValue("form"),
		PackSize:     getValue("pack_size"),
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
		CurrentStock: parseInt(getValue("current_stock")),
		IsActive:     parseBool(getValue("is_active")),
		Tags:         getValue("tags"),
	}

	return product, ""
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

// upsertProduct inserts or updates a product using the unified schema
func (h *StreamingImportHandler) upsertProduct(productTemp ProductImportTemp) (bool, error) {
	// Convert ProductImportTemp to unified Product entity
	product := h.convertToProduct(productTemp)

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Look up master data IDs
	if err := h.lookupMasterIDs(tx, &product, productTemp); err != nil {
		tx.Rollback()
		return false, fmt.Errorf("failed to lookup master IDs: %v", err)
	}

	var existing models.Product
	result := tx.Where("sku = ?", product.SKU).First(&existing)

	now := time.Now()
	product.UpdatedAt = now

	var isNew bool
	var err error

	if result.Error == gorm.ErrRecordNotFound {
		// Insert new
		product.CreatedAt = now
		// Ensure ID is set
		if product.ID == "" {
			product.ID = uuid.New().String()
		}

		if err = tx.Create(&product).Error; err != nil {
			tx.Rollback()
			return false, fmt.Errorf("insert failed: %v", err)
		}
		isNew = true
	} else if result.Error != nil {
		// Database error
		tx.Rollback()
		return false, fmt.Errorf("query failed: %v", result.Error)
	} else {
		// Update existing
		if err = tx.Model(&models.Product{}).Where("sku = ?", product.SKU).Updates(&product).Error; err != nil {
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

// lookupMasterIDs looks up and sets master data IDs for the product
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

	// Lookup HSN Code ID
	if product.HSNCodeID == nil && temp.HSNCode != "" {
		var hsnCode models.HSNCode
		if err := tx.Where("code = ?", temp.HSNCode).First(&hsnCode).Error; err == nil {
			product.HSNCodeID = &hsnCode.ID
		}
	}

	return nil
}

// sendProgress sends a progress message via SSE
func (h *StreamingImportHandler) sendProgress(c *gin.Context, msg ProgressMessage) {
	data, _ := json.Marshal(msg)
	fmt.Fprintf(c.Writer, "data: %s\n\n", data)
	
	// Flush if the writer supports it
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}
}
