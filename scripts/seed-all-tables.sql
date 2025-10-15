-- Seed data for all tables to ensure ERP works completely

-- Insert Suppliers
INSERT INTO suppliers (id, "companyName", "contactPerson", phone, email, address, "isActive", "shopId", "createdAt", "updatedAt") VALUES
('sup001', 'SBL Pvt Ltd', 'Rajesh Kumar', '9876543210', 'contact@sbl.com', 'Mumbai', true, 'dist-yeelo', NOW(), NOW()),
('sup002', 'Dr. Willmar Schwabe India', 'Amit Sharma', '9876543211', 'info@schwabe.in', 'Delhi', true, 'dist-yeelo', NOW(), NOW()),
('sup003', 'Bakson Drugs', 'Priya Patel', '9876543212', 'sales@bakson.com', 'Kolkata', true, 'dist-yeelo', NOW(), NOW()),
('sup004', 'Hahnemann Scientific Lab', 'Suresh Reddy', '9876543213', 'contact@hahnemann.com', 'Hyderabad', true, 'dist-yeelo', NOW(), NOW()),
('sup005', 'Reckeweg India', 'Neha Singh', '9876543214', 'info@reckeweg.in', 'Chennai', true, 'dist-yeelo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, description, "parentId", "hsnCode", "gstPercentage", "isActive", "shopId", "createdAt", "updatedAt") VALUES
('cat001', 'Single Remedies', 'Homeopathic single remedies', NULL, '30049011', 12.00, true, 'dist-yeelo', NOW(), NOW()),
('cat002', 'Mother Tinctures', 'Homeopathic mother tinctures', NULL, '30049012', 12.00, true, 'dist-yeelo', NOW(), NOW()),
('cat003', 'Biochemic', 'Biochemic medicines', NULL, '30049013', 12.00, true, 'dist-yeelo', NOW(), NOW()),
('cat004', 'Dilutions', 'Homeopathic dilutions', 'cat001', '30049011', 12.00, true, 'dist-yeelo', NOW(), NOW()),
('cat005', 'Trituration', 'Homeopathic trituration', 'cat001', '30049011', 12.00, true, 'dist-yeelo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Brands
INSERT INTO brands (id, name, description, "isActive", "shopId", "createdAt", "updatedAt") VALUES
('br001', 'SBL', 'SBL Homeopathy', true, 'dist-yeelo', NOW(), NOW()),
('br002', 'Schwabe', 'Dr. Willmar Schwabe', true, 'dist-yeelo', NOW(), NOW()),
('br003', 'Bakson', 'Bakson Homeopathy', true, 'dist-yeelo', NOW(), NOW()),
('br004', 'Hahnemann', 'Hahnemann Labs', true, 'dist-yeelo', NOW(), NOW()),
('br005', 'Reckeweg', 'Dr. Reckeweg & Co', true, 'dist-yeelo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Units
INSERT INTO units (id, name, "shortName", "conversionFactor", "isActive", "shopId", "createdAt", "updatedAt") VALUES
('unit001', 'Bottles', 'BTL', 1.0, true, 'dist-yeelo', NOW(), NOW()),
('unit002', 'Tablets', 'TAB', 1.0, true, 'dist-yeelo', NOW(), NOW()),
('unit003', 'Milliliter', 'ML', 1.0, true, 'dist-yeelo', NOW(), NOW()),
('unit004', 'Grams', 'GM', 1.0, true, 'dist-yeelo', NOW(), NOW()),
('unit005', 'Boxes', 'BOX', 1.0, true, 'dist-yeelo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Tax Rates
INSERT INTO tax_rates (id, name, rate, type, "isActive", "shopId", "createdAt", "updatedAt") VALUES
('tax001', 'GST 12%', 12.00, 'GST', true, 'dist-yeelo', NOW(), NOW()),
('tax002', 'GST 18%', 18.00, 'GST', true, 'dist-yeelo', NOW(), NOW()),
('tax003', 'GST 5%', 5.00, 'GST', true, 'dist-yeelo', NOW(), NOW()),
('tax004', 'CGST 6%', 6.00, 'CGST', true, 'dist-yeelo', NOW(), NOW()),
('tax005', 'SGST 6%', 6.00, 'SGST', true, 'dist-yeelo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update products to have proper references
UPDATE products SET "shopId" = 'dist-yeelo' WHERE "shopId" IS NULL OR "shopId" = '';

SELECT 'Data seeded successfully!' as status;
