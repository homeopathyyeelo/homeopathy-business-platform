-- Fix missing columns in sales_invoices
ALTER TABLE sales_invoices 
ADD COLUMN IF NOT EXISTS cgst5_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst5_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst5_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cgst18_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst18_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst18_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gst numeric DEFAULT 0;

-- Fix missing columns in sales_invoice_items
ALTER TABLE sales_invoice_items
ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gst numeric DEFAULT 0;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_id uuid,
    customer_name text,
    customer_phone text,
    customer_email text,
    order_date timestamp with time zone,
    status text,
    total_amount numeric,
    payment_method text,
    payment_status text,
    source text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY,
    order_id uuid REFERENCES orders(id),
    product_id uuid,
    product_name text,
    product_sku text,
    batch_id uuid,
    batch_number text,
    quantity numeric,
    unit_price numeric,
    total_price numeric,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);
