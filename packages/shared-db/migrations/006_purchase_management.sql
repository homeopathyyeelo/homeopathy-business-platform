-- Purchase Management Migration
-- Adds vendor management, purchase orders, and goods receipt notes

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30, -- days
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  shop_id TEXT NOT NULL REFERENCES shops(id),
  po_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED')),
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  expected_delivery_date TIMESTAMPTZ,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  batch_no TEXT,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goods Receipt Notes table
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  grn_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PARTIAL', 'DAMAGED')),
  received_by TEXT REFERENCES users(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GRN Items table
CREATE TABLE IF NOT EXISTS grn_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  grn_id TEXT NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  purchase_order_item_id TEXT NOT NULL REFERENCES purchase_order_items(id),
  received_quantity INTEGER NOT NULL,
  condition TEXT DEFAULT 'GOOD' CHECK (condition IN ('GOOD', 'DAMAGED', 'EXPIRED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Performance tracking
CREATE TABLE IF NOT EXISTS vendor_performance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  metric_name TEXT NOT NULL, -- 'delivery_time', 'quality_score', 'price_competitiveness'
  metric_value DECIMAL(10,4) NOT NULL,
  measurement_date TIMESTAMPTZ DEFAULT now(),
  context JSONB
);

-- Purchase Analytics views
CREATE OR REPLACE VIEW purchase_analytics AS
SELECT 
  po.shop_id,
  DATE_TRUNC('month', po.created_at) as month,
  COUNT(*) as total_orders,
  SUM(po.total_amount) as total_amount,
  AVG(po.total_amount) as avg_order_value,
  COUNT(DISTINCT po.vendor_id) as unique_vendors
FROM purchase_orders po
WHERE po.status != 'CANCELLED'
GROUP BY po.shop_id, DATE_TRUNC('month', po.created_at);

CREATE OR REPLACE VIEW vendor_performance_summary AS
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  COUNT(po.id) as total_orders,
  SUM(po.total_amount) as total_spent,
  AVG(po.total_amount) as avg_order_value,
  AVG(EXTRACT(EPOCH FROM (grn.received_at - po.created_at))/86400) as avg_delivery_days
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
LEFT JOIN goods_receipt_notes grn ON po.id = grn.purchase_order_id
WHERE po.status = 'RECEIVED'
GROUP BY v.id, v.name;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop ON purchase_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_grn_purchase_order ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor ON vendor_performance(vendor_id, measurement_date);

-- Insert sample vendors
INSERT INTO vendors (id, name, contact_person, phone, email, address, gst_number, credit_limit, payment_terms) VALUES
('vendor-1', 'ABC Homeopathy Suppliers', 'Rajesh Kumar', '+91-9876543310', 'rajesh@abchomeopathy.com', '123 Medical Street, Delhi', '07ABCDE1234F1Z5', 100000, 30),
('vendor-2', 'German Remedies Ltd', 'Dr. Schmidt', '+49-1234567890', 'schmidt@germanremedies.de', '456 Pharma Avenue, Berlin', 'DE123456789', 200000, 45),
('vendor-3', 'Indian Homeopathy Co', 'Priya Sharma', '+91-8765433109', 'priya@indianhomeopathy.com', '789 Ayurveda Road, Mumbai', '27FGHIJ5678K9L1', 75000, 15)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yeelo;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yeelo;
