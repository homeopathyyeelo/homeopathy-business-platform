-- Update HSN codes to use correct codes and GST rates
-- Only 2 GST slabs: 5% for medicines, 18% for cosmetics

-- Step 1: Clear old HSN codes (will be recreated by system)
-- DELETE FROM hsn_codes; -- Uncomment if you want fresh start

-- Step 2: Insert correct HSN codes for MEDICINES (5% GST)
INSERT INTO hsn_codes (id, code, description, gst_rate, is_active, created_at, updated_at)
VALUES 
  ('30049014-0000-0000-0000-000000000001', '30049014', 'Homeopathic medicaments (retail pack)', 5.0, true, NOW(), NOW()),
  ('30039014-0000-0000-0000-000000000001', '30039014', 'Homeopathic medicaments (bulk / not measured dose)', 5.0, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  gst_rate = EXCLUDED.gst_rate,
  updated_at = NOW();

-- Step 3: Insert correct HSN codes for COSMETICS (18% GST)
INSERT INTO hsn_codes (id, code, description, gst_rate, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '330499', 'Skin-care (not medicinal)', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33049910', 'Face creams, lotions', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33049990', 'Other skincare creams/lotions', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33041000', 'Lip balms (non-medicinal)', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33042000', 'Eye makeup / kajal', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33072000', 'Deodorants', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33073000', 'Shaving, hair removal', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33061000', 'Toothpaste', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33051000', 'Shampoo', 18.0, true, NOW(), NOW()),
  (gen_random_uuid(), '33059000', 'Hair oils (cosmetic)', 18.0, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  gst_rate = EXCLUDED.gst_rate,
  updated_at = NOW();

-- Step 4: Update existing products to use correct HSN codes
-- Update cosmetic products (shampoo, soap, toothpaste, etc.)
UPDATE products 
SET hsn_code_id = (SELECT id FROM hsn_codes WHERE code = '330499')
WHERE (
  LOWER(name) LIKE '%shampoo%' OR
  LOWER(name) LIKE '%soap%' OR
  LOWER(name) LIKE '%toothpaste%' OR
  LOWER(name) LIKE '%facewash%' OR
  LOWER(name) LIKE '%face wash%' OR
  LOWER(name) LIKE '%sunscreen%' OR
  LOWER(name) LIKE '%lotion%' OR
  LOWER(name) LIKE '%lip balm%' OR
  LOWER(name) LIKE '%deodorant%' OR
  LOWER(name) LIKE '%cosmetic%' OR
  LOWER(name) LIKE '%beauty%'
);

-- Update all medicine products to retail medicaments (30049014)
UPDATE products 
SET hsn_code_id = (SELECT id FROM hsn_codes WHERE code = '30049014')
WHERE hsn_code_id NOT IN (
  SELECT id FROM hsn_codes WHERE code IN ('330499', '33049910', '33049990', '33041000', '33042000', '33072000', '33073000', '33061000', '33051000', '33059000')
);

-- Step 5: Verify the mapping
SELECT 
  h.code,
  h.description,
  h.gst_rate,
  COUNT(p.id) as product_count
FROM hsn_codes h
LEFT JOIN products p ON p.hsn_code_id = h.id
WHERE h.is_active = true
GROUP BY h.code, h.description, h.gst_rate
ORDER BY h.code;

-- Step 6: Show cosmetic products
SELECT 
  p.name,
  h.code as hsn_code,
  h.gst_rate
FROM products p
JOIN hsn_codes h ON h.id = p.hsn_code_id
WHERE h.gst_rate = 18.0
LIMIT 20;
