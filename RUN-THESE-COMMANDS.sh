#!/bin/bash
# Run these commands ONE BY ONE

echo "════════════════════════════════════════════════════"
echo "  YEELO HOMEOPATHY - QUICK SETUP"
echo "════════════════════════════════════════════════════"
echo ""

# 1. Update database with your company details
echo "1️⃣ Update company details (may need password):"
echo "   sudo -u postgres psql yeelo_homeopathy < update-company-details.sql"
echo ""

# 2. Backend is already running on port 3005
echo "2️⃣ Backend status:"
pgrep -f api-bin && echo "   ✅ Backend running" || echo "   ⚠️  Backend not running"
echo ""

# 3. Restart frontend
echo "3️⃣ Restarting frontend..."
pkill -f "next dev" 2>/dev/null || true
cd /var/www/homeopathy-business-platform
nohup npm run dev > next.log 2>&1 &
sleep 3
echo "   ✅ Frontend started"
echo ""

# 4. Test services
echo "4️⃣ Testing services..."
sleep 2
curl -s http://localhost:3000 > /dev/null && echo "   ✅ Frontend OK" || echo "   ❌ Frontend failed"
curl -s http://localhost:3005/health > /dev/null && echo "   ✅ Backend OK" || echo "   ❌ Backend failed"
echo ""

echo "════════════════════════════════════════════════════"
echo "  ✅ READY TO USE!"
echo "════════════════════════════════════════════════════"
echo ""
echo "🌐 Open: http://localhost:3000/sales/pos"
echo ""
echo "🤖 AI Features:"
echo "   • Click 'AI Assistant' in POS"
echo "   • Ask: 'What is the margin?'"
echo "   • Ask: 'Should I generate E-Invoice?'"
echo ""
echo "📊 Your Company:"
echo "   • Yeelo Homeopathy"
echo "   • GSTIN: 06BUAPG3815Q1ZH"
echo "   • State: Haryana (06)"
echo "   • Gurugram, 122103"
echo ""
