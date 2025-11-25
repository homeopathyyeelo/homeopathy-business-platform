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
)

type SearchHandler struct {
	OpenAIClient *openai.Client
}

// NewSearchHandler creates a new search handler with OpenAI client
func NewSearchHandler() *SearchHandler {
	openAIKey := os.Getenv("OPENAI_API_KEY")
	return &SearchHandler{
		OpenAIClient: openai.NewClient(openAIKey),
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
	Filters     map[string]string `json:ilters"`
	IsNatural  bool    `json:"isNatural"`
	Confidence float64 `json:"confidence"`
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

// GlobalSearch - Central AI-powered search endpoint
// GET /api/erp/search?q=calc+carb&type=products&limit=20
func (h *SearchHandler) GlobalSearch(c *gin.Context) {
	query := c.Query("q")
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
	if searchType == "all" || searchType == "products" {
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
	json.Unmarshal(body, &result)

	hits := result["hits"].([]interface{})
	total := int(result["estimatedTotalHits"].(float64))

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
	json.Unmarshal(body, &result)

	hits := result["hits"].([]interface{})
	total := int(result["estimatedTotalHits"].(float64))

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
