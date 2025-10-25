package handlers

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
	
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type ProductImportHandler struct {
	db *gorm.DB
}

func NewProductImportHandler(db *gorm.DB) *ProductImportHandler {
	return &ProductImportHandler{db: db}
}

// POST /api/erp/products/import - Bulk import products from XLS/XLSX/CSV
func (h *ProductImportHandler) BulkImport(c *gin.Context) {
	startTime := time.Now()

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required", "success": false})
		return
	}

	// Validate file size (max 10MB)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 10MB)", "success": false})
		return
	}

	// Save to temp location
	tmpPath := filepath.Join(os.TempDir(), fmt.Sprintf("import_%s_%s", uuid.New().String()[:8], filepath.Base(file.Filename)))
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file", "success": false})
		return
	}
	defer os.Remove(tmpPath)

	// Parse file based on extension
	rows, err := h.parseFile(tmpPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "success": false})
		return
	}

	// Validate and map to products
	products, validationErrors := h.mapAndValidate(rows)

	// Upsert products to database
	inserted, updated, skipped, upsertErrors := h.upsertProducts(products)

	// Combine all errors
	allErrors := append(validationErrors, upsertErrors...)

	totalProcessed := inserted + updated
	successRate := 0.0
	if len(rows) > 1 {
		successRate = float64(totalProcessed) / float64(len(rows)-1) * 100
	}

	result := models.ImportResult{
		TotalRows:   len(rows) - 1, // exclude header
		Inserted:    inserted,
		Updated:     updated,
		Skipped:     skipped,
		Errors:      allErrors,
		ProcessTime: time.Since(startTime).String(),
		SuccessRate: successRate,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
		"message": fmt.Sprintf("Import completed: %d inserted, %d updated, %d skipped", inserted, updated, skipped),
	})
}

// parseFile reads XLS, XLSX or CSV file and returns rows
func (h *ProductImportHandler) parseFile(path string) ([][]string, error) {
	ext := strings.ToLower(filepath.Ext(path))

	// Handle CSV
	if ext == ".csv" {
		return h.parseCSV(path)
	}

	// Handle Excel (XLSX, XLS)
	if ext == ".xlsx" || ext == ".xls" {
		return h.parseExcel(path)
	}

	return nil, errors.New("unsupported file format (use .csv, .xlsx, or .xls)")
}

// parseCSV reads CSV file
func (h *ProductImportHandler) parseCSV(path string) ([][]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1 // Allow variable fields

	var rows [][]string
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}

	if len(rows) == 0 {
		return nil, errors.New("CSV file is empty")
	}

	return rows, nil
}

// parseExcel reads Excel file
func (h *ProductImportHandler) parseExcel(path string) ([][]string, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %v", err)
	}
	defer f.Close()

	// Get first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("Excel file has no sheets")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("failed to read rows: %v", err)
	}

	if len(rows) == 0 {
		return nil, errors.New("Excel file is empty")
	}

	// Normalize rows - ensure all rows have same column count as header
	if len(rows) > 0 {
		maxCols := len(rows[0])
		for i := range rows {
			if len(rows[i]) < maxCols {
				// Pad with empty strings
				padding := make([]string, maxCols-len(rows[i]))
				rows[i] = append(rows[i], padding...)
			}
		}
	}

	return rows, nil
}

// mapAndValidate converts rows to ProductImport structs with validation
func (h *ProductImportHandler) mapAndValidate(rows [][]string) ([]models.ProductImport, []string) {
	if len(rows) < 2 {
		return nil, []string{"File must have at least a header row and one data row"}
	}

	var products []models.ProductImport
	var errors []string

	// Build column index map (case-insensitive)
	header := rows[0]
	colIdx := make(map[string]int)
	for i, col := range header {
		normalized := strings.ToLower(strings.TrimSpace(col))
		if normalized != "" {  // Only add non-empty column names
			colIdx[normalized] = i
		}
	}
	
	// Debug: Log detected columns
	fmt.Printf("DEBUG: Detected columns: %v\n", colIdx)

	// Helper to get column value
	getValue := func(row []string, col string) string {
		idx, ok := colIdx[strings.ToLower(col)]
		if !ok || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}

	// Helper to parse float
	parseFloat := func(s string) float64 {
		s = strings.ReplaceAll(s, ",", "")
		s = strings.TrimSpace(s)
		if s == "" {
			return 0
		}
		f, _ := strconv.ParseFloat(s, 64)
		return f
	}

	// Helper to parse int
	parseInt := func(s string) int {
		s = strings.TrimSpace(s)
		if s == "" {
			return 0
		}
		i, _ := strconv.Atoi(s)
		return i
	}

	// Helper to parse bool
	parseBool := func(s string) bool {
		s = strings.ToLower(strings.TrimSpace(s))
		return s != "false" && s != "0" && s != "no" && s != "inactive"
	}

	// Process each data row
	for rowNum, row := range rows[1:] {
		lineNum := rowNum + 2 // +2 because we're starting from rows[1] and lines start at 1

		sku := getValue(row, "sku")
		name := getValue(row, "name")

		// Required fields
		if sku == "" {
			errors = append(errors, fmt.Sprintf("Row %d: SKU is required", lineNum))
			continue
		}
		if name == "" {
			errors = append(errors, fmt.Sprintf("Row %d: Name is required", lineNum))
			continue
		}

		product := models.ProductImport{
			SKU:          sku,
			Name:         name,
			Category:     getValue(row, "category"),
			Type:         getValue(row, "type"),
			Brand:        getValue(row, "brand"),
			Potency:      getValue(row, "potency"),
			Form:         getValue(row, "form"),
			PackSize:     getValue(row, "pack_size"),
			UOM:          getValue(row, "uom"),
			CostPrice:    parseFloat(getValue(row, "cost_price")),
			SellingPrice: parseFloat(getValue(row, "selling_price")),
			MRP:          parseFloat(getValue(row, "mrp")),
			TaxPercent:   parseFloat(getValue(row, "tax_percent")),
			HSNCode:      getValue(row, "hsn_code"),
			Manufacturer: getValue(row, "manufacturer"),
			Description:  getValue(row, "description"),
			Barcode:      getValue(row, "barcode"),
			ReorderLevel: parseInt(getValue(row, "reorder_level")),
			MinStock:     parseInt(getValue(row, "min_stock")),
			MaxStock:     parseInt(getValue(row, "max_stock")),
			CurrentStock: parseInt(getValue(row, "current_stock")),
			IsActive:     parseBool(getValue(row, "is_active")),
			Tags:         getValue(row, "tags"),
		}

		products = append(products, product)
	}

	return products, errors
}

// upsertProducts inserts or updates products in database
func (h *ProductImportHandler) upsertProducts(products []models.ProductImport) (inserted int, updated int, skipped int, errors []string) {
	if len(products) == 0 {
		return 0, 0, 0, nil
	}

	// Check existing SKUs
	var existingSKUs []string
	skus := make([]string, len(products))
	for i, p := range products {
		skus[i] = p.SKU
	}

	err := h.db.Model(&models.ProductImport{}).
		Where("sku IN ?", skus).
		Pluck("sku", &existingSKUs).Error
	if err != nil {
		errors = append(errors, "Failed to query existing products: "+err.Error())
		return 0, 0, len(products), errors
	}

	existingSKUMap := make(map[string]bool)
	for _, sku := range existingSKUs {
		existingSKUMap[sku] = true
	}

	// Process each product
	for _, product := range products {
		// Set timestamps
		now := time.Now()
		if existingSKUMap[product.SKU] {
			// Update existing
			product.UpdatedAt = now
			result := h.db.Model(&models.ProductImport{}).
				Where("sku = ?", product.SKU).
				Updates(product)
			
			if result.Error != nil {
				errors = append(errors, fmt.Sprintf("SKU %s: %v", product.SKU, result.Error))
				skipped++
			} else if result.RowsAffected > 0 {
				updated++
			} else {
				skipped++
			}
		} else {
			// Insert new
			product.CreatedAt = now
			product.UpdatedAt = now
			if err := h.db.Create(&product).Error; err != nil {
				if strings.Contains(err.Error(), "duplicate") {
					errors = append(errors, fmt.Sprintf("SKU %s: duplicate entry", product.SKU))
				} else {
					errors = append(errors, fmt.Sprintf("SKU %s: %v", product.SKU, err))
				}
				skipped++
			} else {
				inserted++
			}
		}
	}

	return inserted, updated, skipped, errors
}

// GET /api/erp/products/export - Export products to CSV
func (h *ProductImportHandler) ExportProducts(c *gin.Context) {
	var products []models.ProductImport
	
	if err := h.db.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products", "success": false})
		return
	}

	// Create CSV content
	var csvData [][]string
	csvData = append(csvData, []string{
		"SKU", "Name", "Category", "Type", "Brand", "Potency", "Form", "Pack Size", "UOM",
		"Cost Price", "Selling Price", "MRP", "Tax Percent", "HSN Code", "Manufacturer",
		"Description", "Barcode", "Reorder Level", "Min Stock", "Max Stock", "Current Stock",
		"Is Active", "Tags",
	})

	for _, p := range products {
		csvData = append(csvData, []string{
			p.SKU, p.Name, p.Category, p.Type, p.Brand, p.Potency, p.Form, p.PackSize, p.UOM,
			fmt.Sprintf("%.2f", p.CostPrice), fmt.Sprintf("%.2f", p.SellingPrice), fmt.Sprintf("%.2f", p.MRP),
			fmt.Sprintf("%.2f", p.TaxPercent), p.HSNCode, p.Manufacturer, p.Description, p.Barcode,
			fmt.Sprintf("%d", p.ReorderLevel), fmt.Sprintf("%d", p.MinStock), fmt.Sprintf("%d", p.MaxStock),
			fmt.Sprintf("%d", p.CurrentStock), fmt.Sprintf("%t", p.IsActive), p.Tags,
		})
	}

	// Convert to CSV string
	var csvContent strings.Builder
	for _, row := range csvData {
		for i, col := range row {
			if i > 0 {
				csvContent.WriteString(",")
			}
			// Quote if contains comma or newline
			if strings.Contains(col, ",") || strings.Contains(col, "\n") {
				csvContent.WriteString(fmt.Sprintf("\"%s\"", strings.ReplaceAll(col, "\"", "\"\"")))
			} else {
				csvContent.WriteString(col)
			}
		}
		csvContent.WriteString("\n")
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=products_export_%s.csv", time.Now().Format("20060102_150405")))
	c.Header("Content-Type", "text/csv")
	c.String(http.StatusOK, csvContent.String())
}

// GET /api/erp/products/template - Download import template
func (h *ProductImportHandler) DownloadTemplate(c *gin.Context) {
	templateContent := `SKU,Name,Category,Type,Brand,Potency,Form,Pack Size,UOM,Cost Price,Selling Price,MRP,Tax Percent,HSN Code,Manufacturer,Description,Barcode,Reorder Level,Min Stock,Max Stock,Current Stock,Is Active,Tags
ARM-30C-10ML,Arnica Montana 30C,Dilutions,Medicine,SBL,30C,Liquid,10ml,ml,45.00,75.00,85.00,18.00,30049014,SBL Pvt Ltd,Homeopathic dilution for bruises and trauma,8901234567890,20,10,500,100,true,trauma;bruising;muscle pain
BEL-200C-10ML,Belladonna 200C,Dilutions,Medicine,Dr. Reckeweg,200C,Liquid,10ml,ml,50.00,85.00,95.00,18.00,30049014,Dr. Reckeweg & Co,Homeopathic dilution for fever,8901234567891,15,10,500,80,true,fever;inflammation;headache
CAL-CARB-30C,Calcarea Carbonica 30C,Dilutions,Medicine,Allen,30C,Globules,10g,gm,40.00,70.00,80.00,18.00,30049014,Allen Homoeo Lab,For bone and teeth development,8901234567892,25,15,600,150,true,bones;calcium;growth
CHAM-Q-30ML,Chamomilla Q,Mother Tincture,Medicine,Schwabe,Q,Liquid,30ml,ml,120.00,210.00,230.00,18.00,30049014,Dr. Willmar Schwabe,Mother tincture for teething troubles,8901234567893,10,5,300,45,true,teething;irritability;pain`

	c.Header("Content-Disposition", "attachment; filename=Template_File_Medicine_Product_List.csv")
	c.Header("Content-Type", "text/csv")
	c.String(http.StatusOK, templateContent)
}
