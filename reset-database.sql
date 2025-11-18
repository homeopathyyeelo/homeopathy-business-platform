-- Reset Database for Fresh CSV Import
-- This will delete all product, inventory, and purchase data
-- Run this to start completely fresh

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Delete purchase-related data (in order of dependencies)
DELETE FROM purchase_receipt_items;
DELETE FROM purchase_receipts;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;

-- Delete inventory-related data
DELETE FROM inventory_batches;
DELETE FROM stock_adjustments;

-- Delete product-related data
DELETE FROM products;

-- Delete upload sessions and items
DELETE FROM upload_items;
DELETE FROM upload_sessions;

-- Delete barcode records
DELETE FROM barcodes;

-- Reset sequences to start from 1
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_batches_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_receipts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_receipt_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS upload_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS upload_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS barcodes_id_seq RESTART WITH 1;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Verify deletion
SELECT 'Products' as table_name, COUNT(*) as remaining_rows FROM products
UNION ALL
SELECT 'Inventory Batches', COUNT(*) FROM inventory_batches
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Upload Sessions', COUNT(*) FROM upload_sessions
UNION ALL
SELECT 'Barcodes', COUNT(*) FROM barcodes;

-- Show completion message
SELECT 'Database reset complete! Ready for fresh CSV import.' as status;
