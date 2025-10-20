# ✅ Database Standardization Complete

## 🎯 What Was Fixed

### Single PostgreSQL Connection Everywhere
**Connection String**: `postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy`

All services now use the **exact same database connection**:
- ✅ Docker containers
- ✅ Go microservices (Product, Inventory, Sales)
- ✅ NestJS API Gateway
- ✅ Python AI Service
- ✅ Next.js Frontend
- ✅ Prisma ORM

---

## 📋 Changes Made

### 1. Environment Variables (.env)
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=yeelo_homeopathy
```

### 2. Docker Compose
- Database name: `yeelo_homeopathy`
- User: `postgres`
- Password: `postgres`
- Port: `5432` (exposed to host)

### 3. Go Services Updated
All three Go services now use the standard connection:
- `services/product-service/main.go`
- `services/inventory-service/main.go`
- `services/sales-service/main.go`

### 4. Unified Config Created
New file: `lib/config/database.ts`
- Single source of truth for all TypeScript/JavaScript services
- Helper functions to get connection strings
- Connection pool settings

### 5. Prisma Schema Updated
- Uses `DATABASE_URL` environment variable
- Points to correct database

### 6. Port Conflicts Resolved
- ✅ System PostgreSQL stopped and disabled
- ✅ System Redis stopped when needed
- ✅ Docker containers can now bind to ports 5432 and 6379

---

## 🚀 Current Status

### ✅ Running Services
```
PostgreSQL (Docker):  localhost:5432  → yeelo_homeopathy
Redis (Docker):       localhost:6379
Kafka (Docker):       localhost:9092
MinIO (Docker):       localhost:9000
Product Service:      localhost:8001
Inventory Service:    localhost:8002
Sales Service:        localhost:8003
API Gateway:          localhost:4000
AI Service:           localhost:8010
Frontend:             localhost:3000
```

### Database Details
- **Name**: `yeelo_homeopathy`
- **Host**: `postgres` (Docker internal) / `localhost` (external)
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`
- **Schema**: `public`

---

## 🔧 How to Use

### Start Everything
```bash
./start-complete.sh
```

### Stop Everything
```bash
./stop-complete.sh
```

### Test Database Connection
```bash
./test-db-connection.sh
```

### Connect to Database Directly
```bash
# From host
psql -h localhost -p 5432 -U postgres -d yeelo_homeopathy

# From Docker
docker-compose exec postgres psql -U postgres -d yeelo_homeopathy
```

### View Database Logs
```bash
docker logs erp-postgres
```

---

## 📊 Connection Examples

### TypeScript/JavaScript (Node.js)
```typescript
import { DATABASE_CONFIG } from '@/lib/config/database';

// Get connection string
const connectionString = DATABASE_CONFIG.postgres.url;
// postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy

// Get connection config
const config = {
  host: DATABASE_CONFIG.postgres.host,     // postgres
  port: DATABASE_CONFIG.postgres.port,     // 5432
  user: DATABASE_CONFIG.postgres.user,     // postgres
  password: DATABASE_CONFIG.postgres.password, // postgres
  database: DATABASE_CONFIG.postgres.database, // yeelo_homeopathy
};
```

### Go
```go
connStr := "postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"
db, err := sql.Open("postgres", connStr)
```

### Python
```python
DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"
engine = create_engine(DATABASE_URL)
```

### Prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🎉 Benefits

### Before (Problems)
- ❌ Different database names in different services
- ❌ Port conflicts with system PostgreSQL/Redis
- ❌ Inconsistent connection strings
- ❌ Services couldn't find each other's data
- ❌ Manual configuration needed for each service

### After (Solutions)
- ✅ Single database for all services
- ✅ No port conflicts (system services disabled)
- ✅ One connection string everywhere
- ✅ All services share the same data
- ✅ Automatic configuration from .env

---

## 🔍 Verification

### Check All Services Are Connected
```bash
# Check PostgreSQL container
docker-compose exec postgres psql -U postgres -d yeelo_homeopathy -c "\dt"

# Check Go services logs
tail -f logs/product-service.log
tail -f logs/inventory-service.log
tail -f logs/sales-service.log

# Check API Gateway logs
tail -f logs/api-gateway.log

# Check Frontend logs
tail -f logs/frontend.log
```

### Expected Output
All services should show:
```
✅ Connected to database: yeelo_homeopathy
✅ Database host: postgres:5432
```

---

## 📝 Migration Notes

### Existing Data
If you had data in different databases before:
1. Old data is preserved in Docker volumes
2. To start fresh: `docker-compose down -v`
3. To keep data: Don't use the `-v` flag

### Schema Migrations
Run migrations after starting services:
```bash
# Prisma migrations
npx prisma migrate dev

# Or use the startup script (automatic)
./start-complete.sh
```

---

## 🛠️ Troubleshooting

### PostgreSQL Won't Start
```bash
# Check if system PostgreSQL is running
sudo systemctl status postgresql

# Stop it if needed
sudo systemctl stop postgresql
sudo systemctl disable postgresql

# Restart Docker
docker-compose down
docker-compose up -d postgres
```

### Redis Won't Start
```bash
# Check if system Redis is running
sudo systemctl status redis-server

# Stop it if needed
sudo systemctl stop redis-server

# Restart Docker
docker-compose up -d redis
```

### Services Can't Connect
```bash
# Check Docker network
docker network inspect homeopathy-business-platform_erp-network

# Check if containers can reach each other
docker-compose exec product-service ping postgres
docker-compose exec api-gateway ping postgres
```

### Wrong Database Name
```bash
# Check current database
docker-compose exec postgres psql -U postgres -l

# Should show: yeelo_homeopathy
```

---

## 📚 Related Files

- `.env` - Environment variables
- `.env.local` - Local overrides
- `docker-compose.yml` - Docker configuration
- `lib/config/database.ts` - Unified database config
- `prisma/schema.prisma` - Prisma schema
- `services/*/main.go` - Go service entry points
- `fix-database-connections.sh` - Fix script (rerun if needed)
- `test-db-connection.sh` - Connection test script

---

## ✅ Summary

**Everything now uses ONE database**: `yeelo_homeopathy`

**Connection string**: `postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy`

**All services**: Frontend, API Gateway, Go services, Python services → **Same database!**

**No more confusion!** 🎉

---

**Last Updated**: $(date)
**Status**: ✅ Complete and Working
