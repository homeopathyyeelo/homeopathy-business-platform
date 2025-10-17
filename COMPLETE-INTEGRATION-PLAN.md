# 🎯 Complete System Integration Plan - All Services Connected

## 📋 Overview

Based on your SRS document, this platform has **20 main modules** with **100+ master data tables** that need to be connected across **6 backend services** using **multiple technologies**.

---

## 🏗️ Service Distribution by Module (Based on SRS)

### **Service 1: Golang API v1 (Fiber/Echo) - Port 3005**
**Framework:** Fiber or Echo (High-performance alternative)  
**Purpose:** Workflow automation, offline mode, hardware integration

**Modules Handled:**
1. ✅ **Workflow Automation** - Advanced workflow engine
2. ✅ **Offline Mode** - Local data sync and queue management
3. ✅ **Multi-PC Sharing** - Real-time session sharing
4. ✅ **Hardware Integration** - Barcode scanners, printers, displays
5. ✅ **Payment Gateway** - Stripe, Razorpay integration
6. ✅ **Master Data Management** - Company, Branch, Settings

**Key Endpoints:**
```
GET    /api/workflows                 - List workflows
POST   /api/workflows                 - Create workflow
POST   /api/workflows/:id/execute     - Execute workflow
GET    /api/offline/status            - Offline mode status
POST   /api/offline/sync              - Sync offline data
GET    /api/multi-pc/sessions         - Shared sessions
POST   /api/hardware/print            - Print receipt
POST   /api/payments/stripe           - Stripe payment
```

---

### **Service 2: Golang API v2 (Gin) - Port 3004**
**Framework:** Gin (Fastest Go framework)  
**Purpose:** Core ERP operations (Products, Sales, Inventory, Customers)

**Modules Handled:**
1. ✅ **Products Module** - Full product lifecycle
2. ✅ **Inventory Module** - Stock management
3. ✅ **Sales Module** - POS, invoicing, orders
4. ✅ **Customers Module** - CRM and loyalty
5. ✅ **Dashboard Module** - Real-time metrics
6. ✅ **Reports Module** - Sales, inventory reports

**Key Endpoints:**
```
GET    /api/erp/products              - List products
POST   /api/erp/products              - Create product
GET    /api/erp/inventory             - Inventory levels
POST   /api/erp/sales                 - Create sale (POS)
GET    /api/erp/customers             - List customers
GET    /api/erp/dashboard             - Dashboard data
GET    /api/erp/reports/sales         - Sales reports
```

---

### **Service 3: NestJS API - Port 3001**
**Framework:** NestJS (Enterprise TypeScript)  
**Purpose:** Complex business logic, purchases, finance

**Modules Handled:**
1. ✅ **Purchases Module** - PO, GRN, vendor management
2. ✅ **Finance & Accounting** - Ledgers, P&L, GST
3. ✅ **HR & Staff Module** - Payroll, attendance, leaves
4. ✅ **Vendors Module** - Supplier management
5. ✅ **Settings Module** - System configuration

**Key Endpoints:**
```
GET    /purchase/vendors              - Vendor management
POST   /purchase/orders               - Create PO
POST   /purchase/grn                  - Goods receipt
GET    /finance/invoices              - Invoice management
POST   /finance/payments              - Record payments
GET    /finance/reports/profit-loss   - P&L statement
GET    /hr/employees                  - Employee list
POST   /hr/attendance                 - Mark attendance
```

---

### **Service 4: Fastify API - Port 3002**
**Framework:** Fastify (High-speed Node.js)  
**Purpose:** Marketing automation, campaigns, social media

**Modules Handled:**
1. ✅ **Marketing Module** - WhatsApp, SMS, Email campaigns
2. ✅ **Social Media Automation** - GMB, Instagram, Facebook
3. ✅ **CRM / Customer Service** - Tickets, follow-ups
4. ✅ **AI Campaigns Module** - AI-generated campaigns

**Key Endpoints:**
```
GET    /api/campaigns                 - List campaigns
POST   /api/campaigns                 - Create campaign
POST   /api/campaigns/:id/launch      - Launch campaign
GET    /api/templates                 - Message templates
POST   /api/social/schedule           - Schedule post
GET    /api/crm/tickets               - Support tickets
POST   /api/ai-campaigns/generate     - AI campaign generation
```

---

### **Service 5: Python AI Service - Port 8001**
**Framework:** FastAPI (Python ML)  
**Purpose:** AI/ML features, analytics, insights

**Modules Handled:**
1. ✅ **AI Module** - Chat, forecasting, optimization
2. ✅ **Analytics Module** - Business intelligence
3. ✅ **AI Insights Module** - Daily insights, suggestions
4. ✅ **AI Demo / Lab Module** - AI experimentation

**Key Endpoints:**
```
POST   /api/ai/chat                   - AI chatbot
POST   /api/ai/recommendations        - Product recommendations
POST   /api/ai/demand-forecast        - Demand forecasting
POST   /api/ai/pricing                - Price optimization
GET    /api/analytics/dashboard       - BI dashboard
GET    /api/insights/daily            - Daily insights
POST   /api/ai/content                - AI content generation
```

---

### **Service 6: GraphQL Gateway - Port 4000**
**Framework:** Apollo Federation  
**Purpose:** Unified data access across all services

**Features:**
- ✅ Federated schema from all services
- ✅ Single endpoint for complex queries
- ✅ Real-time subscriptions
- ✅ Query optimization and caching

**Example Queries:**
```graphql
query GetDashboard {
  dashboard {
    sales { total, today, week, month }
    inventory { lowStock, expiring }
    customers { total, new }
    alerts { count, items }
  }
}

query GetProductWithInventory($id: ID!) {
  product(id: $id) {
    id, name, price
    inventory { stock, warehouse }
    sales { total, lastMonth }
  }
}
```

---

## 🗄️ Master Data Distribution (100+ Tables)

### **Golang API v1 (Fiber/Echo) - System Masters**
```
✅ Company Profile Master
✅ Branch/Store Master
✅ Department Master
✅ Role & Permission Master
✅ User/Staff Master
✅ System Settings Master
✅ Integration Keys Master
✅ Notification Templates Master
✅ Workflow Definition Master
✅ Automation Rule Master
```

### **Golang API v2 (Gin) - Product & Sales Masters**
```
✅ Product Master
✅ Category/Subcategory Master
✅ Brand/Manufacturer Master
✅ Batch Master
✅ Warehouse Master
✅ Price List Master
✅ Customer Master
✅ Customer Group Master
✅ Sales Type Master
✅ Invoice Series Master
✅ Loyalty Program Master
```

### **NestJS API - Purchase & Finance Masters**
```
✅ Vendor Master
✅ Purchase Order Terms Master
✅ GRN Template Master
✅ Ledger Master
✅ Cost Center Master
✅ Expense Category Master
✅ Bank Master
✅ GST Return Period Master
✅ Employee Master
✅ Salary Structure Master
```

### **Fastify API - Marketing Masters**
```
✅ Campaign Type Master
✅ Template Master
✅ Offer/Coupon Master
✅ Target Segment Master
✅ Social Account Master
✅ Hashtag Library Master
✅ Blog Category Master
✅ Media Library Master
```

### **Python AI - AI Masters**
```
✅ AI Agent Master
✅ AI Task Master
✅ AI Prompt Library
✅ Model Version Master
✅ Vector Index Master
✅ Business Rule Master
```

---

## 🔗 Technology Integration

### **1. Turborepo Configuration**

Create monorepo structure for all services:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

**Workspace Structure:**
```
apps/
  - nextjs-app/          (Next.js frontend)
  - api-gateway/         (API Gateway)
  - graphql-gateway/     (GraphQL Gateway)
  
services/
  - api-golang/          (Fiber/Echo)
  - api-golang-v2/       (Gin)
  - api-nest/            (NestJS)
  - api-fastify/         (Fastify)
  - ai-service/          (Python FastAPI)
  
packages/
  - shared-types/        (TypeScript types)
  - shared-utils/        (Common utilities)
  - ui-components/       (Shared UI components)
```

---

### **2. Kafka Event Streaming**

**Event Topics:**
```
✅ product.created
✅ product.updated
✅ product.deleted
✅ inventory.adjusted
✅ sale.created
✅ sale.completed
✅ customer.created
✅ campaign.launched
✅ payment.processed
✅ order.fulfilled
```

**Event Flow:**
```
Golang API v2 (Sale Created)
    ↓ Publish to Kafka
    ↓ topic: sale.created
    ↓
    ├→ Inventory Service (Update stock)
    ├→ Customer Service (Add loyalty points)
    ├→ Finance Service (Update ledger)
    └→ Analytics Service (Update metrics)
```

---

### **3. Kubernetes Deployment**

**Deployment Structure:**
```yaml
# k8s/deployments/
├── api-golang-deployment.yaml
├── api-golang-v2-deployment.yaml
├── api-nest-deployment.yaml
├── api-fastify-deployment.yaml
├── ai-service-deployment.yaml
├── graphql-gateway-deployment.yaml
├── api-gateway-deployment.yaml
├── nextjs-deployment.yaml
├── postgres-statefulset.yaml
├── redis-deployment.yaml
├── kafka-statefulset.yaml
└── zookeeper-statefulset.yaml
```

**Services:**
```yaml
# k8s/services/
├── api-golang-service.yaml
├── api-golang-v2-service.yaml
├── api-nest-service.yaml
├── api-fastify-service.yaml
├── ai-service-service.yaml
├── graphql-gateway-service.yaml
├── api-gateway-service.yaml
├── nextjs-service.yaml
├── postgres-service.yaml
├── redis-service.yaml
└── kafka-service.yaml
```

---

### **4. Zookeeper Configuration**

**Purpose:** Kafka cluster coordination

```yaml
# docker-compose.yml
zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
  ports:
    - "2181:2181"
```

---

### **5. GraphQL Federation**

**Subgraph Services:**
```typescript
// Golang v2 Subgraph (Products, Sales, Inventory)
type Product @key(fields: "id") {
  id: ID!
  name: String!
  price: Float!
  stock: Int!
  category: Category!
}

// NestJS Subgraph (Purchases, Finance)
type Vendor @key(fields: "id") {
  id: ID!
  name: String!
  purchaseOrders: [PurchaseOrder!]!
}

// Fastify Subgraph (Marketing)
type Campaign @key(fields: "id") {
  id: ID!
  name: String!
  status: String!
  customers: [Customer!]!
}

// Python AI Subgraph (Analytics)
type Insight @key(fields: "id") {
  id: ID!
  type: String!
  recommendation: String!
  confidence: Float!
}
```

---

## 📡 Next.js Integration

### **Updated API Client with All Services**

```typescript
// lib/api-complete.ts
import axios from 'axios'

// Service base URLs
const GOLANG_V1_URL = process.env.NEXT_PUBLIC_GOLANG_V1_URL || 'http://localhost:3005'
const GOLANG_V2_URL = process.env.NEXT_PUBLIC_GOLANG_V2_URL || 'http://localhost:3004'
const NEST_URL = process.env.NEXT_PUBLIC_NEST_URL || 'http://localhost:3001'
const FASTIFY_URL = process.env.NEXT_PUBLIC_FASTIFY_URL || 'http://localhost:3002'
const PYTHON_URL = process.env.NEXT_PUBLIC_PYTHON_URL || 'http://localhost:8001'
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

// Complete API client
export const api = {
  // ===== GOLANG API v1 (Fiber/Echo) - Workflows & System =====
  workflows: {
    getAll: () => axios.get(`${GOLANG_V1_URL}/api/workflows`),
    create: (data: any) => axios.post(`${GOLANG_V1_URL}/api/workflows`, data),
    execute: (id: string) => axios.post(`${GOLANG_V1_URL}/api/workflows/${id}/execute`),
  },
  
  offline: {
    getStatus: () => axios.get(`${GOLANG_V1_URL}/api/offline/status`),
    sync: () => axios.post(`${GOLANG_V1_URL}/api/offline/sync`),
  },
  
  multiPC: {
    getSessions: () => axios.get(`${GOLANG_V1_URL}/api/multi-pc/sessions`),
    createSession: (data: any) => axios.post(`${GOLANG_V1_URL}/api/multi-pc/sessions`, data),
  },
  
  hardware: {
    print: (data: any) => axios.post(`${GOLANG_V1_URL}/api/hardware/print`, data),
  },
  
  // ===== GOLANG API v2 (Gin) - Core ERP =====
  products: {
    getAll: (params?: any) => axios.get(`${GOLANG_V2_URL}/api/erp/products`, { params }),
    create: (data: any) => axios.post(`${GOLANG_V2_URL}/api/erp/products`, data),
    // ... all product endpoints
  },
  
  sales: {
    getAll: (params?: any) => axios.get(`${GOLANG_V2_URL}/api/erp/sales`, { params }),
    create: (data: any) => axios.post(`${GOLANG_V2_URL}/api/erp/sales`, data),
    // ... all sales endpoints
  },
  
  inventory: {
    getAll: () => axios.get(`${GOLANG_V2_URL}/api/erp/inventory`),
    adjust: (data: any) => axios.post(`${GOLANG_V2_URL}/api/erp/inventory/adjust`, data),
  },
  
  customers: {
    getAll: (params?: any) => axios.get(`${GOLANG_V2_URL}/api/erp/customers`, { params }),
    create: (data: any) => axios.post(`${GOLANG_V2_URL}/api/erp/customers`, data),
  },
  
  dashboard: {
    getData: () => axios.get(`${GOLANG_V2_URL}/api/erp/dashboard`),
  },
  
  // ===== NESTJS API - Enterprise Features =====
  purchases: {
    vendors: {
      getAll: () => axios.get(`${NEST_URL}/purchase/vendors`),
      create: (data: any) => axios.post(`${NEST_URL}/purchase/vendors`, data),
    },
    orders: {
      getAll: () => axios.get(`${NEST_URL}/purchase/orders`),
      create: (data: any) => axios.post(`${NEST_URL}/purchase/orders`, data),
    },
    grn: {
      create: (data: any) => axios.post(`${NEST_URL}/purchase/grn`, data),
    },
  },
  
  finance: {
    invoices: {
      getAll: () => axios.get(`${NEST_URL}/finance/invoices`),
      create: (data: any) => axios.post(`${NEST_URL}/finance/invoices`, data),
    },
    payments: {
      record: (data: any) => axios.post(`${NEST_URL}/finance/payments`, data),
    },
    reports: {
      profitLoss: (params?: any) => axios.get(`${NEST_URL}/finance/reports/profit-loss`, { params }),
      gst: (params?: any) => axios.get(`${NEST_URL}/finance/reports/gst`, { params }),
    },
  },
  
  hr: {
    employees: {
      getAll: () => axios.get(`${NEST_URL}/hr/employees`),
      create: (data: any) => axios.post(`${NEST_URL}/hr/employees`, data),
    },
    attendance: {
      mark: (data: any) => axios.post(`${NEST_URL}/hr/attendance`, data),
    },
  },
  
  // ===== FASTIFY API - Marketing =====
  marketing: {
    campaigns: {
      getAll: () => axios.get(`${FASTIFY_URL}/api/campaigns`),
      create: (data: any) => axios.post(`${FASTIFY_URL}/api/campaigns`, data),
      launch: (id: string) => axios.post(`${FASTIFY_URL}/api/campaigns/${id}/launch`),
    },
    templates: {
      getAll: () => axios.get(`${FASTIFY_URL}/api/templates`),
      create: (data: any) => axios.post(`${FASTIFY_URL}/api/templates`, data),
    },
    social: {
      schedule: (data: any) => axios.post(`${FASTIFY_URL}/api/social/schedule`, data),
    },
  },
  
  crm: {
    tickets: {
      getAll: () => axios.get(`${FASTIFY_URL}/api/crm/tickets`),
      create: (data: any) => axios.post(`${FASTIFY_URL}/api/crm/tickets`, data),
    },
  },
  
  // ===== PYTHON AI SERVICE =====
  ai: {
    chat: (message: string) => axios.post(`${PYTHON_URL}/api/ai/chat`, { message }),
    recommendations: (customerId: string) => axios.post(`${PYTHON_URL}/api/ai/recommendations`, { customerId }),
    forecast: (productId: string, days: number) => axios.post(`${PYTHON_URL}/api/ai/demand-forecast`, { productId, days }),
    pricing: (productId: string) => axios.post(`${PYTHON_URL}/api/ai/pricing`, { productId }),
    content: (prompt: string) => axios.post(`${PYTHON_URL}/api/ai/content`, { prompt }),
  },
  
  analytics: {
    dashboard: () => axios.get(`${PYTHON_URL}/api/analytics/dashboard`),
  },
  
  insights: {
    daily: () => axios.get(`${PYTHON_URL}/api/insights/daily`),
  },
  
  // ===== GRAPHQL GATEWAY =====
  graphql: {
    query: (query: string, variables?: any) => 
      axios.post(GRAPHQL_URL, { query, variables }),
  },
}
```

---

## 🎯 Module to Page Mapping

### **Dashboard Module → `/app/dashboard/page.tsx`**
```typescript
import api from '@/lib/api-complete'

const data = await api.dashboard.getData()        // Golang v2
const insights = await api.insights.daily()       // Python AI
```

### **Products Module → `/app/master/products/page.tsx`**
```typescript
const products = await api.products.getAll()      // Golang v2
const lowStock = await api.inventory.getAll()     // Golang v2
```

### **Sales Module → `/app/sales/page.tsx`**
```typescript
const sales = await api.sales.getAll()            // Golang v2
const customers = await api.customers.getAll()    // Golang v2
```

### **Purchases Module → `/app/purchases/page.tsx`**
```typescript
const vendors = await api.purchases.vendors.getAll()  // NestJS
const orders = await api.purchases.orders.getAll()    // NestJS
```

### **Finance Module → `/app/finance/page.tsx`**
```typescript
const invoices = await api.finance.invoices.getAll()  // NestJS
const profitLoss = await api.finance.reports.profitLoss()  // NestJS
```

### **Marketing Module → `/app/marketing/campaigns/page.tsx`**
```typescript
const campaigns = await api.marketing.campaigns.getAll()  // Fastify
const templates = await api.marketing.templates.getAll()  // Fastify
```

### **AI Module → `/app/ai-insights/page.tsx`**
```typescript
const insights = await api.insights.daily()       // Python AI
const forecast = await api.ai.forecast(productId, 30)  // Python AI
```

---

## ✅ Implementation Checklist

- [ ] Setup Turborepo monorepo structure
- [ ] Configure both Golang services (v1 Fiber/Echo + v2 Gin)
- [ ] Setup Kafka with Zookeeper
- [ ] Implement GraphQL Federation
- [ ] Create Kubernetes manifests
- [ ] Connect all Next.js pages to APIs
- [ ] Implement master data management
- [ ] Setup event-driven architecture
- [ ] Add end-to-end testing
- [ ] Deploy to Kubernetes cluster

---

**Status:** Ready for implementation 🚀
