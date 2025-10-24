# Quick Start - Backend Services

## Problem: All Backend Services Are Down

You're seeing this because no backend services are running on ports 3004, 3005, 4000, 8005, 8006.

## Solution: Start the Primary Backend Service

### Option 1: Start Only API Golang v2 (Recommended)

This starts the main ERP API on port 3005 which handles all dashboard, inventory, and core features:

```bash
./START-BACKEND-ONLY.sh
```

This will:
- Kill any existing processes on backend ports
- Start API Golang v2 on port 3005
- Show the process ID
- Test health endpoint
- Create log file at `logs/api-golang-v2.log`

### Option 2: Manual Start

```bash
# Navigate to service
cd services/api-golang-v2/cmd

# Set environment
export PORT=3005
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy?sslmode=disable"

# Run service
go run main.go
```

### Option 3: Build and Run

```bash
cd services/api-golang-v2/cmd
go build -o api-v2 main.go
PORT=3005 ./api-v2
```

## Test if Backend is Running

```bash
# Check health
curl http://localhost:3005/health

# Test dashboard stats
curl http://localhost:3005/api/erp/dashboard/stats

# Run audit
./scripts/service-audit.sh
```

## Check Logs

```bash
# View logs (if started with script)
tail -f logs/api-golang-v2.log

# Or check console output if run manually
```

## Stop Service

```bash
# Find process
lsof -ti:3005

# Kill it
kill $(lsof -ti:3005)

# Or if you noted the PID
kill <PID>
```

## Database Connection

The service needs PostgreSQL running. Make sure:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or
pg_isready

# Connect to database
psql -U postgres -d yeelo_homeopathy
```

## Common Issues

### Issue: "go: cannot find main module"
**Solution:** Make sure you're in the right directory
```bash
cd services/api-golang-v2/cmd
go run main.go
```

### Issue: "Database connection failed"
**Solution:** Check PostgreSQL is running and database exists
```bash
sudo systemctl start postgresql
psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;"
```

### Issue: "Port already in use"
**Solution:** Kill existing process
```bash
kill $(lsof -ti:3005)
```

### Issue: Missing dependencies
**Solution:** Install Go modules
```bash
cd services/api-golang-v2
go mod download
go mod tidy
```

## What Runs on Each Port

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Next.js | Frontend (already running) |
| 3005 | **API Golang v2** | **Primary backend** - ERP Core |
| 3004 | API Golang v1 | Legacy (optional) |
| 4000 | API Gateway | Auth routing (optional) |
| 8005 | Invoice Parser | PDF parsing (optional) |
| 8006 | Purchase Service | GRN (optional) |

**You only need port 3005 running for the dashboard to work!**

## Verify Everything Works

1. Start backend: `./START-BACKEND-ONLY.sh`
2. Check health: `curl http://localhost:3005/health`
3. Open browser: `http://localhost:3000/dashboard`
4. Should see live data!

## Quick Commands

```bash
# Start backend
./START-BACKEND-ONLY.sh

# Check all services
./scripts/service-audit.sh

# View logs
tail -f logs/api-golang-v2.log

# Stop backend
kill $(lsof -ti:3005)
```

**Now your dashboard will show live data instead of 404 errors!**
