# 🚀 START HERE - HomeoERP Quick Setup

## ⚠️ Current Status: Backend Not Running

Your audit shows **all backend services are down**. Only Next.js frontend is running on port 3000.

## ✅ Solution: Start Backend in 1 Command

```bash
./START-NOW.sh
```

This will:
1. Kill any existing processes on port 3005
2. Start API Golang v2 (primary backend)
3. Test health endpoint
4. Show process ID and log location

## 🔍 What You'll See

**Success:**
```
✓ SUCCESS - Backend Started!
Backend API: http://localhost:3005 (PID: 12345)
Health: http://localhost:3005/health
```

**If Failed:**
- Check logs: `cat logs/api-golang-master.log`
- Database issue? See troubleshooting below

## 🧪 Test Everything Works

```bash
# 1. Test health
curl http://localhost:3005/health

# 2. Test dashboard API
curl http://localhost:3005/api/erp/dashboard/stats

# 3. Run full audit
./scripts/service-audit.sh

# 4. Open browser
http://localhost:3000/dashboard
```

## 📊 Expected Results

After starting backend:
- ✅ Port 3000: Next.js (already running)
- ✅ Port 3005: API Golang v2 (just started)
- ❌ Ports 3004, 4000, 8005, 8006: Not needed for basic dashboard

## 🔧 Troubleshooting

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql

# Create database if missing
psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;"

# Run migrations
psql -U postgres -d yeelo_homeopathy -f database/migrations/001_initial_schema.sql
```

### Issue: Port 3005 Already in Use

```bash
# Find and kill process
kill $(lsof -ti:3005)

# Then restart
./START-NOW.sh
```

### Issue: Go Dependencies Missing

```bash
cd services/api-golang-master
go mod download
go mod tidy
cd ../..
./START-NOW.sh
```

### Issue: Still Shows Mock Data

1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache
3. Check console for errors
4. Verify API responds: `curl http://localhost:3005/api/erp/dashboard/stats`

## 📝 View Logs

```bash
# Real-time logs
tail -f logs/api-golang-master.log

# Or view full log
cat logs/api-golang-master.log
```

## 🛑 Stop Services

```bash
# Stop backend
kill $(lsof -ti:3005)

# Or use the PID shown when you started
kill <PID>

# Stop Next.js (in its terminal)
Ctrl + C
```

## 🎯 What's Running After Start

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 3000 | Next.js | ✅ Running | Frontend UI |
| 3005 | Go API v2 | ✅ Starting | Backend APIs |
| 3004 | Go API v1 | ❌ Optional | Legacy |
| 4000 | Gateway | ❌ Optional | Auth routing |
| 8005 | Parser | ❌ Optional | PDF parsing |
| 8006 | Purchase | ❌ Optional | GRN service |

**Only ports 3000 and 3005 are required for the dashboard!**

## 🎬 Complete Setup Flow

```bash
# Terminal 1: Start Next.js (if not running)
npm run dev

# Terminal 2: Start Backend
./START-NOW.sh

# Browser: Open dashboard
http://localhost:3000/dashboard
```

## ✨ Verify Success

You should see:
1. Dashboard loads without 404 errors
2. Live data in KPI cards (sales, purchases, etc.)
3. Activity feed with real entries
4. Microservices health widget at bottom showing:
   - api-golang-master (port 3005) - 🟢 UP

## 📞 Quick Commands Reference

```bash
# Start backend
./START-NOW.sh

# Check all services
./scripts/service-audit.sh

# Test endpoints
./test-endpoints.sh

# View logs
tail -f logs/api-golang-master.log

# Stop backend
kill $(lsof -ti:3005)

# Restart
kill $(lsof -ti:3005) && ./START-NOW.sh
```

## 🎉 You're Ready!

Once you see "✓ SUCCESS - Backend Started!", your HomeoERP system is fully operational!

Open: http://localhost:3000/dashboard

---

**Need help?** Check `QUICK-START-BACKEND.md` for detailed troubleshooting.
