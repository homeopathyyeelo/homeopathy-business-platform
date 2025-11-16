-- ============================================================================
-- ADD BASE_NAME FOR FAST PRODUCT GROUPING
-- This enables efficient variant grouping without normalizing on every query
-- ============================================================================

-- 1) Add base_name column (nullable first)
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_name TEXT;

-- 2) Populate base_name using comprehensive regex normalization
-- Removes: potency tokens (30C, 200, 1M, BC-12, 6X, MT, Q)
--          form words (cream, ointment, tablet, drops, syrup, gel)
--          units (ml, gm, mg, pack, strip, bottle)
UPDATE products
SET base_name = TRIM(REGEXP_REPLACE(
    LOWER(name),
    '\s+(\d+((c|ch|m|lm|cm|x))?|\d+m|bc[- ]?\d+|mt|q|cream|ointment|gel|tablet(s)?|globules?|drops?|syrup|tonic|oil|shampoo|lotion|soap|powder|ml|gm|mg|g|pack|strip|bottle|capsule(s)?|vial(s)?)\.*\s*$',
    '',
    'gi'
))
WHERE base_name IS NULL OR base_name = '';

-- 3) For any remaining NULLs or empty strings, use lowercase name
UPDATE products
SET base_name = LOWER(TRIM(name))
WHERE base_name IS NULL OR base_name = '';

-- 4) Clean up extra spaces
UPDATE products
SET base_name = REGEXP_REPLACE(base_name, '\s+', ' ', 'g')
WHERE base_name ~ '\s{2,}';

-- 5) Add index for fast grouping queries
CREATE INDEX IF NOT EXISTS idx_products_base_name ON products (base_name);

-- 6) Add GIN index for full-text search on base_name
CREATE INDEX IF NOT EXISTS idx_products_base_name_trgm ON products USING gin (base_name gin_trgm_ops);

-- 7) Add composite index for common filter queries
CREATE INDEX IF NOT EXISTS idx_products_base_name_brand_category ON products (base_name, brand, category);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check grouping results
-- SELECT base_name, COUNT(*) as variants, array_agg(DISTINCT brand) as brands
-- FROM products
-- GROUP BY base_name
-- HAVING COUNT(*) > 1
-- ORDER BY COUNT(*) DESC
-- LIMIT 20;

-- Check normalization quality
-- SELECT name, base_name
-- FROM products
-- WHERE base_name IS NOT NULL
-- ORDER BY base_name
-- LIMIT 50;

COMMENT ON COLUMN products.base_name IS 'Normalized product name for grouping variants (e.g., "sulphur" for "Sulphur 30C", "Sulphur 200C", etc.)';
