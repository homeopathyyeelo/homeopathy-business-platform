-- =====================================================
-- HOMEOPATHY MASTER DATA INSERTION SCRIPT
-- =====================================================
-- This script inserts:
-- 1. Categories (Main categories)
-- 2. Subcategories (Child categories with parent_id)
-- 3. Brands (Manufacturer brands)
-- 4. Forms (Product forms/types)
-- =====================================================

-- =====================================================
-- 1. CATEGORIES (Main Categories)
-- =====================================================

-- Main Categories
INSERT INTO categories (id, name, code, description, parent_id, is_active, created_at, updated_at) VALUES
('cat-medicines', 'Medicines', 'MED', 'All homeopathy medicines', NULL, true, NOW(), NOW()),
('cat-cosmetics', 'Cosmetics', 'COSM', 'Homeopathy cosmetics and personal care', NULL, true, NOW(), NOW()),
('cat-dilutions', 'Dilutions', 'DIL', 'Potentized liquid medicines', NULL, true, NOW(), NOW()),
('cat-mother-tinctures', 'Mother Tinctures', 'MT', 'Base extracts (Q)', NULL, true, NOW(), NOW()),
('cat-biochemic', 'Biochemic', 'BIOC', 'Tissue salts', NULL, true, NOW(), NOW()),
('cat-triturations', 'Triturations', 'TRIT', 'Ground powder form', NULL, true, NOW(), NOW()),
('cat-bio-combination', 'Bio Combination', 'BIOCOMB', 'Standard mix of biochemic salts', NULL, true, NOW(), NOW()),
('cat-bach-flower', 'Bach Flower', 'BACH', 'Bach essence remedies', NULL, true, NOW(), NOW()),
('cat-homeopathy-kits', 'Homeopathy Kits', 'KIT', 'Complete homeopathy kits', NULL, true, NOW(), NOW()),
('cat-millesimal-lm', 'Millesimal LM Potency', 'LM', 'Millesimal potency medicines', NULL, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- 2. SUBCATEGORIES (Child Categories)
-- =====================================================

-- Cosmetics Subcategories
INSERT INTO categories (id, name, code, description, parent_id, is_active, created_at, updated_at) VALUES
('cat-hair-care', 'Hair Care', 'HAIR', 'Hair care products', 'cat-cosmetics', true, NOW(), NOW()),
('cat-skin-care', 'Skin Care', 'SKIN', 'Skin care products', 'cat-cosmetics', true, NOW(), NOW()),
('cat-oral-care', 'Oral Care', 'ORAL', 'Oral care products', 'cat-cosmetics', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  updated_at = NOW();

-- =====================================================
-- 3. BRANDS (Manufacturers)
-- =====================================================

INSERT INTO brands (id, name, code, description, country, is_active, created_at, updated_at) VALUES
-- Major Homeopathy Brands
('brand-sbl', 'SBL', 'SBL', 'SBL Pvt Ltd - Leading homeopathy manufacturer', 'India', true, NOW(), NOW()),
('brand-reckeweg', 'Dr. Reckeweg', 'RECK', 'Dr. Reckeweg & Co. GmbH', 'Germany', true, NOW(), NOW()),
('brand-schwabe', 'Willmar Schwabe', 'SCHW', 'Willmar Schwabe India Pvt Ltd', 'Germany', true, NOW(), NOW()),
('brand-adel', 'Adel Pekana', 'ADEL', 'Adel Pekana Germany', 'Germany', true, NOW(), NOW()),
('brand-bjain', 'BJain', 'BJAIN', 'B Jain Publishers Pvt Ltd', 'India', true, NOW(), NOW()),
('brand-baksons', 'Baksons', 'BAK', 'Bakson Drugs & Pharmaceuticals Pvt Ltd', 'India', true, NOW(), NOW()),
('brand-repl', 'REPL', 'REPL', 'REPL Homeopathy', 'India', true, NOW(), NOW()),
('brand-bhargava', 'R.S Bhargava', 'RSB', 'R.S Bhargava Homeopathy', 'India', true, NOW(), NOW()),
('brand-haslab', 'Haslab', 'HSL', 'Haslab Homeopathy', 'India', true, NOW(), NOW()),
('brand-bach', 'Bach Flower Remedies', 'BACH', 'Original Bach Flower Remedies', 'UK', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  country = EXCLUDED.country,
  updated_at = NOW();

-- =====================================================
-- 4. POTENCIES (Dilution Strengths)
-- =====================================================

INSERT INTO potencies (id, name, code, description, is_active, created_at, updated_at) VALUES
-- Decimal Potencies
('pot-3x', '3X', '3X', 'Decimal potency - 3rd dilution', true, NOW(), NOW()),
('pot-6x', '6X', '6X', 'Decimal potency - 6th dilution', true, NOW(), NOW()),
('pot-12x', '12X', '12X', 'Decimal potency - 12th dilution', true, NOW(), NOW()),
('pot-30x', '30X', '30X', 'Decimal potency - 30th dilution', true, NOW(), NOW()),

-- Centesimal Potencies
('pot-3ch', '3CH', '3CH', 'Centesimal potency - 3rd dilution', true, NOW(), NOW()),
('pot-6ch', '6CH', '6CH', 'Centesimal potency - 6th dilution', true, NOW(), NOW()),
('pot-12ch', '12CH', '12CH', 'Centesimal potency - 12th dilution', true, NOW(), NOW()),
('pot-30ch', '30CH', '30CH', 'Centesimal potency - 30th dilution', true, NOW(), NOW()),
('pot-200ch', '200CH', '200CH', 'Centesimal potency - 200th dilution', true, NOW(), NOW()),
('pot-1000ch', '1000CH', '1M', 'Centesimal potency - 1000th dilution (1M)', true, NOW(), NOW()),
('pot-10mch', '10MCH', '10M', 'Centesimal potency - 10000th dilution (10M)', true, NOW(), NOW()),
('pot-50mch', '50MCH', '50M', 'Centesimal potency - 50000th dilution (50M)', true, NOW(), NOW()),
('pot-cmch', 'CMCH', 'CM', 'Centesimal potency - 100000th dilution (CM)', true, NOW(), NOW()),

-- LM Potencies
('pot-lm1', 'LM1', 'LM1', 'Millesimal potency - 1st dilution', true, NOW(), NOW()),
('pot-lm6', 'LM6', 'LM6', 'Millesimal potency - 6th dilution', true, NOW(), NOW()),
('pot-lm12', 'LM12', 'LM12', 'Millesimal potency - 12th dilution', true, NOW(), NOW()),
('pot-lm18', 'LM18', 'LM18', 'Millesimal potency - 18th dilution', true, NOW(), NOW()),
('pot-lm24', 'LM24', 'LM24', 'Millesimal potency - 24th dilution', true, NOW(), NOW()),
('pot-lm30', 'LM30', 'LM30', 'Millesimal potency - 30th dilution', true, NOW(), NOW()),

-- Mother Tincture
('pot-q', 'Q', 'Q', 'Mother Tincture (Quintessence)', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- 5. FORMS (Product Forms/Types)
-- =====================================================

INSERT INTO forms (id, name, code, description, is_active, created_at, updated_at) VALUES
-- Liquid Forms
('form-dilution', 'Dilution', 'DIL', 'Potentized liquid medicine (3X–CM)', true, NOW(), NOW()),
('form-mother-tincture', 'Mother Tincture', 'MT', 'Base extract (Q)', true, NOW(), NOW()),
('form-drop', 'Drop', 'DROP', 'Oral drops', true, NOW(), NOW()),
('form-syrup', 'Syrup', 'SYR', 'Liquid preparation', true, NOW(), NOW()),
('form-oil', 'Oil', 'OIL', 'Hair or skin oil', true, NOW(), NOW()),
('form-spray', 'Spray', 'SPRAY', 'Oral or nasal spray', true, NOW(), NOW()),

-- Solid Forms
('form-biochemic', 'Biochemic', 'BIOC', 'Tissue salts', true, NOW(), NOW()),
('form-trituration', 'Trituration', 'TRIT', 'Ground powder form (1x, 3x etc.)', true, NOW(), NOW()),
('form-bio-combination', 'Bio Combination', 'BIOCOMB', 'Standard mix of biochemic salts', true, NOW(), NOW()),
('form-tablet', 'Tablet', 'TAB', 'Solid tablet form', true, NOW(), NOW()),
('form-globules', 'Globules', 'GLOB', 'Small sugar pellets', true, NOW(), NOW()),

-- External Use Forms
('form-ointment', 'Ointment', 'OINT', 'External use ointment', true, NOW(), NOW()),
('form-cream', 'Cream', 'CREAM', 'External use cream', true, NOW(), NOW()),
('form-gel', 'Gel', 'GEL', 'External use gel', true, NOW(), NOW()),
('form-lotion', 'Lotion', 'LOTION', 'Skin care lotion', true, NOW(), NOW()),

-- Special Forms
('form-bach-flower', 'Bach Flower', 'BACH', 'Bach essence remedies', true, NOW(), NOW()),
('form-lm-potency', 'LM Potency', 'LM', 'Millesimal potency (LM1–LM30)', true, NOW(), NOW()),

-- Cosmetic Forms
('form-shampoo', 'Shampoo', 'SHAMP', 'Hair care shampoo', true, NOW(), NOW()),
('form-toothpaste', 'Toothpaste', 'TOOTH', 'Oral care toothpaste', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count records
SELECT 'Categories (Main)' as type, COUNT(*) as count FROM categories WHERE parent_id IS NULL
UNION ALL
SELECT 'Categories (Sub)', COUNT(*) FROM categories WHERE parent_id IS NOT NULL
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;

-- Show all main categories
SELECT id, name, code, description FROM categories WHERE parent_id IS NULL ORDER BY name;

-- Show all subcategories with parent
SELECT c.name as subcategory, p.name as parent_category 
FROM categories c 
LEFT JOIN categories p ON c.parent_id = p.id 
WHERE c.parent_id IS NOT NULL 
ORDER BY p.name, c.name;

-- Show all brands
SELECT id, name, code, country FROM brands ORDER BY name;

-- Show all potencies
SELECT id, name, code, description FROM potencies ORDER BY name;

-- Show all forms
SELECT id, name, code, description FROM forms ORDER BY name;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Main Categories: 10
-- Subcategories: 3 (under Cosmetics)
-- Brands: 10
-- Potencies: 20
-- Forms: 18
-- Total Records: 61
-- =====================================================
