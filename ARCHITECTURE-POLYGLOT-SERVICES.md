# Polyglot Microservices Architecture

## Overview
Hybrid enterprise ERP with polyglot microservices, event-driven architecture (Kafka), and Next.js frontend with 4-side layout.

## Architecture Principles
- **Bounded Context per Service**: Each service owns its domain
- **Polyglot Persistence**: PostgreSQL primary, Redis cache, MinIO object storage
- **Event-Driven**: Kafka for async communication, Outbox pattern for reliability
- **API Gateway**: NestJS GraphQL + REST aggregation
- **Observability**: OpenTelemetry, Jaeger tracing, Prometheus metrics

---

## Service Inventory

### 1. **api-gateway** (NestJS + GraphQL)
**Port**: 4000  
**Responsibilities**:
- JWT authentication & RBAC
- GraphQL federation gateway
- REST API aggregation
- Rate limiting & request validation
- Trace ID injection

**Tech Stack**: Node.js, NestJS, Apollo Federation, Redis  
**Database**: Shared PostgreSQL (users, roles, permissions)

**Key Endpoints**:
```
POST   /auth/login
POST   /auth/refresh
GET    /graphql (federated queries)
POST   /api/v1/search (global search)
```

---

### 2. **product-service** (Golang - Gin)
**Port**: 8001  
**Responsibilities**:
- Product CRUD (master data)
- Categories, brands, variants, units
- Barcode generation & management
- Bulk import/export (CSV, Excel)
- Product search & filtering

**Tech Stack**: Go 1.21+, Gin, GORM, PostgreSQL  
**Database**: `products_db` (products, categories, brands, variants, barcodes)

**Key Endpoints**:
```
GET    /api/v1/products
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
POST   /api/v1/products/bulk-import
GET    /api/v1/categories
POST   /api/v1/barcodes/generate
```

**Events Published**:
- `product.created`
- `product.updated`
- `product.deleted`
- `category.created`

---

### 3. **inventory-service** (Golang - Fiber)
**Port**: 8002  
**Responsibilities**:
- Stock tracking (real-time)
- Batch & expiry management
- Stock transfers (branch-to-branch)
- Stock adjustments & reconciliation
- Negative stock prevention
- Dead stock alerts

**Tech Stack**: Go 1.21+, Fiber, GORM, PostgreSQL, Redis  
**Database**: `inventory_db` (stock, batches, movements, transfers)

**Key Endpoints**:
```
GET    /api/v1/inventory/stock
POST   /api/v1/inventory/adjust
POST   /api/v1/inventory/transfer
GET    /api/v1/inventory/batches
GET    /api/v1/inventory/expiry-alerts
POST   /api/v1/inventory/reconcile
```

**Events Published**:
- `inventory.adjusted`
- `inventory.transferred`
- `inventory.low_stock`
- `batch.expiring`

---

### 4. **sales-service** (Golang - Echo)
**Port**: 8003  
**Responsibilities**:
- POS billing (real-time)
- Sales orders & invoices
- Hold bills & resume
- Credit sales & dues tracking
- Sales returns
- Commission calculation

**Tech Stack**: Go 1.21+, Echo, GORM, PostgreSQL, WebSocket  
**Database**: `sales_db` (invoices, orders, returns, commissions)

**Key Endpoints**:
```
POST   /api/v1/pos/invoice
POST   /api/v1/pos/hold
GET    /api/v1/pos/held-bills
POST   /api/v1/sales/orders
POST   /api/v1/sales/returns
GET    /api/v1/sales/dues
WS     /ws/pos (live POS updates)
```

**Events Published**:
- `order.created`
- `order.paid`
- `order.cancelled`
- `invoice.issued`
- `return.processed`

---

### 5. **purchase-service** (Golang - Gin)
**Port**: 8004  
**Responsibilities**:
- Purchase orders (PO)
- Goods Receipt Note (GRN)
- Purchase invoices
- Vendor pricing & contracts
- Purchase returns
- PO → GRN → Bill workflow

**Tech Stack**: Go 1.21+, Gin, GORM, PostgreSQL  
**Database**: `purchase_db` (po, grn, purchase_invoices, vendor_pricing)

**Key Endpoints**:
```
POST   /api/v1/purchases/orders
POST   /api/v1/purchases/grn
POST   /api/v1/purchases/invoices
POST   /api/v1/purchases/returns
GET    /api/v1/purchases/vendor-pricing
```

**Events Published**:
- `po.created`
- `po.approved`
- `grn.received`
- `purchase.invoiced`

---

### 6. **customer-vendor-service** (NestJS)
**Port**: 8005  
**Responsibilities**:
- Customer CRM (contacts, groups, loyalty)
- Vendor management
- Customer/vendor ledgers
- Credit limits & payment terms
- Customer segmentation

**Tech Stack**: Node.js, NestJS, Prisma, PostgreSQL  
**Database**: `crm_db` (customers, vendors, ledgers, groups)

**Key Endpoints**:
```
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id/ledger
POST   /api/v1/vendors
GET    /api/v1/vendors/:id/performance
```

**Events Published**:
- `customer.created`
- `customer.updated`
- `vendor.created`

---

### 7. **finance-service** (NestJS)
**Port**: 8006  
**Responsibilities**:
- General ledger
- Chart of accounts
- GST compliance (GSTR-1, GSTR-3B)
- E-way bills
- P&L, Balance Sheet
- Payment reconciliation

**Tech Stack**: Node.js, NestJS, Prisma, PostgreSQL  
**Database**: `finance_db` (ledgers, accounts, gst_returns, payments)

**Key Endpoints**:
```
GET    /api/v1/finance/ledgers
POST   /api/v1/finance/journal-entry
GET    /api/v1/finance/gst/gstr1
POST   /api/v1/finance/eway-bill
GET    /api/v1/finance/reports/pl
```

**Events Published**:
- `payment.received`
- `payment.made`
- `gst.filed`

---

### 8. **hr-service** (Golang - Gin)
**Port**: 8007  
**Responsibilities**:
- Employee management
- Attendance tracking
- Shift scheduling
- Payroll processing
- Commission rules
- Leave management

**Tech Stack**: Go 1.21+, Gin, GORM, PostgreSQL  
**Database**: `hr_db` (employees, attendance, payroll, shifts)

**Key Endpoints**:
```
GET    /api/v1/hr/employees
POST   /api/v1/hr/attendance
POST   /api/v1/hr/payroll/process
GET    /api/v1/hr/shifts
POST   /api/v1/hr/commissions
```

**Events Published**:
- `employee.created`
- `attendance.marked`
- `payroll.processed`

---

### 9. **ai-service** (Python - FastAPI)
**Port**: 8008  
**Responsibilities**:
- RAG (Retrieval-Augmented Generation)
- LLM fine-tuning & inference
- Campaign content generation
- Sales forecasting
- Reorder suggestions
- Sentiment analysis
- Embeddings (pgvector)

**Tech Stack**: Python 3.11+, FastAPI, LangChain, OpenAI/Anthropic, pgvector  
**Database**: `ai_db` (embeddings, training_data, predictions)

**Key Endpoints**:
```
POST   /api/v1/ai/chat
POST   /api/v1/ai/generate-campaign
POST   /api/v1/ai/forecast
POST   /api/v1/ai/reorder-suggest
POST   /api/v1/ai/embeddings
```

**Events Published**:
- `ai.requested`
- `ai.completed`
- `ai.failed`

---

### 10. **campaign-sender** (Golang - Worker)
**Port**: 8009  
**Responsibilities**:
- High-throughput message sending
- WhatsApp Business API integration
- SMS gateway (Twilio, MSG91)
- Email (SMTP, SendGrid)
- Rate limiting & retry logic
- DLQ (Dead Letter Queue) handling

**Tech Stack**: Go 1.21+, Fiber (HTTP), Kafka Consumer  
**Database**: `campaigns_db` (campaigns, messages, delivery_status)

**Key Endpoints**:
```
POST   /api/v1/campaigns/send
GET    /api/v1/campaigns/:id/status
POST   /api/v1/campaigns/bulk-send
```

**Events Consumed**:
- `campaign.created`
- `campaign.scheduled`

**Events Published**:
- `campaign.sent`
- `campaign.failed`
- `message.delivered`

---

### 11. **outbox-worker** (Golang - Worker)
**Port**: N/A (background worker)  
**Responsibilities**:
- Poll outbox tables from all services
- Publish events to Kafka
- Mark events as published
- Retry failed publishes
- Ensure at-least-once delivery

**Tech Stack**: Go 1.21+, Kafka Producer, PostgreSQL  
**Database**: Connects to all service DBs (read outbox tables)

**No HTTP endpoints** (pure worker)

---

### 12. **analytics-ingest** (NestJS)
**Port**: 8010  
**Responsibilities**:
- Consume Kafka events
- Write to OLAP store (ClickHouse / TimescaleDB)
- Real-time KPI aggregation
- Event stream processing

**Tech Stack**: Node.js, NestJS, Kafka Consumer, ClickHouse  
**Database**: `analytics_db` (timeseries, aggregates)

**Events Consumed**: All events from all services

---

### 13. **reporting-service** (NestJS)
**Port**: 8011  
**Responsibilities**:
- Heavy aggregation queries
- Report generation (PDF, Excel)
- Scheduled reports
- Dashboard data API
- Caching layer (Redis)

**Tech Stack**: Node.js, NestJS, PostgreSQL (read replicas), Redis  
**Database**: Read from all service DBs (read replicas)

**Key Endpoints**:
```
GET    /api/v1/reports/sales
GET    /api/v1/reports/inventory
GET    /api/v1/reports/finance
POST   /api/v1/reports/generate
```

---

## Event Topics (Kafka)

### Topic Naming Convention
`<domain>.events.v1`

### Core Topics
1. **orders.events.v1**
   - `order.created`, `order.paid`, `order.cancelled`
   
2. **inventory.events.v1**
   - `inventory.adjusted`, `inventory.transferred`, `inventory.low_stock`, `batch.expiring`
   
3. **purchase.events.v1**
   - `po.created`, `po.approved`, `grn.received`, `purchase.invoiced`
   
4. **campaigns.events.v1**
   - `campaign.created`, `campaign.sent`, `campaign.failed`, `message.delivered`
   
5. **ai.events.v1**
   - `ai.requested`, `ai.completed`, `ai.failed`
   
6. **audit.events.v1**
   - `audit.recorded` (sensitive operations)
   
7. **billing.events.v1**
   - `invoice.issued`, `invoice.edited`, `invoice.cancelled`
   
8. **sync.events.v1**
   - `integration.sync_request`, `integration.sync_response`

### Event Schema (Standard)
```json
{
  "event_id": "uuid",
  "event_type": "order.created",
  "version": "v1",
  "timestamp": "2024-10-19T17:32:00Z",
  "trace_id": "uuid",
  "source_service": "sales-service",
  "payload": {
    "order_id": "uuid",
    "shop_id": "uuid",
    "customer_id": "uuid",
    "items": [...],
    "total": 1500.00
  }
}
```

---

## Data Stores

### PostgreSQL (Primary DB)
- **Strategy**: Database-per-service OR schema-per-service
- **Replication**: Master-slave for read replicas
- **Backup**: Daily automated backups (pg_dump + WAL archiving)

### Redis (Cache & Session)
- **Use Cases**: Session store, API cache, idempotency keys, rate limiting
- **Persistence**: RDB + AOF

### MinIO (S3-compatible Object Storage)
- **Use Cases**: Product images, invoices (PDF), reports, backups
- **Buckets**: `products`, `invoices`, `reports`, `backups`

### ClickHouse / TimescaleDB (OLAP)
- **Use Cases**: Analytics, time-series data, event logs
- **Retention**: 2 years (configurable)

---

## Observability Stack

### Tracing
- **OpenTelemetry** + **Jaeger**
- Trace ID propagation across services

### Metrics
- **Prometheus** (scrape endpoints)
- **Grafana** dashboards

### Logging
- **Loki** (log aggregation)
- Structured JSON logs

### Alerting
- **Alertmanager** (Prometheus alerts)
- Slack/PagerDuty integration

---

## Security

### Authentication
- JWT tokens (access + refresh)
- Token expiry: 15 min (access), 7 days (refresh)

### Authorization
- RBAC (Role-Based Access Control)
- Permissions checked at API Gateway + service level

### Secrets Management
- Kubernetes Secrets (production)
- `.env` files (development)

### API Security
- Rate limiting (Redis)
- CORS configuration
- Input validation (Zod, Joi)

---

## Development Workflow

### Monorepo Structure
```
/repo-root
  /apps
    /next-erp            # Next.js frontend
    /graphql-gateway     # NestJS API Gateway
  /services
    /product-service     # Go (Gin)
    /inventory-service   # Go (Fiber)
    /sales-service       # Go (Echo)
    /purchase-service    # Go (Gin)
    /customer-vendor-service  # NestJS
    /finance-service     # NestJS
    /hr-service          # Go (Gin)
    /ai-service          # Python (FastAPI)
    /campaign-sender     # Go (Worker)
    /outbox-worker       # Go (Worker)
    /analytics-ingest    # NestJS
    /reporting-service   # NestJS
  /packages
    /ui                  # Shared React components
    /types               # Shared TypeScript types
    /db                  # Prisma schemas (if using Prisma)
  /infra
    /docker              # docker-compose files
    /k8s                 # Helm charts
    /scripts             # Build & deploy scripts
  turbo.json
  package.json
```

### Local Development
- **Docker Compose**: Boot all services + infra (Kafka, Postgres, Redis, MinIO)
- **Hot Reload**: Each service watches for changes
- **Shared Network**: All services communicate via Docker network

### CI/CD
- **GitHub Actions**: Build, test, lint
- **ArgoCD**: GitOps deployment to Kubernetes
- **Helm**: Package services as Helm charts

---

## API Design Patterns

### REST
- **Versioning**: `/api/v1/...`
- **Pagination**: `?page=1&limit=20`
- **Filtering**: `?status=active&shop_id=123`
- **Sorting**: `?sort=created_at:desc`

### GraphQL
- **Federation**: Each service exposes GraphQL schema
- **Gateway**: NestJS Apollo Federation gateway

### WebSocket
- **Use Cases**: Live POS updates, notifications
- **Library**: Socket.io (Node), Gorilla WebSocket (Go)

---

## Deployment Architecture

### Kubernetes (Production)
- **Namespaces**: `dev`, `staging`, `prod`
- **Ingress**: NGINX Ingress Controller
- **Autoscaling**: HPA (Horizontal Pod Autoscaler)
- **Service Mesh**: Istio (optional, for advanced traffic management)

### Helm Charts
- One chart per service
- Shared values for common config

### Secrets
- Sealed Secrets (Bitnami)
- External Secrets Operator (AWS Secrets Manager, Vault)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| POS Transaction Time | < 1s |
| Event Processing Latency | < 5s |
| Database Query Time (p95) | < 50ms |
| Uptime | 99.9% |

---

## Next Steps
1. ✅ Service mapping complete
2. ⏳ Generate Kafka topics & outbox SQL
3. ⏳ Create docker-compose.yml
4. ⏳ Build Next.js AppShell
5. ⏳ Generate service skeletons
