-- Complete Homeopathy ERP Database Schema
-- Run this to fix the missing tables causing 500 errors

-- ==================== MASTER DATA TABLES ====================

-- Categories table (for product categories and subcategories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Potencies table (for homeopathy potency levels)
CREATE TABLE IF NOT EXISTS potencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forms table (for product forms like dilution, mother tincture, etc.)
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Units table (for measurement units)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(10) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- HSN Codes table
CREATE TABLE IF NOT EXISTS hsn_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL,
  description TEXT,
  tax_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  location TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==================== PRODUCTS TABLE ====================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(255),
  brand VARCHAR(255),
  potency VARCHAR(50),
  form VARCHAR(100),
  pack_size VARCHAR(100),
  uom VARCHAR(50),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  mrp DECIMAL(10,2),
  tax_percent DECIMAL(5,2),
  hsn_code VARCHAR(20),
  manufacturer VARCHAR(255),
  description TEXT,
  barcode VARCHAR(100),
  reorder_level INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==================== BATCHES TABLE ====================

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  batch_no VARCHAR(100) NOT NULL,
  mfg_date DATE,
  exp_date DATE,
  mrp DECIMAL(10,2),
  purchase_rate DECIMAL(10,2),
  sale_rate DECIMAL(10,2),
  quantity INTEGER DEFAULT 0,
  warehouse_id UUID REFERENCES warehouses(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, batch_no)
);

-- ==================== BARCODES TABLE ====================

CREATE TABLE IF NOT EXISTS barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  batch_no VARCHAR(50) NOT NULL,
  barcode VARCHAR(100) UNIQUE NOT NULL,
  barcode_type VARCHAR(20) NOT NULL DEFAULT 'EAN-13',
  mrp DECIMAL(10,2),
  exp_date DATE,
  quantity INTEGER,
  warehouse_id UUID REFERENCES warehouses(id),
  potency VARCHAR(20),
  form VARCHAR(50),
  brand VARCHAR(100),
  category VARCHAR(100),
  created_by VARCHAR(100) DEFAULT 'system',
  status VARCHAR(20) DEFAULT 'active',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_no ON batches(batch_no);
CREATE INDEX IF NOT EXISTS idx_batches_exp_date ON batches(exp_date);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id ON batches(warehouse_id);

-- Barcodes indexes
CREATE INDEX IF NOT EXISTS idx_barcodes_product_id ON barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_batch_no ON barcodes(batch_no);
CREATE INDEX IF NOT EXISTS idx_barcodes_status ON barcodes(status);
CREATE INDEX IF NOT EXISTS idx_barcodes_exp_date ON barcodes(exp_date);

-- ==================== INSERT DEFAULT DATA ====================

-- Insert default warehouse
INSERT INTO warehouses (name, code, location, is_default, is_active)
VALUES ('Main Warehouse', 'MAIN', 'Primary Storage', true, true)
ON CONFLICT (code) DO NOTHING;

-- Insert homeopathy categories
INSERT INTO categories (name, code, description, is_active) VALUES
('Medicines', 'MED', 'All homeopathy medicines', true),
('Cosmetics', 'COS', 'Homeopathy cosmetics', true),
('Dilutions', 'DIL', 'Potentized liquid medicines', true),
('Mother Tinctures', 'MT', 'Base extracts (Q)', true),
('Biochemic', 'BIOC', 'Biochemic medicines', true),
('Triturations', 'TRIT', 'Ground powder form', true),
('Bio Combination', 'BIOCOMB', 'Combination remedies', true),
('Bach Flower', 'BACH', 'Bach flower remedies', true),
('Homeopathy Kits', 'KIT', 'Complete homeopathy kits', true),
('Millesimal LM Potency', 'LM', 'Millesimal potency medicines', true),
('Hair Care', 'HAIRCARE', 'Hair care products', true),
('Skin Care', 'SKINCARE', 'Skin care products', true),
('Oral Care', 'ORALCARE', 'Oral care products', true)
ON CONFLICT (code) DO NOTHING;

-- Insert homeopathy subcategories under External Application
INSERT INTO categories (name, code, description, parent_id, is_active)
SELECT
  cat.name,
  cat.code,
  cat.description,
  (SELECT id FROM categories WHERE code = 'MED' LIMIT 1),
  true
FROM (VALUES
  ('Ointment', 'OINT-CAT', 'Ointment products'),
  ('Cream', 'CREAM-CAT', 'Cream products'),
  ('Gel', 'GEL-CAT', 'Gel products'),
  ('Paste', 'PASTE', 'Paste products'),
  ('Lotion', 'LOTION-CAT', 'Lotion products'),
  ('External Application', 'EXTAPP', 'External application products'),
  ('Eye Drops', 'EYEDRP', 'Eye drops'),
  ('Ear Drops', 'EARDRP', 'Ear drops'),
  ('Nasal Drops', 'NASDRP', 'Nasal drops'),
  ('Spray', 'SPRAY-CAT', 'Spray products'),
  ('Vaporizer', 'VAPOR', 'Vaporizer products')
) AS cat(name, code, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE code = cat.code);

-- Insert homeopathy brands
INSERT INTO brands (name, code, description, is_active) VALUES
('SBL', 'SBL', 'SBL Homeopathy', true),
('Dr. Reckeweg', 'RECK', 'Dr. Reckeweg & Co.', true),
('Willmar Schwabe', 'SCHW', 'Willmar Schwabe India', true),
('Adel Pekana', 'ADEL', 'Adel Pekana Germany', true),
('BJain', 'BJAIN', 'BJain Pharmaceuticals', true),
('Baksons', 'BAKSON', 'Baksons Homeopathy', true),
('REPL', 'REPL', 'REPL Dr. Advice', true),
('R.S Bhargava', 'RSB', 'R.S Bhargava Pharmacy', true),
('Haslab', 'HASLAB', 'Haslab Homeopathy', true),
('Bach Flower Remedies', 'BACH', 'Bach Flower Therapy', true),
('Allen', 'ALLEN', 'Allen Homeopathy', true),
('Hahnemann', 'HAHN', 'Hahnemann Pharma', true),
('Bakson', 'BAKSON', 'Bakson Homeopathy', true)
ON CONFLICT (code) DO NOTHING;

-- Insert homeopathy potencies
INSERT INTO potencies (name, code, description, is_active) VALUES
('2X', '2X', 'Decimal potency', true),
('3X', '3X', 'Decimal potency', true),
('6X', '6X', 'Decimal potency', true),
('12X', '12X', 'Decimal potency', true),
('30X', '30X', 'Decimal potency', true),
('2C', '2C', 'Centesimal potency', true),
('3C', '3C', 'Centesimal potency', true),
('6C', '6C', 'Centesimal potency', true),
('12C', '12C', 'Centesimal potency', true),
('30C', '30C', 'Centesimal potency', true),
('60C', '60C', 'Centesimal potency', true),
('100C', '100C', 'Centesimal potency', true),
('200C', '200C', 'Centesimal potency', true),
('300C', '300C', 'Centesimal potency', true),
('500C', '500C', 'Centesimal potency', true),
('1M', '1M', 'Millesimal potency', true),
('10M', '10M', 'Millesimal potency', true),
('50M', '50M', 'Millesimal potency', true),
('CM', 'CM', 'Centesimal potency', true),
('Q', 'Q', 'Mother Tincture', true)
ON CONFLICT (code) DO NOTHING;

-- Insert homeopathy forms
INSERT INTO forms (name, code, description, is_active) VALUES
('Liquid', 'LIQUID', 'Liquid form', true),
('Solid', 'SOLID', 'Solid form', true),
('External Use', 'EXTUSE', 'For external application', true),
('Special', 'SPECIAL', 'Special formulations', true),
('Dilution', 'DILUTION', 'Potentized liquid', true),
('Mother Tincture', 'MT', 'Base mother tincture', true),
('Biochemic', 'BIOCHEMIC', 'Biochemic tablets', true),
('Trituration', 'TRITURATION', 'Ground powder', true),
('Bio Combination', 'BIOCOMB', 'Combination tablets', true),
('Ointment', 'OINTMENT', 'Topical ointment', true),
('Cream', 'CREAM', 'Topical cream', true),
('Gel', 'GEL', 'Topical gel', true),
('Drops', 'DROPS', 'Liquid drops', true),
('Tablets', 'TABLETS', 'Tablet form', true),
('Globules', 'GLOBULES', 'Sugar globules', true),
('Powder', 'POWDER', 'Powder form', true),
('Syrup', 'SYRUP', 'Liquid syrup', true),
('Oil', 'OIL', 'Medicated oil', true),
('Hair Care', 'HAIR', 'Hair care products', true),
('Skin Care', 'SKIN', 'Skin care products', true),
('Oral Care', 'ORAL', 'Oral care products', true),
('Kit', 'KIT', 'Medicine kit', true),
('Vial', 'VIAL', 'Small vial', true),
('Bottle', 'BOTTLE', 'Medicine bottle', true)
ON CONFLICT (code) DO NOTHING;

-- Insert common units
INSERT INTO units (name, code, description, is_active) VALUES
('Milliliters', 'ml', 'Milliliters', true),
('Grams', 'gm', 'Grams', true),
('Tablets', 'tab', 'Tablets', true),
('Capsules', 'cap', 'Capsules', true),
('Drops', 'drops', 'Drops', true),
('Pieces', 'pcs', 'Pieces', true),
('Bottles', 'bottle', 'Bottles', true),
('Vials', 'vial', 'Vials', true),
('Strips', 'strip', 'Strips', true),
('Boxes', 'box', 'Boxes', true)
ON CONFLICT (code) DO NOTHING;

-- Insert common HSN codes for homeopathy
INSERT INTO hsn_codes (code, description, tax_rate, is_active) VALUES
('30049011', 'Homeopathic medicines', 12.00, true),
('30049012', 'Homeopathic dilutions', 12.00, true),
('30049013', 'Homeopathic mother tinctures', 12.00, true),
('33049910', 'Homeopathic cosmetics', 18.00, true)
ON CONFLICT (code) DO NOTHING;

-- ==================== SAMPLE PRODUCTS (if none exist) ====================

-- Insert a few sample products if the products table is empty
INSERT INTO products (sku, name, category, brand, potency, form, cost_price, selling_price, mrp, is_active)
SELECT * FROM (VALUES
  ('ARM-30C-30ML', 'Arnica Montana 30C', 'Dilutions', 'SBL', '30C', 'Dilution', 80.00, 120.00, 120.00, true),
  ('BEL-200C-10ML', 'Belladonna 200C', 'Dilutions', 'Dr. Reckeweg', '200C', 'Dilution', 65.00, 95.00, 95.00, true),
  ('CAL-MT-30ML', 'Calendula MT', 'Mother Tinctures', 'SBL', 'Q', 'Mother Tincture', 100.00, 150.00, 150.00, true)
) AS new_products(sku, name, category, brand, potency, form, cost_price, selling_price, mrp, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = new_products.sku);

-- ==================== CREATE BATCHES FOR SAMPLE PRODUCTS ====================

-- Create batches for sample products
INSERT INTO batches (product_id, batch_no, mfg_date, exp_date, mrp, purchase_rate, sale_rate, quantity, warehouse_id, status)
SELECT
  p.id,
  'BATCH-2025-001',
  '2024-01-01'::DATE,
  '2027-10-25'::DATE,
  120.00,
  80.00,
  120.00,
  150,
  (SELECT id FROM warehouses WHERE is_default = true LIMIT 1),
  'active'
FROM products p
WHERE p.sku = 'ARM-30C-30ML'
  AND NOT EXISTS (SELECT 1 FROM batches WHERE product_id = p.id AND batch_no = 'BATCH-2025-001');

INSERT INTO batches (product_id, batch_no, mfg_date, exp_date, mrp, purchase_rate, sale_rate, quantity, warehouse_id, status)
SELECT
  p.id,
  'BATCH-2025-002',
  '2024-02-01'::DATE,
  '2027-11-15'::DATE,
  95.00,
  65.00,
  95.00,
  200,
  (SELECT id FROM warehouses WHERE is_default = true LIMIT 1),
  'active'
FROM products p
WHERE p.sku = 'BEL-200C-10ML'
  AND NOT EXISTS (SELECT 1 FROM batches WHERE product_id = p.id AND batch_no = 'BATCH-2025-002');

INSERT INTO batches (product_id, batch_no, mfg_date, exp_date, mrp, purchase_rate, sale_rate, quantity, warehouse_id, status)
SELECT
  p.id,
  'BATCH-2025-003',
  '2024-03-01'::DATE,
  '2026-12-31'::DATE,
  150.00,
  100.00,
  150.00,
  80,
  (SELECT id FROM warehouses WHERE is_default = true LIMIT 1),
  'active'
FROM products p
WHERE p.sku = 'CAL-MT-30ML'
  AND NOT EXISTS (SELECT 1 FROM batches WHERE product_id = p.id AND batch_no = 'BATCH-2025-003');

-- ==================== UPDATE PRODUCT STOCK FROM BATCHES ====================

-- Update product current_stock from batches
UPDATE products
SET current_stock = COALESCE((
  SELECT SUM(quantity)
  FROM batches
  WHERE product_id = products.id AND status = 'active'
), 0)
WHERE current_stock = 0;

-- ==================== SUCCESS MESSAGE ====================

-- Verify tables were created
SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as categories FROM categories;
SELECT COUNT(*) as brands FROM brands;
SELECT COUNT(*) as potencies FROM potencies;
SELECT COUNT(*) as forms FROM forms;
SELECT COUNT(*) as products FROM products;
SELECT COUNT(*) as batches FROM batches;
