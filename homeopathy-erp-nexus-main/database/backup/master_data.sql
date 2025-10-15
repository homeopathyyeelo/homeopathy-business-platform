
-- Master Data Backup for ERP System
-- This file contains all essential master data for the ERP system

-- Categories Master Data
INSERT INTO categories (id, name, description, is_active) VALUES
('cat-001', 'Homeopathic Medicines', 'Traditional homeopathic remedies', true),
('cat-002', 'Mother Tinctures', 'Mother tincture preparations', true),
('cat-003', 'Biochemic Medicines', 'Tissue salt preparations', true),
('cat-004', 'External Applications', 'Ointments, oils, and external preparations', true),
('cat-005', 'Health Supplements', 'Nutritional and herbal supplements', true)
ON CONFLICT (id) DO NOTHING;

-- Brands Master Data
INSERT INTO brands (id, name, description, is_active) VALUES
('brand-001', 'SBL', 'SBL Pvt Ltd - Leading homeopathic manufacturer', true),
('brand-002', 'Schwabe', 'Dr. Willmar Schwabe India Pvt. Ltd.', true),
('brand-003', 'Bakson', 'Bakson Drugs & Pharmaceuticals', true),
('brand-004', 'Reckeweg', 'Dr. Reckeweg & Co. GmbH', true),
('brand-005', 'Adel', 'ADEL Pekana Group', true),
('brand-006', 'Hahnemann', 'Hahnemann Scientific Laboratory', true),
('brand-007', 'Boiron', 'Boiron Laboratories', true),
('brand-008', 'Heel', 'Heel India Pvt. Ltd.', true)
ON CONFLICT (id) DO NOTHING;

-- Units Master Data
INSERT INTO units (id, name, short_name, is_active) VALUES
('unit-001', 'Tablets', 'TAB', true),
('unit-002', 'Milliliters', 'ML', true),
('unit-003', 'Grams', 'GM', true),
('unit-004', 'Pieces', 'PCS', true),
('unit-005', 'Bottles', 'BTL', true),
('unit-006', 'Strips', 'STRIP', true),
('unit-007', 'Vials', 'VIAL', true),
('unit-008', 'Tubes', 'TUBE', true)
ON CONFLICT (id) DO NOTHING;

-- Tax Rates Master Data
INSERT INTO tax_rates (id, name, rate, description, is_active) VALUES
('tax-001', 'GST 5%', 5.00, 'Goods and Services Tax 5%', true),
('tax-002', 'GST 12%', 12.00, 'Goods and Services Tax 12%', true),
('tax-003', 'GST 18%', 18.00, 'Goods and Services Tax 18%', true),
('tax-004', 'GST 28%', 28.00, 'Goods and Services Tax 28%', true),
('tax-005', 'GST 0%', 0.00, 'GST Exempt', true)
ON CONFLICT (id) DO NOTHING;

-- Warehouses Master Data
INSERT INTO warehouses (id, name, location, address, city, state, pincode, is_active) VALUES
('wh-001', 'Main Warehouse', 'Head Office', '123 Main Street', 'Mumbai', 'Maharashtra', '400001', true),
('wh-002', 'Branch Store 1', 'Branch Location', '456 Branch Road', 'Pune', 'Maharashtra', '411001', true)
ON CONFLICT (id) DO NOTHING;

-- Expense Categories Master Data
INSERT INTO expense_categories (id, name, description, is_active) VALUES
('exp-001', 'Office Supplies', 'Stationery, printing, office equipment', true),
('exp-002', 'Utilities', 'Electricity, water, internet, phone bills', true),
('exp-003', 'Transportation', 'Vehicle fuel, maintenance, travel expenses', true),
('exp-004', 'Marketing', 'Advertising, promotional activities', true),
('exp-005', 'Professional Services', 'Legal, accounting, consulting fees', true),
('exp-006', 'Rent', 'Office and warehouse rent', true),
('exp-007', 'Insurance', 'Business insurance premiums', true),
('exp-008', 'Staff Welfare', 'Employee benefits and welfare expenses', true)
ON CONFLICT (id) DO NOTHING;

-- Sample Products Master Data
INSERT INTO products (id, product_code, name, description, category_id, brand_id, purchase_unit_id, sale_unit_id, hsn_code, purchase_price, wholesale_price, retail_price, tax_rate_id, min_stock_level, reorder_level, is_active) VALUES
('prod-001', 'SBL-ARN-30', 'Arnica Montana 30C', 'Homeopathic remedy for trauma and injuries', 'cat-001', 'brand-001', 'unit-005', 'unit-005', '30049099', 85.00, 95.00, 110.00, 'tax-001', 10, 20, true),
('prod-002', 'SWB-BRY-200', 'Bryonia Alba 200C', 'Homeopathic remedy for respiratory conditions', 'cat-001', 'brand-002', 'unit-005', 'unit-005', '30049099', 90.00, 100.00, 120.00, 'tax-001', 5, 15, true),
('prod-003', 'BAK-NUX-30', 'Nux Vomica 30C', 'Homeopathic remedy for digestive issues', 'cat-001', 'brand-003', 'unit-005', 'unit-005', '30049099', 75.00, 85.00, 100.00, 'tax-001', 15, 25, true),
('prod-004', 'SBL-CALC-200', 'Calcarea Carbonica 200C', 'Constitutional homeopathic remedy', 'cat-001', 'brand-001', 'unit-005', 'unit-005', '30049099', 95.00, 105.00, 125.00, 'tax-001', 8, 18, true),
('prod-005', 'SWB-PULS-30', 'Pulsatilla 30C', 'Homeopathic remedy for hormonal issues', 'cat-001', 'brand-002', 'unit-005', 'unit-005', '30049099', 88.00, 98.00, 115.00, 'tax-001', 12, 22, true)
ON CONFLICT (id) DO NOTHING;

-- App Configuration for Marketing APIs
INSERT INTO app_configuration (key, value, description) VALUES
('whatsapp_api_key', '', 'WhatsApp Business API Key'),
('kaleyra_api_key', '', 'Kaleyra SMS API Key'),
('email_api_key', '', 'Email Service API Key'),
('email_from_address', 'noreply@yourcompany.com', 'Default sender email address'),
('email_from_name', 'Your Company Name', 'Default sender name'),
('facebook_access_token', '', 'Facebook Page Access Token'),
('instagram_access_token', '', 'Instagram Business Access Token'),
('loyalty_points_per_rupee', '1', 'Points earned per rupee spent'),
('loyalty_redemption_value', '1', 'Value of 1 point in rupees'),
('company_name', 'Homeopathy ERP', 'Company Name'),
('company_address', '123 Main Street, City', 'Company Address'),
('company_phone', '+91-9876543210', 'Company Phone'),
('company_email', 'info@company.com', 'Company Email'),
('gst_number', '27XXXXX1234X1ZX', 'Company GST Number')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
