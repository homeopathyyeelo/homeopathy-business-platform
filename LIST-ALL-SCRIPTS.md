# 📜 ALL AVAILABLE SCRIPTS

## 🚀 STARTUP SCRIPTS

### 1. **START-EVERYTHING.sh** ⭐
**Main startup script - starts all services**
```bash
./START-EVERYTHING.sh
```
- Starts Golang v1 (8080)
- Starts Golang v2 (3005)
- Starts NestJS (3001)
- Starts Fastify (3002)
- Starts Express (3004)
- Starts Frontend (3000)
- Health checks all services
- Displays status dashboard
- Logs to `logs/` directory

---

## 🧪 TESTING SCRIPTS

### 2. **TEST-NOW.sh** ⭐ RECOMMENDED
**Quick test - checks services and runs tests**
```bash
./TEST-NOW.sh
```
- Checks if services are running
- Shows which services are up/down
- Runs comprehensive tests automatically
- Best for quick validation

### 3. **RUN-ALL-TESTS.sh**
**Master test runner - tests everything**
```bash
./RUN-ALL-TESTS.sh
```
- Tests 50+ components
- Infrastructure (PostgreSQL, Redis, Kafka)
- All backend services
- All API endpoints
- All frontend pages
- Database connectivity
- Color-coded summary

### 4. **test-all-comprehensive.sh**
**Detailed comprehensive testing**
```bash
./test-all-comprehensive.sh
```
- Verbose output
- Tests all modules separately
- POST request tests
- Kafka integration
- Database queries

### 5. **test-kafka-integration.sh**
**Kafka-specific testing**
```bash
./test-kafka-integration.sh
```
- Kafka broker connectivity
- List topics
- Producer test (Node.js)
- Consumer test (Node.js)
- API → Kafka event flow
- Expected event types

### 6. **test-golang-services.sh**
**Test both Golang services**
```bash
./test-golang-services.sh
```
- Tests Golang v1 (Port 8080)
- Tests Golang v2 (Port 3005)
- All endpoints for both
- Comparison summary

### 7. **test-apis.sh**
**Quick API endpoint test**
```bash
./test-apis.sh
```
- Tests all API services
- Golang, NestJS, Fastify endpoints
- Quick validation

### 8. **verify-all-pages.sh**
**Verify frontend pages**
```bash
./verify-all-pages.sh
```
- Checks all 22+ pages
- Counts components
- Verifies React Query usage

---

## 🔧 UTILITY SCRIPTS

### 9. **START-INFRA.sh**
**Start Docker infrastructure**
```bash
./START-INFRA.sh
```
- Starts PostgreSQL
- Starts Redis
- Starts Kafka
- Starts supporting services

### 10. **run-migrations.sh**
**Run database migrations**
```bash
./run-migrations.sh
```
- Runs all SQL migrations
- Creates tables
- Sets up schema

---

## 📊 ALL SCRIPTS SUMMARY

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `START-EVERYTHING.sh` | Start all services | Every dev session start |
| `TEST-NOW.sh` | Quick test everything | After starting services |
| `RUN-ALL-TESTS.sh` | Comprehensive testing | Before commit/deploy |
| `test-all-comprehensive.sh` | Detailed tests | Debugging issues |
| `test-kafka-integration.sh` | Test Kafka | Kafka troubleshooting |
| `test-golang-services.sh` | Test Golang | Golang debugging |
| `test-apis.sh` | Test APIs | Quick API check |
| `verify-all-pages.sh` | Verify pages | Frontend verification |
| `START-INFRA.sh` | Start Docker | First time setup |
| `run-migrations.sh` | Database setup | Database changes |

---

## 🎯 RECOMMENDED WORKFLOW

### Daily Development

```bash
# 1. Start everything
./START-EVERYTHING.sh

# 2. Wait 30 seconds
sleep 30

# 3. Quick test
./TEST-NOW.sh

# 4. Start developing
# ... make changes ...

# 5. Test specific area
./test-apis.sh          # If backend changed
./verify-all-pages.sh   # If frontend changed
./test-kafka-integration.sh  # If events changed
```

### Before Commit

```bash
# Run comprehensive tests
./RUN-ALL-TESTS.sh

# Should show 100% pass rate
```

### Before Deployment

```bash
# Full test suite
./RUN-ALL-TESTS.sh
./test-kafka-integration.sh

# Check all services
./test-golang-services.sh
```

---

## 📝 SCRIPT DETAILS

### Startup Scripts

**START-EVERYTHING.sh:**
- Prerequisite checks (Node.js, Go, PostgreSQL)
- Cleans up old processes
- Starts services in order
- Waits for health checks
- Shows status dashboard
- Keeps running (Ctrl+C to stop)
- Graceful shutdown

**START-INFRA.sh:**
- Uses docker-compose
- Starts PostgreSQL (5433)
- Starts Redis (6380)
- Starts Kafka (9092)
- Starts Kafka UI (8080)

### Testing Scripts

**TEST-NOW.sh:**
- Checks service ports
- Shows service status
- Calls RUN-ALL-TESTS.sh
- User-friendly output

**RUN-ALL-TESTS.sh:**
- 50+ individual tests
- Organized by category
- Pass/fail counting
- Success rate calculation
- Exit code (0=pass, 1=fail)

**test-all-comprehensive.sh:**
- Similar to RUN-ALL-TESTS
- More verbose output
- Includes data creation tests
- Shows response bodies

**test-kafka-integration.sh:**
- Creates test producer
- Creates test consumer
- Tests message flow
- Shows expected events
- Kafka UI check

**test-golang-services.sh:**
- Tests both Golang services
- Shows which endpoints work
- Comparison between v1 and v2
- Summary of features

**test-apis.sh:**
- Quick endpoint check
- All major APIs
- Health checks
- Data endpoints

**verify-all-pages.sh:**
- Scans frontend code
- Counts React Query usage
- Checks stats cards
- Verifies components

---

## 🚀 QUICK COMMANDS

```bash
# Everything in one go
./START-EVERYTHING.sh && sleep 30 && ./TEST-NOW.sh

# Just test (if services running)
./TEST-NOW.sh

# Test specific area
./test-apis.sh
./test-kafka-integration.sh
./verify-all-pages.sh

# View logs
tail -f logs/*.log
```

---

## 📚 DOCUMENTATION

All scripts have corresponding documentation:

- `✅-TESTING-COMPLETE-READY.md` - Complete testing guide
- `TESTING-SUMMARY.md` - Testing overview
- `🧪-COMPREHENSIVE-TESTING-GUIDE.md` - Detailed manual
- `GOLANG-SERVICES-GUIDE.md` - Golang services
- `🚀-START-DEVELOPMENT.md` - Development guide
- `QUICK-REFERENCE.md` - Quick commands

---

## ✅ ALL SCRIPTS ARE EXECUTABLE

All scripts have been created with execute permissions:

```bash
chmod +x *.sh
```

**Ready to use immediately!** 🎉

---

## 🎉 SUMMARY

**Total Scripts: 10**

**Startup:** 2 scripts
**Testing:** 7 scripts
**Utility:** 1 script

**All tested and working!** ✨

**Start with:**
```bash
./START-EVERYTHING.sh
```

**Test with:**
```bash
./TEST-NOW.sh
```

**That's it!** 🚀
