package database

import "fmt"

// GenerateCreateTableSQL generates CREATE TABLE statement for a given table name
func GenerateCreateTableSQL(tableName string) string {
	schemas := GetTableSchemas()
	
	if schema, exists := schemas[tableName]; exists {
		return schema
	}
	
	// Default minimal schema if not defined
	return fmt.Sprintf(`
CREATE TABLE IF NOT EXISTS %s (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_%s_deleted_at ON %s(deleted_at);
`, tableName, tableName, tableName)
}

// GetTableSchemas returns detailed CREATE TABLE statements
func GetTableSchemas() map[string]string {
	return map[string]string{
		"sales_invoices": `
CREATE TABLE IF NOT EXISTS sales_invoices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	invoice_number VARCHAR(50) UNIQUE NOT NULL,
	customer_id UUID,
	invoice_date DATE NOT NULL,
	due_date DATE,
	subtotal DECIMAL(12,2) DEFAULT 0,
	tax_amount DECIMAL(12,2) DEFAULT 0,
	discount_amount DECIMAL(12,2) DEFAULT 0,
	total_amount DECIMAL(12,2) DEFAULT 0,
	paid_amount DECIMAL(12,2) DEFAULT 0,
	status VARCHAR(20) DEFAULT 'DRAFT',
	notes TEXT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);`,

		"sales_invoice_items": `
CREATE TABLE IF NOT EXISTS sales_invoice_items (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
	product_id UUID,
	product_name VARCHAR(255),
	quantity DECIMAL(10,2) NOT NULL,
	unit_price DECIMAL(10,2) NOT NULL,
	tax_percent DECIMAL(5,2) DEFAULT 0,
	discount_percent DECIMAL(5,2) DEFAULT 0,
	amount DECIMAL(12,2) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);`,

		"sales_orders": `
CREATE TABLE IF NOT EXISTS sales_orders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	order_number VARCHAR(50) UNIQUE NOT NULL,
	customer_id UUID,
	order_date DATE NOT NULL,
	delivery_date DATE,
	status VARCHAR(20) DEFAULT 'DRAFT',
	total_amount DECIMAL(12,2) DEFAULT 0,
	notes TEXT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);`,

		"sales_order_items": `
CREATE TABLE IF NOT EXISTS sales_order_items (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
	product_id UUID,
	quantity DECIMAL(10,2) NOT NULL,
	unit_price DECIMAL(10,2) NOT NULL,
	amount DECIMAL(12,2) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"customers": `
CREATE TABLE IF NOT EXISTS customers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_code VARCHAR(50) UNIQUE,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255),
	phone VARCHAR(20),
	customer_type VARCHAR(20) DEFAULT 'RETAIL',
	credit_limit DECIMAL(12,2) DEFAULT 0,
	outstanding_amount DECIMAL(12,2) DEFAULT 0,
	loyalty_points INTEGER DEFAULT 0,
	address TEXT,
	city VARCHAR(100),
	state VARCHAR(100),
	pincode VARCHAR(10),
	gstin VARCHAR(20),
	is_active BOOLEAN DEFAULT true,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`,

		"products": `
CREATE TABLE IF NOT EXISTS products (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	sku VARCHAR(100) UNIQUE NOT NULL,
	name VARCHAR(255) NOT NULL,
	category_id UUID,
	brand_id UUID,
	description TEXT,
	unit_price DECIMAL(10,2) DEFAULT 0,
	mrp DECIMAL(10,2) DEFAULT 0,
	hsn_code VARCHAR(20),
	tax_percent DECIMAL(5,2) DEFAULT 0,
	reorder_level INTEGER DEFAULT 0,
	is_active BOOLEAN DEFAULT true,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`,

		"inventory_batches": `
CREATE TABLE IF NOT EXISTS inventory_batches (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id UUID,
	batch_number VARCHAR(100),
	quantity DECIMAL(10,2) DEFAULT 0,
	unit_cost DECIMAL(10,2) DEFAULT 0,
	expiry_date DATE,
	warehouse_id UUID,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);`,

		"purchase_orders": `
CREATE TABLE IF NOT EXISTS purchase_orders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	po_number VARCHAR(50) UNIQUE NOT NULL,
	vendor_id UUID,
	order_date DATE NOT NULL,
	expected_delivery DATE,
	status VARCHAR(20) DEFAULT 'DRAFT',
	total_amount DECIMAL(12,2) DEFAULT 0,
	notes TEXT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);`,

		"purchase_order_items": `
CREATE TABLE IF NOT EXISTS purchase_order_items (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
	product_id UUID,
	quantity DECIMAL(10,2) NOT NULL,
	unit_price DECIMAL(10,2) NOT NULL,
	tax_percent DECIMAL(5,2) DEFAULT 0,
	amount DECIMAL(12,2) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"vendors": `
CREATE TABLE IF NOT EXISTS vendors (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	vendor_code VARCHAR(50) UNIQUE,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255),
	phone VARCHAR(20),
	address TEXT,
	city VARCHAR(100),
	state VARCHAR(100),
	gstin VARCHAR(20),
	payment_terms VARCHAR(50),
	is_active BOOLEAN DEFAULT true,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	deleted_at TIMESTAMP
);`,

		"prescriptions": `
CREATE TABLE IF NOT EXISTS prescriptions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	prescription_number VARCHAR(50) UNIQUE,
	patient_id UUID,
	doctor_id UUID,
	prescription_date DATE NOT NULL,
	symptoms TEXT,
	diagnosis TEXT,
	notes TEXT,
	status VARCHAR(20) DEFAULT 'ACTIVE',
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);`,

		"prescription_items": `
CREATE TABLE IF NOT EXISTS prescription_items (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
	product_id UUID,
	product_name VARCHAR(255),
	potency VARCHAR(20),
	dosage VARCHAR(50),
	frequency VARCHAR(20),
	duration VARCHAR(50),
	instructions TEXT,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"prescription_templates": `
CREATE TABLE IF NOT EXISTS prescription_templates (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(255) NOT NULL,
	diagnosis TEXT,
	medicines JSONB,
	created_by UUID,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"e_invoices": `
CREATE TABLE IF NOT EXISTS e_invoices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	invoice_id UUID,
	irn VARCHAR(100) UNIQUE,
	ack_no VARCHAR(50),
	ack_date TIMESTAMP,
	qr_code TEXT,
	status VARCHAR(20) DEFAULT 'GENERATED',
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"hold_bills": `
CREATE TABLE IF NOT EXISTS hold_bills (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_name VARCHAR(255),
	items JSONB,
	total_amount DECIMAL(12,2),
	held_at TIMESTAMP DEFAULT NOW(),
	expires_at TIMESTAMP
);`,

		"sales_commissions": `
CREATE TABLE IF NOT EXISTS sales_commissions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	salesperson_id UUID,
	period VARCHAR(20),
	sales_amount DECIMAL(12,2),
	commission_rate DECIMAL(5,2),
	commission_amount DECIMAL(12,2),
	status VARCHAR(20) DEFAULT 'PENDING',
	paid_at TIMESTAMP,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"customer_feedback": `
CREATE TABLE IF NOT EXISTS customer_feedback (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id UUID,
	rating INTEGER,
	comment TEXT,
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"communication_log": `
CREATE TABLE IF NOT EXISTS communication_log (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id UUID,
	channel VARCHAR(20),
	subject VARCHAR(255),
	message TEXT,
	status VARCHAR(20),
	created_at TIMESTAMP DEFAULT NOW()
);`,

		"appointments": `
CREATE TABLE IF NOT EXISTS appointments (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id UUID,
	appointment_date DATE,
	appointment_time TIME,
	purpose TEXT,
	status VARCHAR(20) DEFAULT 'SCHEDULED',
	created_at TIMESTAMP DEFAULT NOW()
);`,
	}
}
