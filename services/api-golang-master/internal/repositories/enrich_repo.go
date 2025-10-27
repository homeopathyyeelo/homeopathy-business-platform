package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"

	"gorm.io/gorm"
)

type EnrichRepo struct{
	DB *gorm.DB
}

func NewEnrichRepo(db *gorm.DB) *EnrichRepo { return &EnrichRepo{DB: db} }

// Data models (minimal) used by enrichment
type ParsedLine struct{
	ID string
	VendorID string
	RawText string
	ParsedDescription string
}

type Product struct{
	ID string
	SKU string
	Name string
	HSN string
	GSTRate float64
	CategoryID *string
	SubcategoryID *string
	FormID *string
	PotencyID *string
	UnitID *string
}

type VendorMapping struct{
	ProductID string
	MatchConfidence float64
}

func (r *EnrichRepo) GetParsedLines(ctx context.Context, parsedInvoiceID string) ([]ParsedLine, error) {
	rows, err := r.DB.WithContext(ctx).Raw(`
		SELECT id, COALESCE(vendor_id::text,'') AS vendor_id, COALESCE(raw_text,'') AS raw_text, COALESCE(parsed_description,'') AS parsed_description
		FROM parsed_invoice_lines
		WHERE parsed_invoice_id = ?
		ORDER BY COALESCE(line_no,0), id
	`, parsedInvoiceID).Rows()
	if err != nil { return nil, err }
	defer rows.Close()
	out := []ParsedLine{}
	for rows.Next() {
		var l ParsedLine
		if err := rows.Scan(&l.ID, &l.VendorID, &l.RawText, &l.ParsedDescription); err != nil { return nil, err }
		out = append(out, l)
	}
	return out, nil
}

func (r *EnrichRepo) GetParsedLineByID(ctx context.Context, id string) (ParsedLine, error) {
	var l ParsedLine
	err := r.DB.WithContext(ctx).Raw(`
		SELECT id, COALESCE(vendor_id::text,''), COALESCE(raw_text,''), COALESCE(parsed_description,'')
		FROM parsed_invoice_lines WHERE id = ?
	`, id).Row().Scan(&l.ID, &l.VendorID, &l.RawText, &l.ParsedDescription)
	if err != nil { return ParsedLine{ID:id}, err }
	return l, nil
}

func (r *EnrichRepo) ExtractSKU(text string) string {
	// very simple heuristic: find tokens with '-' or alnum pattern of length>=5
	t := strings.Fields(strings.ToUpper(text))
	for _, tok := range t {
		if len(tok) >= 5 && (strings.Contains(tok, "-") || strings.ContainsAny(tok, "0123456789")) {
			return tok
		}
	}
	return ""
}

func (r *EnrichRepo) FindProductBySKU(ctx context.Context, sku string) *Product {
	if sku == "" { return nil }
	var p Product
	// Try exact SKU match
	row := r.DB.WithContext(ctx).Raw(`
		SELECT id::text, sku, name, '' as hsn, COALESCE(tax_rate,0) as gst_rate,
			   category_id::text, NULL::text as subcategory_id, form_id::text, potency_id::text, unit_id::text
		FROM products WHERE UPPER(sku) = UPPER(?) LIMIT 1
	`, sku).Row()
	var cat, subcat, form, pot, unit sql.NullString
	if err := row.Scan(&p.ID, &p.SKU, &p.Name, &p.HSN, &p.GSTRate, &cat, &subcat, &form, &pot, &unit); err == nil {
		if cat.Valid { p.CategoryID = &cat.String }
		if subcat.Valid { p.SubcategoryID = &subcat.String }
		if form.Valid { p.FormID = &form.String }
		if pot.Valid { p.PotencyID = &pot.String }
		if unit.Valid { p.UnitID = &unit.String }
		return &p
	}
	return nil
}

func (r *EnrichRepo) FindVendorMapping(ctx context.Context, vendorID string, raw string) *VendorMapping {
	// Extract a presumed vendor SKU token from raw text
	vsku := r.ExtractSKU(raw)
	if vendorID == "" || vsku == "" { return nil }
	var vm VendorMapping
	if err := r.DB.WithContext(ctx).Raw(`
		SELECT product_id::text, COALESCE(match_confidence,0) as match_confidence
		FROM vendor_product_mappings
		WHERE vendor_id = ? AND UPPER(vendor_sku) = UPPER(?)
		ORDER BY match_confidence DESC
		LIMIT 1
	`, vendorID, vsku).Row().Scan(&vm.ProductID, &vm.MatchConfidence); err == nil {
		return &vm
	}
	return nil
}

func (r *EnrichRepo) FindProductByNormalizedName(ctx context.Context, normalized string) *Product {
	if normalized == "" { return nil }
	// Compare against normalized lower(name)
	var p Product
	var cat, subcat, form, pot, unit sql.NullString
	row := r.DB.WithContext(ctx).Raw(`
		SELECT p.id::text, p.sku, p.name,
			   COALESCE(h.code,'') as hsn,
			   COALESCE(h.gst_rate, p.tax_rate, 0) as gst_rate,
			   p.category_id::text, NULL::text as subcategory_id, p.form_id::text, p.potency_id::text, p.unit_id::text
		FROM products p
		LEFT JOIN hsn_codes h ON h.id = p.hsn_code_id
		WHERE LOWER(p.name) = LOWER(?)
		LIMIT 1
	`, normalized).Row()
	if err := row.Scan(&p.ID, &p.SKU, &p.Name, &p.HSN, &p.GSTRate, &cat, &subcat, &form, &pot, &unit); err == nil {
		if cat.Valid { p.CategoryID = &cat.String }
		if subcat.Valid { p.SubcategoryID = &subcat.String }
		if form.Valid { p.FormID = &form.String }
		if pot.Valid { p.PotencyID = &pot.String }
		if unit.Valid { p.UnitID = &unit.String }
		return &p
	}
	return nil
}

func (r *EnrichRepo) FuzzyMatchProduct(ctx context.Context, text string) (*Product, float64) {
	if strings.TrimSpace(text) == "" { return nil, 0 }
	// pg_trgm fuzzy match on product name
	// Requires extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;
	var p Product
	var score float64
	var cat, subcat, form, pot, unit sql.NullString
	row := r.DB.WithContext(ctx).Raw(`
		SELECT p.id::text, p.sku, p.name,
			   COALESCE(h.code,'') as hsn,
			   COALESCE(h.gst_rate, p.tax_rate, 0) as gst_rate,
			   similarity(LOWER(p.name), LOWER(?)) as score,
			   p.category_id::text, NULL::text as subcategory_id, p.form_id::text, p.potency_id::text, p.unit_id::text
		FROM products p
		LEFT JOIN hsn_codes h ON h.id = p.hsn_code_id
		WHERE LOWER(p.name) % LOWER(?)
		ORDER BY score DESC
		LIMIT 1
	`, text, text).Row()
	if err := row.Scan(&p.ID, &p.SKU, &p.Name, &p.HSN, &p.GSTRate, &score, &cat, &subcat, &form, &pot, &unit); err == nil {
		if cat.Valid { p.CategoryID = &cat.String }
		if subcat.Valid { p.SubcategoryID = &subcat.String }
		if form.Valid { p.FormID = &form.String }
		if pot.Valid { p.PotencyID = &pot.String }
		if unit.Valid { p.UnitID = &unit.String }
		return &p, score
	}
	return nil, 0
}

func (r *EnrichRepo) GetProductMeta(ctx context.Context, productID string) (*Product, error) {
	var p Product
	var cat, subcat, form, pot, unit sql.NullString
	err := r.DB.WithContext(ctx).Raw(`
		SELECT p.id::text, p.sku, p.name,
			   COALESCE(h.code,'') as hsn,
			   COALESCE(h.gst_rate, p.tax_rate, 0) as gst_rate,
			   p.category_id::text, NULL::text as subcategory_id, p.form_id::text, p.potency_id::text, p.unit_id::text
		FROM products p
		LEFT JOIN hsn_codes h ON h.id = p.hsn_code_id
		WHERE p.id = ?
		LIMIT 1
	`, productID).Row().Scan(&p.ID, &p.SKU, &p.Name, &p.HSN, &p.GSTRate, &cat, &subcat, &form, &pot, &unit)
	if err != nil { return nil, err }
	if cat.Valid { p.CategoryID = &cat.String }
	if subcat.Valid { p.SubcategoryID = &subcat.String }
	if form.Valid { p.FormID = &form.String }
	if pot.Valid { p.PotencyID = &pot.String }
	if unit.Valid { p.UnitID = &unit.String }
	return &p, nil
}

func (r *EnrichRepo) SaveEnrichment(ctx context.Context, parsedInvoiceID, parsedLineID string, payload map[string]interface{}) error {
	b, _ := json.Marshal(payload)
	// Pull basic fields if present in payload
	matchedProductID, _ := payload["matched_product_id"].(string)
	matchType, _ := payload["match_type"].(string)
	conf := 0.0
	if v, ok := payload["match_confidence"].(float64); ok { conf = v }
	hsn, _ := payload["hsn_code"].(string)
	var gst float64
	if v, ok := payload["gst_rate"].(float64); ok { gst = v }
	// Upsert into parsed_invoice_enrichment
	return r.DB.WithContext(ctx).Exec(`
		INSERT INTO parsed_invoice_enrichment (
			parsed_invoice_id, parsed_line_id, matched_product_id, match_type, match_confidence,
			hsn_code, gst_rate, enrichment_payload, status
		) VALUES (?, ?, NULLIF(?, ''), ?, ?, NULLIF(?, ''), ?, ?, 'done')
		ON CONFLICT (parsed_line_id)
		DO UPDATE SET
			matched_product_id = EXCLUDED.matched_product_id,
			match_type = EXCLUDED.match_type,
			match_confidence = EXCLUDED.match_confidence,
			hsn_code = EXCLUDED.hsn_code,
			gst_rate = EXCLUDED.gst_rate,
			enrichment_payload = EXCLUDED.enrichment_payload,
			updated_at = now()
	`, parsedInvoiceID, parsedLineID, matchedProductID, matchType, conf, hsn, gst, string(b)).Error
}

func (r *EnrichRepo) SaveEnrichmentStatus(ctx context.Context, parsedInvoiceID, parsedLineID, status string, confidence float64) error {
	return r.DB.WithContext(ctx).Exec(`
		INSERT INTO parsed_invoice_enrichment (parsed_invoice_id, parsed_line_id, status, match_confidence)
		VALUES (?, ?, ?, ?)
		ON CONFLICT (parsed_line_id)
		DO UPDATE SET status = EXCLUDED.status, match_confidence = EXCLUDED.match_confidence, updated_at = now()
	`, parsedInvoiceID, parsedLineID, status, confidence).Error
}
