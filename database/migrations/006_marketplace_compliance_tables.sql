-- Migration: Marketplace Integration, IRN/GST/eWay, Security & Audit Tables
-- Purpose: Enterprise compliance and marketplace integration
-- Author: System
-- Date: 2025-11-13

-- ============================================================================
-- MARKETPLACE INTEGRATION TABLES
-- ============================================================================

-- Raw webhook storage (8-year retention for compliance)
CREATE TABLE IF NOT EXISTS marketplace_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_webhooks_marketplace ON marketplace_webhooks(marketplace, created_at DESC);
CREATE INDEX idx_marketplace_webhooks_status ON marketplace_webhooks(processing_status, created_at);
CREATE INDEX idx_marketplace_webhooks_event ON marketplace_webhooks(event_type);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    marketplace_order_id VARCHAR(255) NOT NULL,
    internal_order_id UUID REFERENCES sales_orders(id),
    channel_order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    webhook_id UUID REFERENCES marketplace_webhooks(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    shipping_address JSONB,
    billing_address JSONB,
    items JSONB NOT NULL,
    total_amount DECIMAL(15,2),
    marketplace_fee DECIMAL(15,2),
    net_amount DECIMAL(15,2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    fulfillment_status VARCHAR(50),
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(marketplace, marketplace_order_id)
);

CREATE INDEX idx_marketplace_orders_marketplace ON marketplace_orders(marketplace, created_at DESC);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_internal ON marketplace_orders(internal_order_id);
CREATE INDEX idx_marketplace_orders_fulfillment ON marketplace_orders(fulfillment_status);

-- ============================================================================
-- IRN / GST / eWAY BILL TABLES (Indian Compliance)
-- ============================================================================

-- IRN Records (Invoice Reference Number)
CREATE TABLE IF NOT EXISTS irn_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
    irn_number VARCHAR(255) UNIQUE,
    ack_number VARCHAR(255),
    ack_date TIMESTAMP,
    signed_invoice TEXT,
    signed_qr_code TEXT,
    supply_type VARCHAR(50),
    document_type VARCHAR(20),
    seller_gstin VARCHAR(15),
    buyer_gstin VARCHAR(15),
    request_payload JSONB,
    response_payload JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_irn_invoice ON irn_records(invoice_id);
CREATE INDEX idx_irn_number ON irn_records(irn_number);
CREATE INDEX idx_irn_status ON irn_records(status, created_at DESC);
CREATE INDEX idx_irn_seller_gstin ON irn_records(seller_gstin, created_at DESC);

-- eWay Bills
CREATE TABLE IF NOT EXISTS eway_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
    eway_bill_number VARCHAR(255) UNIQUE,
    vehicle_number VARCHAR(50),
    transporter_id VARCHAR(255),
    transporter_name VARCHAR(255),
    transport_mode VARCHAR(50),
    transport_doc_no VARCHAR(255),
    transport_doc_date DATE,
    distance_km INT,
    from_gstin VARCHAR(15),
    from_place VARCHAR(255),
    to_gstin VARCHAR(15),
    to_place VARCHAR(255),
    item_details JSONB,
    total_value DECIMAL(15,2),
    cgst_value DECIMAL(15,2),
    sgst_value DECIMAL(15,2),
    igst_value DECIMAL(15,2),
    cess_value DECIMAL(15,2),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    extended_times INT DEFAULT 0,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eway_invoice ON eway_bills(invoice_id);
CREATE INDEX idx_eway_number ON eway_bills(eway_bill_number);
CREATE INDEX idx_eway_validity ON eway_bills(valid_until, status);
CREATE INDEX idx_eway_vehicle ON eway_bills(vehicle_number, created_at DESC);

-- Product GST Rate History (for compliance)
CREATE TABLE IF NOT EXISTS product_gst_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    hsn_code VARCHAR(20),
    gst_rate DECIMAL(5,2) NOT NULL,
    cgst_rate DECIMAL(5,2),
    sgst_rate DECIMAL(5,2),
    igst_rate DECIMAL(5,2),
    cess_rate DECIMAL(5,2),
    effective_from DATE NOT NULL,
    effective_until DATE,
    notification_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gst_history_product ON product_gst_history(product_id, effective_from DESC);
CREATE INDEX idx_gst_history_hsn ON product_gst_history(hsn_code, effective_from DESC);
CREATE INDEX idx_gst_history_effective ON product_gst_history(effective_from, effective_until);

-- ============================================================================
-- SECURITY & AUTHENTICATION TABLES
-- ============================================================================

-- Refresh Tokens (for JWT rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revocation_reason VARCHAR(255),
    parent_token_id UUID REFERENCES refresh_tokens(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id, revoked_at);
CREATE INDEX idx_refresh_token ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_expiry ON refresh_tokens(expires_at, revoked_at);

-- Audit Logs (comprehensive audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    api_endpoint VARCHAR(500),
    http_method VARCHAR(10),
    response_status INT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at DESC);

-- API Rate Limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500),
    request_count INT DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limit_identifier ON api_rate_limits(identifier, window_end);
CREATE INDEX idx_rate_limit_window ON api_rate_limits(window_end);

-- ============================================================================
-- MULTI-CHANNEL SUPPORT TABLES
-- ============================================================================

-- POS Counters
CREATE TABLE IF NOT EXISTS pos_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counter_name VARCHAR(100) NOT NULL,
    counter_number VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(255),
    warehouse_id UUID,
    assigned_user_id UUID REFERENCES users(id),
    device_id VARCHAR(255),
    terminal_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    current_shift_id UUID,
    opening_balance DECIMAL(15,2),
    closing_balance DECIMAL(15,2),
    last_sync_at TIMESTAMP,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pos_counters_status ON pos_counters(status, is_active);
CREATE INDEX idx_pos_counters_user ON pos_counters(assigned_user_id);

-- B2B Reseller Configuration
CREATE TABLE IF NOT EXISTS b2b_resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    reseller_code VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    pan_number VARCHAR(10),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INT DEFAULT 0,
    current_outstanding DECIMAL(15,2) DEFAULT 0,
    pricing_tier VARCHAR(50) DEFAULT 'standard',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    payment_terms TEXT,
    status VARCHAR(50) DEFAULT 'active',
    kyc_status VARCHAR(50) DEFAULT 'pending',
    kyc_documents JSONB,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resellers_code ON b2b_resellers(reseller_code);
CREATE INDEX idx_resellers_customer ON b2b_resellers(customer_id);
CREATE INDEX idx_resellers_status ON b2b_resellers(status, is_active);

-- Pricing Tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(100) NOT NULL,
    tier_code VARCHAR(50) UNIQUE NOT NULL,
    base_discount DECIMAL(5,2) DEFAULT 0,
    min_order_value DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product-specific pricing by tier
CREATE TABLE IF NOT EXISTS tier_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_tier_id UUID REFERENCES pricing_tiers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    custom_price DECIMAL(15,2),
    discount_percentage DECIMAL(5,2),
    min_quantity INT DEFAULT 1,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pricing_tier_id, product_id, valid_from)
);

CREATE INDEX idx_tier_pricing_tier ON tier_pricing(pricing_tier_id, valid_from DESC);
CREATE INDEX idx_tier_pricing_product ON tier_pricing(product_id);

-- ============================================================================
-- DATA RETENTION POLICY (8 years for compliance)
-- ============================================================================

COMMENT ON TABLE marketplace_webhooks IS '8-year retention required for tax compliance';
COMMENT ON TABLE irn_records IS '8-year retention required for GST compliance';
COMMENT ON TABLE eway_bills IS '8-year retention required for GST compliance';
COMMENT ON TABLE audit_logs IS '8-year retention for audit compliance';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marketplace_webhooks_updated_at BEFORE UPDATE ON marketplace_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_irn_records_updated_at BEFORE UPDATE ON irn_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_eway_bills_updated_at BEFORE UPDATE ON eway_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_counters_updated_at BEFORE UPDATE ON pos_counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_b2b_resellers_updated_at BEFORE UPDATE ON b2b_resellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_tiers_updated_at BEFORE UPDATE ON pricing_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
