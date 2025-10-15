-- ============================================
-- PHASE 1: Enterprise Features - Database Schema
-- ============================================

-- 1. APPROVAL LEVELS & WORKFLOW
CREATE TABLE IF NOT EXISTS approval_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_number INTEGER NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. APPROVAL HISTORY (Complete audit trail)
CREATE TABLE IF NOT EXISTS approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID REFERENCES purchase_orders(id),
    approver_name VARCHAR(255) NOT NULL,
    approver_role VARCHAR(100),
    action VARCHAR(20) CHECK (action IN ('approved', 'rejected', 'forwarded')),
    comments TEXT,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. VENDOR PERFORMANCE TRACKING
CREATE TABLE IF NOT EXISTS vendor_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id),
    
    -- Delivery metrics
    total_orders INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    avg_delivery_days DECIMAL(5,2) DEFAULT 0,
    
    -- Quality metrics
    total_items_received INTEGER DEFAULT 0,
    items_accepted INTEGER DEFAULT 0,
    items_rejected INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 100,
    
    -- Pricing
    avg_discount_percentage DECIMAL(5,2) DEFAULT 0,
    price_competitiveness_score DECIMAL(5,2) DEFAULT 0,
    
    -- Rating
    overall_rating DECIMAL(3,2) DEFAULT 5.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- Status
    is_preferred BOOLEAN DEFAULT false,
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VENDOR PRICE HISTORY (Track price changes)
CREATE TABLE IF NOT EXISTS vendor_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id),
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. EMAIL NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    notification_type VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AUTO-REORDER TRIGGERS
CREATE TABLE IF NOT EXISTS auto_reorder_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    preferred_vendor_id UUID REFERENCES vendors(id),
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. GRN (Goods Receipt Notes)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    po_id UUID REFERENCES purchase_orders(id),
    po_number VARCHAR(50),
    
    received_date DATE DEFAULT CURRENT_DATE,
    received_by VARCHAR(255),
    
    total_items_expected INTEGER,
    total_items_received INTEGER,
    total_items_accepted INTEGER,
    total_items_rejected INTEGER,
    
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. GRN ITEMS (Individual product receipt)
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID REFERENCES goods_receipt_notes(id),
    po_item_id UUID REFERENCES purchase_order_items(id),
    
    product_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100),
    
    ordered_quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL,
    accepted_quantity INTEGER NOT NULL,
    rejected_quantity INTEGER DEFAULT 0,
    
    rejection_reason TEXT,
    quality_check_status VARCHAR(20),
    
    barcode_scanned BOOLEAN DEFAULT false,
    scanned_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PAYMENT TRACKING
CREATE TABLE IF NOT EXISTS vendor_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id),
    po_id UUID REFERENCES purchase_orders(id),
    
    invoice_number VARCHAR(100),
    invoice_date DATE,
    invoice_amount DECIMAL(12,2),
    
    payment_terms VARCHAR(50),
    due_date DATE,
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    payment_method VARCHAR(50),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_approval_history_po ON approval_history(po_id);
CREATE INDEX idx_approval_history_date ON approval_history(created_at);

CREATE INDEX idx_vendor_performance_vendor ON vendor_performance(vendor_id);
CREATE INDEX idx_vendor_performance_rating ON vendor_performance(overall_rating);

CREATE INDEX idx_price_history_vendor ON vendor_price_history(vendor_id);
CREATE INDEX idx_price_history_product ON vendor_price_history(product_name, brand);
CREATE INDEX idx_price_history_date ON vendor_price_history(effective_date);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_type ON email_notifications(notification_type);

CREATE INDEX idx_grn_po ON goods_receipt_notes(po_id);
CREATE INDEX idx_grn_date ON goods_receipt_notes(received_date);

CREATE INDEX idx_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX idx_payments_status ON vendor_payments(payment_status);
CREATE INDEX idx_payments_due ON vendor_payments(due_date);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert approval levels
INSERT INTO approval_levels (level_number, role_name, department, min_amount, max_amount) VALUES
(1, 'Store Manager', 'Operations', 0, 50000),
(2, 'Supervisor', 'Operations', 0, 200000),
(3, 'Purchase Manager', 'Purchase', 0, 500000),
(4, 'Finance Director', 'Finance', 500000, NULL)
ON CONFLICT DO NOTHING;

-- Insert vendor performance data
INSERT INTO vendor_performance (vendor_id, total_orders, on_time_deliveries, total_items_received, items_accepted, overall_rating)
SELECT id, 10, 9, 500, 485, 4.5
FROM vendors WHERE vendor_code = 'VEN001'
ON CONFLICT DO NOTHING;

INSERT INTO vendor_performance (vendor_id, total_orders, on_time_deliveries, total_items_received, items_accepted, overall_rating)
SELECT id, 8, 7, 400, 395, 4.2
FROM vendors WHERE vendor_code = 'VEN002'
ON CONFLICT DO NOTHING;

-- Insert sample price history
INSERT INTO vendor_price_history (vendor_id, product_name, brand, price, effective_date)
SELECT v.id, 'Arnica Montana 200CH', 'SBL', 120, CURRENT_DATE - INTERVAL '30 days'
FROM vendors v WHERE v.vendor_code = 'VEN001';

INSERT INTO vendor_price_history (vendor_id, product_name, brand, price, effective_date)
SELECT v.id, 'Arnica Montana 200CH', 'Dr Reckeweg', 125, CURRENT_DATE - INTERVAL '30 days'
FROM vendors v WHERE v.vendor_code = 'VEN002';

-- ============================================
-- VIEWS FOR QUICK ACCESS
-- ============================================

-- View: Vendor Performance Summary
CREATE OR REPLACE VIEW vendor_performance_summary AS
SELECT 
    v.id,
    v.name as vendor_name,
    v.vendor_code,
    vp.overall_rating,
    ROUND((vp.on_time_deliveries::DECIMAL / NULLIF(vp.total_orders, 0)) * 100, 2) as on_time_percentage,
    ROUND((vp.items_accepted::DECIMAL / NULLIF(vp.total_items_received, 0)) * 100, 2) as quality_percentage,
    vp.is_preferred,
    vp.is_blacklisted
FROM vendors v
LEFT JOIN vendor_performance vp ON v.id = vp.vendor_id
ORDER BY vp.overall_rating DESC;

-- View: Price Comparison
CREATE OR REPLACE VIEW price_comparison AS
SELECT 
    product_name,
    brand,
    vendor_id,
    v.name as vendor_name,
    price,
    effective_date,
    ROW_NUMBER() OVER (PARTITION BY product_name, brand ORDER BY price ASC) as price_rank
FROM vendor_price_history vph
JOIN vendors v ON vph.vendor_id = v.id
WHERE end_date IS NULL OR end_date > CURRENT_DATE
ORDER BY product_name, price;

-- View: Pending Payments
CREATE OR REPLACE VIEW pending_payments AS
SELECT 
    vp.*,
    v.name as vendor_name,
    po.po_number,
    CURRENT_DATE - vp.due_date as days_overdue
FROM vendor_payments vp
JOIN vendors v ON vp.vendor_id = v.id
LEFT JOIN purchase_orders po ON vp.po_id = po.id
WHERE vp.payment_status IN ('pending', 'partial', 'overdue')
ORDER BY vp.due_date ASC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 1 schema created successfully!';
    RAISE NOTICE '✅ Tables: approval_levels, approval_history, vendor_performance';
    RAISE NOTICE '✅ Tables: vendor_price_history, email_notifications, auto_reorder_triggers';
    RAISE NOTICE '✅ Tables: goods_receipt_notes, grn_items, vendor_payments';
    RAISE NOTICE '✅ All indexes and views created';
    RAISE NOTICE '🚀 Ready for Phase 1 features!';
END $$;
