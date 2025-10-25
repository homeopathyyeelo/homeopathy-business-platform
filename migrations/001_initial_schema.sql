-- HomeoERP Database Schema Migration
-- Run this to create all tables for the HomeoERP system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF', 'MARKETER', 'CASHIER', 'DOCTOR', 'PHARMACIST')),
    shop_id INTEGER REFERENCES shops(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Product brands table
CREATE TABLE IF NOT EXISTS product_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_categories(id),
    brand_id INTEGER REFERENCES product_brands(id),
    hsn_code VARCHAR(10),
    form VARCHAR(100), -- Mother Tincture, Biochemic, Dilution, etc.
    potency VARCHAR(50), -- 30C, 200C, 1M, etc.
    pack_size VARCHAR(50),
    mrp DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    min_stock INTEGER DEFAULT 10,
    max_stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    customer_type VARCHAR(50), -- Retail, Wholesale, Doctor, Distributor
    group_id INTEGER,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding DECIMAL(12,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Customer groups table
CREATE TABLE IF NOT EXISTS customer_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Inventory batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_no VARCHAR(100) NOT NULL,
    expiry_date DATE,
    mfg_date DATE,
    quantity INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    landed_cost DECIMAL(10,2),
    mrp DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(shop_id, product_id, batch_no)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sale_type VARCHAR(50), -- Retail, Wholesale, Online, Doctor
    sub_total DECIMAL(12,2),
    discount DECIMAL(12,2),
    tax DECIMAL(12,2),
    total DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50), -- Paid, Pending, Partially Paid
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id INTEGER REFERENCES inventory_batches(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    po_no VARCHAR(50) UNIQUE NOT NULL,
    po_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50), -- Draft, Sent, Approved, Received, Cancelled
    sub_total DECIMAL(12,2),
    discount DECIMAL(12,2),
    tax DECIMAL(12,2),
    total DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2) NOT NULL,
    received_qty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Purchase receipts table
CREATE TABLE IF NOT EXISTS purchase_receipts (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    receipt_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50), -- Draft, Posted, Cancelled
    total DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Purchase receipt items table
CREATE TABLE IF NOT EXISTS purchase_receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    purchase_item_id INTEGER NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_no VARCHAR(100),
    expiry_date DATE,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    landed_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    approved_by INTEGER REFERENCES users(id),
    receipt VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    purchase_id INTEGER REFERENCES purchases(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    salary DECIMAL(12,2),
    joining_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5,2),
    status VARCHAR(50), -- Present, Absent, Late, Half Day
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(employee_id, date)
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(12,2),
    hra DECIMAL(12,2),
    da DECIMAL(12,2),
    ta DECIMAL(12,2),
    other_allowance DECIMAL(12,2),
    deductions DECIMAL(12,2),
    gross_salary DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    status VARCHAR(50), -- Draft, Processed, Paid
    processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(employee_id, month, year)
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- reorder, pricing, marketing
    product_id INTEGER REFERENCES products(id),
    suggestion TEXT NOT NULL,
    confidence DECIMAL(5,4),
    status VARCHAR(50), -- pending, approved, rejected
    applied BOOLEAN DEFAULT FALSE,
    applied_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- whatsapp, sms, email
    target VARCHAR(50), -- all, group, segment
    message TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50), -- draft, scheduled, sent, failed
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(po_date);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor ON purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory_batches(product_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory_batches(shop_id);

-- Insert default permissions
INSERT INTO permissions (code, name, description, category) VALUES
-- Core permissions
('PERM_DASHBOARD', 'Dashboard Access', 'Access to dashboard and overview', 'Core'),
('PERM_DASHBOARD_VIEW', 'Dashboard View', 'View dashboard data and metrics', 'Core'),

-- Products
('PERM_PRODUCTS_READ', 'Products Read', 'View products', 'Products'),
('PERM_PRODUCTS_CREATE', 'Products Create', 'Create new products', 'Products'),
('PERM_PRODUCTS_UPDATE', 'Products Update', 'Edit existing products', 'Products'),
('PERM_PRODUCTS_DELETE', 'Products Delete', 'Delete products', 'Products'),
('PERM_PRODUCTS_CATEGORIES', 'Products Categories', 'Manage product categories', 'Products'),
('PERM_PRODUCTS_BRANDS', 'Products Brands', 'Manage product brands', 'Products'),
('PERM_PRODUCTS_BATCHES', 'Products Batches', 'Manage product batches', 'Products'),
('PERM_PRODUCTS_PRICING', 'Products Pricing', 'Manage product pricing', 'Products'),
('PERM_PRODUCTS_IMPORT', 'Products Import', 'Import products from files', 'Products'),

-- Inventory
('PERM_INVENTORY_VIEW', 'Inventory View', 'View inventory data', 'Inventory'),
('PERM_INVENTORY_READ', 'Inventory Read', 'Read inventory information', 'Inventory'),
('PERM_INVENTORY_STOCK', 'Inventory Stock', 'Manage stock levels', 'Inventory'),
('PERM_INVENTORY_EXPIRE_VIEW', 'Inventory Expiry View', 'View expiry information', 'Inventory'),
('PERM_INVENTORY_BULK', 'Inventory Bulk', 'Bulk inventory operations', 'Inventory'),
('PERM_INVENTORY_COMBO', 'Inventory Combo', 'Create combo/kit products', 'Inventory'),
('PERM_INVENTORY_ADJUST', 'Inventory Adjust', 'Adjust inventory quantities', 'Inventory'),
('PERM_INVENTORY_TRANSFER', 'Inventory Transfer', 'Transfer inventory between locations', 'Inventory'),
('PERM_INVENTORY_DAMAGE', 'Inventory Damage', 'Record damaged inventory', 'Inventory'),
('PERM_STOCK_DIRECT', 'Stock Direct', 'Direct stock entry without PO', 'Inventory'),
('PERM_BARCODE_DESIGN', 'Barcode Design', 'Design and print barcodes', 'Inventory'),

-- Sales
('PERM_SALES_VIEW', 'Sales View', 'View sales data', 'Sales'),
('PERM_SALES_READ', 'Sales Read', 'Read sales information', 'Sales'),
('PERM_SALES_CREATE', 'Sales Create', 'Create new sales', 'Sales'),
('PERM_SALES_UPDATE', 'Sales Update', 'Update sales data', 'Sales'),
('PERM_SALES_DELETE', 'Sales Delete', 'Delete sales records', 'Sales'),
('PERM_SALES_RETURN', 'Sales Return', 'Process sales returns', 'Sales'),
('PERM_SALES_ORDERS', 'Sales Orders', 'Manage sales orders', 'Sales'),
('PERM_SALES_INVOICES', 'Sales Invoices', 'Manage invoices', 'Sales'),
('PERM_SALES_RECEIPTS', 'Sales Receipts', 'Manage receipts', 'Sales'),
('PERM_POS_USE', 'POS Use', 'Use POS terminal', 'Sales'),
('PERM_POS_DUAL', 'POS Dual', 'Use dual screen POS', 'Sales'),
('PERM_POS_HOLD', 'POS Hold', 'Hold and resume bills', 'Sales'),
('PERM_SALES_CONVERT', 'Sales Convert', 'Convert estimates to invoices', 'Sales'),
('PERM_SALES_TEMPLATE', 'Sales Template', 'Customize bill templates', 'Sales'),
('PERM_SALES_GIFTCARD', 'Sales Giftcard', 'Manage gift cards and vouchers', 'Sales'),

-- Purchases
('PERM_PURCHASES_VIEW', 'Purchases View', 'View purchase data', 'Purchases'),
('PERM_PURCHASES_READ', 'Purchases Read', 'Read purchase information', 'Purchases'),
('PERM_PURCHASES_CREATE', 'Purchases Create', 'Create purchase orders', 'Purchases'),
('PERM_PURCHASES_UPDATE', 'Purchases Update', 'Update purchase orders', 'Purchases'),
('PERM_PURCHASES_DELETE', 'Purchases Delete', 'Delete purchase orders', 'Purchases'),
('PERM_PURCHASES_ORDERS', 'Purchases Orders', 'Manage purchase orders', 'Purchases'),
('PERM_PURCHASES_GRN', 'Purchases GRN', 'Manage goods receipt notes', 'Purchases'),
('PERM_PURCHASES_RECEIVE', 'Purchases Receive', 'Receive purchase orders', 'Purchases'),
('PERM_PURCHASES_RECON', 'Purchases Recon', 'Reconcile purchase invoices', 'Purchases'),
('PERM_PURCHASES_RETURN', 'Purchases Return', 'Process purchase returns', 'Purchases'),
('PERM_PURCHASES_VENDORS', 'Purchases Vendors', 'Manage vendors', 'Purchases'),
('PERM_PURCHASES_PAYMENTS', 'Purchases Payments', 'Manage vendor payments', 'Purchases'),
('PERM_PURCHASES_COMPARISON', 'Purchases Comparison', 'Compare vendor prices', 'Purchases'),
('PERM_PURCHASES_HISTORY', 'Purchases History', 'View purchase history', 'Purchases'),
('PERM_PURCHASES_AI', 'Purchases AI', 'AI-powered purchase suggestions', 'Purchases'),

-- Customers
('PERM_CUSTOMERS_VIEW', 'Customers View', 'View customer data', 'Customers'),
('PERM_CUSTOMERS_READ', 'Customers Read', 'Read customer information', 'Customers'),
('PERM_CUSTOMERS_CREATE', 'Customers Create', 'Create new customers', 'Customers'),
('PERM_CUSTOMERS_UPDATE', 'Customers Update', 'Update customer data', 'Customers'),
('PERM_CUSTOMERS_DELETE', 'Customers Delete', 'Delete customers', 'Customers'),
('PERM_CUSTOMERS_GROUPS', 'Customers Groups', 'Manage customer groups', 'Customers'),
('PERM_CUSTOMERS_LOYALTY', 'Customers Loyalty', 'Manage loyalty programs', 'Customers'),
('PERM_CUSTOMERS_BULK_EDIT', 'Customers Bulk Edit', 'Bulk edit customers', 'Customers'),
('PERM_CUSTOMERS_LEDGER', 'Customers Ledger', 'View customer ledgers', 'Customers'),

-- Vendors
('PERM_VENDORS_VIEW', 'Vendors View', 'View vendor data', 'Vendors'),
('PERM_VENDORS_READ', 'Vendors Read', 'Read vendor information', 'Vendors'),
('PERM_VENDORS_CREATE', 'Vendors Create', 'Create new vendors', 'Vendors'),
('PERM_VENDORS_UPDATE', 'Vendors Update', 'Update vendor data', 'Vendors'),
('PERM_VENDORS_DELETE', 'Vendors Delete', 'Delete vendors', 'Vendors'),
('PERM_VENDORS_LEDGER', 'Vendors Ledger', 'View vendor ledgers', 'Vendors'),
('PERM_VENDORS_PERFORMANCE', 'Vendors Performance', 'View vendor performance', 'Vendors'),
('PERM_VENDORS_BULK_UPDATE', 'Vendors Bulk Update', 'Bulk update vendors', 'Vendors'),

-- Finance
('PERM_FINANCE_VIEW', 'Finance View', 'View finance data', 'Finance'),
('PERM_FINANCE_READ', 'Finance Read', 'Read financial information', 'Finance'),
('PERM_FINANCE_WRITE', 'Finance Write', 'Write financial data', 'Finance'),
('PERM_FINANCE_LEDGERS', 'Finance Ledgers', 'Manage general ledgers', 'Finance'),
('PERM_FINANCE_EXPENSES', 'Finance Expenses', 'Manage expenses', 'Finance'),
('PERM_FINANCE_COMMISSION', 'Finance Commission', 'Manage commissions', 'Finance'),
('PERM_FINANCE_CREDIT', 'Finance Credit', 'Manage credit limits', 'Finance'),
('PERM_FINANCE_GATEWAY', 'Finance Gateway', 'Payment gateway management', 'Finance'),
('PERM_FINANCE_BANK_RECON', 'Finance Bank Recon', 'Bank reconciliation', 'Finance'),
('PERM_FINANCE_GST', 'Finance GST', 'GST management and reports', 'Finance'),
('PERM_FINANCE_REPORTS', 'Finance Reports', 'Financial reports', 'Finance'),
('PERM_SUPPLIER_PAY', 'Supplier Pay', 'Process supplier payments', 'Finance'),

-- HR
('PERM_HR_VIEW', 'HR View', 'View HR data', 'HR'),
('PERM_HR_READ', 'HR Read', 'Read HR information', 'HR'),
('PERM_HR_WRITE', 'HR Write', 'Write HR data', 'HR'),
('PERM_HR_EMPLOYEES', 'HR Employees', 'Manage employees', 'HR'),
('PERM_HR_ATTENDANCE', 'HR Attendance', 'Manage attendance', 'HR'),
('PERM_HR_PAYROLL', 'HR Payroll', 'Manage payroll', 'HR'),
('PERM_HR_LEAVES', 'HR Leaves', 'Manage leaves', 'HR'),
('PERM_HR_PERFORMANCE', 'HR Performance', 'Performance management', 'HR'),

-- Reports
('PERM_REPORTS_VIEW', 'Reports View', 'View reports', 'Reports'),
('PERM_REPORTS_SALES', 'Reports Sales', 'Sales reports', 'Reports'),
('PERM_REPORTS_PURCHASE', 'Reports Purchase', 'Purchase reports', 'Reports'),
('PERM_REPORTS_INVENTORY', 'Reports Inventory', 'Inventory reports', 'Reports'),
('PERM_REPORTS_FINANCE', 'Reports Finance', 'Financial reports', 'Reports'),
('PERM_REPORTS_GST', 'Reports GST', 'GST reports', 'Reports'),
('PERM_REPORTS_PROFIT_LOSS', 'Reports Profit Loss', 'Profit and loss reports', 'Reports'),
('PERM_REPORTS_BALANCE_SHEET', 'Reports Balance Sheet', 'Balance sheet reports', 'Reports'),
('PERM_REPORTS_CUSTOM', 'Reports Custom', 'Custom reports', 'Reports'),

-- Analytics
('PERM_ANALYTICS_VIEW', 'Analytics View', 'View analytics', 'Analytics'),
('PERM_ANALYTICS_SALES', 'Analytics Sales', 'Sales analytics', 'Analytics'),
('PERM_ANALYTICS_INVENTORY', 'Analytics Inventory', 'Inventory analytics', 'Analytics'),
('PERM_ANALYTICS_CUSTOMER', 'Analytics Customer', 'Customer analytics', 'Analytics'),
('PERM_ANALYTICS_FORECASTING', 'Analytics Forecasting', 'Demand forecasting', 'Analytics'),
('PERM_ANALYTICS_KPIS', 'Analytics KPIs', 'KPI dashboard', 'Analytics'),

-- Marketing
('PERM_MARKETING_VIEW', 'Marketing View', 'View marketing data', 'Marketing'),
('PERM_MARKETING_READ', 'Marketing Read', 'Read marketing information', 'Marketing'),
('PERM_MARKETING_WRITE', 'Marketing Write', 'Write marketing data', 'Marketing'),
('PERM_MARKETING_CAMPAIGNS', 'Marketing Campaigns', 'Manage campaigns', 'Marketing'),
('PERM_MARKETING_CATALOGUE', 'Marketing Catalogue', 'Digital catalogue management', 'Marketing'),
('PERM_MARKETING_WHATSAPP', 'Marketing WhatsApp', 'WhatsApp marketing', 'Marketing'),
('PERM_MARKETING_WHATSAPP_SCHEDULE', 'Marketing WhatsApp Schedule', 'Schedule WhatsApp messages', 'Marketing'),
('PERM_MARKETING_SMS', 'Marketing SMS', 'SMS campaigns', 'Marketing'),
('PERM_MARKETING_EMAIL', 'Marketing Email', 'Email campaigns', 'Marketing'),
('PERM_MARKETING_TEMPLATES', 'Marketing Templates', 'Manage templates', 'Marketing'),

-- CRM
('PERM_CRM_READ', 'CRM Read', 'Read CRM data', 'CRM'),
('PERM_CRM_WRITE', 'CRM Write', 'Write CRM data', 'CRM'),
('PERM_CRM_VIEW', 'CRM View', 'View CRM information', 'CRM'),
('PERM_CRM_WHATSAPP', 'CRM WhatsApp', 'WhatsApp integration', 'CRM'),
('PERM_CRM_LOYALTY', 'CRM Loyalty', 'Loyalty program management', 'CRM'),
('PERM_CRM_BULK_EDIT', 'CRM Bulk Edit', 'Bulk customer operations', 'CRM'),

-- AI
('PERM_AI_READ', 'AI Read', 'Read AI data', 'AI'),
('PERM_AI_WRITE', 'AI Write', 'Write AI data', 'AI'),
('PERM_AI_VIEW', 'AI View', 'View AI features', 'AI'),
('PERM_AI_INSIGHTS', 'AI Insights', 'AI insights and recommendations', 'AI'),
('PERM_AI_AUTO_FIX', 'AI Auto Fix', 'Auto bug fixing', 'AI'),
('PERM_AI_IMAGE_UPDATE', 'AI Image Update', 'Product image updates', 'AI'),
('PERM_AI_EXPIRY_PREDICT', 'AI Expiry Predict', 'Expiry predictions', 'AI'),
('PERM_AI_CHAT', 'AI Chat', 'AI chat assistant', 'AI'),

-- Prescriptions
('PERM_PRESCRIPTIONS_VIEW', 'Prescriptions View', 'View prescriptions', 'Prescriptions'),
('PERM_PRESCRIPTIONS_CREATE', 'Prescriptions Create', 'Create prescriptions', 'Prescriptions'),
('PERM_PRESCRIPTIONS_UPDATE', 'Prescriptions Update', 'Update prescriptions', 'Prescriptions'),
('PERM_PRESCRIPTIONS_DELETE', 'Prescriptions Delete', 'Delete prescriptions', 'Prescriptions'),
('PERM_PRESCRIPTIONS_HISTORY', 'Prescriptions History', 'Prescription history', 'Prescriptions'),
('PERM_PRESCRIPTIONS_AI', 'Prescriptions AI', 'AI remedy suggestions', 'Prescriptions'),

-- System
('PERM_SYSTEM_READ', 'System Read', 'Read system data', 'System'),
('PERM_SYSTEM_WRITE', 'System Write', 'Write system data', 'System'),
('PERM_SYSTEM_HEALTH', 'System Health', 'System health monitoring', 'System'),
('PERM_SYSTEM_MULTIPC', 'System MultiPC', 'Multi-PC sync management', 'System'),
('PERM_SYSTEM_OFFLINE', 'System Offline', 'Offline sync management', 'System'),
('PERM_SYSTEM_BUGS', 'System Bugs', 'Bug tracking', 'System'),
('PERM_SYSTEM_BUGS_READ', 'System Bugs Read', 'Read bug reports', 'System'),
('PERM_SYSTEM_BUGS_APPROVE', 'System Bugs Approve', 'Approve bug fixes', 'System'),
('PERM_SYSTEM_AUDIT', 'System Audit', 'Audit logs', 'System'),
('PERM_SYSTEM_BACKUP', 'System Backup', 'Backup and restore', 'System'),

-- Settings
('PERM_SETTINGS_READ', 'Settings Read', 'Read settings', 'Settings'),
('PERM_SETTINGS_WRITE', 'Settings Write', 'Write settings', 'Settings'),
('PERM_SETTINGS_COMPANY', 'Settings Company', 'Company settings', 'Settings'),
('PERM_SETTINGS_BRANCHES', 'Settings Branches', 'Branch management', 'Settings'),
('PERM_SETTINGS_USERS', 'Settings Users', 'User management', 'Settings'),
('PERM_SETTINGS_ROLES', 'Settings Roles', 'Role management', 'Settings'),
('PERM_SETTINGS_TAX', 'Settings Tax', 'Tax configuration', 'Settings'),
('PERM_SETTINGS_INTEGRATIONS', 'Settings Integrations', 'Integration settings', 'Settings'),
('PERM_SETTINGS_NOTIFICATIONS', 'Settings Notifications', 'Notification settings', 'Settings'),
('PERM_SETTINGS_SECURITY', 'Settings Security', 'Security settings', 'Settings'),

-- Admin
('PERM_USERS_ADMIN', 'Users Admin', 'User administration', 'Admin'),
('PERM_ROLES_ADMIN', 'Roles Admin', 'Role administration', 'Admin'),
('PERM_PERMISSIONS_ADMIN', 'Permissions Admin', 'Permission administration', 'Admin'),
('PERM_AUDIT_READ', 'Audit Read', 'Read audit logs', 'Admin')
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'System Administrator with full access'),
('MANAGER', 'Store Manager with operational access'),
('STAFF', 'Store Staff with basic access'),
('CASHIER', 'Cashier with POS access only'),
('MARKETER', 'Marketing staff with campaign access'),
('DOCTOR', 'Doctor with prescription access'),
('PHARMACIST', 'Pharmacist with inventory and sales access')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Insert default company
INSERT INTO companies (name, description, address, phone, email) VALUES
('Demo Homeopathy Store', 'Default demo company for HomeoERP', '123 Main Street, City, State - 123456', '+91-9876543210', 'demo@homeoerp.com')
ON CONFLICT DO NOTHING;

-- Insert default shop
INSERT INTO shops (company_id, name, address, phone, email) VALUES
(1, 'Main Branch', '123 Main Street, City, State - 123456', '+91-9876543210', 'main@homeoerp.com')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, name, role, shop_id) VALUES
('admin@homeoerp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1C9Yc6C8q7R9k1l1m1o1p1r1s1t1u1v', 'System Administrator', 'ADMIN', 1)
ON CONFLICT (email) DO NOTHING;
