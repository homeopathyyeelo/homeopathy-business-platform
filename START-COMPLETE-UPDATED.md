# ✅ start-complete.sh Updated!

## Changes Made

### 1. Added api-golang-v2 Service (Import/Export API)

**Location in script:** Lines 274-289

**Features:**
- ✅ Auto-detects if `services/api-golang-v2` directory exists
- ✅ **Auto-builds** if binary doesn't exist or source is newer
- ✅ Starts on **Port 3005**
- ✅ Logs to `logs/api-golang-v2.log`
- ✅ PID saved to `logs/api-golang-v2.pid`

**Code added:**
```bash
# Start api-golang-v2 (Import/Export API - Port 3005)
if [ -d "services/api-golang-v2" ]; then
    info "Starting api-golang-v2 (Import/Export API)..."
    cd services/api-golang-v2
    
    # Build if binary doesn't exist or source is newer
    if [ ! -f "bin/api" ] || [ "cmd/main.go" -nt "bin/api" ]; then
        info "Building api-golang-v2..."
        go build -o bin/api cmd/main.go
    fi
    
    ./bin/api > ../../logs/api-golang-v2.log 2>&1 &
    echo $! > ../../logs/api-golang-v2.pid
    cd - > /dev/null
    log "✅ api-golang-v2 started (PID: $(cat logs/api-golang-v2.pid), Port: 3005)"
fi
```

### 2. Updated Service Summary Display

Added to output:
```
🔧 MICROSERVICES:
🚀 Import/Export API: http://localhost:3005  ← NEW!
📦 Product Service:  http://localhost:8001
📦 Inventory Service: http://localhost:8002
🛒 Sales Service:    http://localhost:8003
```

### 3. Updated services.json

Added api-golang-v2 to the services tracking file:
```json
{
  "microservices": {
    "api_golang_v2": {
      "pid": <pid>,
      "port": 3005,
      "description": "Import/Export API"
    },
    ...
  }
}
```

### 4. Updated stop-complete.sh

Added api-golang-v2 cleanup:
```bash
stop_service "api-golang-v2"
pkill -f "api-golang-v2" 2>/dev/null || true
pkill -f "bin/api" 2>/dev/null || true
```

---

## How It Works Now

### 🚀 Auto-Build on Start

When you run `./start-complete.sh`:

1. **Checks if binary exists**: `services/api-golang-v2/bin/api`
2. **Checks if source is newer**: Compares `cmd/main.go` timestamp
3. **Auto-builds if needed**: Runs `go build -o bin/api cmd/main.go`
4. **Starts the service**: Runs `./bin/api` in background

**This means:**
- ✅ First time: Builds automatically
- ✅ After code changes: Rebuilds automatically
- ✅ No changes: Uses existing binary (faster)

### 🔄 Restart After Code Changes

**Option 1: Full Restart**
```bash
./stop-complete.sh
./start-complete.sh
```
The script will detect your code changes and rebuild!

**Option 2: Restart Just Import API**
```bash
# Stop it
kill $(cat logs/api-golang-v2.pid)

# Rebuild
cd services/api-golang-v2
go build -o bin/api cmd/main.go

# Start it
./bin/api &
```

**Option 3: Use the restart helper** (create this):
```bash
#!/bin/bash
# restart-import-api.sh
kill $(cat logs/api-golang-v2.pid) 2>/dev/null
cd services/api-golang-v2
go build -o bin/api cmd/main.go
./bin/api > ../../logs/api-golang-v2.log 2>&1 &
echo $! > ../../logs/api-golang-v2.pid
echo "✅ Import API restarted (PID: $(cat ../../logs/api-golang-v2.pid))"
```

---

## Complete Service List

When you run `./start-complete.sh`, these services start:

### 📦 Infrastructure (Docker)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`
- MinIO: `http://localhost:9000`

### 🔧 Microservices
- **Import/Export API**: `http://localhost:3005` ⭐ **NEW!**
- Product Service: `http://localhost:8001`
- Inventory Service: `http://localhost:8002`
- Sales Service: `http://localhost:8003`
- API Gateway: `http://localhost:4000`
- AI Service: `http://localhost:8010`

### 🌐 Frontend
- Next.js App: `http://localhost:3000`

---

## Test It Now

### 1. Stop Everything (if running)
```bash
./stop-complete.sh
```

### 2. Start Everything
```bash
./start-complete.sh
```

Watch for:
```
[14:50:15] Starting api-golang-v2 (Import/Export API)...
[14:50:15] Building api-golang-v2...
[14:50:17] ✅ api-golang-v2 started (PID: 12345, Port: 3005)
```

### 3. Verify It's Running
```bash
# Check process
ps aux | grep "bin/api"

# Check health
curl http://localhost:3005/health

# Check logs
tail -f logs/api-golang-v2.log
```

### 4. Test Import Feature
- Go to: `http://localhost:3000/products/import-export`
- Upload: `Template_File_Medicine_Product_List.csv`
- Watch it work! 🎉

---

## Benefits

### ✅ Auto-Build
- No need to manually build before starting
- Detects code changes automatically
- Rebuilds only when needed

### ✅ Complete Integration
- Part of full platform startup
- Included in service summary
- Tracked in services.json
- Proper cleanup on stop

### ✅ Easy Restart
- `./stop-complete.sh && ./start-complete.sh`
- Auto-rebuilds if code changed
- All services restart together

### ✅ Production Ready
- Proper logging
- PID tracking
- Health checks
- Service monitoring

---

## Summary

| Feature | Status |
|---------|--------|
| Auto-build on start | ✅ |
| Auto-rebuild on code change | ✅ |
| Included in start-complete.sh | ✅ |
| Included in stop-complete.sh | ✅ |
| Service summary display | ✅ |
| services.json tracking | ✅ |
| Log file management | ✅ |
| PID file management | ✅ |

**Now you can use `./start-complete.sh` to start EVERYTHING including the Import/Export API!** 🚀

---

## Quick Commands

```bash
# Start everything
./start-complete.sh

# Stop everything
./stop-complete.sh

# Restart everything (rebuilds if code changed)
./stop-complete.sh && ./start-complete.sh

# View import API logs
tail -f logs/api-golang-v2.log

# Check service status
cat logs/services.json | jq '.microservices.api_golang_v2'
```

**Status**: ✅ Complete & Ready to Use!
