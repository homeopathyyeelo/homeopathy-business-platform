-- ============================================================================
-- EXTEND EXISTING CATEGORIES - NO NEW TABLES
-- Uses existing categories table with ParentID for subcategories
-- ============================================================================

-- Add slug column to existing categories table (if not exists)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- SEED MAIN CATEGORIES (ParentID = NULL)
-- ============================================================================

-- Insert main categories using existing structure
INSERT INTO categories (id, name, code, slug, description, parent_id, sort_order, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Dilutions', 'DIL', 'dilutions', 'Single remedy homeopathic dilutions', NULL, 1, true, NOW(), NOW()),
(gen_random_uuid(), 'Mother Tinctures', 'MT', 'mother-tinctures', 'Raw plant/chemical extracts (Q/MT)', NULL, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'Biochemic', 'BIO', 'biochemic', '12 cell salts in X potencies', NULL, 3, true, NOW(), NOW()),
(gen_random_uuid(), 'Bio Combination', 'BC', 'bio-combination', 'BC-1 to BC-28 fixed formulas', NULL, 4, true, NOW(), NOW()),
(gen_random_uuid(), 'Ointments & Creams', 'OC', 'ointments-creams', 'Topical applications', NULL, 5, true, NOW(), NOW()),
(gen_random_uuid(), 'Patent Medicines', 'PAT', 'patent-medicines', 'Proprietary formulations', NULL, 6, true, NOW(), NOW()),
(gen_random_uuid(), 'Drops', 'DRP', 'drops', 'Liquid drops', NULL, 7, true, NOW(), NOW()),
(gen_random_uuid(), 'Syrups', 'SYR', 'syrups', 'Liquid syrups and tonics', NULL, 8, true, NOW(), NOW()),
(gen_random_uuid(), 'Tablets', 'TAB', 'tablets', 'Medicated tablets', NULL, 9, true, NOW(), NOW()),
(gen_random_uuid(), 'Globules', 'GLOB', 'globules', 'Sugar globules', NULL, 10, true, NOW(), NOW()),
(gen_random_uuid(), 'Oils', 'OIL', 'oils', 'Medicated oils', NULL, 11, true, NOW(), NOW()),
(gen_random_uuid(), 'Gels', 'GEL', 'gels', 'Topical gels', NULL, 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Hair Oils', 'HOIL', 'hair-oils', 'Hair care oils', NULL, 13, true, NOW(), NOW()),
(gen_random_uuid(), 'Massage Oils', 'MOIL', 'massage-oils', 'Body massage oils', NULL, 14, true, NOW(), NOW()),
(gen_random_uuid(), 'Shampoo', 'SHAM', 'shampoo', 'Medicated shampoos', NULL, 15, true, NOW(), NOW()),
(gen_random_uuid(), 'Toothpaste', 'TP', 'toothpaste', 'Medicated toothpaste', NULL, 16, true, NOW(), NOW()),
(gen_random_uuid(), 'Cosmetics', 'COSM', 'cosmetics', 'Homeopathic cosmetics', NULL, 17, true, NOW(), NOW()),
(gen_random_uuid(), 'Special Items', 'SPEC', 'special-items', 'Specialized products', NULL, 18, true, NOW(), NOW()),
(gen_random_uuid(), 'Empty Bottles', 'EB', 'empty-bottles', 'Dispensing containers', NULL, 19, true, NOW(), NOW()),
(gen_random_uuid(), 'Medical Supplies', 'MED', 'medical-supplies', 'Medical accessories', NULL, 20, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED SUBCATEGORIES (Using ParentID)
-- ============================================================================

-- Dilutions Subcategories
INSERT INTO categories (id, name, code, slug, description, parent_id, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), '6C', 'DIL_6C', '6c', '6C potency', c.id, 1, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
UNION ALL
SELECT gen_random_uuid(), '30C', 'DIL_30C', '30c', '30C potency', c.id, 2, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
UNION ALL
SELECT gen_random_uuid(), '200C', 'DIL_200C', '200c', '200C potency', c.id, 3, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
UNION ALL
SELECT gen_random_uuid(), '1M', 'DIL_1M', '1m', '1M potency', c.id, 4, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
UNION ALL
SELECT gen_random_uuid(), '10M', 'DIL_10M', '10m', '10M potency', c.id, 5, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
UNION ALL
SELECT gen_random_uuid(), '50M', 'DIL_50M', '50m', '50M potency', c.id, 6, true, NOW(), NOW()
FROM categories c WHERE c.code = 'DIL'
ON CONFLICT (code) DO NOTHING;

-- Bio Combination Subcategories (BC-1 to BC-28)
DO $$
DECLARE
    parent_cat_id UUID;
    i INTEGER;
BEGIN
    SELECT id INTO parent_cat_id FROM categories WHERE code = 'BC' LIMIT 1;
    
    FOR i IN 1..28 LOOP
        INSERT INTO categories (id, name, code, slug, parent_id, sort_order, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'BC-' || i, 'BC_' || i, 'bc-' || i, parent_cat_id, i, true, NOW(), NOW())
        ON CONFLICT (code) DO NOTHING;
    END LOOP;
END $$;

-- Biochemic Subcategories
INSERT INTO categories (id, name, code, slug, parent_id, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), '3X', 'BIO_3X', '3x', c.id, 1, true, NOW(), NOW()
FROM categories c WHERE c.code = 'BIO'
UNION ALL
SELECT gen_random_uuid(), '6X', 'BIO_6X', '6x', c.id, 2, true, NOW(), NOW()
FROM categories c WHERE c.code = 'BIO'
UNION ALL
SELECT gen_random_uuid(), '12X', 'BIO_12X', '12x', c.id, 3, true, NOW(), NOW()
FROM categories c WHERE c.code = 'BIO'
UNION ALL
SELECT gen_random_uuid(), '30X', 'BIO_30X', '30x', c.id, 4, true, NOW(), NOW()
FROM categories c WHERE c.code = 'BIO'
ON CONFLICT (code) DO NOTHING;

-- Topical Subcategories
INSERT INTO categories (id, name, code, slug, parent_id, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Ointment', 'OC_OINT', 'ointment', c.id, 1, true, NOW(), NOW()
FROM categories c WHERE c.code = 'OC'
UNION ALL
SELECT gen_random_uuid(), 'Cream', 'OC_CREAM', 'cream', c.id, 2, true, NOW(), NOW()
FROM categories c WHERE c.code = 'OC'
UNION ALL
SELECT gen_random_uuid(), 'Gel', 'OC_GEL', 'gel', c.id, 3, true, NOW(), NOW()
FROM categories c WHERE c.code = 'OC'
ON CONFLICT (code) DO NOTHING;

-- Patent Medicine Subcategories
INSERT INTO categories (id, name, code, slug, parent_id, sort_order, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Reckeweg R Series', 'PAT_RECK', 'reckeweg-r', c.id, 1, true, NOW(), NOW()
FROM categories c WHERE c.code = 'PAT'
UNION ALL
SELECT gen_random_uuid(), 'Schwabe Alpha Series', 'PAT_ALPHA', 'schwabe-alpha', c.id, 2, true, NOW(), NOW()
FROM categories c WHERE c.code = 'PAT'
UNION ALL
SELECT gen_random_uuid(), 'SBL Tonics', 'PAT_SBL_TON', 'sbl-tonics', c.id, 3, true, NOW(), NOW()
FROM categories c WHERE c.code = 'PAT'
UNION ALL
SELECT gen_random_uuid(), 'Bakson B Series', 'PAT_BAKSON', 'bakson-b', c.id, 4, true, NOW(), NOW()
FROM categories c WHERE c.code = 'PAT'
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- HELPER VIEW - Flat category structure for easy querying
-- ============================================================================

CREATE OR REPLACE VIEW v_categories_flat AS
SELECT 
    c.id,
    c.name,
    c.code,
    c.slug,
    p.name as parent_name,
    p.code as parent_code,
    p.slug as parent_slug,
    c.description,
    c.sort_order,
    c.is_active
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id;

COMMENT ON VIEW v_categories_flat IS 'Flat view of categories with parent info for easy filtering';
