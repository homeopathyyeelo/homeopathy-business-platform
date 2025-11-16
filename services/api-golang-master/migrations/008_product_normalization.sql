-- ============================================================================
-- PRODUCT NORMALIZATION SCHEMA
-- Handles canonical substances, variants, and intelligent import pipeline
-- ============================================================================

-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- CANONICAL SUBSTANCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'homeopathy_medicine',
    description TEXT,
    cas_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_substance_name UNIQUE (name)
);

CREATE INDEX idx_substance_name ON substances (name);
CREATE INDEX idx_substance_type ON substances (type);
CREATE INDEX idx_substance_active ON substances (is_active);
CREATE INDEX idx_substance_name_trgm ON substances USING gin (name gin_trgm_ops);

COMMENT ON TABLE substances IS 'Canonical substance master - one row per real active ingredient';
COMMENT ON COLUMN substances.type IS 'homeopathy_medicine, biochemic, mother_tincture, cosmetic';

-- ============================================================================
-- SUBSTANCE ALIASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS substance_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_alias UNIQUE (alias)
);

CREATE INDEX idx_alias_substance ON substance_aliases (substance_id);
CREATE INDEX idx_alias ON substance_aliases (alias);
CREATE INDEX idx_alias_trgm ON substance_aliases USING gin (alias gin_trgm_ops);

COMMENT ON TABLE substance_aliases IS 'Alternative names for substances (Sulphur = Sulfur = Sulph)';

-- ============================================================================
-- PRODUCT MASTER TABLE (replaces old products table partially)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    primary_substance_id UUID REFERENCES substances(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'single',
    gst_sgst DECIMAL(5,2) DEFAULT 2.50,
    gst_cgst DECIMAL(5,2) DEFAULT 2.50,
    gst_igst DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_master_brand ON product_masters (brand_id);
CREATE INDEX idx_product_master_name ON product_masters (name);
CREATE INDEX idx_product_master_substance ON product_masters (primary_substance_id);
CREATE INDEX idx_product_master_type ON product_masters (type);
CREATE INDEX idx_product_master_active ON product_masters (is_active);

COMMENT ON TABLE product_masters IS 'What you sell - brand + SKU level product';
COMMENT ON COLUMN product_masters.type IS 'single, combination, bio_combination';

-- ============================================================================
-- PRODUCT VARIANT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_master_id UUID NOT NULL REFERENCES product_masters(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    
    -- Homeopathy-specific
    potency VARCHAR(20),
    potency_scale VARCHAR(10),
    form VARCHAR(50),
    pack_size VARCHAR(50),
    strength VARCHAR(50),
    
    -- Pricing
    mrp DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variant_master ON product_variants (product_master_id);
CREATE INDEX idx_variant_sku ON product_variants (sku);
CREATE INDEX idx_variant_barcode ON product_variants (barcode);
CREATE INDEX idx_variant_potency ON product_variants (potency);
CREATE INDEX idx_variant_form ON product_variants (form);
CREATE INDEX idx_variant_active ON product_variants (is_active);

COMMENT ON TABLE product_variants IS 'Potency/Form/Size variants - what inventory tracks';
COMMENT ON COLUMN product_variants.potency_scale IS 'CH, C, M, LM, X, BC';
COMMENT ON COLUMN product_variants.form IS 'tablet, dilution, cream, ointment, MT, trituration';

-- ============================================================================
-- PRODUCT COMPOSITION (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_master_id UUID NOT NULL REFERENCES product_masters(id) ON DELETE CASCADE,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2),
    potency VARCHAR(20),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_composition_product ON product_compositions (product_master_id);
CREATE INDEX idx_composition_substance ON product_compositions (substance_id);

COMMENT ON TABLE product_compositions IS 'Maps products to substances (for combinations)';

-- ============================================================================
-- IMPORT STAGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_import_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    
    -- Raw input
    raw_data JSONB,
    product_name VARCHAR(500) NOT NULL,
    brand_name VARCHAR(255),
    barcode VARCHAR(100),
    hsn_code VARCHAR(20),
    mrp DECIMAL(10,2),
    
    -- Parsed/Normalized
    parsed_substance VARCHAR(255),
    parsed_potency VARCHAR(20),
    parsed_scale VARCHAR(10),
    parsed_form VARCHAR(50),
    
    -- Matching results
    matched_substance_id UUID REFERENCES substances(id),
    matched_product_id UUID REFERENCES product_masters(id),
    matched_variant_id UUID REFERENCES product_variants(id),
    match_confidence DECIMAL(5,2) DEFAULT 0,
    match_method VARCHAR(50),
    suggested_substances JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    review_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staging_session ON product_import_staging (session_id);
CREATE INDEX idx_staging_status ON product_import_staging (status);

COMMENT ON TABLE product_import_staging IS 'Temporary staging for import review workflow';

-- ============================================================================
-- IMPORT SESSION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255),
    uploaded_by UUID NOT NULL,
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    pending_review INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_session_status ON product_import_sessions (status);
CREATE INDEX idx_import_session_user ON product_import_sessions (uploaded_by);

COMMENT ON TABLE product_import_sessions IS 'Track import batches and progress';

-- ============================================================================
-- SEED COMMON HOMEOPATHY SUBSTANCES
-- ============================================================================

INSERT INTO substances (name, type, description) VALUES
('Sulphur', 'homeopathy_medicine', 'The Element - Sulphur'),
('Arsenicum Album', 'homeopathy_medicine', 'Arsenic Trioxide'),
('Lycopodium Clavatum', 'homeopathy_medicine', 'Club Moss'),
('Nux Vomica', 'homeopathy_medicine', 'Poison Nut'),
('Pulsatilla Nigricans', 'homeopathy_medicine', 'Wind Flower'),
('Phosphorus', 'homeopathy_medicine', 'Phosphorus Element'),
('Calcarea Carbonica', 'homeopathy_medicine', 'Carbonate of Lime'),
('Natrum Muriaticum', 'homeopathy_medicine', 'Common Salt'),
('Belladonna', 'homeopathy_medicine', 'Deadly Nightshade'),
('Arnica Montana', 'homeopathy_medicine', 'Leopards Bane')
ON CONFLICT (name) DO NOTHING;

-- Common aliases
INSERT INTO substance_aliases (substance_id, alias) 
SELECT id, 'Sulfur' FROM substances WHERE name = 'Sulphur'
ON CONFLICT (alias) DO NOTHING;

INSERT INTO substance_aliases (substance_id, alias) 
SELECT id, 'Ars Alb' FROM substances WHERE name = 'Arsenicum Album'
ON CONFLICT (alias) DO NOTHING;

INSERT INTO substance_aliases (substance_id, alias) 
SELECT id, 'Lyco' FROM substances WHERE name = 'Lycopodium Clavatum'
ON CONFLICT (alias) DO NOTHING;

INSERT INTO substance_aliases (substance_id, alias) 
SELECT id, 'Nat Mur' FROM substances WHERE name = 'Natrum Muriaticum'
ON CONFLICT (alias) DO NOTHING;

INSERT INTO substance_aliases (substance_id, alias) 
SELECT id, 'Calc Carb' FROM substances WHERE name = 'Calcarea Carbonica'
ON CONFLICT (alias) DO NOTHING;

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

CREATE OR REPLACE VIEW v_product_catalog AS
SELECT 
    pm.id as product_id,
    pm.name as product_name,
    b.name as brand_name,
    s.name as substance_name,
    s.type as substance_type,
    pv.id as variant_id,
    pv.sku,
    pv.barcode,
    pv.potency,
    pv.potency_scale,
    pv.form,
    pv.pack_size,
    pv.mrp,
    pv.selling_price,
    pm.gst_sgst,
    pm.gst_cgst,
    pv.is_active
FROM product_masters pm
LEFT JOIN brands b ON pm.brand_id = b.id
LEFT JOIN substances s ON pm.primary_substance_id = s.id
LEFT JOIN product_variants pv ON pm.id = pv.product_master_id
WHERE pm.is_active = TRUE;

COMMENT ON VIEW v_product_catalog IS 'Complete product catalog with all variants';

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_substances_updated_at BEFORE UPDATE ON substances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_masters_updated_at BEFORE UPDATE ON product_masters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_staging_updated_at BEFORE UPDATE ON product_import_staging
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_sessions_updated_at BEFORE UPDATE ON product_import_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
