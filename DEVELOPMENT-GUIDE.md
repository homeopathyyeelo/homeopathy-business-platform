# 🚀 Development Guide - Homeopathy Business Platform

## Quick Start

### One Command to Rule Them All

```bash
make start-all
```

This single command will:
- ✅ Check prerequisites (Docker, Node.js, etc.)
- ✅ Stop any conflicting services
- ✅ Start all infrastructure (Kafka, PostgreSQL, Redis, MinIO)
- ✅ Setup database (generate Prisma client, run migrations)
- ✅ Start all application services via Turbo
- ✅ Display service status and URLs

### Stop Everything

```bash
make stop-all
```

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflows](#development-workflows)
4. [Service Details](#service-details)
5. [Database Management](#database-management)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Docker Compose Files](#docker-compose-files)

## Prerequisites

### Required Software

- **Docker** (v20.10+) & **Docker Compose** (v2.0+)
- **Node.js** (v18+) & **npm** (v9+)
- **netcat** (for port checking)
- **Git**

### Installation

#### Ubuntu/Debian
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# netcat
sudo apt-get install netcat
```

#### macOS
```bash
# Docker Desktop
brew install --cask docker

# Node.js
brew install node@18

# netcat (usually pre-installed)
brew install netcat
```

### Verify Installation

```bash
docker --version
docker compose version
node --version
npm --version
nc -h
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│                    http://localhost:3000                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│  API Gateway    │    │ GraphQL Gateway │
│  Port: 5000     │    │  Port: 4000     │
└────────┬────────┘    └────────┬────────┘
         │                      │
    ┌────┴──────────────────────┴─────┐
    │                                  │
┌───▼────────┐  ┌──────────┐  ┌──────▼──────┐
│ Fastify API│  │ Express  │  │ AI Service  │
│ Port: 3002 │  │ API      │  │ Port: 8001  │
└─────┬──────┘  └────┬─────┘  └──────┬──────┘
      │              │                │
      └──────────────┴────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│   PostgreSQL    │    │     Kafka       │
│   Port: 5433    │    │   Port: 9092    │
└─────────────────┘    └─────────────────┘
         │                      │
    ┌────┴──────────────────────┴─────┐
    │                                  │
┌───▼─────┐  ┌──────────┐  ┌─────────▼──┐
│  Redis  │  │  MinIO   │  │ Zookeeper  │
│  6380   │  │  9000    │  │   2181     │
└─────────┘  └──────────┘  └────────────┘
```

## Development Workflows

### Option 1: All-in-One (Recommended for Most)

Start everything with one command:

```bash
make start-all
```

This is perfect for:
- Full-stack development
- Testing integrations
- Demo/presentation
- New developers getting started

### Option 2: Infrastructure + Local Apps

Run infrastructure in Docker, apps locally:

```bash
# Terminal 1: Start infrastructure
make up

# Terminal 2: Setup database
make db-generate
make db-migrate
make db-seed

# Terminal 3: Run apps with hot reload
make dev
```

This is perfect for:
- Frontend-focused development
- Faster app restarts
- Debugging with breakpoints

### Option 3: Selective Services

Start only what you need:

```bash
# Infrastructure only
make up

# Database setup
make db-migrate

# Just the frontend
npm run dev:app

# Or individual services
cd services/api-fastify && npm run dev
```

This is perfect for:
- Working on specific services
- Resource-constrained machines
- Microservice development

## Service Details

### Infrastructure Services

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **Zookeeper** | 2181 | Kafka coordination | `nc -z localhost 2181` |
| **Kafka** | 9092 | Event streaming | `nc -z localhost 9092` |
| **PostgreSQL** | 5433 | Primary database | `nc -z localhost 5433` |
| **Redis** | 6380 | Caching & sessions | `nc -z localhost 6380` |
| **MinIO** | 9000, 9001 | Object storage | `curl http://localhost:9000/minio/health/live` |
| **Kafka UI** | 8080 | Kafka monitoring | `curl http://localhost:8080` |

### Application Services

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Next.js** | 3000 | React 19 | Frontend application |
| **API Fastify** | 3002 | Fastify | High-performance API |
| **API Gateway** | 5000 | Express | API aggregation |
| **GraphQL Gateway** | 4000 | GraphQL | Unified GraphQL API |
| **AI Service** | 8001 | Python/FastAPI | ML & AI operations |

### Service URLs

```bash
# Frontend
http://localhost:3000

# APIs
http://localhost:5000/api        # REST API Gateway
http://localhost:4000/graphql    # GraphQL Playground
http://localhost:3002/docs       # Fastify API Docs

# Monitoring
http://localhost:8080            # Kafka UI
http://localhost:9001            # MinIO Console (minio/minio123)

# Database
postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
```

## Database Management

### Prisma Workflow

```bash
# Generate Prisma client (after schema changes)
make db-generate

# Create and apply migrations
make db-migrate

# Seed database with sample data
make db-seed

# Reset database (⚠️ destructive)
make db-reset
```

### Direct Database Access

```bash
# Using psql
docker exec -it yeelo-postgres psql -U postgres -d yeelo_homeopathy

# Using pgAdmin or any GUI client
Host: localhost
Port: 5433
User: postgres
Password: postgres
Database: yeelo_homeopathy
```

### Common Database Tasks

```bash
# Check database connection
npm run db:generate

# View migration status
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name your_migration_name

# View data in Prisma Studio
npx prisma studio
```

## Testing

### Smoke Tests

Quick health check of all services:

```bash
make smoke
```

### End-to-End Tests

```bash
# Run all E2E tests
make test

# Run with UI
npm run test:e2e:headed
```

### Load Testing

```bash
# Campaign spike test
make k6-campaign

# Custom load test
BASE_URL=http://localhost:3000 k6 run k6/order-flow.js
```

### Unit Tests

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check which ports are in use
make check-ports

# Stop all services
make stop-all

# Kill specific port
lsof -ti:3000 | xargs kill -9
```

#### Database Connection Issues

```bash
# Reset database
make db-reset

# Check PostgreSQL logs
docker logs yeelo-postgres

# Restart PostgreSQL
docker compose -f docker-compose.infra.yml restart postgres
```

#### Kafka Not Starting

```bash
# Check Kafka logs
docker logs yeelo-kafka

# Restart Kafka and Zookeeper
docker compose -f docker-compose.infra.yml restart zookeeper kafka

# Wait for Kafka to be ready
while ! nc -z localhost 9092; do sleep 1; done
```

#### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clean Turbo cache
npx turbo clean
```

#### Docker Issues

```bash
# Clean Docker system
docker system prune -a

# Remove all volumes (⚠️ data loss)
docker compose -f docker-compose.infra.yml down -v

# Rebuild containers
docker compose -f docker-compose.infra.yml up -d --build
```

### Viewing Logs

```bash
# Application logs
tail -f logs/turbo-dev.log

# Infrastructure logs
make logs

# Specific service logs
docker logs yeelo-postgres -f
docker logs yeelo-kafka -f

# All logs
docker compose -f docker-compose.infra.yml logs -f
```

### Debug Mode

```bash
# Enable debug logging for Next.js
DEBUG=* npm run dev:app

# Enable Prisma query logging
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy?connection_limit=5&pool_timeout=20&log=query" npm run dev
```

## Docker Compose Files

### Active Files

| File | Purpose | Use Case |
|------|---------|----------|
| `docker-compose.infra.yml` | Infrastructure only | **Recommended for development** |
| `docker-compose.master.yml` | Complete stack | Full integration testing |
| `docker-compose.production.yml` | Production config | Deployment |

### Archived Files

The following files have been consolidated and can be archived:

- `docker-compose.dev.yml` → Merged into `infra.yml`
- `docker-compose.kafka.yml` → Merged into `infra.yml`
- `docker-compose.ai.yml` → Merged into `master.yml`
- `docker-compose.simple.yml` → Superseded by `infra.yml`
- `docker-compose.prod.yml` → Duplicate of `production.yml`

To archive redundant files:

```bash
make clean-yaml
```

## Useful Commands

### Makefile Commands

```bash
make help           # Show all commands

# Quick Start
make start-all      # Start everything
make stop-all       # Stop everything
make restart-all    # Restart everything

# Infrastructure
make up             # Start infrastructure
make down           # Stop infrastructure
make status         # Show status

# Database
make db-generate    # Generate Prisma client
make db-migrate     # Run migrations
make db-seed        # Seed database
make db-reset       # Reset database

# Development
make dev            # Run with Turbo
make build          # Build all services

# Testing
make test           # Run tests
make smoke          # Health checks
make k6-campaign    # Load test

# Maintenance
make clean-yaml     # Archive old compose files
make logs           # View logs
make clean          # Clean artifacts
make check-ports    # Check port usage
```

### NPM Scripts

```bash
# Development
npm run dev              # Run all services
npm run dev:app          # Run Next.js only

# Build
npm run build            # Build all
npm run build:app        # Build Next.js

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database

# Testing
npm run test             # Run tests
npm run test:e2e         # E2E tests
```

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"

# Redis
REDIS_URL="redis://localhost:6380"

# Kafka
KAFKA_BROKERS="localhost:9092"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"

# AI Service (optional)
OPENAI_API_KEY="your-openai-api-key"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:4000/graphql"
```

### Environment-Specific Configs

- **Development**: `.env` (local)
- **Production**: `configs/env-prod`
- **Example**: `env.example`

## Performance Tips

### Development

1. **Use infrastructure-only mode** for faster app restarts
2. **Enable hot reload** in all services
3. **Use Turbo cache** for faster builds
4. **Limit Docker resources** if on constrained hardware

### Production

1. **Build optimized images** with multi-stage Dockerfiles
2. **Use connection pooling** for database
3. **Enable Redis caching** for frequent queries
4. **Configure Kafka properly** for high throughput

## Contributing

### Code Style

- **TypeScript**: Use strict mode
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with recommended rules
- **Commits**: Conventional commits format

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and test locally
3. Run `make test` and `make smoke`
4. Create PR with clear description
5. Wait for CI/CD checks to pass

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Docker Documentation](https://docs.docker.com/)
- [Turbo Documentation](https://turbo.build/repo/docs)

---

**Need Help?** Run `make help` or check the troubleshooting section above.
