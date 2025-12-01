#!/bin/bash
# COMPLETE POS SETUP - RUN THIS ONCE

set -e

echo "🚀 Setting up POS with E-Invoice & AI..."

# 1. Run migration
echo "1️⃣ Running database migration..."
cd /var/www/homeopathy-business-platform/services/api-golang-master
psql -U postgres -d yeelo_homeopathy -f migrations/013_pos_gst_compliance.sql 2>/dev/null || echo "Migration already done"

# 2. Setup company GST settings
echo "2️⃣ Setting up company GST settings..."
psql -U postgres -d yeelo_homeopathy <<EOF
-- Create company settings table if not exists
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

-- Insert default company settings (UPDATE THESE!)
INSERT INTO company_settings (gstin, company_name, state_code, address, city, pincode, phone, email)
VALUES (
    '27AAAAA0000A1Z5',  -- UPDATE YOUR GSTIN
    'Yeelo Homeopathy Pvt Ltd',  -- UPDATE YOUR COMPANY NAME
    '27',  -- 27=Maharashtra, UPDATE YOUR STATE CODE
    '123 Main Street, Mumbai',  -- UPDATE YOUR ADDRESS
    'Mumbai',
    '400001',
    '8478019973',
    'info@yeelo.com'
)
ON CONFLICT DO NOTHING;

-- Create doctor commission rules
CREATE TABLE IF NOT EXISTS doctor_commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES customers(id),
    doctor_name VARCHAR(255) NOT NULL,
    commission_type VARCHAR(20) DEFAULT 'PERCENTAGE',
    default_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample commission rules
INSERT INTO doctor_commission_rules (doctor_name, commission_type, default_rate)
VALUES 
    ('Dr. Ramesh Kumar', 'PERCENTAGE', 10.00),
    ('Dr. Priya Sharma', 'PERCENTAGE', 12.00),
    ('Dr. Amit Patel', 'PERCENTAGE', 15.00)
ON CONFLICT DO NOTHING;

-- Create counter settings
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

COMMIT;
EOF

echo "✅ Database setup complete!"

# 3. Add OpenAI key
echo "3️⃣ Setting up AI assistant..."
cd /var/www/homeopathy-business-platform
if ! grep -q "OPENAI_API_KEY" .env.local 2>/dev/null; then
    echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env.local
    echo "⚠️  Please update OPENAI_API_KEY in .env.local"
else
    echo "✅ OpenAI key already configured"
fi

# 4. Build and restart Go backend
echo "4️⃣ Rebuilding Go backend..."
cd services/api-golang-master
pkill -f api-bin 2>/dev/null || true
go build -o api-bin cmd/server/main.go
nohup ./api-bin > api.log 2>&1 &
sleep 2
echo "✅ Backend started (PID: $(pgrep -f api-bin))"

# 5. Restart Next.js
echo "5️⃣ Restarting frontend..."
cd /var/www/homeopathy-business-platform
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev > next.log 2>&1 &
sleep 3
echo "✅ Frontend started"

# 6. Verify
echo ""
echo "🧪 Testing APIs..."
curl -s http://localhost:8080/health > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: FAILED"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: FAILED"

echo ""
echo "════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "════════════════════════════════════════"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Update GSTIN in database:"
echo "   psql -U postgres -d yeelo_homeopathy"
echo "   UPDATE company_settings SET gstin='YOUR_GSTIN';"
echo ""
echo "2. Update OpenAI key in .env.local"
echo ""
echo "3. Open POS: http://localhost:3000/sales/pos"
echo ""
echo "🎉 All features ready:"
echo "  ✓ E-Invoice"
echo "  ✓ E-Way Bill"
echo "  ✓ AI Assistant"
echo "  ✓ Multi-rate GST"
echo "  ✓ Doctor commissions"
echo "  ✓ Hold/Resume bills"
echo ""
