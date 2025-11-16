package services

import (
	"regexp"
	"strings"

	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// CategoryClassifier - Intelligent category detection for homeopathy products
type CategoryClassifier struct {
	db *gorm.DB
	
	// Cached data
	biochemicList    map[string]bool
	categoryCache    map[string]*models.Category
}

func NewCategoryClassifier(db *gorm.DB) *CategoryClassifier {
	classifier := &CategoryClassifier{
		db:            db,
		biochemicList: make(map[string]bool),
		categoryCache: make(map[string]*models.Category),
	}
	
	// Initialize biochemic list
	biochemics := []string{
		"calcarea fluorica", "calc fluor",
		"calcarea phosphorica", "calc phos",
		"calcarea sulphurica", "calc sulph",
		"ferrum phosphoricum", "ferrum phos",
		"kali muriaticum", "kali mur",
		"kali phosphoricum", "kali phos",
		"kali sulphuricum", "kali sulph",
		"magnesia phosphorica", "mag phos",
		"natrum muriaticum", "nat mur",
		"natrum phosphoricum", "nat phos",
		"natrum sulphuricum", "nat sulph",
		"silicea", "silica",
	}
	
	for _, name := range biochemics {
		classifier.biochemicList[strings.ToLower(name)] = true
	}
	
	return classifier
}

// ClassifyProduct - Main entry point for category detection
func (cc *CategoryClassifier) ClassifyProduct(parsed *ParsedProduct, productName string) (*CategoryMatch, error) {
	productNameLower := strings.ToLower(productName)
	substanceLower := strings.ToLower(parsed.Substance)
	
	// RULE 1: Bio-Combination (BC-1 to BC-28)
	if match := cc.isBioCombination(productNameLower, parsed.Potency); match != nil {
		return match, nil
	}
	
	// RULE 2: Biochemic (12 cell salts in X potencies)
	if match := cc.isBiochemic(substanceLower, parsed.PotencyScale); match != nil {
		return match, nil
	}
	
	// RULE 3: Mother Tincture (Q/MT)
	if match := cc.isMotherTincture(productNameLower, parsed.Form); match != nil {
		return match, nil
	}
	
	// RULE 4: Topical (Ointment/Cream/Gel)
	if match := cc.isTopical(parsed.Form); match != nil {
		return match, nil
	}
	
	// RULE 5: Patent Medicine (R1-R89, Alpha-XX, B&T, SBL)
	if match := cc.isPatentMedicine(productNameLower); match != nil {
		return match, nil
	}
	
	// RULE 6: Dilution (C/CH/M potencies with single remedy)
	if match := cc.isDilution(parsed.PotencyScale, parsed.Substance); match != nil {
		return match, nil
	}
	
	// RULE 7: Hair/Massage Oils
	if match := cc.isSpecialOil(productNameLower); match != nil {
		return match, nil
	}
	
	// RULE 8: Syrups/Tonics
	if match := cc.isSyrup(productNameLower); match != nil {
		return match, nil
	}
	
	// RULE 9: Cosmetics (Shampoo, Toothpaste)
	if match := cc.isCosmetic(productNameLower); match != nil {
		return match, nil
	}
	
	// RULE 10: Special Items (Empty Bottles, Medical Supplies)
	if match := cc.isSpecialItem(productNameLower); match != nil {
		return match, nil
	}
	
	// DEFAULT: Cannot detect - Manual Review
	return &CategoryMatch{
		Confidence:  0,
		MatchReason: "Could not auto-detect category. Manual review required.",
	}, nil
}

// ============================================================================
// CLASSIFICATION RULES
// ============================================================================

// RULE 1: Bio-Combination (BC-1 to BC-28)
func (cc *CategoryClassifier) isBioCombination(productName, potency string) *CategoryMatch {
	// Pattern: BC-1, BC-12, BC-28, BC 1, BC 12, etc.
	bcPattern := regexp.MustCompile(`\bbc[\s\-]?(\d+)\b`)
	if matches := bcPattern.FindStringSubmatch(productName); len(matches) > 1 {
		bcNumber := matches[1]
		return &CategoryMatch{
			CategoryName:    "Bio Combination",
			CategorySlug:    "bio-combination",
			SubcategoryName: "BC-" + bcNumber,
			SubcategorySlug: "bc-" + bcNumber,
			Confidence:      100.0,
			MatchReason:     "Matched BC pattern: BC-" + bcNumber,
		}
	}
	return nil
}

// RULE 2: Biochemic (12 cell salts in X potencies)
func (cc *CategoryClassifier) isBiochemic(substance, potencyScale string) *CategoryMatch {
	// Check if substance is in biochemic list
	if !cc.biochemicList[substance] {
		return nil
	}
	
	// Check if potency is X scale (3X, 6X, 12X, 30X)
	if potencyScale == "X" {
		return &CategoryMatch{
			CategoryName:    "Biochemic",
			CategorySlug:    "biochemic",
			SubcategoryName: "Tablets",
			SubcategorySlug: "tablets",
			Confidence:      100.0,
			MatchReason:     "Biochemic remedy with X potency: " + substance,
		}
	}
	
	return nil
}

// RULE 3: Mother Tincture (Q/MT)
func (cc *CategoryClassifier) isMotherTincture(productName, form string) *CategoryMatch {
	// Keywords: Q, MT, Mother Tincture, Mother, Tincture
	mtKeywords := []string{"mother tincture", " mt ", " q ", "\\bq\\b", "\\bmt\\b"}
	
	for _, keyword := range mtKeywords {
		if matched, _ := regexp.MatchString(keyword, productName); matched {
			return &CategoryMatch{
				CategoryName:    "Mother Tinctures",
				CategorySlug:    "mother-tinctures",
				SubcategoryName: "Q/MT",
				SubcategorySlug: "q-mt",
				Confidence:      95.0,
				MatchReason:     "Matched MT keyword",
			}
		}
	}
	
	// Also check form
	if form == "mt" || form == "q" {
		return &CategoryMatch{
			CategoryName:    "Mother Tinctures",
			CategorySlug:    "mother-tinctures",
			SubcategoryName: "Q/MT",
			SubcategorySlug: "q-mt",
			Confidence:      95.0,
			MatchReason:     "Form detected as MT/Q",
		}
	}
	
	return nil
}

// RULE 4: Topical (Ointment/Cream/Gel)
func (cc *CategoryClassifier) isTopical(form string) *CategoryMatch {
	topicalForms := map[string]string{
		"ointment": "Ointment",
		"oint":     "Ointment",
		"cream":    "Cream",
		"crm":      "Cream",
		"gel":      "Gel",
	}
	
	if subcatName, exists := topicalForms[form]; exists {
		return &CategoryMatch{
			CategoryName:    "Ointments & Creams",
			CategorySlug:    "ointments-creams",
			SubcategoryName: subcatName,
			SubcategorySlug: strings.ToLower(subcatName),
			Confidence:      95.0,
			MatchReason:     "Topical form detected: " + form,
		}
	}
	
	return nil
}

// RULE 5: Patent Medicine (R1-R89, Alpha-XX, B&T, SBL)
func (cc *CategoryClassifier) isPatentMedicine(productName string) *CategoryMatch {
	patterns := []struct {
		regex   string
		series  string
		subcat  string
		subcatSlug string
	}{
		{`\br(\d+)\b`, "Reckeweg R Series", "Reckeweg R Series", "reckeweg-r"},
		{`alpha-[a-z]+`, "Schwabe Alpha Series", "Schwabe Alpha Series", "schwabe-alpha"},
		{`b&t-\d+`, "Bakson B&T", "Bakson B Series", "bakson-b"},
		{`\bb-\d+\b`, "Bakson B Series", "Bakson B Series", "bakson-b"},
		{`sbl.*(?:tonic|hair|oil)`, "SBL Proprietary", "SBL Tonics", "sbl-tonics"},
		{`jaborandi`, "SBL Hair Oil", "SBL Oils", "sbl-oils"},
		{`five phos`, "SBL Tonic", "SBL Tonics", "sbl-tonics"},
		{`allen`, "Allen Proprietary", "Allen Proprietary", "allen-proprietary"},
	}
	
	for _, p := range patterns {
		if matched, _ := regexp.MatchString(p.regex, productName); matched {
			return &CategoryMatch{
				CategoryName:    "Patent Medicines",
				CategorySlug:    "patent-medicines",
				SubcategoryName: p.subcat,
				SubcategorySlug: p.subcatSlug,
				Confidence:      90.0,
				MatchReason:     "Matched patent pattern: " + p.series,
			}
		}
	}
	
	return nil
}

// RULE 6: Dilution (C/CH/M potencies)
func (cc *CategoryClassifier) isDilution(potencyScale, substance string) *CategoryMatch {
	// Valid dilution scales
	dilutionScales := map[string]bool{
		"C":  true,
		"CH": true,
		"M":  true,
		"CM": true,
		"LM": true,
	}
	
	if dilutionScales[potencyScale] && substance != "" {
		// Determine subcategory from potency scale
		subcatName := potencyScale
		if potencyScale == "CH" {
			subcatName = "30C" // Default, should be set from parsed potency
		}
		
		return &CategoryMatch{
			CategoryName:    "Dilutions",
			CategorySlug:    "dilutions",
			SubcategoryName: subcatName,
			SubcategorySlug: strings.ToLower(subcatName),
			Confidence:      85.0,
			MatchReason:     "Single remedy with C/CH/M potency",
		}
	}
	
	return nil
}

// RULE 7: Hair/Massage Oils
func (cc *CategoryClassifier) isSpecialOil(productName string) *CategoryMatch {
	if strings.Contains(productName, "hair") && strings.Contains(productName, "oil") {
		return &CategoryMatch{
			CategoryName:    "Hair Oils",
			CategorySlug:    "hair-oils",
			Confidence:      90.0,
			MatchReason:     "Matched 'hair oil' keyword",
		}
	}
	
	if strings.Contains(productName, "massage") && strings.Contains(productName, "oil") {
		return &CategoryMatch{
			CategoryName:    "Massage Oils",
			CategorySlug:    "massage-oils",
			Confidence:      90.0,
			MatchReason:     "Matched 'massage oil' keyword",
		}
	}
	
	return nil
}

// RULE 8: Syrups/Tonics
func (cc *CategoryClassifier) isSyrup(productName string) *CategoryMatch {
	syrupKeywords := []string{"syrup", "tonic", "liquid"}
	
	for _, keyword := range syrupKeywords {
		if strings.Contains(productName, keyword) {
			return &CategoryMatch{
				CategoryName:    "Syrups",
				CategorySlug:    "syrups",
				Confidence:      85.0,
				MatchReason:     "Matched syrup/tonic keyword",
			}
		}
	}
	
	return nil
}

// RULE 9: Cosmetics (Shampoo, Toothpaste)
func (cc *CategoryClassifier) isCosmetic(productName string) *CategoryMatch {
	cosmeticKeywords := map[string]string{
		"shampoo":   "Shampoo",
		"toothpaste": "Toothpaste",
		"soap":      "Cosmetics",
		"facewash":  "Cosmetics",
	}
	
	for keyword, category := range cosmeticKeywords {
		if strings.Contains(productName, keyword) {
			return &CategoryMatch{
				CategoryName:    category,
				CategorySlug:    strings.ToLower(strings.ReplaceAll(category, " ", "-")),
				Confidence:      90.0,
				MatchReason:     "Matched cosmetic keyword: " + keyword,
			}
		}
	}
	
	return nil
}

// RULE 10: Special Items
func (cc *CategoryClassifier) isSpecialItem(productName string) *CategoryMatch {
	specialKeywords := map[string]string{
		"empty bottle":  "Empty Bottles",
		"bottle":        "Empty Bottles",
		"vial":          "Empty Bottles",
		"globule":       "Globules",
		"blank tablet":  "Special Items",
		"distilled water": "Special Items",
		"dispenser":     "Medical Supplies",
		"dropper":       "Medical Supplies",
	}
	
	for keyword, category := range specialKeywords {
		if strings.Contains(productName, keyword) {
			return &CategoryMatch{
				CategoryName:    category,
				CategorySlug:    strings.ToLower(strings.ReplaceAll(category, " ", "-")),
				Confidence:      80.0,
				MatchReason:     "Matched special item keyword: " + keyword,
			}
		}
	}
	
	return nil
}

// ============================================================================
// HELPER METHODS
// ============================================================================

// GetCategoryBySlug - Fetch category from DB with caching  
func (cc *CategoryClassifier) GetCategoryBySlug(slug string) (*models.Category, error) {
	if cached, exists := cc.categoryCache[slug]; exists {
		return cached, nil
	}
	
	var category models.Category
	err := cc.db.Where("slug = ? AND is_active = ? AND parent_id IS NULL", slug, true).First(&category).Error
	if err != nil {
		return nil, err
	}
	
	cc.categoryCache[slug] = &category
	return &category, nil
}

// GetSubcategoryByCode - Fetch subcategory (child category) from DB with caching
func (cc *CategoryClassifier) GetSubcategoryByCode(parentCode, childCode string) (*models.Category, error) {
	cacheKey := parentCode + ":" + childCode
	if cached, exists := cc.categoryCache[cacheKey]; exists {
		return cached, nil
	}
	
	// First get parent
	var parent models.Category
	err := cc.db.Where("code = ? AND parent_id IS NULL", parentCode).First(&parent).Error
	if err != nil {
		return nil, err
	}
	
	// Then get child
	var child models.Category
	err = cc.db.Where("code = ? AND parent_id = ?", childCode, parent.ID).First(&child).Error
	if err != nil {
		return nil, err
	}
	
	cc.categoryCache[cacheKey] = &child
	return &child, nil
}

// CategoryMatch - DTO for category detection result
type CategoryMatch struct {
	CategoryName    string  `json:"category_name"`
	CategorySlug    string  `json:"category_slug"`
	SubcategoryName string  `json:"subcategory_name"`
	SubcategorySlug string  `json:"subcategory_slug"`
	Confidence      float64 `json:"confidence"`
	MatchReason     string  `json:"match_reason"`
}
