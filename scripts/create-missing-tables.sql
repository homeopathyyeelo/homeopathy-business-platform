-- Create missing tables for complete ERP functionality

-- Invoices table (if not exists)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID,
  invoice_date TIMESTAMP DEFAULT NOW(),
  total NUMERIC(12,2) DEFAULT 0.00,
  discount NUMERIC(12,2) DEFAULT 0.00,
  tax NUMERIC(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty accounts table  
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID,
  points INT DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing contacts table
CREATE TABLE IF NOT EXISTS marketing_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  source VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO invoices (invoice_number, total, status) VALUES
('INV-2025-001', 1500.00, 'paid'),
('INV-2025-002', 2500.00, 'pending'),
('INV-2025-003', 3500.00, 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_accounts (points, tier) VALUES
(100, 'bronze'),
(500, 'silver'),
(1000, 'gold')
ON CONFLICT DO NOTHING;

INSERT INTO marketing_contacts (name, email, phone, source) VALUES
('John Doe', 'john@test.com', '9876543210', 'website'),
('Jane Smith', 'jane@test.com', '9876543211', 'referral'),
('Bob Johnson', 'bob@test.com', '9876543212', 'social')
ON CONFLICT DO NOTHING;

SELECT 'Tables created and seeded successfully!' as status;
