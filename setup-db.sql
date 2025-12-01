-- Company GST Settings
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gstin VARCHAR(15) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO company_settings (gstin, company_name, state_code, address, city, pincode, phone, email)
VALUES (
    '27AAAAA0000A1Z5',
    'Yeelo Homeopathy Pvt Ltd',
    '27',
    '123 Main Street, Mumbai',
    'Mumbai',
    '400001',
    '8478019973',
    'info@yeelo.com'
)
ON CONFLICT DO NOTHING;

-- POS Counters
CREATE TABLE IF NOT EXISTS pos_counters (
    id VARCHAR(50) PRIMARY KEY,
    counter_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO pos_counters (id, counter_name, location)
VALUES 
    ('COUNTER-1', 'Main Counter', 'Ground Floor'),
    ('COUNTER-2', 'Secondary Counter', 'First Floor')
ON CONFLICT DO NOTHING;

-- Sample commission rules (if doctor_commission_rules table exists)
INSERT INTO doctor_commission_rules (doctor_name, commission_type, default_rate)
SELECT 'Dr. Ramesh Kumar', 'PERCENTAGE', 10.00
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_commission_rules')
ON CONFLICT DO NOTHING;

INSERT INTO doctor_commission_rules (doctor_name, commission_type, default_rate)
SELECT 'Dr. Priya Sharma', 'PERCENTAGE', 12.00
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_commission_rules')
ON CONFLICT DO NOTHING;

COMMIT;
