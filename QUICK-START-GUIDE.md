# 🚀 Quick Start Guide - Yeelo Homeopathy ERP Platform

## 📋 Prerequisites

- Node.js 20.x
- Go 1.22+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Kafka & Zookeeper

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Start infrastructure (PostgreSQL, Redis, Kafka, Zookeeper)
./START-INFRA.sh

# 2. Start all backend services (5 APIs)
./START-ALL-APIS.sh

# 3. Start Next.js frontend
npm run dev
```

**That's it! Your platform is running!** 🎉

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Next.js Frontend** | http://localhost:3000 | Main application |
| **Golang v2 (Gin)** | http://localhost:3004 | Core ERP APIs |
| **Golang v1 (Fiber)** | http://localhost:3005 | Workflows & System |
| **NestJS API** | http://localhost:3001 | Enterprise features |
| **Fastify API** | http://localhost:3002 | Marketing automation |
| **Python AI** | http://localhost:8001 | AI/ML services |
| **GraphQL Gateway** | http://localhost:4000/graphql | Unified GraphQL |
| **PostgreSQL** | localhost:5433 | Database |
| **Redis** | localhost:6380 | Cache |
| **Kafka** | localhost:9092 | Event streaming |

---

## 🔍 Health Checks

```bash
# Check all services
./TEST-ALL-APIS.sh

# Or manually:
curl http://localhost:3004/health  # Golang v2
curl http://localhost:3005/health  # Golang v1
curl http://localhost:3001/health  # NestJS
curl http://localhost:3002/health  # Fastify
curl http://localhost:8001/health  # Python AI
```

---

## 📦 Detailed Setup

### **Step 1: Install Dependencies**

```bash
# Root dependencies
npm install

# Service dependencies
cd services/api-nest && npm install && cd ../..
cd services/api-fastify && npm install && cd ../..
cd services/api-express && npm install && cd ../..
cd services/graphql-gateway && npm install && cd ../..
cd services/kafka-events && npm install && cd ../..

# Python dependencies
cd services/ai-service && pip install -r requirements.txt && cd ../..

# Golang dependencies
cd services/api-golang && go mod download && cd ../..
cd services/api-golang-v2 && go mod download && cd ../..
```

### **Step 2: Environment Variables**

Create `.env` file in root:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy

# Redis
REDIS_URL=redis://localhost:6380

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Service URLs
NEXT_PUBLIC_GOLANG_V1_URL=http://localhost:3005
NEXT_PUBLIC_GOLANG_V2_URL=http://localhost:3004
NEXT_PUBLIC_NEST_URL=http://localhost:3001
NEXT_PUBLIC_FASTIFY_URL=http://localhost:3002
NEXT_PUBLIC_PYTHON_URL=http://localhost:8001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

### **Step 3: Database Setup**

```bash
# Start PostgreSQL
./START-INFRA.sh

# Run migrations (if needed)
cd services/api-nest && npm run migration:run && cd ../..
```

### **Step 4: Start Services**

#### **Option A: All at Once**
```bash
./START-ALL-APIS.sh
```

#### **Option B: Individual Services**

```bash
# Terminal 1: Golang v2 (Gin)
cd services/api-golang-v2
PORT=3004 go run cmd/main.go

# Terminal 2: Golang v1 (Fiber)
cd services/api-golang
PORT=3005 go run main.go

# Terminal 3: NestJS
cd services/api-nest
PORT=3001 npm run start:dev

# Terminal 4: Fastify
cd services/api-fastify
PORT=3002 npm run dev

# Terminal 5: Python AI
cd services/ai-service
PORT=8001 python -m uvicorn src.main:app --reload

# Terminal 6: GraphQL Gateway
cd services/graphql-gateway
PORT=4000 npm run dev

# Terminal 7: Kafka Events
cd services/kafka-events
npm run dev

# Terminal 8: Next.js
npm run dev
```

---

## 🎯 Using the API Client

### **In Next.js Pages**

```typescript
// app/dashboard/page.tsx
import api from '@/lib/api-complete'

export default async function DashboardPage() {
  // Golang v2 - Core ERP
  const products = await api.products.getAll()
  const sales = await api.sales.getAll()
  const inventory = await api.inventory.getAlerts()
  
  // Python AI - Insights
  const insights = await api.insights.daily()
  
  // NestJS - Finance
  const profitLoss = await api.finance.reports.profitLoss()
  
  // Fastify - Marketing
  const campaigns = await api.marketing.campaigns.getAll()
  
  // GraphQL - Unified query
  const dashboard = await api.graphql.getDashboard()
  
  return <DashboardView data={{ products, sales, insights }} />
}
```

### **In Client Components**

```typescript
'use client'
import api from '@/lib/api-complete'
import { useState, useEffect } from 'react'

export function ProductList() {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    api.products.getAll().then(res => setProducts(res.data))
  }, [])
  
  const handleCreate = async (data) => {
    await api.products.create(data)
    // Refresh list
  }
  
  return <div>{/* Render products */}</div>
}
```

---

## 🔄 Event-Driven Features

### **Publishing Events**

Events are automatically published when you use the API:

```typescript
// When you create a sale
await api.sales.create(saleData)
// ↓ Automatically publishes 'sale.created' event to Kafka
// ↓ Triggers: inventory update, loyalty points, analytics
```

### **Consuming Events**

The Kafka Events service automatically handles all events:

```bash
# Start the event consumer
cd services/kafka-events
npm run dev

# You'll see:
# ✅ Kafka Consumer connected
# 📥 Subscribed to topic: sale.created
# 📥 Subscribed to topic: product.updated
# ... (30+ topics)
```

---

## 🐳 Docker Deployment

### **Using Docker Compose**

```bash
# Start everything with Docker
docker-compose -f docker-compose.master.yml up -d

# Check status
docker-compose -f docker-compose.master.yml ps

# View logs
docker-compose -f docker-compose.master.yml logs -f api-golang-v2

# Stop everything
docker-compose -f docker-compose.master.yml down
```

---

## ☸️ Kubernetes Deployment

### **Deploy to K8s**

```bash
# Make sure kubectl is configured
kubectl cluster-info

# Deploy all services
./k8s/DEPLOY-K8S.sh

# Check deployment status
kubectl get all

# View logs
kubectl logs -f deployment/api-golang-v2

# Port forward to access services
kubectl port-forward service/graphql-gateway-service 4000:4000
kubectl port-forward service/api-golang-v2-service 3004:3004
```

### **Scale Services**

```bash
# Scale Golang v2 to 10 replicas
kubectl scale deployment/api-golang-v2 --replicas=10

# Scale NestJS to 5 replicas
kubectl scale deployment/api-nest --replicas=5
```

---

## 🧪 Testing

### **Test All Services**

```bash
./TEST-ALL-APIS.sh
```

### **Manual Testing**

```bash
# Test Golang v2 - Products
curl http://localhost:3004/api/erp/products

# Test Golang v1 - Workflows
curl http://localhost:3005/api/workflows

# Test NestJS - Vendors
curl http://localhost:3001/purchase/vendors

# Test Fastify - Campaigns
curl http://localhost:3002/api/campaigns

# Test Python AI - Insights
curl http://localhost:8001/api/insights/daily

# Test GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}'
```

---

## 📊 Monitoring

### **Service Health**

All services expose `/health` endpoints:

```bash
# Check all health endpoints
for port in 3001 3002 3004 3005 8001; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq
done
```

### **Database**

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy

# Check tables
\dt

# Check connections
SELECT * FROM pg_stat_activity;
```

### **Kafka**

```bash
# List topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# View messages
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic sale.created \
  --from-beginning
```

---

## 🔧 Troubleshooting

### **Services Won't Start**

```bash
# Check if ports are in use
lsof -i :3000  # Next.js
lsof -i :3001  # NestJS
lsof -i :3002  # Fastify
lsof -i :3004  # Golang v2
lsof -i :3005  # Golang v1
lsof -i :8001  # Python AI

# Kill processes if needed
kill -9 $(lsof -ti:3000)
```

### **Database Connection Issues**

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5433

# Restart PostgreSQL
docker restart postgres
```

### **Kafka Issues**

```bash
# Check Kafka is running
docker ps | grep kafka

# Restart Kafka
docker restart kafka zookeeper
```

### **Clear Everything and Restart**

```bash
# Stop all services
./STOP-ALL-APIS.sh

# Stop infrastructure
docker-compose -f docker-compose.master.yml down

# Clear data (WARNING: Deletes all data!)
docker-compose -f docker-compose.master.yml down -v

# Start fresh
./START-INFRA.sh
./START-ALL-APIS.sh
npm run dev
```

---

## 📚 Documentation

- **Architecture:** `ARCHITECTURE-IMPLEMENTATION.md`
- **Integration Plan:** `COMPLETE-INTEGRATION-PLAN.md`
- **Implementation:** `IMPLEMENTATION-COMPLETE.md`
- **Final Summary:** `FINAL-INTEGRATION-SUMMARY.md`
- **API Client:** `lib/api-complete.ts`
- **SRS Document:** `SRS.md`

---

## 🎯 Common Tasks

### **Create a New Product**

```bash
curl -X POST http://localhost:3004/api/erp/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arnica Montana 30C",
    "sku": "ARM-30C-30ML",
    "price": 150,
    "stock": 100,
    "categoryId": "cat-123",
    "brandId": "brand-456"
  }'
```

### **Create a Sale**

```bash
curl -X POST http://localhost:3004/api/erp/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-123",
    "items": [
      {"productId": "prod-123", "quantity": 2, "price": 150}
    ],
    "totalAmount": 300
  }'
```

### **Launch a Campaign**

```bash
curl -X POST http://localhost:3002/api/campaigns/camp-123/launch \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Get AI Insights**

```bash
curl http://localhost:8001/api/insights/daily
```

---

## 🚀 Production Deployment

### **Build for Production**

```bash
# Build Next.js
npm run build

# Build services
cd services/api-nest && npm run build && cd ../..
cd services/api-fastify && npm run build && cd ../..
cd services/graphql-gateway && npm run build && cd ../..

# Build Golang services
cd services/api-golang && go build -o bin/api-golang && cd ../..
cd services/api-golang-v2 && go build -o bin/api-golang-v2 cmd/main.go && cd ../..
```

### **Environment Variables for Production**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/yeelo_homeopathy
REDIS_URL=redis://prod-redis:6379
KAFKA_BROKERS=prod-kafka-1:9092,prod-kafka-2:9092,prod-kafka-3:9092
JWT_SECRET=<strong-random-secret>
OPENAI_API_KEY=<your-production-key>
```

---

## ✅ Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Infrastructure running (PostgreSQL, Redis, Kafka)
- [ ] All 5 backend services running
- [ ] Kafka events service running
- [ ] Next.js frontend running
- [ ] Health checks passing
- [ ] Can access all endpoints
- [ ] Database migrations run
- [ ] Sample data loaded (optional)

---

## 🎉 You're Ready!

Your complete microservices platform is now running with:

- ✅ 6 backend services (2 Golang, NestJS, Fastify, Express, Python)
- ✅ Event-driven architecture (Kafka + Zookeeper)
- ✅ GraphQL gateway
- ✅ Complete API client
- ✅ Kubernetes-ready
- ✅ Production-ready

**Happy coding! 🚀**
