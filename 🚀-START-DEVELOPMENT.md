# 🚀 START DEVELOPMENT - QUICK GUIDE

## ✅ EVERYTHING IS READY!

All services have been configured and tested. Here's how to start development:

---

## 🎯 ONE COMMAND START

### Start Everything
```bash
./START-EVERYTHING.sh
```

This will:
- ✅ Check prerequisites (Node.js, Go, PostgreSQL)
- ✅ Kill any existing processes on the ports
- ✅ Start Golang v1 API (Port 8080)
- ✅ Start Golang v2 API (Port 3005)
- ✅ Start NestJS API (Port 3001)
- ✅ Start Fastify API (Port 3002)
- ✅ Start Express API (Port 3004)
- ✅ Start Next.js Frontend (Port 3000)
- ✅ Run health checks on all services
- ✅ Display status dashboard

**Logs are saved in:** `logs/` directory

---

## 🔧 BOTH GOLANG SERVICES EXPLAINED

### Golang v1 (Port 8080) - Comprehensive ERP
- **File:** `services/api-golang/main.go`
- **Framework:** Gin
- **Purpose:** Full ERP with hardware integration, offline sync
- **Features:** Sales, Inventory, Finance, HR, Hardware devices

### Golang v2 (Port 3005) - Modern Clean API
- **File:** `services/api-golang-v2/cmd/main.go`
- **Framework:** Gin  
- **Purpose:** Clean architecture API for modern frontend
- **Features:** Products, Sales, Customers, Vendors (Used by Next.js!)

**See full details:** `GOLANG-SERVICES-GUIDE.md`

---

## 🧪 TEST ALL SERVICES

### Test All APIs
```bash
./test-apis.sh
```

### Test Golang Services
```bash
./test-golang-services.sh
```

### Test Individual Service
```bash
# Golang v1
curl http://localhost:8080/health

# Golang v2
curl http://localhost:3005/health
curl http://localhost:3005/api/products

# NestJS
curl http://localhost:3001/health

# Fastify
curl http://localhost:3002/health

# Express
curl http://localhost:3004/health

# Frontend
curl http://localhost:3000
```

---

## 🌐 ACCESS POINTS

### Frontend
```
http://localhost:3000
```

### APIs
- **Golang v1:** http://localhost:8080
- **Golang v2:** http://localhost:3005 ← **Used by frontend!**
- **NestJS:** http://localhost:3001
- **Fastify:** http://localhost:3002
- **Express:** http://localhost:3004

---

## 📊 ALL PAGES CONNECTED

**22+ Pages with Dynamic Data:**

### ✅ Sales Module (5 pages)
- `/sales` - Dashboard
- `/sales/orders` - Orders & quotations
- `/sales/returns` - Returns & refunds
- `/sales/receipts` - Payment receipts
- `/pos` - Point of sale

### ✅ Purchases Module (7 pages)
- `/purchases` - Dashboard
- `/purchases/vendors` - Vendor management
- `/purchases/orders` - Purchase orders
- `/purchases/grn` - Goods receipt
- `/purchases/bills` - Bills & invoices
- `/purchases/payments` - Vendor payments
- `/purchases/returns` - Purchase returns

### ✅ Inventory Module (4 pages)
- `/inventory` - Stock tracking
- `/inventory/batches` - Batch with expiry alerts
- `/inventory/transfers` - Branch transfers
- `/inventory/adjustments` - Stock adjustments

### ✅ Core Modules (6 pages)
- `/dashboard` - Live KPIs
- `/products` - Product management
- `/customers` - Customer CRUD
- `/vendors` - Vendor management
- `/marketing/campaigns` - Campaign management
- `/finance` - Finance dashboard

**All use React Query hooks connecting to APIs!**

---

## 📝 VIEW LOGS

### All Logs
```bash
tail -f logs/*.log
```

### Individual Service
```bash
tail -f logs/golang-v1.log
tail -f logs/golang-v2.log
tail -f logs/nestjs.log
tail -f logs/fastify.log
tail -f logs/express.log
tail -f logs/frontend.log
```

---

## 🛑 STOP SERVICES

**Press Ctrl+C** in the terminal running START-EVERYTHING.sh

Or manually:
```bash
# Kill by port
pkill -f "go run"
pkill -f "npm run dev"
pkill -f "node.*api"

# Or use lsof
kill -9 $(lsof -ti:3000)  # Frontend
kill -9 $(lsof -ti:8080)  # Golang v1
kill -9 $(lsof -ti:3005)  # Golang v2
kill -9 $(lsof -ti:3001)  # NestJS
kill -9 $(lsof -ti:3002)  # Fastify
kill -9 $(lsof -ti:3004)  # Express
```

---

## 🔄 RESTART SERVICES

```bash
# Stop (Ctrl+C)
# Then restart
./START-EVERYTHING.sh
```

The script automatically:
- Cleans up old processes
- Clears old logs
- Starts fresh

---

## 📚 DOCUMENTATION

### Comprehensive Guides
- `START-HERE.md` - Quick start
- `QUICK-REFERENCE.md` - Commands reference
- `GOLANG-SERVICES-GUIDE.md` - Both Golang services explained
- `COMPLETE-PAGES-STATUS.md` - All pages status
- `🎉-COMPLETE-100-PERCENT.md` - Full completion report

### API Documentation
- **Golang v1 Swagger:** http://localhost:8080/swagger
- **NestJS Docs:** http://localhost:3001/docs
- **Express Docs:** http://localhost:3003/api-docs

---

## ✅ DEVELOPMENT CHECKLIST

Before starting development:
- [ ] PostgreSQL running (port 5433)
- [ ] Redis running (port 6380) - optional
- [ ] Kafka running (port 9092) - optional
- [ ] Run `./START-EVERYTHING.sh`
- [ ] Wait for all services to be ready
- [ ] Open http://localhost:3000
- [ ] Verify all pages load

---

## 🐛 TROUBLESHOOTING

### Service Won't Start
```bash
# Check if port is in use
lsof -i:8080    # Golang v1
lsof -i:3005    # Golang v2
lsof -i:3000    # Frontend

# Check logs
tail -f logs/golang-v2.log
```

### Database Connection Error
```bash
# Test PostgreSQL
psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy

# Check if running
pg_isready -h localhost -p 5433
```

### Frontend Not Loading
```bash
# Check if dependencies installed
cd /var/www/homeopathy-business-platform
npm install

# Restart frontend
pkill -f "npm run dev"
npm run dev
```

### Golang Module Errors
```bash
# Golang v1
cd services/api-golang
go mod download
go mod tidy

# Golang v2
cd services/api-golang-v2
go mod download
go mod tidy
```

---

## 💡 DEVELOPMENT TIPS

### Hot Reload
The startup script runs services in development mode with hot reload:
- **Next.js:** Auto-reloads on file changes
- **NestJS:** Uses `start:dev` with watch mode
- **Golang:** Restart service to see changes (or use Air for hot reload)

### Add New Feature
1. Update backend API (Golang v2 for frontend pages)
2. Create/update React Query hook in `lib/hooks/`
3. Update page component
4. Test with `curl` or browser
5. Verify data flows correctly

### Database Changes
1. Create migration in `db/migrations/`
2. Run migration: `psql -U postgres -d yeelo_homeopathy -f migration.sql`
3. Update models if needed
4. Restart backend service

---

## 🎉 YOU'RE READY!

Everything is configured and working:
- ✅ 2 Golang services (both Gin)
- ✅ 3 Node.js services (NestJS, Fastify, Express)
- ✅ 1 Next.js frontend
- ✅ 22+ pages with dynamic data
- ✅ React Query hooks connected
- ✅ TypeScript type-safe
- ✅ All APIs tested
- ✅ Production ready

**Just run:** `./START-EVERYTHING.sh`

**Happy Development! 🚀**
