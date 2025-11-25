package handlers

import (
	"context"
	"fmt"
	"strings"

	"github.com/sashabaranov/go-openai"
)

// SemanticSearchResult represents a product found via semantic search
type SemanticSearchResult struct {
	ID           string  `gorm:"column:id"`
	Name         string  `gorm:"column:name"`
	SKU          string  `gorm:"column:sku"`
	Barcode      string  `gorm:"column:barcode"`
	Description  string  `gorm:"column:description"`
	MRP          float64 `gorm:"column:mrp"`
	Stock        float64 `gorm:"column:current_stock"`
	BrandName    string  `gorm:"column:brand_name"`
	CategoryName string  `gorm:"column:category_name"`
	PotencyName  string  `gorm:"column:potency_name"`
	Form         string  `gorm:"column:form"`
	Similarity   float64 `gorm:"column:similarity"`
}

// SemanticSearch performs vector similarity search using embeddings
func (h *SearchHandler) SemanticSearch(query string, limit int) ([]SearchResult, error) {
	// Check if embeddings exist
	var count int64
	h.db.Raw("SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL").Scan(&count)

	if count == 0 {
		fmt.Println("⚠️  No embeddings found. Run generate_embeddings.py first.")
		return nil, fmt.Errorf("embeddings not generated")
	}

	// Generate embedding for search query
	ctx := context.Background()
	resp, err := h.OpenAIClient.CreateEmbeddings(
		ctx,
		openai.EmbeddingRequest{
			Model: openai.SmallEmbedding3,
			Input: []string{query},
		},
	)
	if err != nil {
		fmt.Printf("❌ Error generating query embedding: %v\n", err)
		return nil, err
	}

	queryEmbedding := resp.Data[0].Embedding

	// Convert to PostgreSQL vector format
	embeddingParts := make([]string, len(queryEmbedding))
	for i, v := range queryEmbedding {
		embeddingParts[i] = fmt.Sprintf("%f", v)
	}
	embeddingStr := "[" + strings.Join(embeddingParts, ",") + "]"

	// Perform similarity search using cosine distance
	var semanticResults []SemanticSearchResult
	err = h.db.Raw(`
		SELECT 
			p.id,
			p.name,
			p.sku,
			p.barcode,
			p.description,
			p.mrp,
			p.current_stock as stock,
			p.form,
			b.name as brand_name,
			c.name as category_name,
			pot.name as potency_name,
			1 - (p.embedding <=> ?::vector) as similarity
		FROM products p
		LEFT JOIN brands b ON p.brand_id = b.id
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN potencies pot ON p.potency_id = pot.id
		WHERE p.embedding IS NOT NULL
		ORDER BY p.embedding <=> ?::vector
		LIMIT ?
	`, embeddingStr, embeddingStr, limit).Scan(&semanticResults).Error

	if err != nil {
		fmt.Printf("❌ Semantic search error: %v\n", err)
		return nil, err
	}

	fmt.Printf("🔍 Semantic search found: %d results for query: '%s'\n", len(semanticResults), query)

	// Convert to SearchResult format
	var results []SearchResult
	for _, sr := range semanticResults {
		// Build descriptive title
		title := sr.Name
		if sr.BrandName != "" {
			title = sr.BrandName + " - " + sr.Name
		}
		if sr.PotencyName != "" {
			title += " (" + sr.PotencyName + ")"
		}

		results = append(results, SearchResult{
			ID:          sr.ID,
			Name:        title,
			SKU:         sr.SKU,
			Barcode:     sr.Barcode,
			Brand:       sr.BrandName,
			Category:    sr.CategoryName,
			Potency:     sr.PotencyName,
			Form:        sr.Form,
			MRP:         sr.MRP,
			Stock:       int(sr.Stock),
			Description: sr.Description,
			Type:        "product",
			Module:      "products",
			NavigateURL: fmt.Sprintf("/products/%s", sr.ID),
			Metadata: map[string]interface{}{
				"source":     "semantic_search",
				"similarity": sr.Similarity,
				"query":      query,
			},
		})
	}

	return results, nil
}

// HasEmbeddings checks if products have embeddings
func (h *SearchHandler) HasEmbeddings() bool {
	var count int64
	h.db.Raw("SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL").Scan(&count)
	return count > 0
}
