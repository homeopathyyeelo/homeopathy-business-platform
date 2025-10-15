-- Finance & Accounting Migration
-- Adds invoice management, payments, and financial reporting

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  shop_id TEXT NOT NULL REFERENCES shops(id),
  order_id TEXT REFERENCES orders(id),
  type TEXT NOT NULL CHECK (type IN ('SALE', 'PURCHASE', 'SERVICE', 'REFUND')),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  payment_terms TEXT,
  due_date TIMESTAMPTZ,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'
  reference TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  processed_by TEXT REFERENCES users(id),
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  parent_account_id TEXT REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entry_number TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  total_debit DECIMAL(10,2) NOT NULL,
  total_credit DECIMAL(10,2) NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(10,2) DEFAULT 0,
  credit_amount DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Currency Exchange Rates
CREATE TABLE IF NOT EXISTS currency_rates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  exchange_rate DECIMAL(10,6) NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial Reports Views
CREATE OR REPLACE VIEW profit_loss_summary AS
SELECT 
  DATE_TRUNC('month', i.created_at) as month,
  i.shop_id,
  SUM(i.subtotal) as revenue,
  SUM(i.tax_amount) as tax_collected,
  SUM(i.total_amount) as total_revenue,
  COUNT(i.id) as invoice_count
FROM invoices i
WHERE i.status = 'PAID' AND i.type = 'SALE'
GROUP BY DATE_TRUNC('month', i.created_at), i.shop_id;

CREATE OR REPLACE VIEW cash_flow_summary AS
SELECT 
  DATE_TRUNC('month', p.processed_at) as month,
  p.invoice_id,
  i.shop_id,
  SUM(p.amount) as cash_inflow,
  COUNT(p.id) as payment_count
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE p.status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', p.processed_at), p.invoice_id, i.shop_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_effective ON currency_rates(effective_date);

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (id, account_code, account_name, account_type) VALUES
('acc-001', '1000', 'Cash', 'ASSET'),
('acc-002', '1100', 'Accounts Receivable', 'ASSET'),
('acc-003', '1200', 'Inventory', 'ASSET'),
('acc-004', '2000', 'Accounts Payable', 'LIABILITY'),
('acc-005', '3000', 'Owner Equity', 'EQUITY'),
('acc-006', '4000', 'Sales Revenue', 'REVENUE'),
('acc-007', '5000', 'Cost of Goods Sold', 'EXPENSE'),
('acc-008', '5100', 'Operating Expenses', 'EXPENSE')
ON CONFLICT (id) DO NOTHING;

-- Insert sample currency rates
INSERT INTO currency_rates (id, from_currency, to_currency, exchange_rate, effective_date) VALUES
('rate-001', 'INR', 'EUR', 0.011, now()),
('rate-002', 'INR', 'USD', 0.012, now()),
('rate-003', 'EUR', 'INR', 90.91, now()),
('rate-004', 'USD', 'INR', 83.33, now())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yeelo;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yeelo;
