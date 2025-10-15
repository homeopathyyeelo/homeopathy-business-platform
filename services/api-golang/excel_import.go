package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// ImportRequest represents the request for importing products
type ImportRequest struct {
	FilePath string `json:"file_path" binding:"required"`
}

// ImportResponse represents the response after importing
type ImportResponse struct {
	Success     bool      `json:"success"`
	Message     string    `json:"message"`
	TotalRows   int       `json:"total_rows"`
	SuccessRows int       `json:"success_rows"`
	ErrorRows   int       `json:"error_rows"`
	Errors      []string  `json:"errors"`
}

// ImportResult represents the result of importing a single row
type ImportResult struct {
	RowNumber int
	Success   bool
	Message   string
	Product   *Product
}

// ProductImportService handles Excel import operations
type ProductImportService struct {
	db *gorm.DB
}

// NewProductImportService creates a new import service
func NewProductImportService(db *gorm.DB) *ProductImportService {
	return &ProductImportService{db: db}
}

// ImportProductsFromExcel imports products from Excel file
func (s *ProductImportService) ImportProductsFromExcel(filePath string) (*ImportResponse, error) {
	// Open the Excel file
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %v", err)
	}
	defer f.Close()

	// Get all sheet names
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	response := &ImportResponse{
		Success:     false,
		TotalRows:   0,
		SuccessRows: 0,
		ErrorRows:   0,
		Errors:      []string{},
	}

	// Process the first sheet
	sheetName := sheets[0]
	rows := f.GetRows(sheetName)

	if len(rows) <= 1 {
		return nil, fmt.Errorf("no data rows found in Excel file")
	}

	// Skip header row and process data rows
	response.TotalRows = len(rows) - 1

	for i, row := range rows[1:] {
		rowNumber := i + 2 // 1-based row number (accounting for header)

		result := s.importProductRow(row, rowNumber)
		if result.Success {
			response.SuccessRows++
		} else {
			response.ErrorRows++
			response.Errors = append(response.Errors, fmt.Sprintf("Row %d: %s", rowNumber, result.Message))
		}
	}

	response.Success = response.ErrorRows == 0
	if response.Success {
		response.Message = fmt.Sprintf("Successfully imported %d products", response.SuccessRows)
	} else {
		response.Message = fmt.Sprintf("Imported %d products with %d errors", response.SuccessRows, response.ErrorRows)
	}

	return response, nil
}

// importProductRow imports a single product row
func (s *ProductImportService) importProductRow(row []string, rowNumber int) *ImportResult {
	result := &ImportResult{
		RowNumber: rowNumber,
		Success:   false,
	}

	// Validate row has minimum required columns
	if len(row) < 10 {
		result.Message = "Insufficient columns in row"
		return result
	}

	// Parse product data from row
	productData := s.parseProductData(row)
	if productData == nil {
		result.Message = "Failed to parse product data"
		return result
	}

	// Create or get master data references
	err := s.createOrUpdateMasterData(productData)
	if err != nil {
		result.Message = fmt.Sprintf("Failed to create master data: %v", err)
		return result
	}

	// Create the product
	product := &Product{
		Code:            productData.Code,
		Name:            productData.Name,
		Description:     productData.Description,
		CategoryID:      productData.CategoryID,
		SubcategoryID:   productData.SubcategoryID,
		BrandID:         productData.BrandID,
		PotencyID:       productData.PotencyID,
		SizeID:          productData.SizeID,
		VariantID:       productData.VariantID,
		GroupID:         productData.GroupID,
		HSNCode:         productData.HSNCode,
		TaxSlabID:       productData.TaxSlabID,
		UOMID:           productData.UOMID,
		ReorderLevel:    productData.ReorderLevel,
		MinStock:        productData.MinStock,
		MaxStock:        productData.MaxStock,
		PurchasePrice:   productData.PurchasePrice,
		MRP:             productData.MRP,
		SellingPrice:    productData.SellingPrice,
		DiscountPercent: productData.DiscountPercent,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Save product to database
	if err := s.db.Create(product).Error; err != nil {
		result.Message = fmt.Sprintf("Failed to save product: %v", err)
		return result
	}

	result.Success = true
	result.Message = "Product imported successfully"
	result.Product = product

	return result
}

// ProductImportData represents the data extracted from Excel row
type ProductImportData struct {
	Code            string
	Name            string
	Description     string
	Category        string
	Subcategory     string
	Brand           string
	Potency         string
	Size            string
	Variant         string
	Group           string
	HSNCode         string
	TaxSlab         string
	UOM             string
	ReorderLevel    int
	MinStock        int
	MaxStock        int
	PurchasePrice   float64
	MRP             float64
	SellingPrice    float64
	DiscountPercent float64
	BatchNumber     string
	ExpiryDate      string
	ManufactureDate string
	Quantity        int
	RackLocation    string
	Warehouse       string
	// Master data IDs (populated after lookup/creation)
	CategoryID      string
	SubcategoryID   string
	BrandID         string
	PotencyID       string
	SizeID          string
	VariantID       string
	GroupID         string
	TaxSlabID       string
	UOMID           string
}

// parseProductData parses Excel row into ProductImportData
func (s *ProductImportService) parseProductData(row []string) *ProductImportData {
	data := &ProductImportData{}

	// Map columns based on expected Excel format
	// Column 0: Product Code
	if len(row) > 0 {
		data.Code = strings.TrimSpace(row[0])
	}

	// Column 1: Product Name
	if len(row) > 1 {
		data.Name = strings.TrimSpace(row[1])
	}

	// Column 2: Description
	if len(row) > 2 {
		data.Description = strings.TrimSpace(row[2])
	}

	// Column 3: Category
	if len(row) > 3 {
		data.Category = strings.TrimSpace(row[3])
	}

	// Column 4: Subcategory
	if len(row) > 4 {
		data.Subcategory = strings.TrimSpace(row[4])
	}

	// Column 5: Brand
	if len(row) > 5 {
		data.Brand = strings.TrimSpace(row[5])
	}

	// Column 6: Potency
	if len(row) > 6 {
		data.Potency = strings.TrimSpace(row[6])
	}

	// Column 7: Size
	if len(row) > 7 {
		data.Size = strings.TrimSpace(row[7])
	}

	// Column 8: Variant
	if len(row) > 8 {
		data.Variant = strings.TrimSpace(row[8])
	}

	// Column 9: Group
	if len(row) > 9 {
		data.Group = strings.TrimSpace(row[9])
	}

	// Column 10: HSN Code
	if len(row) > 10 {
		data.HSNCode = strings.TrimSpace(row[10])
	}

	// Column 11: Tax Slab
	if len(row) > 11 {
		data.TaxSlab = strings.TrimSpace(row[11])
	}

	// Column 12: UOM
	if len(row) > 12 {
		data.UOM = strings.TrimSpace(row[12])
	}

	// Column 13: Purchase Price
	if len(row) > 13 {
		if price, err := strconv.ParseFloat(row[13], 64); err == nil {
			data.PurchasePrice = price
		}
	}

	// Column 14: MRP
	if len(row) > 14 {
		if price, err := strconv.ParseFloat(row[14], 64); err == nil {
			data.MRP = price
		}
	}

	// Column 15: Selling Price
	if len(row) > 15 {
		if price, err := strconv.ParseFloat(row[15], 64); err == nil {
			data.SellingPrice = price
		}
	}

	// Column 16: Batch Number
	if len(row) > 16 {
		data.BatchNumber = strings.TrimSpace(row[16])
	}

	// Column 17: Expiry Date (assuming DD/MM/YYYY format)
	if len(row) > 17 {
		data.ExpiryDate = strings.TrimSpace(row[17])
	}

	// Column 18: Manufacture Date
	if len(row) > 18 {
		data.ManufactureDate = strings.TrimSpace(row[18])
	}

	// Column 19: Quantity
	if len(row) > 19 {
		if qty, err := strconv.Atoi(row[19]); err == nil {
			data.Quantity = qty
		}
	}

	// Column 20: Rack Location
	if len(row) > 20 {
		data.RackLocation = strings.TrimSpace(row[20])
	}

	// Column 21: Warehouse
	if len(row) > 21 {
		data.Warehouse = strings.TrimSpace(row[21])
	}

	// Set defaults
	data.ReorderLevel = 10
	data.MinStock = 5
	data.MaxStock = 1000
	data.DiscountPercent = 0

	return data
}

// createOrUpdateMasterData creates or updates master data entries
func (s *ProductImportService) createOrUpdateMasterData(data *ProductImportData) error {
	// Create or get Category
	category := &ProductCategory{}
	if err := s.db.Where("name = ?", data.Category).First(category).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new category
			category = &ProductCategory{
				Code:        s.generateCode("CAT", data.Category),
				Name:        data.Category,
				Description: "Auto-created from import",
				IsActive:    true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			if err := s.db.Create(category).Error; err != nil {
				return fmt.Errorf("failed to create category: %v", err)
			}
		} else {
			return fmt.Errorf("failed to find category: %v", err)
		}
	}
	data.CategoryID = category.ID

	// Create or get Brand (Dr. Reckeweg specific)
	brand := &ProductBrand{}
	if err := s.db.Where("name = ?", data.Brand).First(brand).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			brand = &ProductBrand{
				Code:        s.generateCode("BRAND", data.Brand),
				Name:        data.Brand,
				Description: "Dr. Reckeweg brand",
				Country:     "Germany",
				IsActive:    true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			if err := s.db.Create(brand).Error; err != nil {
				return fmt.Errorf("failed to create brand: %v", err)
			}
		} else {
			return fmt.Errorf("failed to find brand: %v", err)
		}
	}
	data.BrandID = brand.ID

	// Create or get Potency
	if data.Potency != "" {
		potency := &ProductPotency{}
		if err := s.db.Where("name = ?", data.Potency).First(potency).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				potency = &ProductPotency{
					Code:        s.generateCode("POT", data.Potency),
					Name:        data.Potency,
					Value:       data.Potency,
					Description: "Homeopathic potency",
					IsActive:    true,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				if err := s.db.Create(potency).Error; err != nil {
					return fmt.Errorf("failed to create potency: %v", err)
				}
			} else {
				return fmt.Errorf("failed to find potency: %v", err)
			}
		}
		data.PotencyID = potency.ID
	}

	// Create or get Size
	if data.Size != "" {
		size := &ProductSize{}
		if err := s.db.Where("name = ?", data.Size).First(size).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				size = &ProductSize{
					Code:        s.generateCode("SIZE", data.Size),
					Name:        data.Size,
					Description: "Product size/packaging",
					IsActive:    true,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				if err := s.db.Create(size).Error; err != nil {
					return fmt.Errorf("failed to create size: %v", err)
				}
			} else {
				return fmt.Errorf("failed to find size: %v", err)
			}
		}
		data.SizeID = size.ID
	}

	// Create or get UOM (default to "Pieces" if not specified)
	uomName := data.UOM
	if uomName == "" {
		uomName = "Pieces"
	}

	uom := &UOM{}
	if err := s.db.Where("name = ?", uomName).First(uom).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			uom = &UOM{
				Code:        s.generateCode("UOM", uomName),
				Name:        uomName,
				Category:    "Count",
				Description: "Unit of measure",
				IsActive:    true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			if err := s.db.Create(uom).Error; err != nil {
				return fmt.Errorf("failed to create UOM: %v", err)
			}
		} else {
			return fmt.Errorf("failed to find UOM: %v", err)
		}
	}
	data.UOMID = uom.ID

	// Create or get Tax Slab (default to 18% GST if not specified)
	taxName := data.TaxSlab
	if taxName == "" {
		taxName = "GST 18%"
	}

	taxSlab := &TaxSlab{}
	if err := s.db.Where("name = ?", taxName).First(taxSlab).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Parse percentage from name
			percentage := 18.0
			if strings.Contains(taxName, "12%") {
				percentage = 12.0
			} else if strings.Contains(taxName, "5%") {
				percentage = 5.0
			} else if strings.Contains(taxName, "0%") {
				percentage = 0.0
			}

			taxSlab = &TaxSlab{
				Code:        s.generateCode("TAX", taxName),
				Name:        taxName,
				Percentage:  percentage,
				Description: "GST tax slab",
				TaxType:     "GST",
				Category:    "Output",
				IsActive:    true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			if err := s.db.Create(taxSlab).Error; err != nil {
				return fmt.Errorf("failed to create tax slab: %v", err)
			}
		} else {
			return fmt.Errorf("failed to find tax slab: %v", err)
		}
	}
	data.TaxSlabID = taxSlab.ID

	return nil
}

// generateCode generates a unique code for master data
func (s *ProductImportService) generateCode(prefix, name string) string {
	// Create a simple code from prefix and first few characters of name
	code := prefix + "_" + strings.ToUpper(strings.ReplaceAll(name[:min(3, len(name))], " ", "_"))

	// Ensure uniqueness
	counter := 1
	originalCode := code
	for {
		// Check if code exists
		var count int64
		s.db.Model(&ProductCategory{}).Where("code = ?", code).Count(&count)
		if count == 0 {
			break
		}

		code = fmt.Sprintf("%s_%d", originalCode, counter)
		counter++
	}

	return code
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// HTTP handler for uploading and importing Excel file
func HandleImportProducts(c *gin.Context) {
	var req ImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initialize database connection
	db := getDB()

	service := NewProductImportService(db)
	response, err := service.ImportProductsFromExcel(req.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
