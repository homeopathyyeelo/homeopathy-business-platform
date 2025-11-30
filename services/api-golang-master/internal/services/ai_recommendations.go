package services

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

// AIRecommendationService handles AI-powered product recommendations
type AIRecommendationService struct {
	db *gorm.DB
}

// NewAIRecommendationService creates a new AI recommendation service
func NewAIRecommendationService(db *gorm.DB) *AIRecommendationService {
	return &AIRecommendationService{db: db}
}

// ProductRecommendation represents a recommended product with score
type ProductRecommendation struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	SKU          string  `json:"sku"`
	MRP          float64 `json:"mrp"`
	SellingPrice float64 `json:"sellingPrice"`
	Category     string  `json:"category"`
	Brand        string  `json:"brand"`
	Confidence   float64 `json:"confidence"` // How often bought together (0-1)
	Support      int     `json:"support"`    // Number of times bought together
	Reason       string  `json:"reason"`     // Why recommended
	Stock        float64 `json:"stock"`      // Available stock
	ImageURL     string  `json:"imageUrl"`
}

// GetRecommendations returns product recommendations based on cart items
func (s *AIRecommendationService) GetRecommendations(productIDs []string, limit int) ([]ProductRecommendation, error) {
	if len(productIDs) == 0 {
		return []ProductRecommendation{}, nil
	}

	// Query to find products frequently bought together
	// Using collaborative filtering approach
	query := `
		WITH cart_products AS (
			SELECT UNNEST($1::UUID[]) AS product_id
		),
		invoices_with_cart_products AS (
			-- Find all invoices containing any of the cart products
			SELECT DISTINCT sii.invoice_id
			FROM sales_invoice_items sii
			WHERE sii.product_id IN (SELECT product_id FROM cart_products)
			AND sii.created_at > NOW() - INTERVAL '6 months' -- Recent data only
		),
		co_purchased_products AS (
			-- Find all products from those invoices (excluding cart products)
			SELECT 
				sii.product_id,
				COUNT(DISTINCT sii.invoice_id) AS co_purchase_count,
				COUNT(*) AS total_quantity
			FROM sales_invoice_items sii
			WHERE sii.invoice_id IN (SELECT invoice_id FROM invoices_with_cart_products)
			AND sii.product_id NOT IN (SELECT product_id FROM cart_products)
			GROUP BY sii.product_id
		)
		SELECT 
			p.id,
			p.name,
			p.sku,
			p.mrp,
			p.selling_price,
			p.current_stock,
			COALESCE(c.name, '') AS category,
			COALESCE(b.name, '') AS brand,
			cpp.co_purchase_count,
			cpp.total_quantity,
			-- Calculate confidence: co_purchase_count / total_invoices_with_cart_product
			CAST(cpp.co_purchase_count AS FLOAT) / NULLIF((SELECT COUNT(DISTINCT invoice_id) FROM invoices_with_cart_products), 0) AS confidence
		FROM co_purchased_products cpp
		JOIN products p ON p.id = cpp.product_id
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		WHERE p.is_active = true
		AND p.current_stock > 0 -- Only recommend in-stock items
		ORDER BY confidence DESC, cpp.co_purchase_count DESC
		LIMIT $2
	`

	type queryResult struct {
		ID              string
		Name            string
		SKU             string
		MRP             float64
		SellingPrice    float64 `gorm:"column:selling_price"`
		CurrentStock    float64 `gorm:"column:current_stock"`
		Category        string
		Brand           string
		CoPurchaseCount int `gorm:"column:co_purchase_count"`
		TotalQuantity   int `gorm:"column:total_quantity"`
		Confidence      float64
	}

	var results []queryResult
	if err := s.db.Raw(query, productIDs, limit).Scan(&results).Error; err != nil {
		return nil, err
	}

	// Convert to recommendations
	recommendations := make([]ProductRecommendation, len(results))
	for i, r := range results {
		reason := "Frequently bought together"
		if len(productIDs) == 1 {
			reason = "Customers who bought this item also bought"
		}

		recommendations[i] = ProductRecommendation{
			ProductID:    r.ID,
			ProductName:  r.Name,
			SKU:          r.SKU,
			MRP:          r.MRP,
			SellingPrice: r.SellingPrice,
			Category:     r.Category,
			Brand:        r.Brand,
			Confidence:   r.Confidence,
			Support:      r.CoPurchaseCount,
			Reason:       reason,
			Stock:        r.CurrentStock,
		}
	}

	// If no recommendations found from purchase history, fallback to category-based
	if len(recommendations) == 0 && len(productIDs) > 0 {
		return s.getCategoryBasedRecommendations(productIDs[0], limit)
	}

	return recommendations, nil
}

// getCategoryBasedRecommendations provides fallback recommendations based on category
func (s *AIRecommendationService) getCategoryBasedRecommendations(productID string, limit int) ([]ProductRecommendation, error) {
	query := `
		WITH product_category AS (
			SELECT category_id, brand_id FROM products WHERE id = $1
		)
		SELECT 
			p.id,
			p.name,
			p.sku,
			p.mrp,
			p.selling_price,
			p.current_stock,
			COALESCE(c.name, '') AS category,
			COALESCE(b.name, '') AS brand
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		WHERE p.is_active = true
		AND p.current_stock > 0
		AND p.id != $1
		AND (
			p.category_id = (SELECT category_id FROM product_category)
			OR p.brand_id = (SELECT brand_id FROM product_category)
		)
		ORDER BY RANDOM()
		LIMIT $2
	`

	type queryResult struct {
		ID           string
		Name         string
		SKU          string
		MRP          float64
		SellingPrice float64 `gorm:"column:selling_price"`
		CurrentStock float64 `gorm:"column:current_stock"`
		Category     string
		Brand        string
	}

	var results []queryResult
	if err := s.db.Raw(query, productID, limit).Scan(&results).Error; err != nil {
		return nil, err
	}

	recommendations := make([]ProductRecommendation, len(results))
	for i, r := range results {
		recommendations[i] = ProductRecommendation{
			ProductID:    r.ID,
			ProductName:  r.Name,
			SKU:          r.SKU,
			MRP:          r.MRP,
			SellingPrice: r.SellingPrice,
			Category:     r.Category,
			Brand:        r.Brand,
			Confidence:   0.5, // Lower confidence for category-based
			Support:      0,
			Reason:       "Similar products you may like",
			Stock:        r.CurrentStock,
		}
	}

	return recommendations, nil
}

// RecomputeRecommendations re-computes recommendations for all products and updates the cache
// This should be run as a nightly job
func (s *AIRecommendationService) RecomputeRecommendations() error {
	// Get all active products
	var products []models.Product
	if err := s.db.Where("is_active = ?", true).Find(&products).Error; err != nil {
		return err
	}

	for _, product := range products {
		// Calculate recommendations
		recs, err := s.GetRecommendations([]string{product.ID}, 6)
		if err != nil {
			continue
		}

		// Serialize to JSON
		recsJSON, err := json.Marshal(recs)
		if err != nil {
			continue
		}

		// Update cache
		var cacheEntry models.RecommendationCache
		if err := s.db.Where("product_id = ?", product.ID).First(&cacheEntry).Error; err != nil {
			// Create new entry
			cacheEntry = models.RecommendationCache{
				ID:                  uuid.New(),
				ProductID:           product.ID,
				RecommendationsJSON: string(recsJSON),
				LastComputedAt:      time.Now(),
			}
			s.db.Create(&cacheEntry)
		} else {
			// Update existing entry
			cacheEntry.RecommendationsJSON = string(recsJSON)
			cacheEntry.LastComputedAt = time.Now()
			s.db.Save(&cacheEntry)
		}
	}
	return nil
}

// GetRecommendationsWithCache tries to fetch from cache first, then falls back to live calculation
func (s *AIRecommendationService) GetRecommendationsWithCache(productIDs []string, limit int) ([]ProductRecommendation, error) {
	// If single product, try cache
	if len(productIDs) == 1 {
		var cacheEntry models.RecommendationCache
		if err := s.db.Where("product_id = ?", productIDs[0]).First(&cacheEntry).Error; err == nil {
			// Cache hit
			var recs []ProductRecommendation
			if err := json.Unmarshal([]byte(cacheEntry.RecommendationsJSON), &recs); err == nil {
				if len(recs) > limit {
					return recs[:limit], nil
				}
				return recs, nil
			}
		}
	}

	// Fallback to live calculation
	return s.GetRecommendations(productIDs, limit)
}
