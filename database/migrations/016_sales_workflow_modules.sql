-- Migration 016: Sales Workflow Modules
-- Hold Bills, Returns, Enhanced Payments, Commission Tracking
-- Created: 2025-12-04

-- =====================================================
-- 1. HOLD BILLS MODULE
-- =====================================================

-- Table: held_bills
CREATE TABLE IF NOT EXISTS held_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hold_number VARCHAR(50) UNIQUE NOT NULL,
    counter_id VARCHAR(50),
    counter_name VARCHAR(100),
    user_id UUID,
    user_name VARCHAR(100),
    
    -- Customer details (optional)
    customer_id UUID,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    
    -- Cart data stored as JSON
    cart_data JSONB NOT NULL,
    
    -- Financial summary
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    
    -- Metadata
    items_count INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Status and timestamps
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, RESUMED, DISCARDED
    hold_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    resumed_at TIMESTAMP,
    discarded_at TIMESTAMP,
    discarded_by VARCHAR(100),
    discard_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_held_bills_counter ON held_bills(counter_id);
CREATE INDEX idx_held_bills_user ON held_bills(user_id);
CREATE INDEX idx_held_bills_status ON held_bills(status);
CREATE INDEX idx_held_bills_expires ON held_bills(expires_at);

-- =====================================================
-- 2. RETURNS & CREDIT MODULE
-- =====================================================

-- Table: sales_returns (Credit Notes)
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(50) UNIQUE NOT NULL, -- CN-YYYYMMDD-XXXX
    
    -- Original invoice reference
    original_invoice_id UUID NOT NULL,
    original_invoice_no VARCHAR(50) NOT NULL,
    original_invoice_date TIMESTAMP,
    
    -- Customer details
    customer_id UUID,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_gstin VARCHAR(15),
    
    -- Return details
    return_date TIMESTAMP DEFAULT NOW(),
    return_reason VARCHAR(50), -- CHANGED_MIND, WRONG_ITEM, DEFECTIVE, EXPIRED, DOCTOR_CHANGED, OTHER
    return_reason_notes TEXT,
    
    -- Financial
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    
    -- Refund details
    refund_method VARCHAR(20), -- CASH, CARD, UPI, NEFT, STORE_CREDIT, EXCHANGE
    refund_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    refund_amount NUMERIC(15,2) DEFAULT 0,
    refund_reference VARCHAR(100),
    refunded_at TIMESTAMP,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(100),
    approval_timestamp TIMESTAMP,
    approval_notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED', -- DRAFT, COMPLETED, CANCELLED
    
    -- GST reversal
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Audit
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (original_invoice_id) REFERENCES sales_invoices(id)
);

CREATE INDEX idx_returns_invoice ON sales_returns(original_invoice_id);
CREATE INDEX idx_returns_customer ON sales_returns(customer_id);
CREATE INDEX idx_returns_date ON sales_returns(return_date);
CREATE INDEX idx_returns_status ON sales_returns(status);

-- Table: sales_return_items
CREATE TABLE IF NOT EXISTS sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL,
    
    -- Product reference
    product_id UUID,
    product_name VARCHAR(255),
    sku VARCHAR(100),
    
    -- Batch reference
    batch_id UUID,
    batch_number VARCHAR(100),
    
    -- Original sale reference
    original_sale_item_id UUID,
    
    -- Quantity and condition
    quantity_sold NUMERIC(10,2) NOT NULL,
    quantity_returned NUMERIC(10,2) NOT NULL,
    item_condition VARCHAR(20), -- RESALABLE, DAMAGED, EXPIRED, OPENED
    
    -- Pricing (from original sale)
    unit_price NUMERIC(15,2) NOT NULL,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    taxable_amount NUMERIC(15,2) DEFAULT 0,
    tax_percent NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    
    -- Stock adjustment
    stock_adjusted BOOLEAN DEFAULT FALSE,
    stock_adjustment_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE
);

CREATE INDEX idx_return_items_return ON sales_return_items(return_id);
CREATE INDEX idx_return_items_product ON sales_return_items(product_id);
CREATE INDEX idx_return_items_batch ON sales_return_items(batch_id);

-- =====================================================
-- 3. ENHANCED PAYMENTS MODULE
-- =====================================================

-- Table: payments (enhanced)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL, -- PAY-YYYYMMDD-XXXX
    
    -- Invoice/Customer reference
    invoice_id UUID, -- Nullable for advance payments
    invoice_no VARCHAR(50),
    customer_id UUID,
    customer_name VARCHAR(200),
    
    -- Payment details
    payment_date TIMESTAMP DEFAULT NOW(),
    payment_method VARCHAR(20) NOT NULL, -- CASH, CARD, UPI, NEFT, RTGS, CHEQUE, DD, STORE_CREDIT
    amount NUMERIC(15,2) NOT NULL,
    
    -- Transaction references
    transaction_ref_no VARCHAR(100),
    upi_transaction_id VARCHAR(100),
    card_last4 VARCHAR(4),
    
    -- Cheque details
    cheque_no VARCHAR(50),
    cheque_date DATE,
    cheque_bank_name VARCHAR(100),
    cheque_status VARCHAR(20), -- RECEIVED, DEPOSITED, CLEARED, BOUNCED, CANCELLED
    cheque_cleared_date TIMESTAMP,
    cheque_bounce_reason TEXT,
    
    -- Payment status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, REVERSED, REFUNDED
    reversal_reason TEXT,
    reversed_at TIMESTAMP,
    reversed_by VARCHAR(100),
    
    -- Payment proof
    payment_proof_url TEXT,
    
    -- Counter/User tracking
    counter_id VARCHAR(50),
    received_by VARCHAR(100),
    
    -- Reconciliation
    reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_date TIMESTAMP,
    bank_deposit_id UUID,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reconciled ON payments(reconciled);

-- Table: payment_allocations (for split payments across multiple invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    allocated_amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- Table: bank_deposits (cash deposit tracking)
CREATE TABLE IF NOT EXISTS bank_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_number VARCHAR(50) UNIQUE NOT NULL,
    deposit_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    deposit_slip_no VARCHAR(50),
    deposited_by VARCHAR(100),
    verified_by VARCHAR(100),
    verification_date TIMESTAMP,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bank_deposits_date ON bank_deposits(deposit_date);
CREATE INDEX idx_bank_deposits_status ON bank_deposits(status);

-- Table: customer_credits (store credit tracking)
CREATE TABLE IF NOT EXISTS customer_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    credit_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Source of credit
    source VARCHAR(20), -- RETURN, OVERPAYMENT, PROMOTIONAL, MANUAL
    source_reference_id UUID, -- return_id or payment_id
    source_reference_no VARCHAR(50),
    
    -- Amount tracking
    original_amount NUMERIC(15,2) NOT NULL,
    balance_amount NUMERIC(15,2) NOT NULL,
    used_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Validity
    issue_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FULLY_USED, EXPIRED, CANCELLED
    
    -- Notes
    notes TEXT,
    issued_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customer_credits_customer ON customer_credits(customer_id);
CREATE INDEX idx_customer_credits_status ON customer_credits(status);
CREATE INDEX idx_customer_credits_expiry ON customer_credits(expiry_date);

-- Table: customer_credit_usage (track usage of credits)
CREATE TABLE IF NOT EXISTS customer_credit_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    invoice_no VARCHAR(50),
    amount_used NUMERIC(15,2) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW(),
    used_by VARCHAR(100),
    
    FOREIGN KEY (credit_id) REFERENCES customer_credits(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

CREATE INDEX idx_credit_usage_credit ON customer_credit_usage(credit_id);
CREATE INDEX idx_credit_usage_invoice ON customer_credit_usage(invoice_id);

-- =====================================================
-- 4. COMMISSION TRACKING MODULE
-- =====================================================

-- Table: commission_beneficiaries (doctors, agents, affiliates, staff)
CREATE TABLE IF NOT EXISTS commission_beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_code VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_type VARCHAR(20) NOT NULL, -- DOCTOR, AGENT, AFFILIATE, STAFF
    
    -- Personal details
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    pan_number VARCHAR(10),
    address TEXT,
    
    -- Bank details (for payment)
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(11),
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    
    -- Metadata
    registration_date TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commission_beneficiaries_type ON commission_beneficiaries(beneficiary_type);
CREATE INDEX idx_commission_beneficiaries_status ON commission_beneficiaries(status);

-- Table: commission_rules
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Applicability
    beneficiary_id UUID,
    beneficiary_type VARCHAR(20), -- If null, applies to all of this type
    
    -- Commission structure
    commission_type VARCHAR(20) NOT NULL, -- PERCENTAGE, FLAT_AMOUNT, TIERED
    
    -- For PERCENTAGE type
    commission_rate NUMERIC(5,2), -- e.g., 5.00 for 5%
    
    -- For FLAT_AMOUNT type
    flat_amount NUMERIC(15,2),
    
    -- For TIERED type (stored as JSON)
    tier_config JSONB, -- [{min: 0, max: 100000, rate: 5}, {min: 100000, max: 500000, rate: 7}, ...]
    
    -- Calculation basis
    calculation_basis VARCHAR(20) DEFAULT 'INVOICE', -- INVOICE (booking basis) or PAYMENT (cash basis)
    
    -- Product applicability
    applicable_to VARCHAR(20) DEFAULT 'ALL', -- ALL, SPECIFIC_PRODUCTS, SPECIFIC_CATEGORIES
    product_ids JSONB, -- Array of product UUIDs if SPECIFIC_PRODUCTS
    category_ids JSONB, -- Array of category UUIDs if SPECIFIC_CATEGORIES
    
    -- Payment terms
    payment_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, ANNUAL, PER_TRANSACTION
    
    -- TDS
    tds_applicable BOOLEAN DEFAULT TRUE,
    tds_rate NUMERIC(5,2) DEFAULT 10.00, -- 10% default for commission
    
    -- Commission cap
    has_monthly_cap BOOLEAN DEFAULT FALSE,
    monthly_cap_amount NUMERIC(15,2),
    
    -- Validity period
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED
    
    -- Notes
    notes TEXT,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (beneficiary_id) REFERENCES commission_beneficiaries(id)
);

CREATE INDEX idx_commission_rules_beneficiary ON commission_rules(beneficiary_id);
CREATE INDEX idx_commission_rules_status ON commission_rules(status);
CREATE INDEX idx_commission_rules_dates ON commission_rules(start_date, end_date);

-- Table: commission_transactions
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Beneficiary
    beneficiary_id UUID NOT NULL,
    beneficiary_name VARCHAR(200),
    beneficiary_type VARCHAR(20),
    
    -- Source (invoice or payment)
    invoice_id UUID,
    invoice_no VARCHAR(50),
    payment_id UUID,
    
    -- Commission calculation
    rule_id UUID,
    sale_amount NUMERIC(15,2) NOT NULL,
    commission_rate NUMERIC(5,2),
    commission_amount NUMERIC(15,2) NOT NULL,
    
    -- TDS
    tds_applicable BOOLEAN DEFAULT FALSE,
    tds_rate NUMERIC(5,2),
    tds_amount NUMERIC(15,2) DEFAULT 0,
    net_payable NUMERIC(15,2) NOT NULL,
    
    -- Calculation period
    calculation_month INTEGER, -- 1-12
    calculation_year INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, REVERSED
    
    -- Approval
    approved_by VARCHAR(100),
    approval_timestamp TIMESTAMP,
    approval_notes TEXT,
    
    -- Payment
    paid_date TIMESTAMP,
    paid_by VARCHAR(100),
    payment_reference VARCHAR(100),
    payment_mode VARCHAR(20), -- CASH, CHEQUE, NEFT, UPI
    
    -- Reversal (for returns/cancellations)
    reversed BOOLEAN DEFAULT FALSE,
    reversal_reason TEXT,
    reversed_at TIMESTAMP,
    original_transaction_id UUID, -- If this is a reversal, reference to original
    
    -- Calculation timestamp
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    -- Audit
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (beneficiary_id) REFERENCES commission_beneficiaries(id),
    FOREIGN KEY (rule_id) REFERENCES commission_rules(id),
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX idx_commission_transactions_beneficiary ON commission_transactions(beneficiary_id);
CREATE INDEX idx_commission_transactions_invoice ON commission_transactions(invoice_id);
CREATE INDEX idx_commission_transactions_payment ON commission_transactions(payment_id);
CREATE INDEX idx_commission_transactions_status ON commission_transactions(status);
CREATE INDEX idx_commission_transactions_period ON commission_transactions(calculation_month, calculation_year);

-- Table: commission_payouts (monthly/quarterly payout batches)
CREATE TABLE IF NOT EXISTS commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Period
    payout_period_start DATE NOT NULL,
    payout_period_end DATE NOT NULL,
    payout_month INTEGER,
    payout_year INTEGER,
    
    -- Beneficiary
    beneficiary_id UUID NOT NULL,
    beneficiary_name VARCHAR(200),
    
    -- Financial summary
    total_commission NUMERIC(15,2) NOT NULL,
    total_tds NUMERIC(15,2) DEFAULT 0,
    net_payout NUMERIC(15,2) NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    
    -- Payment details
    payment_mode VARCHAR(20), -- CHEQUE, NEFT, UPI, CASH
    payment_reference VARCHAR(100),
    payment_date DATE,
    
    -- TDS certificate
    tds_certificate_issued BOOLEAN DEFAULT FALSE,
    tds_certificate_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, APPROVED, PAID, CANCELLED
    
    -- Approval
    approved_by VARCHAR(100),
    approval_timestamp TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (beneficiary_id) REFERENCES commission_beneficiaries(id)
);

CREATE INDEX idx_commission_payouts_beneficiary ON commission_payouts(beneficiary_id);
CREATE INDEX idx_commission_payouts_period ON commission_payouts(payout_period_start, payout_period_end);
CREATE INDEX idx_commission_payouts_status ON commission_payouts(status);

-- =====================================================
-- 5. ADDITIONAL SUPPORTING TABLES
-- =====================================================

-- Table: fraud_alerts (for serial returners, suspicious patterns)
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL, -- SERIAL_RETURNER, EXCESSIVE_RETURNS, PAYMENT_MISMATCH, etc.
    entity_type VARCHAR(20), -- CUSTOMER, INVOICE, RETURN, PAYMENT
    entity_id UUID,
    
    -- Alert details
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT,
    detected_pattern JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    
    -- Investigation
    investigated_by VARCHAR(100),
    investigation_notes TEXT,
    resolution_action TEXT,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_type ON fraud_alerts(alert_type);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_entity ON fraud_alerts(entity_type, entity_id);

-- =====================================================
-- 6. UPDATE EXISTING TABLES (Add missing columns)
-- =====================================================

-- Update sales_invoices table to add missing fields
DO $$ 
BEGIN
    -- Add due_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='due_date') THEN
        ALTER TABLE sales_invoices ADD COLUMN due_date DATE;
    END IF;
    
    -- Add balance_amount if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='balance_amount') THEN
        ALTER TABLE sales_invoices ADD COLUMN balance_amount NUMERIC(15,2) DEFAULT 0;
    END IF;
    
    -- Add updated_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='updated_at') THEN
        ALTER TABLE sales_invoices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Add credit_period_days if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='credit_period_days') THEN
        ALTER TABLE sales_invoices ADD COLUMN credit_period_days INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- 7. TRIGGERS FOR AUTO-CALCULATIONS
-- =====================================================

-- Trigger to auto-calculate balance_amount in sales_invoices
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate balance from total - amount_paid
    NEW.balance_amount := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
    
    -- Update payment_status based on balance
    IF NEW.balance_amount <= 0 THEN
        NEW.payment_status := 'PAID';
    ELSIF NEW.amount_paid > 0 AND NEW.balance_amount > 0 THEN
        NEW.payment_status := 'PARTIAL';
    ELSE
        NEW.payment_status := 'PENDING';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_balance
    BEFORE INSERT OR UPDATE ON sales_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_balance();

-- Trigger to update customer_credits balance when used
CREATE OR REPLACE FUNCTION update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update balance in customer_credits
    UPDATE customer_credits 
    SET balance_amount = original_amount - (
        SELECT COALESCE(SUM(amount_used), 0) 
        FROM customer_credit_usage 
        WHERE credit_id = NEW.credit_id
    ),
    used_amount = (
        SELECT COALESCE(SUM(amount_used), 0) 
        FROM customer_credit_usage 
        WHERE credit_id = NEW.credit_id
    ),
    status = CASE 
        WHEN balance_amount <= 0 THEN 'FULLY_USED'
        WHEN expiry_date < NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END
    WHERE id = NEW.credit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_balance
    AFTER INSERT ON customer_credit_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_balance();

-- =====================================================
-- 8. SEED DATA (Optional - default commission rules)
-- =====================================================

COMMENT ON TABLE held_bills IS 'Temporarily held POS bills - auto-expire after 7 days';
COMMENT ON TABLE sales_returns IS 'Credit notes for returned goods - linked to original invoices';
COMMENT ON TABLE payments IS 'All payment transactions with detailed tracking';
COMMENT ON TABLE commission_transactions IS 'Individual commission calculations per sale/payment';
COMMENT ON TABLE commission_payouts IS 'Monthly/quarterly commission payout batches';

-- End of migration
