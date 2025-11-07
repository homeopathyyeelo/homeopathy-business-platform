-- ============================================================================
-- Create Main Tables for Homeopathy ERP
-- ============================================================================

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  mrp DECIMAL(10,2),
  description TEXT,
  sku VARCHAR(100),
  hsn_code VARCHAR(50),
  gst_rate DECIMAL(5,2) DEFAULT 12.00,
  unit VARCHAR(50) DEFAULT 'piece',
  min_stock INTEGER DEFAULT 10,
  max_stock INTEGER DEFAULT 1000,
  reorder_level INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  customer_type VARCHAR(50) DEFAULT 'retail',
  credit_limit DECIMAL(10,2) DEFAULT 0,
  outstanding_balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors/Suppliers Table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  pan_number VARCHAR(20),
  bank_name VARCHAR(255),
  bank_account VARCHAR(50),
  ifsc_code VARCHAR(20),
  payment_terms VARCHAR(100),
  credit_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  batch_number VARCHAR(100),
  manufacturing_date DATE,
  expiry_date DATE,
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  mrp DECIMAL(10,2),
  location VARCHAR(100),
  rack_number VARCHAR(50),
  bin_number VARCHAR(50),
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 12.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  batch_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  purchase_number VARCHAR(100) UNIQUE NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id),
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 12.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Data
INSERT INTO products (name, category, brand, price, stock, mrp, description, sku, hsn_code) VALUES
('Arnica Montana 30C', 'Dilutions', 'SBL', 85, 150, 100, 'For injuries and trauma', 'SBL-ARM-30C', '30049099'),
('Belladonna 200C', 'Dilutions', 'Dr. Reckeweg', 95, 120, 110, 'For fever and inflammation', 'DRR-BEL-200C', '30049099'),
('Calendula Q', 'Mother Tinctures', 'Willmar Schwabe', 180, 80, 200, 'For wounds and cuts', 'WS-CAL-Q', '30049099'),
('Calc Phos 6X', 'Biochemic', 'BJain', 65, 200, 75, 'For bone health', 'BJ-CP-6X', '30049099'),
('Nux Vomica 30C', 'Dilutions', 'SBL', 85, 180, 100, 'For digestive issues', 'SBL-NUX-30C', '30049099'),
('Pulsatilla 30C', 'Dilutions', 'Dr. Reckeweg', 90, 140, 105, 'For hormonal balance', 'DRR-PUL-30C', '30049099'),
('Rhus Tox 30C', 'Dilutions', 'SBL', 85, 160, 100, 'For joint pain', 'SBL-RHU-30C', '30049099'),
('Sulphur 200C', 'Dilutions', 'BJain', 95, 130, 110, 'For skin conditions', 'BJ-SUL-200C', '30049099'),
('Lycopodium 30C', 'Dilutions', 'Willmar Schwabe', 90, 145, 105, 'For liver and digestion', 'WS-LYC-30C', '30049099'),
('Phosphorus 30C', 'Dilutions', 'SBL', 85, 155, 100, 'For respiratory issues', 'SBL-PHO-30C', '30049099')
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, email, phone, address, city, state, pincode, customer_type) VALUES
('Rajesh Kumar', 'rajesh@example.com', '9876543310', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 'retail'),
('Priya Sharma', 'priya@example.com', '9876543311', '456 Park Street', 'Kolkata', 'West Bengal', '700016', 'retail'),
('Amit Patel', 'amit@example.com', '9876543312', '789 Brigade Road', 'Bangalore', 'Karnataka', '560001', 'wholesale'),
('Sneha Reddy', 'sneha@example.com', '9876543313', '321 Anna Salai', 'Chennai', 'Tamil Nadu', '600002', 'retail'),
('Vikram Singh', 'vikram@example.com', '9876543314', '654 Connaught Place', 'Delhi', 'Delhi', '110001', 'retail')
ON CONFLICT DO NOTHING;

INSERT INTO vendors (name, contact_person, email, phone, address, city, state, gst_number) VALUES
('SBL Pharmaceuticals', 'Ramesh Kumar', 'sales@sbl.com', '9876540001', 'SBL House, Nehru Place', 'Delhi', 'Delhi', '07AAAAA0000A1Z5'),
('Dr. Reckeweg & Co', 'Suresh Patel', 'info@reckeweg.com', '9876540002', 'Reckeweg Building, MG Road', 'Mumbai', 'Maharashtra', '27BBBBB0000B1Z5'),
('Willmar Schwabe India', 'Mahesh Gupta', 'contact@schwabe.in', '9876540003', 'Schwabe House, Park Street', 'Kolkata', 'West Bengal', '19CCCCC0000C1Z5'),
('BJain Pharmaceuticals', 'Dinesh Shah', 'sales@bjain.com', '9876540004', 'BJain Tower, Nehru Place', 'Delhi', 'Delhi', '07DDDDD0000D1Z5'),
('Hahnemann Publishing', 'Rajesh Verma', 'info@hahnemann.com', '9876540005', 'Hahnemann House, Brigade Road', 'Bangalore', 'Karnataka', '29EEEEE0000E1Z5')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor ON purchases(vendor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE products IS 'Homeopathy products/medicines catalog';
COMMENT ON TABLE customers IS 'Customer master data';
COMMENT ON TABLE vendors IS 'Vendor/Supplier master data';
COMMENT ON TABLE inventory IS 'Product inventory with batch tracking';
COMMENT ON TABLE sales IS 'Sales transactions';
COMMENT ON TABLE sale_items IS 'Individual items in sales';
COMMENT ON TABLE purchases IS 'Purchase transactions';
COMMENT ON TABLE purchase_items IS 'Individual items in purchases';
