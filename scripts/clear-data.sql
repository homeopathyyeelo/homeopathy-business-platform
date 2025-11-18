-- Clear all products, approvals, and inventory data
-- Run this to reset the system for fresh AI-generated data

BEGIN;

-- Clear inventory and stock data
TRUNCATE TABLE inventory_batches CASCADE;
TRUNCATE TABLE inventory_upload_items CASCADE;
TRUNCATE TABLE inventory_uploads CASCADE;

-- Clear purchase data
TRUNCATE TABLE purchase_items CASCADE;
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE purchase_uploads CASCADE;
TRUNCATE TABLE upload_items CASCADE;
TRUNCATE TABLE upload_sessions CASCADE;

-- Clear sales data
TRUNCATE TABLE sales_order_items CASCADE;
TRUNCATE TABLE sales_orders CASCADE;

-- Clear products (this will cascade to related tables)
TRUNCATE TABLE product_barcodes CASCADE;
TRUNCATE TABLE products CASCADE;

-- Reset sequences if needed
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Optionally clear master data (brands, categories, potencies, forms)
-- Uncomment if you want to recreate master data as well
-- TRUNCATE TABLE brands CASCADE;
-- TRUNCATE TABLE categories CASCADE;
-- TRUNCATE TABLE potencies CASCADE;
-- TRUNCATE TABLE forms CASCADE;
-- TRUNCATE TABLE units CASCADE;
-- TRUNCATE TABLE hsn_codes CASCADE;

COMMIT;

-- Verify cleanup
SELECT 'Products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Inventory Batches', COUNT(*) FROM inventory_batches
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Upload Sessions', COUNT(*) FROM upload_sessions
UNION ALL
SELECT 'Sales Orders', COUNT(*) FROM sales_orders;
