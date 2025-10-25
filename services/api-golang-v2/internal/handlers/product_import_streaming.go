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

// MasterRecord represents a master data record
type MasterRecord struct {
	ID        string    `gorm:"primaryKey;type:uuid"`
	Name      string    `gorm:"size:255;uniqueIndex"`
	Code      string    `gorm:"size:64;uniqueIndex"`
	CreatedAt time.Time
}

// ensureMasters auto-creates master data if not exists and returns IDs
func (h *StreamingImportHandler) ensureMasters(c *gin.Context, product *models.ProductImport, rowNum int) error {
	// Start transaction for atomic master creation
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Auto-create Category and get ID
	if product.Category != "" {
		var master MasterRecord
		err := tx.Table("categories").Where("name = ?", product.Category).First(&master).Error
		
		if err == gorm.ErrRecordNotFound {
			// Create new category
			master.ID = uuid.New().String()
			master.Name = product.Category
			master.CreatedAt = time.Now()
			
			if err := tx.Table("categories").Create(&master).Error; err != nil {
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
		// Note: Category ID would be used here if products table has category_id FK
	}

	// Auto-create Brand and get ID
	if product.Brand != "" {
		var master MasterRecord
		err := tx.Table("brands").Where("name = ?", product.Brand).First(&master).Error
		
		if err == gorm.ErrRecordNotFound {
			master.ID = uuid.New().String()
			master.Name = product.Brand
			master.CreatedAt = time.Now()
			
			if err := tx.Table("brands").Create(&master).Error; err != nil {
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
		var master MasterRecord
		err := tx.Table("potencies").Where("code = ?", product.Potency).First(&master).Error
		
		if err == gorm.ErrRecordNotFound {
			master.ID = uuid.New().String()
			master.Code = product.Potency
			master.Name = product.Potency
			master.CreatedAt = time.Now()
			
			if err := tx.Table("potencies").Create(&master).Error; err != nil {
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
		var master MasterRecord
		err := tx.Table("forms").Where("name = ?", product.Form).First(&master).Error
		
		if err == gorm.ErrRecordNotFound {
			master.ID = uuid.New().String()
			master.Name = product.Form
			master.CreatedAt = time.Now()
			
			if err := tx.Table("forms").Create(&master).Error; err != nil {
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

// parseRow converts a row to ProductImport
func (h *StreamingImportHandler) parseRow(row []string, colIdx map[string]int, lineNum int) (models.ProductImport, string) {
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
		return models.ProductImport{}, "SKU is required"
	}
	if name == "" {
		return models.ProductImport{}, "Name is required"
	}

	product := models.ProductImport{
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

// upsertProduct inserts or updates a product with transaction safety
func (h *StreamingImportHandler) upsertProduct(product models.ProductImport) (bool, error) {
	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var existing models.ProductImport
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
		if err = tx.Model(&models.ProductImport{}).Where("sku = ?", product.SKU).Updates(product).Error; err != nil {
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

// sendProgress sends a progress message via SSE
func (h *StreamingImportHandler) sendProgress(c *gin.Context, msg ProgressMessage) {
	data, _ := json.Marshal(msg)
	fmt.Fprintf(c.Writer, "data: %s\n\n", data)
	
	// Flush if the writer supports it
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}
}
