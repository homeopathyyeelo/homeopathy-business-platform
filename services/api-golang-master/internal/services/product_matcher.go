package services

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

// ============================================================================
// Product Matching Service
// Implements multi-strategy matching: SKU → Barcode → Exact Name → Fuzzy Name
// ============================================================================

type MatchResult struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	SKU          string  `json:"sku"`
	Barcode      string  `json:"barcode"`
	MatchedBy    string  `json:"matchedBy"` // 'sku', 'barcode', 'exact_name', 'fuzzy_name'
	MatchScore   float64 `json:"matchScore"` // 1.0 for exact, 0-1 for fuzzy
	RequireReview bool   `json:"requireReview"`
}

type ProductMatcher struct {
	db *gorm.DB
}

func NewProductMatcher(db *gorm.DB) *ProductMatcher {
	return &ProductMatcher{db: db}
}

// ============================================================================
// Main matching function - tries all strategies in priority order
// ============================================================================
func (m *ProductMatcher) FindBestMatch(ctx context.Context, sku, barcode, name string) (*MatchResult, error) {
	// Strategy 1: Exact SKU match (highest priority)
	if sku != "" {
		if result, err := m.matchBySKU(ctx, sku); err == nil && result != nil {
			return result, nil
		} else if err != nil && err != gorm.ErrRecordNotFound {
			return nil, err
		}
	}

	// Strategy 2: Exact Barcode match
	if barcode != "" {
		if result, err := m.matchByBarcode(ctx, barcode); err == nil && result != nil {
			return result, nil
		} else if err != nil && err != gorm.ErrRecordNotFound {
			return nil, err
		}
	}

	// Strategy 3: Exact name match (case-insensitive)
	if name != "" {
		if result, err := m.matchByExactName(ctx, name); err == nil && result != nil {
			return result, nil
		} else if err != nil && err != gorm.ErrRecordNotFound {
			return nil, err
		}
	}

	// Strategy 4: Fuzzy name match using pg_trgm similarity
	if name != "" {
		if result, err := m.matchByFuzzyName(ctx, name); err == nil && result != nil {
			return result, nil
		} else if err != nil && err != gorm.ErrRecordNotFound {
			return nil, err
		}
	}

	// No match found
	return nil, nil
}

// ============================================================================
// Strategy 1: Match by SKU (100% confidence)
// ============================================================================
func (m *ProductMatcher) matchBySKU(ctx context.Context, sku string) (*MatchResult, error) {
	var product struct {
		ID      string
		SKU     string
		Name    string
		Barcode string
	}

	err := m.db.WithContext(ctx).
		Table("products").
		Select("id, sku, name, barcode").
		Where("sku = ?", sku).
		First(&product).Error

	if err != nil {
		return nil, err
	}

	return &MatchResult{
		ProductID:    product.ID,
		ProductName:  product.Name,
		SKU:          product.SKU,
		Barcode:      product.Barcode,
		MatchedBy:    "sku",
		MatchScore:   1.0,
		RequireReview: false,
	}, nil
}

// ============================================================================
// Strategy 2: Match by Barcode (100% confidence)
// ============================================================================
func (m *ProductMatcher) matchByBarcode(ctx context.Context, barcode string) (*MatchResult, error) {
	var product struct {
		ID      string
		SKU     string
		Name    string
		Barcode string
	}

	err := m.db.WithContext(ctx).
		Table("products").
		Select("id, sku, name, barcode").
		Where("barcode = ?", barcode).
		First(&product).Error

	if err != nil {
		return nil, err
	}

	return &MatchResult{
		ProductID:    product.ID,
		ProductName:  product.Name,
		SKU:          product.SKU,
		Barcode:      product.Barcode,
		MatchedBy:    "barcode",
		MatchScore:   1.0,
		RequireReview: false,
	}, nil
}

// ============================================================================
// Strategy 3: Match by exact name (case-insensitive, 95% confidence)
// ============================================================================
func (m *ProductMatcher) matchByExactName(ctx context.Context, name string) (*MatchResult, error) {
	normalizedName := normalizeName(name)
	
	var product struct {
		ID      string
		SKU     string
		Name    string
		Barcode string
	}

	err := m.db.WithContext(ctx).
		Table("products").
		Select("id, sku, name, barcode").
		Where("LOWER(name) = ?", normalizedName).
		First(&product).Error

	if err != nil {
		return nil, err
	}

	return &MatchResult{
		ProductID:    product.ID,
		ProductName:  product.Name,
		SKU:          product.SKU,
		Barcode:      product.Barcode,
		MatchedBy:    "exact_name",
		MatchScore:   0.95,
		RequireReview: false,
	}, nil
}

// ============================================================================
// Strategy 4: Match by fuzzy name using pg_trgm similarity
// Score >= 0.45: auto-match
// Score 0.35-0.44: possible match, requires review
// Score < 0.35: no match
// ============================================================================
func (m *ProductMatcher) matchByFuzzyName(ctx context.Context, name string) (*MatchResult, error) {
	normalizedName := normalizeName(name)
	
	var result struct {
		ID      string
		SKU     string
		Name    string
		Barcode string
		Score   float64
	}

	err := m.db.WithContext(ctx).
		Table("products").
		Select("id, sku, name, barcode, similarity(LOWER(name), ?) as score", normalizedName).
		Where("similarity(LOWER(name), ?) > 0.30", normalizedName).
		Order("score DESC").
		Limit(1).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	// Determine if review is required based on score
	requireReview := result.Score < 0.45

	return &MatchResult{
		ProductID:    result.ID,
		ProductName:  result.Name,
		SKU:          result.SKU,
		Barcode:      result.Barcode,
		MatchedBy:    "fuzzy_name",
		MatchScore:   result.Score,
		RequireReview: requireReview,
	}, nil
}

// ============================================================================
// Helper: Normalize name for matching
// ============================================================================
func normalizeName(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ToLower(s)
	// Remove extra whitespace
	s = strings.Join(strings.Fields(s), " ")
	return s
}

// ============================================================================
// Batch matching - match multiple products at once (optimized)
// ============================================================================
type BatchMatchRequest struct {
	SKU     string
	Barcode string
	Name    string
	RowIndex int
}

func (m *ProductMatcher) BatchMatch(ctx context.Context, requests []BatchMatchRequest) (map[int]*MatchResult, error) {
	results := make(map[int]*MatchResult)

	// Collect all SKUs and barcodes for bulk lookup
	skus := make([]string, 0)
	barcodes := make([]string, 0)
	
	for _, req := range requests {
		if req.SKU != "" {
			skus = append(skus, req.SKU)
		}
		if req.Barcode != "" {
			barcodes = append(barcodes, req.Barcode)
		}
	}

	// Bulk fetch products by SKU
	skuMap := make(map[string]*MatchResult)
	if len(skus) > 0 {
		var products []struct {
			ID      string
			SKU     string
			Name    string
			Barcode string
		}
		m.db.WithContext(ctx).
			Table("products").
			Select("id, sku, name, barcode").
			Where("sku IN ?", skus).
			Find(&products)

		for _, p := range products {
			skuMap[p.SKU] = &MatchResult{
				ProductID:    p.ID,
				ProductName:  p.Name,
				SKU:          p.SKU,
				Barcode:      p.Barcode,
				MatchedBy:    "sku",
				MatchScore:   1.0,
				RequireReview: false,
			}
		}
	}

	// Bulk fetch products by Barcode
	barcodeMap := make(map[string]*MatchResult)
	if len(barcodes) > 0 {
		var products []struct {
			ID      string
			SKU     string
			Name    string
			Barcode string
		}
		m.db.WithContext(ctx).
			Table("products").
			Select("id, sku, name, barcode").
			Where("barcode IN ?", barcodes).
			Find(&products)

		for _, p := range products {
			barcodeMap[p.Barcode] = &MatchResult{
				ProductID:    p.ID,
				ProductName:  p.Name,
				SKU:          p.SKU,
				Barcode:      p.Barcode,
				MatchedBy:    "barcode",
				MatchScore:   1.0,
				RequireReview: false,
			}
		}
	}

	// Match each request
	for _, req := range requests {
		// Try SKU first
		if req.SKU != "" {
			if match, ok := skuMap[req.SKU]; ok {
				results[req.RowIndex] = match
				continue
			}
		}

		// Try Barcode
		if req.Barcode != "" {
			if match, ok := barcodeMap[req.Barcode]; ok {
				results[req.RowIndex] = match
				continue
			}
		}

		// Fallback to name matching (exact or fuzzy)
		if req.Name != "" {
			match, _ := m.FindBestMatch(ctx, "", "", req.Name)
			if match != nil {
				results[req.RowIndex] = match
			}
		}
	}

	return results, nil
}
