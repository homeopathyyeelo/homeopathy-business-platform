-- Purchase Bills Module Tables
-- Migration: Create purchase_bills and related tables

-- Main bills table
CREATE TABLE IF NOT EXISTS purchase_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED
    payment_terms TEXT,
    notes TEXT,
    attachment_urls TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill items (optional - for detailed tracking)
CREATE TABLE IF NOT EXISTS purchase_bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES purchase_bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS purchase_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES purchase_bills(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- CASH, BANK_TRANSFER, CHEQUE, UPI, CARD
    reference_no VARCHAR(100),
    status VARCHAR(50) DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED, VOID
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Returns table
CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_no VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    return_date DATE NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    total_refund DECIMAL(15,2) DEFAULT 0,
    refund_method VARCHAR(50),
    refund_status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES purchase_returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRN (Goods Receipt Note) tables
CREATE TABLE IF NOT EXISTS purchase_grn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_no VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    received_date DATE NOT NULL,
    received_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    qc_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PASSED, FAILED, PARTIAL
    warehouse_id UUID, -- Optional reference to warehouse
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID REFERENCES purchase_grn(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    ordered_qty INT,
    received_qty INT,
    damaged_qty INT DEFAULT 0,
    accepted_qty INT,
    batch_no VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor prices for comparison
CREATE TABLE IF NOT EXISTS vendor_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(15,2) NOT NULL,
    min_order_qty INT DEFAULT 1,
    valid_from DATE,
    valid_to DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON purchase_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_order ON purchase_bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON purchase_bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_date ON purchase_bills(bill_date);

CREATE INDEX IF NOT EXISTS idx_payments_vendor ON purchase_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON purchase_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON purchase_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_returns_vendor ON purchase_returns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON purchase_returns(order_id);

CREATE INDEX IF NOT EXISTS idx_grn_order ON purchase_grn(order_id);
CREATE INDEX IF NOT EXISTS idx_grn_date ON purchase_grn(received_date);

CREATE INDEX IF NOT EXISTS idx_vendor_prices_vendor ON vendor_prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_prices_product ON vendor_prices(product_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_bills_updated_at BEFORE UPDATE ON purchase_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_payments_updated_at BEFORE UPDATE ON purchase_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_returns_updated_at BEFORE UPDATE ON purchase_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_grn_updated_at BEFORE UPDATE ON purchase_grn
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
