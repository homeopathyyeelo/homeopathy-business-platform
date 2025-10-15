# 🚀 Complete Setup Guide - All Services Running

## Quick Start (5 Minutes)

```bash
# 1. Make startup script executable
chmod +x START-ALL-SERVICES.sh

# 2. Start everything
./START-ALL-SERVICES.sh

# 3. Access the platform
# Frontend: http://localhost:3000
# GraphQL: http://localhost:4000/graphql
```

## 📋 All Services Overview

### Frontend
- **Next.js App** - `http://localhost:3000`
  - Modern React-based UI
  - Server-side rendering
  - SEO optimized

### Backend APIs (All with Swagger)
- **NestJS API** - `http://localhost:3001` | Swagger: `/api`
  - Enterprise-grade TypeScript framework
  - Main ERP backend
  
- **Fastify API** - `http://localhost:3002` | Swagger: `/documentation`
  - High-performance HTTP server
  - Low latency operations
  
- **Express API** - `http://localhost:3003` | Swagger: `/api-docs`
  - Traditional Node.js framework
  - Legacy support
  
- **Golang API** - `http://localhost:3004`
  - Ultra-low latency
  - High concurrency
  
- **Python AI Service** - `http://localhost:8001` | Swagger: `/docs`
  - Machine learning operations
  - AI content generation

### Gateways
- **GraphQL Gateway** - `http://localhost:4000/graphql`
  - Unified GraphQL API
  - Query multiple services
  
- **API Gateway** - `http://localhost:5000`
  - REST API aggregation
  - Load balancing

### Infrastructure
- **PostgreSQL** - `localhost:5433`
  - Primary database with pgVector
  
- **Redis** - `localhost:6380`
  - Caching and sessions
  
- **Kafka** - `localhost:9092`
  - Event streaming
  
- **Zookeeper** - `localhost:2181`
  - Kafka coordination
  
- **MinIO** - Console: `http://localhost:9001` | API: `http://localhost:9000`
  - S3-compatible object storage
  - Credentials: minio / minio123

### Monitoring
- **Kafka UI** - `http://localhost:8080`
  - Monitor Kafka topics and consumers
  
- **Schema Registry** - `http://localhost:8081`
  - Avro schema management

## 🛠️ Development Commands

### Start/Stop Services
```bash
# Start all services
./START-ALL-SERVICES.sh

# Stop all services
docker-compose -f docker-compose.master.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.master.yml down -v

# Restart specific service
docker-compose -f docker-compose.master.yml restart api-nest
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.master.yml logs -f

# Specific service
docker-compose -f docker-compose.master.yml logs -f api-nest
docker-compose -f docker-compose.master.yml logs -f ai-service
docker-compose -f docker-compose.master.yml logs -f kafka

# Last 100 lines
docker-compose -f docker-compose.master.yml logs --tail=100 api-nest
```

### Service Status
```bash
# Check all services
docker-compose -f docker-compose.master.yml ps

# Check specific service health
docker-compose -f docker-compose.master.yml exec api-nest curl http://localhost:3001/health
```

### Database Operations
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
docker-compose -f docker-compose.master.yml exec postgres psql -U postgres -d yeelo_homeopathy
```

### Kafka Operations
```bash
# List topics
docker-compose -f docker-compose.master.yml exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic
docker-compose -f docker-compose.master.yml exec kafka kafka-topics --create --topic test-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Consume messages
docker-compose -f docker-compose.master.yml exec kafka kafka-console-consumer --topic orders --from-beginning --bootstrap-server localhost:9092

# Produce messages
docker-compose -f docker-compose.master.yml exec kafka kafka-console-producer --topic orders --bootstrap-server localhost:9092
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose -f docker-compose.master.yml exec redis redis-cli

# Monitor Redis
docker-compose -f docker-compose.master.yml exec redis redis-cli MONITOR

# Get all keys
docker-compose -f docker-compose.master.yml exec redis redis-cli KEYS '*'
```

## 🔧 Configuration

### Environment Variables
Edit `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy

# Redis
REDIS_URL=redis://localhost:6380

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_ENDPOINT=localhost:9000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

## 🧪 Testing

### API Testing with cURL

#### NestJS API
```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products

# Create order (with auth)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"customerId":"123","items":[]}'
```

#### GraphQL Gateway
```bash
# Query via cURL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { id name price } }"}'

# Or use GraphQL Playground at http://localhost:4000
```

#### Python AI Service
```bash
# Generate content
curl -X POST http://localhost:8001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a product description","type":"product"}'
```

### Load Testing
```bash
# Install k6 (if not installed)
# macOS: brew install k6
# Linux: sudo apt install k6

# Run load test
k6 run k6/load-test.js
```

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check Docker status
docker info

# Check logs for errors
docker-compose -f docker-compose.master.yml logs

# Rebuild services
docker-compose -f docker-compose.master.yml build --no-cache

# Clean everything and restart
docker-compose -f docker-compose.master.yml down -v
./START-ALL-SERVICES.sh
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.master.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.master.yml logs postgres

# Test connection
docker-compose -f docker-compose.master.yml exec postgres pg_isready -U postgres
```

### Kafka Issues
```bash
# Check Kafka logs
docker-compose -f docker-compose.master.yml logs kafka

# Check Zookeeper
docker-compose -f docker-compose.master.yml logs zookeeper

# Restart Kafka stack
docker-compose -f docker-compose.master.yml restart zookeeper kafka
```

### Port Conflicts
If ports are already in use, edit `docker-compose.master.yml` to change port mappings:
```yaml
ports:
  - "3001:3001"  # Change first number: "NEW_PORT:3001"
```

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (3000)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (5000) / GraphQL (4000)             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  NestJS API  │    │ Fastify API  │    │ Express API  │
│    (3001)    │    │    (3002)    │    │    (3003)    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Golang API  │    │  Python AI   │    │   Workers    │
│    (3004)    │    │    (8001)    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │    Kafka     │
│    (5433)    │    │    (6380)    │    │    (9092)    │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 🎯 Next Steps

1. **Explore APIs**: Visit Swagger docs for each service
2. **Test GraphQL**: Use GraphQL Playground at http://localhost:4000
3. **Monitor Kafka**: Check Kafka UI at http://localhost:8080
4. **View Logs**: Monitor service logs for any issues
5. **Develop**: Start building features!

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Fastify Documentation](https://www.fastify.io/)
- [GraphQL Documentation](https://graphql.org/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.master.yml logs -f`
2. Verify all services are running: `docker-compose -f docker-compose.master.yml ps`
3. Restart problematic service: `docker-compose -f docker-compose.master.yml restart SERVICE_NAME`
4. Clean restart: `docker-compose -f docker-compose.master.yml down -v && ./START-ALL-SERVICES.sh`
