-- =====================================================
-- COMPLETE INVOICE SYSTEM MIGRATION
-- Adds missing tables and indexes for production
-- =====================================================

-- Outbox Events Table (for Kafka event publishing)
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_outbox_unpublished ON outbox_events(published, created_at) WHERE published = false;
CREATE INDEX idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_event_type ON outbox_events(event_type);

-- Inventory Batches (Enhanced)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    expiry_date DATE,
    qty_available DECIMAL(10,2) NOT NULL DEFAULT 0,
    qty_reserved DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL,
    landed_cost DECIMAL(12,2),
    mrp DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active', -- active, expired, blocked
    received_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, shop_id, batch_no)
);

CREATE INDEX idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_shop ON inventory_batches(shop_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date) WHERE status = 'active';
CREATE INDEX idx_inventory_batches_available ON inventory_batches(qty_available) WHERE qty_available > 0;

-- Products Master (if not exists)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand_id UUID,
    category_id UUID,
    potency VARCHAR(20),
    form_type VARCHAR(50), -- Mother Tincture, Dilution, Biochemic, etc.
    pack_size VARCHAR(50),
    unit VARCHAR(20),
    hsn_code VARCHAR(20),
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    mrp DECIMAL(12,2),
    retail_price DECIMAL(12,2),
    wholesale_price DECIMAL(12,2),
    online_price DECIMAL(12,2),
    doctor_price DECIMAL(12,2),
    min_stock_level INTEGER DEFAULT 10,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    is_active BOOLEAN DEFAULT true,
    barcode VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Customers Master
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'retail', -- retail, wholesale, doctor
    email VARCHAR(255),
    phone VARCHAR(20),
    gstin VARCHAR(15),
    billing_address JSONB,
    shipping_address JSONB,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Vendors Master
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    gstin VARCHAR(15),
    address JSONB,
    payment_terms VARCHAR(50),
    credit_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_active ON vendors(is_active);

-- Shops/Branches Master
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    shop_type VARCHAR(20) DEFAULT 'retail', -- retail, warehouse, clinic
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shops_active ON shops(is_active);

-- Invoice Series (for auto-numbering)
CREATE TABLE IF NOT EXISTS invoice_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_type VARCHAR(20) NOT NULL, -- POS, WHOLESALE, ONLINE, PURCHASE
    prefix VARCHAR(10) NOT NULL,
    current_number INTEGER DEFAULT 1,
    shop_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(series_type, shop_id)
);

-- Pricing Tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    customer_type VARCHAR(20) NOT NULL, -- retail, wholesale, doctor, online
    min_qty INTEGER DEFAULT 1,
    price DECIMAL(12,2) NOT NULL,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_product ON pricing_tiers(product_id);
CREATE INDEX idx_pricing_type ON pricing_tiers(customer_type);
CREATE INDEX idx_pricing_active ON pricing_tiers(is_active, effective_from);

-- Stock Movements (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    batch_no VARCHAR(50),
    movement_type VARCHAR(20) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT
    reference_type VARCHAR(50), -- PURCHASE, SALES, RETURN, ADJUSTMENT
    reference_id UUID,
    qty_change DECIMAL(10,2) NOT NULL,
    qty_before DECIMAL(10,2),
    qty_after DECIMAL(10,2),
    unit_cost DECIMAL(12,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_shop ON stock_movements(shop_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- Loyalty Program
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- EARN, REDEEM, EXPIRE, ADJUST
    points INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    balance_after INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_date ON loyalty_transactions(created_at);

-- Triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get available stock
CREATE OR REPLACE FUNCTION get_available_stock(p_product_id UUID, p_shop_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_available DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(qty_available - qty_reserved), 0)
    INTO v_available
    FROM inventory_batches
    WHERE product_id = p_product_id
      AND shop_id = p_shop_id
      AND status = 'active'
      AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);
    
    RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve stock (FIFO by expiry)
CREATE OR REPLACE FUNCTION reserve_stock(
    p_product_id UUID,
    p_shop_id UUID,
    p_qty DECIMAL
)
RETURNS TABLE(batch_id UUID, batch_no VARCHAR, qty_reserved DECIMAL) AS $$
DECLARE
    v_remaining DECIMAL := p_qty;
    v_batch RECORD;
BEGIN
    FOR v_batch IN
        SELECT id, batch_no, qty_available, qty_reserved
        FROM inventory_batches
        WHERE product_id = p_product_id
          AND shop_id = p_shop_id
          AND status = 'active'
          AND qty_available > qty_reserved
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY COALESCE(expiry_date, '2099-12-31'), created_at
    LOOP
        DECLARE
            v_available DECIMAL := v_batch.qty_available - v_batch.qty_reserved;
            v_to_reserve DECIMAL := LEAST(v_available, v_remaining);
        BEGIN
            UPDATE inventory_batches
            SET qty_reserved = qty_reserved + v_to_reserve
            WHERE id = v_batch.id;
            
            batch_id := v_batch.id;
            batch_no := v_batch.batch_no;
            qty_reserved := v_to_reserve;
            RETURN NEXT;
            
            v_remaining := v_remaining - v_to_reserve;
            EXIT WHEN v_remaining <= 0;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed data for testing
INSERT INTO shops (id, shop_code, name, shop_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'MAIN', 'Main Branch', 'retail'),
    ('22222222-2222-2222-2222-222222222222', 'WH01', 'Warehouse', 'warehouse')
ON CONFLICT (shop_code) DO NOTHING;

INSERT INTO vendors (id, vendor_code, name, payment_terms, credit_days) VALUES
    ('33333333-3333-3333-3333-333333333333', 'SBL001', 'SBL Pharmaceuticals', 'Net 30', 30),
    ('44444444-4444-4444-4444-444444444444', 'REC001', 'Dr. Reckeweg & Co.', 'Net 30', 30)
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO invoice_series (series_type, prefix, shop_id) VALUES
    ('POS', 'POS-', '11111111-1111-1111-1111-111111111111'),
    ('WHOLESALE', 'WS-', '11111111-1111-1111-1111-111111111111'),
    ('ONLINE', 'ONL-', '11111111-1111-1111-1111-111111111111'),
    ('PURCHASE', 'PUR-', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Sample products
INSERT INTO products (id, sku, name, brand_id, potency, form_type, unit, hsn_code, tax_rate, mrp, retail_price, wholesale_price) VALUES
    ('55555555-5555-5555-5555-555555555555', 'SBL-ARS-30C', 'Arsenicum Album 30C', NULL, '30C', 'Dilution', 'ml', '30049099', 12.00, 150.00, 140.00, 120.00),
    ('66666666-6666-6666-6666-666666666666', 'SBL-NUX-200C', 'Nux Vomica 200C', NULL, '200C', 'Dilution', 'ml', '30049099', 12.00, 160.00, 150.00, 130.00)
ON CONFLICT (sku) DO NOTHING;

SELECT 'Complete invoice system migration completed successfully!' as result;
