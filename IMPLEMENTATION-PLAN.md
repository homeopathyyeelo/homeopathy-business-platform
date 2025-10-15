# 🚀 Service Implementation Plan
**Date:** October 11, 2025  
**Goal:** Complete all 8 missing/broken services

---

## 📋 Services Status Summary

| # | Service | Port | Current Status | Action Required | Priority | Est. Time |
|---|---------|------|----------------|-----------------|----------|-----------|
| 1 | **Auth Service** | 3001 | ✅ Complete | Start & Test | P1 | 15 min |
| 2 | **NestJS API** | 3002 | 🟡 Has Errors | Fix & Start | P1 | 1-2 hrs |
| 3 | **Fastify API** | 3003 | 🔴 Incomplete | Complete Implementation | P2 | 2-3 hrs |
| 4 | **GraphQL Gateway** | 4000 | 🔴 Needs Implementation | Build Complete Gateway | P2 | 2-3 hrs |
| 5 | **API Gateway** | 5000 | 🔴 Needs Implementation | Build Routing Layer | P3 | 1-2 hrs |
| 6 | **Outbox Worker** | - | 🔴 Needs Implementation | Build Event Pattern | P3 | 1-2 hrs |
| 7 | **Golang Worker** | - | 🔴 Needs Implementation | Build Event Consumer | P3 | 1-2 hrs |
| 8 | **Next.js Frontend** | 3000 | 🔴 Needs Wiring | Connect All APIs | P4 | 3-4 hrs |

**Total Estimated Time:** 12-18 hours of development

---

## 🎯 Implementation Order (By Dependency)

### Phase 1: Foundation Services (Critical Path)
1. ✅ **Auth Service** - Already complete, just needs to start
2. **NestJS API** - Fix compilation errors
3. **Fastify API** - Complete CRUD implementation

### Phase 2: Gateway Layer
4. **GraphQL Gateway** - Unified API access
5. **API Gateway** - Request routing and load balancing

### Phase 3: Background Processing
6. **Outbox Worker** - Reliable event publishing
7. **Golang Worker** - High-performance event processing

### Phase 4: User Interface
8. **Next.js Frontend** - Wire all backend services

---

## 📝 Detailed Implementation Steps

### 1. Auth Service ✅ (Port 3001)

**Status:** Complete - Just needs to start

**Features Already Implemented:**
- ✅ User registration with bcrypt password hashing
- ✅ User login with JWT token generation (RS256)
- ✅ Token refresh mechanism
- ✅ Token validation endpoint
- ✅ JWKS endpoint for public key
- ✅ Prometheus metrics
- ✅ Swagger documentation
- ✅ PostgreSQL integration
- ✅ User events tracking

**Action:**
```bash
cd services/auth-service
npm start
```

**Test:**
```bash
curl http://localhost:3001/health
curl http://localhost:3001/.well-known/jwks.json
```

---

### 2. NestJS API 🟡 (Port 3002)

**Status:** Has compilation errors but builds

**What Exists:**
- ✅ Project structure with modules
- ✅ Orders module
- ✅ Inventory module
- ✅ Purchase module
- ✅ Finance module
- ✅ B2B module
- ✅ AI module
- ✅ Prisma integration
- ✅ Redis integration
- ✅ Outbox pattern implementation

**Issues to Fix:**
1. TypeScript compilation errors in some services
2. Prisma schema mismatches
3. Import path issues
4. Missing method implementations

**Action Plan:**
1. Review and fix TypeScript errors
2. Update Prisma schema if needed
3. Fix import paths
4. Test all endpoints
5. Start service

**Expected Outcome:** Fully functional NestJS API with all modules working

---

### 3. Fastify API 🔴 (Port 3003)

**Status:** Partial implementation exists

**What Needs to be Implemented:**
- Complete CRUD operations for:
  - ✅ Products
  - ✅ Customers
  - ✅ Orders
  - ❌ Campaigns (needs completion)
  - ❌ Inventory (needs implementation)
  - ❌ Analytics (needs implementation)
- JWT authentication middleware
- Request validation schemas
- Error handling
- Swagger/OpenAPI documentation
- Database connection pooling
- Redis caching integration
- Kafka event publishing

**Target Performance:** <5ms response time

**Business Logic to Implement:**
1. **Product Management**
   - Stock level validation
   - Price calculations
   - Expiry date tracking
   - Category management

2. **Order Processing**
   - Order validation (stock availability)
   - Price calculation (discounts, taxes)
   - Payment processing integration
   - Order status workflow
   - Inventory updates on order

3. **Customer Management**
   - Customer profile management
   - Purchase history
   - Loyalty points calculation
   - Customer segmentation

4. **Inventory**
   - Stock tracking
   - Low stock alerts
   - Stock adjustments
   - Reorder point calculations
   - Expiry tracking

5. **Analytics**
   - Revenue reporting
   - Top products
   - Customer analytics
   - Sales trends

---

### 4. GraphQL Gateway 🔴 (Port 4000)

**Status:** Structure exists, needs implementation

**What to Implement:**
1. **Schema Definitions**
   ```graphql
   type Product {
     id: ID!
     name: String!
     price: Float!
     stock: Int!
     category: Category
   }
   
   type Order {
     id: ID!
     customerId: ID!
     items: [OrderItem!]!
     total: Float!
     status: OrderStatus!
   }
   
   type Customer {
     id: ID!
     email: String!
     name: String!
     orders: [Order!]!
   }
   ```

2. **Resolvers**
   - Query resolvers for all entities
   - Mutation resolvers for CRUD operations
   - Field resolvers for relationships
   - DataLoader for N+1 problem

3. **Service Integration**
   - Connect to Golang API
   - Connect to Express API
   - Connect to Fastify API
   - Connect to NestJS API
   - Connect to Auth Service

4. **Features**
   - Authentication integration
   - Real-time subscriptions
   - Error handling
   - Query complexity limits
   - GraphQL Playground

---

### 5. API Gateway 🔴 (Port 5000)

**Status:** Needs implementation

**What to Implement:**
1. **Routing Configuration**
   ```
   /api/auth/*        → Auth Service (3001)
   /api/products/*    → Fastify API (3003)
   /api/orders/*      → NestJS API (3002)
   /api/customers/*   → Express API (3003)
   /api/ai/*          → AI Service (8001)
   /graphql           → GraphQL Gateway (4000)
   ```

2. **Features**
   - Request/Response transformation
   - Load balancing
   - Circuit breaker pattern
   - Rate limiting per service
   - Request logging
   - Metrics collection
   - API versioning support
   - CORS handling

3. **Middleware**
   - Authentication verification
   - Authorization checks
   - Request validation
   - Response caching
   - Error handling

---

### 6. Outbox Worker 🔴

**Status:** Needs implementation

**Purpose:** Reliable event publishing using outbox pattern

**What to Implement:**
1. **Outbox Polling**
   - Poll outbox table every 5 seconds
   - Fetch unpublished events
   - Process in batches

2. **Event Publishing**
   - Publish to Kafka
   - Handle publish failures
   - Retry mechanism (exponential backoff)
   - Dead letter queue

3. **Event Types**
   - order.created
   - order.updated
   - product.created
   - customer.registered
   - inventory.updated

4. **Monitoring**
   - Events processed counter
   - Failed events counter
   - Lag monitoring

---

### 7. Golang Worker 🔴

**Status:** Needs implementation

**Purpose:** High-performance event processing

**What to Implement:**
1. **Kafka Consumer**
   - Subscribe to all topics
   - Parallel processing
   - Offset management
   - Error handling

2. **Event Handlers**
   - Order events → Update analytics
   - Product events → Update search index
   - Customer events → Update segments
   - Inventory events → Send alerts

3. **Processing Logic**
   - Analytics aggregation
   - Real-time notifications
   - Data synchronization
   - Cache invalidation

4. **Performance**
   - Target: 10,000 events/second
   - Concurrent processing
   - Efficient database updates
   - Memory optimization

---

### 8. Next.js Frontend 🔴 (Port 3000)

**Status:** Structure exists, needs API wiring

**What to Implement:**
1. **Authentication Flow**
   - Login page
   - Registration page
   - Protected routes
   - Token management
   - Auto-refresh tokens

2. **Dashboard**
   - Revenue metrics
   - Sales charts
   - Top products
   - Recent orders
   - Low stock alerts

3. **Product Management**
   - Product list with filters
   - Product detail view
   - Add/Edit product form
   - Stock management
   - Category management

4. **Order Management**
   - Order list with status filters
   - Order detail view
   - Create new order
   - Update order status
   - Order fulfillment

5. **Customer Management**
   - Customer list
   - Customer detail view
   - Purchase history
   - Customer segmentation
   - Communication history

6. **Inventory Management**
   - Stock levels view
   - Low stock alerts
   - Stock adjustment form
   - Expiry tracking
   - Reorder management

7. **Campaign Management**
   - Campaign list
   - Create campaign
   - Campaign analytics
   - Customer targeting

8. **API Integration**
   - API client setup
   - Error handling
   - Loading states
   - Optimistic updates
   - Real-time updates (WebSocket)

---

## 🔑 Key Business Logic Requirements

### Order Processing Flow
```
1. Customer places order
2. Validate stock availability
3. Calculate price (base + tax - discount)
4. Reserve inventory
5. Process payment
6. Create order record
7. Publish order.created event
8. Update inventory
9. Send confirmation email
10. Update analytics
```

### Inventory Management Logic
```
1. Track stock levels in real-time
2. Calculate reorder points:
   - Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
3. Alert when stock < reorder point
4. Track expiry dates
5. FIFO/FEFO stock rotation
6. Stock adjustment audit trail
```

### Pricing Logic
```
1. Base Price (from product)
2. Apply customer-specific discount
3. Apply promotional discount
4. Calculate tax
5. Final Price = (Base - Discounts) × (1 + Tax Rate)
```

### Campaign Targeting
```
1. Segment customers by:
   - Purchase history
   - Total spend
   - Last purchase date
   - Product preferences
2. Create targeted campaigns
3. Track campaign performance
4. Calculate ROI
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test each service independently
- Mock external dependencies
- Cover business logic
- Target: 80% coverage

### Integration Tests
- Test service interactions
- Test database operations
- Test event publishing/consuming
- Test authentication flow

### E2E Tests
- Test complete user flows
- Test order placement
- Test inventory updates
- Test campaign creation

### Performance Tests
- Load test each API
- Stress test event processing
- Test database performance
- Monitor resource usage

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Response Time | <100ms P95 | Prometheus metrics |
| Event Processing | 10k/sec | Kafka metrics |
| System Uptime | 99.9% | Health checks |
| Error Rate | <0.1% | Error tracking |
| Test Coverage | >80% | Jest/Go test |
| Build Time | <2 min | CI/CD pipeline |

---

## 🚦 Implementation Checkpoints

After each service implementation:
1. ✅ Code compiles without errors
2. ✅ Unit tests pass
3. ✅ Integration tests pass
4. ✅ Service starts successfully
5. ✅ Health check endpoint works
6. ✅ All endpoints documented in Swagger
7. ✅ Metrics are being collected
8. ✅ Logs are structured and useful
9. ✅ Error handling is comprehensive
10. ✅ Performance targets are met

---

## 📅 Development Timeline

### Day 1 (Today)
- ✅ Fix all bugs (DONE)
- ✅ Start Auth Service
- ✅ Fix NestJS API
- ⏳ Complete Fastify API

### Day 2
- GraphQL Gateway implementation
- API Gateway implementation
- Begin Workers implementation

### Day 3
- Complete Workers
- Begin Frontend wiring
- Integration testing

### Day 4
- Complete Frontend
- E2E testing
- Performance optimization
- Documentation

---

## 🎯 Next Immediate Actions

1. **Start Auth Service** (5 minutes)
2. **Fix NestJS API** (1-2 hours)
3. **Complete Fastify API** (2-3 hours)
4. **Test all 3 APIs together** (30 minutes)

Let's begin! 🚀
