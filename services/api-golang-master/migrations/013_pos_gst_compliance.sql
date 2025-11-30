-- ============================================================================
-- POS & GST Compliance System Migration
-- Implements complete POS with multi-rate GST, ITC tracking, returns, and compliance
-- ============================================================================

-- Create enum types
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('RETAIL', 'WHOLESALE', 'B2B', 'B2C', 'EXPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_reason_type AS ENUM ('DAMAGED', 'EXPIRED', 'WRONG_PRODUCT', 'CUSTOMER_REQUEST', 'QUALITY_ISSUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 1. POS INVOICE TABLES
-- ============================================================================

-- Sales Invoices (POS)
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date TIMESTAMP NOT NULL DEFAULT NOW(),
    invoice_type invoice_type DEFAULT 'RETAIL',
    
    -- Customer details
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(200) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    customer_address TEXT,
    customer_gst_number VARCHAR(15),
    
    -- Financial breakdown
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    item_discount DECIMAL(15, 2) DEFAULT 0,
    bill_discount DECIMAL(15, 2) DEFAULT 0,
    bill_discount_percent DECIMAL(5, 2) DEFAULT 0,
    total_discount DECIMAL(15, 2) DEFAULT 0,
    taxable_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- GST breakdown (multi-rate support)
    cgst_5_percent DECIMAL(15, 2) DEFAULT 0,
    sgst_5_percent DECIMAL(15, 2) DEFAULT 0,
    igst_5_percent DECIMAL(15, 2) DEFAULT 0,
    cgst_18_percent DECIMAL(15, 2) DEFAULT 0,
    sgst_18_percent DECIMAL(15, 2) DEFAULT 0,
    igst_18_percent DECIMAL(15, 2) DEFAULT 0,
    total_gst DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Round off and total
    round_off DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- Payment details
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH', -- CASH, CARD, UPI, CREDIT
    payment_status VARCHAR(20) DEFAULT 'PAID', -- PAID, PARTIAL, PENDING, CREDIT
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    change_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Additional details
    notes TEXT,
    prescription_number VARCHAR(50),
    doctor_id UUID REFERENCES customers(id),
    doctor_name VARCHAR(200),
    
    -- Counter & Staff
    counter_id VARCHAR(50),
    counter_name VARCHAR(100),
    billed_by VARCHAR(100),
    
    -- E-Invoice & IRN
    irn VARCHAR(100),
    ack_no VARCHAR(50),
    ack_date TIMESTAMP,
    e_invoice_generated BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED', -- DRAFT, HELD, COMPLETED, CANCELLED, RETURNED
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(100),
    cancellation_reason TEXT,
    
    -- Tracking
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Invoice Items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    
    -- Product details
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    batch_id UUID REFERENCES inventory_batches(id),
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- HSN & Category
    hsn_code VARCHAR(20),
    category VARCHAR(100),
    brand VARCHAR(100),
    potency VARCHAR(50),
    form VARCHAR(50),
    
    -- Quantity & Pricing
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    mrp DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Tax calculation
    taxable_amount DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) NOT NULL, -- 5 or 18
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    total_gst DECIMAL(15, 2) NOT NULL,
    
    -- Line total
    line_total DECIMAL(15, 2) NOT NULL,
    
    -- Track if item was returned
    returned_quantity DECIMAL(10, 3) DEFAULT 0,
    is_returned BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. SALES RETURNS & CREDIT NOTES
-- ============================================================================

-- Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_no VARCHAR(50) UNIQUE NOT NULL,
    return_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Original invoice reference
    original_invoice_id UUID REFERENCES sales_invoices(id),
    original_invoice_no VARCHAR(50),
    original_invoice_date DATE,
    
    -- Customer details
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),
    customer_gst_number VARCHAR(15),
    
    -- Return reason
    return_reason return_reason_type NOT NULL,
    return_remarks TEXT,
    
    -- Financial breakdown
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_discount DECIMAL(15, 2) DEFAULT 0,
    taxable_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- GST breakdown
    cgst_5_percent DECIMAL(15, 2) DEFAULT 0,
    sgst_5_percent DECIMAL(15, 2) DEFAULT 0,
    igst_5_percent DECIMAL(15, 2) DEFAULT 0,
    cgst_18_percent DECIMAL(15, 2) DEFAULT 0,
    sgst_18_percent DECIMAL(15, 2) DEFAULT 0,
    igst_18_percent DECIMAL(15, 2) DEFAULT 0,
    total_gst DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- Refund details
    refund_method VARCHAR(20), -- CASH, CARD, CREDIT_NOTE, BANK_TRANSFER
    refund_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, REFUNDED, CREDITED
    refund_date TIMESTAMP,
    
    -- Credit note reference
    credit_note_id UUID,
    credit_note_no VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED', -- DRAFT, COMPLETED, CANCELLED
    
    -- Tracking
    returned_by VARCHAR(100),
    approved_by VARCHAR(100),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    
    -- Original invoice item reference
    original_item_id UUID REFERENCES sales_invoice_items(id),
    
    -- Product details
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    batch_id UUID REFERENCES inventory_batches(id),
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- HSN & Category
    hsn_code VARCHAR(20),
    
    -- Quantity & Pricing
    returned_quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Tax calculation
    taxable_amount DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) NOT NULL,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    total_gst DECIMAL(15, 2) NOT NULL,
    
    -- Line total
    line_total DECIMAL(15, 2) NOT NULL,
    
    -- Stock restock flag
    restocked BOOLEAN DEFAULT FALSE,
    restocked_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_no VARCHAR(50) UNIQUE NOT NULL,
    credit_note_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Customer details
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(200) NOT NULL,
    customer_gst_number VARCHAR(15),
    
    -- Related return
    return_id UUID REFERENCES sales_returns(id),
    return_no VARCHAR(50),
    
    -- Credit amount
    credit_amount DECIMAL(15, 2) NOT NULL,
    used_amount DECIMAL(15, 2) DEFAULT 0,
    balance_amount DECIMAL(15, 2) NOT NULL,
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, USED, EXPIRED, CANCELLED
    
    notes TEXT,
    
    -- Tracking
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. ITC (INPUT TAX CREDIT) LEDGER
-- ============================================================================

-- ITC Ledger (tracks GST paid on purchases for claiming ITC)
CREATE TABLE IF NOT EXISTS itc_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date TIMESTAMP NOT NULL DEFAULT NOW(),
    entry_type VARCHAR(20) NOT NULL, -- PURCHASE, RETURN, ADJUSTMENT
    
    -- Document reference
    document_type VARCHAR(20) NOT NULL, -- PURCHASE_INVOICE, DEBIT_NOTE, CREDIT_NOTE
    document_no VARCHAR(50) NOT NULL,
    document_date DATE NOT NULL,
    
    -- Vendor/Supplier details
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(200) NOT NULL,
    vendor_gst_number VARCHAR(15),
    
    -- HSN code
    hsn_code VARCHAR(20),
    
    -- Taxable amount
    taxable_amount DECIMAL(15, 2) NOT NULL,
    
    -- ITC amounts (input tax paid)
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    total_itc DECIMAL(15, 2) NOT NULL,
    
    -- ITC eligibility & utilization
    itc_eligible BOOLEAN DEFAULT TRUE,
    itc_claimed BOOLEAN DEFAULT FALSE,
    itc_claim_date DATE,
    itc_claim_period VARCHAR(20), -- e.g., "2024-03" for March 2024
    
    -- Reversal tracking
    reversed BOOLEAN DEFAULT FALSE,
    reversal_date DATE,
    reversal_reason TEXT,
    
    -- Tracking
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. DOCTOR COMMISSION TRACKING
-- ============================================================================

-- Doctor Commission Rules
CREATE TABLE IF NOT EXISTS doctor_commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES customers(id),
    doctor_name VARCHAR(200) NOT NULL,
    
    -- Commission type
    commission_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- PERCENTAGE, FLAT, SLAB
    
    -- Commission rates
    default_rate DECIMAL(5, 2) DEFAULT 0, -- e.g., 10.00 for 10%
    flat_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Category/Brand specific rates
    brand_id UUID REFERENCES brands(id),
    category_id UUID REFERENCES categories(id),
    specific_rate DECIMAL(5, 2),
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctor Commission Transactions
CREATE TABLE IF NOT EXISTS doctor_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Doctor details
    doctor_id UUID REFERENCES customers(id),
    doctor_name VARCHAR(200) NOT NULL,
    
    -- Invoice reference
    invoice_id UUID REFERENCES sales_invoices(id),
    invoice_no VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_amount DECIMAL(15, 2) NOT NULL,
    
    -- Commission calculation
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    
    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, CANCELLED
    payment_date DATE,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(100),
    
    -- Tracking
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. PRESCRIPTION LINKING
-- ============================================================================

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_no VARCHAR(50) UNIQUE NOT NULL,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Patient details
    patient_name VARCHAR(200) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(10),
    patient_phone VARCHAR(20),
    patient_address TEXT,
    
    -- Doctor details
    doctor_id UUID REFERENCES customers(id),
    doctor_name VARCHAR(200) NOT NULL,
    doctor_qualification VARCHAR(100),
    doctor_registration_no VARCHAR(50),
    
    -- Prescription details
    complaints TEXT,
    diagnosis TEXT,
    notes TEXT,
    
    -- Prescription image/scan
    image_url TEXT,
    
    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DISPENSED, EXPIRED, CANCELLED
    
    -- Linking to sales
    last_billed_date DATE,
    billing_count INT DEFAULT 0,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescription Items (medicines prescribed)
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    -- Product details
    product_id UUID REFERENCES products(id),
    medicine_name VARCHAR(200) NOT NULL,
    potency VARCHAR(50),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(50),
    quantity DECIMAL(10, 2),
    
    -- Dispensing tracking
    dispensed_quantity DECIMAL(10, 2) DEFAULT 0,
    pending_quantity DECIMAL(10, 2),
    
    instructions TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. HELD BILLS (PARK SALES)
-- ============================================================================

-- Held Bills
CREATE TABLE IF NOT EXISTS held_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hold_no VARCHAR(50) UNIQUE NOT NULL,
    
    -- Bill data (JSON for flexibility)
    bill_data JSONB NOT NULL,
    
    -- Customer details
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(200),
    
    -- Financial summary
    total_amount DECIMAL(15, 2),
    items_count INT,
    
    -- Counter details
    counter_id VARCHAR(50),
    held_by VARCHAR(100),
    held_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Status
    status VARCHAR(20) DEFAULT 'HELD', -- HELD, RESUMED, EXPIRED, CANCELLED
    resumed_at TIMESTAMP,
    resumed_by VARCHAR(100),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. PRICING LEVELS (MRP, DP, PTR, PTS)
-- ============================================================================

-- Product Pricing Tiers
CREATE TABLE IF NOT EXISTS product_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Multiple pricing levels
    mrp DECIMAL(15, 2) NOT NULL, -- Maximum Retail Price
    dp DECIMAL(15, 2), -- Dealer Price
    ptr DECIMAL(15, 2), -- Price to Retailer
    pts DECIMAL(15, 2), -- Price to Stockist
    wholesale_price DECIMAL(15, 2),
    
    -- Minimum selling price
    minimum_price DECIMAL(15, 2),
    
    -- Batch specific pricing
    batch_id UUID REFERENCES inventory_batches(id),
    
    -- Validity
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, batch_id, effective_from)
);

-- ============================================================================
-- 8. GST REPORTS & COMPLIANCE
-- ============================================================================

-- GST Return Periods
CREATE TABLE IF NOT EXISTS gst_return_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_month VARCHAR(7) NOT NULL, -- e.g., "2024-03" for March 2024
    period_year INT NOT NULL,
    
    -- Sales summary
    total_sales DECIMAL(15, 2) DEFAULT 0,
    taxable_sales DECIMAL(15, 2) DEFAULT 0,
    gst_collected DECIMAL(15, 2) DEFAULT 0,
    
    -- Purchase summary
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    taxable_purchases DECIMAL(15, 2) DEFAULT 0,
    gst_paid DECIMAL(15, 2) DEFAULT 0,
    itc_claimed DECIMAL(15, 2) DEFAULT 0,
    
    -- Net GST liability
    net_gst_payable DECIMAL(15, 2) DEFAULT 0,
    
    -- Filing status
    gstr1_filed BOOLEAN DEFAULT FALSE,
    gstr1_filed_date DATE,
    gstr3b_filed BOOLEAN DEFAULT FALSE,
    gstr3b_filed_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, FILED
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(period_month)
);

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_doctor ON sales_invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product ON sales_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_batch ON sales_invoice_items(batch_id);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_original_invoice ON sales_returns(original_invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);

-- ITC indexes
CREATE INDEX IF NOT EXISTS idx_itc_ledger_date ON itc_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_itc_ledger_vendor ON itc_ledger(vendor_id);
CREATE INDEX IF NOT EXISTS idx_itc_ledger_claim_period ON itc_ledger(itc_claim_period);

-- Commission indexes
CREATE INDEX IF NOT EXISTS idx_doctor_commissions_doctor ON doctor_commissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_commissions_invoice ON doctor_commissions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_doctor_commissions_payment_status ON doctor_commissions(payment_status);

-- Prescription indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Held bills indexes
CREATE INDEX IF NOT EXISTS idx_held_bills_held_at ON held_bills(held_at);
CREATE INDEX IF NOT EXISTS idx_held_bills_status ON held_bills(status);

-- ============================================================================
-- 10. TRIGGERS FOR AUTO-CALCULATIONS
-- ============================================================================

-- Trigger to update invoice totals
CREATE OR REPLACE FUNCTION update_sales_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate invoice totals when items change
    UPDATE sales_invoices
    SET 
        subtotal = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM sales_invoice_items WHERE invoice_id = NEW.invoice_id),
        item_discount = (SELECT COALESCE(SUM(discount_amount), 0) FROM sales_invoice_items WHERE invoice_id = NEW.invoice_id),
        total_gst = (SELECT COALESCE(SUM(total_gst), 0) FROM sales_invoice_items WHERE invoice_id = NEW.invoice_id),
        updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON sales_invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_sales_invoice_totals();

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Add comments
COMMENT ON TABLE sales_invoices IS 'POS sales invoices with multi-rate GST support';
COMMENT ON TABLE sales_returns IS 'Sales returns and refunds';
COMMENT ON TABLE credit_notes IS 'Credit notes for returns';
COMMENT ON TABLE itc_ledger IS 'Input Tax Credit ledger for GST compliance';
COMMENT ON TABLE doctor_commissions IS 'Doctor commission tracking';
COMMENT ON TABLE prescriptions IS 'Medical prescriptions for dispensing';
COMMENT ON TABLE held_bills IS 'Parked/held bills for later processing';
COMMENT ON TABLE product_pricing_tiers IS 'Multiple pricing levels (MRP, DP, PTR, PTS)';
COMMENT ON TABLE gst_return_periods IS 'GST return period summaries for GSTR-1/3B';
