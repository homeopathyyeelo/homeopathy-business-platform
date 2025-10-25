-- =====================================================
-- HSN CODES & UNITS FOR HOMEOPATHY BUSINESS
-- October 2025 GST Update
-- =====================================================

-- Create HSN Codes Table
CREATE TABLE IF NOT EXISTS hsn_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hsn_code VARCHAR(8) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    unit_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT HSN CODES (October 2025 GST Rates)
-- =====================================================

INSERT INTO hsn_codes (hsn_code, description, gst_rate, category, is_active) VALUES
-- Homeopathy Medicines (Main Category)
('3003', 'Medicaments (Homeopathic preparations)', 12.00, 'Medicines', true),
('3004', 'Medicaments (Homeopathic medicines in dosage form)', 12.00, 'Medicines', true),

-- Specific Homeopathy Products
('30049011', 'Ayurvedic, Unani, Siddha or Homeopathic medicines', 12.00, 'Medicines', true),
('30049099', 'Other medicaments (Homeopathy)', 12.00, 'Medicines', true),

-- Mother Tinctures & Dilutions
('3003', 'Mother Tinctures (Q)', 12.00, 'Mother Tincture', true),
('3004', 'Dilutions (Potentized medicines)', 12.00, 'Dilutions', true),

-- Biochemic & Tablets
('3004', 'Biochemic Tablets', 12.00, 'Biochemic', true),
('3004', 'Homeopathic Tablets', 12.00, 'Tablets', true),

-- External Applications
('3003', 'Homeopathic Ointments', 12.00, 'Ointment', true),
('3004', 'Homeopathic Creams', 12.00, 'Cream', true),
('3304', 'Homeopathic Gels', 18.00, 'Gel', true),
('3003', 'Homeopathic Oils', 12.00, 'Oil', true),

-- Drops
('3004', 'Eye Drops (Homeopathic)', 12.00, 'Eye Drops', true),
('3004', 'Ear Drops (Homeopathic)', 12.00, 'Ear Drops', true),
('3004', 'Nasal Drops (Homeopathic)', 12.00, 'Nasal Drops', true),

-- Cosmetics & Personal Care
('3304', 'Homeopathic Shampoo', 18.00, 'Shampoo', true),
('3304', 'Homeopathic Toothpaste', 18.00, 'Toothpaste', true),
('3304', 'Homeopathic Soap', 18.00, 'Soap', true),
('3304', 'Homeopathic Face Wash', 18.00, 'Face Wash', true),
('3304', 'Homeopathic Hair Oil', 18.00, 'Hair Oil', true),
('3304', 'Homeopathic Lotion', 18.00, 'Lotion', true),

-- Syrups & Tonics
('3004', 'Homeopathic Syrups', 12.00, 'Syrup', true),
('3004', 'Homeopathic Tonics', 12.00, 'Tonic', true),

-- Kits & Combinations
('3004', 'Homeopathy Medicine Kits', 12.00, 'Kit', true),
('3004', 'Bio Combination', 12.00, 'Bio Combination', true),

-- Bach Flower
('3004', 'Bach Flower Remedies', 12.00, 'Bach Flower', true),

-- Triturations & Powders
('3004', 'Triturations (Powder form)', 12.00, 'Trituration', true),
('3004', 'Homeopathic Powders', 12.00, 'Powder', true),

-- Additional Categories
('3004', 'Globules (Sugar pills)', 12.00, 'Globules', true),
('3004', 'LM Potency', 12.00, 'LM Potency', true),
('3304', 'Vaporizer Products', 18.00, 'Vaporizer', true)

ON CONFLICT (hsn_code) DO UPDATE SET
    description = EXCLUDED.description,
    gst_rate = EXCLUDED.gst_rate,
    category = EXCLUDED.category,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- INSERT UNITS OF MEASUREMENT
-- =====================================================

INSERT INTO units (name, code, description, unit_type, is_active) VALUES
-- Volume Units (Liquid)
('Milliliter', 'ml', 'Milliliter - Liquid volume', 'Volume', true),
('Liter', 'L', 'Liter - Liquid volume', 'Volume', true),
('Fluid Ounce', 'fl oz', 'Fluid ounce - Liquid volume', 'Volume', true),

-- Weight Units (Solid)
('Gram', 'g', 'Gram - Weight', 'Weight', true),
('Kilogram', 'kg', 'Kilogram - Weight', 'Weight', true),
('Milligram', 'mg', 'Milligram - Weight', 'Weight', true),
('Ounce', 'oz', 'Ounce - Weight', 'Weight', true),

-- Count Units (Packaging)
('Piece', 'pcs', 'Piece - Individual item', 'Count', true),
('Bottle', 'btl', 'Bottle - Container', 'Count', true),
('Box', 'box', 'Box - Package', 'Count', true),
('Strip', 'strip', 'Strip - Tablet strip', 'Count', true),
('Tube', 'tube', 'Tube - Ointment/Cream tube', 'Count', true),
('Jar', 'jar', 'Jar - Container', 'Count', true),
('Packet', 'pkt', 'Packet - Package', 'Count', true),
('Vial', 'vial', 'Vial - Small bottle', 'Count', true),
('Ampoule', 'amp', 'Ampoule - Sealed vial', 'Count', true),
('Sachet', 'sachet', 'Sachet - Small packet', 'Count', true),

-- Homeopathy Specific Units
('Drops', 'drops', 'Drops - Liquid drops', 'Volume', true),
('Dram', 'dram', 'Dram - Homeopathy volume (3.7ml)', 'Volume', true),
('Globules', 'glob', 'Globules - Sugar pills', 'Count', true),
('Tablets', 'tab', 'Tablets - Solid dosage', 'Count', true),
('Capsules', 'cap', 'Capsules - Encapsulated', 'Count', true),

-- Bulk Units
('Dozen', 'doz', 'Dozen - 12 pieces', 'Count', true),
('Carton', 'ctn', 'Carton - Large package', 'Count', true),
('Case', 'case', 'Case - Multiple units', 'Count', true)

ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    unit_type = EXCLUDED.unit_type,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count records
SELECT 'HSN Codes' as type, COUNT(*) as count FROM hsn_codes
UNION ALL
SELECT 'Units', COUNT(*) FROM units;

-- Show all HSN codes
SELECT hsn_code, description, gst_rate, category 
FROM hsn_codes 
ORDER BY hsn_code;

-- Show all units
SELECT name, code, unit_type 
FROM units 
ORDER BY unit_type, name;

-- HSN codes by GST rate
SELECT gst_rate, COUNT(*) as count 
FROM hsn_codes 
GROUP BY gst_rate 
ORDER BY gst_rate;

-- Units by type
SELECT unit_type, COUNT(*) as count 
FROM units 
GROUP BY unit_type 
ORDER BY unit_type;

-- =====================================================
-- SUMMARY
-- =====================================================
-- HSN Codes: 30+ (October 2025 GST rates)
-- Units: 25+ (Volume, Weight, Count types)
-- GST Rates: 12% (medicines), 18% (cosmetics)
-- =====================================================
