-- ============================================
-- Yeelo Homeopathy Platform - Production Database Schema
-- PostgreSQL Database Schema for Purchase → Inventory → Sales
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. VENDORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PURCHASE ORDERS TABLE (Temp + Final)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Upload metadata
    upload_method VARCHAR(20) CHECK (upload_method IN ('csv', 'pdf', 'manual')),
    uploaded_file_path TEXT,
    
    -- Status workflow
    status VARCHAR(30) CHECK (status IN ('pending_review', 'approved', 'rejected', 'merged_to_inventory')) DEFAULT 'pending_review',
    
    -- Amounts
    total_items INTEGER DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Dates
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    received_date DATE,
    
    -- Approval tracking
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    merged_by VARCHAR(255),
    
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    merged_at TIMESTAMP,
    
    -- Notes
    notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. PURCHASE ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Product details
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    batch_number VARCHAR(100) NOT NULL,
    
    -- Quantities
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    
    -- Pricing (3-tier)
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    
    -- Dates
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    
    -- Validation
    matched_with_inventory BOOLEAN DEFAULT false,
    inventory_product_id UUID,
    has_conflicts BOOLEAN DEFAULT false,
    conflict_details TEXT,
    
    -- Status
    item_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. INVENTORY BATCHES TABLE (Multi-batch system)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Product info
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Stock
    quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 20,
    
    -- Pricing
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    
    -- Dates
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    
    -- Location
    location VARCHAR(100) DEFAULT 'Main Store',
    rack_number VARCHAR(50),
    
    -- Source
    supplier VARCHAR(255),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. SALES ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Sale type
    sale_type VARCHAR(20) CHECK (sale_type IN ('retail', 'wholesale')) DEFAULT 'retail',
    
    -- Amounts
    total_items INTEGER DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Payment
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi', 'credit')),
    payment_status VARCHAR(20) DEFAULT 'completed',
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed',
    
    -- Staff
    created_by VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. SALES ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    
    -- Product from inventory batch
    batch_id UUID REFERENCES inventory_batches(id),
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    batch_number VARCHAR(100),
    
    -- Sale details
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. STOCK MOVEMENTS TABLE (Audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES inventory_batches(id),
    
    movement_type VARCHAR(30) CHECK (movement_type IN ('purchase_in', 'sale_out', 'adjustment', 'return', 'damage')),
    
    quantity_before INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    reference_type VARCHAR(50),
    reference_id UUID,
    
    notes TEXT,
    created_by VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_date ON purchase_orders(order_date);

CREATE INDEX idx_inventory_batch ON inventory_batches(batch_number);
CREATE INDEX idx_inventory_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_location ON inventory_batches(location);
CREATE INDEX idx_inventory_product ON inventory_batches(product_name, brand);

CREATE INDEX idx_sales_date ON sales_orders(created_at);
CREATE INDEX idx_sales_customer ON sales_orders(customer_phone);
CREATE INDEX idx_sales_type ON sales_orders(sale_type);

CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- ============================================
-- TRIGGERS for auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA for Testing
-- ============================================

-- Insert sample vendors
INSERT INTO vendors (vendor_code, name, phone, email, payment_terms) VALUES
('VEN001', 'SBL Pharmaceuticals', '+91-98765-43210', 'orders@sbl.in', 30),
('VEN002', 'Dr Reckeweg India', '+91-98765-43211', 'orders@reckeweg.in', 45),
('VEN003', 'Schwabe India', '+91-98765-43212', 'orders@schwabe.in', 30)
ON CONFLICT (vendor_code) DO NOTHING;

-- Insert sample inventory batches
INSERT INTO inventory_batches (product_name, brand, batch_number, quantity, purchase_price, selling_price, mrp, expiry_date, supplier, location) VALUES
('Arnica Montana 200CH', 'SBL', 'ARM2024001', 50, 120, 150, 180, '2026-12-31', 'SBL Pharmaceuticals', 'Main Store'),
('Arnica Montana 200CH', 'Dr Reckeweg', 'ARM2024002', 30, 115, 145, 175, '2027-06-30', 'Dr Reckeweg India', 'Main Store'),
('Belladonna 30CH', 'SBL', 'BEL2024001', 15, 95, 120, 150, '2025-03-15', 'SBL Pharmaceuticals', 'Warehouse A'),
('Nux Vomica 1M', 'Schwabe', 'NUX2024001', 25, 160, 200, 240, '2026-08-20', 'Schwabe India', 'Main Store')
ON CONFLICT (batch_number) DO NOTHING;

-- ============================================
-- VIEWS for Quick Access
-- ============================================

-- View: Pending Purchases
CREATE OR REPLACE VIEW pending_purchases AS
SELECT 
    po.*,
    COUNT(poi.id) as item_count
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
WHERE po.status = 'pending_review'
GROUP BY po.id
ORDER BY po.created_at DESC;

-- View: Low Stock Items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
    product_name,
    brand,
    SUM(quantity) as total_stock,
    MIN(reorder_point) as reorder_point,
    MIN(expiry_date) as earliest_expiry
FROM inventory_batches
WHERE status = 'active'
GROUP BY product_name, brand
HAVING SUM(quantity) < MIN(reorder_point)
ORDER BY total_stock ASC;

-- View: Daily Sales Summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(total_items) as total_items_sold,
    SUM(total_amount) as total_revenue,
    SUM(CASE WHEN sale_type = 'retail' THEN total_amount ELSE 0 END) as retail_revenue,
    SUM(CASE WHEN sale_type = 'wholesale' THEN total_amount ELSE 0 END) as wholesale_revenue
FROM sales_orders
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '✅ All tables, indexes, triggers created';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '✅ Views created for quick access';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables created:';
    RAISE NOTICE '   - vendors';
    RAISE NOTICE '   - purchase_orders';
    RAISE NOTICE '   - purchase_order_items';
    RAISE NOTICE '   - inventory_batches';
    RAISE NOTICE '   - sales_orders';
    RAISE NOTICE '   - sales_order_items';
    RAISE NOTICE '   - stock_movements';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production use!';
END $$;
