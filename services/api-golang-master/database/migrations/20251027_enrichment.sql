-- Enrichment scaffolding tables
-- Requires pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vendor product mappings (learned)
CREATE TABLE IF NOT EXISTS vendor_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
  vendor_sku TEXT,
  vendor_name TEXT,
  product_id UUID,
  match_confidence NUMERIC(4,3) DEFAULT 1.0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (vendor_id, vendor_sku)
);
CREATE INDEX IF NOT EXISTS idx_vendor_mapping_vendor ON vendor_product_mappings (vendor_id);

-- Parsed invoice enrichment results per line
CREATE TABLE IF NOT EXISTS parsed_invoice_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_invoice_id UUID NOT NULL,
  parsed_line_id UUID NOT NULL,
  matched_product_id UUID,
  match_type TEXT,
  match_confidence NUMERIC(4,3),
  hsn_code TEXT,
  gst_rate NUMERIC(5,2),
  category_id UUID,
  subcategory_id UUID,
  form_id UUID,
  potency_id UUID,
  unit_id UUID,
  barcode TEXT,
  enrichment_payload JSONB,
  enriched_at TIMESTAMPTZ DEFAULT now(),
  enriched_by TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enrichment_invoice ON parsed_invoice_enrichment (parsed_invoice_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_line ON parsed_invoice_enrichment (parsed_line_id);

-- Enrichment audit trail
CREATE TABLE IF NOT EXISTS enrichment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrichment_id UUID REFERENCES parsed_invoice_enrichment(id) ON DELETE CASCADE,
  action TEXT,
  actor TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
