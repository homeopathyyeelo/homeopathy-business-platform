# 🚀 Unified Startup System

## TL;DR

Start **EVERYTHING** with one command:

```bash
make start-all
```

Stop **EVERYTHING**:

```bash
make stop-all
```

See all commands:

```bash
make help
```

## What Gets Started?

### Infrastructure (Docker)
- ✅ **Zookeeper** (Port 2181) - Kafka coordination
- ✅ **Kafka** (Port 9092) - Event streaming
- ✅ **PostgreSQL** (Port 5433) - Database with pgvector
- ✅ **Redis** (Port 6380) - Caching & sessions
- ✅ **MinIO** (Ports 9000/9001) - S3-compatible storage
- ✅ **Kafka UI** (Port 8080) - Kafka monitoring

### Application Services (Turborepo)
- ✅ **Next.js** (Port 3000) - Frontend
- ✅ **NestJS API** (Port 3001) - Main backend
- ✅ **Fastify API** (Port 3002) - High-performance API
- ✅ **Express API** (Port 3003) - Legacy support
- ✅ **Golang API** (Port 3004) - Low-latency services
- ✅ **AI Service** (Port 8001) - Python/FastAPI ML service
- ✅ **GraphQL Gateway** (Port 4000) - Unified GraphQL
- ✅ **REST Gateway** (Port 5000) - REST aggregation

### Database
- ✅ **Prisma Generate** - Client generation
- ✅ **Migrations** - Schema updates
- ✅ **Seeding** - Sample data (optional)

## Quick Commands

| Command | What It Does |
|---------|-------------|
| `make start-all` | Start everything (infrastructure + apps) |
| `make stop-all` | Stop everything |
| `make restart-all` | Restart everything |
| `make up` | Start infrastructure only |
| `make down` | Stop infrastructure |
| `make dev` | Run apps (requires infra running) |
| `make smoke` | Health check all services |
| `make status` | Show infrastructure status |
| `make logs` | View infrastructure logs |

## Service URLs

Once running:

- Frontend: http://localhost:3000
- NestJS API: http://localhost:3001
- Fastify API: http://localhost:3002
- AI Service: http://localhost:8001
- GraphQL: http://localhost:4000/graphql
- Kafka UI: http://localhost:8080
- MinIO Console: http://localhost:9001

## Features

✅ **One Command Start** - No more manual steps
✅ **Health Checks** - Waits for services to be ready
✅ **Auto Database Setup** - Migrations run automatically
✅ **Status Dashboard** - See what's running
✅ **Colored Output** - Easy to read
✅ **Error Handling** - Clear error messages
✅ **Log Management** - All logs in `./logs/`
✅ **Port Conflict Detection** - Auto cleanup

## What's Different?

### Before 😩
```bash
docker-compose -f docker-compose.kafka.yml up -d
docker-compose -f docker-compose.dev.yml up -d
# Wait... is it ready yet?
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
# Which service failed? Where are the logs?
```

### Now 😎
```bash
make start-all
# ✓ Everything starts automatically
# ✓ Health checks ensure readiness
# ✓ Status dashboard shows everything
# ✓ Logs in one place
# ✓ Interactive and user-friendly
```

## Files Overview

| File | Purpose |
|------|---------|
| `start-dev.sh` | Main startup script |
| `stop-dev.sh` | Stop all services |
| `cleanup-yaml.sh` | Archive old docker-compose files |
| `Makefile` | Command shortcuts |
| `QUICK-START.md` | 5-minute quick start |
| `DEVELOPMENT.md` | Complete dev guide |
| `docker-compose.infra.yml` | Infrastructure only |
| `docker-compose.master.yml` | Complete setup |
| `docker-compose.production.yml` | Production config |

## Troubleshooting

### Port in use?
```bash
make stop-all
make start-all
```

### Database issues?
```bash
make db-reset
```

### Check what's running
```bash
make smoke
```

### View logs
```bash
make logs                    # Infrastructure
tail -f logs/turbo-dev.log   # Applications
```

## Documentation

- **Quick Start**: `QUICK-START.md` - Get running in 5 minutes
- **Full Guide**: `DEVELOPMENT.md` - Complete documentation
- **Changelog**: `CHANGELOG-STARTUP-SYSTEM.md` - What changed
- **Commands**: `make help` - All available commands

## Clean Up Old Files

We've consolidated docker-compose files. To archive old ones:

```bash
make clean-yaml
```

This identifies and optionally archives:
- `docker-compose.dev.yml`
- `docker-compose.kafka.yml`
- `docker-compose.ai.yml`
- `docker-compose.microservices.yml`
- `docker-compose.simple.yml`
- `docker-compose.prod.yml`

## First Time Setup

```bash
# 1. Start everything
make start-all

# 2. Wait for completion (automatic)

# 3. Open browser
open http://localhost:3000

# 4. That's it! 🎉
```

## Daily Development

```bash
# Morning: Start everything
make start-all

# Develop...

# Evening: Stop everything
make stop-all
```

## Advanced Usage

### Start infrastructure only
```bash
make up
```

### Run apps locally (outside Docker)
```bash
make up              # Infrastructure
make db-migrate      # Database
npm run dev:app      # Just frontend
# or
make dev             # All apps with Turbo
```

### Reset database
```bash
make db-reset
```

### View specific service logs
```bash
docker logs yeelo-postgres -f
docker logs yeelo-kafka -f
```

## Need Help?

1. Run `make help` for all commands
2. Run `make smoke` to check service health
3. Check `DEVELOPMENT.md` for detailed guide
4. Check logs in `./logs/` directory

---

**Everything you need is one command away!** 🚀

```bash
make start-all
```
