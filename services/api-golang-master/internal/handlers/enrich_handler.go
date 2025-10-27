package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
	"strings"
	"fmt"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	repos "github.com/yeelo/homeopathy-erp/internal/repositories"
)

// EnrichHandler orchestrates deterministic rules and AI fallback.
type EnrichHandler struct{
	Repo *repos.EnrichRepo
}

// NewEnrichHandler wires repository with DB
func NewEnrichHandler(db *gorm.DB) *EnrichHandler {
    return &EnrichHandler{Repo: repos.NewEnrichRepo(db)}
}

// normalize simple description
func normalize(s string) string {
	s = strings.ToLower(s)
	// remove common pack tokens
	replacers := []string{" ml", " pcs", " pc", " tabs", " tablet", " tablets"}
	for _, r := range replacers { s = strings.ReplaceAll(s, r, "") }
	s = strings.ReplaceAll(s, ",", " ")
	s = strings.Join(strings.Fields(s), " ")
	return s
}

// EnrichParsedInvoice
// POST /api/v1/enrich/invoice/:parsed_invoice_id
func (h *EnrichHandler) EnrichParsedInvoice(c *gin.Context) {
	parsedInvoiceID := c.Param("parsed_invoice_id")
	forceAI := c.Query("force_ai") == "true"

	lines, err := h.Repo.GetParsedLines(c.Request.Context(), parsedInvoiceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"parsed invoice not found"})
		return
	}

	results := make([]gin.H, 0, len(lines))
	aiInputs := make([]map[string]interface{}, 0)
	const acceptThreshold = 0.80
	for _, line := range lines {
		res := gin.H{
			"parsed_line_id": line.ID,
			"matched_product_id": nil,
			"match_type": "none",
			"match_confidence": 0.0,
		}

		// Rule 1: try extract SKU
		if sku := h.Repo.ExtractSKU(line.RawText); sku != "" {
			if p := h.Repo.FindProductBySKU(c.Request.Context(), sku); p != nil {
				res["matched_product_id"] = p.ID
				res["match_type"] = "sku"
				res["match_confidence"] = 1.0
			}
		}

		// Rule 2: vendor mapping
		if res["matched_product_id"] == nil {
			if vm := h.Repo.FindVendorMapping(c.Request.Context(), line.VendorID, line.RawText); vm != nil {
				res["matched_product_id"] = vm.ProductID
				res["match_type"] = "vendor_map"
				res["match_confidence"] = vm.MatchConfidence
			}
		}

		// Rule 3: normalized exact
		if res["matched_product_id"] == nil {
			norm := normalize(line.ParsedDescription)
			if p := h.Repo.FindProductByNormalizedName(c.Request.Context(), norm); p != nil {
				res["matched_product_id"] = p.ID
				res["match_type"] = "exact"
				res["match_confidence"] = 0.95
			}
		}

		// Rule 4: fuzzy
		if res["matched_product_id"] == nil {
			if p, score := h.Repo.FuzzyMatchProduct(c.Request.Context(), line.ParsedDescription); p != nil && score >= 0.75 {
				res["matched_product_id"] = p.ID
				res["match_type"] = "fuzzy"
				res["match_confidence"] = score
			}
		}

		// If matched, attach product meta and save enrichment
		if pid, ok := res["matched_product_id"].(string); ok && pid != "" && !forceAI {
			if meta, _ := h.Repo.GetProductMeta(c.Request.Context(), pid); meta != nil {
				res["hsn_code"] = meta.HSN
				res["gst_rate"] = meta.GSTRate
				res["category_id"] = meta.CategoryID
				res["subcategory_id"] = meta.SubcategoryID
				res["form_id"] = meta.FormID
				res["potency_id"] = meta.PotencyID
				res["unit_id"] = meta.UnitID
			}
			_ = h.Repo.SaveEnrichment(c.Request.Context(), parsedInvoiceID, line.ID, map[string]interface{}(res))
		}

		// Queue for AI if forced or low-confidence/unmatched
		if forceAI || res["matched_product_id"] == nil || (res["match_confidence"].(float64) < acceptThreshold) {
			aiInputs = append(aiInputs, map[string]interface{}{
				"parsed_line_id": line.ID,
				"raw_text": line.RawText,
				"parsed_description": line.ParsedDescription,
				"vendor_id": line.VendorID,
			})
		}

		results = append(results, res)
	}

	// AI fallback
	if len(aiInputs) > 0 {
		payload := map[string]interface{}{
			"shop_id": c.Query("shop_id"),
			"parsed_invoice_id": parsedInvoiceID,
			"lines": aiInputs,
		}
		b, _ := json.Marshal(payload)
		aiURL := getenvDefault("AI_SERVICE_URL", "http://localhost:8600") + "/v1/enrich"
		req, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, aiURL, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
		httpClient := &http.Client{ Timeout: 15 * time.Second }
		resp, err := httpClient.Do(req)
		if err == nil && resp != nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var aiResp struct {
				Lines []struct{
					ParsedLineID string `json:"parsed_line_id"`
					ProductID *string `json:"product_id"`
					MatchType string `json:"match_type"`
					Confidence float64 `json:"confidence"`
					HSN *string `json:"hsn"`
					GST *float64 `json:"gst"`
					Reason *string `json:"reason"`
				} `json:"lines"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&aiResp); err == nil {
				// index by parsed_line_id
				idx := map[string]int{}
				for i, r := range results { idx[fmt.Sprint(r["parsed_line_id"])]=i }
				for _, ln := range aiResp.Lines {
					i, ok := idx[ln.ParsedLineID]
					if !ok { continue }
					r := results[i]
					// Only overwrite if deterministic missing or low confidence or forceAI
					if forceAI || r["matched_product_id"] == nil || r["match_confidence"].(float64) < acceptThreshold {
						if ln.ProductID != nil { r["matched_product_id"] = *ln.ProductID }
						r["match_type"] = ln.MatchType
						r["match_confidence"] = ln.Confidence
						if ln.HSN != nil { r["hsn_code"] = *ln.HSN }
						if ln.GST != nil { r["gst_rate"] = *ln.GST }
						if ln.Reason != nil { r["reason"] = *ln.Reason }
						_ = h.Repo.SaveEnrichment(c.Request.Context(), parsedInvoiceID, ln.ParsedLineID, map[string]interface{}(r))
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"parsed_invoice_id": parsedInvoiceID,
		"enriched_at":       time.Now().Format(time.RFC3339),
		"results":           results,
	})
}

// getenvDefault returns env var or default if missing.
func getenvDefault(key, def string) string {
	if v := strings.TrimSpace(getenv(key)); v != "" { return v }
	return def
}

// small indirection for testability
var getenv = func(key string) string { return "" }
