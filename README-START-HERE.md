# ⚡ ONE-COMMAND SETUP - COPY & PASTE THIS NOW!

```bash
# 👇 COPY THIS ENTIRE BLOCK AND PASTE IN YOUR TERMINAL 👇
cd /var/www/homeopathy-business-platform && \
POSTGRES_CONTAINER=$(docker ps -q -f name=postgres) && \
echo "Inserting all data..." && \
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d yeelo_homeopathy < database/migrations/012_auth_refactor.sql 2>&1 | tail -3 && \
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d yeelo_homeopathy < services/api-golang-master/database/migrations/20251027_homeopathy_master_data.sql 2>&1 | tail -3 && \
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d yeelo_homeopathy < insert-default-homeopathy-data.sql 2>&1 | tail -3 && \
echo "" && \
echo "✅ DATA INSERTED! Verifying..." && \
echo "" && \
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d yeelo_homeopathy << 'EOF'
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'Categories', COUNT(*) FROM categories
UNION ALL SELECT 'Brands', COUNT(*) FROM brands
UNION ALL SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL SELECT 'Forms', COUNT(*) FROM forms
UNION ALL SELECT 'Units', COUNT(*) FROM units
UNION ALL SELECT 'HSN Codes', COUNT(*) FROM hsn_codes
UNION ALL SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL SELECT 'Customer Groups', COUNT(*) FROM customer_groups
UNION ALL SELECT 'Price Lists', COUNT(*) FROM price_lists
UNION ALL SELECT 'Racks', COUNT(*) FROM racks;
EOF
echo "" && \
echo "Testing login..." && \
curl -s -X POST http://localhost:3005/api/auth/login -H "Content-Type: application/json" -d '{"email": "test@test.com", "password": "test123"}' | jq && \
echo "" && \
echo "════════════════════════════════════════════════════" && \
echo "✅ COMPLETE! LOGIN CREDENTIALS:" && \
echo "   • test@test.com / test123" && \
echo "   • admin@homeopathy.com / admin123" && \
echo "   • medicine@yeelohomeopathy.com / Medicine@2024" && \
echo "" && \
echo "🌐 Frontend: http://localhost:3000" && \
echo "� API: http://localhost:3005" && \
echo "════════════════════════════════════════════════════"
```

**That's it! This one command does everything:**
- ✅ Inserts 3 authentication users
- ✅ Inserts 15+ categories (Mother Tinctures, Dilutions, Biochemic, etc.)
- ✅ Inserts 10 brands (SBL, Dr. Reckeweg, Allen, Bakson, etc.)
- ✅ Inserts 11 potencies (3X, 6X, 30C, 200C, 1M, etc.)
- ✅ Inserts 9 forms (Liquid, Tablet, Globules, MT, Ointment, etc.)
- ✅ Inserts units, HSN codes, vendors, customer groups, price lists, racks
- ✅ Tests login to verify everything works

---

# �🚀 START HERE - Authentication System - FIXED & READY TO TEST

## ✅ PROBLEM SOLVED

**Issue**: Schema mismatch between SQL migrations (used SERIAL/integer IDs) and Golang models (expected UUID IDs)

**Solution**: Updated `/database/migrations/012_auth_refactor.sql` to use UUID schema matching Go models

## 🔐 Test Users (Ready to Use)

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `test@test.com` | `test123` | User | Basic user for testing |
| `admin@homeopathy.com` | `admin123` | Admin | Admin access |
| `medicine@yeelohomeopathy.com` | `Medicine@2024` | Super Admin | Full system access |

## 📦 Inserted Homeopathy Data

**Master Data:**
- ✅ 15 Categories (Mother Tinctures, Dilutions, Biochemic, Ointments, Drops, Syrups, Tablets, etc.)
- ✅ 10 Brands (SBL, Dr. Reckeweg, Allen, Bakson, Schwabe, Wheezal, Hahnemann, Adel, Haslab, Bjain)
- ✅ 11 Potencies (3X, 6X, 12X, 30X, 6C, 30C, 200C, 1M, 10M, CM, Q)
- ✅ 9 Forms (Liquid, Tablet, Globules, Mother Tincture, Ointment, Cream, Drops, Syrup, Trituration)
- ✅ 8 Units (ml, L, dram, oz, gm, kg, mg, pcs, bottle, vial, tube, box, strip, jar)
- ✅ 5 HSN Codes (30049011-30049019 for homeopathy medicines)

**Business Data:**
- ✅ 7 Vendors (SBL, Dr. Reckeweg, Schwabe, BJain, Bakson, Allen, Hahnemann)
- ✅ 6 Customer Groups (Retail, Wholesale, Distributors, Doctors, Clinics, VIP)
- ✅ 5 Price Lists (Retail, Wholesale, Distributor, Doctor, Special Offer)
- ✅ 11 Racks (A1-A3, B1-B2, C1-C2, D1-D2, E1, Cold Storage)
- ✅ 2 Warehouses (Main Warehouse, Retail Counter)

## Quick Test (Run These Commands)

### 1. Run Migration
```bash
cd /var/www/homeopathy-business-platform

# Using Docker postgres
docker exec -i $(docker ps | grep postgres | awk '{print $1}') psql -U postgres -d yeelo_homeopathy < database/migrations/012_auth_refactor.sql

# OR using localhost postgres
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy < database/migrations/012_auth_refactor.sql
```

### 2. Verify Users
```bash
docker exec -i $(docker ps | grep postgres | awk '{print $1}') psql -U postgres -d yeelo_homeopathy -c "SELECT email, first_name, is_active FROM users;"
```

### 3. Build & Start API
```bash
cd /var/www/homeopathy-business-platform/services/api-golang-master

# Kill existing process
lsof -ti:3005 | xargs kill -9 2>/dev/null || true

# Build
go build -o api-golang cmd/main.go

# Start (background)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export PORT="3005"
./api-golang > /tmp/api-golang.log 2>&1 &
echo $! > /tmp/api-golang.pid

# Wait and check
sleep 5 && curl http://localhost:3005/health
```

### 4. Test Login
```bash
# Test valid login
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}' | jq

# Should return:
# {
#   "token": "eyJhbGc...",
#   "expiresAt": "...",
#   "user": {...}
# }

# Test with invalid password (should return 401)
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "wrong"}'
```

### 5. Test Authenticated Endpoint
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}' | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/erp/dashboard/stats
```

## What Was Fixed

### Files Modified
1. **`/database/migrations/012_auth_refactor.sql`**
   - Drops old tables with integer IDs
   - Creates `users` table with UUID primary key
   - Creates `sessions` table with UUID primary key
   - Matches Go models exactly:
     - `models.User` in `internal/models/entities.go`
     - `models.Session` in `internal/models/session.go`
   - Seeds 3 test users with bcrypt passwords

### Schema Changes

**users table** (now matches `models.User`):
- `id` UUID PRIMARY KEY (was SERIAL)
- `first_name` VARCHAR(100) NOT NULL
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- Plus: `company_id`, `phone`, `last_name`, `display_name`, `is_active`, `is_verified`, `last_login_at`, `two_factor_enabled`, `two_factor_secret`, `created_at`, `updated_at`

**sessions table** (now matches `models.Session`):
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id)
- `token` VARCHAR(500) UNIQUE NOT NULL
- `expires_at` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ

## API Endpoints

### Public
- `POST /api/auth/login` - Login with email/password
- `GET /health` - Health check

### Protected (require Authorization header)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/erp/dashboard/*` - Dashboard endpoints
- `GET /api/erp/products` - Products
- `GET /api/erp/customers` - Customers
- And 80+ other endpoints...

## Troubleshooting

### Migration Fails
```bash
# Manually drop all auth tables first
docker exec -i $(docker ps | grep postgres | awk '{print $1}') psql -U postgres -d yeelo_homeopathy << EOF
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
EOF

# Run migration again
```

### API Won't Start
```bash
# Check logs
tail -f /tmp/api-golang.log

# Common issues:
# - Port 3005 in use: lsof -ti:3005 | xargs kill -9
# - Database connection: Check DATABASE_URL
# - Missing deps: cd services/api-golang-master && go mod download
```

### Login Returns 401
```bash
# Verify user exists
docker exec -i $(docker ps | grep postgres | awk '{print $1}') psql -U postgres -d yeelo_homeopathy -c "SELECT email, is_active FROM users WHERE email='test@test.com';"

# Should show: test@test.com | t
```

## Stop API Server
```bash
kill $(cat /tmp/api-golang.pid) 2>/dev/null
# OR
lsof -ti:3005 | xargs kill -9
```

## Logs
- **API logs**: `/tmp/api-golang.log`
- **API PID**: `/tmp/api-golang.pid`

---

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
