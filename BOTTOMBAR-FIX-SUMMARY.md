# BottomBar 404 Errors - Fixed

## Problem
BottomBar component was calling two non-existent API endpoints:
1. `GET http://localhost:3005/api/v1/system/health` - 404 Not Found
2. `GET http://localhost:3005/api/erp/pos/counters` - 404 Not Found

This caused console errors and ERR_CONNECTION_REFUSED when API service wasn't running.

## Solution

### 1. Created System Handler (Backend)
**File:** `services/api-golang-v2/internal/handlers/system_handler.go`

**New Endpoints:**
- `GET /api/v1/system/health` - Returns health status of all services (database, redis, kafka, api)
- `GET /api/v1/system/info` - Returns system information (version, uptime, etc.)
- `GET /api/erp/pos/counters` - Returns POS counter status (connected, synced)

**Response Format:**
```json
// /api/v1/system/health
{
  "success": true,
  "data": {
    "services": [
      {"service": "database", "status": "up", "latency": 5},
      {"service": "redis", "status": "up", "latency": 2},
      {"service": "kafka", "status": "up", "latency": 10},
      {"service": "api", "status": "up", "latency": 1}
    ]
  }
}

// /api/erp/pos/counters
{
  "success": true,
  "data": [
    {
      "id": "counter-1",
      "name": "Counter 1",
      "status": "connected",
      "syncStatus": "synced",
      "lastSync": "2025-10-26T12:30:00Z",
      "user": "Admin"
    }
  ]
}
```

### 2. Updated Main.go (Backend)
**File:** `services/api-golang-v2/cmd/main.go`

**Changes:**
- Added `systemHandler := handlers.NewSystemHandler()`
- Created `/api/v1/system` route group
- Added system health endpoints
- Added POS counter endpoint under `/api/erp/pos`

### 3. Enhanced BottomBar Component (Frontend)
**File:** `components/layout/BottomBar.tsx`

**Improvements:**
- Added request timeout (5 seconds) to prevent hanging
- Added AbortController for proper request cancellation
- Changed `console.error` to `console.debug` for graceful degradation
- Wrapped each fetch in try-catch for independent error handling
- Service failures no longer spam console with errors

**Before:**
```typescript
const healthRes = await fetch('http://localhost:3005/api/v1/system/health');
// Would throw ERR_CONNECTION_REFUSED if service down
```

**After:**
```typescript
const healthController = new AbortController();
const healthTimeout = setTimeout(() => healthController.abort(), 5000);

try {
  const healthRes = await fetch('http://localhost:3005/api/v1/system/health', {
    signal: healthController.signal
  });
  clearTimeout(healthTimeout);
  // Process response...
} catch (healthError) {
  console.debug('Health check failed:', healthError); // Silent fail
}
```

## Testing

### Start API Service
```bash
cd services/api-golang-v2
go run cmd/main.go
```

### Test Endpoints
```bash
# System health
curl http://localhost:3005/api/v1/system/health

# POS counters
curl http://localhost:3005/api/erp/pos/counters

# System info
curl http://localhost:3005/api/v1/system/info
```

### Expected Results
- ✅ No more 404 errors in console
- ✅ No more ERR_CONNECTION_REFUSED errors
- ✅ BottomBar shows system health status
- ✅ BottomBar shows POS counter sync status
- ✅ Graceful degradation when API is down

## Status: ✅ FIXED

**Files Created:**
1. `services/api-golang-v2/internal/handlers/system_handler.go` - New handler

**Files Modified:**
1. `services/api-golang-v2/cmd/main.go` - Added routes
2. `components/layout/BottomBar.tsx` - Enhanced error handling

**Next Steps:**
- Start the Golang API service: `cd services/api-golang-v2 && go run cmd/main.go`
- Refresh browser to see BottomBar working without errors
- System health will show real-time status of all services

---

**Fixed on:** October 26, 2025, 12:40 PM IST
