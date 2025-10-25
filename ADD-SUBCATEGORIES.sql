-- =====================================================
-- ADD PARENT-CHILD CATEGORY SUPPORT & SUBCATEGORIES
-- =====================================================

-- Step 1: Add parent_id column if not exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Step 2: Add External Application main category
INSERT INTO categories (name, code, description, is_active) VALUES
('External Application', 'EXTAPP', 'External application products', true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Step 3: Add External Application subcategories
INSERT INTO categories (name, code, description, parent_id, is_active) VALUES
('Ointment', 'OINT-CAT', 'Ointment products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Cream', 'CREAM-CAT', 'Cream products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Gel', 'GEL-CAT', 'Gel products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Paste', 'PASTE', 'Paste products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Lotion', 'LOTION-CAT', 'Lotion products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Spray', 'SPRAY-CAT', 'Spray products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Hair Cream', 'HAIRCR', 'Hair cream products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Foot Cream', 'FOOTCR', 'Foot cream products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Eye Drops', 'EYEDRP', 'Eye drops', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Ear Drops', 'EARDRP', 'Ear drops', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Nasal Drops', 'NASDRP', 'Nasal drops', (SELECT id FROM categories WHERE code = 'EXTAPP'), true),
('Vaporizer', 'VAPOR', 'Vaporizer products', (SELECT id FROM categories WHERE code = 'EXTAPP'), true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

-- Step 4: Add Cosmetics subcategories
INSERT INTO categories (name, code, description, parent_id, is_active) VALUES
('Hair Care', 'HAIRCARE', 'Hair care products', (SELECT id FROM categories WHERE code = 'COSM'), true),
('Skin Care', 'SKINCARE', 'Skin care products', (SELECT id FROM categories WHERE code = 'COSM'), true),
('Oral Care', 'ORALCARE', 'Oral care products', (SELECT id FROM categories WHERE code = 'COSM'), true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

-- Step 5: Add Dilutions potency subcategories
INSERT INTO categories (name, code, description, parent_id, is_active) VALUES
('3X Dilution', '3X-DIL', '3X potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('6X Dilution', '6X-DIL', '6X potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('12X Dilution', '12X-DIL', '12X potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('3CH Dilution', '3CH-DIL', '3CH potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('6CH Dilution', '6CH-DIL', '6CH potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('12CH Dilution', '12CH-DIL', '12CH potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('30CH Dilution', '30CH-DIL', '30CH potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('200CH Dilution', '200CH-DIL', '200CH potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('1M Dilution', '1M-DIL', '1M potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('10M Dilution', '10M-DIL', '10M potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('50M Dilution', '50M-DIL', '50M potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true),
('CM Dilution', 'CM-DIL', 'CM potency dilution', (SELECT id FROM categories WHERE code = 'DIL'), true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

-- Step 6: Add Mother Tincture brand subcategories
INSERT INTO categories (name, code, description, parent_id, is_active) VALUES
('SBL Mother Tincture', 'MT-SBL', 'SBL Mother Tinctures', (SELECT id FROM categories WHERE code = 'MT'), true),
('Dr. Reckeweg Mother Tincture', 'MT-RECK', 'Dr. Reckeweg Mother Tinctures', (SELECT id FROM categories WHERE code = 'MT'), true),
('Willmar Schwabe Mother Tincture', 'MT-SCHW', 'Willmar Schwabe Mother Tinctures', (SELECT id FROM categories WHERE code = 'MT'), true),
('BJain Mother Tincture', 'MT-BJAIN', 'BJain Mother Tinctures', (SELECT id FROM categories WHERE code = 'MT'), true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

-- Step 7: Add Biochemic subcategories
INSERT INTO categories (name, code, description, parent_id, is_active) VALUES
('SBL Biochemic', 'BIOC-SBL', 'SBL Biochemic products', (SELECT id FROM categories WHERE code = 'BIOC'), true),
('Dr. Reckeweg Biochemic', 'BIOC-RECK', 'Dr. Reckeweg Biochemic products', (SELECT id FROM categories WHERE code = 'BIOC'), true),
('Willmar Schwabe Biochemic', 'BIOC-SCHW', 'Willmar Schwabe Biochemic products', (SELECT id FROM categories WHERE code = 'BIOC'), true),
('BJain Biochemic', 'BIOC-BJAIN', 'BJain Biochemic products', (SELECT id FROM categories WHERE code = 'BIOC'), true)
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

-- Verification: Show category hierarchy
SELECT 
    c.id,
    c.name as category,
    c.code,
    COALESCE(p.name, 'Main Category') as parent,
    (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as subcategory_count
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY p.name NULLS FIRST, c.name;

-- Count summary
SELECT 
    'Main Categories' as type, 
    COUNT(*) as count 
FROM categories 
WHERE parent_id IS NULL
UNION ALL
SELECT 
    'Subcategories', 
    COUNT(*) 
FROM categories 
WHERE parent_id IS NOT NULL
UNION ALL
SELECT 
    'Total Categories', 
    COUNT(*) 
FROM categories;
