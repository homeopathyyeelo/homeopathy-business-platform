-- Purchase Invoice Ingestion System

-- Parsed Invoices
CREATE TABLE IF NOT EXISTS parsed_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- manual, email, api, edi
    source_ref VARCHAR(200),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    currency VARCHAR(10) DEFAULT 'INR',
    total_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    raw_pdf_path VARCHAR(500),
    ocr_text TEXT,
    parsed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'processing', -- processing, parsed, confirmed, error
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parsed_invoices_vendor ON parsed_invoices(vendor_id);
CREATE INDEX idx_parsed_invoices_shop ON parsed_invoices(shop_id);
CREATE INDEX idx_parsed_invoices_status ON parsed_invoices(status);
CREATE INDEX idx_parsed_invoices_created ON parsed_invoices(created_at DESC);

-- Parsed Invoice Lines
CREATE TABLE IF NOT EXISTS parsed_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id) ON DELETE CASCADE,
    line_number INTEGER,
    raw_text TEXT,
    description VARCHAR(500),
    qty DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    line_total DECIMAL(15,2),
    batch_no VARCHAR(100),
    expiry_date DATE,
    hsn_code VARCHAR(20),
    
    -- Matching
    suggested_product_id UUID,
    matched_product_id UUID,
    match_type VARCHAR(50), -- sku, vendor_map, exact, fuzzy, ai, manual, created
    match_confidence DECIMAL(3,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, matched, ignored, error
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parsed_lines_invoice ON parsed_invoice_lines(parsed_invoice_id);
CREATE INDEX idx_parsed_lines_status ON parsed_invoice_lines(status);
CREATE INDEX idx_parsed_lines_product ON parsed_invoice_lines(matched_product_id);

-- Vendor Product Mappings (Learning)
CREATE TABLE IF NOT EXISTS vendor_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    vendor_name VARCHAR(500) NOT NULL,
    product_id UUID NOT NULL,
    match_confidence DECIMAL(3,2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, vendor_name)
);

CREATE INDEX idx_vendor_mappings_vendor ON vendor_product_mappings(vendor_id);
CREATE INDEX idx_vendor_mappings_product ON vendor_product_mappings(product_id);
CREATE INDEX idx_vendor_mappings_name ON vendor_product_mappings USING gin(vendor_name gin_trgm_ops);

-- Purchase Receipts (GRN)
CREATE TABLE IF NOT EXISTS purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID REFERENCES parsed_invoices(id),
    shop_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    receipt_number VARCHAR(100),
    receipt_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    freight_charges DECIMAL(12,2),
    other_charges DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    net_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'completed',
    received_by UUID,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_receipts_shop ON purchase_receipts(shop_id);
CREATE INDEX idx_purchase_receipts_vendor ON purchase_receipts(vendor_id);
CREATE INDEX idx_purchase_receipts_date ON purchase_receipts(receipt_date DESC);

-- Discount Rules
CREATE TABLE IF NOT EXISTS discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(200) NOT NULL,
    scope VARCHAR(50) NOT NULL, -- vendor, brand, category, global
    scope_id UUID,
    discount_type VARCHAR(50) NOT NULL, -- percentage, flat, tiered
    discount_value DECIMAL(12,2),
    min_qty DECIMAL(10,2),
    min_amount DECIMAL(15,2),
    valid_from DATE,
    valid_to DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_rules_scope ON discount_rules(scope, scope_id);
CREATE INDEX idx_discount_rules_active ON discount_rules(active, valid_from, valid_to);

-- Vendor Price List
CREATE TABLE IF NOT EXISTS vendor_price_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    product_id UUID NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    moq DECIMAL(10,2),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, product_id, effective_from)
);

CREATE INDEX idx_vendor_prices_vendor ON vendor_price_list(vendor_id);
CREATE INDEX idx_vendor_prices_product ON vendor_price_list(product_id);
CREATE INDEX idx_vendor_prices_active ON vendor_price_list(active, effective_from, effective_to);

-- Reconciliation Tasks
CREATE TABLE IF NOT EXISTS reconciliation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id),
    line_id UUID REFERENCES parsed_invoice_lines(id),
    task_type VARCHAR(50) NOT NULL, -- unmatched, low_confidence, duplicate, validation_error
    priority INTEGER DEFAULT 5,
    description TEXT,
    assigned_to UUID,
    status VARCHAR(50) DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recon_tasks_invoice ON reconciliation_tasks(parsed_invoice_id);
CREATE INDEX idx_recon_tasks_status ON reconciliation_tasks(status);
CREATE INDEX idx_recon_tasks_priority ON reconciliation_tasks(priority DESC, created_at);

-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function: Calculate landed cost
CREATE OR REPLACE FUNCTION calculate_landed_cost(
    p_unit_price DECIMAL,
    p_qty DECIMAL,
    p_freight DECIMAL,
    p_other_charges DECIMAL,
    p_total_qty DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN p_unit_price + 
           (p_freight + p_other_charges) * (p_qty / NULLIF(p_total_qty, 0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: Auto-create reconciliation tasks for low confidence
CREATE OR REPLACE FUNCTION auto_create_reconciliation_task()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.match_confidence < 0.6 OR NEW.matched_product_id IS NULL THEN
        INSERT INTO reconciliation_tasks (
            parsed_invoice_id, line_id, task_type, priority, description
        ) VALUES (
            NEW.parsed_invoice_id, 
            NEW.id,
            CASE 
                WHEN NEW.matched_product_id IS NULL THEN 'unmatched'
                ELSE 'low_confidence'
            END,
            CASE
                WHEN NEW.match_confidence < 0.3 THEN 1
                WHEN NEW.match_confidence < 0.5 THEN 3
                ELSE 5
            END,
            'Line requires manual review: ' || NEW.description
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_reconciliation_task
AFTER INSERT OR UPDATE OF match_confidence, matched_product_id ON parsed_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION auto_create_reconciliation_task();

-- Sample data
INSERT INTO discount_rules (rule_name, scope, discount_type, discount_value, min_qty) VALUES
('Vendor Bulk Discount', 'vendor', 'percentage', 5.00, 100),
('Brand SBL Discount', 'brand', 'percentage', 3.00, 50)
ON CONFLICT DO NOTHING;

SELECT 'Purchase ingestion system tables created!' as result;
