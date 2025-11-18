-- Reset Database for Fresh CSV Import (Corrected)
-- This will delete all product, inventory, and purchase data

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Delete purchase-related data (in order of dependencies)
DELETE FROM purchase_receipt_items;
DELETE FROM purchase_receipts;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;
DELETE FROM purchase_items;
DELETE FROM purchase_uploads;

-- Delete inventory-related data
DELETE FROM inventory_upload_items;
DELETE FROM inventory_uploads;
DELETE FROM inventory_batches;

-- Delete product-related data
DELETE FROM product_barcodes;
DELETE FROM products;

-- Delete upload sessions and items
DELETE FROM upload_items;
DELETE FROM upload_sessions;

-- Reset UUID generation (for PostgreSQL)
-- This will ensure new IDs are generated fresh

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Verify deletion
SELECT 'Products' as table_name, COUNT(*) as remaining_rows FROM products
UNION ALL
SELECT 'Inventory Batches', COUNT(*) FROM inventory_batches
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Product Barcodes', COUNT(*) FROM product_barcodes
UNION ALL
SELECT 'Upload Sessions', COUNT(*) FROM upload_sessions;

-- Show completion message
SELECT 'Database reset complete! Ready for fresh CSV import.' as status;
