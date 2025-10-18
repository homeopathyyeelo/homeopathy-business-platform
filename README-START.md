# 🚀 YEELO HOMEOPATHY PLATFORM - START GUIDE

## ✅ ONE COMMAND TO START EVERYTHING

```bash
./start.sh
```

That's it! Wait 15-20 seconds and everything will be running.

---

## 📋 WHAT IT DOES

1. ✅ Checks infrastructure (PostgreSQL, Redis, Kafka)
2. ✅ Stops old services
3. ✅ Sets environment variables
4. ✅ Starts all 5 services:
   - Golang v2 (Port 3005) - Main API
   - NestJS (Port 3001) - Purchases API
   - Fastify (Port 3002) - Marketing API
   - Express (Port 3004) - Orders API
   - Frontend (Port 3000) - Next.js Web UI
5. ✅ Tests each service
6. ✅ Shows status

---

## 🎯 EXPECTED OUTPUT

```
════════════════════════════════════════════════════════════════
🚀 YEELO HOMEOPATHY PLATFORM
════════════════════════════════════════════════════════════════

[1/6] Checking Infrastructure...
  ✅ PostgreSQL (localhost:5433)
  ✅ Redis (localhost:6380)
  ✅ Kafka (localhost:9092)

[2/6] Stopping Old Services...
  ✅ Cleaned up

[3/6] Setting Environment...
  ✅ Environment configured

[4/6] Starting Services...
  Starting Golang v2 (3005)... PID: 12345
  Starting NestJS (3001)... PID: 12346
  Starting Fastify (3002)... PID: 12347
  Starting Express (3004)... PID: 12348
  Starting Frontend (3000)... PID: 12349

Waiting 15 seconds for services to start...

[5/6] Testing Services...
  Golang-v2 (3005): ✅ HEALTHY
  NestJS (3001): ✅ HEALTHY
  Fastify (3002): ✅ HEALTHY
  Express (3004): ✅ HEALTHY
  Frontend (3000): ✅ HEALTHY

════════════════════════════════════════════════════════════════
✅ SUCCESS - 5/5 SERVICES RUNNING
════════════════════════════════════════════════════════════════

📱 ACCESS YOUR APPLICATION:
   Frontend:     http://localhost:3000
```

---

## 🌐 ACCESS URLS

### Main Application
- **Frontend:** http://localhost:3000
- **Main API:** http://localhost:3005/health

### Other APIs
- **NestJS (Purchases):** http://localhost:3001/health
- **Fastify (Marketing):** http://localhost:3002/health
- **Express (Orders):** http://localhost:3004/health

### Infrastructure
- **Kafka UI:** http://localhost:8080
- **pgAdmin:** http://localhost:5050 (admin@admin.com / admin)
- **MinIO Console:** http://localhost:9001 (minioadmin / minioadmin)

---

## 📝 VIEW LOGS

```bash
# All services
tail -f logs/*.log

# Specific service
tail -f logs/golang-v2.log
tail -f logs/nestjs.log
tail -f logs/fastify.log
tail -f logs/express.log
tail -f logs/frontend.log
```

---

## 🛑 STOP SERVICES

**Press Ctrl+C** in the terminal running `./start.sh`

Or manually:
```bash
pkill -9 -f "go run"
pkill -9 -f "node.*dist"
pkill -9 -f "next"
```

---

## 🔄 RESTART

Just run again:
```bash
./start.sh
```

---

## ⚠️ IF SERVICES DON'T START

### 1. Check Infrastructure
```bash
# PostgreSQL
docker ps | grep postgres

# If not running:
docker-compose -f docker-compose.production.yml up -d postgres redis kafka
```

### 2. Check Logs
```bash
tail -f logs/golang-v2.log  # Look for errors
tail -f logs/nestjs.log
```

### 3. Check Ports
```bash
# Make sure ports are free
lsof -i :3000  # Frontend
lsof -i :3005  # Golang v2
lsof -i :3001  # NestJS
```

### 4. Install Dependencies
```bash
# Golang v2
cd services/api-golang-v2
go mod tidy

# NestJS
cd services/api-nest
npm install

# Frontend
npm install
```

---

## 🧪 TEST THE SYSTEM

```bash
# Quick test
curl http://localhost:3005/health
curl http://localhost:3001/health
curl http://localhost:3000

# Full test (if available)
./RUN-ALL-TESTS.sh
```

---

## 🎉 THAT'S IT!

One script: `./start.sh`
One README: This file

No confusion. Just run it. 🚀
