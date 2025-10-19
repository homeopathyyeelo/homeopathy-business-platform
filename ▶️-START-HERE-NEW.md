# 🏥 Homeopathy Business Platform

Welcome! This is the complete ERP system for homeopathy businesses.

## 🚀 Quick Start (New & Improved!)

### One Command to Start Everything:

```bash
make start-all
# OR
./dev-start.sh
```

This will automatically:
- ✅ Check prerequisites (Docker, Node.js, netcat)
- ✅ Stop any conflicting services
- ✅ Start all infrastructure (Kafka, PostgreSQL, Redis, MinIO)
- ✅ Setup and migrate database (Prisma generate + migrations)
- ✅ Launch all application services via Turbo
- ✅ Display service status and live URLs
- ✅ Follow application logs

### Stop Everything:

```bash
make stop-all
```

## 📚 Documentation

- **[QUICK-START.md](./QUICK-START.md)** - Get running in 5 minutes
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development guide
- **Makefile Commands** - Run `make help` to see all available commands

## 🎯 Available Commands

```bash
make help           # Show all available commands

# Quick Start
make start-all      # Start everything (one command!)
make stop-all       # Stop everything
make restart-all    # Restart everything

# Infrastructure
make up             # Start infrastructure only
make down           # Stop infrastructure
make status         # Show infrastructure status

# Database
make db-generate    # Generate Prisma client
make db-migrate     # Run migrations
make db-seed        # Seed with sample data
make db-reset       # Reset database

# Development
make dev            # Run apps with Turbo
make build          # Build all services

# Testing
make test           # Run tests
make smoke          # Health check all services

# Maintenance
make clean-yaml     # Clean up old docker-compose files
make logs           # View infrastructure logs
make clean          # Clean build artifacts
make check-ports    # Check which ports are in use
```

## 🌐 Service Endpoints

Once running, access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **API (NestJS)** | http://localhost:3001 | - |
| **AI Service** | http://localhost:8001 | - |
| **Kafka UI** | http://localhost:8080 | - |
| **MinIO Console** | http://localhost:9001 | minio/minio123 |
| **PostgreSQL** | localhost:5433 | postgres/postgres |

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway → Backend Services → Infrastructure
                                         ↓
                              Kafka, PostgreSQL, Redis
```

## 📦 What's New?

### 🚀 Improved Startup Script (`dev-start.sh`)
- **Comprehensive prerequisite checks** (Docker, Node.js, ports)
- **Automatic conflict resolution** (stops existing services)
- **Smart health monitoring** for all infrastructure services
- **Better error handling** with detailed logs
- **Interactive prompts** for database seeding
- **Live service status** display with color-coded output
- **Automatic log following** after startup

### 📋 Organized Docker Compose Files
- `docker-compose.infra.yml` - Infrastructure only (recommended for dev)
- `docker-compose.master.yml` - Complete setup with all services
- `docker-compose.production.yml` - Production ready configuration
- **Cleanup script** to archive redundant files

### 🛠️ Enhanced Makefile
- Clear categorized commands with descriptions
- Better output formatting and colors
- Enhanced smoke tests for all services
- Database reset functionality
- **New**: Port checking utility (`make check-ports`)
- **New**: Improved cleanup commands

## 🔧 Development Workflow

### Option 1: All-in-One (Easiest)
```bash
make start-all
# Wait for services to start
# Visit http://localhost:3000
```

### Option 2: Infrastructure + Local Apps
```bash
# Terminal 1: Start infrastructure
make up

# Terminal 2: Setup database
make db-generate
make db-migrate
make db-seed

# Terminal 3: Run apps
make dev
```

### Option 3: Step-by-Step
```bash
# Start only what you need
make up              # Infrastructure
make db-migrate      # Database
npm run dev:app      # Just the frontend
# Or run individual services as needed
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Check which ports are in use
make check-ports

# Stop everything and start fresh
make stop-all
make start-all

# Kill specific port manually
lsof -ti:3000 | xargs kill -9
```

### Database Issues
```bash
# Reset database (destructive)
make db-reset

# Check PostgreSQL logs
docker logs yeelo-postgres

# Restart PostgreSQL only
docker compose -f docker-compose.infra.yml restart postgres
```

### Services Not Starting
```bash
# Check service health
make smoke

# Check infrastructure status
make status

# View detailed logs
tail -f logs/turbo-dev.log     # Application logs
make logs                       # Infrastructure logs
docker logs yeelo-kafka -f      # Specific service
```

### Kafka Issues
```bash
# Restart Kafka and Zookeeper
docker compose -f docker-compose.infra.yml restart zookeeper kafka

# Check Kafka UI
open http://localhost:8080
```

### Clean Start
```bash
# Stop everything
make stop-all

# Clean artifacts
make clean

# Remove Docker volumes (⚠️ data loss)
docker compose -f docker-compose.infra.yml down -v

# Start fresh
make start-all
```

## 🧹 Cleanup Old Files

We've consolidated the docker-compose files. To archive old/redundant files:

```bash
make clean-yaml
# OR
./cleanup-docker-compose.sh
```

This will help you archive:
- `docker-compose.dev.yml` → Merged into infra.yml
- `docker-compose.kafka.yml` → Merged into infra.yml
- `docker-compose.ai.yml` → Merged into master.yml
- `docker-compose.simple.yml` → Superseded by infra.yml
- `docker-compose.prod.yml` → Duplicate of production.yml

Archived files will be moved to a timestamped directory with a README explaining the changes.

## 📖 Learn More

- **Complete Guide**: [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md) - Comprehensive development documentation
- **API Documentation**: Check individual service READMEs in `services/` directory
- **Database Schema**: See `prisma/schema.prisma`
- **Architecture**: See architecture diagram in DEVELOPMENT-GUIDE.md
- **Troubleshooting**: Detailed troubleshooting section in DEVELOPMENT-GUIDE.md

## 🎉 That's It!

You're ready to develop! Start with:

```bash
make start-all
```

Then open http://localhost:3000

---

**Need help?** Run `make help` or check [DEVELOPMENT.md](./DEVELOPMENT.md)
