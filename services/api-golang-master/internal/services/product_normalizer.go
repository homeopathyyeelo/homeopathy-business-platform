package services

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// ProductNormalizer handles intelligent product data normalization
type ProductNormalizer struct {
	db         *gorm.DB
	classifier *CategoryClassifier
}

func NewProductNormalizer(db *gorm.DB) *ProductNormalizer {
	return &ProductNormalizer{
		db:         db,
		classifier: NewCategoryClassifier(db),
	}
}

// ============================================================================
// PARSING & NORMALIZATION
// ============================================================================

// ParsedProduct represents extracted components from product name
type ParsedProduct struct {
	Substance    string
	Potency      string
	PotencyScale string
	Form         string
	BrandName    string
	PackSize     string
	Confidence   float64
	Tokens       []string
}

// NormalizeProductName - Main entry point for parsing product names
func (pn *ProductNormalizer) NormalizeProductName(rawName string) *ParsedProduct {
	parsed := &ParsedProduct{
		Tokens: []string{},
	}

	// Step 1: Normalize text
	normalized := pn.normalizeText(rawName)
	parsed.Tokens = strings.Fields(normalized)

	// Step 2: Extract potency (30, 200, 1M, 3X, etc.)
	parsed.Potency, parsed.PotencyScale = pn.extractPotency(normalized)

	// Step 3: Extract form (tablet, cream, ointment, MT, etc.)
	parsed.Form = pn.extractForm(normalized)

	// Step 4: Extract pack size (30ml, 10g, 100 tablets)
	parsed.PackSize = pn.extractPackSize(normalized)

	// Step 5: Extract substance name (what remains after removing other tokens)
	parsed.Substance = pn.extractSubstance(normalized, parsed)

	// Calculate confidence based on what we extracted
	parsed.Confidence = pn.calculateConfidence(parsed)

	return parsed
}

// normalizeText - Clean and standardize text
func (pn *ProductNormalizer) normalizeText(text string) string {
	// Lowercase
	text = strings.ToLower(text)

	// Remove extra whitespace
	text = strings.TrimSpace(text)
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")

	// Remove special characters but keep spaces, numbers, letters, dots
	text = regexp.MustCompile(`[^\w\s\.\-]`).ReplaceAllString(text, " ")

	// Normalize common variations
	replacements := map[string]string{
		"mother tincture": "mt",
		"bio combination": "bc",
		"biochemic":       "bc",
		"trituration":     "trit",
		"ointment":        "oint",
		"sulphur":         "sulfur",
		"phosphorus":      "phosphorous",
	}

	for old, new := range replacements {
		text = strings.ReplaceAll(text, old, new)
	}

	return text
}

// extractPotency - Parse potency values like 30, 200, 1M, 3X, BC-1, etc.
func (pn *ProductNormalizer) extractPotency(text string) (potency string, scale string) {
	// Regex patterns for different potency formats
	patterns := []struct {
		regex *regexp.Regexp
		scale string
	}{
		{regexp.MustCompile(`\b(\d+)\s*ch\b`), "CH"},
		{regexp.MustCompile(`\b(\d+)\s*c\b`), "C"},
		{regexp.MustCompile(`\b(\d+)\s*m\b`), "M"},
		{regexp.MustCompile(`\b(\d+)\s*lm\b`), "LM"},
		{regexp.MustCompile(`\b(\d+)\s*x\b`), "X"},
		{regexp.MustCompile(`\bbc[\s\-]?(\d+)\b`), "BC"},
		{regexp.MustCompile(`\b(\d+)/(\d+)\b`), "Decimal"}, // For 1/10, 3/20, etc.
	}

	for _, p := range patterns {
		if matches := p.regex.FindStringSubmatch(text); len(matches) > 1 {
			potency = matches[1]
			scale = p.scale
			return
		}
	}

	// Try standalone numbers (assume Centesimal if no scale)
	numberRegex := regexp.MustCompile(`\b(\d+)\b`)
	if matches := numberRegex.FindStringSubmatch(text); len(matches) > 1 {
		num := matches[1]
		// Common homeopathy potencies
		if num == "30" || num == "200" || num == "1000" || num == "6" || num == "12" {
			potency = num
			scale = "CH"
			return
		}
	}

	return "", ""
}

// extractForm - Identify product form
func (pn *ProductNormalizer) extractForm(text string) string {
	forms := map[string][]string{
		"dilution": {"dilution", "dil", "liquid"},
		"tablet":   {"tablet", "tab", "pellet", "pills"},
		"cream":    {"cream", "crm"},
		"ointment": {"ointment", "oint"},
		"gel":      {"gel"},
		"mt":       {"mt", "mother tincture"},
		"powder":   {"powder", "trit", "trituration"},
		"drop":     {"drop", "drops"},
		"syrup":    {"syrup", "syr"},
		"spray":    {"spray"},
		"lotion":   {"lotion"},
	}

	for formName, keywords := range forms {
		for _, keyword := range keywords {
			if strings.Contains(text, keyword) {
				return formName
			}
		}
	}

	// Default: if has potency, likely dilution
	if strings.Contains(text, "ch") || strings.Contains(text, "lm") {
		return "dilution"
	}

	return "unknown"
}

// extractPackSize - Extract pack size (30ml, 10g, 100 tablets)
func (pn *ProductNormalizer) extractPackSize(text string) string {
	// Regex for pack sizes
	sizeRegex := regexp.MustCompile(`(\d+)\s*(ml|g|gm|kg|tablets?|caps?|pills?)`)
	if matches := sizeRegex.FindStringSubmatch(text); len(matches) > 0 {
		return matches[0]
	}
	return ""
}

// extractSubstance - Extract substance name by removing other tokens
func (pn *ProductNormalizer) extractSubstance(text string, parsed *ParsedProduct) string {
	// Remove potency tokens
	if parsed.Potency != "" {
		potencyPattern := fmt.Sprintf(`\b%s\s*%s\b`, parsed.Potency, strings.ToLower(parsed.PotencyScale))
		text = regexp.MustCompile(potencyPattern).ReplaceAllString(text, "")
		text = regexp.MustCompile(fmt.Sprintf(`\b%s\b`, parsed.Potency)).ReplaceAllString(text, "")
	}

	// Remove form tokens
	if parsed.Form != "" && parsed.Form != "unknown" {
		text = strings.ReplaceAll(text, parsed.Form, "")
	}

	// Remove pack size
	if parsed.PackSize != "" {
		text = strings.ReplaceAll(text, parsed.PackSize, "")
	}

	// Remove common noise words
	noiseWords := []string{"with", "homeopathic", "medicine", "remedy", "brand", "pharma", "lab", "laboratories"}
	for _, noise := range noiseWords {
		text = strings.ReplaceAll(text, noise, "")
	}

	// Clean up
	text = strings.TrimSpace(text)
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")

	return text
}

// calculateConfidence - Determine confidence score
func (pn *ProductNormalizer) calculateConfidence(parsed *ParsedProduct) float64 {
	score := 0.0

	if parsed.Substance != "" && len(parsed.Substance) > 2 {
		score += 40.0
	}
	if parsed.Potency != "" {
		score += 30.0
	}
	if parsed.Form != "" && parsed.Form != "unknown" {
		score += 20.0
	}
	if parsed.PackSize != "" {
		score += 10.0
	}

	return score
}

// ============================================================================
// PRODUCT MATCHING (Simple version - uses existing products table)
// ============================================================================

// FindMatchingProduct - Find existing product by name or barcode
func (pn *ProductNormalizer) FindMatchingProduct(productName, barcode string) (*models.Product, float64, error) {
	if productName == "" && barcode == "" {
		return nil, 0, fmt.Errorf("empty product identifiers")
	}

	var product models.Product
	
	// Try barcode first (exact match)
	if barcode != "" {
		err := pn.db.Where("barcode = ?", barcode).First(&product).Error
		if err == nil {
			return &product, 100.0, nil
		}
	}

	// Try name match
	if productName != "" {
		err := pn.db.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(productName)+"%").
			First(&product).Error
		if err == nil {
			return &product, 85.0, nil
		}
	}

	return nil, 0, fmt.Errorf("no matching product found")
}

// ============================================================================
// IMPORT PIPELINE
// ============================================================================

// ProcessImportRow - Process single CSV row
func (pn *ProductNormalizer) ProcessImportRow(sessionID string, row map[string]interface{}) (*models.ProductImportStaging, error) {
	staging := &models.ProductImportStaging{
		SessionID:   sessionID,
		Status:      "pending",
		RawData:     pn.mapToJSON(row),
		ProductName: pn.getString(row, "product_name"),
		BrandName:   pn.getString(row, "brand"),
		Barcode:     pn.getString(row, "barcode"),
		HSNCode:     pn.getString(row, "hsn_code"),
		MRP:         pn.getFloat(row, "mrp"),
	}

	// Parse product name
	parsed := pn.NormalizeProductName(staging.ProductName)
	staging.ParsedSubstance = parsed.Substance
	staging.ParsedPotency = parsed.Potency
	staging.ParsedScale = parsed.PotencyScale
	staging.ParsedForm = parsed.Form
	
	// Detect category automatically
	if pn.classifier != nil {
		categoryMatch, _ := pn.classifier.ClassifyProduct(parsed, staging.ProductName)
		if categoryMatch != nil && categoryMatch.Confidence >= 80 {
			// Store category info in review notes for now
			staging.ReviewNotes = fmt.Sprintf("Auto-detected: %s > %s (%.0f%% confidence)", 
				categoryMatch.CategoryName, 
				categoryMatch.SubcategoryName, 
				categoryMatch.Confidence)
		}
	}

	// Try to find matching existing product by name/barcode
	if parsed.Substance != "" {
		var existingProduct models.Product
		err := pn.db.Where("LOWER(name) LIKE ? OR barcode = ?", 
			"%"+strings.ToLower(parsed.Substance)+"%", 
			staging.Barcode).
			First(&existingProduct).Error
			
		if err == nil {
			// Found existing product
			staging.MatchedProductID = &existingProduct.ID
			staging.MatchConfidence = 90.0
			staging.MatchMethod = "existing_product"
		} else {
			// No match found - mark for review
			staging.MatchMethod = "not_found"
			staging.ErrorMessage = "No matching product found. Create new?"
			staging.Status = "pending_review"
		}
	}

	// Auto-apply GST rules
	if staging.ParsedForm == "cream" || staging.ParsedForm == "ointment" || staging.ParsedForm == "gel" {
		// Cosmetic - 18% GST
		// Will be overridden if substance type is homeopathy_medicine
	}

	// Save to staging
	err := pn.db.Create(staging).Error
	return staging, err
}

// ============================================================================
// HELPER METHODS
// ============================================================================

func (pn *ProductNormalizer) getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func (pn *ProductNormalizer) getFloat(m map[string]interface{}, key string) float64 {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case string:
			// Parse string to float if needed
		}
	}
	return 0.0
}

func (pn *ProductNormalizer) mapToJSON(m map[string]interface{}) string {
	b, _ := json.Marshal(m)
	return string(b)
}

func (pn *ProductNormalizer) productsToJSON(products []models.Product) string {
	b, _ := json.Marshal(products)
	return string(b)
}

// ============================================================================
// BUSINESS RULES
// ============================================================================

// DetermineGST - Apply GST rules based on form  
func (pn *ProductNormalizer) DetermineGST(form string) (taxRate float64) {
	// Default: Homeopathy medicine - 5% GST
	taxRate = 5.0

	// Cosmetics/External use - 18% GST
	if form == "cream" || form == "ointment" || form == "gel" || form == "lotion" {
		return 18.0
	}

	// Mother Tincture - typically 5%
	if form == "mt" {
		return 5.0
	}

	return taxRate
}
