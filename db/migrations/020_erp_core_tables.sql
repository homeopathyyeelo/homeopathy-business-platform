-- ============================================================================
-- ERP Core Tables Migration
-- Creates the main business tables that the API services expect
-- ============================================================================

-- Products Table (matches API expectations)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    potency VARCHAR(50),
    form VARCHAR(100),
    pack_size VARCHAR(50),
    uom VARCHAR(50) DEFAULT 'piece',
    cost_price DECIMAL(10,2) DEFAULT 0,
    selling_price DECIMAL(10,2) DEFAULT 0,
    mrp DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 12.00,
    hsn_code VARCHAR(20),
    manufacturer VARCHAR(255),
    description TEXT,
    barcode VARCHAR(100),
    reorder_level INTEGER DEFAULT 20,
    min_stock INTEGER DEFAULT 10,
    max_stock INTEGER DEFAULT 1000,
    current_stock DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    customer_type VARCHAR(50) DEFAULT 'retail',
    credit_limit DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    payment_terms VARCHAR(100),
    credit_days INTEGER DEFAULT 30,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Batches Table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity DECIMAL(10,2) NOT NULL,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    available_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2),
    location VARCHAR(100),
    rack_number VARCHAR(50),
    bin_number VARCHAR(50),
    supplier_id UUID REFERENCES vendors(id),
    purchase_order_id VARCHAR(100),
    is_expired BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    order_type VARCHAR(50) DEFAULT 'sale',
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    batch_id UUID REFERENCES inventory_batches(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 12.00,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 12.00,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO categories (name, code, description, sort_order) VALUES
('Dilutions', 'dilutions', 'Homeopathic dilutions in liquid form', 1),
('Mother Tinctures', 'mother_tinctures', 'Pure mother tinctures', 2),
('Biochemic', 'biochemic', 'Biochemic tissue salts', 3),
('Bio Combinations', 'bio_combinations', 'Bio combination remedies', 4),
('Triturations', 'triturations', 'Trituration tablets', 5),
('Specialties', 'specialties', 'Specialty medicines', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO brands (name, code, description) VALUES
('SBL', 'sbl', 'SBL Pharmaceuticals'),
('Dr. Reckeweg', 'reckeweg', 'Dr. Reckeweg & Co'),
('Willmar Schwabe', 'schwabe', 'Willmar Schwabe India'),
('BJain', 'bjain', 'BJain Pharmaceuticals'),
('Allen', 'allen', 'Allen Laboratories'),
('Hahnemann', 'hahnemann', 'Hahnemann Publishing')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (sku, name, category, brand, potency, form, cost_price, selling_price, mrp, current_stock, is_active) VALUES
('SBL-ARN-30C', 'Arnica Montana 30C', 'Dilutions', 'SBL', '30C', 'Liquid', 45.00, 85.00, 100.00, 150, true),
('SBL-BEL-200C', 'Belladonna 200C', 'Dilutions', 'SBL', '200C', 'Liquid', 50.00, 95.00, 110.00, 120, true),
('DRR-NUX-30C', 'Nux Vomica 30C', 'Dilutions', 'Dr. Reckeweg', '30C', 'Liquid', 48.00, 90.00, 105.00, 180, true),
('SBL-RHU-30C', 'Rhus Toxicodendron 30C', 'Dilutions', 'SBL', '30C', 'Liquid', 45.00, 85.00, 100.00, 160, true),
('SBL-CAL-Q', 'Calendula Q', 'Mother Tinctures', 'SBL', 'Q', 'Liquid', 120.00, 180.00, 200.00, 80, true),
('BJ-CP-6X', 'Calcarea Phosphorica 6X', 'Biochemic', 'BJain', '6X', 'Tablets', 35.00, 65.00, 75.00, 200, true)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (customer_code, name, email, phone, customer_type) VALUES
('CUST001', 'Rajesh Kumar', 'rajesh@example.com', '9876543310', 'retail'),
('CUST002', 'Priya Sharma', 'priya@example.com', '9876543311', 'retail'),
('CUST003', 'Amit Patel', 'amit@example.com', '9876543312', 'wholesale')
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO vendors (vendor_code, name, contact_person, email, phone, gst_number) VALUES
('VEND001', 'SBL Pharmaceuticals', 'Ramesh Kumar', 'sales@sbl.com', '9876540001', '07AAAAA0000A1Z5'),
('VEND002', 'Dr. Reckeweg & Co', 'Suresh Patel', 'info@reckeweg.com', '9876540002', '27BBBBB0000B1Z5'),
('VEND003', 'BJain Pharmaceuticals', 'Dinesh Shah', 'sales@bjain.com', '9876540004', '07DDDDD0000D1Z5')
ON CONFLICT (vendor_code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_batch ON inventory_batches(batch_number);

CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE products IS 'Core products catalog for homeopathy medicines';
COMMENT ON TABLE categories IS 'Product categories (Dilutions, Mother Tinctures, etc.)';
COMMENT ON TABLE brands IS 'Product brands (SBL, Reckeweg, Allen, etc.)';
COMMENT ON TABLE customers IS 'Customer master data';
COMMENT ON TABLE vendors IS 'Vendor/Supplier master data';
COMMENT ON TABLE inventory_batches IS 'Inventory with batch tracking and expiry';
COMMENT ON TABLE sales_orders IS 'Sales orders and invoices';
COMMENT ON TABLE sales_order_items IS 'Individual items in sales orders';
COMMENT ON TABLE purchase_orders IS 'Purchase orders';
COMMENT ON TABLE purchase_order_items IS 'Individual items in purchase orders';
