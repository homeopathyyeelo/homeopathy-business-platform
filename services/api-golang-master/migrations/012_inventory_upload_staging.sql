-- ============================================================================
-- Migration 012: Inventory Upload Staging Tables
-- Purpose: Enable CSV upload → staging → review → approval workflow
-- ============================================================================

-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. Inventory Uploads (session/header table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by VARCHAR(255) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),
    
    -- Upload metadata
    total_rows INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    unmatched_count INTEGER DEFAULT 0,
    fuzzy_matched_count INTEGER DEFAULT 0,
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'processing')),
    
    -- Approval tracking
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_uploads_status ON inventory_uploads(status);
CREATE INDEX idx_inventory_uploads_uploaded_by ON inventory_uploads(uploaded_by);
CREATE INDEX idx_inventory_uploads_created_at ON inventory_uploads(created_at DESC);

COMMENT ON TABLE inventory_uploads IS 'Tracks inventory upload sessions with approval workflow';
COMMENT ON COLUMN inventory_uploads.status IS 'pending → review → approved/rejected';

-- ============================================================================
-- 2. Inventory Upload Items (staged rows)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_upload_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES inventory_uploads(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    
    -- Raw CSV data (as uploaded)
    raw_sku VARCHAR(100),
    raw_barcode VARCHAR(100),
    raw_name VARCHAR(500),
    raw_brand VARCHAR(200),
    raw_category VARCHAR(200),
    raw_potency VARCHAR(50),
    raw_form VARCHAR(100),
    raw_pack_size VARCHAR(100),
    raw_qty DECIMAL(12,2) DEFAULT 0,
    raw_batch_no VARCHAR(200),
    raw_expiry_date DATE,
    raw_mrp DECIMAL(12,2),
    raw_gst DECIMAL(5,2),
    raw_hsn VARCHAR(50),
    
    -- Matching results
    matched_product_id UUID REFERENCES products(id),
    matched_by VARCHAR(50), -- 'sku', 'barcode', 'exact_name', 'fuzzy_name'
    matched_score DECIMAL(5,4), -- 0.0 to 1.0 (for fuzzy matching)
    
    -- Review flags
    review_required BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    manual_product_id UUID REFERENCES products(id), -- if admin manually assigns
    
    -- Applied tracking
    is_applied BOOLEAN DEFAULT FALSE,
    applied_batch_id UUID, -- references inventory_batches after approval
    error_message TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_upload_items_upload ON inventory_upload_items(upload_id);
CREATE INDEX idx_inventory_upload_items_matched_product ON inventory_upload_items(matched_product_id);
CREATE INDEX idx_inventory_upload_items_review ON inventory_upload_items(review_required) WHERE review_required = TRUE;
CREATE INDEX idx_inventory_upload_items_sku ON inventory_upload_items(raw_sku);
CREATE INDEX idx_inventory_upload_items_barcode ON inventory_upload_items(raw_barcode);

-- Trigram index for fuzzy matching on product name
CREATE INDEX idx_inventory_upload_items_name_trgm ON inventory_upload_items USING gin(lower(raw_name) gin_trgm_ops);

COMMENT ON TABLE inventory_upload_items IS 'Staged inventory rows awaiting review and approval';
COMMENT ON COLUMN inventory_upload_items.matched_score IS '1.0 = exact match, 0.35-0.45 = fuzzy match requiring review';

-- ============================================================================
-- 3. Product matching helper view
-- ============================================================================
CREATE OR REPLACE VIEW v_upload_matching_summary AS
SELECT 
    u.id as upload_id,
    u.filename,
    u.status,
    u.total_rows,
    u.matched_count,
    u.unmatched_count,
    COUNT(DISTINCT CASE WHEN i.matched_by = 'sku' THEN i.id END) as sku_matches,
    COUNT(DISTINCT CASE WHEN i.matched_by = 'barcode' THEN i.id END) as barcode_matches,
    COUNT(DISTINCT CASE WHEN i.matched_by = 'exact_name' THEN i.id END) as exact_name_matches,
    COUNT(DISTINCT CASE WHEN i.matched_by = 'fuzzy_name' THEN i.id END) as fuzzy_matches,
    COUNT(DISTINCT CASE WHEN i.review_required = TRUE THEN i.id END) as needs_review,
    COUNT(DISTINCT CASE WHEN i.is_applied = TRUE THEN i.id END) as applied_count,
    u.uploaded_by,
    u.created_at,
    u.approved_by,
    u.approved_at
FROM inventory_uploads u
LEFT JOIN inventory_upload_items i ON i.upload_id = u.id
GROUP BY u.id, u.filename, u.status, u.total_rows, u.matched_count, u.unmatched_count, 
         u.uploaded_by, u.created_at, u.approved_by, u.approved_at;

COMMENT ON VIEW v_upload_matching_summary IS 'Summary of upload sessions with matching breakdown';

-- ============================================================================
-- 4. Update trigger for inventory_uploads.updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_inventory_upload_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_upload_updated
    BEFORE UPDATE ON inventory_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_upload_timestamp();

-- ============================================================================
-- 5. Helper function to calculate upload summary
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_upload_summary(p_upload_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE inventory_uploads
    SET 
        total_rows = (SELECT COUNT(*) FROM inventory_upload_items WHERE upload_id = p_upload_id),
        matched_count = (SELECT COUNT(*) FROM inventory_upload_items WHERE upload_id = p_upload_id AND matched_product_id IS NOT NULL),
        unmatched_count = (SELECT COUNT(*) FROM inventory_upload_items WHERE upload_id = p_upload_id AND matched_product_id IS NULL),
        fuzzy_matched_count = (SELECT COUNT(*) FROM inventory_upload_items WHERE upload_id = p_upload_id AND matched_by = 'fuzzy_name')
    WHERE id = p_upload_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_upload_summary IS 'Recalculates upload summary counts from staged items';

-- ============================================================================
-- End of migration 012
-- ============================================================================
