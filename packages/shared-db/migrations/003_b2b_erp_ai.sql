-- B2B ERP and AI Enhancement Migration
-- Adds support for multi-channel commerce, advanced ERP, and AI features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Multi-company support for India vs German brands
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  country VARCHAR(100) NOT NULL, -- 'India', 'Germany'
  currency VARCHAR(3) NOT NULL, -- 'INR', 'EUR'
  gst_number VARCHAR(50),
  tax_rate DECIMAL(5,2) DEFAULT 18.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer types for B2B/B2C segmentation
CREATE TABLE customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'retail', 'dealer', 'distributor', 'wholesaler'
  pricing_tier VARCHAR(50), -- 'retail', 'dealer', 'wholesale', 'distributor'
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms VARCHAR(100), -- 'COD', 'Net 30', 'Net 60'
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  auto_approval_limit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-tier pricing system
CREATE TABLE product_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  customer_type_id UUID REFERENCES customer_types(id),
  company_id UUID REFERENCES companies(id),
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced products with cost and margin tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS potency VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS indications TEXT;

-- Credit management for B2B customers
CREATE TABLE customer_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  available_credit DECIMAL(12,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
  last_payment_date TIMESTAMPTZ,
  payment_terms VARCHAR(100),
  credit_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced orders with B2B support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'B2C' CHECK (order_type IN ('B2C', 'B2B', 'D2D'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type_id UUID REFERENCES customer_types(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_terms VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date DATE;

-- Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  shop_id UUID REFERENCES shops(id),
  company_id UUID REFERENCES companies(id),
  po_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'received', 'cancelled')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  placed_at TIMESTAMPTZ,
  expected_delivery DATE,
  auto_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  received_quantity INTEGER DEFAULT 0,
  batch_no VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Receipts (GRN)
CREATE TABLE vendor_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  vendor_invoice_no VARCHAR(100),
  received_by_user_id UUID REFERENCES users(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vendor_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_receipt_id UUID REFERENCES vendor_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID REFERENCES purchase_items(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  batch_no VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfers between shops
CREATE TABLE stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_shop_id UUID REFERENCES shops(id),
  to_shop_id UUID REFERENCES shops(id),
  transfer_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
  total_items INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  batch_no VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting and Finance
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  account_type VARCHAR(50) NOT NULL, -- 'accounts_receivable', 'sales_revenue', 'tax_payable'
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Model Training Data
CREATE TABLE ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(100) NOT NULL, -- 'demand_forecast', 'pricing', 'vendor_score', 'campaign_optimization'
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  actual_result JSONB,
  accuracy_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Predictions and Recommendations
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'customer', 'vendor', 'campaign'
  entity_id UUID NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced Campaign Management
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_segments JSONB;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_roi DECIMAL(5,2);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS actual_roi DECIMAL(5,2);

-- Vendor Performance Tracking
CREATE TABLE vendor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  delivery_time_score DECIMAL(5,2),
  price_competitiveness_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  communication_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  total_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business Intelligence and Analytics
CREATE TABLE daily_business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  b2c_sales DECIMAL(12,2) DEFAULT 0,
  b2b_sales DECIMAL(12,2) DEFAULT 0,
  d2d_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  top_product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anomaly Detection
CREATE TABLE anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  alert_type VARCHAR(50) NOT NULL, -- 'sales_anomaly', 'inventory_anomaly', 'customer_anomaly'
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  data JSONB NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-channel Commerce Support
CREATE TABLE channel_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  channel VARCHAR(50) NOT NULL, -- 'online', 'whatsapp', 'walk_in', 'b2b_portal', 'd2d'
  date DATE NOT NULL,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default data
INSERT INTO companies (name, country, currency, gst_number, tax_rate) VALUES
('Yeelo India', 'India', 'INR', '29ABCDE1234F1Z5', 18.0),
('Yeelo Germany', 'Germany', 'EUR', 'DE123456789', 19.0);

INSERT INTO customer_types (name, pricing_tier, credit_limit, payment_terms, discount_percentage, auto_approval_limit) VALUES
('Retail Customer', 'retail', 0, 'COD', 0, 0),
('Dealer', 'dealer', 50000, 'Net 30', 10, 10000),
('Distributor', 'wholesale', 200000, 'Net 45', 20, 50000),
('Wholesaler', 'distributor', 500000, 'Net 60', 25, 100000);

-- Create indexes for performance
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_orders_customer_type ON orders(customer_type_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX idx_daily_metrics_shop_date ON daily_business_metrics(shop_id, date);
CREATE INDEX idx_channel_performance_shop_date ON channel_performance(shop_id, date);
