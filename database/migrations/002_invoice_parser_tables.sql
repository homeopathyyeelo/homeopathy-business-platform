-- =====================================================
-- INVOICE PARSER SERVICE - DATABASE SCHEMA
-- P0 Implementation
-- =====================================================

-- Parsed Invoices
CREATE TABLE IF NOT EXISTS parsed_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    source_type VARCHAR(20) NOT NULL, -- pdf|email|api|manual
    source_ref VARCHAR(255),
    raw_pdf_path TEXT NOT NULL,
    ocr_text TEXT,
    total_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'parsed', -- parsed|matched|confirmed|posted
    confidence_score DECIMAL(3,2),
    uploaded_by UUID,
    parsed_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    confirmed_by UUID,
    trace_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parsed_invoices_vendor ON parsed_invoices(vendor_id);
CREATE INDEX idx_parsed_invoices_status ON parsed_invoices(status);
CREATE INDEX idx_parsed_invoices_shop ON parsed_invoices(shop_id);
CREATE INDEX idx_parsed_invoices_trace ON parsed_invoices(trace_id);

-- Parsed Invoice Lines
CREATE TABLE IF NOT EXISTS parsed_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    raw_text TEXT,
    description TEXT,
    qty DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    line_total DECIMAL(15,2),
    batch_no VARCHAR(50),
    expiry_date DATE,
    hsn_code VARCHAR(20),
    
    -- Matching fields
    suggested_product_id UUID,
    matched_product_id UUID,
    match_type VARCHAR(20), -- sku|vendor_map|exact|fuzzy|ai|manual
    match_confidence DECIMAL(3,2),
    match_metadata JSONB,
    
    -- Pricing fields
    unit_cost DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    landed_unit_cost DECIMAL(12,2),
    
    status VARCHAR(20) DEFAULT 'pending', -- pending|matched|confirmed|posted
    reconciled_by UUID,
    reconciled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parsed_lines_invoice ON parsed_invoice_lines(parsed_invoice_id);
CREATE INDEX idx_parsed_lines_product ON parsed_invoice_lines(matched_product_id);
CREATE INDEX idx_parsed_lines_status ON parsed_invoice_lines(status);

-- Vendor Product Mappings (Learning)
CREATE TABLE IF NOT EXISTS vendor_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    vendor_sku_name TEXT NOT NULL,
    vendor_sku_code VARCHAR(100),
    product_id UUID NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vendor_id, vendor_sku_name)
);

CREATE INDEX idx_vendor_mappings_vendor ON vendor_product_mappings(vendor_id);
CREATE INDEX idx_vendor_mappings_product ON vendor_product_mappings(product_id);
CREATE INDEX idx_vendor_mappings_name ON vendor_product_mappings(vendor_sku_name);

-- Reconciliation Tasks
CREATE TABLE IF NOT EXISTS reconciliation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id),
    parsed_line_id UUID REFERENCES parsed_invoice_lines(id),
    task_type VARCHAR(30) NOT NULL, -- unmatched|low_confidence|duplicate|validation_error
    description TEXT,
    suggested_actions JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending|in_progress|resolved|ignored
    assigned_to UUID,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_status ON reconciliation_tasks(status);
CREATE INDEX idx_reconciliation_assigned ON reconciliation_tasks(assigned_to);
CREATE INDEX idx_reconciliation_invoice ON reconciliation_tasks(parsed_invoice_id);

-- Purchase Receipts (GRN)
CREATE TABLE IF NOT EXISTS purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    parsed_invoice_id UUID REFERENCES parsed_invoices(id),
    purchase_order_id UUID,
    vendor_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    freight_charges DECIMAL(12,2),
    other_charges DECIMAL(12,2),
    grand_total DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft|confirmed|posted|cancelled
    approved_by UUID,
    approved_at TIMESTAMP,
    posted_at TIMESTAMP,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipts_vendor ON purchase_receipts(vendor_id);
CREATE INDEX idx_receipts_shop ON purchase_receipts(shop_id);
CREATE INDEX idx_receipts_status ON purchase_receipts(status);

-- Purchase Receipt Lines
CREATE TABLE IF NOT EXISTS purchase_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    batch_no VARCHAR(50),
    expiry_date DATE,
    qty DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    landed_unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipt_lines_receipt ON purchase_receipt_lines(receipt_id);
CREATE INDEX idx_receipt_lines_product ON purchase_receipt_lines(product_id);

-- Vendor Price List
CREATE TABLE IF NOT EXISTS vendor_price_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    product_id UUID NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    min_qty INTEGER DEFAULT 1,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vendor_id, product_id, effective_from)
);

CREATE INDEX idx_vendor_prices_vendor ON vendor_price_list(vendor_id);
CREATE INDEX idx_vendor_prices_product ON vendor_price_list(product_id);
CREATE INDEX idx_vendor_prices_active ON vendor_price_list(is_active, effective_from);

-- Discount Rules
CREATE TABLE IF NOT EXISTS discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    scope VARCHAR(20) NOT NULL, -- vendor|brand|category|product|global
    scope_id UUID, -- vendor_id, brand_id, category_id, or product_id
    type VARCHAR(20) NOT NULL, -- percentage|fixed|tiered
    threshold_qty INTEGER,
    threshold_amount DECIMAL(15,2),
    discount_rate DECIMAL(5,2),
    discount_amount DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discount_rules_scope ON discount_rules(scope, scope_id);
CREATE INDEX idx_discount_rules_active ON discount_rules(is_active, start_date, end_date);

-- Comments
COMMENT ON TABLE parsed_invoices IS 'Vendor invoices parsed from PDFs';
COMMENT ON TABLE parsed_invoice_lines IS 'Line items from parsed invoices';
COMMENT ON TABLE vendor_product_mappings IS 'Vendor-specific product name mappings (learning)';
COMMENT ON TABLE reconciliation_tasks IS 'Manual reconciliation tasks for unmatched items';
COMMENT ON TABLE purchase_receipts IS 'Goods Receipt Notes (GRN) from confirmed invoices';
COMMENT ON TABLE vendor_price_list IS 'Vendor-specific pricing';
COMMENT ON TABLE discount_rules IS 'Discount rules engine';
