package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct{}

type SearchResult struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	SKU         string  `json:"sku"`
	Barcode     string  `json:"barcode"`
	Brand       string  `json:"brand"`
	Category    string  `json:"category"`
	Potency     string  `json:"potency"`
	Form        string  `json:"form"`
	MRP         float64 `json:"mrp"`
	Stock       int     `json:"stock"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "product", "customer", etc.
}

type SearchResponse struct {
	Success bool           `json:"success"`
	Hits    []SearchResult `json:"hits"`
	Total   int            `json:"total"`
	Query   string         `json:"query"`
}

// GlobalSearch - Central AI-powered search endpoint
// GET /api/erp/search?q=calc+carb&type=products&limit=20
func (h *SearchHandler) GlobalSearch(c *gin.Context) {
	query := c.Query("q")
	searchType := c.DefaultQuery("type", "all") // all, products, customers
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

	// Search products
	if searchType == "all" || searchType == "products" {
		productResults, total := searchMeiliSearch(meiliURL, meiliAPIKey, "products", query, limit)
		for _, hit := range productResults {
			results = append(results, SearchResult{
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
		totalHits += total
	}

	// Search customers
	if searchType == "all" || searchType == "customers" {
		customerResults, total := searchMeiliSearch(meiliURL, meiliAPIKey, "customers", query, limit)
		for _, hit := range customerResults {
			results = append(results, SearchResult{
				ID:   hit["id"].(string),
				Name: getString(hit, "name"),
				Type: "customer",
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
