-- Create Master Data Tables for Homeopathy ERP
-- Run this to create categories, brands, potencies, and forms tables

-- Drop tables if they exist (be careful in production!)
DROP TABLE IF EXISTS potencies CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Potencies Table
CREATE TABLE IF NOT EXISTS potencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (id, name, code, description) VALUES
    ('cat-001', 'Dilutions', 'DIL', 'Homeopathic dilutions'),
    ('cat-002', 'Mother Tinctures', 'MT', 'Mother tincture preparations'),
    ('cat-003', 'Biochemic', 'BIOC', 'Biochemic medicines'),
    ('cat-004', 'Ointments', 'OINT', 'External application ointments'),
    ('cat-005', 'Drops', 'DROP', 'Liquid drops')
ON CONFLICT (name) DO NOTHING;

-- Insert default brands
INSERT INTO brands (id, name, code, description) VALUES
    ('brand-001', 'SBL', 'SBL', 'SBL Pvt Ltd'),
    ('brand-002', 'Dr. Reckeweg', 'RECK', 'Dr. Reckeweg & Co'),
    ('brand-003', 'Allen', 'ALLEN', 'Allen Homoeo & Herbals'),
    ('brand-004', 'Schwabe', 'SCHW', 'Willmar Schwabe India'),
    ('brand-005', 'Bakson', 'BAKS', 'Bakson Drugs & Pharmaceuticals')
ON CONFLICT (name) DO NOTHING;

-- Insert common potencies
INSERT INTO potencies (id, name, code, description) VALUES
    ('pot-001', '3X', '3X', 'Decimal potency 3X'),
    ('pot-002', '6X', '6X', 'Decimal potency 6X'),
    ('pot-003', '12X', '12X', 'Decimal potency 12X'),
    ('pot-004', '30X', '30X', 'Decimal potency 30X'),
    ('pot-005', '6C', '6C', 'Centesimal potency 6C'),
    ('pot-006', '30C', '30C', 'Centesimal potency 30C'),
    ('pot-007', '200C', '200C', 'Centesimal potency 200C'),
    ('pot-008', '1M', '1M', 'Millesimal potency 1M'),
    ('pot-009', '10M', '10M', 'Millesimal potency 10M'),
    ('pot-010', '50M', '50M', 'Millesimal potency 50M'),
    ('pot-011', 'CM', 'CM', 'Centesimal Millesimal'),
    ('pot-012', 'Q', 'Q', 'Q potency (LM)'),
    ('pot-013', 'Mother Tincture', 'MT', 'Mother Tincture (Ø)')
ON CONFLICT (name) DO NOTHING;

-- Insert common forms
INSERT INTO forms (id, name, code, description) VALUES
    ('form-001', 'Liquid', 'LIQ', 'Liquid form'),
    ('form-002', 'Globules', 'GLOB', 'Sugar globules'),
    ('form-003', 'Tablets', 'TAB', 'Tablet form'),
    ('form-004', 'Drops', 'DROP', 'Liquid drops'),
    ('form-005', 'Ointment', 'OINT', 'External ointment'),
    ('form-006', 'Cream', 'CREAM', 'Topical cream'),
    ('form-007', 'Gel', 'GEL', 'Gel form'),
    ('form-008', 'Syrup', 'SYR', 'Syrup form')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_code ON brands(code);
CREATE INDEX IF NOT EXISTS idx_potencies_name ON potencies(name);
CREATE INDEX IF NOT EXISTS idx_potencies_code ON potencies(code);
CREATE INDEX IF NOT EXISTS idx_forms_name ON forms(name);
CREATE INDEX IF NOT EXISTS idx_forms_code ON forms(code);

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON categories TO your_user;
-- GRANT ALL PRIVILEGES ON brands TO your_user;
-- GRANT ALL PRIVILEGES ON potencies TO your_user;
-- GRANT ALL PRIVILEGES ON forms TO your_user;

-- Display summary
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;

-- Success message
SELECT '✅ Master tables created successfully!' as status;
