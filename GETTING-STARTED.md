# Getting Started Guide

Complete step-by-step guide to set up and run the Homeopathy ERP platform locally.

---

## Prerequisites

### Required Software

1. **Docker Desktop** (v24.0+)
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure Docker Compose is included

2. **Node.js** (v18.0+)
   - Download: https://nodejs.org/
   - Verify: `node --version`

3. **Go** (v1.21+) - Optional, for Go service development
   - Download: https://go.dev/dl/
   - Verify: `go version`

4. **Python** (v3.11+) - Optional, for AI service development
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **OS**: Linux, macOS, or Windows with WSL2

---

## Step 1: Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd homeopathy-business-platform

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_db
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=erp_password

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Services
PRODUCT_SERVICE_URL=http://localhost:8001
INVENTORY_SERVICE_URL=http://localhost:8002
SALES_SERVICE_URL=http://localhost:8003
CUSTOMER_SERVICE_URL=http://localhost:8005
AI_SERVICE_URL=http://localhost:8010

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=localhost:9000

# OpenAI (for AI service)
OPENAI_API_KEY=sk-your-openai-key

# Environment
NODE_ENV=development
```

---

## Step 2: Start Infrastructure

```bash
# Start core infrastructure services
docker-compose up -d postgres redis kafka zookeeper minio

# Verify services are running
docker-compose ps

# Expected output:
# NAME                STATUS              PORTS
# postgres            Up                  0.0.0.0:5432->5432/tcp
# redis               Up                  0.0.0.0:6379->6379/tcp
# kafka               Up                  0.0.0.0:9092->9092/tcp
# zookeeper           Up                  2181/tcp
# minio               Up                  0.0.0.0:9000-9001->9000-9001/tcp

# Wait for services to be healthy (30-60 seconds)
sleep 30
```

### Verify Infrastructure

```bash
# Test PostgreSQL
docker-compose exec postgres psql -U erp_user -d postgres -c "SELECT version();"

# Test Redis
docker-compose exec redis redis-cli ping
# Expected: PONG

# Test Kafka
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Test MinIO
curl http://localhost:9000/minio/health/live
# Expected: OK
```

---

## Step 3: Initialize Databases

```bash
# Create all service databases
docker-compose exec postgres psql -U erp_user -d postgres <<EOF
CREATE DATABASE products_db;
CREATE DATABASE inventory_db;
CREATE DATABASE sales_db;
CREATE DATABASE customers_db;
CREATE DATABASE vendors_db;
CREATE DATABASE finance_db;
CREATE DATABASE hr_db;
CREATE DATABASE analytics_db;
CREATE DATABASE ai_db;
EOF

# Apply outbox pattern to all databases
for db in products_db inventory_db sales_db customers_db vendors_db finance_db hr_db; do
  echo "Applying outbox pattern to $db..."
  docker-compose exec -T postgres psql -U erp_user -d $db < db/migrations/000_outbox_pattern.sql
done

# Verify databases
docker-compose exec postgres psql -U erp_user -d postgres -c "\l"
```

---

## Step 4: Create Kafka Topics

```bash
# Create all Kafka topics from configuration
docker-compose exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic orders.events.v1 \
  --partitions 6 \
  --replication-factor 1

docker-compose exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic inventory.events.v1 \
  --partitions 4 \
  --replication-factor 1

docker-compose exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic products.events.v1 \
  --partitions 4 \
  --replication-factor 1

docker-compose exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic customers.events.v1 \
  --partitions 3 \
  --replication-factor 1

docker-compose exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic payments.events.v1 \
  --partitions 3 \
  --replication-factor 1

# Verify topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## Step 5: Start Backend Services

### Option A: Using Docker Compose (Recommended)

```bash
# Start all microservices
docker-compose up -d product-service inventory-service sales-service api-gateway ai-service

# Check logs
docker-compose logs -f

# Verify all services are healthy
curl http://localhost:8001/health  # Product Service
curl http://localhost:8002/health  # Inventory Service
curl http://localhost:8003/health  # Sales Service
curl http://localhost:4000/health  # API Gateway
curl http://localhost:8010/healthz # AI Service
```

### Option B: Running Services Locally (Development)

#### Product Service (Go/Gin)
```bash
cd services/product-service
go mod download
go run main.go
# Runs on http://localhost:8001
```

#### Inventory Service (Go/Fiber)
```bash
cd services/inventory-service
go mod download
go run main.go
# Runs on http://localhost:8002
```

#### Sales Service (Go/Echo)
```bash
cd services/sales-service
go mod download
go run main.go
# Runs on http://localhost:8003
```

#### API Gateway (NestJS)
```bash
cd services/api-gateway
npm install
npm run start:dev
# Runs on http://localhost:4000
```

#### AI Service (FastAPI)
```bash
cd services/ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8010
# Runs on http://localhost:8010
```

---

## Step 6: Start Frontend

```bash
cd apps/next-erp

# Install dependencies
npm install

# Create necessary UI component files (if using shadcn/ui)
npx shadcn-ui@latest init

# Add required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

---

## Step 7: Create Test User

```bash
# Using API Gateway
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "SUPER_ADMIN"
  }'

# Save the access token from response
```

---

## Step 8: Access the Application

### Frontend Application
1. Open browser: http://localhost:3000
2. Login with credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

### API Documentation
- **Swagger UI**: http://localhost:4000/api/docs
- Interactive API testing available

### Service Health Checks
- Product Service: http://localhost:8001/health
- Inventory Service: http://localhost:8002/health
- Sales Service: http://localhost:8003/health
- API Gateway: http://localhost:4000/health
- AI Service: http://localhost:8010/healthz

### Infrastructure UIs
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

---

## Step 9: Test the System

### Create a Product
```bash
curl -X POST http://localhost:8001/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arnica Montana 30C",
    "sku": "ARM-30C-001",
    "description": "Homeopathic remedy for bruises and injuries",
    "price": 150.00,
    "mrp": 180.00,
    "hsn_code": "30049011"
  }'
```

### Check Stock
```bash
curl http://localhost:8002/api/v1/inventory/stock
```

### Create Invoice
```bash
curl -X POST http://localhost:8003/api/v1/pos/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-uuid",
    "shop_id": "shop-uuid",
    "items": [
      {
        "product_id": "product-uuid",
        "product_name": "Arnica Montana 30C",
        "quantity": 2,
        "price": 150.00,
        "total": 300.00
      }
    ],
    "sub_total": 300.00,
    "total_amount": 300.00,
    "payment_mode": "CASH"
  }'
```

### Global Search
```bash
curl "http://localhost:4000/api/search?q=arnica" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Services Not Starting

```bash
# Check Docker logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>

# Rebuild service
docker-compose up -d --build <service-name>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U erp_user -d postgres -c "SELECT 1;"

# Check environment variables
docker-compose exec product-service env | grep DATABASE
```

### Kafka Issues

```bash
# Check Kafka is running
docker-compose ps kafka

# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Check consumer groups
docker-compose exec kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000  # Frontend
lsof -i :4000  # API Gateway
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9092  # Kafka

# Kill process if needed
kill -9 <PID>
```

### Frontend Build Issues

```bash
cd apps/next-erp

# Clear cache
rm -rf .next node_modules
npm install

# Check for missing dependencies
npm audit fix

# Rebuild
npm run build
```

### Go Service Issues

```bash
cd services/product-service

# Clean Go cache
go clean -cache -modcache

# Download dependencies
go mod download
go mod tidy

# Run with verbose logging
go run main.go
```

---

## Development Tips

### Hot Reload
- **Frontend**: Automatic with `npm run dev`
- **API Gateway**: Automatic with `npm run start:dev`
- **Go Services**: Use `air` for hot reload
- **Python Service**: Automatic with `uvicorn --reload`

### Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f product-service

# Follow logs with grep
docker-compose logs -f | grep ERROR

# Check service health
docker-compose ps
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U erp_user -d products_db

# Backup database
docker-compose exec postgres pg_dump -U erp_user products_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U erp_user -d products_db < backup.sql
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis commands
docker-compose exec redis redis-cli MONITOR

# Check keys
docker-compose exec redis redis-cli KEYS '*'

# Flush all data (careful!)
docker-compose exec redis redis-cli FLUSHALL
```

---

## Next Steps

1. **Explore the UI**: Navigate through all modules in the left sidebar
2. **Test API endpoints**: Use Swagger UI at http://localhost:4000/api/docs
3. **Create test data**: Add products, customers, and create invoices
4. **Monitor events**: Check Kafka topics for event flow
5. **Customize**: Modify services and UI to fit your needs

---

## Additional Resources

- **Architecture Documentation**: `ARCHITECTURE-POLYGLOT-SERVICES.md`
- **Service Mapping**: `infra/service-mapping.yaml`
- **Kafka Topics**: `infra/kafka-topics.json`
- **RBAC Configuration**: `infra/rbac-config.json`
- **Menu Structure**: `infra/menu-navigation.json`

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review service logs: `docker-compose logs -f`
3. Verify all prerequisites are installed
4. Check environment variables in `.env`
5. Create an issue in the repository

---

**Happy Coding! 🚀**
