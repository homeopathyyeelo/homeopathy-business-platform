package handlers

import (
	"bytes"
	"encoding/base64"
	"image/png"
	"net/http"
	"strings"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/code128"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BarcodeLabelHandler struct {
	db *gorm.DB
}

func NewBarcodeLabelHandler(db *gorm.DB) *BarcodeLabelHandler {
	return &BarcodeLabelHandler{db: db}
}

// Generate barcode image for a single product
func (h *BarcodeLabelHandler) GenerateBarcodeImage(c *gin.Context) {
	productID := c.Param("id")

	// Get product details
	var product struct {
		ID              string  `json:"id"`
		SKU             string  `json:"sku"`
		Name            string  `json:"name"`
		Barcode         string  `json:"barcode"`
		BarcodeTemplate string  `json:"barcodeTemplate"`
		MRP             float64 `json:"mrp"`
		SellingPrice    float64 `json:"sellingPrice"`
		Brand           string  `json:"brand"`
		Category        string  `json:"category"`
	}

	if err := h.db.Table("products").Where("id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Product not found",
		})
		return
	}

	if product.Barcode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Product has no barcode",
		})
		return
	}

	// Generate barcode image using Code128
	barcodeImg, err := code128.Encode(product.Barcode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate barcode: " + err.Error(),
		})
		return
	}

	// Scale barcode to appropriate size (300px wide, 100px height)
	scaledBarcode, err := barcode.Scale(barcodeImg, 300, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to scale barcode: " + err.Error(),
		})
		return
	}

	// Encode to PNG
	var buf bytes.Buffer
	if err := png.Encode(&buf, scaledBarcode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to encode barcode image",
		})
		return
	}

	// Convert to base64 for web display
	base64Img := base64.StdEncoding.EncodeToString(buf.Bytes())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"product_id":   product.ID,
			"product_name": product.Name,
			"sku":          product.SKU,
			"barcode":      product.Barcode,
			"mrp":          product.MRP,
			"image":        "data:image/png;base64," + base64Img,
		},
	})
}

// Generate barcode labels for all products (bulk)
func (h *BarcodeLabelHandler) GenerateAllBarcodeLabels(c *gin.Context) {
	limit := 100 // Limit to 100 products at a time to avoid memory issues
	if limitParam := c.Query("limit"); limitParam != "" {
		// Parse limit from query
	}

	// Get all products with barcodes
	var products []struct {
		ID      string  `json:"id"`
		SKU     string  `json:"sku"`
		Name    string  `json:"name"`
		Barcode string  `json:"barcode"`
		MRP     float64 `json:"mrp"`
	}

	query := h.db.Table("products").
		Where("barcode IS NOT NULL AND barcode != ''").
		Limit(limit)

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch products",
		})
		return
	}

	// Generate barcode images for all products
	var labels []map[string]interface{}

	for _, product := range products {
		// Generate barcode image
		barcodeImg, err := code128.Encode(product.Barcode)
		if err != nil {
			continue // Skip if barcode generation fails
		}

		// Scale to label size
		scaledBarcode, err := barcode.Scale(barcodeImg, 300, 100)
		if err != nil {
			continue
		}

		// Encode to PNG
		var buf bytes.Buffer
		if err := png.Encode(&buf, scaledBarcode); err != nil {
			continue
		}

		// Convert to base64
		base64Img := base64.StdEncoding.EncodeToString(buf.Bytes())

		labels = append(labels, map[string]interface{}{
			"product_id":   product.ID,
			"product_name": product.Name,
			"sku":          product.SKU,
			"barcode":      product.Barcode,
			"mrp":          product.MRP,
			"image":        "data:image/png;base64," + base64Img,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    labels,
		"total":   len(labels),
	})
}

// Generate barcode label by barcode string (for direct download)
func (h *BarcodeLabelHandler) GenerateBarcodeByString(c *gin.Context) {
	barcodeStr := c.Query("barcode")
	if barcodeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Barcode parameter is required",
		})
		return
	}

	// Clean barcode string
	barcodeStr = strings.TrimSpace(barcodeStr)

	// Generate barcode image
	barcodeImg, err := code128.Encode(barcodeStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Invalid barcode format: " + err.Error(),
		})
		return
	}

	// Scale to standard label size
	scaledBarcode, err := barcode.Scale(barcodeImg, 300, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to scale barcode",
		})
		return
	}

	// Return PNG image directly
	var buf bytes.Buffer
	if err := png.Encode(&buf, scaledBarcode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to encode image",
		})
		return
	}

	// Set headers for image download
	c.Header("Content-Type", "image/png")
	c.Header("Content-Disposition", "inline; filename=barcode-"+barcodeStr+".png")
	c.Data(http.StatusOK, "image/png", buf.Bytes())
}

// Print multiple barcode labels (bulk print)
func (h *BarcodeLabelHandler) PrintBarcodeLabels(c *gin.Context) {
	var req struct {
		ProductIDs []string `json:"product_ids"`
		BarcodeIDs []string `json:"barcode_ids"` // Alternative field name
		LabelSize  string   `json:"label_size"`  // small, medium, large
		Copies     int      `json:"copies"`      // Number of copies per label
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Accept both product_ids and barcode_ids
	productIDs := req.ProductIDs
	if len(productIDs) == 0 && len(req.BarcodeIDs) > 0 {
		productIDs = req.BarcodeIDs
	}

	if len(productIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No products selected",
		})
		return
	}

	if req.Copies < 1 {
		req.Copies = 1
	}

	// Get products
	var products []struct {
		ID      string  `json:"id"`
		SKU     string  `json:"sku"`
		Name    string  `json:"name"`
		Barcode string  `json:"barcode"`
		MRP     float64 `json:"mrp"`
	}

	if err := h.db.Table("products").
		Where("id IN ?", productIDs).
		Where("barcode IS NOT NULL AND barcode != ''").
		Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch products",
		})
		return
	}

	var labels []map[string]interface{}

	// Generate labels with copies
	for _, product := range products {
		// Generate barcode image once
		barcodeImg, err := code128.Encode(product.Barcode)
		if err != nil {
			continue
		}

		scaledBarcode, err := barcode.Scale(barcodeImg, 300, 100)
		if err != nil {
			continue
		}

		var buf bytes.Buffer
		if err := png.Encode(&buf, scaledBarcode); err != nil {
			continue
		}

		base64Img := base64.StdEncoding.EncodeToString(buf.Bytes())

		// Add copies
		for i := 0; i < req.Copies; i++ {
			labels = append(labels, map[string]interface{}{
				"product_id":   product.ID,
				"product_name": product.Name,
				"sku":          product.SKU,
				"barcode":      product.Barcode,
				"mrp":          product.MRP,
				"image":        "data:image/png;base64," + base64Img,
				"copy_number":  i + 1,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    labels,
		"total":   len(labels),
		"message": "Ready to print " + string(rune(len(labels))) + " labels",
	})
}
