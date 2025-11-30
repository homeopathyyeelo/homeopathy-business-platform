-- Add order_payments table for partial payment tracking
CREATE TABLE IF NOT EXISTS order_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    payment_number text UNIQUE NOT NULL,
    payment_date timestamp with time zone DEFAULT now(),
    amount numeric NOT NULL CHECK (amount > 0),
    payment_method text NOT NULL,
    reference_number text,
    notes text,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_payment_date ON order_payments(payment_date);

-- Add payment tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';

-- Update existing orders to set pending_amount = total_amount - paid_amount
UPDATE orders 
SET pending_amount = COALESCE(total_amount, 0) - COALESCE(paid_amount, 0),
    payment_status = CASE 
        WHEN COALESCE(paid_amount, 0) = 0 THEN 'PENDING'
        WHEN COALESCE(paid_amount, 0) >= COALESCE(total_amount, 0) THEN 'PAID'
        ELSE 'PARTIAL'
    END
WHERE pending_amount IS NULL OR payment_status IS NULL;

-- Create function to update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM order_payments
            WHERE order_id = NEW.order_id
        ),
        pending_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0)
            FROM order_payments
            WHERE order_id = NEW.order_id
        ),
        payment_status = CASE
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM order_payments WHERE order_id = NEW.order_id) = 0 THEN 'PENDING'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM order_payments WHERE order_id = NEW.order_id) >= total_amount THEN 'PAID'
            ELSE 'PARTIAL'
        END,
        updated_at = now()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update order payment status
DROP TRIGGER IF EXISTS trg_update_order_payment_status ON order_payments;
CREATE TRIGGER trg_update_order_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();

-- Create view for order summary with payment info
CREATE OR REPLACE VIEW v_order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.customer_name,
    o.customer_phone,
    o.order_date,
    o.status,
    o.total_amount,
    o.paid_amount,
    o.pending_amount,
    o.payment_status,
    o.payment_method,
    o.source,
    COUNT(op.id) as payment_count,
    MIN(op.payment_date) as first_payment_date,
    MAX(op.payment_date) as last_payment_date
FROM orders o
LEFT JOIN order_payments op ON o.id = op.order_id
GROUP BY o.id, o.order_number, o.customer_id, o.customer_name, o.customer_phone,
         o.order_date, o.status, o.total_amount, o.paid_amount, o.pending_amount,
         o.payment_status, o.payment_method, o.source;
