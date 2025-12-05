-- ============================================================================
-- BILL SNAPSHOT & PRINTER SETTINGS SYSTEM
-- Tracks paper size, bill snapshots, and customer history
-- ============================================================================

-- Printer Settings Table (per counter/user)
CREATE TABLE IF NOT EXISTS printer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counter_id VARCHAR(50) NOT NULL,
    counter_name VARCHAR(100),
    user_id UUID REFERENCES users(id),
    paper_size VARCHAR(10) DEFAULT '3x5', -- '3x5' or '4x6'
    printer_type VARCHAR(50) DEFAULT 'thermal', -- 'thermal', 'a4', 'dot-matrix'
    printer_name VARCHAR(100),
    auto_print BOOLEAN DEFAULT false,
    copies_per_print INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(counter_id, user_id)
);

CREATE INDEX idx_printer_settings_counter ON printer_settings(counter_id);
CREATE INDEX idx_printer_settings_user ON printer_settings(user_id);

-- Company-wide default printer settings
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_paper_size VARCHAR(10) DEFAULT '3x5';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_printer_type VARCHAR(50) DEFAULT 'thermal';

-- Add bill snapshot fields to orders table
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS paper_size VARCHAR(10) DEFAULT '3x5';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS bill_snapshot JSONB;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS bill_preview_text TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS bill_html TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS print_count INT DEFAULT 0;

-- Bill Snapshot Storage for Sales Invoices
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS paper_size VARCHAR(10) DEFAULT '3x5';
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS bill_snapshot JSONB;
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS bill_preview_text TEXT;
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS bill_html TEXT;
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP;
ALTER TABLE IF EXISTS sales_invoices ADD COLUMN IF NOT EXISTS print_count INT DEFAULT 0;

-- Bill Snapshot History Table (Keep all versions)
CREATE TABLE IF NOT EXISTS bill_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_type VARCHAR(50) NOT NULL, -- 'ORDER', 'INVOICE', 'QUOTATION'
    reference_id UUID NOT NULL,
    reference_number VARCHAR(100),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Bill Details
    paper_size VARCHAR(10) NOT NULL,
    bill_data JSONB NOT NULL, -- Complete bill structure
    preview_text TEXT, -- Plain text version
    html_content TEXT, -- HTML version
    pdf_url VARCHAR(500), -- If PDF generated
    
    -- Amounts
    subtotal DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2),
    balance_amount DECIMAL(15,2),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid'
    
    -- Metadata
    printed_at TIMESTAMP,
    emailed_at TIMESTAMP,
    whatsapp_sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100)
);

CREATE INDEX idx_bill_snapshots_reference ON bill_snapshots(reference_type, reference_id);
CREATE INDEX idx_bill_snapshots_customer ON bill_snapshots(customer_id);
CREATE INDEX idx_bill_snapshots_date ON bill_snapshots(created_at);
CREATE INDEX idx_bill_snapshots_status ON bill_snapshots(status);

-- Customer Bill History View
CREATE OR REPLACE VIEW v_customer_bill_history AS
SELECT 
    bs.id,
    bs.reference_type,
    bs.reference_id,
    bs.reference_number,
    bs.customer_id,
    bs.customer_name,
    bs.customer_phone,
    bs.paper_size,
    bs.subtotal,
    bs.discount_amount,
    bs.tax_amount,
    bs.total_amount,
    bs.paid_amount,
    bs.balance_amount,
    bs.status,
    bs.payment_status,
    bs.created_at,
    bs.printed_at,
    -- Last ending bill flag
    CASE 
        WHEN bs.status IN ('completed', 'cancelled') THEN true 
        ELSE false 
    END as is_ending_bill
FROM bill_snapshots bs
ORDER BY bs.created_at DESC;

-- Customer Last Bill Summary (Most Recent Ending Bill)
CREATE OR REPLACE VIEW v_customer_last_bill AS
SELECT DISTINCT ON (bs.customer_id)
    bs.customer_id,
    bs.id as last_bill_id,
    bs.reference_number as last_bill_number,
    bs.reference_type,
    bs.total_amount as last_total,
    bs.paid_amount as last_paid,
    bs.balance_amount as last_balance,
    bs.status as last_status,
    bs.payment_status as last_payment_status,
    bs.created_at as last_bill_date
FROM bill_snapshots bs
WHERE bs.status IN ('completed', 'cancelled')
ORDER BY bs.customer_id, bs.created_at DESC;

-- Function to get customer outstanding bills
CREATE OR REPLACE FUNCTION get_customer_outstanding(p_customer_id UUID)
RETURNS TABLE (
    total_pending DECIMAL,
    total_bills INT,
    oldest_pending_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(bs.balance_amount), 0) as total_pending,
        COUNT(*)::INT as total_bills,
        MIN(bs.created_at) as oldest_pending_date
    FROM bill_snapshots bs
    WHERE bs.customer_id = p_customer_id
      AND bs.payment_status IN ('pending', 'partial')
      AND bs.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Insert default printer settings for Counter 1
INSERT INTO printer_settings (counter_id, counter_name, paper_size, printer_type, auto_print)
VALUES ('COUNTER-1', 'Main Counter', '3x5', 'thermal', false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE printer_settings IS 'Printer configuration per counter/user';
COMMENT ON TABLE bill_snapshots IS 'Complete bill history with snapshots of what customer received';
COMMENT ON VIEW v_customer_bill_history IS 'Customer bill history with all transactions';
COMMENT ON VIEW v_customer_last_bill IS 'Most recent ending bill per customer';
