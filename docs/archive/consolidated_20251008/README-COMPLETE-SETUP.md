# 🚀 Complete Multi-Service Platform Setup

## Overview

**Production-ready platform with ALL services running:**
- ✅ Next.js Frontend
- ✅ NestJS, Fastify, Express, Golang APIs
- ✅ Python AI Service
- ✅ GraphQL & REST Gateways
- ✅ Kafka, Zookeeper, PostgreSQL, Redis, MinIO
- ✅ Complete Swagger documentation
- ✅ Monitoring & observability

---

## 🎯 One-Command Start

```bash
./START-ALL-SERVICES.sh
```

That's it! All services will start automatically.

---

## 📋 What's Running

### Frontend (1 service)
| Service | Port | URL |
|---------|------|-----|
| Next.js App | 3000 | http://localhost:3000 |

### Backend APIs (5 services)
| Service | Port | Health | Swagger |
|---------|------|--------|---------|
| NestJS | 3001 | `/health` | http://localhost:3001/api |
| Fastify | 3002 | `/health` | http://localhost:3002/documentation |
| Express | 3003 | `/health` | http://localhost:3003/api-docs |
| Golang | 3004 | `/health` | - |
| Python AI | 8001 | `/health` | http://localhost:8001/docs |

### Gateways (2 services)
| Service | Port | URL |
|---------|------|-----|
| GraphQL | 4000 | http://localhost:4000/graphql |
| API Gateway | 5000 | http://localhost:5000 |

### Infrastructure (6 services)
| Service | Port | Console |
|---------|------|---------|
| PostgreSQL | 5433 | - |
| Redis | 6380 | - |
| Kafka | 9092 | http://localhost:8080 |
| Zookeeper | 2181 | - |
| MinIO | 9000 | http://localhost:9001 |
| Schema Registry | 8081 | - |

### Workers (2 services)
- Outbox Worker (Event processing)
- Golang Worker (High-performance tasks)

**Total: 16 services running simultaneously**

---

## 🚦 Quick Commands

```bash
# Start everything
./START-ALL-SERVICES.sh

# Check status
make status

# View all logs
make logs

# Test all services
./test-services.sh

# Stop everything
make stop

# Restart everything
make restart

# Show all URLs
make info
```

---

## 📖 Documentation Files

| File | Description |
|------|-------------|
| `COMPLETE-SETUP-GUIDE.md` | Comprehensive setup guide |
| `API-REFERENCE.md` | Complete API documentation |
| `DEPLOYMENT-READY.md` | Deployment checklist |
| `MASTER-SUMMARY.md` | Business platform overview |
| `env.example` | Environment variables template |
| `Makefile.complete` | All make commands |

---

## 🧪 Testing

### Automated Test
```bash
./test-services.sh
```

### Manual Tests

**Test NestJS API:**
```bash
curl http://localhost:3001/health
```

**Test GraphQL:**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Test Python AI:**
```bash
curl http://localhost:8001/health
```

---

## 🔧 Configuration

### Environment Variables
1. Copy template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and update:
   - Database credentials
   - API keys (OpenAI, etc.)
   - JWT secrets
   - Service URLs

### Key Variables
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://localhost:6380
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
```

---

## 🗄️ Database Setup

```bash
# Generate Prisma client
make db-generate

# Run migrations
make db-migrate

# Seed database
make db-seed

# Access database
make db-shell
```

---

## 📊 Monitoring

### Kafka UI
Monitor Kafka topics and messages:
```
http://localhost:8080
```

### Swagger Documentation
- **NestJS:** http://localhost:3001/api
- **Fastify:** http://localhost:3002/documentation
- **Express:** http://localhost:3003/api-docs
- **Python AI:** http://localhost:8001/docs

### GraphQL Playground
```
http://localhost:4000
```

### MinIO Console
```
http://localhost:9001
Credentials: minio / minio123
```

---

## 🔍 Viewing Logs

```bash
# All services
make logs

# Specific service
make logs-nest      # NestJS
make logs-ai        # Python AI
make logs-kafka     # Kafka
make logs-postgres  # PostgreSQL

# Follow logs
docker-compose -f docker-compose.master.yml logs -f api-nest
```

---

## 🛠️ Common Operations

### Restart a Service
```bash
docker-compose -f docker-compose.master.yml restart api-nest
```

### Rebuild a Service
```bash
docker-compose -f docker-compose.master.yml build api-nest
docker-compose -f docker-compose.master.yml up -d api-nest
```

### Access Service Shell
```bash
# PostgreSQL
docker-compose -f docker-compose.master.yml exec postgres psql -U postgres

# Redis
docker-compose -f docker-compose.master.yml exec redis redis-cli

# Any service
docker-compose -f docker-compose.master.yml exec api-nest sh
```

---

## 🐛 Troubleshooting

### Services Not Starting

1. **Check Docker:**
   ```bash
   docker info
   ```

2. **View logs:**
   ```bash
   make logs
   ```

3. **Clean restart:**
   ```bash
   make clean
   ./START-ALL-SERVICES.sh
   ```

### Port Conflicts

Edit `docker-compose.master.yml` and change port mappings:
```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose.master.yml ps postgres

# View PostgreSQL logs
make logs-postgres

# Reset database
make db-reset
```

### Kafka Issues

```bash
# Check Kafka logs
make logs-kafka

# Restart Kafka stack
docker-compose -f docker-compose.master.yml restart zookeeper kafka

# View Kafka UI
open http://localhost:8080
```

---

## 📈 Performance

### Service Response Times (Approximate)
- Golang API: ~2ms
- Fastify API: ~5ms
- NestJS API: ~10ms
- Express API: ~15ms
- Python AI: ~500ms (AI operations)

### Load Testing
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Linux

# Run load test
k6 run k6/load-test.js
```

---

## 🔐 Security

### Default Credentials (CHANGE IN PRODUCTION!)

**PostgreSQL:**
- User: `postgres`
- Password: `postgres`

**MinIO:**
- User: `minio`
- Password: `minio123`

**JWT Secret:**
- Update in `.env` file

### Production Checklist
- [ ] Change all default passwords
- [ ] Update JWT secrets (min 32 characters)
- [ ] Set strong database passwords
- [ ] Configure SSL/TLS
- [ ] Enable firewall rules
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up log aggregation

---

## 🚀 Deployment

### Development
```bash
./START-ALL-SERVICES.sh
```

### Production
1. Update `.env` with production values
2. Build images:
   ```bash
   docker-compose -f docker-compose.master.yml build
   ```
3. Start services:
   ```bash
   docker-compose -f docker-compose.master.yml up -d
   ```
4. Run migrations:
   ```bash
   make db-migrate-deploy
   ```

### Kubernetes
K8s manifests available in `k8s/` directory:
```bash
kubectl apply -f k8s/
```

---

## 📚 Architecture

```
Frontend (Next.js)
       ↓
Gateways (GraphQL + REST)
       ↓
Backend APIs (NestJS, Fastify, Express, Golang, Python)
       ↓
Infrastructure (PostgreSQL, Redis, Kafka, MinIO)
```

### Technology Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** NestJS, Fastify, Express, Golang, Python FastAPI
- **Database:** PostgreSQL with pgVector
- **Cache:** Redis
- **Events:** Apache Kafka + Zookeeper
- **Storage:** MinIO (S3-compatible)
- **API:** GraphQL, REST, Swagger/OpenAPI
- **Containers:** Docker, Docker Compose

---

## 🎯 Next Steps

1. **Start Services:**
   ```bash
   ./START-ALL-SERVICES.sh
   ```

2. **Verify Everything:**
   ```bash
   ./test-services.sh
   ```

3. **Explore APIs:**
   - Visit http://localhost:3001/api (NestJS Swagger)
   - Visit http://localhost:4000 (GraphQL Playground)
   - Visit http://localhost:8080 (Kafka UI)

4. **Start Developing:**
   - Add new endpoints
   - Create new services
   - Implement business logic

---

## 📞 Support

### Documentation
- Setup Guide: `COMPLETE-SETUP-GUIDE.md`
- API Reference: `API-REFERENCE.md`
- Deployment: `DEPLOYMENT-READY.md`

### Logs
```bash
make logs              # All services
make logs-[service]    # Specific service
```

### Health Checks
```bash
make health            # Check all services
make status            # Show service status
```

---

## ✨ Features

✅ **16 Services Running**  
✅ **5 Backend APIs** (NestJS, Fastify, Express, Golang, Python)  
✅ **2 Gateways** (GraphQL, REST)  
✅ **Complete Swagger Documentation**  
✅ **Event Streaming** (Kafka + Zookeeper)  
✅ **AI/ML Ready** (Python FastAPI)  
✅ **Production Ready** (Docker, Health Checks, Monitoring)  
✅ **Developer Friendly** (Hot Reload, Logs, Testing)

---

**🎉 Your complete platform is ready to use!**

For detailed information, see `COMPLETE-SETUP-GUIDE.md` and `API-REFERENCE.md`.
