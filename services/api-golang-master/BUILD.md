# Build & Run Guide

## Quick Start

```bash
# Build
go build -o bin/api cmd/main.go

# Run
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy" \
REDIS_URL="redis://localhost:6380" \
PORT=3005 \
./bin/api
```

## Environment Variables

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://localhost:6380
PORT=3005
JWT_SECRET=your-secret-key
```

## Endpoints

### Authentication
- POST   /api/auth/login
- POST   /api/auth/logout
- POST   /api/auth/refresh

### Products & Inventory
- GET    /api/erp/products
- POST   /api/erp/products
- GET    /api/erp/inventory
- POST   /api/erp/inventory/adjust

### Sales & Orders
- GET    /api/erp/sales/orders
- POST   /api/erp/sales/orders
- GET    /api/erp/sales/invoices

### Purchases
- GET    /api/erp/purchases/orders
- POST   /api/erp/purchases/orders

### Finance
- GET    /api/finance/ledgers
- GET    /api/finance/profit-loss
- GET    /api/finance/gst-reports

### Invoice Parser
- POST   /api/invoices/upload
- POST   /api/invoices/:id/parse
- POST   /api/invoices/:id/match

### AI & Analytics
- POST   /api/erp/ai/recommendations/products
- POST   /api/erp/ai/forecast/sales
- GET    /api/erp/ai/insights/business

### Notifications
- GET    /api/erp/notifications
- POST   /api/erp/notifications

### HR
- GET    /api/erp/hr/employees
- POST   /api/erp/hr/employees

### Settings
- GET    /api/erp/branches
- GET    /api/erp/tax/slabs
- GET    /api/erp/rbac/roles

## Total Endpoints: 150+
