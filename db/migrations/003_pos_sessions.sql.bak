-- Migration: Add POS Sessions for Dual Panel Mode
-- Created: 2025-10-17
-- Purpose: Support multi-session POS billing

-- Create pos_sessions table
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    branch_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    cart_data JSONB DEFAULT '{"items":[],"totals":{}}'::jsonb,
    customer_id UUID,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Create pos_session_items table
CREATE TABLE IF NOT EXISTS pos_session_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(10,2) DEFAULT 0.00 CHECK (discount >= 0),
    tax_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (tax_rate >= 0),
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES pos_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_id ON pos_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_created_at ON pos_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_session_items_session_id ON pos_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_session_items_product_id ON pos_session_items(product_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pos_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pos_session_timestamp
    BEFORE UPDATE ON pos_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_session_timestamp();

-- Add comments
COMMENT ON TABLE pos_sessions IS 'POS billing sessions for dual-panel mode support';
COMMENT ON TABLE pos_session_items IS 'Items within POS billing sessions';
COMMENT ON COLUMN pos_sessions.status IS 'Session status: active, paused, or completed';
COMMENT ON COLUMN pos_sessions.cart_data IS 'JSON data containing cart details and metadata';

-- Rollback script (if needed)
-- DROP TABLE IF EXISTS pos_session_items CASCADE;
-- DROP TABLE IF EXISTS pos_sessions CASCADE;
-- DROP FUNCTION IF EXISTS update_pos_session_timestamp() CASCADE;
