package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GroupedProductsHandler struct {
	db *gorm.DB
}

func NewGroupedProductsHandler(db *gorm.DB) *GroupedProductsHandler {
	return &GroupedProductsHandler{db: db}
}

// ProductGroup represents a group of variants
type ProductGroup struct {
	BaseProductName string            `json:"baseProductName"`
	BaseSKU         string            `json:"baseSku"`
	Category        string            `json:"category"`
	Brand           string            `json:"brand"`
	TotalVariants   int               `json:"totalVariants"`
	TotalStock      float64           `json:"totalStock"`
	MinPrice        float64           `json:"minPrice"`
	MaxPrice        float64           `json:"maxPrice"`
	IsActive        bool              `json:"isActive"`
	Variants        []ProductVariant  `json:"variants"`
}

// ProductVariant represents individual variant in a group
type ProductVariant struct {
	ID           string  `json:"id"`
	SKU          string  `json:"sku"`
	Name         string  `json:"name"`
	Potency      string  `json:"potency"`
	Form         string  `json:"form"`
	PackSize     string  `json:"packSize"`
	Barcode      string  `json:"barcode"`
	HSNCode      string  `json:"hsnCode"`
	CurrentStock float64 `json:"currentStock"`
	SellingPrice float64 `json:"sellingPrice"`
	MRP          float64 `json:"mrp"`
	TaxPercent   float64 `json:"taxPercent"`
	IsActive     bool    `json:"isActive"`
}

// GET /api/erp/products/grouped - Get products grouped by base name (LAZY LOADING - no variants)
func (h *GroupedProductsHandler) GetGroupedProducts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	pageStr := c.DefaultQuery("page", "1")
	search := c.Query("search")
	category := c.Query("category")
	brand := c.Query("brand")
	potency := c.Query("potency")
	form := c.Query("form")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
	offset := (page - 1) * limit

	// Build WHERE clause using base_name if available
	var whereClauses []string
	var args []interface{}
	paramIdx := 1

	if search != "" {
		whereClauses = append(whereClauses, "(base_name ILIKE $"+strconv.Itoa(paramIdx)+" OR name ILIKE $"+strconv.Itoa(paramIdx)+" OR sku ILIKE $"+strconv.Itoa(paramIdx)+")")
		args = append(args, "%"+search+"%")
		paramIdx++
	}
	if category != "" {
		whereClauses = append(whereClauses, "category = $"+strconv.Itoa(paramIdx))
		args = append(args, category)
		paramIdx++
	}
	if brand != "" {
		whereClauses = append(whereClauses, "brand = $"+strconv.Itoa(paramIdx))
		args = append(args, brand)
		paramIdx++
	}
	if potency != "" {
		whereClauses = append(whereClauses, "potency = $"+strconv.Itoa(paramIdx))
		args = append(args, potency)
		paramIdx++
	}
	if form != "" {
		whereClauses = append(whereClauses, "form = $"+strconv.Itoa(paramIdx))
		args = append(args, form)
		paramIdx++
	}

	whereClause := "TRUE"
	if len(whereClauses) > 0 {
		whereClause = strings.Join(whereClauses, " AND ")
	}

	// Query for grouped products (NO variants loaded - lazy loading)
	query := `
		SELECT 
			COALESCE(base_name, LOWER(TRIM(name))) as base_name,
			MIN(category) as category,
			MIN(brand) as brand,
			COUNT(*) as variant_count,
			SUM(COALESCE(current_stock, 0)) as total_stock,
			MIN(COALESCE(selling_price, 0)) as min_price,
			MAX(COALESCE(selling_price, 0)) as max_price,
			BOOL_OR(COALESCE(is_active, true)) as is_active,
			MIN(sku) as base_sku,
			ARRAY_AGG(DISTINCT potency) FILTER (WHERE potency IS NOT NULL AND potency != '') as potencies,
			ARRAY_AGG(DISTINCT form) FILTER (WHERE form IS NOT NULL AND form != '') as forms
		FROM products
		WHERE ` + whereClause + `
		GROUP BY COALESCE(base_name, LOWER(TRIM(name)))
		ORDER BY base_name ASC
		LIMIT $` + strconv.Itoa(paramIdx) + ` OFFSET $` + strconv.Itoa(paramIdx+1)

	args = append(args, limit, offset)

	var groups []struct {
		BaseName     string    `gorm:"column:base_name"`
		Category     string    `gorm:"column:category"`
		Brand        string    `gorm:"column:brand"`
		VariantCount int       `gorm:"column:variant_count"`
		TotalStock   float64   `gorm:"column:total_stock"`
		MinPrice     float64   `gorm:"column:min_price"`
		MaxPrice     float64   `gorm:"column:max_price"`
		IsActive     bool      `gorm:"column:is_active"`
		BaseSKU      string    `gorm:"column:base_sku"`
		Potencies    *string   `gorm:"column:potencies"`
		Forms        *string   `gorm:"column:forms"`
	}

	if err := h.db.Raw(query, args...).Scan(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch grouped products", "details": err.Error()})
		return
	}

	// Get total count
	countQuery := `
		SELECT COUNT(DISTINCT COALESCE(base_name, LOWER(TRIM(name))))
		FROM products
		WHERE ` + whereClause
	
	var total int64
	h.db.Raw(countQuery, args[:len(args)-2]...).Scan(&total)

	// Build response (NO variants - they'll be loaded via separate API call)
	result := make([]ProductGroup, len(groups))
	for i, group := range groups {
		result[i] = ProductGroup{
			BaseProductName: group.BaseName,
			BaseSKU:         group.BaseSKU,
			Category:        group.Category,
			Brand:           group.Brand,
			TotalVariants:   group.VariantCount,
			TotalStock:      group.TotalStock,
			MinPrice:        group.MinPrice,
			MaxPrice:        group.MaxPrice,
			IsActive:        group.IsActive,
			Variants:        []ProductVariant{}, // Empty - load via /variants endpoint
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
		"meta": gin.H{
			"total":       total,
			"page":        page,
			"per_page":    limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GET /api/erp/products/grouped/:baseName/variants - Get variants for a group (LAZY LOADED)
func (h *GroupedProductsHandler) GetGroupVariants(c *gin.Context) {
	baseName := c.Param("baseName")
	brand := c.Query("brand")
	category := c.Query("category")

	// Build WHERE clause using base_name
	var whereClauses []string
	var args []interface{}
	paramIdx := 1

	whereClauses = append(whereClauses, "COALESCE(base_name, LOWER(TRIM(name))) = $"+strconv.Itoa(paramIdx))
	args = append(args, baseName)
	paramIdx++

	if brand != "" {
		whereClauses = append(whereClauses, "brand = $"+strconv.Itoa(paramIdx))
		args = append(args, brand)
		paramIdx++
	}
	if category != "" {
		whereClauses = append(whereClauses, "category = $"+strconv.Itoa(paramIdx))
		args = append(args, category)
		paramIdx++
	}

	whereClause := strings.Join(whereClauses, " AND ")

	// Query variants with all details
	query := `
		SELECT 
			id, sku, name, brand, category,
			COALESCE(potency, '') as potency,
			COALESCE(form, '') as form,
			COALESCE(pack_size, '') as pack_size,
			COALESCE(barcode, '') as barcode,
			COALESCE(hsn_code, '') as hsn_code,
			COALESCE(current_stock, 0) as current_stock,
			COALESCE(selling_price, 0) as selling_price,
			COALESCE(mrp, 0) as mrp,
			COALESCE(tax_percent, 5) as tax_percent,
			COALESCE(is_active, true) as is_active
		FROM products
		WHERE ` + whereClause + `
		ORDER BY 
			CASE 
				WHEN potency ~ '^\d+$' THEN CAST(potency AS INTEGER)
				ELSE 999
			END,
			potency ASC,
			form ASC,
			pack_size ASC
		LIMIT 100
	`

	var products []struct {
		ID           string  `gorm:"column:id"`
		SKU          string  `gorm:"column:sku"`
		Name         string  `gorm:"column:name"`
		Brand        string  `gorm:"column:brand"`
		Category     string  `gorm:"column:category"`
		Potency      string  `gorm:"column:potency"`
		Form         string  `gorm:"column:form"`
		PackSize     string  `gorm:"column:pack_size"`
		Barcode      string  `gorm:"column:barcode"`
		HSNCode      string  `gorm:"column:hsn_code"`
		CurrentStock float64 `gorm:"column:current_stock"`
		SellingPrice float64 `gorm:"column:selling_price"`
		MRP          float64 `gorm:"column:mrp"`
		TaxPercent   float64 `gorm:"column:tax_percent"`
		IsActive     bool    `gorm:"column:is_active"`
	}

	if err := h.db.Raw(query, args...).Scan(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch variants", "details": err.Error()})
		return
	}

	// Build response
	variants := make([]ProductVariant, len(products))
	for i, p := range products {
		variants[i] = ProductVariant{
			ID:           p.ID,
			SKU:          p.SKU,
			Name:         p.Name,
			Potency:      p.Potency,
			Form:         p.Form,
			PackSize:     p.PackSize,
			Barcode:      p.Barcode,
			HSNCode:      p.HSNCode,
			CurrentStock: p.CurrentStock,
			SellingPrice: p.SellingPrice,
			MRP:          p.MRP,
			TaxPercent:   p.TaxPercent,
			IsActive:     p.IsActive,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": variants,
		"meta": gin.H{
			"count": len(variants),
			"base_name": baseName,
		},
	})
}
