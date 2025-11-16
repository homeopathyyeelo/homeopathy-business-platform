-- ============================================================================
-- ADD STOCK_SOURCE TO INVENTORY_BATCHES
-- Distinguishes: purchase vs inventory vs adjustment
-- ============================================================================

-- 1) Add stock_source column to existing inventory_batches table
ALTER TABLE inventory_batches 
ADD COLUMN IF NOT EXISTS stock_source VARCHAR(20) DEFAULT 'purchase';

-- 2) Backfill existing data
-- If purchase_order_id exists, it's a purchase; otherwise it's inventory/adjustment
UPDATE inventory_batches 
SET stock_source = CASE 
    WHEN purchase_order_id IS NOT NULL AND purchase_order_id != '' THEN 'purchase'
    ELSE 'inventory'
END
WHERE stock_source IS NULL OR stock_source = 'purchase';

-- 3) Add index for fast queries
CREATE INDEX IF NOT EXISTS idx_inventory_batches_stock_source 
ON inventory_batches(stock_source);

-- 4) Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_batches_source_product 
ON inventory_batches(stock_source, product_id);

-- 5) Add check constraint to ensure valid values
ALTER TABLE inventory_batches
ADD CONSTRAINT chk_stock_source 
CHECK (stock_source IN ('purchase', 'inventory', 'adjustment', 'transfer', 'return'));

COMMENT ON COLUMN inventory_batches.stock_source IS 'Source of stock entry: purchase (official), inventory (opening/migration), adjustment (manual correction), transfer (location), return (customer/vendor)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check distribution
-- SELECT stock_source, COUNT(*) as count
-- FROM inventory_batches
-- GROUP BY stock_source;

-- Check purchases with vendor
-- SELECT ib.*, po.order_number, v.name as vendor_name
-- FROM inventory_batches ib
-- LEFT JOIN purchase_orders po ON ib.purchase_order_id = po.id
-- LEFT JOIN vendors v ON ib.supplier_id = v.id
-- WHERE ib.stock_source = 'purchase'
-- LIMIT 20;

-- Check inventory uploads (no vendor)
-- SELECT *
-- FROM inventory_batches
-- WHERE stock_source = 'inventory'
-- AND supplier_id IS NULL
-- LIMIT 20;
