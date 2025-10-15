-- Fix customers table structure without duplicate policies
-- Improve inventory table for better batch management
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS batch_number VARCHAR DEFAULT 'DEFAULT-001',
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS quantity_in_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mrp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price_retail NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price_wholesale NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rack_location VARCHAR,
ADD COLUMN IF NOT EXISTS warehouse_id UUID,
ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR DEFAULT 'Main Store',
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_batch ON public.inventory(product_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON public.inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON public.inventory(quantity_in_stock);

-- Improve products table for homeopathy specifics
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_code VARCHAR,
ADD COLUMN IF NOT EXISTS potency_scale VARCHAR DEFAULT 'centesimal',
ADD COLUMN IF NOT EXISTS potency_value VARCHAR DEFAULT '30',
ADD COLUMN IF NOT EXISTS potency_notation VARCHAR DEFAULT '30C',
ADD COLUMN IF NOT EXISTS medicine_form VARCHAR DEFAULT 'globules',
ADD COLUMN IF NOT EXISTS full_medicine_name VARCHAR,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR,
ADD COLUMN IF NOT EXISTS pack_size VARCHAR,
ADD COLUMN IF NOT EXISTS sku VARCHAR,
ADD COLUMN IF NOT EXISTS barcode VARCHAR,
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR DEFAULT '30049019',
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 12,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_selling_price_retail NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_selling_price_wholesale NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_stock_level NUMERIC DEFAULT 1000,
ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS default_rack_location VARCHAR,
ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expiry_tracking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing products with generated codes if empty
UPDATE public.products 
SET product_code = CONCAT('PROD-', SUBSTRING(id::text, 1, 8))
WHERE product_code IS NULL OR product_code = '';

-- Create medicine forms enum check
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_medicine_form_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_medicine_form_check 
CHECK (medicine_form IN (
    'globules', 'tablets', 'drops', 'dilution', 'mother-tincture',
    'trituration', 'ointment', 'cream', 'syrup', 'injection', 'powder'
));

-- Create potency scale check
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_potency_scale_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_potency_scale_check 
CHECK (potency_scale IN ('decimal', 'centesimal', 'lm', 'mother-tincture'));