-- ============================================================================
-- UNIFIED SCHEMA MIGRATION - Align Database with Go Entities
-- This migration updates the database schema to match the unified Go entities exactly
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. MASTER DATA TABLES (with proper UUID foreign keys)
-- ============================================================================

-- Categories Table (updated to match unified Category entity)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing categories to have codes and UUIDs
UPDATE categories SET code = UPPER(REPLACE(name, ' ', '_')) WHERE code IS NULL;
UPDATE categories SET id = uuid_generate_v4() WHERE id IS NULL;

-- Make id UUID primary key and drop SERIAL if exists
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE categories ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Brands Table (updated to match unified Brand entity)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE brands ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing brands to have codes and UUIDs
UPDATE brands SET code = UPPER(REPLACE(name, ' ', '_')) WHERE code IS NULL;
UPDATE brands SET id = uuid_generate_v4() WHERE id IS NULL;

-- Make id UUID primary key
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_pkey;
ALTER TABLE brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
ALTER TABLE brands ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Potencies Table (create new to match unified Potency entity)
CREATE TABLE IF NOT EXISTS potencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    potency_type VARCHAR(50) NOT NULL DEFAULT 'CENTESIMAL',
    value DECIMAL(10,2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms Table (create new to match unified Form entity)
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    form_type VARCHAR(50) NOT NULL DEFAULT 'LIQUID',
    description TEXT,
    is_prescription_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units Table (create new to match unified Unit entity)
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    unit_type VARCHAR(50) NOT NULL DEFAULT 'COUNT',
    conversion_factor DECIMAL(10,4) DEFAULT 1,
    base_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HSN Codes Table (create new to match unified HSNCode entity)
CREATE TABLE IF NOT EXISTS hsn_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    gst_rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. UPDATE PRODUCTS TABLE (add missing foreign key columns)
-- ============================================================================

-- Add missing foreign key columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS potency_id UUID REFERENCES potencies(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES forms(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code_id UUID REFERENCES hsn_codes(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_prescription_required BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT;

-- Convert existing VARCHAR references to UUID foreign keys
UPDATE products SET category_id = c.id FROM categories c WHERE products.category = c.name;
UPDATE products SET brand_id = b.id FROM brands b WHERE products.brand = b.name;
UPDATE products SET potency_id = p.id FROM potencies p WHERE products.potency = p.code;
UPDATE products SET form_id = f.id FROM forms f WHERE products.form = f.name;

-- ============================================================================
-- 3. ADDITIONAL MASTER DATA TABLES (create new)
-- ============================================================================

-- Customer Groups Table
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Lists Table
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Price List Items Table
CREATE TABLE IF NOT EXISTS product_price_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id),
    product_id UUID NOT NULL REFERENCES products(id),
    selling_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Racks Table (warehouse locations)
CREATE TABLE IF NOT EXISTS racks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    rack_type VARCHAR(50) DEFAULT 'STORAGE',
    capacity DECIMAL(10,2),
    unit VARCHAR(50) DEFAULT 'PIECES',
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. AI AND ANALYTICS TABLES
-- ============================================================================

-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(255),
    api_key_encrypted TEXT,
    base_url VARCHAR(500),
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    model_id UUID NOT NULL REFERENCES ai_models(id),
    conversation_type VARCHAR(50),
    title VARCHAR(255),
    messages JSONB,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. EVENT SOURCING TABLES (Outbox Pattern)
-- ============================================================================

-- Outbox Events Table
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT
);

-- Event Subscriptions Table
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_name VARCHAR(255) UNIQUE NOT NULL,
    event_types TEXT[],
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. USER MANAGEMENT TABLES (RBAC)
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
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (updated for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    display_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. ADDITIONAL BUSINESS TABLES
-- ============================================================================

-- Product Import Jobs Table
CREATE TABLE IF NOT EXISTS product_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    error_log TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bug Reports Table
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    steps_to_reproduce TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    severity VARCHAR(50),
    priority VARCHAR(50),
    status VARCHAR(50) DEFAULT 'OPEN',
    environment VARCHAR(100),
    browser VARCHAR(100),
    os VARCHAR(100),
    user_agent TEXT,
    url VARCHAR(500),
    user_id UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    comments TEXT,
    resolution TEXT,
    resolution_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS Sessions Table
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_number VARCHAR(100) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES users(id),
    shop_id UUID NOT NULL REFERENCES companies(id),
    open_time TIMESTAMPTZ DEFAULT NOW(),
    close_time TIMESTAMPTZ,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    closing_balance DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    total_sales DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. INSERT DEFAULT MASTER DATA
-- ============================================================================

-- Insert default units
INSERT INTO units (name, code, unit_type, conversion_factor) VALUES
('Milliliters', 'ML', 'VOLUME', 1),
('Liters', 'L', 'VOLUME', 1000),
('Grams', 'GM', 'WEIGHT', 1),
('Kilograms', 'KG', 'WEIGHT', 1000),
('Pieces', 'PCS', 'COUNT', 1),
('Tablets', 'TABS', 'COUNT', 1),
('Capsules', 'CAPS', 'COUNT', 1),
('Bottles', 'BOTTLES', 'COUNT', 1),
('Vials', 'VIALS', 'COUNT', 1),
('Tubes', 'TUBES', 'COUNT', 1),
('Strips', 'STRIPS', 'COUNT', 1)
ON CONFLICT (code) DO NOTHING;

-- Insert default HSN codes
INSERT INTO hsn_codes (code, description, gst_rate) VALUES
('30049011', 'Homeopathic medicines', 12.00),
('30049012', 'Cosmetics and toiletries', 18.00),
('30049013', 'Medical devices', 12.00),
('30049014', 'Dietary supplements', 18.00)
ON CONFLICT (code) DO NOTHING;

-- Insert default potencies
INSERT INTO potencies (name, code, potency_type, sort_order) VALUES
('2X', '2X', 'DECIMAL', 1),
('3X', '3X', 'DECIMAL', 2),
('6X', '6X', 'DECIMAL', 3),
('12X', '12X', 'DECIMAL', 4),
('30X', '30X', 'DECIMAL', 5),
('2CH', '2CH', 'CENTESIMAL', 6),
('3CH', '3CH', 'CENTESIMAL', 7),
('6CH', '6CH', 'CENTESIMAL', 8),
('12CH', '12CH', 'CENTESIMAL', 9),
('30CH', '30CH', 'CENTESIMAL', 10),
('200CH', '200CH', 'CENTESIMAL', 11),
('1M', '1M', 'CENTESIMAL', 12),
('10M', '10M', 'CENTESIMAL', 13),
('50M', '50M', 'CENTESIMAL', 14),
('CM', 'CM', 'CENTESIMAL', 15),
('Q', 'Q', 'MOTHER_TINCTURE', 16),
('LM1', 'LM1', 'LM', 17),
('LM2', 'LM2', 'LM', 18),
('LM3', 'LM3', 'LM', 19)
ON CONFLICT (code) DO NOTHING;

-- Insert default forms
INSERT INTO forms (name, code, form_type, sort_order) VALUES
('Liquid Dilution', 'LIQUID_DILUTION', 'LIQUID', 1),
('Mother Tincture', 'MOTHER_TINCTURE', 'LIQUID', 2),
('Globules', 'GLOBULES', 'SOLID', 3),
('Tablets', 'TABLETS', 'SOLID', 4),
('Powder', 'POWDER', 'SOLID', 5),
('Drops', 'DROPS', 'LIQUID', 6),
('Ointment', 'OINTMENT', 'EXTERNAL', 7),
('Gel', 'GEL', 'EXTERNAL', 8),
('Oil', 'OIL', 'EXTERNAL', 9),
('Spray', 'SPRAY', 'EXTERNAL', 10),
('Syrup', 'SYRUP', 'LIQUID', 11),
('Cream', 'CREAM', 'EXTERNAL', 12)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_potency_id ON products(potency_id);
CREATE INDEX IF NOT EXISTS idx_products_form_id ON products(form_id);
CREATE INDEX IF NOT EXISTS idx_products_hsn_code_id ON products(hsn_code_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);

-- Master data indexes
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
CREATE INDEX IF NOT EXISTS idx_brands_code ON brands(code);
CREATE INDEX IF NOT EXISTS idx_potencies_code ON potencies(code);
CREATE INDEX IF NOT EXISTS idx_forms_code ON forms(code);
CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);
CREATE INDEX IF NOT EXISTS idx_hsn_codes_code ON hsn_codes(code);

-- ============================================================================
-- 10. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_potencies_updated_at BEFORE UPDATE ON potencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hsn_codes_updated_at BEFORE UPDATE ON hsn_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_groups_updated_at BEFORE UPDATE ON customer_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON price_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_price_list_items_updated_at BEFORE UPDATE ON product_price_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_racks_updated_at BEFORE UPDATE ON racks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outbox_events_updated_at BEFORE UPDATE ON outbox_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_subscriptions_updated_at BEFORE UPDATE ON event_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_imports_updated_at BEFORE UPDATE ON product_imports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON bug_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_sessions_updated_at BEFORE UPDATE ON pos_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ADD TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE categories IS 'Product categories (matches unified Category entity)';
COMMENT ON TABLE brands IS 'Product brands (matches unified Brand entity)';
COMMENT ON TABLE potencies IS 'Homeopathy potencies (matches unified Potency entity)';
COMMENT ON TABLE forms IS 'Product forms (matches unified Form entity)';
COMMENT ON TABLE units IS 'Units of measurement (matches unified Unit entity)';
COMMENT ON TABLE hsn_codes IS 'GST HSN codes (matches unified HSNCode entity)';
COMMENT ON TABLE products IS 'Core products catalog (updated with UUID foreign keys)';
COMMENT ON TABLE customer_groups IS 'Customer groups for pricing (matches unified CustomerGroup entity)';
COMMENT ON TABLE price_lists IS 'Price lists for multi-tier pricing (matches unified PriceList entity)';
COMMENT ON TABLE racks IS 'Warehouse rack locations (matches unified Rack entity)';
COMMENT ON TABLE ai_models IS 'AI model configurations (matches unified AIModel entity)';
COMMENT ON TABLE outbox_events IS 'Event sourcing outbox (matches unified OutboxEvent entity)';
COMMENT ON TABLE companies IS 'Multi-company support (matches unified Company entity)';
COMMENT ON TABLE users IS 'User authentication (matches unified User entity)';
COMMENT ON TABLE product_imports IS 'Product import job tracking (matches unified ProductImport entity)';
COMMENT ON TABLE bug_reports IS 'Bug tracking system (matches unified BugReport entity)';
