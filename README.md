# Homeopathy ERP - Full-Stack Polyglot Microservices Platform

> **Enterprise-grade ERP system** with 4-sided Next.js UI, polyglot microservices (Go, Node.js, Python), event-driven architecture (Kafka), and AI-powered features.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (Port 3000)                 │
│              4-Side Layout: Top | Left | Right | Bottom          │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              API Gateway (NestJS + GraphQL - Port 4000)          │
│         JWT Auth | RBAC | Rate Limiting | Aggregation           │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┘
   │      │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Product││Inven-││Sales ││Cust- ││Vendor││Finance││  HR  ││  AI  │
│Service││tory  ││Service││omer ││Service││Service││Service││Service│
│ Gin  ││Fiber ││ Echo ││NestJS││NestJS││NestJS││NestJS││FastAPI│
│:8001 ││:8002 ││:8003 ││:8005 ││:8006 ││:8007 ││:8008 ││:8010 │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
   │       │       │       │       │       │       │       │
   └───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │PostgreSQL│      │  Kafka   │      │  Redis   │
   │  :5433  │      │  :9092   │      │  :6379   │
   └─────────┘      └──────────┘      └──────────┘
```

---

## 📦 Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **SWR** - Data fetching & caching
- **Lucide Icons** - Icon library

### Backend Services
- **Go** (Gin, Fiber, Echo) - High-performance services
- **Node.js/NestJS** - API Gateway, orchestration services
- **Python/FastAPI** - AI/ML service
- **TypeScript** - Type-safe backend code

### Data Layer
- **PostgreSQL** - Primary database (per-service)
- **Redis** - Caching, sessions, rate limiting
- **Kafka** - Event streaming & async messaging
- **MinIO** - S3-compatible object storage
- **pgvector** - Vector embeddings for AI

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development
- **Kubernetes** - Production orchestration
- **ArgoCD** - GitOps deployment
- **GitHub Actions** - CI/CD pipelines

### Observability
- **OpenTelemetry** - Distributed tracing
- **Jaeger** - Trace visualization
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards & alerting

---

## 🚀 Quick Start

### Prerequisites
```bash
# Required
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Go 1.21+ (for Go services development)
- Python 3.11+ (for AI service development)

# Optional (for production)
- Kubernetes cluster
- ArgoCD
```

### 1. Clone Repository
```bash
git clone <repository-url>
cd homeopathy-business-platform
```

### 2. Start Infrastructure Services
```bash
# Start all infrastructure (Postgres, Kafka, Redis, MinIO)
docker-compose up -d postgres kafka redis minio

# Wait for services to be ready (~30 seconds)
docker-compose ps
```

### 3. Initialize Databases
```bash
# Run migrations for all services
docker-compose exec postgres psql -U erp_user -d postgres -f /docker-entrypoint-initdb.d/init-databases.sql

# Apply outbox pattern
docker-compose exec postgres psql -U erp_user -d products_db -f /migrations/000_outbox_pattern.sql
```

### 4. Start Backend Services
```bash
# Start all microservices
docker-compose up -d product-service inventory-service sales-service api-gateway ai-service

# Check logs
docker-compose logs -f product-service
```

### 5. Start Frontend
```bash
cd apps/next-erp
npm install
npm run dev
```

### 6. Access Applications
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **Product Service**: http://localhost:8001
- **Inventory Service**: http://localhost:8002
- **Sales Service**: http://localhost:8003

---

## 📁 Project Structure

```
homeopathy-business-platform/
├── apps/
│   └── next-erp/                    # Next.js frontend
│       ├── app/                     # App router pages
│       ├── components/              # React components
│       │   └── layout/              # AppShell, TopBar, LeftSidebar, RightPanel, BottomBar
│       ├── providers/               # Context providers
│       └── lib/                     # Utilities
│
├── services/
│   ├── api-gateway/                 # NestJS API Gateway
│   │   ├── src/
│   │   │   ├── auth/               # Authentication module
│   │   │   ├── users/              # User management
│   │   │   ├── search/             # Global search
│   │   │   └── health/             # Health checks
│   │   └── package.json
│   │
│   ├── product-service/             # Go (Gin) - Products, Categories, Brands
│   │   ├── main.go
│   │   └── go.mod
│   │
│   ├── inventory-service/           # Go (Fiber) - Stock, Batches, Movements
│   │   ├── main.go
│   │   └── go.mod
│   │
│   ├── sales-service/               # Go (Echo) - Invoices, Orders, POS
│   │   ├── main.go
│   │   └── go.mod
│   │
│   └── ai-service/                  # Python (FastAPI) - AI/ML features
│       ├── main.py
│       └── requirements.txt
│
├── infra/
│   ├── service-mapping.yaml         # Service inventory
│   ├── kafka-topics.json            # Kafka topic definitions
│   ├── rbac-config.json             # RBAC configuration
│   └── menu-navigation.json         # Menu structure
│
├── db/
│   └── migrations/
│       └── 000_outbox_pattern.sql   # Outbox pattern implementation
│
├── docker-compose.yml               # Local development environment
├── ARCHITECTURE-POLYGLOT-SERVICES.md # Architecture documentation
└── README.md                        # This file
```

---

## 🎨 Frontend Features

### 4-Side AppShell Layout

#### **Top Bar** (Always Visible)
- Logo & branding
- Branch/shop selector
- Global search (products, customers, invoices)
- Quick create menu (invoice, PO, customer, product)
- Notifications with badge
- Language selector
- Theme toggle (light/dark)
- User profile menu

#### **Left Sidebar** (Collapsible)
- Hierarchical navigation menu
- Search within menu
- Module icons with badges
- Expandable submenus
- Active route highlighting
- Responsive (drawer on mobile)

#### **Right Panel** (Contextual)
- **Filters Tab**: Quick filters, date ranges, saved filters
- **AI Tab**: AI suggestions, recommendations, insights
- **Activity Tab**: Recent activity, pending approvals

#### **Bottom Bar** (Status & Utilities)
- System status indicators (DB, Kafka, Redis)
- Open tabs/documents
- Background jobs counter
- Pending approvals
- Current user & role
- Keyboard shortcuts hint
- Version & environment

---

## 🔐 Authentication & Authorization

### JWT-Based Authentication
```typescript
// Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Admin", "role": "SUPER_ADMIN" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

### RBAC Roles
- `SUPER_ADMIN` - Full system access
- `ACCOUNTANT` - Finance & accounting
- `INVENTORY_MANAGER` - Inventory management
- `SALES_REP` - Sales & POS
- `PURCHASE_MANAGER` - Procurement
- `WAREHOUSE_STAFF` - Stock operations
- `HR_MANAGER` - HR & payroll
- `MARKETING` - Campaigns & promotions
- `ANALYST` - Reports & analytics
- `CASHIER` - POS only

---

## 📊 Key Modules

### 1. **Products Management**
- Product CRUD with variants
- Categories & brands
- Barcode generation
- Bulk import/export
- HSN codes & tax rates

### 2. **Inventory Management**
- Real-time stock tracking
- Batch & expiry management
- Stock adjustments & transfers
- Low stock alerts
- Reconciliation

### 3. **Sales & POS**
- Fast POS billing
- Invoice generation
- Sales orders
- Returns & refunds
- Credit sales tracking
- Hold/resume bills

### 4. **Purchases**
- Purchase orders
- GRN (Goods Receipt Note)
- Vendor management
- Purchase returns

### 5. **Finance**
- Ledger management
- GST/Tax compliance
- E-Way bills
- P&L statements
- Payment tracking

### 6. **AI Features**
- Product recommendations
- Sales forecasting
- Chatbot assistance
- Fraud detection
- Campaign generation

---

## 🔄 Event-Driven Architecture

### Kafka Topics
```json
{
  "orders.events.v1": ["order.created", "order.paid", "order.cancelled"],
  "inventory.events.v1": ["stock.adjusted", "batch.expiring"],
  "products.events.v1": ["product.created", "product.updated"],
  "customers.events.v1": ["customer.created", "loyalty.updated"]
}
```

### Outbox Pattern
All services use the transactional outbox pattern for reliable event publishing:

1. Write business data + event to outbox in same transaction
2. Background worker polls outbox
3. Publish to Kafka
4. Mark as published

---

## 🧪 Testing

```bash
# Frontend tests
cd apps/next-erp
npm run test
npm run test:e2e

# Go service tests
cd services/product-service
go test ./...

# API Gateway tests
cd services/api-gateway
npm run test
npm run test:e2e

# AI Service tests
cd services/ai-service
pytest
```

---

## 📈 Monitoring & Observability

### Health Checks
```bash
# API Gateway
curl http://localhost:4000/health

# Product Service
curl http://localhost:8001/health

# All services
docker-compose ps
```

### Distributed Tracing
- Each request gets a `X-Trace-ID` header
- Propagated across all services
- View traces in Jaeger UI

### Metrics
- Prometheus metrics exposed on `/metrics`
- Grafana dashboards for visualization
- Alerts configured for critical issues

---

## 🚢 Deployment

### Development
```bash
docker-compose up -d
```

### Staging/Production
```bash
# Build images
docker-compose build

# Push to registry
docker-compose push

# Deploy with Kubernetes
kubectl apply -f k8s/

# Or use ArgoCD for GitOps
argocd app create erp-platform --repo <repo-url> --path k8s --dest-server https://kubernetes.default.svc
```

---

## 🛠️ Development Workflow

### Adding a New Service

1. **Create service directory**
```bash
mkdir -p services/new-service
```

2. **Add to service-mapping.yaml**
```yaml
- name: new-service
  framework: nestjs
  port: 8011
  database: new_service_db
```

3. **Add to docker-compose.yml**
```yaml
new-service:
  build: ./services/new-service
  ports:
    - "8011:8011"
  depends_on:
    - postgres
    - kafka
```

4. **Create database**
```sql
CREATE DATABASE new_service_db;
```

5. **Implement service & deploy**

---

## 📝 API Documentation

- **API Gateway Swagger**: http://localhost:4000/api/docs
- **Service Mapping**: `infra/service-mapping.yaml`
- **Architecture Docs**: `ARCHITECTURE-POLYGLOT-SERVICES.md`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Team

- **Architecture**: Polyglot microservices with event-driven design
- **Frontend**: Next.js 14 with modern UI/UX
- **Backend**: Go, Node.js, Python services
- **DevOps**: Docker, Kubernetes, ArgoCD

---

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation in `/docs`

---

**Built with ❤️ for modern ERP needs**
