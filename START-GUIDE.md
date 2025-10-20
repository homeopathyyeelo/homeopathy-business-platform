# 🚀 Complete Startup Guide

## Quick Start - All Services

### Start Everything (Recommended)
```bash
./start-complete.sh
```

This starts:
- ✅ **Docker Services**: PostgreSQL, Redis, Kafka, MinIO
- ✅ **Go Microservices**: Product, Inventory, Sales
- ✅ **NestJS API Gateway**: Port 4000
- ✅ **Python AI Service**: Port 8010
- ✅ **Next.js Frontend**: Port 3000

### Stop Everything
```bash
./stop-complete.sh
```

---

## What Gets Started

### 🐳 Infrastructure (Docker)
| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache & sessions |
| Kafka | 9092 | Event bus |
| Zookeeper | 2181 | Kafka coordination |
| MinIO | 9000 | Object storage (S3-compatible) |
| MinIO Console | 9001 | MinIO web UI |

### 🔧 Microservices
| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| Product Service | 8001 | Go/Gin | Product management |
| Inventory Service | 8002 | Go/Fiber | Stock management |
| Sales Service | 8003 | Go/Echo | POS & invoicing |
| API Gateway | 4000 | NestJS | API aggregation & auth |
| GraphQL Gateway | 4000/graphql | NestJS | GraphQL endpoint |
| AI Service | 8010 | Python/FastAPI | AI recommendations |

### 🖥️ Frontend
| Service | Port | Tech | Purpose |
|---------|------|------|---------|
| Next.js App | 3000 | Next.js 15 | Main ERP interface |

---

## Prerequisites

### Required
- ✅ **Docker** (20.10+)
- ✅ **Docker Compose** (2.0+)
- ✅ **Node.js** (18+)
- ✅ **npm** (9+)

### Optional (for microservices)
- **Go** (1.21+) - For Go services
- **Python** (3.10+) - For AI service

### Check Installation
```bash
docker --version
docker-compose --version
node --version
npm --version
go version        # optional
python3 --version # optional
```

---

## Step-by-Step Manual Start

If you want to start services individually:

### 1. Start Docker Services
```bash
docker-compose up -d postgres redis kafka minio
```

Wait for services to be ready (~30 seconds):
```bash
docker-compose ps
```

### 2. Run Database Migrations
```bash
docker-compose exec postgres psql -U erp_user -d erp_db < db/migrations/000_outbox_pattern.sql
```

### 3. Start Go Services (if Go installed)
```bash
# Product Service
cd services/product-service
go run main.go &

# Inventory Service
cd services/inventory-service
go run main.go &

# Sales Service
cd services/sales-service
go run main.go &
```

### 4. Start NestJS API Gateway
```bash
cd services/api-gateway
npm install
npm run start:dev &
```

### 5. Start Python AI Service (if Python installed)
```bash
cd services/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8010 &
```

### 6. Start Frontend
```bash
npm run dev:app
```

---

## Accessing Services

### Main Application
- **Frontend**: http://localhost:3000
- **Layout Settings**: http://localhost:3000/app/settings/layout
- **Dashboard**: http://localhost:3000/app/dashboard

### APIs
- **API Gateway**: http://localhost:4000
- **GraphQL Playground**: http://localhost:4000/graphql
- **Product API**: http://localhost:8001
- **Inventory API**: http://localhost:8002
- **Sales API**: http://localhost:8003
- **AI Service**: http://localhost:8010

### Infrastructure
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)
- **PostgreSQL**: localhost:5432 (erp_user/erp_password)
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

---

## Monitoring & Logs

### View All Logs
```bash
# Frontend
tail -f logs/frontend.log

# API Gateway
tail -f logs/api-gateway.log

# Product Service
tail -f logs/product-service.log

# Docker services
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### Check Service Status
```bash
# View services.json
cat logs/services.json

# Check Docker containers
docker-compose ps

# Check running processes
ps aux | grep -E "(node|go|python)" | grep -v grep
```

### Health Checks
```bash
# Frontend
curl http://localhost:3000

# API Gateway
curl http://localhost:4000/health

# Product Service
curl http://localhost:8001/health

# AI Service
curl http://localhost:8010/health
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or kill all
./stop-complete.sh
```

### Docker Services Not Starting
```bash
# Check Docker status
docker ps

# View logs
docker-compose logs

# Restart Docker
docker-compose down
docker-compose up -d
```

### Frontend Build Errors
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run dev:app
```

### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U erp_user

# Connect to database
docker-compose exec postgres psql -U erp_user -d erp_db

# View tables
\dt
```

### Kafka Not Ready
```bash
# Kafka takes ~30 seconds to start
docker-compose logs kafka

# Check Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## Environment Variables

Create `.env` file (or use `env.example`):

```bash
# Database
DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/erp_db"
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=erp_password
POSTGRES_DB=erp_db

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# API URLs
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenAI (optional)
OPENAI_API_KEY=

# Node Environment
NODE_ENV=development
```

---

## Common Commands

### Start/Stop
```bash
# Start everything
./start-complete.sh

# Stop everything
./stop-complete.sh

# Restart
./stop-complete.sh && ./start-complete.sh
```

### Docker Management
```bash
# Start Docker services only
docker-compose up -d

# Stop Docker services
docker-compose stop

# Remove containers & volumes
docker-compose down -v

# View logs
docker-compose logs -f
```

### Development
```bash
# Frontend only
npm run dev:app

# Build frontend
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

---

## Performance Tips

### For Development
- Use `./start-complete.sh` - it's optimized for dev
- Keep Docker Desktop running
- Allocate at least 4GB RAM to Docker
- Use SSD for better performance

### For Production
- Build frontend: `npm run build`
- Use `npm start` instead of `npm run dev`
- Enable Redis caching
- Configure Kafka properly
- Use environment-specific `.env` files

---

## Next Steps

1. **Start the platform**:
   ```bash
   ./start-complete.sh
   ```

2. **Open in browser**:
   http://localhost:3000

3. **Choose your layout**:
   http://localhost:3000/app/settings/layout

4. **Explore features**:
   - Try the 18 homeopathy modules
   - Test POS billing
   - Check AI suggestions
   - View system status

---

## Support

- **Documentation**: See `LAYOUT-SYSTEM.md`, `IMPLEMENTATION-COMPLETE.md`
- **Architecture**: See `ARCHITECTURE-POLYGLOT-SERVICES.md`
- **Logs**: Check `logs/` directory
- **Issues**: Check console and log files

---

**Ready to start? Run: `./start-complete.sh`** 🚀
