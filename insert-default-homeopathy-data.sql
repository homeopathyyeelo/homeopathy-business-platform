-- Insert Default Homeopathy Business Data
-- This includes subcategories, units, HSN codes, vendors, customer groups, price lists, racks

-- ============================================
-- SUBCATEGORIES (organized by category)
-- ============================================

-- Get category IDs for reference
DO $$
DECLARE
    cat_dilutions UUID;
    cat_mt UUID;
    cat_biochemic UUID;
    cat_medicines UUID;
BEGIN
    SELECT id INTO cat_dilutions FROM categories WHERE code = 'DIL' LIMIT 1;
    SELECT id INTO cat_mt FROM categories WHERE code = 'MT' LIMIT 1;
    SELECT id INTO cat_biochemic FROM categories WHERE code = 'BIOC' LIMIT 1;
    SELECT id INTO cat_medicines FROM categories WHERE code = 'MED' LIMIT 1;

    -- Subcategories for Dilutions
    IF cat_dilutions IS NOT NULL THEN
        INSERT INTO subcategories (category_id, name, code, description) VALUES
        (cat_dilutions, 'Single Remedies', 'SINGLE', 'Single homeopathic remedies'),
        (cat_dilutions, 'Combination Remedies', 'COMBO', 'Combination of multiple remedies'),
        (cat_dilutions, 'Constitutional Remedies', 'CONST', 'Constitutional treatment remedies')
        ON CONFLICT (category_id, name) DO NOTHING;
    END IF;

    -- Subcategories for Mother Tinctures
    IF cat_mt IS NOT NULL THEN
        INSERT INTO subcategories (category_id, name, code, description) VALUES
        (cat_mt, 'Herbal Tinctures', 'HERB', 'Plant-based mother tinctures'),
        (cat_mt, 'Mineral Tinctures', 'MIN', 'Mineral-based mother tinctures'),
        (cat_mt, 'Animal Tinctures', 'ANIM', 'Animal-based mother tinctures')
        ON CONFLICT (category_id, name) DO NOTHING;
    END IF;

    -- Subcategories for Biochemic
    IF cat_biochemic IS NOT NULL THEN
        INSERT INTO subcategories (category_id, name, code, description) VALUES
        (cat_biochemic, 'Tissue Salts', 'TISSUE', '12 tissue salts'),
        (cat_biochemic, 'Bio Combinations', 'BIOCOMB', 'Combination of tissue salts')
        ON CONFLICT (category_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- UNITS (Measurement Units for Homeopathy)
-- ============================================
INSERT INTO units (name, code, unit_type, base_unit, conversion_factor, description) VALUES
-- Volume Units
('Milliliter', 'ml', 'volume', 'ml', 1.0, 'Milliliter - base volume unit'),
('Liter', 'L', 'volume', 'ml', 1000.0, 'Liter'),
('Dram', 'dr', 'volume', 'ml', 3.7, 'Dram (homeopathy bottle size)'),
('Ounce', 'oz', 'volume', 'ml', 30.0, 'Fluid ounce'),

-- Weight Units
('Gram', 'gm', 'weight', 'gm', 1.0, 'Gram - base weight unit'),
('Kilogram', 'kg', 'weight', 'gm', 1000.0, 'Kilogram'),
('Milligram', 'mg', 'weight', 'gm', 0.001, 'Milligram'),

-- Quantity Units
('Piece', 'pcs', 'quantity', 'pcs', 1.0, 'Individual pieces'),
('Bottle', 'btl', 'quantity', 'pcs', 1.0, 'Bottle'),
('Vial', 'vial', 'quantity', 'pcs', 1.0, 'Vial'),
('Tube', 'tube', 'quantity', 'pcs', 1.0, 'Tube (for ointments)'),
('Box', 'box', 'quantity', 'pcs', 1.0, 'Box/Carton'),
('Strip', 'strip', 'quantity', 'pcs', 1.0, 'Strip (for tablets)'),
('Packet', 'pkt', 'quantity', 'pcs', 1.0, 'Packet'),
('Jar', 'jar', 'quantity', 'pcs', 1.0, 'Jar'),
('Container', 'cont', 'quantity', 'pcs', 1.0, 'Container')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- HSN CODES (for Homeopathy Products)
-- ============================================
INSERT INTO hsn_codes (hsn_code, description, gst_rate, cgst_rate, sgst_rate, igst_rate) VALUES
('30049011', 'Homeopathic Medicines - Dilutions', 12.0, 6.0, 6.0, 12.0),
('30049012', 'Homeopathic Medicines - Mother Tinctures', 12.0, 6.0, 6.0, 12.0),
('30049013', 'Homeopathic Medicines - Biochemic', 12.0, 6.0, 6.0, 12.0),
('30049014', 'Homeopathic Medicines - Triturations', 12.0, 6.0, 6.0, 12.0),
('30049015', 'Homeopathic Medicines - Ointments', 12.0, 6.0, 6.0, 12.0),
('30049016', 'Homeopathic Medicines - Bio Combinations', 12.0, 6.0, 6.0, 12.0),
('30049019', 'Other Homeopathic Medicines', 12.0, 6.0, 6.0, 12.0),
('33049900', 'Cosmetic Products', 18.0, 9.0, 9.0, 18.0)
ON CONFLICT (hsn_code) DO NOTHING;

-- ============================================
-- VENDORS (Common Homeopathy Suppliers)
-- ============================================
INSERT INTO vendors (name, code, contact_person, phone, email, city, state, payment_terms, credit_days) VALUES
('SBL Pvt Ltd', 'SBL-V', 'Sales Manager', '011-45678900', 'sales@sbl.co.in', 'Delhi', 'Delhi', 'Net 30', 30),
('Dr. Reckeweg & Co', 'RECK-V', 'Distribution Head', '011-45678901', 'sales@reckeweg.in', 'Delhi', 'Delhi', 'Net 30', 30),
('Willmar Schwabe India', 'SCHW-V', 'Sales Head', '011-45678902', 'info@schwabeindia.com', 'Noida', 'Uttar Pradesh', 'Net 30', 30),
('BJain Publishers', 'BJAIN-V', 'Sales Team', '011-45678903', 'sales@bjainbooks.com', 'Delhi', 'Delhi', 'Net 15', 15),
('Bakson Drugs', 'BAK-V', 'Distribution', '011-45678904', 'sales@bakson.com', 'Delhi', 'Delhi', 'Net 30', 30),
('Allen Homeopathy', 'ALLEN-V', 'Sales Manager', '0141-2345678', 'sales@allenlab.com', 'Jaipur', 'Rajasthan', 'Net 30', 30),
('Hahnemann Labs', 'HAHN-V', 'Sales Team', '022-12345678', 'info@hahnemannlabs.com', 'Mumbai', 'Maharashtra', 'Net 30', 30)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- CUSTOMER GROUPS
-- ============================================
INSERT INTO customer_groups (name, code, discount_percentage, description) VALUES
('Retail Customers', 'RETAIL', 0, 'Walk-in retail customers'),
('Wholesale Customers', 'WHOLESALE', 15, 'Wholesale buyers - 15% discount'),
('Distributors', 'DIST', 25, 'Distributors - 25% discount'),
('Doctors', 'DOCTOR', 20, 'Homeopathy doctors - 20% discount'),
('Clinics', 'CLINIC', 18, 'Homeopathy clinics - 18% discount'),
('VIP Customers', 'VIP', 10, 'VIP/Premium customers - 10% discount')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PRICE LISTS
-- ============================================
INSERT INTO price_lists (name, code, price_type, discount_percentage, is_default) VALUES
('Retail Price List', 'RETAIL-PL', 'retail', 0, true),
('Wholesale Price List', 'WHOLESALE-PL', 'wholesale', 15, false),
('Distributor Price List', 'DIST-PL', 'distributor', 25, false),
('Doctor Price List', 'DOCTOR-PL', 'doctor', 20, false),
('Special Offer Price List', 'OFFER-PL', 'retail', 10, false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RACKS/STORAGE LOCATIONS
-- ============================================
INSERT INTO racks (name, code, location, description) VALUES
('Rack A1', 'A1', 'Main Store - Left Side', 'Dilutions 30C'),
('Rack A2', 'A2', 'Main Store - Left Side', 'Dilutions 200C'),
('Rack A3', 'A3', 'Main Store - Left Side', 'Dilutions 1M, 10M'),
('Rack B1', 'B1', 'Main Store - Center', 'Mother Tinctures A-M'),
('Rack B2', 'B2', 'Main Store - Center', 'Mother Tinctures N-Z'),
('Rack C1', 'C1', 'Main Store - Right Side', 'Biochemic Medicines'),
('Rack C2', 'C2', 'Main Store - Right Side', 'Bio Combinations'),
('Rack D1', 'D1', 'Back Store', 'Ointments & External Use'),
('Rack D2', 'D2', 'Back Store', 'Cosmetics & Hair Care'),
('Rack E1', 'E1', 'Counter Area', 'Fast Moving Items'),
('Cold Storage', 'COLD', 'Refrigerator', 'Temperature sensitive items')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    'Subcategories' as table_name, COUNT(*) as count FROM subcategories
UNION ALL SELECT 'Units', COUNT(*) FROM units
UNION ALL SELECT 'HSN Codes', COUNT(*) FROM hsn_codes
UNION ALL SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL SELECT 'Customer Groups', COUNT(*) FROM customer_groups
UNION ALL SELECT 'Price Lists', COUNT(*) FROM price_lists
UNION ALL SELECT 'Racks', COUNT(*) FROM racks;

SELECT '✅ Default homeopathy data inserted successfully!' as status;
