-- Create Additional Master Tables for HomeoERP
-- Subcategories, Units, HSN Codes, and other missing tables

-- ============================================
-- SUBCATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

-- ============================================
-- UNITS TABLE (Measurement Units)
-- ============================================
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    unit_type VARCHAR(50), -- weight, volume, quantity, length
    base_unit VARCHAR(50), -- For conversion (e.g., ml for volume)
    conversion_factor DECIMAL(10, 4) DEFAULT 1.0, -- Conversion to base unit
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- HSN CODES TABLE (GST/Tax Codes)
-- ============================================
CREATE TABLE IF NOT EXISTS hsn_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    gst_rate DECIMAL(5, 2) DEFAULT 0, -- GST percentage
    cgst_rate DECIMAL(5, 2) DEFAULT 0,
    sgst_rate DECIMAL(5, 2) DEFAULT 0,
    igst_rate DECIMAL(5, 2) DEFAULT 0,
    cess_rate DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- RACKS/LOCATIONS TABLE (Storage Locations)
-- ============================================
CREATE TABLE IF NOT EXISTS racks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    location VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VENDORS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOMER GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRICE LISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    price_type VARCHAR(50), -- retail, wholesale, distributor, doctor
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_units_type ON units(unit_type);
CREATE INDEX IF NOT EXISTS idx_hsn_codes_code ON hsn_codes(hsn_code);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_racks_active ON racks(is_active);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hsn_codes_updated_at BEFORE UPDATE ON hsn_codes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_racks_updated_at BEFORE UPDATE ON racks 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_groups_updated_at BEFORE UPDATE ON customer_groups 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON price_lists 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT '✅ Additional tables created successfully!' as status;
