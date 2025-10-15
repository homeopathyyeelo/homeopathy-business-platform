-- Master Data for YEELO HOMEOPATHY ERP System
-- Includes homeopathy-specific categories, brands, and sample data

-- Categories for Homeopathy
INSERT INTO categories (id, name, description, hsn_code, gst_percentage) VALUES
(uuid_generate_v4(), 'Acute Remedies', 'For acute conditions and emergencies', '30041000', 12.00),
(uuid_generate_v4(), 'Chronic Remedies', 'For chronic constitutional treatment', '30041000', 12.00),
(uuid_generate_v4(), 'Mother Tinctures', 'Herbal mother tinctures', '30041000', 12.00),
(uuid_generate_v4(), 'Bio-Chemic Salts', 'Schuessler tissue salts', '30041000', 12.00),
(uuid_generate_v4(), 'Bach Flower Remedies', 'Emotional healing remedies', '30041000', 12.00),
(uuid_generate_v4(), 'Veterinary Medicines', 'For animal treatment', '30041000', 12.00),
(uuid_generate_v4(), 'External Applications', 'Ointments, oils, and external remedies', '30041000', 18.00),
(uuid_generate_v4(), 'Homeopathy Books', 'Reference books and literature', '49019900', 12.00),
(uuid_generate_v4(), 'Accessories', 'Pill boxes, medicine containers', '39269099', 18.00),
(uuid_generate_v4(), 'Combination Remedies', 'Ready-made combinations', '30041000', 12.00)
ON CONFLICT (id) DO NOTHING;

-- Homeopathy Brands
INSERT INTO brands (id, name, description) VALUES
(uuid_generate_v4(), 'SBL', 'SBL Private Limited - Leading homeopathy manufacturer'),
(uuid_generate_v4(), 'Dr. Reckeweg', 'German homeopathy company'),
(uuid_generate_v4(), 'Schwabe', 'Dr. Willmar Schwabe India'),
(uuid_generate_v4(), 'Bakson', 'Bakson Homeopathy'),
(uuid_generate_v4(), 'Adel', 'ADEL Pekana Germany'),
(uuid_generate_v4(), 'Boiron', 'Boiron Laboratories'),
(uuid_generate_v4(), 'Bjain', 'Bjain Pharmaceuticals'),
(uuid_generate_v4(), 'New Life', 'New Life Drug & Pharmaceuticals'),
(uuid_generate_v4(), 'Haslab', 'Hahnemann Scientific Laboratory'),
(uuid_generate_v4(), 'Lords', 'Lords Homeopathic Laboratory'),
(uuid_generate_v4(), 'Allen', 'Allen Homeopathy & Herbals'),
(uuid_generate_v4(), 'Similia', 'Similia Homoeo Laboratory'),
(uuid_generate_v4(), 'Fourrts', 'Fourrts India Laboratories'),
(uuid_generate_v4(), 'Wheezal', 'Wheezal Homeo Pharma')
ON CONFLICT (name) DO NOTHING;

-- Units
INSERT INTO units (id, name, short_name) VALUES
(uuid_generate_v4(), 'Tablets', 'tabs'),
(uuid_generate_v4(), 'Drops', 'drops'),
(uuid_generate_v4(), 'Milliliter', 'ml'),
(uuid_generate_v4(), 'Grams', 'g'),
(uuid_generate_v4(), 'Bottles', 'btl'),
(uuid_generate_v4(), 'Tubes', 'tube'),
(uuid_generate_v4(), 'Boxes', 'box'),
(uuid_generate_v4(), 'Sachets', 'sach'),
(uuid_generate_v4(), 'Vials', 'vial'),
(uuid_generate_v4(), 'Pieces', 'pcs')
ON CONFLICT (name) DO NOTHING;

-- Tax Rates
INSERT INTO tax_rates (id, name, rate, description) VALUES
(uuid_generate_v4(), 'GST 12%', 12.00, 'Standard GST for medicines'),
(uuid_generate_v4(), 'GST 18%', 18.00, 'GST for accessories and books'),
(uuid_generate_v4(), 'GST 5%', 5.00, 'Reduced GST rate'),
(uuid_generate_v4(), 'GST 0%', 0.00, 'Zero rated'),
(uuid_generate_v4(), 'Exempt', 0.00, 'Tax exempt')
ON CONFLICT (name) DO NOTHING;

-- Default Warehouse
INSERT INTO warehouses (id, name, location, address, city, state, contact_person) VALUES
(uuid_generate_v4(), 'YEELO HOMEOPATHY - Main Store', 'Main Branch', 'Store Address', 'City', 'State', 'Store Manager')
ON CONFLICT (name) DO NOTHING;

-- Sample Homeopathy Products
WITH 
category_acute AS (SELECT id FROM categories WHERE name = 'Acute Remedies' LIMIT 1),
category_chronic AS (SELECT id FROM categories WHERE name = 'Chronic Remedies' LIMIT 1),
category_mother AS (SELECT id FROM categories WHERE name = 'Mother Tinctures' LIMIT 1),
brand_sbl AS (SELECT id FROM brands WHERE name = 'SBL' LIMIT 1),
brand_schwabe AS (SELECT id FROM brands WHERE name = 'Schwabe' LIMIT 1),
brand_reckeweg AS (SELECT id FROM brands WHERE name = 'Dr. Reckeweg' LIMIT 1),
unit_tabs AS (SELECT id FROM units WHERE name = 'Tablets' LIMIT 1),
unit_drops AS (SELECT id FROM units WHERE name = 'Drops' LIMIT 1),
unit_ml AS (SELECT id FROM units WHERE name = 'Milliliter' LIMIT 1),
tax_12 AS (SELECT id FROM tax_rates WHERE name = 'GST 12%' LIMIT 1)

INSERT INTO products (
    product_code, name, description, category_id, brand_id, 
    purchase_unit_id, sale_unit_id, hsn_code, 
    purchase_price, wholesale_price, retail_price, mrp,
    tax_rate_id, min_stock_level, reorder_level,
    potency, medicine_form, therapeutic_indication
) VALUES
-- Acute Remedies
('ACONITE30C', 'Aconite Napellus 30C', 'For sudden onset conditions, fever, anxiety', 
 (SELECT id FROM category_acute), (SELECT id FROM brand_sbl), 
 (SELECT id FROM unit_tabs), (SELECT id FROM unit_tabs), '30041000',
 45.00, 50.00, 55.00, 60.00, (SELECT id FROM tax_12), 10, 5,
 '30C', 'Tablets', 'Sudden onset fever, anxiety, shock'),

('ARNICA200', 'Arnica Montana 200C', 'For trauma, bruises, shock', 
 (SELECT id FROM category_acute), (SELECT id FROM brand_schwabe), 
 (SELECT id FROM unit_tabs), (SELECT id FROM unit_tabs), '30041000',
 50.00, 55.00, 60.00, 65.00, (SELECT id FROM tax_12), 15, 8,
 '200C', 'Tablets', 'Trauma, bruises, muscular pain'),

('BELLADONNA30', 'Belladonna 30C', 'For high fever, inflammation', 
 (SELECT id FROM category_acute), (SELECT id FROM brand_sbl), 
 (SELECT id FROM unit_tabs), (SELECT id FROM unit_tabs), '30041000',
 45.00, 50.00, 55.00, 60.00, (SELECT id FROM tax_12), 12, 6,
 '30C', 'Tablets', 'High fever, inflammation, throbbing pain'),

-- Chronic Remedies
('SULPHUR1M', 'Sulphur 1M', 'Constitutional remedy for chronic conditions', 
 (SELECT id FROM category_chronic), (SELECT id FROM brand_reckeweg), 
 (SELECT id FROM unit_tabs), (SELECT id FROM unit_tabs), '30041000',
 75.00, 85.00, 95.00, 105.00, (SELECT id FROM tax_12), 8, 4,
 '1M', 'Tablets', 'Chronic skin conditions, digestive issues'),

('CALCCARB200', 'Calcarea Carbonica 200C', 'For calcium deficiency, slow development', 
 (SELECT id FROM category_chronic), (SELECT id FROM brand_schwabe), 
 (SELECT id FROM unit_tabs), (SELECT id FROM unit_tabs), '30041000',
 60.00, 70.00, 80.00, 90.00, (SELECT id FROM tax_12), 10, 5,
 '200C', 'Tablets', 'Calcium deficiency, delayed development'),

-- Mother Tinctures
('ARNICAQ', 'Arnica Montana Q', 'Mother tincture for external application', 
 (SELECT id FROM category_mother), (SELECT id FROM brand_sbl), 
 (SELECT id FROM unit_ml), (SELECT id FROM unit_ml), '30041000',
 85.00, 95.00, 110.00, 125.00, (SELECT id FROM tax_12), 6, 3,
 'Q', 'Liquid', 'External application for bruises, sprains'),

('CALENDULAQ', 'Calendula Officinalis Q', 'Healing and antiseptic mother tincture', 
 (SELECT id FROM category_mother), (SELECT id FROM brand_schwabe), 
 (SELECT id FROM unit_ml), (SELECT id FROM unit_ml), '30041000',
 90.00, 100.00, 115.00, 130.00, (SELECT id FROM tax_12), 8, 4,
 'Q', 'Liquid', 'Wound healing, cuts, antiseptic')
ON CONFLICT (product_code) DO NOTHING;

-- App Configuration for YEELO HOMEOPATHY
INSERT INTO app_configuration (key, value, description) VALUES
('database_source', 'supabase', 'Primary database source'),
('company_name', 'YEELO HOMEOPATHY', 'Company name'),
('company_address', 'Store Address, City, State - Pincode', 'Company address'),
('company_phone', '+91-XXXXXXXXXX', 'Company phone number'),
('company_email', 'info@yeelohomeopathy.com', 'Company email'),
('company_gst', '27XXXXX1234X1ZX', 'Company GST number'),
('currency', 'INR', 'Currency code'),
('timezone', 'Asia/Kolkata', 'Timezone'),
('enable_batch_tracking', 'true', 'Enable batch tracking for inventory'),
('enable_expiry_alerts', 'true', 'Enable expiry date alerts'),
('enable_prescription_module', 'true', 'Enable prescription management'),
('enable_loyalty_program', 'true', 'Enable customer loyalty program'),
('default_invoice_terms', 'Thank you for your business!', 'Default invoice terms'),
('low_stock_threshold', '10', 'Default low stock threshold'),
('enable_whatsapp_notifications', 'true', 'Enable WhatsApp notifications'),
('backup_frequency', 'daily', 'Database backup frequency')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- WhatsApp Templates for YEELO HOMEOPATHY
INSERT INTO whatsapp_templates (name, type, content) VALUES
('Welcome Message', 'greeting', 'Welcome to YEELO HOMEOPATHY! We are here to help you with quality homeopathic medicines. Contact us for any assistance.'),
('Invoice Generated', 'invoice', 'Dear {{customer_name}}, your invoice {{invoice_number}} of ₹{{amount}} has been generated. Thank you for choosing YEELO HOMEOPATHY!'),
('Payment Reminder', 'reminder', 'Dear {{customer_name}}, this is a friendly reminder about your pending payment of ₹{{amount}} for invoice {{invoice_number}}. Please clear the dues at your earliest convenience.'),
('Prescription Ready', 'prescription', 'Dear {{patient_name}}, your prescribed medicines are ready for pickup at YEELO HOMEOPATHY. Please collect them at your convenience.'),
('Stock Alert', 'stock', 'Low stock alert: {{product_name}} - Current stock: {{quantity}}. Please reorder soon.')
ON CONFLICT (name) DO NOTHING;

-- Sample Customer for testing
INSERT INTO customers (
    customer_id, name, email, phone, address, city, state, pincode,
    date_of_birth, gender, medical_history
) VALUES
('CUST001', 'Test Customer', 'customer@test.com', '+91-9876543210', 
 'Test Address', 'Test City', 'Test State', '123456',
 '1990-01-01', 'Male', 'No major medical history')
ON CONFLICT (customer_id) DO NOTHING;

-- Sample Supplier
INSERT INTO suppliers (
    supplier_id, company_name, contact_person, email, phone, 
    address, city, state, pincode, gst_number
) VALUES
('SUP001', 'SBL Private Limited', 'Sales Manager', 'sales@sbl.co.in', '+91-1234567890',
 'SBL House, Sector 18, Gurgaon', 'Gurgaon', 'Haryana', '122015', '06AABCS1234F1ZX')
ON CONFLICT (supplier_id) DO NOTHING;