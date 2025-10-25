-- =====================================================
-- HOMEOPATHY MASTER DATA INSERTION SCRIPT (FIXED)
-- =====================================================
-- This script inserts master data compatible with existing schema
-- Tables use UUID auto-generation
-- =====================================================

-- =====================================================
-- 1. CATEGORIES (Main Categories)
-- =====================================================

INSERT INTO categories (name, code, description, is_active) VALUES
('Medicines', 'MED', 'All homeopathy medicines', true),
('Cosmetics', 'COSM', 'Homeopathy cosmetics and personal care', true),
('Dilutions', 'DIL', 'Potentized liquid medicines', true),
('Mother Tinctures', 'MT', 'Base extracts (Q)', true),
('Biochemic', 'BIOC', 'Tissue salts', true),
('Triturations', 'TRIT', 'Ground powder form', true),
('Bio Combination', 'BIOCOMB', 'Standard mix of biochemic salts', true),
('Bach Flower', 'BACH', 'Bach essence remedies', true),
('Homeopathy Kits', 'KIT', 'Complete homeopathy kits', true),
('Millesimal LM Potency', 'LM', 'Millesimal potency medicines', true),
('Hair Care', 'HAIR', 'Hair care products', true),
('Skin Care', 'SKIN', 'Skin care products', true),
('Oral Care', 'ORAL', 'Oral care products', true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 2. BRANDS (Manufacturers)
-- =====================================================

INSERT INTO brands (name, code, description, is_active) VALUES
('SBL', 'SBL', 'SBL Pvt Ltd - Leading homeopathy manufacturer', true),
('Dr. Reckeweg', 'RECK', 'Dr. Reckeweg & Co. GmbH', true),
('Willmar Schwabe', 'SCHW', 'Willmar Schwabe India Pvt Ltd', true),
('Adel Pekana', 'ADEL', 'Adel Pekana Germany', true),
('BJain', 'BJAIN', 'B Jain Publishers Pvt Ltd', true),
('Baksons', 'BAK', 'Bakson Drugs & Pharmaceuticals Pvt Ltd', true),
('REPL', 'REPL', 'REPL Homeopathy', true),
('R.S Bhargava', 'RSB', 'R.S Bhargava Homeopathy', true),
('Haslab', 'HSL', 'Haslab Homeopathy', true),
('Bach Flower Remedies', 'BACHF', 'Original Bach Flower Remedies', true),
('Allen', 'ALLEN', 'Allen Homeopathy', true),
('Hahnemann', 'HAHN', 'Hahnemann Laboratories', true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 3. POTENCIES (Dilution Strengths)
-- =====================================================

INSERT INTO potencies (name, code, description, is_active) VALUES
-- Decimal Potencies
('3X', '3X', 'Decimal potency - 3rd dilution', true),
('6X', '6X', 'Decimal potency - 6th dilution', true),
('12X', '12X', 'Decimal potency - 12th dilution', true),
('30X', '30X', 'Decimal potency - 30th dilution', true),

-- Centesimal Potencies
('3CH', '3CH', 'Centesimal potency - 3rd dilution', true),
('6CH', '6CH', 'Centesimal potency - 6th dilution', true),
('12CH', '12CH', 'Centesimal potency - 12th dilution', true),
('30CH', '30CH', 'Centesimal potency - 30th dilution', true),
('200CH', '200CH', 'Centesimal potency - 200th dilution', true),
('1M', '1M', 'Centesimal potency - 1000th dilution', true),
('10M', '10M', 'Centesimal potency - 10000th dilution', true),
('50M', '50M', 'Centesimal potency - 50000th dilution', true),
('CM', 'CM', 'Centesimal potency - 100000th dilution', true),

-- LM Potencies
('LM1', 'LM1', 'Millesimal potency - 1st dilution', true),
('LM6', 'LM6', 'Millesimal potency - 6th dilution', true),
('LM12', 'LM12', 'Millesimal potency - 12th dilution', true),
('LM18', 'LM18', 'Millesimal potency - 18th dilution', true),
('LM24', 'LM24', 'Millesimal potency - 24th dilution', true),
('LM30', 'LM30', 'Millesimal potency - 30th dilution', true),

-- Mother Tincture
('Q', 'Q', 'Mother Tincture (Quintessence)', true),

-- Additional Common Potencies
('2X', '2X', 'Decimal potency - 2nd dilution', true),
('4X', '4X', 'Decimal potency - 4th dilution', true),
('2CH', '2CH', 'Centesimal potency - 2nd dilution', true),
('15CH', '15CH', 'Centesimal potency - 15th dilution', true),
('100CH', '100CH', 'Centesimal potency - 100th dilution', true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 4. FORMS (Product Forms/Types)
-- =====================================================

INSERT INTO forms (name, code, description, is_active) VALUES
-- Liquid Forms
('Dilution', 'DIL', 'Potentized liquid medicine (3X–CM)', true),
('Mother Tincture', 'MT', 'Base extract (Q)', true),
('Drops', 'DROP', 'Oral drops', true),
('Syrup', 'SYR', 'Liquid preparation', true),
('Oil', 'OIL', 'Hair or skin oil', true),
('Spray', 'SPRAY', 'Oral or nasal spray', true),

-- Solid Forms
('Biochemic Tablets', 'BIOC', 'Tissue salts in tablet form', true),
('Trituration', 'TRIT', 'Ground powder form (1x, 3x etc.)', true),
('Bio Combination', 'BIOCOMB', 'Standard mix of biochemic salts', true),
('Tablet', 'TAB', 'Solid tablet form', true),
('Globules', 'GLOB', 'Small sugar pellets', true),
('Powder', 'PWD', 'Powder form', true),

-- External Use Forms
('Ointment', 'OINT', 'External use ointment', true),
('Cream', 'CREAM', 'External use cream', true),
('Gel', 'GEL', 'External use gel', true),
('Lotion', 'LOTION', 'Skin care lotion', true),

-- Special Forms
('Bach Flower', 'BACHF', 'Bach essence remedies', true),
('LM Potency', 'LMP', 'Millesimal potency (LM1–LM30)', true),

-- Cosmetic Forms
('Shampoo', 'SHAMP', 'Hair care shampoo', true),
('Toothpaste', 'TOOTH', 'Oral care toothpaste', true),
('Soap', 'SOAP', 'Medicated soap', true),
('Face Wash', 'FWASH', 'Face wash', true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count records
SELECT 'Categories' as type, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;

-- Show all categories
SELECT id, name, code FROM categories ORDER BY name;

-- Show all brands
SELECT id, name, code FROM brands ORDER BY name;

-- Show all potencies
SELECT id, name, code FROM potencies ORDER BY name;

-- Show all forms
SELECT id, name, code FROM forms ORDER BY name;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Categories: 13
-- Brands: 12
-- Potencies: 25
-- Forms: 22
-- Total Records: 72
-- =====================================================
