-- Check current customers table structure and fix issues
-- Check if customers table exists, if not create it
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR,
    name VARCHAR GENERATED ALWAYS AS (CONCAT(first_name, ' ', COALESCE(last_name, ''))) STORED,
    email VARCHAR,
    phone VARCHAR NOT NULL,
    address TEXT,
    city VARCHAR,
    state VARCHAR,
    pincode VARCHAR,
    gst_number VARCHAR,
    type VARCHAR DEFAULT 'retail' CHECK (type IN ('retail', 'wholesale')),
    credit_limit NUMERIC DEFAULT 0,
    opening_balance NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    balance_type VARCHAR DEFAULT 'credit' CHECK (balance_type IN ('credit', 'debit')),
    price_level VARCHAR DEFAULT 'A' CHECK (price_level IN ('A', 'B', 'C')),
    is_active BOOLEAN DEFAULT true,
    default_discount_percentage NUMERIC DEFAULT 0,
    discount_type VARCHAR DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    credit_days INTEGER DEFAULT 0,
    max_credit_limit NUMERIC DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on customers" 
ON public.customers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION public.update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_customers_updated_at();

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

-- Add foreign key constraint if products table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_product_id_fkey'
    ) THEN
        ALTER TABLE public.inventory 
        ADD CONSTRAINT inventory_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_batch ON public.inventory(product_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON public.inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON public.inventory(quantity_in_stock);

-- Improve products table for homeopathy specifics
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_code VARCHAR UNIQUE,
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