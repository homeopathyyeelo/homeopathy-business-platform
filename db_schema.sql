-- Database Schema Updates for HomeoERP Enterprise Platform
-- This file contains all missing tables and relationships needed for RetailDaddy/MargERP parity

-- ==================== SALES & INVOICING TABLES ====================

-- Invoice series for multiple numbering schemes
CREATE TABLE IF NOT EXISTS invoice_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL,
    current_number INTEGER NOT NULL DEFAULT 1,
    starting_number INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'paid', 'overdue')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial_paid', 'paid', 'refunded')),
    payment_terms VARCHAR(100),
    notes TEXT,
    salesman_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    invoice_series_id UUID REFERENCES invoice_series(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0 CHECK (tax_percent >= 0 AND tax_percent <= 100),
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Sales orders/quotations
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial_paid', 'paid')),
    payment_terms VARCHAR(100),
    notes TEXT,
    salesman_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Sales order items
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0 CHECK (tax_percent >= 0 AND tax_percent <= 100),
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Returns and credit notes
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(100) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    refund_method VARCHAR(50),
    refund_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Return items
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    invoice_item_id UUID NOT NULL REFERENCES invoice_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    reason VARCHAR(255) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    processed_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    bank_reference VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Salesman commissions
CREATE TABLE IF NOT EXISTS salesman_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesman_id UUID NOT NULL REFERENCES users(id),
    salesman_name VARCHAR(255) NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    commission_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
    calculation_basis VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ==================== PURCHASES & VENDORS TABLES ====================

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_delivery TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0 CHECK (tax_percent >= 0 AND tax_percent <= 100),
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS grn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    receipt_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- GRN items
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES grn(id) ON DELETE CASCADE,
    purchase_order_item_id UUID REFERENCES purchase_order_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    ordered_quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL,
    accepted_quantity INTEGER NOT NULL,
    rejected_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    condition VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Vendor invoices
CREATE TABLE IF NOT EXISTS vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'paid', 'overdue')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial_paid', 'paid', 'refunded')),
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ==================== FINANCE & ACCOUNTING TABLES ====================

-- Chart of accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Journal entry lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Cash book entries
CREATE TABLE IF NOT EXISTS cash_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    receipt_number VARCHAR(100),
    payment_voucher VARCHAR(100),
    description TEXT,
    cash_in DECIMAL(15,2) DEFAULT 0,
    cash_out DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Bank book entries
CREATE TABLE IF NOT EXISTS bank_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    cheque_number VARCHAR(100),
    description TEXT,
    deposit DECIMAL(15,2) DEFAULT 0,
    withdrawal DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expense_number VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    description TEXT,
    receipt_path VARCHAR(500),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ==================== REPORTING & ANALYTICS TABLES ====================

-- Sales reports cache
CREATE TABLE IF NOT EXISTS sales_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(report_type, report_date)
);

-- Inventory reports cache
CREATE TABLE IF NOT EXISTS inventory_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(report_type, report_date)
);

-- ==================== MARKETING & COMMUNICATION TABLES ====================

-- Marketing campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('whatsapp', 'sms', 'email', 'social')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),
    target_audience JSONB,
    message_template TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- WhatsApp message logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    recipient_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    whatsapp_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ==================== HR & USER MANAGEMENT TABLES ====================

-- Users (employees)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    employee_code VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    date_of_joining DATE,
    salary DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles and permissions
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User roles assignment
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ==================== SETTINGS & CONFIGURATION TABLES ====================

-- Company information
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    gst_number VARCHAR(50),
    pan_number VARCHAR(20),
    logo_path VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Branches/locations
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(20),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB,
    config_type VARCHAR(50) NOT NULL DEFAULT 'json',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_salesman_id ON invoices(salesman_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Product inventory indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_group_id ON customers(group_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ==================== VIEWS FOR REPORTING ====================

-- Sales summary view
CREATE OR REPLACE VIEW sales_summary AS
SELECT
    DATE(invoice_date) as date,
    COUNT(*) as invoice_count,
    SUM(total_amount) as total_sales,
    SUM(paid_amount) as total_paid,
    SUM(outstanding_amount) as total_outstanding,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
FROM invoices
WHERE is_active = true
GROUP BY DATE(invoice_date)
ORDER BY date DESC;

-- Inventory summary view
CREATE OR REPLACE VIEW inventory_summary AS
SELECT
    p.id,
    p.name,
    p.product_code,
    COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0) as current_stock,
    p.min_stock_level,
    p.max_stock_level,
    CASE WHEN p.min_stock_level > 0 AND
        (COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0)) <= p.min_stock_level
    THEN true ELSE false END as is_low_stock
FROM products p
LEFT JOIN inventory_levels il ON p.id = il.product_id AND il.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.name, p.product_code, p.min_stock_level, p.max_stock_level;

-- ==================== FUNCTIONS FOR BUSINESS LOGIC ====================

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE invoices SET
        subtotal = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM invoice_items
            WHERE invoice_id = invoice_uuid AND is_active = true
        ),
        tax_amount = (
            SELECT COALESCE(SUM(tax_amount), 0)
            FROM invoice_items
            WHERE invoice_id = invoice_uuid AND is_active = true
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM invoice_items
            WHERE invoice_id = invoice_uuid AND is_active = true
        ),
        outstanding_amount = (
            SELECT COALESCE(SUM(total_amount), 0) - COALESCE(SUM(paid_amount), 0)
            FROM invoice_items ii
            LEFT JOIN payments p ON ii.invoice_id = p.invoice_id
            WHERE ii.invoice_id = invoice_uuid AND ii.is_active = true AND p.is_active = true
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = invoice_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory levels
CREATE OR REPLACE FUNCTION update_inventory_level(
    product_uuid UUID,
    quantity_change INTEGER,
    transaction_type VARCHAR(10),
    reference_id UUID DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_level_id UUID;
    current_level inventory_levels%ROWTYPE;
BEGIN
    -- Get current inventory level
    SELECT * INTO current_level
    FROM inventory_levels
    WHERE product_id = product_uuid AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Insert new inventory level
    INSERT INTO inventory_levels (
        product_id,
        previous_quantity,
        quantity,
        transaction_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        product_uuid,
        COALESCE(current_level.quantity, 0),
        COALESCE(current_level.quantity, 0) + quantity_change,
        transaction_type,
        reference_id,
        notes,
        CURRENT_USER::UUID
    ) RETURNING id INTO new_level_id;

    RETURN new_level_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS FOR AUTOMATION ====================

-- Trigger to update invoice totals when items change
CREATE OR REPLACE FUNCTION trigger_update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        PERFORM calculate_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_items_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION trigger_update_invoice_totals();

-- Trigger to update payment status when payments change
CREATE OR REPLACE FUNCTION trigger_update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        UPDATE invoices SET
            paid_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
                AND status = 'completed' AND is_active = true
            ),
            payment_status = CASE
                WHEN (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
                    AND status = 'completed' AND is_active = true
                ) >= total_amount THEN 'paid'
                WHEN (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
                    AND status = 'completed' AND is_active = true
                ) > 0 THEN 'partial_paid'
                ELSE 'unpaid'
            END,
            outstanding_amount = total_amount - (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
                AND status = 'completed' AND is_active = true
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_payment_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_payment_status();

-- ==================== SAMPLE DATA FOR TESTING ====================

-- Insert default invoice series
INSERT INTO invoice_series (name, prefix, current_number, description) VALUES
('Default Series', 'INV', 1001, 'Default invoice numbering series'),
('Retail Series', 'RTL', 2001, 'Retail customer invoice series'),
('Wholesale Series', 'WHL', 3001, 'Wholesale customer invoice series')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('ADMIN', 'System Administrator', '["*"]'),
('MANAGER', 'Branch Manager', '["read", "write", "manage_users"]'),
('SALES', 'Sales Executive', '["read", "write_sales", "read_customers"]'),
('ACCOUNTANT', 'Accountant', '["read", "write_finance", "read_reports"]'),
('WAREHOUSE', 'Warehouse Staff', '["read", "write_inventory"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('1000', 'Cash', 'asset'),
('1100', 'Bank', 'asset'),
('1200', 'Accounts Receivable', 'asset'),
('1300', 'Inventory', 'asset'),
('2000', 'Accounts Payable', 'liability'),
('3000', 'Equity', 'equity'),
('4000', 'Sales Revenue', 'income'),
('5000', 'Cost of Goods Sold', 'expense'),
('5100', 'Operating Expenses', 'expense')
ON CONFLICT (account_code) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('invoice_settings', '{"auto_approve": false, "default_payment_terms": "30 days", "require_approval": true}', 'Invoice configuration'),
('tax_settings', '{"gst_enabled": true, "default_gst_rate": 18, "hsn_required": true}', 'Tax configuration'),
('company_info', '{"name": "Yeelo Homeopathy", "gst": "22AAAAA0000A1Z5", "address": "Default Address"}', 'Company information')
ON CONFLICT (config_key) DO NOTHING;

-- ==================== COMMENTS FOR DOCUMENTATION ====================

/*
ADDITIONAL TABLES NEEDED (not included in this schema):

1. loyalty_programs - Customer loyalty and rewards
2. loyalty_points - Points tracking for customers
3. gift_cards - Gift card management
4. doctor_profiles - Homeopathy doctor information
5. patient_records - Patient medical records (GDPR compliant)
6. prescriptions - Prescription management
7. treatment_plans - Treatment tracking
8. appointment_schedules - Doctor appointment booking
9. medical_history - Patient medical history
10. drug_interactions - Medicine interaction warnings
11. quality_control - Medicine quality testing
12. batch_production - Medicine manufacturing batches
13. supply_chain_events - Supply chain tracking events
14. transportation_logs - Logistics and delivery tracking
15. compliance_audits - Regulatory compliance tracking
16. training_records - Employee training records
17. performance_reviews - Employee performance tracking
18. leave_management - Employee leave tracking
19. asset_management - Company asset tracking
20. maintenance_schedules - Equipment maintenance

These tables would be added in Phase 2 of the implementation.
*/
