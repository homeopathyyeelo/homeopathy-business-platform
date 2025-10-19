# Development Guide

Complete guide for setting up and running the Homeopathy Business Platform in development mode.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Starting Services](#starting-services)
- [Docker Compose Files](#docker-compose-files)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Service Endpoints](#service-endpoints)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18+)
- **npm** (v9+)
- **netcat** (for health checks)

### Verify Installation

```bash
docker --version
docker-compose --version
node --version
npm --version
```

## 🚀 Quick Start

### Option 1: One Command to Rule Them All

The fastest way to get everything running:

```bash
make start-all
```

This will:
1. ✅ Check prerequisites
2. 🏗️ Start all infrastructure (Kafka, PostgreSQL, Redis, MinIO)
3. 💾 Setup database (generate, migrate)
4. 🚀 Start all application services
5. 📊 Display service status

**To stop everything:**

```bash
make stop-all
```

### Option 2: Step-by-Step (Recommended for First Time)

```bash
# 1. Start infrastructure only
make up

# 2. Setup database
make db-generate
make db-migrate
make db-seed  # Optional: seed with sample data

# 3. Start application services
make dev

# 4. In a new terminal, verify everything is running
make smoke
```

## 🏗️ Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                     Next.js (Port 3000)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAYS                            │
│  GraphQL Gateway (4000)  │  REST Gateway (5000)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                          │
│  NestJS (3001) │ Fastify (3002) │ Express (3003)            │
│  Golang (3004) │ AI Service (8001)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                           │
│  Kafka (9092) │ PostgreSQL (5433) │ Redis (6380)            │
│  MinIO (9000) │ Zookeeper (2181)                            │
└─────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

- **Next.js Frontend**: User interface and SSR
- **GraphQL Gateway**: Unified GraphQL API
- **REST Gateway**: REST API aggregation
- **NestJS API**: Main ERP backend
- **Fastify API**: High-performance endpoints
- **Express API**: Legacy support
- **Golang API**: Low-latency services
- **AI Service**: ML/AI operations (Python/FastAPI)
- **Kafka**: Event streaming and messaging
- **PostgreSQL**: Primary database (with pgvector)
- **Redis**: Caching and session management
- **MinIO**: Object storage (S3-compatible)

## 🎯 Starting Services

### Full Development Stack

```bash
# Start everything (infrastructure + apps)
make start-all
```

### Infrastructure Only

For development where you run apps locally:

```bash
# Start infrastructure
make up

# In separate terminals, run individual services
cd services/api-nest && npm run start:dev
cd services/ai-service && uvicorn src.main:app --reload
npm run dev:app  # Next.js frontend
```

### Using Turbo (All Apps Together)

```bash
# Start infrastructure first
make up

# Then run all apps with Turbo
make dev
```

This uses Turborepo to run all services in parallel with hot reload.

## 📁 Docker Compose Files

We maintain three main Docker Compose configurations:

### 1. `docker-compose.infra.yml` ⭐ **RECOMMENDED**

**Purpose:** Infrastructure services only

**Use Case:** Development with locally running application servers

**Services:**
- Zookeeper
- Kafka + Kafka UI
- PostgreSQL (with pgvector)
- Redis
- MinIO

**Usage:**
```bash
docker-compose -f docker-compose.infra.yml up -d
```

### 2. `docker-compose.master.yml`

**Purpose:** Complete setup with all microservices

**Use Case:** Testing the complete system in Docker

**Services:**
- All infrastructure services
- All API services (NestJS, Fastify, Express, Golang)
- AI Service
- GraphQL Gateway
- API Gateway
- Frontend (Next.js)
- Workers

**Usage:**
```bash
docker-compose -f docker-compose.master.yml up -d
```

### 3. `docker-compose.production.yml`

**Purpose:** Production-ready configuration

**Use Case:** Production deployment

**Features:**
- Health checks
- Resource limits
- Optimized settings
- Security hardening
- Monitoring tools (pgAdmin)

**Usage:**
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Deprecated Files

The following files are redundant and can be archived:

- ❌ `docker-compose.dev.yml` → Use `docker-compose.infra.yml`
- ❌ `docker-compose.kafka.yml` → Merged into `docker-compose.infra.yml`
- ❌ `docker-compose.ai.yml` → Merged into `docker-compose.master.yml`
- ❌ `docker-compose.microservices.yml` → Uses RabbitMQ (we use Kafka)
- ❌ `docker-compose.simple.yml` → Subset of `docker-compose.infra.yml`
- ❌ `docker-compose.prod.yml` → Use `docker-compose.production.yml`

**To clean up:**
```bash
make clean-yaml
```

## 📝 Common Tasks

### Database Operations

```bash
# Generate Prisma client
make db-generate

# Run migrations
make db-migrate

# Seed database with sample data
make db-seed

# Reset database (drop + migrate + seed)
make db-reset
```

### View Logs

```bash
# Infrastructure logs
make logs

# Application logs (Turbo)
tail -f logs/turbo-dev.log

# Specific Docker service
docker-compose -f docker-compose.infra.yml logs -f postgres
```

### Health Checks

```bash
# Quick smoke test
make smoke

# Check infrastructure status
make status

# Individual service checks
curl http://localhost:8001/health  # AI Service
curl http://localhost:3000/api/health  # Next.js
```

### Building for Production

```bash
# Build all services
make build

# Build specific service
cd services/api-nest && npm run build
```

### Load Testing

```bash
# Run K6 campaign test
make k6-campaign
```

## 🐛 Troubleshooting

### Port Already in Use

If you see port conflict errors:

```bash
# Stop everything first
make stop-all

# Or manually stop conflicting services
docker-compose -f docker-compose.infra.yml down
pkill -f "node"
pkill -f "next dev"
```

### Database Connection Issues

```bash
# Restart PostgreSQL
docker-compose -f docker-compose.infra.yml restart postgres

# Check if PostgreSQL is ready
nc -z localhost 5433 && echo "PostgreSQL is up"

# View PostgreSQL logs
docker logs yeelo-postgres
```

### Kafka Not Ready

```bash
# Wait for Kafka to fully start (can take 30-60s)
docker logs yeelo-kafka -f

# Test Kafka connection
docker exec -it yeelo-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Prisma Issues

```bash
# Clear Prisma cache and regenerate
rm -rf node_modules/.prisma
make db-generate
```

### Clean Build

```bash
# Remove all build artifacts
make clean

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose -f docker-compose.infra.yml down -v

# Clean Docker system
docker system prune -a

# Restart Docker daemon (if nothing else works)
sudo systemctl restart docker
```

## 🌐 Service Endpoints

### Infrastructure

| Service | Endpoint | Credentials |
|---------|----------|-------------|
| Zookeeper | `localhost:2181` | - |
| Kafka | `localhost:9092` | - |
| Kafka UI | `http://localhost:8080` | - |
| PostgreSQL | `localhost:5433` | postgres/postgres |
| Redis | `localhost:6380` | - |
| MinIO API | `http://localhost:9000` | minio/minio123 |
| MinIO Console | `http://localhost:9001` | minio/minio123 |

### Application Services

| Service | Port | URL |
|---------|------|-----|
| Next.js Frontend | 3000 | http://localhost:3000 |
| NestJS API | 3001 | http://localhost:3001 |
| Fastify API | 3002 | http://localhost:3002 |
| Express API | 3003 | http://localhost:3003 |
| Golang API | 3004 | http://localhost:3004 |
| GraphQL Gateway | 4000 | http://localhost:4000/graphql |
| REST API Gateway | 5000 | http://localhost:5000 |
| AI Service | 8001 | http://localhost:8001 |

### Database Connection String

```
postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
```

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🆘 Getting Help

1. Check the logs: `make logs` or `tail -f logs/turbo-dev.log`
2. Run smoke tests: `make smoke`
3. View this guide: `cat DEVELOPMENT.md`
4. Check Docker status: `make status`

## 📞 Quick Reference

```bash
# Start everything
make start-all

# Stop everything
make stop-all

# Restart everything
make restart-all

# View help
make help

# Check what's running
make smoke
```

---

**Happy Coding! 🚀**
