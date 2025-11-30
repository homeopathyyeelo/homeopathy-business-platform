#!/bin/bash
echo "🚀 Quick POS Setup - Run each command manually if this fails"
echo ""

# 1. Database setup (run manually if fails)
echo "1️⃣ Setting up database..."
echo "   Run: sudo -u postgres psql yeelo_homeopathy < setup-db.sql"
echo "   OR connect and run setup-db.sql manually"
echo ""

# 2. Backend restart
echo "2️⃣ Restarting backend..."
cd /var/www/homeopathy-business-platform/services/api-golang-master
pkill -f api-bin 2>/dev/null || true
go build -o api-bin cmd/server/main.go && nohup ./api-bin > api.log 2>&1 &
echo "   ✅ Backend restarted"
echo ""

# 3. Add OpenAI key
echo "3️⃣ Add OpenAI key to .env.local:"
echo "   OPENAI_API_KEY=sk-proj-YOUR-KEY"
echo ""

# 4. Update your GSTIN
echo "4️⃣ Update GSTIN (connect to DB and run):"
echo "   UPDATE company_settings SET gstin='YOUR_ACTUAL_GSTIN';"
echo ""

echo "✅ DONE! Open http://localhost:3000/sales/pos"
