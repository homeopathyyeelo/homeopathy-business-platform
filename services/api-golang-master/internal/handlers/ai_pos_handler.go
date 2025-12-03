package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type AIPOSHandler struct {
	db           *gorm.DB
	openaiClient *openai.Client
	openaiAPIKey string
}

func NewAIPOSHandler(db *gorm.DB, openaiAPIKey string) *AIPOSHandler {
	var client *openai.Client
	if openaiAPIKey != "" {
		client = openai.NewClient(openaiAPIKey)
	}
	return &AIPOSHandler{
		db:           db,
		openaiClient: client,
		openaiAPIKey: openaiAPIKey,
	}
}

// ProductSuggestion represents an AI-suggested product
type ProductSuggestion struct {
	ProductID      string  `json:"product_id"`
	ProductName    string  `json:"product_name"`
	SKU            string  `json:"sku"`
	Potency        string  `json:"potency,omitempty"`
	Form           string  `json:"form,omitempty"`
	Reason         string  `json:"reason"`
	Confidence     float64 `json:"confidence"`
	SuggestedPrice float64 `json:"suggested_price"`
	InStock        bool    `json:"in_stock"`
	StockQuantity  int     `json:"stock_quantity"`
	ProfitMargin   float64 `json:"profit_margin"`
	Category       string  `json:"category"`
	Type           string  `json:"type"` // "similar", "complementary", "frequently_bought", "upsell"
}

// POST /api/erp/pos/ai-suggestions
// Get AI-powered product suggestions based on cart
func (h *AIPOSHandler) GetAISuggestions(c *gin.Context) {
	var req struct {
		CartItems  []map[string]interface{} `json:"cart_items"`
		CustomerID string                   `json:"customer_id,omitempty"`
		Disease    string                   `json:"disease,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	suggestions := []ProductSuggestion{}

	// Method 1: Database-based suggestions (frequently bought together)
	dbSuggestions := h.getFrequentlyBoughtTogether(req.CartItems)
	suggestions = append(suggestions, dbSuggestions...)

	// Method 2: OpenAI-based intelligent suggestions
	if h.openaiClient != nil {
		aiSuggestions := h.getOpenAISuggestions(req.CartItems, req.Disease)
		suggestions = append(suggestions, aiSuggestions...)
	}

	// Method 3: Similar products (same category, different potency/form)
	similarProducts := h.getSimilarProducts(req.CartItems)
	suggestions = append(suggestions, similarProducts...)

	// Method 4: Upsell suggestions (higher margin, better quality)
	upsellProducts := h.getUpsellProducts(req.CartItems)
	suggestions = append(suggestions, upsellProducts...)

	// Remove duplicates and limit to top 10
	uniqueSuggestions := h.deduplicateAndRank(suggestions, 10)

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"suggestions": uniqueSuggestions,
		"count":       len(uniqueSuggestions),
	})
}

// Get frequently bought together products from historical sales data
func (h *AIPOSHandler) getFrequentlyBoughtTogether(cartItems []map[string]interface{}) []ProductSuggestion {
	if len(cartItems) == 0 {
		return []ProductSuggestion{}
	}

	// Extract product IDs from cart
	var productIDs []string
	for _, item := range cartItems {
		if pid, ok := item["product_id"].(string); ok {
			productIDs = append(productIDs, pid)
		}
	}

	if len(productIDs) == 0 {
		return []ProductSuggestion{}
	}

	// Query: Find products frequently bought with current cart items
	query := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			p.potency,
			p.form,
			COUNT(*) as frequency,
			AVG(ib.selling_price) as avg_price,
			AVG(ib.selling_price - ib.cost_price) / NULLIF(ib.cost_price, 0) * 100 as profit_margin,
			SUM(ib.quantity) as total_stock
		FROM invoice_items ii1
		JOIN invoice_items ii2 ON ii1.invoice_id = ii2.invoice_id
		JOIN products p ON ii2.product_id = p.id
		LEFT JOIN inventory_batches ib ON p.id = ib.product_id
		WHERE ii1.product_id = ANY($1)
			AND ii2.product_id != ALL($1)
			AND p.status = 'ACTIVE'
		GROUP BY p.id, p.name, p.sku, p.potency, p.form
		HAVING COUNT(*) >= 2
		ORDER BY frequency DESC, profit_margin DESC
		LIMIT 5
	`

	type Result struct {
		ProductID    string  `db:"product_id"`
		ProductName  string  `db:"product_name"`
		SKU          string  `db:"sku"`
		Potency      *string `db:"potency"`
		Form         *string `db:"form"`
		Frequency    int     `db:"frequency"`
		AvgPrice     float64 `db:"avg_price"`
		ProfitMargin float64 `db:"profit_margin"`
		TotalStock   int     `db:"total_stock"`
	}

	var results []Result
	err := h.db.Raw(query, productIDs).Scan(&results).Error
	if err != nil {
		return []ProductSuggestion{}
	}

	suggestions := []ProductSuggestion{}
	for _, r := range results {
		potency := ""
		if r.Potency != nil {
			potency = *r.Potency
		}
		form := ""
		if r.Form != nil {
			form = *r.Form
		}

		suggestions = append(suggestions, ProductSuggestion{
			ProductID:      r.ProductID,
			ProductName:    r.ProductName,
			SKU:            r.SKU,
			Potency:        potency,
			Form:           form,
			Reason:         "Frequently bought together",
			Confidence:     float64(r.Frequency) / 10.0, // Normalize
			SuggestedPrice: r.AvgPrice,
			InStock:        r.TotalStock > 0,
			StockQuantity:  r.TotalStock,
			ProfitMargin:   r.ProfitMargin,
			Type:           "frequently_bought",
		})
	}

	return suggestions
}

// Get OpenAI-powered intelligent suggestions
func (h *AIPOSHandler) getOpenAISuggestions(cartItems []map[string]interface{}, disease string) []ProductSuggestion {
	if h.openaiClient == nil {
		return []ProductSuggestion{}
	}

	// Build prompt
	cartItemsText := ""
	for _, item := range cartItems {
		name := item["name"].(string)
		cartItemsText += "- " + name + "\n"
	}

	prompt := `You are an expert homeopathy pharmacist AI assistant. 

Current cart items:
` + cartItemsText

	if disease != "" {
		prompt += `\nPatient condition: ` + disease + `

Based on the cart and patient condition, suggest 3-5 complementary homeopathic medicines that would work well together.`
	} else {
		prompt += `\nSuggest 3-5 complementary homeopathic medicines that are commonly used with these products.`
	}

	prompt += `

For each suggestion, provide:
1. Medicine name (e.g., "Arnica 30C", "Calendula Q")
2. Reason (why it complements the cart)
3. Confidence (0.0 to 1.0)

Return as JSON array:
[{"name": "...", "reason": "...", "confidence": 0.85}]`

	resp, err := h.openaiClient.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a homeopathy expert AI assistant. Always respond with valid JSON.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.7,
			MaxTokens:   500,
		},
	)

	if err != nil {
		return []ProductSuggestion{}
	}

	// Parse AI response
	type AIResponse struct {
		Name       string  `json:"name"`
		Reason     string  `json:"reason"`
		Confidence float64 `json:"confidence"`
	}

	var aiResponses []AIResponse
	content := resp.Choices[0].Message.Content
	err = json.Unmarshal([]byte(content), &aiResponses)
	if err != nil {
		// Try to extract JSON from markdown code blocks
		// Sometimes GPT returns ```json ... ```
		return []ProductSuggestion{}
	}

	// Match AI suggestions with actual products in database
	suggestions := []ProductSuggestion{}
	for _, ai := range aiResponses {
		// Search for product by name
		var product struct {
			ID           string  `db:"id"`
			Name         string  `db:"name"`
			SKU          string  `db:"sku"`
			Potency      *string `db:"potency"`
			Form         *string `db:"form"`
			SellingPrice float64 `db:"selling_price"`
			Stock        int     `db:"stock"`
		}

		query := `
			SELECT 
				p.id, p.name, p.sku, p.potency, p.form,
				ib.selling_price, 
				SUM(ib.quantity) as stock
			FROM products p
			LEFT JOIN inventory_batches ib ON p.id = ib.product_id
			WHERE p.name ILIKE $1 AND p.status = 'ACTIVE'
			GROUP BY p.id, p.name, p.sku, p.potency, p.form, ib.selling_price
			LIMIT 1
		`

		err := h.db.Raw(query, "%"+ai.Name+"%").Scan(&product).Error
		if err == nil && product.ID != "" {
			potency := ""
			if product.Potency != nil {
				potency = *product.Potency
			}
			form := ""
			if product.Form != nil {
				form = *product.Form
			}

			suggestions = append(suggestions, ProductSuggestion{
				ProductID:      product.ID,
				ProductName:    product.Name,
				SKU:            product.SKU,
				Potency:        potency,
				Form:           form,
				Reason:         "AI suggests: " + ai.Reason,
				Confidence:     ai.Confidence,
				SuggestedPrice: product.SellingPrice,
				InStock:        product.Stock > 0,
				StockQuantity:  product.Stock,
				Type:           "complementary",
			})
		}
	}

	return suggestions
}

// Get similar products (same category, different potency/form)
func (h *AIPOSHandler) getSimilarProducts(cartItems []map[string]interface{}) []ProductSuggestion {
	if len(cartItems) == 0 {
		return []ProductSuggestion{}
	}

	// Extract first product ID
	var firstProductID string
	for _, item := range cartItems {
		if pid, ok := item["product_id"].(string); ok {
			firstProductID = pid
			break
		}
	}

	if firstProductID == "" {
		return []ProductSuggestion{}
	}

	// Find similar products (same brand/category, different potency)
	query := `
		SELECT 
			p2.id as product_id,
			p2.name as product_name,
			p2.sku,
			p2.potency,
			p2.form,
			ib.selling_price,
			SUM(ib.quantity) as stock
		FROM products p1
		JOIN products p2 ON (p1.brand_id = p2.brand_id OR p1.category_id = p2.category_id)
		LEFT JOIN inventory_batches ib ON p2.id = ib.product_id
		WHERE p1.id = $1 
			AND p2.id != $1
			AND p2.status = 'ACTIVE'
			AND p2.potency != p1.potency
		GROUP BY p2.id, p2.name, p2.sku, p2.potency, p2.form, ib.selling_price
		ORDER BY RANDOM()
		LIMIT 3
	`

	type Result struct {
		ProductID    string  `db:"product_id"`
		ProductName  string  `db:"product_name"`
		SKU          string  `db:"sku"`
		Potency      *string `db:"potency"`
		Form         *string `db:"form"`
		SellingPrice float64 `db:"selling_price"`
		Stock        int     `db:"stock"`
	}

	var results []Result
	err := h.db.Raw(query, firstProductID).Scan(&results).Error
	if err != nil {
		return []ProductSuggestion{}
	}

	suggestions := []ProductSuggestion{}
	for _, r := range results {
		potency := ""
		if r.Potency != nil {
			potency = *r.Potency
		}
		form := ""
		if r.Form != nil {
			form = *r.Form
		}

		suggestions = append(suggestions, ProductSuggestion{
			ProductID:      r.ProductID,
			ProductName:    r.ProductName,
			SKU:            r.SKU,
			Potency:        potency,
			Form:           form,
			Reason:         "Similar product (different potency)",
			Confidence:     0.75,
			SuggestedPrice: r.SellingPrice,
			InStock:        r.Stock > 0,
			StockQuantity:  r.Stock,
			Type:           "similar",
		})
	}

	return suggestions
}

// Get upsell products (higher margin, premium brands)
func (h *AIPOSHandler) getUpsellProducts(cartItems []map[string]interface{}) []ProductSuggestion {
	// Find premium products with high profit margins
	query := `
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			p.potency,
			p.form,
			ib.selling_price,
			(ib.selling_price - ib.cost_price) / NULLIF(ib.cost_price, 0) * 100 as profit_margin,
			SUM(ib.quantity) as stock
		FROM products p
		JOIN inventory_batches ib ON p.id = ib.product_id
		JOIN brands b ON p.brand_id = b.id
		WHERE p.status = 'ACTIVE'
			AND b.name IN ('Dr. Reckeweg', 'SBL', 'Schwabe')
			AND (ib.selling_price - ib.cost_price) / NULLIF(ib.cost_price, 0) * 100 > 40
		GROUP BY p.id, p.name, p.sku, p.potency, p.form, ib.selling_price, ib.cost_price
		ORDER BY profit_margin DESC
		LIMIT 3
	`

	type Result struct {
		ProductID    string  `db:"product_id"`
		ProductName  string  `db:"product_name"`
		SKU          string  `db:"sku"`
		Potency      *string `db:"potency"`
		Form         *string `db:"form"`
		SellingPrice float64 `db:"selling_price"`
		ProfitMargin float64 `db:"profit_margin"`
		Stock        int     `db:"stock"`
	}

	var results []Result
	err := h.db.Raw(query).Scan(&results).Error
	if err != nil {
		return []ProductSuggestion{}
	}

	suggestions := []ProductSuggestion{}
	for _, r := range results {
		potency := ""
		if r.Potency != nil {
			potency = *r.Potency
		}
		form := ""
		if r.Form != nil {
			form = *r.Form
		}

		suggestions = append(suggestions, ProductSuggestion{
			ProductID:      r.ProductID,
			ProductName:    r.ProductName,
			SKU:            r.SKU,
			Potency:        potency,
			Form:           form,
			Reason:         "Premium quality product",
			Confidence:     0.80,
			SuggestedPrice: r.SellingPrice,
			InStock:        r.Stock > 0,
			StockQuantity:  r.Stock,
			ProfitMargin:   r.ProfitMargin,
			Type:           "upsell",
		})
	}

	return suggestions
}

// Deduplicate and rank suggestions
func (h *AIPOSHandler) deduplicateAndRank(suggestions []ProductSuggestion, limit int) []ProductSuggestion {
	seen := make(map[string]bool)
	unique := []ProductSuggestion{}

	for _, s := range suggestions {
		if !seen[s.ProductID] {
			seen[s.ProductID] = true
			unique = append(unique, s)
		}
	}

	// Sort by confidence desc
	for i := 0; i < len(unique); i++ {
		for j := i + 1; j < len(unique); j++ {
			if unique[j].Confidence > unique[i].Confidence {
				unique[i], unique[j] = unique[j], unique[i]
			}
		}
	}

	if len(unique) > limit {
		unique = unique[:limit]
	}

	return unique
}

// POST /api/erp/pos/disease-suggestions
// Get medicine suggestions based on disease/condition
func (h *AIPOSHandler) GetDiseaseSuggestions(c *gin.Context) {
	var req struct {
		Disease  string   `json:"disease"`
		Symptoms []string `json:"symptoms"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if h.openaiClient == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not configured"})
		return
	}

	// Use OpenAI to get treatment protocol
	prompt := `You are an expert homeopathy doctor. 

Disease/Condition: ` + req.Disease

	if len(req.Symptoms) > 0 {
		prompt += `\nSymptoms: ` + req.Symptoms[0]
		for i := 1; i < len(req.Symptoms); i++ {
			prompt += ", " + req.Symptoms[i]
		}
	}

	prompt += `

Provide a complete homeopathy treatment protocol with:
1. Primary remedies (3-5 medicines)
2. Supportive remedies (2-3 medicines)
3. Dosage recommendations
4. Duration
5. Brief explanation

Return as JSON:
{
  "primary": [{"medicine": "Belladonna 30C", "reason": "...", "dosage": "5 drops every 2 hours"}],
  "supportive": [{"medicine": "...", "reason": "...", "dosage": "..."}],
  "duration": "3-5 days",
  "notes": "..."
}`

	resp, err := h.openaiClient.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a homeopathy expert doctor. Provide accurate treatment protocols.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.6,
			MaxTokens:   800,
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI request failed"})
		return
	}

	// Parse response
	content := resp.Choices[0].Message.Content

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"disease":  req.Disease,
		"protocol": content,
	})
}
