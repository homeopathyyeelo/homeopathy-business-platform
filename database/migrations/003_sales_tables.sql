-- Sales Invoice Tables
-- Multi-channel sales: POS, Wholesale, Online Orders

-- Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) NOT NULL, -- POS_RETAIL, WHOLESALE, ONLINE_ORDER
    order_id UUID, -- For online orders
    shop_id UUID NOT NULL,
    customer_id UUID,
    invoice_date TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date DATE,
    credit_days INTEGER DEFAULT 0,
    
    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL,
    total_discount DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) NOT NULL,
    shipping_charges DECIMAL(12,2) DEFAULT 0,
    grand_total DECIMAL(15,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(20), -- cash, card, upi, credit
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, partial
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, cancelled
    
    -- Additional Info
    shipping_address JSONB,
    notes TEXT,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    confirmed_by UUID
);

CREATE INDEX idx_sales_invoices_shop ON sales_invoices(shop_id);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_type ON sales_invoices(invoice_type);

-- Sales Invoice Lines
CREATE TABLE IF NOT EXISTS sales_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    
    -- Product Info
    product_id UUID NOT NULL,
    product_name VARCHAR(255),
    batch_no VARCHAR(50),
    expiry_date DATE,
    
    -- Pricing
    qty DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    mrp DECIMAL(12,2),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Tax
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    hsn_code VARCHAR(20),
    
    -- Total
    line_total DECIMAL(15,2) NOT NULL,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_lines_invoice ON sales_invoice_lines(invoice_id);
CREATE INDEX idx_sales_lines_product ON sales_invoice_lines(product_id);

-- Sales Payments
CREATE TABLE IF NOT EXISTS sales_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id),
    payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_payments_invoice ON sales_payments(invoice_id);
CREATE INDEX idx_sales_payments_date ON sales_payments(payment_date);

-- Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES sales_invoices(id),
    shop_id UUID NOT NULL,
    customer_id UUID,
    return_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Amounts
    total_amount DECIMAL(15,2) NOT NULL,
    refund_amount DECIMAL(15,2) NOT NULL,
    refund_method VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reason TEXT,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMP
);

CREATE INDEX idx_sales_returns_invoice ON sales_returns(invoice_id);
CREATE INDEX idx_sales_returns_shop ON sales_returns(shop_id);
CREATE INDEX idx_sales_returns_date ON sales_returns(return_date);

-- Sales Return Lines
CREATE TABLE IF NOT EXISTS sales_return_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    invoice_line_id UUID REFERENCES sales_invoice_lines(id),
    product_id UUID NOT NULL,
    batch_no VARCHAR(50),
    qty DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_return_lines_return ON sales_return_lines(return_id);
CREATE INDEX idx_return_lines_product ON sales_return_lines(product_id);

-- Online Orders (E-commerce)
CREATE TABLE IF NOT EXISTS online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL,
    shipping_charges DECIMAL(12,2) DEFAULT 0,
    grand_total DECIMAL(15,2) NOT NULL,
    
    -- Shipping
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    
    -- Payment
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_gateway_ref VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, packed, shipped, delivered, cancelled
    
    -- Metadata
    source VARCHAR(20), -- website, app, marketplace
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE INDEX idx_online_orders_customer ON online_orders(customer_id);
CREATE INDEX idx_online_orders_shop ON online_orders(shop_id);
CREATE INDEX idx_online_orders_date ON online_orders(order_date);
CREATE INDEX idx_online_orders_status ON online_orders(status);

-- Online Order Lines
CREATE TABLE IF NOT EXISTS online_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_online_order_lines_order ON online_order_lines(order_id);
CREATE INDEX idx_online_order_lines_product ON online_order_lines(product_id);

-- Customer Ledger (For credit sales)
CREATE TABLE IF NOT EXISTS customer_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    transaction_type VARCHAR(20) NOT NULL, -- invoice, payment, return, adjustment
    reference_id UUID, -- invoice_id or payment_id
    reference_number VARCHAR(50),
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customer_ledger_customer ON customer_ledger(customer_id);
CREATE INDEX idx_customer_ledger_date ON customer_ledger(transaction_date);

-- Sales Summary (Materialized view for reporting)
CREATE TABLE IF NOT EXISTS sales_summary_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    shop_id UUID NOT NULL,
    invoice_type VARCHAR(20),
    
    -- Counts
    invoice_count INTEGER DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    
    -- Amounts
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_discount DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) DEFAULT 0,
    net_sales DECIMAL(15,2) DEFAULT 0,
    
    -- Payment
    cash_sales DECIMAL(15,2) DEFAULT 0,
    card_sales DECIMAL(15,2) DEFAULT 0,
    upi_sales DECIMAL(15,2) DEFAULT 0,
    credit_sales DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(summary_date, shop_id, invoice_type)
);

CREATE INDEX idx_sales_summary_date ON sales_summary_daily(summary_date);
CREATE INDEX idx_sales_summary_shop ON sales_summary_daily(shop_id);

-- Triggers for updating inventory on invoice confirmation
CREATE OR REPLACE FUNCTION update_inventory_on_sales()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'draft' THEN
        -- Inventory will be deducted by the application
        -- This trigger is for audit/logging
        INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
        VALUES (
            'sales_invoice',
            NEW.id,
            'sales.invoice.confirmed.v1',
            json_build_object(
                'invoice_id', NEW.id,
                'invoice_number', NEW.invoice_number,
                'grand_total', NEW.grand_total
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_invoice_confirmed
AFTER UPDATE ON sales_invoices
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_sales();

-- Function to calculate customer balance
CREATE OR REPLACE FUNCTION get_customer_balance(p_customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(debit - credit), 0)
    INTO v_balance
    FROM customer_ledger
    WHERE customer_id = p_customer_id;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO sales_invoices (invoice_number, invoice_type, shop_id, subtotal, total_tax, grand_total, status)
VALUES ('POS-20251023-0001', 'POS_RETAIL', gen_random_uuid(), 1000.00, 120.00, 1120.00, 'draft')
ON CONFLICT DO NOTHING;

SELECT 'Sales tables created successfully!' as result;
