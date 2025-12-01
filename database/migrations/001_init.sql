-- ============================================================================
-- HOMEOPATHY ERP PLATFORM - COMPLETE DATABASE SCHEMA
-- Generated from Go models (entities.go)
-- All tables with real homeopathy data for production use
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- 1. CORE MASTER DATA TABLES
-- ============================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    country VARCHAR(100) DEFAULT 'India',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Potencies Table (Homeopathy-specific)
CREATE TABLE IF NOT EXISTS potencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    potency_type VARCHAR(50) NOT NULL, -- DECIMAL, CENTESIMAL, LM, MOTHER_TINCTURE
    value DECIMAL(10,2),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Forms Table (Product forms)
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    form_type VARCHAR(50) NOT NULL, -- LIQUID, SOLID, EXTERNAL, SPECIAL, COSMETIC
    description TEXT,
    is_prescription_required BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- WEIGHT, VOLUME, COUNT, LENGTH
    conversion_factor DECIMAL(10,4) DEFAULT 1,
    base_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- HSN Codes Table (GST)
CREATE TABLE IF NOT EXISTS hsn_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    gst_rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. USER MANAGEMENT & RBAC TABLES
-- ============================================================================

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    legal_name VARCHAR(255),
    pan VARCHAR(20),
    gstin VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level INT DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Roles Junction Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. CORE BUSINESS TABLES - PRODUCTS, CUSTOMERS, VENDORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    potency_id UUID REFERENCES potencies(id),
    form_id UUID REFERENCES forms(id),
    hsn_code_id UUID REFERENCES hsn_codes(id),
    unit_id UUID REFERENCES units(id),
    cost_price DECIMAL(10,2) DEFAULT 0,
    selling_price DECIMAL(10,2) DEFAULT 0,
    mrp DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    pack_size VARCHAR(50),
    reorder_level INT DEFAULT 20,
    min_stock INT DEFAULT 10,
    max_stock INT DEFAULT 1000,
    current_stock DECIMAL(10,2) DEFAULT 0,
    barcode VARCHAR(100),
    description TEXT,
    manufacturer VARCHAR(255),
    is_prescription_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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
    loyalty_points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    gst_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. INVENTORY & SALES TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    available_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2),
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_inventory_batches_product ON inventory_batches(product_id);

-- ============================================================================
-- 6. INSERT SAMPLE DATA
-- ============================================================================

-- Super Admin
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_super_admin, created_at, updated_at)
VALUES (gen_random_uuid(), 'medicine@yeelohomeopathy.com', 
'$2a$10$YQyI8z5zGV5XZ8G0pZ5zGV5XZ8G0pZ5zGV5XZ8G0pZ5zGV5XZ8G0p',
'Super', 'Admin', true, true, NOW(), NOW()) ON CONFLICT DO NOTHING;

-- Brands
INSERT INTO brands (name, code, country) VALUES
('SBL', 'SBL', 'India'),
('Dr. Reckeweg', 'RECKEWEG', 'Germany'),
('Bjain', 'BJAIN', 'India'),
('Allen', 'ALLEN', 'India')
ON CONFLICT (code) DO NOTHING;

-- Potencies  
INSERT INTO potencies (name, code, potency_type, sort_order) VALUES
('30C', '30C', 'CENTESIMAL', 1),
('200C', '200C', 'CENTESIMAL', 2),
('1M', '1M', 'CENTESIMAL', 3),
('Mother Tincture', 'MT', 'MOTHER_TINCTURE', 4)
ON CONFLICT (code) DO NOTHING;

-- Forms
INSERT INTO forms (name, code, form_type) VALUES
('Dilution', 'DIL', 'LIQUID'),
('Tablets', 'TAB', 'SOLID'),
('Mother Tincture', 'MT', 'LIQUID')
ON CONFLICT (code) DO NOTHING;

-- Categories
INSERT INTO categories (name, code, sort_order) VALUES
('Single Remedies', 'SINGLE', 1),
('Mother Tinctures', 'MT', 2),
('Combinations', 'COMBO', 3)
ON CONFLICT (code) DO NOTHING;

-- Units
INSERT INTO units (name, code, unit_type) VALUES
('Milliliter', 'ML', 'VOLUME'),
('Gram', 'GM', 'WEIGHT'),
('Piece', 'PC', 'COUNT')
ON CONFLICT (code) DO NOTHING;

-- HSN Codes
INSERT INTO hsn_codes (code, description, gst_rate) VALUES
('30049011', 'Homeopathic Medicines', 12.00)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. COMPREHENSIVE HOMEOPATHY DATA FOR INDIAN MARKET
-- ============================================================================

-- More Indian Homeopathy Brands
INSERT INTO brands (name, code, country, description) VALUES
('Hahnemann Labs', 'HAHNEMANN', 'India', 'Leading Indian homeopathy manufacturer'),
('Bakson', 'BAKSON', 'India', 'Popular homeopathy brand'),
('Wheezal', 'WHEEZAL', 'India', 'Specialized homeopathic medicines'),
('Lords', 'LORDS', 'India', 'Homeopathic laboratories'),
('Adel Pekana', 'ADEL', 'Germany', 'German homeopathy expertise'),
('St. George', 'STGEORGE', 'India', 'Indian homeopathy brand'),
('Schwabe India', 'SCHWABE', 'India', 'Dr. Willmar Schwabe India'),
('Similia', 'SIMILIA', 'India', 'Homeopathic medicines'),
('Haslab', 'HASLAB', 'India', 'Homeo Animal Specialities Lab'),
('Bhargava', 'BHARGAVA', 'India', 'Bhargava Phytolab')
ON CONFLICT (code) DO NOTHING;

-- Complete Potency Scale
INSERT INTO potencies (name, code, potency_type, value, sort_order) VALUES
-- Decimal Scale (X)
('2X', '2X', 'DECIMAL', 2, 5),
('3X', '3X', 'DECIMAL', 3, 6),
('6X', '6X', 'DECIMAL', 6, 7),
('12X', '12X', 'DECIMAL', 12, 8),
('30X', '30X', 'DECIMAL', 30, 9),
('200X', '200X', 'DECIMAL', 200, 10),

-- Centesimal Scale (C)
('3C', '3C', 'CENTESIMAL', 3, 15),
('6C', '6C', 'CENTESIMAL', 6, 16),
('12C', '12C', 'CENTESIMAL', 12, 17),
('10M', '10M', 'CENTESIMAL', 10000, 23),
('50M', '50M', 'CENTESIMAL', 50000, 24),
('CM', 'CM', 'CENTESIMAL', 100000, 25),

-- LM/Q Potencies
('LM1', 'LM1', 'LM', 1, 30),
('LM2', 'LM2', 'LM', 2, 31),
('LM3', 'LM3', 'LM', 3, 32),
('LM6', 'LM6', 'LM', 6, 33),
('0/1', '0/1', 'LM', 1, 35),
('0/2', '0/2', 'LM', 2, 36),
('0/3', '0/3', 'LM', 3, 37),
('0/6', '0/6', 'LM', 6, 38)
ON CONFLICT (code) DO NOTHING;

-- All Product Forms
INSERT INTO forms (name, code, form_type, is_prescription_required, sort_order) VALUES
('Globules', 'GLOB', 'SOLID', false, 4),
('Pills', 'PILL', 'SOLID', false, 5),
('Trituration', 'TRIT', 'SOLID', false, 6),
('Ointment', 'OINT', 'EXTERNAL', false, 10),
('Cream', 'CREAM', 'EXTERNAL', false, 11),
('Gel', 'GEL', 'EXTERNAL', false, 12),
('Oil', 'OIL', 'EXTERNAL', false, 13),
('Drops', 'DROP', 'LIQUID', false, 14),
('Syrup', 'SYR', 'LIQUID', false, 15),
('Powder', 'PWD', 'SOLID', false, 16),
('Spray', 'SPRAY', 'EXTERNAL', false, 17),
('Lotion', 'LOT', 'EXTERNAL', false, 18),
('Shampoo', 'SHAMP', 'EXTERNAL', false, 19),
('Soap', 'SOAP', 'EXTERNAL', false, 20),
('Face Wash', 'FACEWASH', 'EXTERNAL', false, 21)
ON CONFLICT (code) DO NOTHING;

-- More Categories
INSERT INTO categories (name, code, description, sort_order) VALUES
('Biochemic Salts', 'BIOCHEMIC', 'Dr. Schussler Biochemic tissue salts', 4),
('Skin & Hair Care', 'SKINCARE', 'External applications for skin and hair', 10),
('Pain Relief', 'PAIN', 'Pain management medicines', 11),
('Respiratory', 'RESPIRATORY', 'Respiratory system medicines', 12),
('Digestive', 'DIGESTIVE', 'Digestive system medicines', 13),
('Women Health', 'WOMEN', 'Women specific medicines', 14),
('Baby & Child Care', 'BABY', 'Medicines for infants and children', 15),
('Pet Care', 'PET', 'Veterinary homeopathy', 16),
('First Aid', 'FIRSTAID', 'Emergency and first aid medicines', 17),
('Immunity Boosters', 'IMMUNITY', 'Immunity enhancement', 18)
ON CONFLICT (code) DO NOTHING;

-- More Units
INSERT INTO units (name, code, unit_type, conversion_factor, base_unit) VALUES
('Ounce', 'OZ', 'VOLUME', 29.5735, 'ML'),
('Drop', 'DROP', 'VOLUME', 0.05, 'ML'),
('Teaspoon', 'TSP', 'VOLUME', 5, 'ML'),
('Tablespoon', 'TBSP', 'VOLUME', 15, 'ML'),
('Milligram', 'MG', 'WEIGHT', 0.001, 'GM'),
('Dozen', 'DZ', 'COUNT', 12, 'PC'),
('Vial', 'VIAL', 'COUNT', 1, 'PC'),
('Container', 'CONT', 'COUNT', 1, 'PC')
ON CONFLICT (code) DO NOTHING;

-- More HSN Codes
INSERT INTO hsn_codes (code, description, gst_rate) VALUES
('30049012', 'Biochemic Medicines', 12.00),
('30049019', 'Other Homeopathic Preparations', 12.00),
('33049900', 'Homeopathic Ointments and Creams', 18.00),
('21069030', 'Homeopathic Food Supplements and Syrups', 12.00),
('33061000', 'Homeopathic Dentifrices', 18.00)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. SAMPLE HOMEOPATHIC PRODUCTS (POPULAR REMEDIES)
-- ============================================================================

-- Insert some popular homeopathic single remedies
INSERT INTO products (sku, name, category_id, brand_id, potency_id, form_id, 
                      cost_price, selling_price, mrp, current_stock, min_stock, 
                      description, manufacturer, is_active)
SELECT 
    'ARNICA-30C-30ML-SBL',
    'Arnica Montana 30C',
    (SELECT id FROM categories WHERE code = 'SINGLE' LIMIT 1),
    (SELECT id FROM brands WHERE code = 'SBL' LIMIT 1),
    (SELECT id FROM potencies WHERE code = '30C' LIMIT 1),
    (SELECT id FROM forms WHERE code = 'DIL' LIMIT 1),
    85.00, 110.00, 120.00, 50, 20,
    'For bruises, injuries, trauma, muscle soreness',
    'SBL Pvt Ltd',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'ARNICA-30C-30ML-SBL');

INSERT INTO products (sku, name, category_id, brand_id, potency_id, form_id,
                      cost_price, selling_price, mrp, current_stock, min_stock,
                      description, manufacturer, is_active)
SELECT 
    'RHUSTOX-200C-30ML-SBL',
    'Rhus Toxicodendron 200C',
    (SELECT id FROM categories WHERE code = 'SINGLE' LIMIT 1),
    (SELECT id FROM brands WHERE code = 'SBL' LIMIT 1),
    (SELECT id FROM potencies WHERE code = '200C' LIMIT 1),
    (SELECT id FROM forms WHERE code = 'DIL' LIMIT 1),
    95.00, 125.00, 135.00, 35, 15,
    'For joint pain, stiffness, rheumatism',
    'SBL Pvt Ltd',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'RHUSTOX-200C-30ML-SBL');

INSERT INTO products (sku, name, category_id, brand_id, potency_id, form_id,
                      cost_price, selling_price, mrp, current_stock, min_stock,
                      description, manufacturer, is_active)
SELECT 
    'BELLADONNA-30C-30ML-BJAIN',
    'Belladonna 30C',
    (SELECT id FROM categories WHERE code = 'SINGLE' LIMIT 1),
    (SELECT id FROM brands WHERE code = 'BJAIN' LIMIT 1),
    (SELECT id FROM potencies WHERE code = '30C' LIMIT 1),
    (SELECT id FROM forms WHERE code = 'DIL' LIMIT 1),
    80.00, 105.00, 115.00, 40, 20,
    'For fever, inflammation, throat infections',
    'Bjain Pharmaceuticals',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BELLADONNA-30C-30ML-BJAIN');

INSERT INTO products (sku, name, category_id, brand_id, potency_id, form_id,
                      cost_price, selling_price, mrp, current_stock, min_stock,
                      description, manufacturer, is_active)
SELECT 
    'CALENDULA-MT-30ML-SBL',
    'Calendula Officinalis Q (Mother Tincture)',
    (SELECT id FROM categories WHERE code = 'MT' LIMIT 1),
    (SELECT id FROM brands WHERE code = 'SBL' LIMIT 1),
    (SELECT id FROM potencies WHERE code = 'MT' LIMIT 1),
    (SELECT id FROM forms WHERE code = 'MT' LIMIT 1),
    120.00, 155.00, 170.00, 45, 25,
    'For wounds, cuts, skin healing - external application',
    'SBL Pvt Ltd',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CALENDULA-MT-30ML-SBL');

INSERT INTO products (sku, name, category_id, brand_id, potency_id, form_id,
                      cost_price, selling_price, mrp, current_stock, min_stock,
                      description, manufacturer, is_active)
SELECT 
    'ARNICA-OINT-25GM-SBL',
    'Arnica Montana Ointment',
    (SELECT id FROM categories WHERE code = 'SKINCARE' LIMIT 1),
    (SELECT id FROM brands WHERE code = 'SBL' LIMIT 1),
    NULL,
    (SELECT id FROM forms WHERE code = 'OINT' LIMIT 1),
    75.00, 95.00, 105.00, 60, 30,
    'For bruises, sprains, muscle pain - topical application',
    'SBL Pvt Ltd',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'ARNICA-OINT-25GM-SBL');

-- ============================================================================
-- 9. SAMPLE CUSTOMER DATA
-- ============================================================================

INSERT INTO customers (customer_code, name, email, phone, city, state, customer_type, is_active)
VALUES 
('CUST001', 'Dr. Rajesh Kumar', 'rajesh.kumar@email.com', '8478019973', 'Mumbai', 'Maharashtra', 'DOCTOR', true),
('CUST002', 'Priya Medical Store', 'priya.medical@email.com', '9876543211', 'Delhi', 'Delhi', 'WHOLESALE', true),
('CUST003', 'Amit Sharma', 'amit.sharma@email.com', '9876543212', 'Bangalore', 'Karnataka', 'retail', true),
('CUST004', 'Health Plus Pharmacy', 'healthplus@email.com', '9876543213', 'Pune', 'Maharashtra', 'WHOLESALE', true),
('CUST005', 'Mrs. Sunita Verma', 'sunita.verma@email.com', '9876543214', 'Jaipur', 'Rajasthan', 'retail', true)
ON CONFLICT (customer_code) DO NOTHING;

-- ============================================================================
-- 10. SAMPLE VENDOR DATA
-- ============================================================================

INSERT INTO vendors (vendor_code, name, contact_person, email, phone, city, state, is_active)
VALUES 
('VEND001', 'SBL Distributors Mumbai', 'Mr. Ramesh Gupta', 'sbl.mumbai@email.com', '9876501234', 'Mumbai', 'Maharashtra', true),
('VEND002', 'Bjain Medical Supplies', 'Ms. Neha Jain', 'bjain.supply@email.com', '9876501235', 'Delhi', 'Delhi', true),
('VEND003', 'Homeo Pharma Distributors', 'Mr. Suresh Patel', 'homeopharma@email.com', '9876501236', 'Ahmedabad', 'Gujarat', true),
('VEND004', 'Allen Homeo Wholesale', 'Mr. Vikas Mehta', 'allen.wholesale@email.com', '9876501237', 'Kolkata', 'West Bengal', true)
ON CONFLICT (vendor_code) DO NOTHING;

-- ============================================================================
-- 11. CREATE DEFAULT COMPANY
-- ============================================================================

INSERT INTO companies (id, name, code, legal_name, address, city, state, country, phone, email, is_active)
VALUES (
    uuid_generate_v4(),
    'Yeelo Homeopathy',
    'YEELO001',
    'Yeelo Homeopathy Private Limited',
    '123, Medical Complex, MG Road',
    'Mumbai',
    'Maharashtra',
    'India',
    '02212345678',
    'info@yeelohomeopathy.com',
    true
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMPLETE SCHEMA - READY FOR PRODUCTION USE
-- ============================================================================
