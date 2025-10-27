-- ============================================
-- CREATE ALL MISSING TABLES FOR HOMEOERP
-- ============================================
-- This script creates all tables referenced in the codebase
-- that don't exist in the database yet
-- ============================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    customer_type VARCHAR(50) DEFAULT 'RETAIL', -- RETAIL, WHOLESALE, DISTRIBUTOR, DOCTOR
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    price_list_id UUID,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

COMMENT ON TABLE customers IS 'Customer master data for retail, wholesale, distributors, and doctors';

-- 2. VENDORS TABLE
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    credit_days INTEGER DEFAULT 0,
    payment_terms TEXT,
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    bank_ifsc VARCHAR(20),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    rating INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_vendors_phone ON vendors(phone);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors(deleted_at);

COMMENT ON TABLE vendors IS 'Vendor/Supplier master data';

-- 3. PURCHASE_ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_no VARCHAR(100),
    vendor_id UUID REFERENCES vendors(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING, APPROVED, RECEIVED, CANCELLED
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_charges DECIMAL(15,2) DEFAULT 0,
    other_charges DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID
    payment_method VARCHAR(50),
    notes TEXT,
    terms_conditions TEXT,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_deleted_at ON purchase_orders(deleted_at);

COMMENT ON TABLE purchase_orders IS 'Purchase orders to vendors';

-- 4. PURCHASE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255),
    product_code VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50),
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

COMMENT ON TABLE purchase_items IS 'Line items for purchase orders';

-- 5. PRODUCT_BARCODES TABLE
CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(255) UNIQUE NOT NULL,
    barcode_type VARCHAR(50) DEFAULT 'EAN13', -- EAN13, CODE128, QR, etc.
    batch_number VARCHAR(100),
    mrp DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    quantity INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_barcodes_product_id ON product_barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);

COMMENT ON TABLE product_barcodes IS 'Product barcodes for scanning and printing';

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- PURCHASE, SALES, EXPENSE, SALARY
    reference_type VARCHAR(50), -- PURCHASE_ORDER, SALES_INVOICE, etc.
    reference_id VARCHAR(100),
    party_type VARCHAR(50), -- VENDOR, CUSTOMER, EMPLOYEE
    party_id UUID,
    party_name VARCHAR(255),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- CASH, CARD, UPI, BANK_TRANSFER, CHEQUE
    payment_mode VARCHAR(50), -- ONLINE, OFFLINE
    transaction_id VARCHAR(255),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    upi_id VARCHAR(100),
    card_last4 VARCHAR(4),
    status VARCHAR(50) DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED, CANCELLED
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);

COMMENT ON TABLE payments IS 'All payment transactions';

-- 7. INVENTORY TABLE (if different from inventory_stock)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    mrp DECIMAL(15,2),
    location VARCHAR(100),
    rack_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_number ON inventory(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);

COMMENT ON TABLE inventory IS 'Product inventory by warehouse and batch';

-- 8. USERS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'USER', -- ADMIN, MANAGER, USER, CASHIER
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

COMMENT ON TABLE users IS 'System users and authentication';

-- 9. SALES_INVOICES TABLE
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_gstin VARCHAR(15),
    invoice_type VARCHAR(50) DEFAULT 'RETAIL', -- RETAIL, WHOLESALE, B2B, B2C
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_charges DECIMAL(15,2) DEFAULT 0,
    other_charges DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'COMPLETED', -- DRAFT, COMPLETED, CANCELLED, RETURNED
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_deleted_at ON sales_invoices(deleted_at);

COMMENT ON TABLE sales_invoices IS 'Sales invoices for all customer types';

-- 10. SALES_INVOICE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255),
    product_code VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50),
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product_id ON sales_invoice_items(product_id);

COMMENT ON TABLE sales_invoice_items IS 'Line items for sales invoices';

-- ============================================
-- SUMMARY OF TABLES CREATED
-- ============================================
-- 1. customers - Customer master data
-- 2. vendors - Vendor/Supplier master data
-- 3. purchase_orders - Purchase orders
-- 4. purchase_items - Purchase order line items
-- 5. product_barcodes - Product barcodes
-- 6. payments - Payment transactions
-- 7. inventory - Product inventory
-- 8. users - System users
-- 9. sales_invoices - Sales invoices
-- 10. sales_invoice_items - Sales invoice line items
-- ============================================

SELECT 'All missing tables created successfully!' as status;
