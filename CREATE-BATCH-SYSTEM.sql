-- =====================================================
-- BATCH MANAGEMENT SYSTEM FOR HOMEOPATHY ERP
-- =====================================================
-- This creates complete batch tracking with:
-- - Product batches (stock lots)
-- - Warehouses (multi-location)
-- - Inventory transactions (in/out movements)
-- =====================================================

-- =====================================================
-- 1. WAREHOUSES TABLE (Multi-location support)
-- =====================================================

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    location TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. BATCHES TABLE (Core inventory batches)
-- =====================================================

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_no VARCHAR(100) NOT NULL,
    
    -- Manufacturing & Expiry
    mfg_date DATE,
    exp_date DATE,
    
    -- Pricing
    mrp DECIMAL(10,2),
    purchase_rate DECIMAL(10,2),
    sale_rate DECIMAL(10,2),
    landing_cost DECIMAL(10,2),
    
    -- Quantity Management
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Location
    warehouse_id UUID REFERENCES warehouses(id),
    rack_location VARCHAR(50),
    
    -- Purchase Details
    supplier_id UUID,
    purchase_invoice_no VARCHAR(100),
    purchase_date DATE,
    
    -- Additional Info
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(product_id, batch_no, warehouse_id)
);

-- =====================================================
-- 3. INVENTORY TRANSACTIONS TABLE (Stock movements)
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Batch Reference
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE', 'EXPIRY'
    transaction_date DATE NOT NULL,
    
    -- Quantity
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    
    -- Reference Documents
    reference_type VARCHAR(50), -- 'PURCHASE_ORDER', 'SALES_INVOICE', 'GRN', 'ADJUSTMENT'
    reference_id UUID,
    reference_no VARCHAR(100),
    
    -- Party Details
    party_type VARCHAR(50), -- 'VENDOR', 'CUSTOMER'
    party_id UUID,
    party_name VARCHAR(255),
    
    -- Additional Info
    notes TEXT,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. BATCH ALERTS TABLE (Expiry & Low Stock Alerts)
-- =====================================================

CREATE TABLE IF NOT EXISTS batch_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    alert_type VARCHAR(50) NOT NULL, -- 'EXPIRY_NEAR', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK'
    alert_date DATE NOT NULL,
    alert_message TEXT,
    
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id ON batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_exp_date ON batches(exp_date);
CREATE INDEX IF NOT EXISTS idx_batches_batch_no ON batches(batch_no);
CREATE INDEX IF NOT EXISTS idx_batches_is_active ON batches(is_active);

CREATE INDEX IF NOT EXISTS idx_inventory_txn_batch_id ON inventory_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_type ON inventory_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_batch_alerts_batch_id ON batch_alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_alerts_type ON batch_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_batch_alerts_date ON batch_alerts(alert_date);

-- =====================================================
-- 6. TRIGGERS FOR AUTO-UPDATES
-- =====================================================

-- Update batch updated_at timestamp
CREATE OR REPLACE FUNCTION update_batch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_timestamp
BEFORE UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION update_batch_timestamp();

-- =====================================================
-- 7. INSERT DEFAULT WAREHOUSE
-- =====================================================

INSERT INTO warehouses (name, code, location, is_default, is_active) VALUES
('Main Warehouse', 'WH-MAIN', 'Main Store', true, true),
('Branch Warehouse', 'WH-BRANCH', 'Branch Store', false, true),
('Online Warehouse', 'WH-ONLINE', 'E-commerce Stock', false, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 8. USEFUL VIEWS
-- =====================================================

-- View: Batch Stock Summary
CREATE OR REPLACE VIEW v_batch_stock_summary AS
SELECT 
    b.id as batch_id,
    b.batch_no,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_code,
    b.mfg_date,
    b.exp_date,
    b.mrp,
    b.purchase_rate,
    b.sale_rate,
    b.quantity,
    b.reserved_quantity,
    b.available_quantity,
    w.name as warehouse_name,
    w.code as warehouse_code,
    CASE 
        WHEN b.exp_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN b.exp_date < CURRENT_DATE + INTERVAL '3 months' THEN 'EXPIRING_SOON'
        WHEN b.available_quantity <= 0 THEN 'OUT_OF_STOCK'
        WHEN b.available_quantity < 10 THEN 'LOW_STOCK'
        ELSE 'NORMAL'
    END as stock_status,
    b.is_active,
    b.created_at
FROM batches b
JOIN products p ON b.product_id = p.id
LEFT JOIN warehouses w ON b.warehouse_id = w.id;

-- View: Product Total Stock
CREATE OR REPLACE VIEW v_product_total_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku as product_code,
    COUNT(DISTINCT b.id) as total_batches,
    SUM(b.quantity) as total_quantity,
    SUM(b.reserved_quantity) as total_reserved,
    SUM(b.available_quantity) as total_available,
    MIN(b.exp_date) as nearest_expiry,
    AVG(b.purchase_rate) as avg_purchase_rate,
    AVG(b.sale_rate) as avg_sale_rate
FROM products p
LEFT JOIN batches b ON p.id = b.product_id AND b.is_active = true
GROUP BY p.id, p.name, p.sku;

-- View: Expiring Batches (Next 3 months)
CREATE OR REPLACE VIEW v_expiring_batches AS
SELECT 
    b.id,
    b.batch_no,
    p.name as product_name,
    b.exp_date,
    b.available_quantity,
    w.name as warehouse_name,
    EXTRACT(DAY FROM (b.exp_date - CURRENT_DATE)) as days_to_expiry
FROM batches b
JOIN products p ON b.product_id = p.id
LEFT JOIN warehouses w ON b.warehouse_id = w.id
WHERE b.exp_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
    AND b.is_active = true
    AND b.available_quantity > 0
ORDER BY b.exp_date ASC;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Count records
SELECT 'Warehouses' as type, COUNT(*) as count FROM warehouses
UNION ALL
SELECT 'Batches', COUNT(*) FROM batches
UNION ALL
SELECT 'Inventory Transactions', COUNT(*) FROM inventory_transactions
UNION ALL
SELECT 'Batch Alerts', COUNT(*) FROM batch_alerts;

-- Show warehouses
SELECT id, name, code, location, is_default, is_active FROM warehouses;

-- Show table structures
\d batches
\d inventory_transactions
\d warehouses

-- =====================================================
-- SUMMARY
-- =====================================================
-- Tables Created: 4 (warehouses, batches, inventory_transactions, batch_alerts)
-- Views Created: 3 (stock summary, total stock, expiring batches)
-- Indexes Created: 11 (for performance)
-- Triggers Created: 1 (auto-update timestamp)
-- Default Warehouses: 3
-- =====================================================
