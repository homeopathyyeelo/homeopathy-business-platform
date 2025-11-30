-- Fix 1: Create Walk-in Customer (if not exists)
INSERT INTO customers (id, name, phone, email, customer_type, is_active, credit_limit)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Walk-in Customer',
    '0000000000',
    'walkin@pos.local',
    'RETAIL',
    true,
    0
)
ON CONFLICT (id) DO UPDATE SET
    name = 'Walk-in Customer',
    is_active = true;

-- Verify Walk-in Customer created
SELECT id, name, phone, customer_type FROM customers WHERE id = '00000000-0000-0000-0000-000000000001';
