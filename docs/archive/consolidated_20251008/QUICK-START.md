# 🚀 Quick Start Guide

## ✅ Fixed Issues
- ✅ Golang worker missing `go.mod` and `go.sum` - **FIXED**
- ✅ NestJS/Fastify Dockerfiles using `npm ci` without lock files - **FIXED**

---

## 🎯 Three Ways to Start

### Option 1: Infrastructure Only (Recommended for Development)
**Best for:** Local development with apps running outside Docker

```bash
./START-INFRA.sh
```

**What runs:**
- ✅ PostgreSQL (Port 5433)
- ✅ Redis (Port 6380)
- ✅ Kafka (Port 9092)
- ✅ Zookeeper (Port 2181)
- ✅ MinIO (Port 9000, Console: 9001)
- ✅ Kafka UI (Port 8080)

**Then run apps locally:**
```bash
# Terminal 1: NestJS API
cd services/api-nest
npm install
npm run start:dev

# Terminal 2: Python AI Service
cd services/ai-service
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8001

# Terminal 3: Next.js Frontend
npm run dev:app
```

---

### Option 2: Simple Setup (Core Services in Docker)
**Best for:** Testing with minimal services

```bash
./START-SIMPLE.sh
```

**What runs:**
- ✅ All infrastructure (PostgreSQL, Redis, Kafka, MinIO)
- ✅ NestJS API (Port 3001) + Swagger
- ✅ Python AI Service (Port 8001) + Swagger
- ✅ Kafka UI (Port 8080)

**Access:**
- NestJS Swagger: http://localhost:3001/api
- Python AI Swagger: http://localhost:8001/docs
- Kafka UI: http://localhost:8080

---

### Option 3: Full Setup (All 16 Services)
**Best for:** Production-like environment

```bash
./START-ALL-SERVICES.sh
```

**What runs:**
- ✅ All infrastructure
- ✅ 5 Backend APIs (NestJS, Fastify, Express, Golang, Python)
- ✅ 2 Gateways (GraphQL, REST)
- ✅ 2 Workers
- ✅ Next.js Frontend
- ✅ Monitoring tools

---

## 🛠️ Common Commands

### Start Services
```bash
# Infrastructure only
./START-INFRA.sh

# Core services
./START-SIMPLE.sh

# All services
./START-ALL-SERVICES.sh
```

### Stop Services
```bash
# Infrastructure
docker-compose -f docker-compose.infra.yml down

# Simple
docker-compose -f docker-compose.simple.yml down

# All
docker-compose -f docker-compose.master.yml down
```

### View Logs
```bash
# Infrastructure
docker-compose -f docker-compose.infra.yml logs -f

# Simple
docker-compose -f docker-compose.simple.yml logs -f [service-name]

# All
docker-compose -f docker-compose.master.yml logs -f [service-name]
```

### Check Status
```bash
docker-compose -f docker-compose.infra.yml ps
docker-compose -f docker-compose.simple.yml ps
docker-compose -f docker-compose.master.yml ps
```

---

## 🗄️ Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Seed database
npm run db:seed

# Access PostgreSQL
docker exec -it yeelo-postgres psql -U postgres -d yeelo_homeopathy
```

---

## 🧪 Testing

### Test Infrastructure
```bash
# PostgreSQL
docker exec -it yeelo-postgres pg_isready -U postgres

# Redis
docker exec -it yeelo-redis redis-cli ping

# Kafka
docker exec -it yeelo-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Test APIs
```bash
# NestJS
curl http://localhost:3001/health

# Python AI
curl http://localhost:8001/health

# GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## 📊 Access Points

### Infrastructure
```
PostgreSQL:     localhost:5433
Redis:          localhost:6380
Kafka:          localhost:9092
Zookeeper:      localhost:2181
MinIO Console:  http://localhost:9001
MinIO API:      http://localhost:9000
Kafka UI:       http://localhost:8080
```

### APIs (when running)
```
NestJS API:     http://localhost:3001
  Swagger:      http://localhost:3001/api
  
Fastify API:    http://localhost:3002
  Swagger:      http://localhost:3002/documentation
  
Express API:    http://localhost:3003
  Swagger:      http://localhost:3003/api-docs
  
Golang API:     http://localhost:3004

Python AI:      http://localhost:8001
  Swagger:      http://localhost:8001/docs
  
GraphQL:        http://localhost:4000/graphql
  Playground:   http://localhost:4000
  
API Gateway:    http://localhost:5000
```

### Frontend
```
Next.js App:    http://localhost:3000
```

---

## 🐛 Troubleshooting

### Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.simple.yml build --no-cache
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose file
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs yeelo-postgres

# Restart PostgreSQL
docker restart yeelo-postgres
```

### Kafka Issues
```bash
# Check Kafka is running
docker ps | grep kafka

# Check logs
docker logs yeelo-kafka

# Restart Kafka stack
docker restart yeelo-zookeeper yeelo-kafka
```

---

## 💡 Recommended Workflow

### For Development
1. Start infrastructure only:
   ```bash
   ./START-INFRA.sh
   ```

2. Run apps locally for hot reload:
   ```bash
   cd services/api-nest && npm run start:dev
   cd services/ai-service && uvicorn src.main:app --reload
   npm run dev:app
   ```

### For Testing
1. Start simple setup:
   ```bash
   ./START-SIMPLE.sh
   ```

2. Test APIs via Swagger:
   - http://localhost:3001/api
   - http://localhost:8001/docs

### For Production-like Testing
1. Start all services:
   ```bash
   ./START-ALL-SERVICES.sh
   ```

2. Test full integration

---

## 📚 Documentation

- **Complete Setup:** `COMPLETE-SETUP-GUIDE.md`
- **API Reference:** `API-REFERENCE.md`
- **Deployment:** `DEPLOYMENT-READY.md`
- **Overview:** `README-COMPLETE-SETUP.md`

---

## ✨ Summary

**Three startup scripts:**
1. `./START-INFRA.sh` - Infrastructure only (fastest, best for dev)
2. `./START-SIMPLE.sh` - Core services (NestJS + Python AI)
3. `./START-ALL-SERVICES.sh` - All 16 services (full platform)

**Choose based on your needs:**
- **Developing?** → Use `START-INFRA.sh` + run apps locally
- **Testing APIs?** → Use `START-SIMPLE.sh`
- **Full integration?** → Use `START-ALL-SERVICES.sh`

---

**🎉 You're all set! Choose your startup option and begin!**
