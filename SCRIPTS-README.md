# 📜 Development Scripts Guide

This document explains all the development scripts available in this project.

## 🚀 Main Startup Scripts

### `dev-start.sh` - Complete Development Environment

**Purpose**: One-command startup for the entire development stack.

**Usage**:
```bash
./dev-start.sh
# OR
make start-all
```

**What it does**:
1. ✅ Checks prerequisites (Docker, Node.js, netcat)
2. ✅ Validates Docker daemon is running
3. ✅ Checks for port conflicts and offers to stop existing services
4. ✅ Starts all infrastructure services (Kafka, PostgreSQL, Redis, MinIO)
5. ✅ Waits for each service to be healthy
6. ✅ Generates Prisma client
7. ✅ Runs database migrations
8. ✅ Optionally seeds the database
9. ✅ Starts all application services via Turbo
10. ✅ Displays service status and URLs
11. ✅ Follows application logs

**Features**:
- **Color-coded output** for easy reading
- **Smart health checks** for all services
- **Interactive prompts** for database seeding
- **Automatic conflict resolution**
- **Detailed logging** to `logs/` directory
- **Live service status** display

**Logs Created**:
- `logs/docker-pull.log` - Docker image pull logs
- `logs/docker-up.log` - Docker compose startup logs
- `logs/db-generate.log` - Prisma client generation logs
- `logs/db-migrate.log` - Database migration logs
- `logs/db-seed.log` - Database seeding logs (if run)
- `logs/turbo-dev.log` - Application service logs
- `logs/turbo.pid` - Turbo process ID

**Exit Behavior**:
- Services continue running in the background
- Press Ctrl+C to exit log view (services keep running)
- Use `./stop-dev.sh` to stop all services

---

### `stop-dev.sh` - Stop All Services

**Purpose**: Gracefully stop all development services.

**Usage**:
```bash
./stop-dev.sh
# OR
make stop-all
```

**What it does**:
1. Stops all Node.js processes (Turbo, Next.js)
2. Stops all Docker containers
3. Optionally removes Docker volumes

**Interactive**:
- Asks if you want to remove data volumes
- Safe by default (keeps data)

---

## 🧹 Cleanup Scripts

### `cleanup-docker-compose.sh` - Archive Redundant Files

**Purpose**: Clean up and archive redundant docker-compose files.

**Usage**:
```bash
./cleanup-docker-compose.sh
# OR
make clean-yaml
```

**What it does**:
1. Analyzes all docker-compose files
2. Identifies redundant files
3. Creates timestamped archive directory
4. Moves redundant files to archive
5. Creates README in archive explaining changes

**Files Archived**:
- `docker-compose.dev.yml` → Merged into infra.yml
- `docker-compose.kafka.yml` → Merged into infra.yml
- `docker-compose.ai.yml` → Merged into master.yml
- `docker-compose.simple.yml` → Superseded by infra.yml
- `docker-compose.prod.yml` → Duplicate of production.yml

**Files Kept**:
- `docker-compose.infra.yml` - Infrastructure only (recommended)
- `docker-compose.master.yml` - Complete stack
- `docker-compose.production.yml` - Production config
- `docker-compose.microservices.yml` - Alternative architecture

**Archive Format**:
```
docker-compose-archive-YYYYMMDD/
├── README.md
├── docker-compose.dev.yml
├── docker-compose.kafka.yml
└── ...
```

---

## 🔧 Service-Specific Scripts

### `services/api-golang/start.sh`

**Purpose**: Start the Golang API service.

**Usage**:
```bash
cd services/api-golang
./start.sh
```

### `services/api-golang/test-api.sh`

**Purpose**: Test the Golang API endpoints.

**Usage**:
```bash
cd services/api-golang
./test-api.sh
```

---

## 📊 Makefile Commands

The Makefile provides convenient shortcuts for all scripts:

### Quick Start
```bash
make start-all      # Run dev-start.sh
make stop-all       # Run stop-dev.sh
make restart-all    # Stop then start
```

### Infrastructure
```bash
make up             # Start infrastructure only
make down           # Stop infrastructure
make status         # Show container status
```

### Database
```bash
make db-generate    # Generate Prisma client
make db-migrate     # Run migrations
make db-seed        # Seed database
make db-reset       # Reset database (destructive)
```

### Development
```bash
make dev            # Run Turbo dev mode
make build          # Build all services
```

### Testing
```bash
make test           # Run all tests
make smoke          # Health check all services
make k6-campaign    # Run load tests
```

### Maintenance
```bash
make clean-yaml     # Run cleanup-docker-compose.sh
make logs           # Follow infrastructure logs
make clean          # Clean build artifacts
make check-ports    # Check port usage
```

---

## 🔍 Port Checking

### Check All Ports

```bash
make check-ports
```

**Output**:
```
Infrastructure:
  Zookeeper (2181):  ✓ In use
  Kafka (9092):      ✓ In use
  PostgreSQL (5433): ✓ In use
  Redis (6380):      ✓ In use
  MinIO (9000):      ✓ In use
  Kafka UI (8080):   ✓ In use

Application:
  Next.js (3000):    ✓ In use
  API Gateway (5000):✓ In use
  GraphQL (4000):    ✓ In use
  AI Service (8001): ✗ Available
```

### Kill Specific Port

```bash
# Find process on port
lsof -ti:3000

# Kill process on port
lsof -ti:3000 | xargs kill -9
```

---

## 📝 Log Files

All logs are stored in the `logs/` directory:

| File | Purpose |
|------|---------|
| `docker-pull.log` | Docker image pull output |
| `docker-up.log` | Docker compose startup |
| `db-generate.log` | Prisma client generation |
| `db-migrate.log` | Database migrations |
| `db-seed.log` | Database seeding |
| `turbo-dev.log` | Application services (main log) |
| `turbo.pid` | Turbo process ID |
| `npm-install.log` | Dependency installation |

### View Logs

```bash
# Application logs
tail -f logs/turbo-dev.log

# Infrastructure logs
make logs
# OR
docker compose -f docker-compose.infra.yml logs -f

# Specific service
docker logs yeelo-postgres -f
docker logs yeelo-kafka -f
```

---

## 🎯 Common Workflows

### First Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd homeopathy-business-platform

# 2. Start everything
make start-all

# 3. Wait for services to start
# 4. Open http://localhost:3000
```

### Daily Development

```bash
# Start services
make start-all

# Develop...

# Stop when done
make stop-all
```

### Infrastructure Only

```bash
# Start infrastructure
make up

# Setup database
make db-generate
make db-migrate

# Run apps locally
npm run dev
```

### Reset Everything

```bash
# Stop all services
make stop-all

# Clean artifacts
make clean

# Remove volumes (⚠️ data loss)
docker compose -f docker-compose.infra.yml down -v

# Start fresh
make start-all
```

### Troubleshooting

```bash
# Check what's running
make smoke
make status
make check-ports

# View logs
tail -f logs/turbo-dev.log
make logs

# Reset database
make db-reset

# Clean start
make stop-all
make clean
make start-all
```

---

## 🚨 Troubleshooting Scripts

### Port Already in Use

```bash
# Check ports
make check-ports

# Stop all
make stop-all

# Or kill specific port
lsof -ti:3000 | xargs kill -9
```

### Services Not Starting

```bash
# Check logs
tail -f logs/turbo-dev.log

# Check Docker
docker ps
docker compose -f docker-compose.infra.yml ps

# Restart infrastructure
docker compose -f docker-compose.infra.yml restart
```

### Database Issues

```bash
# Check connection
npm run db:generate

# Reset database
make db-reset

# Check PostgreSQL
docker logs yeelo-postgres
```

### Kafka Issues

```bash
# Check Kafka
docker logs yeelo-kafka

# Restart Kafka stack
docker compose -f docker-compose.infra.yml restart zookeeper kafka

# Check Kafka UI
open http://localhost:8080
```

---

## 🔐 Security Notes

### Default Credentials

**PostgreSQL**:
- Host: localhost
- Port: 5433
- User: postgres
- Password: postgres
- Database: yeelo_homeopathy

**MinIO**:
- Console: http://localhost:9001
- User: minio
- Password: minio123

**⚠️ Change these in production!**

### Environment Variables

Create `.env` file with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
REDIS_URL="redis://localhost:6380"
KAFKA_BROKERS="localhost:9092"
JWT_SECRET="change-this-in-production"
```

---

## 📚 Additional Resources

- **Complete Guide**: [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)
- **Quick Start**: [▶️-START-HERE-NEW.md](./▶️-START-HERE-NEW.md)
- **Makefile Help**: Run `make help`

---

## 🤝 Contributing

When creating new scripts:

1. **Make them executable**: `chmod +x script.sh`
2. **Add shebang**: `#!/bin/bash`
3. **Use set -e**: Exit on error
4. **Add colors**: Use the color variables
5. **Add logging**: Write to `logs/` directory
6. **Add to Makefile**: Create a make target
7. **Document here**: Add to this README

---

**Need Help?** Check the troubleshooting section or run `make help`
