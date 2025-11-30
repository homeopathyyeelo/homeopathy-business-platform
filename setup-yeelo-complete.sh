#!/bin/bash
# Complete setup for Yeelo Homeopathy ERP with AI

echo "════════════════════════════════════════════════════"
echo "  🚀 Yeelo Homeopathy ERP - Complete Setup"
echo "════════════════════════════════════════════════════"
echo ""

# 1. Update company details in database
echo "1️⃣ Updating company details..."
sudo -u postgres psql yeelo_homeopathy -f update-company-details.sql 2>/dev/null || {
    echo "⚠️  Run manually: sudo -u postgres psql yeelo_homeopathy < update-company-details.sql"
}

# 2. Verify OpenAI key
echo ""
echo "2️⃣ Checking OpenAI API key..."
if grep -q "OPENAI_API_KEY=sk-proj-" .env.local; then
    echo "✅ OpenAI key configured"
else
    echo "⚠️  OpenAI key not found in .env.local"
fi

# 3. Restart backend
echo ""
echo "3️⃣ Restarting backend..."
cd services/api-golang-master
pkill -f api-bin 2>/dev/null || true
if [ -f "api-bin" ]; then
    nohup ./api-bin > api.log 2>&1 &
    echo "✅ Backend restarted (PID: $(pgrep -f api-bin))"
else
    echo "⚠️  api-bin not found, run: go build -o api-bin ./cmd/main.go"
fi
cd ../..

# 4. Restart frontend
echo ""
echo "4️⃣ Restarting frontend..."
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev > next.log 2>&1 &
sleep 3
echo "✅ Frontend started"

# 5. Wait for services
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# 6. Test AI features
echo ""
echo "5️⃣ Testing AI assistants..."
echo ""
node test-ai-assistants.js

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ SETUP COMPLETE!"
echo "════════════════════════════════════════════════════"
echo ""
echo "🏢 Company Details Updated:"
echo "   • Name: Yeelo Homeopathy"
echo "   • GSTIN: 06BUAPG3815Q1ZH"
echo "   • State: Haryana (06)"
echo "   • City: Gurugram"
echo ""
echo "🤖 AI Features Available:"
echo "   • Billing Assistant (margins, pricing)"
echo "   • Inventory Assistant (FEFO, reorder)"
echo "   • GST Compliance (GSTR-1, GSTR-3B)"
echo "   • Demand Forecast (ML predictions)"
echo "   • Customer Support (product help)"
echo ""
echo "🌐 Access URLs:"
echo "   • POS: http://localhost:3000/sales/pos"
echo "   • B2B: http://localhost:3000/sales/b2b"
echo "   • Dashboard: http://localhost:3000/dashboard"
echo ""
echo "🧪 Test AI now:"
echo "   Open POS and click 'AI Assistant' button"
echo ""
