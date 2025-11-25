package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type SearchHandler struct {
	OpenAIClient *openai.Client
	db           *gorm.DB
}

// NewSearchHandler creates a new search handler with OpenAI client
func NewSearchHandler(db *gorm.DB) *SearchHandler {
	openAIKey := os.Getenv("OPENAI_API_KEY")
	return &SearchHandler{
		OpenAIClient: openai.NewClient(openAIKey),
		db:           db,
	}
}

type SearchResult struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	SKU         string                 `json:"sku"`
	Barcode     string                 `json:"barcode"`
	Brand       string                 `json:"brand"`
	Category    string                 `json:"category"`
	Potency     string                 `json:"potency"`
	Form        string                 `json:"form"`
	MRP         float64                `json:"mrp"`
	Stock       int                    `json:"stock"`
	Description string                 `json:"description"`
	Type        string                 `json:"type"`         // "product", "customer", etc.
	NavigateURL string                 `json:"navigate_url"` // Where to navigate on click
	Module      string                 `json:"module"`       // products, customers, sales, etc.
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type SearchResponse struct {
	Success bool           `json:"success"`
	Hits    []SearchResult `json:"hits"`
	Total   int            `json:"total"`
	Query   string         `json:"query"`
}

// EnhancedSearchRequest represents the search request with AI enhancements
type EnhancedSearchRequest struct {
	Query      string `json:"query"`
	Context    string `json:"context"` // Current page/context
	SearchType string `json:"searchType"`
	Limit      int    `json:"limit"`
	UserID     string `json:"userId"`
	SessionID  string `json:"sessionId"`
}

// SearchIntent represents the AI-determined search intent
type SearchIntent struct {
	IntentType  string            `json:"intentType"` // product, customer, order, etc.
	SearchQuery string            `json:"searchQuery"`
	Filters     map[string]string `json:"filters"`
	IsNatural   bool              `json:"isNatural"`
	Confidence  float64           `json:"confidence"`
}

// detectSearchIntent uses simple pattern matching to understand search intent
func (h *SearchHandler) detectSearchIntent(query, context string) (*SearchIntent, error) {
	// Simple pattern matching for common queries
	intent := &SearchIntent{
		SearchQuery: query,
		IsNatural:   false,
		Confidence:  1.0,
		Filters:     make(map[string]string),
	}

	// Check for product-related queries
	productPatterns := []string{
		`(?i)(show\s+me\s+)?(products?\s+)?(like\s+)?(similar\s+to\s+)?([a-zA-Z0-9\s]+)`,
		`(?i)(find|search\s+for)\s+(me\s+)?(a\s+)?([a-zA-Z0-9\s]+)(\s+product)?`,
	}

	for _, pattern := range productPatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(query)
		if len(matches) > 0 {
			intent.IntentType = "product"
			intent.SearchQuery = strings.TrimSpace(matches[len(matches)-1])
			intent.IsNatural = true
			break
		}
	}

	// If no specific intent detected, default to product search
	if intent.IntentType == "" {
		intent.IntentType = "product"
		intent.SearchQuery = query
	}

	// Extract common filters
	brands := []string{"SBL", "Adel", "Hapdco", "Reckeweg", "Schwabe", "Bakson", "Allen", "WSI", "Dr. Willmar"}
	for _, brand := range brands {
		if strings.Contains(strings.ToLower(query), strings.ToLower(brand)) {
			intent.Filters["brand"] = brand
			break
		}
	}

	// Extract category/form from query
	categories := map[string]string{
		"mother tincture": "Mother Tinctures",
		"mt":              "Mother Tinctures",
		"dilution":        "Dilutions",
		"tablet":          "Tablets",
		"biochemic":       "Biochemic",
		"bio combination": "Bio Combination",
		"cream":           "Ointments & Creams",
		"ointment":        "Ointments & Creams",
		"gel":             "Ointments & Creams",
		"drops":           "Drops",
		"syrup":           "Syrups",
	}
	for keyword, category := range categories {
		if strings.Contains(strings.ToLower(query), keyword) {
			intent.Filters["category"] = category
			break
		}
	}

	// Extract potency (e.g., 30C, 200C, 1M)
	potencyRe := regexp.MustCompile(`(?i)(\d+[CMX]|\d+[CMX]H?|LM\d*|Q\d*|MT)`)
	if match := potencyRe.FindString(query); match != "" {
		intent.Filters["potency"] = strings.ToUpper(match)
	}

	// Extract form (e.g., tablet, dilution, cream)
	if strings.Contains(strings.ToLower(query), "tablet") {
		intent.Filters["form"] = "tablet"
	} else if strings.Contains(strings.ToLower(query), "dilution") {
		intent.Filters["form"] = "dilution"
	} else if strings.Contains(strings.ToLower(query), "cream") || strings.Contains(strings.ToLower(query), "ointment") {
		intent.Filters["form"] = "cream"
	}

	return intent, nil
}

// enhanceSearchWithAI uses OpenAI to understand natural language queries and extract search terms
// Only called when database returns 0 results to minimize API costs
func (h *SearchHandler) enhanceSearchWithAI(c *gin.Context, query string, originalResults int) ([]string, error) {
	// Only use AI if:
	// 1. OpenAI client is configured
	// 2. Query is longer than 10 characters (likely natural language)
	// 3. Original search returned 0 results
	if h.OpenAIClient == nil || len(query) < 10 || originalResults > 0 {
		return nil, fmt.Errorf("AI enhancement not needed")
	}

	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		return nil, fmt.Errorf("OpenAI API key not configured")
	}

	fmt.Printf("🤖 AI Enhancement triggered for query: '%s'\n", query)

	// Create a prompt to extract product search terms
	prompt := fmt.Sprintf(`You are a homeopathy product search assistant. Extract the most relevant product search terms from this query: "%s"

Return ONLY a JSON array of 2-3 alternative search terms that might match homeopathy products. Focus on:
- Product names (e.g., "Nux Vomica", "Arnica Montana")
- Brand names (e.g., "SBL", "Reckeweg", "Schwabe")
- Categories (e.g., "Mother Tincture", "Dilution", "Biochemic")
- Potencies (e.g., "30C", "200C", "1M")

Example response: ["Nux Vomica", "Mother Tincture", "SBL"]

Query: "%s"
JSON array:`, query, query)

	ctx := c.Request.Context()
	resp, err := h.OpenAIClient.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant that extracts search terms from natural language queries about homeopathy products. Always respond with valid JSON arrays only.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			MaxTokens:   100,
			Temperature: 0.3,
		},
	)

	if err != nil {
		fmt.Printf("❌ OpenAI API Error: %v\n", err)
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)
	fmt.Printf("🤖 AI Response: %s\n", content)

	// Parse JSON array
	var searchTerms []string
	if err := json.Unmarshal([]byte(content), &searchTerms); err != nil {
		// Try to extract terms manually if JSON parsing fails
		content = strings.Trim(content, "[]\"' \n")
		searchTerms = strings.Split(content, "\",\"")
		for i := range searchTerms {
			searchTerms[i] = strings.Trim(searchTerms[i], "\"' ")
		}
	}

	return searchTerms, nil
}

// GlobalSearch - Central AI-powered search endpoint
// GET /api/erp/search?q=calc+carb&type=products&limit=20
func (h *SearchHandler) GlobalSearch(c *gin.Context) {
	query := c.Query("q")
	fmt.Printf("🔍 GlobalSearch called with query: '%s'\n", query)
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Query parameter 'q' is required",
		})
		return
	}

	// Get context from referer or current page
	context := c.Request.Referer()
	if context == "" {
		context = c.Request.URL.Path
	}

	// Detect search intent using AI
	intent, err := h.detectSearchIntent(query, context)
	if err != nil {
		// Fallback to basic search if AI fails
		intent = &SearchIntent{
			SearchQuery: query,
			IntentType:  c.DefaultQuery("type", "all"),
			IsNatural:   false,
			Confidence:  0.0,
		}
	}

	// Use intent to determine search type
	searchType := intent.IntentType
	if intent.IntentType == "all" {
		searchType = c.DefaultQuery("type", "all")
	}
	fmt.Printf("🔍 Intent type: '%s', Final searchType: '%s'\n", intent.IntentType, searchType)

	limit := c.DefaultQuery("limit", "20")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Query parameter 'q' is required",
		})
		return
	}

	// MeiliSearch URL
	meiliURL := os.Getenv("MEILISEARCH_URL")
	if meiliURL == "" {
		meiliURL = "http://localhost:7700"
	}
	meiliAPIKey := os.Getenv("MEILISEARCH_API_KEY")

	var results []SearchResult
	var totalHits int

	// Search products with AI-enhanced query and filters
	if searchType == "all" || searchType == "products" || searchType == "product" {
		fmt.Printf("🔍 Starting product search for query: '%s', searchType: '%s'\n", query, searchType)
		// Build filters from AI intent
		var filters []string
		for key, value := range intent.Filters {
			switch key {
			case "brand", "category", "form", "potency":
				filters = append(filters, fmt.Sprintf("%s = '%s'", key, value))
			}
		}

		// If no filters from AI, use the original query
		searchQuery := intent.SearchQuery
		if searchQuery == "" {
			searchQuery = query
		}

		// Search with filters
		var productResults []map[string]interface{}
		var total int
		if len(filters) > 0 {
			productResults, total = searchMeiliSearchWithFilters(meiliURL, meiliAPIKey, "products", searchQuery, filters, limit)
		} else {
			productResults, total = searchMeiliSearch(meiliURL, meiliAPIKey, "products", searchQuery, limit)
		}

		fmt.Printf("🔍 MeiliSearch returned: %d products for query: '%s'\n", len(productResults), searchQuery)
		fmt.Printf("🔍 Database connection available: %v\n", h.db != nil)

		// FALLBACK 1: Try Semantic Search (if embeddings exist)
		if len(productResults) == 0 && h.db != nil && h.HasEmbeddings() && h.OpenAIClient != nil {
			fmt.Printf("🤖 Trying Semantic Search for query: '%s'\n", searchQuery)
			semanticResults, err := h.SemanticSearch(searchQuery, 20)
			if err == nil && len(semanticResults) > 0 {
				results = append(results, semanticResults...)
				totalHits += len(semanticResults)
				fmt.Printf("✅ Semantic Search found: %d products\n", len(semanticResults))
			}
		}

		// FALLBACK 2: If still no results, try SQL Database
		if len(productResults) == 0 && len(results) == 0 && h.db != nil {
			fmt.Printf("🔄 Triggering SQL Fallback for query: '%s'\n", searchQuery)
			type ProductWithRelations struct {
				ID           string  `gorm:"column:id"`
				Name         string  `gorm:"column:name"`
				SKU          string  `gorm:"column:sku"`
				Barcode      string  `gorm:"column:barcode"`
				Description  string  `gorm:"column:description"`
				MRP          float64 `gorm:"column:mrp"`
				CurrentStock float64 `gorm:"column:current_stock"`
				BrandName    string  `gorm:"column:brand_name"`
				CategoryName string  `gorm:"column:category_name"`
				PotencyName  string  `gorm:"column:potency_name"`
				Form         string  `gorm:"column:form"`
			}
			var products []ProductWithRelations

			// Advanced SQL query with JOINs to search across related tables
			sqlQuery := h.db.Table("products p").
				Select(`p.id, p.name, p.sku, p.barcode, p.description, p.mrp, p.current_stock, p.form,
					b.name as brand_name, 
					c.name as category_name, 
					pot.name as potency_name`).
				Joins("LEFT JOIN brands b ON p.brand_id = b.id").
				Joins("LEFT JOIN categories c ON p.category_id = c.id").
				Joins("LEFT JOIN potencies pot ON p.potency_id = pot.id")

			// Search across product name, SKU, barcode, brand name, category name, potency, form
			searchPattern := "%" + searchQuery + "%"
			sqlQuery = sqlQuery.Where(
				`p.name ILIKE ? OR 
				 p.sku ILIKE ? OR 
				 p.barcode ILIKE ? OR 
				 b.name ILIKE ? OR 
				 c.name ILIKE ? OR 
				 pot.name ILIKE ? OR
				 p.form ILIKE ? OR
				 p.description ILIKE ?`,
				searchPattern, searchPattern, searchPattern, searchPattern,
				searchPattern, searchPattern, searchPattern, searchPattern,
			)

			// Apply intent filters if detected
			if brandFilter, ok := intent.Filters["brand"]; ok {
				sqlQuery = sqlQuery.Where("b.name ILIKE ?", "%"+brandFilter+"%")
			}
			if categoryFilter, ok := intent.Filters["category"]; ok {
				sqlQuery = sqlQuery.Where("c.name ILIKE ?", "%"+categoryFilter+"%")
			}
			if potencyFilter, ok := intent.Filters["potency"]; ok {
				sqlQuery = sqlQuery.Where("pot.name ILIKE ?", "%"+potencyFilter+"%")
			}

			if err := sqlQuery.Limit(20).Find(&products).Error; err != nil {
				fmt.Println("❌ SQL Fallback Error:", err)
			} else {
				fmt.Printf("✅ SQL Fallback found: %d products for query: '%s'\n", len(products), searchQuery)
			}

			// Map results
			for _, p := range products {
				// Build a descriptive title
				title := p.Name
				if p.BrandName != "" {
					title = p.BrandName + " - " + p.Name
				}
				if p.PotencyName != "" {
					title += " (" + p.PotencyName + ")"
				}

				results = append(results, SearchResult{
					ID:          p.ID,
					Name:        title,
					SKU:         p.SKU,
					Barcode:     p.Barcode,
					Brand:       p.BrandName,
					Category:    p.CategoryName,
					Potency:     p.PotencyName,
					Form:        p.Form,
					MRP:         p.MRP,
					Stock:       int(p.CurrentStock),
					Description: p.Description,
					Type:        "product",
					Module:      "products",
					NavigateURL: fmt.Sprintf("/products/%s", p.ID),
					Metadata: map[string]interface{}{
						"source":  "database_fallback",
						"query":   searchQuery,
						"filters": intent.Filters,
					},
				})
			}
			totalHits += len(results)
		}

		// Process results
		for _, hit := range productResults {
			productID := getString(hit, "id")
			results = append(results, SearchResult{
				ID:          productID,
				Name:        getString(hit, "name"),
				SKU:         getString(hit, "sku"),
				Barcode:     getString(hit, "barcode"),
				Brand:       getString(hit, "brand"),
				Category:    getString(hit, "category"),
				Potency:     getString(hit, "potency"),
				Form:        getString(hit, "form"),
				MRP:         getFloat(hit, "mrp"),
				Stock:       getInt(hit, "stock"),
				Description: getString(hit, "description"),
				Type:        "product",
				Module:      "products",
				NavigateURL: "/products?search=" + url.QueryEscape(getString(hit, "name")),
				Metadata: map[string]interface{}{
					"confidence": intent.Confidence,
					"isNatural":  intent.IsNatural,
				},
			})
		}
		totalHits += total
	}

	// AI-POWERED FALLBACK: If still no results, try AI enhancement
	// DISABLED: OpenAI rate limit - can be enabled later with paid API key
	if false && len(results) == 0 && (searchType == "all" || searchType == "products" || searchType == "product") {
		aiTerms, err := h.enhanceSearchWithAI(c, query, len(results))
		if err == nil && len(aiTerms) > 0 {
			fmt.Printf("🤖 Retrying search with AI-suggested terms: %v\n", aiTerms)

			// Try searching with AI-suggested terms
			for _, aiTerm := range aiTerms {
				type ProductWithRelations struct {
					ID           string  `gorm:"column:id"`
					Name         string  `gorm:"column:name"`
					SKU          string  `gorm:"column:sku"`
					Barcode      string  `gorm:"column:barcode"`
					Description  string  `gorm:"column:description"`
					MRP          float64 `gorm:"column:mrp"`
					CurrentStock float64 `gorm:"column:current_stock"`
					BrandName    string  `gorm:"column:brand_name"`
					CategoryName string  `gorm:"column:category_name"`
					PotencyName  string  `gorm:"column:potency_name"`
					Form         string  `gorm:"column:form"`
				}
				var aiProducts []ProductWithRelations

				aiSearchPattern := "%" + aiTerm + "%"
				aiQuery := h.db.Table("products p").
					Select(`p.id, p.name, p.sku, p.barcode, p.description, p.mrp, p.current_stock, p.form,
						b.name as brand_name, 
						c.name as category_name, 
						pot.name as potency_name`).
					Joins("LEFT JOIN brands b ON p.brand_id = b.id").
					Joins("LEFT JOIN categories c ON p.category_id = c.id").
					Joins("LEFT JOIN potencies pot ON p.potency_id = pot.id").
					Where(
						`p.name ILIKE ? OR b.name ILIKE ? OR c.name ILIKE ? OR pot.name ILIKE ?`,
						aiSearchPattern, aiSearchPattern, aiSearchPattern, aiSearchPattern,
					).Limit(5)

				if err := aiQuery.Find(&aiProducts).Error; err == nil {
					for _, p := range aiProducts {
						title := p.Name
						if p.BrandName != "" {
							title = p.BrandName + " - " + p.Name
						}
						if p.PotencyName != "" {
							title += " (" + p.PotencyName + ")"
						}

						results = append(results, SearchResult{
							ID:          p.ID,
							Name:        title,
							SKU:         p.SKU,
							Barcode:     p.Barcode,
							Brand:       p.BrandName,
							Category:    p.CategoryName,
							Potency:     p.PotencyName,
							Form:        p.Form,
							MRP:         p.MRP,
							Stock:       int(p.CurrentStock),
							Description: p.Description,
							Type:        "product",
							Module:      "products",
							NavigateURL: fmt.Sprintf("/products/%s", p.ID),
							Metadata: map[string]interface{}{
								"source":         "ai_enhanced",
								"original_query": query,
								"ai_term":        aiTerm,
							},
						})
					}
				}

				// Stop if we found results
				if len(results) > 0 {
					break
				}
			}
		}
	}

	// Search customers
	if searchType == "all" || searchType == "customers" {
		customerResults, total := searchMeiliSearch(meiliURL, meiliAPIKey, "customers", query, limit)
		for _, hit := range customerResults {
			customerID := getString(hit, "id")
			results = append(results, SearchResult{
				ID:          customerID,
				Name:        getString(hit, "name"),
				Type:        "customer",
				Module:      "customers",
				NavigateURL: "/customers?search=" + url.QueryEscape(getString(hit, "name")),
				Description: getString(hit, "phone"),
			})
		}
		totalHits += total
	}

	// TODO: Filter results by user permissions (RBAC)
	// filteredResults := filterByPermissions(c, results)

	c.JSON(http.StatusOK, SearchResponse{
		Success: true,
		Hits:    results,
		Total:   totalHits,
		Query:   query,
	})
}

// SearchProducts - Product-specific search with filters
// GET /api/erp/search/products?q=sulphur&brand=SBL&category=Dilutions
func (h *SearchHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	brand := c.Query("brand")
	category := c.Query("category")
	potency := c.Query("potency")
	limit := c.DefaultQuery("limit", "50")

	meiliURL := os.Getenv("MEILISEARCH_URL")
	if meiliURL == "" {
		meiliURL = "http://localhost:7700"
	}
	meiliAPIKey := os.Getenv("MEILISEARCH_API_KEY")

	// Build filter string
	var filters []string
	if brand != "" {
		filters = append(filters, fmt.Sprintf("brand = '%s'", brand))
	}
	if category != "" {
		filters = append(filters, fmt.Sprintf("category = '%s'", category))
	}
	if potency != "" {
		filters = append(filters, fmt.Sprintf("potency = '%s'", potency))
	}

	results, total := searchMeiliSearchWithFilters(meiliURL, meiliAPIKey, "products", query, filters, limit)

	var searchResults []SearchResult
	for _, hit := range results {
		searchResults = append(searchResults, SearchResult{
			ID:          hit["id"].(string),
			Name:        getString(hit, "name"),
			SKU:         getString(hit, "sku"),
			Barcode:     getString(hit, "barcode"),
			Brand:       getString(hit, "brand"),
			Category:    getString(hit, "category"),
			Potency:     getString(hit, "potency"),
			Form:        getString(hit, "form"),
			MRP:         getFloat(hit, "mrp"),
			Stock:       getInt(hit, "stock"),
			Description: getString(hit, "description"),
			Type:        "product",
		})
	}

	c.JSON(http.StatusOK, SearchResponse{
		Success: true,
		Hits:    searchResults,
		Total:   total,
		Query:   query,
	})
}

// Helper: Search MeiliSearch index
func searchMeiliSearch(baseURL, apiKey, index, query, limit string) ([]map[string]interface{}, int) {
	searchURL := fmt.Sprintf("%s/indexes/%s/search", baseURL, index)

	// Build query params
	params := url.Values{}
	params.Add("q", query)
	params.Add("limit", limit)

	req, _ := http.NewRequest("GET", searchURL+"?"+params.Encode(), nil)
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, 0
	}

	hitsRaw, ok := result["hits"]
	if !ok || hitsRaw == nil {
		return nil, 0
	}

	hits, ok := hitsRaw.([]interface{})
	if !ok {
		return nil, 0
	}

	var total int
	if totalHits, ok := result["estimatedTotalHits"].(float64); ok {
		total = int(totalHits)
	}

	var results []map[string]interface{}
	for _, hit := range hits {
		results = append(results, hit.(map[string]interface{}))
	}

	return results, total
}

// Helper: Search with filters
func searchMeiliSearchWithFilters(baseURL, apiKey, index, query string, filters []string, limit string) ([]map[string]interface{}, int) {
	searchURL := fmt.Sprintf("%s/indexes/%s/search", baseURL, index)

	// Build request body for POST
	requestBody := map[string]interface{}{
		"q":     query,
		"limit": limit,
	}
	if len(filters) > 0 {
		// Join filters with AND
		filterStr := ""
		for i, f := range filters {
			if i > 0 {
				filterStr += " AND "
			}
			filterStr += f
		}
		requestBody["filter"] = filterStr
	}

	jsonData, _ := json.Marshal(requestBody)

	req, _ := http.NewRequest("POST", searchURL, bytes.NewReader(jsonData))
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, 0
	}

	hitsRaw, ok := result["hits"]
	if !ok || hitsRaw == nil {
		return nil, 0
	}

	hits, ok := hitsRaw.([]interface{})
	if !ok {
		return nil, 0
	}

	var total int
	if totalHits, ok := result["estimatedTotalHits"].(float64); ok {
		total = int(totalHits)
	}

	var results []map[string]interface{}
	for _, hit := range hits {
		results = append(results, hit.(map[string]interface{}))
	}

	return results, total
}

// Helper functions
func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok && val != nil {
		return val.(string)
	}
	return ""
}

func getFloat(m map[string]interface{}, key string) float64 {
	if val, ok := m[key]; ok && val != nil {
		return val.(float64)
	}
	return 0
}

func getInt(m map[string]interface{}, key string) int {
	if val, ok := m[key]; ok && val != nil {
		return int(val.(float64))
	}
	return 0
}
