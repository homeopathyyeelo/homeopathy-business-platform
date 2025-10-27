-- ============================================================================
-- HOMEOPATHY BUSINESS MASTER DATA - PRODUCTION READY
-- Complete default data for HomeoERP system
-- ============================================================================

-- 1. PRODUCT CATEGORIES
INSERT INTO categories (id, name, code, description, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Mother Tinctures (Q)', 'MT', 'Herbal extracts in alcohol base', true, now(), now()),
(gen_random_uuid(), 'Dilutions', 'DIL', 'Homeopathic dilutions in various potencies', true, now(), now()),
(gen_random_uuid(), 'Biochemic Tablets', 'BIO', '12 tissue salts and bio combinations', true, now(), now()),
(gen_random_uuid(), 'Ointments', 'OINT', 'External application creams', true, now(), now()),
(gen_random_uuid(), 'Drops', 'DROP', 'Liquid formulations in drop form', true, now(), now()),
(gen_random_uuid(), 'Syrups', 'SYR', 'Cough and health syrups', true, now(), now()),
(gen_random_uuid(), 'Tablets', 'TAB', 'Medicinal tablets', true, now(), now()),
(gen_random_uuid(), 'Globules', 'GLOB', 'Sugar pills medicated', true, now(), now()),
(gen_random_uuid(), 'Trituration', 'TRIT', 'Powdered medicinal preparations', true, now(), now()),
(gen_random_uuid(), 'Bach Flower Remedies', 'BACH', '38 Bach flower essences', true, now(), now()),
(gen_random_uuid(), 'LM Potencies', 'LM', 'Fifty Millesimal potencies', true, now(), now()),
(gen_random_uuid(), 'Creams & Gels', 'CREAM', 'External skin care', true, now(), now()),
(gen_random_uuid(), 'Oils', 'OIL', 'Medicated oils', true, now(), now()),
(gen_random_uuid(), 'Cosmetics', 'COSM', 'Homeopathic cosmetics', true, now(), now()),
(gen_random_uuid(), 'Hair Care', 'HAIR', 'Hair treatments', true, now(), now());

-- 2. BRANDS
INSERT INTO brands (id, name, code, description, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'SBL (Dr. Willmar Schwabe)', 'SBL', 'Largest homeopathy manufacturer in India', true, now(), now()),
(gen_random_uuid(), 'Dr. Reckeweg & Co.', 'RECKEWEG', 'German homeopathy - India operations', true, now(), now()),
(gen_random_uuid(), 'Allen Homoeo', 'ALLEN', 'Premium Indian brand', true, now(), now()),
(gen_random_uuid(), 'Bakson Drugs', 'BAKSON', 'Trusted Indian manufacturer', true, now(), now()),
(gen_random_uuid(), 'Schwabe India', 'SCHWABE', 'German quality standards', true, now(), now()),
(gen_random_uuid(), 'Wheezal', 'WHEEZAL', 'Quality medicines', true, now(), now()),
(gen_random_uuid(), 'Hahnemann Lab', 'HAHNEMANN', 'Scientific homeopathy', true, now(), now()),
(gen_random_uuid(), 'Adel Germany', 'ADEL', 'Complex remedies from Germany', true, now(), now()),
(gen_random_uuid(), 'Haslab', 'HASLAB', 'Himalaya homeopathy division', true, now(), now()),
(gen_random_uuid(), 'Bjain Pharma', 'BJAIN', 'Large scale manufacturer', true, now(), now());

-- 3. POTENCIES
INSERT INTO potencies (id, name, code, description, is_active, created_at) VALUES
(gen_random_uuid(), '3X', '3X', 'Third decimal', true, now()),
(gen_random_uuid(), '6X', '6X', 'Sixth decimal - Biochemic standard', true, now()),
(gen_random_uuid(), '12X', '12X', 'Twelfth decimal', true, now()),
(gen_random_uuid(), '30X', '30X', 'Thirtieth decimal', true, now()),
(gen_random_uuid(), '6C', '6C', 'Sixth centesimal - Acute', true, now()),
(gen_random_uuid(), '30C', '30C', 'Thirtieth centesimal - Most popular', true, now()),
(gen_random_uuid(), '200C', '200C', 'Two hundredth - Chronic', true, now()),
(gen_random_uuid(), '1M', '1M', 'One thousand - High potency', true, now()),
(gen_random_uuid(), '10M', '10M', 'Ten thousand', true, now()),
(gen_random_uuid(), 'CM', 'CM', 'Hundred thousand', true, now()),
(gen_random_uuid(), 'Q (Mother Tincture)', 'Q', 'Original extract', true, now());

-- 4. FORMS
INSERT INTO forms (id, name, code, description, is_active, created_at) VALUES
(gen_random_uuid(), 'Liquid (Dilution)', 'LIQ', 'Liquid in alcohol/water', true, now()),
(gen_random_uuid(), 'Tablet', 'TAB', 'Solid oral tablets', true, now()),
(gen_random_uuid(), 'Globules', 'GLOB', 'Sugar pills', true, now()),
(gen_random_uuid(), 'Mother Tincture', 'MT', 'Herbal extract', true, now()),
(gen_random_uuid(), 'Ointment', 'OINT', 'External application', true, now()),
(gen_random_uuid(), 'Cream', 'CRM', 'Lighter formulation', true, now()),
(gen_random_uuid(), 'Drops', 'DROP', 'Concentrated liquid', true, now()),
(gen_random_uuid(), 'Syrup', 'SYR', 'Sweet liquid', true, now()),
(gen_random_uuid(), 'Trituration', 'TRIT', 'Powder form', true, now());

-- 5. HSN CODES
INSERT INTO hsn_codes (id, code, name, description, is_active, created_at) VALUES
(gen_random_uuid(), '30039011', 'Mother Tinctures', 'Homeopathic mother tinctures', true, now()),
(gen_random_uuid(), '30049011', 'Dilutions', 'Homeopathic dilutions', true, now()),
(gen_random_uuid(), '30049012', 'Biochemic', 'Tissue salts', true, now()),
(gen_random_uuid(), '30049013', 'Ointments', 'External application', true, now()),
(gen_random_uuid(), '30049014', 'Tablets', 'Homeopathic tablets', true, now());

-- 6. UNITS
INSERT INTO units (id, name, code, description, is_active, created_at) VALUES
(gen_random_uuid(), 'Millilitre', 'ml', 'Volume - liquid', true, now()),
(gen_random_uuid(), 'Gram', 'g', 'Weight - powders', true, now()),
(gen_random_uuid(), 'Piece', 'pcs', 'Count', true, now()),
(gen_random_uuid(), 'Bottle', 'btl', 'Bottle packaging', true, now()),
(gen_random_uuid(), 'Tube', 'tube', 'Tube packaging', true, now()),
(gen_random_uuid(), 'Strip', 'strip', 'Strip of 10', true, now()),
(gen_random_uuid(), 'Pack', 'pack', 'Package/box', true, now()),
(gen_random_uuid(), 'Dozen', 'dz', '12 units', true, now());

-- 7. Default Warehouse
INSERT INTO warehouses (id, name, code, location, is_default, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Main Warehouse', 'WH001', 'Head Office', true, true, now(), now()),
(gen_random_uuid(), 'Retail Counter', 'WH002', 'Front Store', false, true, now(), now());
