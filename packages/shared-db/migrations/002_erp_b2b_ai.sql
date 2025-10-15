-- ERP B2B and AI tables migration
-- Aligns with existing Prisma-mapped tables (snake_case)

-- Ensure pgcrypto for UUID if needed by other scripts
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shops already exist as shops
-- Products already exist as products
-- Users already exist as users

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  payment_terms TEXT,
  rating INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  shop_id TEXT REFERENCES shops(id),
  po_number TEXT UNIQUE,
  status TEXT DEFAULT 'draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  placed_at TIMESTAMPTZ,
  expected_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  unit_cost NUMERIC(10,2),
  qty INT,
  received_qty INT DEFAULT 0,
  batch_no TEXT,
  expiry_date DATE
);

-- Vendor Receipts (GRN)
CREATE TABLE IF NOT EXISTS vendor_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  vendor_invoice_no TEXT,
  received_by_user_id TEXT REFERENCES users(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS vendor_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_receipt_id UUID REFERENCES vendor_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID REFERENCES purchase_items(id),
  product_id TEXT REFERENCES products(id),
  qty INT,
  unit_cost NUMERIC(10,2),
  batch_no TEXT,
  expiry_date DATE
);

-- Stock Transfers between shops
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_shop_id TEXT REFERENCES shops(id),
  to_shop_id TEXT REFERENCES shops(id),
  status TEXT DEFAULT 'initiated',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  qty INT
);

-- Invoices and Payments (basic)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id),
  invoice_number TEXT UNIQUE,
  amount NUMERIC(12,2),
  status TEXT,
  issued_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC(12,2),
  method TEXT,
  paid_at TIMESTAMPTZ DEFAULT now()
);

-- AI metadata tables
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requestor_user_id TEXT REFERENCES users(id),
  model_id UUID REFERENCES ai_models(id),
  prompt TEXT,
  context JSONB,
  response JSONB,
  tokens_used INT,
  status TEXT DEFAULT 'done',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PGVector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT,
  source_id TEXT,
  text TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_ivfflat ON embeddings USING ivfflat (embedding) WITH (lists = 100);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop ON purchase_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_shops ON stock_transfers(from_shop_id, to_shop_id);


