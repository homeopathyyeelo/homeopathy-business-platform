
-- Create supplier discount structure table
CREATE TABLE public.supplier_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  discount_type VARCHAR NOT NULL CHECK (discount_type IN ('brand', 'category', 'volume', 'payment_terms')),
  brand_id UUID NULL,
  category_id UUID NULL,
  min_quantity NUMERIC NULL,
  min_amount NUMERIC NULL,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NULL,
  payment_terms_days INTEGER NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Add foreign key constraints
ALTER TABLE public.supplier_discounts 
ADD CONSTRAINT fk_supplier_discounts_supplier 
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_discounts 
ADD CONSTRAINT fk_supplier_discounts_brand 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.supplier_discounts 
ADD CONSTRAINT fk_supplier_discounts_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_supplier_discounts_supplier_brand ON public.supplier_discounts(supplier_id, brand_id);
CREATE INDEX idx_supplier_discounts_supplier_category ON public.supplier_discounts(supplier_id, category_id);

-- Update purchases table to track applied discounts
ALTER TABLE public.purchases 
ADD COLUMN supplier_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN brand_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN category_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN volume_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN payment_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN total_discount_applied NUMERIC DEFAULT 0,
ADD COLUMN effective_total NUMERIC;

-- Update purchase_items table for item-level discount tracking
ALTER TABLE public.purchase_items 
ADD COLUMN applicable_discounts JSONB DEFAULT '{}',
ADD COLUMN discount_breakdown JSONB DEFAULT '{}',
ADD COLUMN original_rate NUMERIC,
ADD COLUMN discounted_rate NUMERIC,
ADD COLUMN margin_percentage NUMERIC,
ADD COLUMN suggested_retail_price NUMERIC,
ADD COLUMN suggested_wholesale_price NUMERIC;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_supplier_discounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_discounts_updated_at
  BEFORE UPDATE ON public.supplier_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_discounts_timestamp();

-- Add MRP and margin tracking to products table
ALTER TABLE public.products 
ADD COLUMN mrp NUMERIC,
ADD COLUMN margin_percentage NUMERIC DEFAULT 0,
ADD COLUMN last_purchase_price NUMERIC,
ADD COLUMN last_purchase_date DATE,
ADD COLUMN auto_price_update BOOLEAN DEFAULT false;

-- Create table for price history tracking
CREATE TABLE public.product_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  purchase_id UUID NULL,
  old_purchase_price NUMERIC,
  new_purchase_price NUMERIC,
  old_retail_price NUMERIC,
  new_retail_price NUMERIC,
  old_wholesale_price NUMERIC,
  new_wholesale_price NUMERIC,
  old_mrp NUMERIC,
  new_mrp NUMERIC,
  change_reason VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.product_price_history
ADD CONSTRAINT fk_product_price_history_product
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.supplier_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on supplier_discounts" ON public.supplier_discounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_price_history" ON public.product_price_history FOR ALL USING (true);
