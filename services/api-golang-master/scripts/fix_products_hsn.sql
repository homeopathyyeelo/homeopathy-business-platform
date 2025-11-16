-- Fix all existing products to add HSN code IDs
-- Run this to populate hsn_code_id for all 2288 products

-- Step 1: Ensure default HSN codes exist
INSERT INTO hsn_codes (id, code, description, gst_rate, is_active, created_at, updated_at)
VALUES 
  ('30040000-0000-0000-0000-000000000001', '3004', 'Homeopathy Medicines (Internal)', 5.0, true, NOW(), NOW()),
  ('30030000-0000-0000-0000-000000000001', '3003', 'Medicaments for External Use', 5.0, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Step 2: Update products based on form (cream/gel/ointment = 3003, rest = 3004)
-- External use products (creams, ointments, gels)
UPDATE products SET hsn_code_id = '30030000-0000-0000-0000-000000000001'
WHERE hsn_code_id IS NULL
AND (
  form_id IN (SELECT id FROM forms WHERE LOWER(name) LIKE '%cream%' OR LOWER(name) LIKE '%oint%' OR LOWER(name) LIKE '%gel%')
  OR LOWER(name) LIKE '%cream%'
  OR LOWER(name) LIKE '%ointment%'
  OR LOWER(name) LIKE '%gel%'
);

-- Internal use products (dilutions, tablets, etc.)
UPDATE products SET hsn_code_id = '30040000-0000-0000-0000-000000000001'
WHERE hsn_code_id IS NULL;

-- Step 3: Verify
SELECT 
  COUNT(*) as total_products,
  COUNT(hsn_code_id) as products_with_hsn,
  COUNT(barcode) as products_with_barcode
FROM products;

-- Show distribution
SELECT 
  h.code, 
  h.description, 
  COUNT(p.id) as product_count
FROM products p
LEFT JOIN hsn_codes h ON h.id = p.hsn_code_id
GROUP BY h.code, h.description;
