-- Create barcodes table for persistent storage
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
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_barcodes_product_id ON barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_batch_no ON barcodes(batch_no);
CREATE INDEX IF NOT EXISTS idx_barcodes_status ON barcodes(status);
CREATE INDEX IF NOT EXISTS idx_barcodes_exp_date ON barcodes(exp_date);

-- Add homeopathy-specific fields
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS potency VARCHAR(20);
ALTER TABLE barcodes ADD COLUMN form VARCHAR(50);
ALTER TABLE barcodes ADD COLUMN brand VARCHAR(100);

-- Add missing fields to barcodes table
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'system';

-- Insert sample homeopathy barcodes
INSERT INTO barcodes (product_id, batch_no, barcode, barcode_type, mrp, exp_date, quantity, status, potency, form, brand, category, created_by)
SELECT
  p.id,
  'BATCH-2025-001',
  '8901234567890',
  'EAN-13',
  120.00,
  '2027-10-25'::DATE,
  150,
  'active',
  '30C',
  'Dilution',
  'SBL',
  'Dilutions',
  'system'
FROM products p
WHERE p.sku = 'ARM-30C-30ML'
LIMIT 1;

INSERT INTO barcodes (product_id, batch_no, barcode, barcode_type, mrp, exp_date, quantity, status, potency, form, brand, category, created_by)
SELECT
  p.id,
  'BATCH-2025-002',
  '8901234567891',
  'EAN-13',
  95.00,
  '2027-11-15'::DATE,
  200,
  'active',
  '200C',
  'Dilution',
  'Dr. Reckeweg',
  'Dilutions',
  'system'
FROM products p
WHERE p.sku = 'BEL-200C-10ML'
LIMIT 1;

INSERT INTO barcodes (product_id, batch_no, barcode, barcode_type, mrp, exp_date, quantity, status, potency, form, brand, category, created_by)
SELECT
  p.id,
  'BATCH-2025-003',
  '8901234567892',
  'EAN-13',
  150.00,
  '2026-12-31'::DATE,
  80,
  'active',
  'Q',
  'Mother Tincture',
  'SBL',
  'Mother Tinctures',
  'system'
FROM products p
WHERE p.sku = 'CAL-MT-30ML'
LIMIT 1;
