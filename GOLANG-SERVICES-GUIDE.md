# 🔧 GOLANG SERVICES GUIDE

## Overview

Your platform has **TWO Golang services**, both using the **Gin framework**, serving different purposes:

---

## 🔷 Golang v1 - Main ERP Service

### Location
```
services/api-golang/
```

### Framework
**Gin** (github.com/gin-gonic/gin)

### Port
**8080** (configurable via `SERVER_PORT` env var)

### Purpose
Main comprehensive ERP backend service with advanced features

### Features Included
- ✅ Sales Management (handlers, services)
- ✅ Inventory Management
- ✅ Finance & Accounting
- ✅ Purchase Orders
- ✅ Customer Management
- ✅ HR & Payroll
- ✅ Marketing & Loyalty
- ✅ Hardware Integration (POS devices, printers)
- ✅ Multi-PC Sharing
- ✅ Offline Sync
- ✅ Payment Gateway Integration
- ✅ Reports & Analytics
- ✅ Settings & Configuration
- ✅ Master Data Management

### Key Files
```
services/api-golang/
├── main.go                          # Main entry point (Gin setup)
├── sales_handlers.go                # Sales API endpoints
├── sales_service.go                 # Sales business logic
├── inventory_service.go             # Inventory management
├── finance_handlers.go              # Finance/accounting
├── hr_handlers.go                   # HR management
├── marketing_handlers.go            # Marketing & campaigns
├── hardware_integration_handlers.go # Hardware devices
├── payment_gateway_handlers.go      # Payment processing
├── reports_handlers.go              # Reports generation
├── models.go                        # Database models
├── erp_models.go                    # ERP-specific models
└── masters.go                       # Master data
```

### API Endpoints
```
GET  /health                         # Health check
GET  /api/products                   # Product list
GET  /api/sales                      # Sales orders
POST /api/sales                      # Create sale
GET  /api/inventory                  # Inventory list
GET  /api/customers                  # Customer list
GET  /api/finance/*                  # Finance endpoints
GET  /api/hr/*                       # HR endpoints
GET  /api/reports/*                  # Reports
POST /api/hardware/*                 # Hardware integration
POST /api/payments/*                 # Payment processing
```

### Start Command
```bash
cd services/api-golang
export SERVER_PORT=8080
go run main.go
```

### Use Cases
- Primary ERP operations
- Hardware device integration (barcode scanners, receipt printers)
- Complex business logic
- Offline sync capabilities
- Multi-PC sharing
- Payment gateway processing
- Comprehensive reporting

---

## 🔶 Golang v2 - Modern Clean Architecture API

### Location
```
services/api-golang-v2/
```

### Framework
**Gin** (github.com/gin-gonic/gin)

### Port
**3005** (configurable via `PORT` env var)

### Purpose
Modern, clean architecture API service following best practices

### Features Included
- ✅ Products API
- ✅ Sales API
- ✅ Customers API
- ✅ Vendors API
- ✅ Inventory API
- ✅ Auth & Users
- ✅ Email Service
- ✅ CMS Integration
- ✅ Clean Architecture Structure

### Project Structure
```
services/api-golang-v2/
├── cmd/
│   └── main.go                      # Application entry point
├── internal/
│   ├── config/                      # Configuration management
│   ├── database/                    # Database connection
│   ├── middleware/                  # HTTP middleware (CORS, security)
│   ├── models/                      # Domain models
│   ├── handlers/                    # HTTP handlers
│   ├── services/                    # Business logic
│   └── repositories/                # Data access layer
├── api/
│   └── routes/                      # Route definitions
├── migrations/                      # Database migrations
└── tests/                           # Test files
```

### API Endpoints
```
GET  /health                         # Health check
GET  /api/products                   # Product list (paginated)
POST /api/products                   # Create product
GET  /api/products/:id               # Get product details
PUT  /api/products/:id               # Update product
DELETE /api/products/:id             # Delete product
GET  /api/sales                      # Sales list
POST /api/sales                      # Create sale
GET  /api/customers                  # Customer list
GET  /api/vendors                    # Vendor list
GET  /api/inventory                  # Inventory tracking
POST /api/auth/login                 # Authentication
GET  /api/users                      # User management
POST /api/email/send                 # Email service
GET  /api/cms/*                      # CMS endpoints
```

### Start Command
```bash
cd services/api-golang-v2
export PORT=3005
go run cmd/main.go
```

### Use Cases
- Clean, RESTful API operations
- Modern frontend integration (React Query hooks)
- Microservice-style architecture
- Easy to test and maintain
- Follows SOLID principles
- Domain-driven design

---

## 📊 Comparison

| Feature | Golang v1 | Golang v2 |
|---------|-----------|-----------|
| **Framework** | Gin | Gin |
| **Port** | 8080 | 3005 |
| **Architecture** | Monolithic | Clean/Layered |
| **Structure** | Single package | Multi-layered |
| **Entry Point** | `main.go` | `cmd/main.go` |
| **Primary Use** | Complete ERP | Modern API |
| **Hardware Support** | Yes | No |
| **Offline Sync** | Yes | No |
| **Code Style** | Comprehensive | Clean/Modular |
| **Best For** | Enterprise features | Modern web apps |

---

## 🚀 Starting Both Services

### Option 1: Use Startup Script (Recommended)
```bash
./START-EVERYTHING.sh
```

This starts:
- ✅ Golang v1 on port 8080
- ✅ Golang v2 on port 3005
- ✅ All other services (NestJS, Fastify, Express, Frontend)

### Option 2: Start Individually

**Terminal 1 - Golang v1:**
```bash
cd services/api-golang
export SERVER_PORT=8080
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=yeelo_homeopathy
go run main.go
```

**Terminal 2 - Golang v2:**
```bash
cd services/api-golang-v2
export PORT=3005
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
go run cmd/main.go
```

---

## 🧪 Testing Both Services

### Run Test Script
```bash
./test-golang-services.sh
```

### Manual Testing

**Test Golang v1:**
```bash
# Health
curl http://localhost:8080/health

# Products
curl http://localhost:8080/api/products

# Sales
curl http://localhost:8080/api/sales

# Inventory
curl http://localhost:8080/api/inventory
```

**Test Golang v2:**
```bash
# Health
curl http://localhost:3005/health

# Products
curl http://localhost:3005/api/products

# Sales
curl http://localhost:3005/api/sales

# Customers
curl http://localhost:3005/api/customers

# Vendors
curl http://localhost:3005/api/vendors
```

---

## 🔄 Which Service to Use?

### Use Golang v1 (Port 8080) for:
- ✅ Hardware integrations (barcode scanner, printer)
- ✅ Offline mode operations
- ✅ Multi-PC sharing
- ✅ Payment gateway processing
- ✅ Complex business workflows
- ✅ Legacy integrations
- ✅ Comprehensive reporting

### Use Golang v2 (Port 3005) for:
- ✅ Modern web/mobile app APIs
- ✅ Clean RESTful endpoints
- ✅ React Query integration (Next.js frontend)
- ✅ Microservice communication
- ✅ Easy testing and maintenance
- ✅ New feature development

---

## 📝 Environment Variables

### Golang v1
```bash
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yeelo_homeopathy
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=your-secret-key
```

### Golang v2
```bash
PORT=3005
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://localhost:6380
JWT_SECRET=your-secret-key
```

---

## 🔧 Development Tips

### Hot Reload (Golang v1)
```bash
cd services/api-golang
go install github.com/cosmtrek/air@latest
air  # Will auto-reload on code changes
```

### Hot Reload (Golang v2)
```bash
cd services/api-golang-v2
go install github.com/cosmtrek/air@latest
air -c .air.toml  # Will auto-reload on code changes
```

### Run Tests
```bash
# Golang v1
cd services/api-golang
go test ./...

# Golang v2
cd services/api-golang-v2
go test ./...
```

### Build Binaries
```bash
# Golang v1
cd services/api-golang
go build -o bin/api-golang main.go

# Golang v2
cd services/api-golang-v2
go build -o bin/api-golang-v2 cmd/main.go
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -ti:8080   # Golang v1
lsof -ti:3005   # Golang v2

# Kill the process
kill -9 $(lsof -ti:8080)
kill -9 $(lsof -ti:3005)
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy

# Check if PostgreSQL is running
pg_isready -h localhost -p 5433
```

### Module Download Issues
```bash
# Clear Go module cache
go clean -modcache

# Re-download modules
cd services/api-golang && go mod download
cd services/api-golang-v2 && go mod download
```

---

## 📚 API Documentation

### Golang v1
- Swagger UI: `http://localhost:8080/swagger`
- OpenAPI Spec: `services/api-golang/openapi.json`

### Golang v2
- Health: `http://localhost:3005/health`
- README: `services/api-golang-v2/README.md`

---

## ✅ Summary

**Both services use Gin framework** and serve complementary purposes:

1. **Golang v1 (Port 8080)** - Comprehensive ERP with hardware support
2. **Golang v2 (Port 3005)** - Modern clean API for web/mobile apps

Both are **production-ready** and can run simultaneously.

Use the improved startup script: `./START-EVERYTHING.sh`

Test both: `./test-golang-services.sh`

**All pages in the Next.js frontend use Golang v2 (Port 3005) for their API calls!**
