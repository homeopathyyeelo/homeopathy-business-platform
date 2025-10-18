# 🚀 QUICK REFERENCE - START & TEST EVERYTHING

## ⚡ START ALL SERVICES (One Command Each Terminal)

### Terminal 1: PostgreSQL
```bash
# Ensure PostgreSQL is running
sudo systemctl status postgresql
# If not running: sudo systemctl start postgresql
```

### Terminal 2: Golang v2 API (Port 3005)
```bash
cd /var/www/homeopathy-business-platform/services/api-golang-v2
go run main.go
```

### Terminal 3: NestJS API (Port 3001)
```bash
cd /var/www/homeopathy-business-platform/services/api-nest
npm run start:dev
```

### Terminal 4: Fastify API (Port 3002)
```bash
cd /var/www/homeopathy-business-platform/services/api-fastify
npm run dev
```

### Terminal 5: Frontend (Port 3000)
```bash
cd /var/www/homeopathy-business-platform
npm run dev
```

---

## 🧪 TEST ALL PAGES (Copy-Paste URLs)

### Sales Module
```
http://localhost:3000/sales
http://localhost:3000/sales/orders
http://localhost:3000/sales/returns
http://localhost:3000/sales/receipts
http://localhost:3000/pos
```

### Purchases Module
```
http://localhost:3000/purchases
http://localhost:3000/purchases/vendors
http://localhost:3000/purchases/orders
http://localhost:3000/purchases/grn
http://localhost:3000/purchases/bills
http://localhost:3000/purchases/payments
http://localhost:3000/purchases/returns
```

### Inventory Module
```
http://localhost:3000/inventory
http://localhost:3000/inventory/batches
http://localhost:3000/inventory/transfers
http://localhost:3000/inventory/adjustments
```

### Other Modules
```
http://localhost:3000/dashboard
http://localhost:3000/products
http://localhost:3000/customers
http://localhost:3000/vendors
http://localhost:3000/marketing/campaigns
http://localhost:3000/finance
```

---

## 🔍 VERIFY APIs Are Running

```bash
# Test Golang v2 (Products, Sales, Inventory)
curl http://localhost:3005/api/products

# Test NestJS (Purchases)
curl http://localhost:3001/purchase/vendors

# Test Fastify (Marketing)
curl http://localhost:3002/api/campaigns

# Test all at once
./test-apis.sh
```

---

## ✅ WHAT TO LOOK FOR

### Each Page Should Show:
1. ✅ **Stats Cards** at the top with real numbers
2. ✅ **Data Table** populated with database records
3. ✅ **Loading spinner** briefly when first loading
4. ✅ **Search/filter** functionality working
5. ✅ **Buttons** for Create/Edit/Delete
6. ✅ **Status badges** in color (green/red/orange)
7. ✅ **No TypeScript errors** in console
8. ✅ **No 404 errors** in network tab

### Example: /sales/orders
- Should show 3 stat cards (Total Orders, Pending, Total Value)
- Table with order numbers, customers, amounts, statuses
- Green badges for COMPLETED, Orange for PENDING
- Currency formatted as ₹1,234
- Dates formatted as DD/MM/YYYY

---

## 🐛 TROUBLESHOOTING

### If page shows "Loading..." forever:
```bash
# Check if API is running
curl http://localhost:3005/api/products
# If error, restart the Golang service
```

### If you see TypeScript errors:
```bash
# Restart Next.js dev server
npm run dev
```

### If data is empty:
```bash
# Run database migrations
psql -U postgres -d yeelo_homeopathy -f db/migrations/004_purchases_complete.sql
psql -U postgres -d yeelo_homeopathy -f db/migrations/005_marketing_complete.sql
psql -U postgres -d yeelo_homeopathy -f db/migrations/006_integrations_complete.sql
```

### Check all services are running:
```bash
# Port check
lsof -i :3000  # Frontend
lsof -i :3001  # NestJS
lsof -i :3002  # Fastify
lsof -i :3005  # Golang v2
```

---

## 📊 PAGES UPDATED COUNT

- **Sales Module:** 5 pages ✅
- **Purchases Module:** 7 pages ✅
- **Inventory Module:** 4 pages ✅
- **Core Modules:** 6 pages ✅
- **Total:** 22 pages with dynamic data ✅

---

## 🎯 QUICK CHECKLIST

**Before Testing:**
- [ ] PostgreSQL running
- [ ] Golang v2 API running (Port 3005)
- [ ] NestJS API running (Port 3001)
- [ ] Fastify API running (Port 3002)
- [ ] Frontend running (Port 3000)

**During Testing:**
- [ ] Dashboard shows live stats
- [ ] POS can create orders
- [ ] Sales pages show orders/returns/receipts
- [ ] Purchases pages show vendors/POs/bills
- [ ] Inventory shows batches/transfers/adjustments
- [ ] All stats cards show numbers
- [ ] No console errors

**Success Criteria:**
- [ ] All pages load without errors
- [ ] All data is dynamic from database
- [ ] All stats cards show real numbers
- [ ] All CRUD operations work
- [ ] All searches/filters work

---

## 🚀 ONE-LINE COMMANDS

```bash
# Start everything (in one script)
./START-ALL-SERVICES.sh

# Test all APIs
./test-apis.sh

# Verify all pages
./verify-all-pages.sh

# Run migrations
./run-migrations.sh
```

---

## 💡 TIPS

1. **Always start backend APIs first** before frontend
2. **Check browser console** for any errors
3. **Check network tab** to see API calls
4. **Use React Query DevTools** to inspect cache
5. **Refresh page** if data doesn't load immediately

---

## 📞 SUPPORT

If any issues:
1. Check all services are running
2. Check database is accessible
3. Check API endpoints return data
4. Clear browser cache
5. Restart services

---

## ✅ YOU'RE READY!

Everything is configured and ready to use.
Just start the services and open the pages.
All data will flow from database through APIs to frontend automatically!

**Happy Testing! 🎉**
