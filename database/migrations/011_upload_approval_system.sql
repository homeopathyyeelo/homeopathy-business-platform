-- =====================================================
-- PURCHASE & INVENTORY UPLOAD APPROVAL SYSTEM
-- =====================================================
-- Handles CSV imports for purchases and inventory
-- with super user approval workflow
-- =====================================================

-- First, ensure required base tables exist in public schema
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    potency VARCHAR(50),
    form VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(15,2),
    mrp DECIMAL(15,2),
    stock_qty INTEGER DEFAULT 0,
    unit VARCHAR(50),
    hsn_code VARCHAR(20),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    gstin VARCHAR(15),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_no VARCHAR(100),
    vendor_id UUID REFERENCES vendors(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255),
    product_code VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(10,2) DEFAULT 0,
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    mrp DECIMAL(15,2),
    location VARCHAR(100),
    rack_number VARCHAR(50),
    warehouse_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_number);

-- Enable extensions for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Upload Sessions (tracks each CSV upload)
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_type VARCHAR(50) NOT NULL, -- purchase, inventory
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, awaiting_approval, approved, rejected, completed, failed
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Approval workflow
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Summary
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    total_amount DECIMAL(15,2),
    total_items INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_sessions_type ON upload_sessions(upload_type);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_approval ON upload_sessions(approval_status);
CREATE INDEX idx_upload_sessions_uploaded_by ON upload_sessions(uploaded_by);
CREATE INDEX idx_upload_sessions_created ON upload_sessions(created_at DESC);

COMMENT ON TABLE upload_sessions IS 'Tracks CSV upload sessions for purchases and inventory';

-- Upload Items (individual rows from CSV)
CREATE TABLE IF NOT EXISTS upload_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, validated, error, imported
    
    -- Product identification
    product_code VARCHAR(100),
    product_name VARCHAR(255),
    brand VARCHAR(100),
    potency VARCHAR(50),
    size VARCHAR(50),
    form VARCHAR(50),
    hsn_code VARCHAR(20),
    
    -- Purchase specific
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    mrp DECIMAL(15,2),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(15,2),
    tax_percent DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    -- Product matching
    matched_product_id UUID REFERENCES products(id),
    match_type VARCHAR(50), -- exact, fuzzy, manual, new
    match_confidence DECIMAL(3,2),
    
    -- Validation
    validation_errors JSONB,
    warnings JSONB,
    
    -- Additional data from CSV
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_items_session ON upload_items(session_id);
CREATE INDEX idx_upload_items_status ON upload_items(status);
CREATE INDEX idx_upload_items_product ON upload_items(matched_product_id);

COMMENT ON TABLE upload_items IS 'Individual items from CSV uploads';

-- Purchase Uploads (staged purchase data awaiting approval)
CREATE TABLE IF NOT EXISTS purchase_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    
    -- Vendor information
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_gstin VARCHAR(15),
    vendor_address TEXT,
    vendor_phone VARCHAR(20),
    
    -- Invoice details
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    freight_charges DECIMAL(15,2) DEFAULT 0,
    other_charges DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, imported
    
    -- Related records (after approval)
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    grn_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_uploads_session ON purchase_uploads(session_id);
CREATE INDEX idx_purchase_uploads_vendor ON purchase_uploads(vendor_id);
CREATE INDEX idx_purchase_uploads_status ON purchase_uploads(status);
CREATE INDEX idx_purchase_uploads_invoice ON purchase_uploads(invoice_number);

COMMENT ON TABLE purchase_uploads IS 'Staged purchase data awaiting approval';

-- Inventory Uploads (staged inventory data awaiting approval)
CREATE TABLE IF NOT EXISTS inventory_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    
    -- Product reference
    product_id UUID REFERENCES products(id),
    product_code VARCHAR(100),
    product_name VARCHAR(255),
    
    -- Batch details
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Quantity
    quantity DECIMAL(10,2) NOT NULL,
    
    -- Pricing
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    mrp DECIMAL(15,2),
    
    -- Location
    warehouse_id UUID,
    location VARCHAR(100),
    rack_number VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, imported
    
    -- Related records (after approval)
    inventory_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_uploads_session ON inventory_uploads(session_id);
CREATE INDEX idx_inventory_uploads_product ON inventory_uploads(product_id);
CREATE INDEX idx_inventory_uploads_status ON inventory_uploads(status);

COMMENT ON TABLE inventory_uploads IS 'Staged inventory data awaiting approval';

-- Upload Logs (audit trail)
CREATE TABLE IF NOT EXISTS upload_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL, -- info, warning, error, success
    message TEXT NOT NULL,
    details JSONB,
    row_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_logs_session ON upload_logs(session_id);
CREATE INDEX idx_upload_logs_level ON upload_logs(log_level);
CREATE INDEX idx_upload_logs_created ON upload_logs(created_at DESC);

COMMENT ON TABLE upload_logs IS 'Audit trail for upload operations';

-- Function: Update session statistics
CREATE OR REPLACE FUNCTION update_upload_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE upload_sessions
    SET 
        processed_rows = (
            SELECT COUNT(*) FROM upload_items WHERE session_id = NEW.session_id
        ),
        success_rows = (
            SELECT COUNT(*) FROM upload_items 
            WHERE session_id = NEW.session_id AND status IN ('validated', 'imported')
        ),
        error_rows = (
            SELECT COUNT(*) FROM upload_items 
            WHERE session_id = NEW.session_id AND status = 'error'
        ),
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_stats
AFTER INSERT OR UPDATE ON upload_items
FOR EACH ROW
EXECUTE FUNCTION update_upload_session_stats();

-- Function: Approve purchase upload
CREATE OR REPLACE FUNCTION approve_purchase_upload(
    p_session_id UUID,
    p_approved_by UUID
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_purchase_id INTEGER;
    v_count INTEGER;
BEGIN
    -- Update session status
    UPDATE upload_sessions
    SET 
        approval_status = 'approved',
        status = 'approved',
        approved_by = p_approved_by,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id
    AND approval_status = 'pending';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Upload session not found or already processed'
        );
    END IF;
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Upload approved successfully',
        'session_id', p_session_id,
        'approved_by', p_approved_by
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Reject upload
CREATE OR REPLACE FUNCTION reject_upload(
    p_session_id UUID,
    p_rejected_by UUID,
    p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE upload_sessions
    SET 
        approval_status = 'rejected',
        status = 'rejected',
        approved_by = p_rejected_by,
        approved_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_session_id
    AND approval_status = 'pending';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Upload session not found or already processed'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Upload rejected',
        'session_id', p_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create notification for pending approvals
CREATE OR REPLACE FUNCTION notify_pending_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'awaiting_approval' THEN
        -- Insert notification for super users
        INSERT INTO upload_logs (session_id, log_level, message, details)
        VALUES (
            NEW.id,
            'info',
            'Upload awaiting approval',
            jsonb_build_object(
                'upload_type', NEW.upload_type,
                'uploaded_by', NEW.uploaded_by,
                'total_items', NEW.total_items,
                'total_amount', NEW.total_amount
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_pending_approval
AFTER UPDATE ON upload_sessions
FOR EACH ROW
WHEN (NEW.status = 'awaiting_approval' AND OLD.status != 'awaiting_approval')
EXECUTE FUNCTION notify_pending_approval();

SELECT 'Upload approval system tables created successfully!' as result;
