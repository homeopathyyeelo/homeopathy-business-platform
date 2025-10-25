# Start Application with Import Fix

## Option 1: Quick Start (Recommended)

### Start Infrastructure + Frontend + Import API

```bash
# 1. Start Docker services (Postgres, Redis, Kafka, MinIO)
docker-compose up -d postgres redis kafka minio

# 2. Wait for services
sleep 10

# 3. Start the FIXED import API (Port 3005)
cd /var/www/homeopathy-business-platform/services/api-golang-v2
./bin/api &
cd ../..

# 4. Start Next.js frontend (Port 3000)
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Import API: http://localhost:3005

---

## Option 2: Full Platform Start

### Use the complete startup script + add import API

```bash
# Terminal 1: Run complete startup (all services)
./start-complete.sh
```

This will start:
- ✅ Docker (Postgres, Redis, Kafka, MinIO)
- ✅ Microservices (Product, Inventory, Sales, API Gateway, AI)
- ✅ Frontend (Next.js on port 3000)

**But it won't start api-golang-v2!**

### Terminal 2: Start Import API separately

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-v2
./bin/api
```

This runs on **Port 3005** and handles the import endpoints.

---

## Option 3: Minimal Start (Just What You Need)

If you only want to test the import feature:

```bash
# Terminal 1: Start Postgres only
docker-compose up -d postgres
sleep 5

# Terminal 2: Start Import API
cd services/api-golang-v2
./bin/api

# Terminal 3: Start Frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000/products/import-export
- Upload your CSV file!

---

## Current Status

### ✅ What's Fixed
- api-golang-v2 has all the import fixes:
  - Case-insensitive column matching
  - Empty column handling
  - Row padding
  - Debug logging
  - Live progress

### ⚠️ What to Know
- The `start-complete.sh` script doesn't include api-golang-v2
- You need to start it separately on port 3005
- Frontend expects import API on port 3005

---

## Recommended Flow

### 1. Start Everything
```bash
# In project root
./start-complete.sh
```

Wait for it to finish (shows "Platform is ready!")

### 2. Start Import API
```bash
# New terminal
cd /var/www/homeopathy-business-platform/services/api-golang-v2
./bin/api
```

You should see:
```
Starting Yeelo Homeopathy ERP API v2...
Server running on :3005
Database connected successfully
```

### 3. Test Import
- Go to: http://localhost:3000/products/import-export
- Upload: Template_File_Medicine_Product_List.csv
- Watch live logs!

---

## Port Summary

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✅ From start-complete.sh |
| Redis | 6379 | ✅ From start-complete.sh |
| Kafka | 9092 | ✅ From start-complete.sh |
| MinIO | 9000 | ✅ From start-complete.sh |
| API Gateway | 4000 | ✅ From start-complete.sh |
| Frontend | 3000 | ✅ From start-complete.sh |
| **Import API** | **3005** | ⚠️ **Start manually!** |

---

## Quick Commands

### Check if services are running:
```bash
# Check Docker
docker-compose ps

# Check Import API
curl http://localhost:3005/health

# Check Frontend
curl http://localhost:3000
```

### View logs:
```bash
# Frontend logs
tail -f logs/frontend.log

# Import API logs (if running in background)
tail -f logs/api-golang-v2.log

# Docker logs
docker-compose logs -f postgres
```

### Stop everything:
```bash
# Stop complete platform
./stop-complete.sh

# Stop Import API (if running in background)
pkill -f "api-golang-v2"

# Stop Docker
docker-compose down
```

---

## Summary

**To test the import fix:**

1. ✅ Run `./start-complete.sh` (starts infrastructure + frontend)
2. ✅ Run `cd services/api-golang-v2 && ./bin/api` (starts import API)
3. ✅ Upload CSV at http://localhost:3000/products/import-export
4. ✅ Watch 2288 products import successfully! 🎉

**The import API (port 3005) is the one with all our fixes!**
