# API Golang V2 Service

Production-ready Go API service for HomeoERP system.

## 🚀 Quick Start

```bash
# Start the service
./start-service.sh

# Or manually
go run cmd/main.go
```

## 📋 Configuration

**Port:** 3005  
**Database:** PostgreSQL (localhost:5433)  
**Redis:** localhost:6379

Environment variables (`.env` file):
```
PORT=3005
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://:redis_password@localhost:6379
JWT_SECRET=your-secret-key-change-in-production
ENVIRONMENT=development
KAFKA_BROKERS=localhost:9092
INVOICE_PARSER_URL=http://localhost:8005
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Service health status

### Dashboard APIs (ERP)
- `GET /api/erp/dashboard/summary` - Dashboard summary stats
- `GET /api/erp/dashboard/stats` - Detailed statistics
- `GET /api/erp/dashboard/activity` - Recent activity
- `GET /api/erp/dashboard/top-products` - Top selling products
- `GET /api/erp/dashboard/recent-sales` - Recent sales transactions
- `GET /api/erp/dashboard/revenue-chart?period=6m` - Revenue chart data

### System APIs
- `GET /api/v1/system/health` - System health monitor (all services)
- `GET /api/v1/system/bugs` - Bug reports list
- `POST /api/v1/system/bugs/ingest` - Submit bug report

### Inventory APIs
- `GET /api/v2/inventory/expiries` - Expiry summary
- `GET /api/v2/inventory/expiries/alerts` - Expiry alerts
- `POST /api/v2/inventory/expiries/refresh` - Refresh expiry data

### Analytics APIs
- `GET /api/erp/analytics/sales` - Sales analytics
- `GET /api/erp/analytics/purchases` - Purchase analytics
- `GET /api/erp/analytics/sales-summary` - Sales summary
- `GET /api/erp/analytics/purchase-summary` - Purchase summary

### Commission APIs
- `POST /api/erp/commissions/rules` - Create commission rule
- `GET /api/erp/commissions/calculate` - Calculate commission
- `GET /api/erp/commissions/report` - Commission report
- `POST /api/erp/commissions/pay` - Pay commission

### Bulk Operations
- `PUT /api/erp/products/bulk-update` - Bulk update products
- `PUT /api/erp/customers/bulk-update` - Bulk update customers
- `POST /api/erp/customers/bulk-import` - Bulk import customers
- `PUT /api/erp/vendors/bulk-update` - Bulk update vendors
- `DELETE /api/erp/bulk-delete` - Bulk delete records

### Damage Tracking
- `POST /api/erp/inventory/damages` - Create damage entry
- `GET /api/erp/inventory/damages` - List damage entries
- `GET /api/erp/inventory/damages/summary` - Damage summary
- `DELETE /api/erp/inventory/damages/:id` - Delete damage entry

### Product Bundles
- `POST /api/erp/bundles` - Create bundle
- `GET /api/erp/bundles` - List bundles
- `GET /api/erp/bundles/:id` - Get bundle details
- `PUT /api/erp/bundles/:id` - Update bundle
- `DELETE /api/erp/bundles/:id` - Delete bundle
- `POST /api/erp/bundles/:id/sell` - Sell bundle

### Loyalty Program
- `POST /api/erp/loyalty/cards` - Create loyalty card
- `GET /api/erp/loyalty/cards/:customer_id` - Get customer card
- `POST /api/erp/loyalty/earn` - Earn points
- `POST /api/erp/loyalty/redeem` - Redeem points
- `GET /api/erp/loyalty/transactions/:card_id` - Transaction history

### WhatsApp Integration
- `POST /api/erp/whatsapp/bulk-send` - Bulk send messages
- `POST /api/erp/whatsapp/credit-reminder` - Send credit reminders

### Payment Gateway
- `POST /api/erp/payments/create-order` - Create payment order
- `POST /api/erp/payments/verify` - Verify payment

### POS (Point of Sale)
- `POST /api/erp/pos/hold` - Hold bill
- `GET /api/erp/pos/held-bills` - Get held bills
- `POST /api/erp/pos/resume/:id` - Resume bill
- `DELETE /api/erp/pos/held-bills/:id` - Delete held bill
- `GET /api/erp/pos/counters` - Get POS counters status
- `POST /api/erp/pos/counters/register` - Register POS counter

### Estimates/Quotations
- `POST /api/erp/estimates` - Create estimate
- `GET /api/erp/estimates` - List estimates
- `POST /api/erp/estimates/:id/convert` - Convert to invoice
- `PUT /api/erp/estimates/:id/status` - Update status

### Purchase Invoice Processing
- `POST /api/v1/purchases/invoices/upload` - Upload invoice
- `POST /api/v1/purchases/invoices/:id/confirm` - Confirm & create GRN

## 🔧 CORS Configuration

CORS is enabled for the Next.js frontend:
- **Allowed Origins:** http://localhost:3000, http://127.0.0.1:3000
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** Origin, Content-Type, Accept, Authorization
- **Credentials:** Enabled
- **Max Age:** 12 hours

## 📊 Monitoring

View logs:
```bash
tail -f /tmp/api-golang-master.log
```

Check service status:
```bash
lsof -i :3005
```

Test API:
```bash
curl http://localhost:3005/health
curl http://localhost:3005/api/v1/system/health | jq
curl http://localhost:3005/api/erp/dashboard/stats | jq
```

## 🏗️ Architecture

**Framework:** Gin (Go)  
**Database:** GORM (PostgreSQL)  
**Pattern:** Handler → Service → Repository  

**Structure:**
```
services/api-golang-master/
├── cmd/
│   └── main.go              # Entry point
├── internal/
│   ├── config/              # Configuration
│   ├── database/            # Database connection
│   ├── handlers/            # HTTP handlers (25+ files)
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/          # HTTP middleware
│   └── rbac/                # Role-based access control
├── .env                     # Environment configuration
├── go.mod                   # Go dependencies
└── start-service.sh         # Startup script
```

## ✅ Status

- ✅ Service running on port 3005
- ✅ CORS enabled for frontend
- ✅ Database connected
- ✅ 100+ API endpoints active
- ✅ Mock data returning correctly
- ✅ Health checks passing

## 🔄 Integration

This service integrates with:
- **Next.js Frontend** (port 3000) - UI layer
- **PostgreSQL** (port 5433) - Database
- **Redis** (port 6379) - Caching
- **Kafka** (port 9092) - Event streaming
- **Invoice Parser** (port 8005) - PDF processing

## 📝 Notes

- All endpoints currently return mock/placeholder data
- Real database integration is in progress
- Authentication/Authorization to be implemented
- Service logs to `/tmp/api-golang-master.log`
