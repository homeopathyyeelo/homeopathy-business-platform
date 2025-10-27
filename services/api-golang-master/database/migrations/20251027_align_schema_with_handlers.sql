-- Align DB schema exactly with current Go handlers and endpoints
-- No new names introduced; only tables/columns that handlers query

-- Extensions (safe if already installed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- MasterData-style tables used by handlers
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  parent_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.potencies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hsn_codes (
  id uuid PRIMARY KEY,
  name text,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flat products table exactly as Product struct in product_handler.go expects
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY,
  sku text UNIQUE,
  name text NOT NULL,
  category text,
  brand text,
  potency text,
  form text,
  pack_size text,
  uom text,
  cost_price numeric,
  selling_price numeric,
  mrp numeric,
  tax_percent numeric,
  hsn_code text,
  manufacturer text,
  description text,
  barcode text,
  reorder_level int,
  min_stock int,
  max_stock int,
  current_stock int,
  is_active boolean DEFAULT true,
  tags text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Warehouses referenced by enhanced inventory
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE,
  location text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced inventory stock table used by EnhancedInventoryHandler
CREATE TABLE IF NOT EXISTS public.inventory_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  batch_no text NOT NULL,
  warehouse_id uuid,
  qty_in numeric DEFAULT 0,
  qty_out numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  purchase_rate numeric,
  mrp numeric,
  mfg_date date,
  exp_date date,
  last_txn_type text,
  last_txn_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON public.inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_batch ON public.inventory_stock(batch_no);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_wh ON public.inventory_stock(warehouse_id);

-- Alerts used by enhanced inventory endpoints
CREATE TABLE IF NOT EXISTS public.enhanced_low_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  warehouse_id uuid,
  batch_no text,
  current_balance numeric NOT NULL DEFAULT 0,
  threshold_qty numeric NOT NULL DEFAULT 0,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enhanced_expiry_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  warehouse_id uuid,
  batch_no text,
  expiry_date date,
  days_until_expiry int,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Barcodes table used by ProductHandler.GetBarcodes (read-only in code)
CREATE TABLE IF NOT EXISTS public.barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  batch_id uuid,
  batch_no text,
  barcode text,
  barcode_type text,
  mrp numeric,
  exp_date date,
  quantity int,
  warehouse_id uuid,
  generated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  created_by uuid
);
