-- Commission Rules
CREATE TABLE IF NOT EXISTS commission_rules (
    id VARCHAR(50) PRIMARY KEY,
    salesman_id VARCHAR(50) NOT NULL,
    rule_type VARCHAR(20) NOT NULL, -- percentage, fixed, tiered
    percentage DECIMAL(5,2) DEFAULT 0,
    fixed_amount DECIMAL(10,2) DEFAULT 0,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2) DEFAULT 0,
    product_category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission Payments
CREATE TABLE IF NOT EXISTS commission_payments (
    id VARCHAR(50) PRIMARY KEY,
    salesman_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20), -- cash, bank, upi
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Damages
CREATE TABLE IF NOT EXISTS inventory_damages (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    batch_no VARCHAR(50),
    quantity INT NOT NULL,
    reason VARCHAR(50), -- expired, damaged, obsolete, stolen
    notes TEXT,
    reported_by VARCHAR(50),
    shop_id VARCHAR(50),
    damage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    bundle_price DECIMAL(10,2) NOT NULL,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
    id VARCHAR(50) PRIMARY KEY,
    bundle_id VARCHAR(50) NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Cards
CREATE TABLE IF NOT EXISTS loyalty_cards (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    card_number VARCHAR(50) UNIQUE NOT NULL,
    points INT DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    qr_code VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id VARCHAR(50) PRIMARY KEY,
    card_id VARCHAR(50) NOT NULL REFERENCES loyalty_cards(id),
    type VARCHAR(20), -- earn, redeem, expire
    points INT NOT NULL,
    invoice_no VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Held Bills (POS)
CREATE TABLE IF NOT EXISTS pos_held_bills (
    id VARCHAR(50) PRIMARY KEY,
    counter_id VARCHAR(50),
    items JSONB,
    sub_total DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    customer_id VARCHAR(50),
    notes TEXT,
    held_by VARCHAR(50),
    held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS Counters
CREATE TABLE IF NOT EXISTS pos_counters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shop_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    current_user VARCHAR(50),
    registered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Estimates
CREATE TABLE IF NOT EXISTS sales_estimates (
    id VARCHAR(50) PRIMARY KEY,
    estimate_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50),
    items JSONB,
    sub_total DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    valid_until TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, rejected, converted
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link estimates to invoices
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS estimate_id VARCHAR(50);

-- WhatsApp Campaigns
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200),
    message TEXT NOT NULL,
    template_id VARCHAR(100),
    customer_ids JSONB,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sending, completed, failed
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Payment Gateway Transactions
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100),
    invoice_id VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    gateway VARCHAR(20), -- razorpay, stripe, paytm
    status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
    signature VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commission_rules_salesman ON commission_rules(salesman_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON loyalty_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_card ON loyalty_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_damages_product ON inventory_damages(product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_held_bills_counter ON pos_held_bills(counter_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer ON sales_estimates(customer_id);
