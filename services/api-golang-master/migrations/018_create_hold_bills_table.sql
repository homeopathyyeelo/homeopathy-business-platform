-- Migration: Create pos_hold_bills table for temporarily held POS bills
-- This allows saving incomplete sales for later resumption

CREATE TABLE IF NOT EXISTS pos_hold_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    counter_id VARCHAR(50),  -- Made nullable, no FK constraint (counters table uses VARCHAR)
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Cart data stored as JSONB for flexibility
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Financial summary
    sub_total DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Additional metadata
    total_items INTEGER DEFAULT 0,
    billing_type VARCHAR(50) DEFAULT 'RETAIL',
    notes TEXT,
    
    -- Audit fields
    held_by UUID REFERENCES users(id) ON DELETE SET NULL,
    held_by_name VARCHAR(255),
    resumed_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_hold_bills_bill_number ON pos_hold_bills(bill_number);
CREATE INDEX idx_hold_bills_customer_id ON pos_hold_bills(customer_id);
CREATE INDEX idx_hold_bills_counter_id ON pos_hold_bills(counter_id);
CREATE INDEX idx_hold_bills_created_at ON pos_hold_bills(created_at);
CREATE INDEX idx_hold_bills_billing_type ON pos_hold_bills(billing_type);
CREATE INDEX idx_hold_bills_deleted_at ON pos_hold_bills(deleted_at); -- For soft deletes

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hold_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hold_bills_updated_at
    BEFORE UPDATE ON pos_hold_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_hold_bills_updated_at();

-- Comment on table
COMMENT ON TABLE pos_hold_bills IS 'Stores temporarily held POS bills for later resumption';
COMMENT ON COLUMN pos_hold_bills.items IS 'Cart items stored as JSONB array';
COMMENT ON COLUMN pos_hold_bills.resumed_count IS 'Tracks how many times this bill was resumed/edited';
