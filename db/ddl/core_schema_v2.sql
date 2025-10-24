-- HomeoERP Core Schema v2 (PostgreSQL 14+)
-- Generated: 2025-10-24T07:35:00Z UTC

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS sys;
CREATE SCHEMA IF NOT EXISTS ai;

-- Users / RBAC
CREATE TABLE IF NOT EXISTS core.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core.user_roles (
  user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES core.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS core.role_permissions (
  role_id UUID REFERENCES core.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES core.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Master
CREATE TABLE IF NOT EXISTS core.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  gst_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'retail',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  potency TEXT,
  form TEXT,
  track_batches BOOLEAN NOT NULL DEFAULT true,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON core.products USING gin (name gin_trgm_ops);

-- Inventory (batches)
CREATE TABLE IF NOT EXISTS core.inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES core.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES core.products(id) ON DELETE CASCADE,
  batch_no TEXT,
  expiry_date DATE,
  qty NUMERIC(18,3) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
  landed_unit_cost NUMERIC(18,4) DEFAULT 0,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, product_id, batch_no)
);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON core.inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_shop_prod ON core.inventory_batches(shop_id, product_id);

-- Sales Orders (partition hint)
CREATE TABLE IF NOT EXISTS core.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES core.shops(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES core.customers(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES core.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES core.products(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES core.inventory_batches(id) ON DELETE SET NULL,
  qty NUMERIC(18,3) NOT NULL,
  unit_price NUMERIC(18,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES core.orders(id) ON DELETE SET NULL,
  total NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES core.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(18,2) NOT NULL,
  method TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchases
CREATE TABLE IF NOT EXISTS core.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES core.vendors(id) ON DELETE RESTRICT,
  shop_id UUID NOT NULL REFERENCES core.shops(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft',
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES core.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES core.products(id) ON DELETE RESTRICT,
  qty NUMERIC(18,3) NOT NULL,
  unit_cost NUMERIC(18,4) NOT NULL,
  discount_amount NUMERIC(18,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS core.vendor_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES core.vendors(id) ON DELETE RESTRICT,
  shop_id UUID NOT NULL REFERENCES core.shops(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES core.purchase_orders(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL
);

-- Parsing & Matching
CREATE TABLE IF NOT EXISTS core.vendor_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  product_id UUID REFERENCES core.products(id) ON DELETE SET NULL,
  confidence NUMERIC(5,2) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.parsed_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES core.vendors(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES core.shops(id) ON DELETE SET NULL,
  invoice_number TEXT,
  status TEXT NOT NULL DEFAULT 'parsed',
  raw_pdf_path TEXT,
  ocr_text TEXT,
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parsed_invoices_ocr_trgm ON core.parsed_invoices USING gin (ocr_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS core.parsed_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_invoice_id UUID NOT NULL REFERENCES core.parsed_invoices(id) ON DELETE CASCADE,
  raw_text TEXT,
  description TEXT,
  qty NUMERIC(18,3),
  unit_price NUMERIC(18,4),
  tax_rate NUMERIC(5,2),
  batch_no TEXT,
  expiry_date DATE,
  matched_product_id UUID REFERENCES core.products(id) ON DELETE SET NULL,
  match_type TEXT,
  match_confidence NUMERIC(5,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pil_raw_trgm ON core.parsed_invoice_lines USING gin (raw_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS core.reconciliation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_invoice_line_id UUID NOT NULL REFERENCES core.parsed_invoice_lines(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- System Bugs
CREATE TABLE IF NOT EXISTS sys.system_bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_system_bugs_details ON sys.system_bugs USING gin (details);

-- Outbox
CREATE TABLE IF NOT EXISTS sys.outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  aggregate_type TEXT,
  aggregate_id UUID,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outbox_published ON sys.outbox(published);
CREATE INDEX IF NOT EXISTS idx_outbox_topic ON sys.outbox(topic);
CREATE INDEX IF NOT EXISTS idx_outbox_payload ON sys.outbox USING gin (payload);

-- AI
CREATE TABLE IF NOT EXISTS ai.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_input ON ai.ai_requests USING gin (input);

CREATE TABLE IF NOT EXISTS ai.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_table TEXT NOT NULL,
  ref_id UUID NOT NULL,
  vector VECTOR(768) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON ai.embeddings USING ivfflat (vector);

-- Seed data (one shop, vendor, product)
INSERT INTO core.shops (id, name) VALUES ('00000000-0000-0000-0000-000000000001','Main Branch') ON CONFLICT DO NOTHING;
INSERT INTO core.vendors (id, name) VALUES ('00000000-0000-0000-0000-0000000000aa','SBL Pvt Ltd') ON CONFLICT DO NOTHING;
INSERT INTO core.products (id, sku, name, brand, potency, form, tax_rate)
VALUES ('00000000-0000-0000-0000-00000000abcd','SKU-UTI-30ML','UTI Plus Drops 30ml','SBL','', 'Drops', 12.00)
ON CONFLICT DO NOTHING;

-- Sample inventory with expiry for testing
INSERT INTO core.inventory_batches (shop_id, product_id, batch_no, expiry_date, qty, landed_unit_cost, last_restocked)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000abcd','B20251001', (now() + interval '7 days')::date, 100, 12.50, now())
ON CONFLICT DO NOTHING;

-- Function: expiry counts by window
CREATE OR REPLACE FUNCTION core.fn_expiry_counts(p_shop UUID)
RETURNS TABLE(bucket TEXT, count_items BIGINT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH upcoming AS (
    SELECT CASE
      WHEN expiry_date <= now() + interval '7 days' THEN '7_days'
      WHEN expiry_date <= now() + interval '1 month' THEN '1_month'
      WHEN expiry_date <= now() + interval '2 months' THEN '2_months'
      WHEN expiry_date <= now() + interval '3 months' THEN '3_months'
      WHEN expiry_date <= now() + interval '6 months' THEN '6_months'
      WHEN expiry_date <= now() + interval '1 year' THEN '1_year'
      WHEN expiry_date <= now() + interval '60 months' THEN '60_months'
      ELSE 'later' END AS bucket
    FROM core.inventory_batches
    WHERE shop_id = p_shop
      AND (qty - reserved_qty) > 0
      AND expiry_date > now()
  )
  SELECT bucket, count(*) FROM upcoming GROUP BY bucket;
END;$$;

COMMIT;
