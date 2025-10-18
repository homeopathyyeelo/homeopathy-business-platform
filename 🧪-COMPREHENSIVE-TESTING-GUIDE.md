# 🧪 COMPREHENSIVE TESTING GUIDE

## Prerequisites

Before testing, ensure all services are running:

```bash
# Start infrastructure (PostgreSQL, Redis, Kafka)
docker-compose up -d

# Start all application services
./START-EVERYTHING.sh
```

---

## 1️⃣ TEST ALL SERVICES STATUS

### Quick Check
```bash
# Check if all ports are listening
lsof -i :3000 -i :3001 -i :3002 -i :3004 -i :3005 -i :8080 | grep LISTEN

# Or individually
lsof -i :8080  # Golang v1
lsof -i :3005  # Golang v2
lsof -i :3001  # NestJS
lsof -i :3002  # Fastify
lsof -i :3004  # Express
lsof -i :3000  # Frontend
```

### Health Checks
```bash
# Backend services
curl http://localhost:8080/health  # Golang v1
curl http://localhost:3005/health  # Golang v2
curl http://localhost:3001/health  # NestJS
curl http://localhost:3002/health  # Fastify
curl http://localhost:3004/health  # Express

# Frontend
curl http://localhost:3000
```

---

## 2️⃣ TEST ALL API ENDPOINTS

### Golang v2 APIs (Port 3005) - Used by Frontend

```bash
# Products
curl http://localhost:3005/api/products
curl http://localhost:3005/api/products/1

# Sales
curl http://localhost:3005/api/sales
curl http://localhost:3005/api/sales/orders
curl http://localhost:3005/api/sales/returns
curl http://localhost:3005/api/sales/receipts

# Customers
curl http://localhost:3005/api/customers

# Vendors
curl http://localhost:3005/api/vendors

# Inventory
curl http://localhost:3005/api/inventory
curl http://localhost:3005/api/inventory/batches
curl http://localhost:3005/api/inventory/transfers
curl http://localhost:3005/api/inventory/adjustments
```

### NestJS APIs (Port 3001) - Purchases Module

```bash
# Vendors
curl http://localhost:3001/purchase/vendors

# Purchase Orders
curl http://localhost:3001/purchase/orders

# GRN (Goods Receipt Notes)
curl http://localhost:3001/purchase/grn

# Bills
curl http://localhost:3001/purchase/bills

# Payments
curl http://localhost:3001/purchase/payments

# Returns
curl http://localhost:3001/purchase/returns
```

### Fastify APIs (Port 3002) - Marketing Module

```bash
# Campaigns
curl http://localhost:3002/api/campaigns

# Templates
curl http://localhost:3002/api/templates

# Coupons
curl http://localhost:3002/api/coupons
```

---

## 3️⃣ TEST FRONTEND PAGES

### Test Page Loading

```bash
# Core pages
curl -I http://localhost:3000/
curl -I http://localhost:3000/dashboard
curl -I http://localhost:3000/products
curl -I http://localhost:3000/pos

# Sales pages
curl -I http://localhost:3000/sales
curl -I http://localhost:3000/sales/orders
curl -I http://localhost:3000/sales/returns
curl -I http://localhost:3000/sales/receipts

# Purchases pages
curl -I http://localhost:3000/purchases
curl -I http://localhost:3000/purchases/vendors
curl -I http://localhost:3000/purchases/orders
curl -I http://localhost:3000/purchases/bills
curl -I http://localhost:3000/purchases/payments
curl -I http://localhost:3000/purchases/returns

# Inventory pages
curl -I http://localhost:3000/inventory
curl -I http://localhost:3000/inventory/batches
curl -I http://localhost:3000/inventory/transfers
curl -I http://localhost:3000/inventory/adjustments

# Customer & Vendor pages
curl -I http://localhost:3000/customers
curl -I http://localhost:3000/vendors

# Marketing & Finance
curl -I http://localhost:3000/marketing/campaigns
curl -I http://localhost:3000/finance
```

### Check Response Status
All should return `HTTP/1.1 200 OK`

---

## 4️⃣ TEST DATA CREATION (POST)

### Create Product

```bash
curl -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "category": "Dilutions",
    "unit_price": 150,
    "stock_qty": 100
  }'
```

### Create Customer

```bash
curl -X POST http://localhost:3005/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "9876543210",
    "email": "test@example.com",
    "type": "retail"
  }'
```

### Create Vendor

```bash
curl -X POST http://localhost:3001/purchase/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "contactPerson": "John Doe",
    "phone": "9876543210",
    "email": "vendor@example.com"
  }'
```

### Create Campaign

```bash
curl -X POST http://localhost:3002/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Test Campaign",
    "campaign_type": "whatsapp",
    "description": "Test marketing campaign"
  }'
```

---

## 5️⃣ TEST KAFKA INTEGRATION

### Check Kafka Broker

```bash
# Check if Kafka is running
nc -z localhost 9092 && echo "✅ Kafka is running" || echo "❌ Kafka is not running"
```

### List Kafka Topics

```bash
# Using Docker
docker exec -it $(docker ps | grep kafka | awk '{print $1}') \
  kafka-topics --bootstrap-server localhost:9092 --list
```

### Test Kafka Producer (Node.js)

```bash
# Create test producer
cat > /tmp/test-producer.js << 'EOF'
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

(async () => {
  await producer.connect();
  console.log('✅ Producer connected');
  
  await producer.send({
    topic: 'test-events',
    messages: [
      { key: 'test', value: JSON.stringify({ event: 'test', timestamp: new Date() }) },
    ],
  });
  
  console.log('✅ Message sent');
  await producer.disconnect();
})();
EOF

node /tmp/test-producer.js
```

### Test Kafka Consumer (Node.js)

```bash
# Create test consumer
cat > /tmp/test-consumer.js << 'EOF'
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'test-group' });

(async () => {
  await consumer.connect();
  console.log('✅ Consumer connected');
  
  await consumer.subscribe({ topic: 'test-events' });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('✅ Message received:', {
        topic,
        value: message.value.toString(),
      });
    },
  });
})();
EOF

# Run consumer (press Ctrl+C to stop)
node /tmp/test-consumer.js
```

### Expected Kafka Events

When you perform actions via APIs, these events should be produced:

**Product Events:**
- `product.created` - When product is created
- `product.updated` - When product is updated
- `product.deleted` - When product is deleted

**Sales Events:**
- `sale.created` - When sale is created
- `sale.completed` - When sale is completed
- `sale.returned` - When sale is returned

**Purchase Events:**
- `purchase.order.created` - When PO is created
- `purchase.order.approved` - When PO is approved
- `grn.created` - When GRN is created

**Inventory Events:**
- `inventory.updated` - Stock changes
- `batch.created` - New batch
- `stock.transfer` - Transfer between branches
- `stock.adjustment` - Manual adjustment

---

## 6️⃣ TEST DATABASE

### Check PostgreSQL

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5433

# Connect to database
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy

# Inside psql:
\dt                          # List tables
\d products                  # Describe products table
SELECT COUNT(*) FROM products;
SELECT * FROM products LIMIT 5;
```

### Test Database Queries

```bash
# Count records in each table
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c "
  SELECT 
    'products' as table_name, COUNT(*) FROM products
  UNION ALL SELECT 'customers', COUNT(*) FROM customers
  UNION ALL SELECT 'vendors', COUNT(*) FROM vendors
  UNION ALL SELECT 'sales', COUNT(*) FROM sales
  UNION ALL SELECT 'purchase_orders', COUNT(*) FROM purchase_orders;
"
```

---

## 7️⃣ AUTOMATED TESTING SCRIPTS

### Run All Tests

```bash
# Comprehensive test (all endpoints, pages, Kafka)
./test-all-comprehensive.sh
```

### Test Specific Modules

```bash
# Test both Golang services
./test-golang-services.sh

# Test Kafka integration
./test-kafka-integration.sh

# Test all APIs
./test-apis.sh

# Verify all pages
./verify-all-pages.sh
```

---

## 8️⃣ TEST FRONTEND API CALLS

### Monitor Network Requests in Browser

1. Open http://localhost:3000/dashboard
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Refresh page
5. You should see API calls to:
   - `http://localhost:3005/api/products`
   - `http://localhost:3005/api/customers`
   - `http://localhost:3005/api/sales`
   - `http://localhost:3005/api/inventory`

### Test React Query Hooks

```bash
# Open browser console on http://localhost:3000/products
# You should see React Query DevTools icon (bottom right)
# Click it to see:
# - Active queries
# - Cache status
# - Query states (loading/success/error)
```

---

## 9️⃣ PERFORMANCE TESTING

### Load Test with Apache Bench

```bash
# Install if needed: apt-get install apache2-utils

# Test product API (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3005/api/products

# Test health endpoint
ab -n 1000 -c 50 http://localhost:3005/health
```

### Load Test with curl in loop

```bash
# Test 100 requests
for i in {1..100}; do
  curl -s http://localhost:3005/api/products > /dev/null
  echo "Request $i completed"
done
```

---

## 🔟 INTEGRATION TESTING

### Test Complete Workflow

```bash
# 1. Create Product
product_response=$(curl -s -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Workflow Test","sku":"WF-001","unit_price":100,"stock_qty":50}')

echo "✅ Product created"

# 2. Create Customer
customer_response=$(curl -s -X POST http://localhost:3005/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","phone":"1234567890"}')

echo "✅ Customer created"

# 3. Create Sale (would use product_id and customer_id from above)
echo "✅ Sale creation (manual via UI)"

# 4. Check Kafka events were produced
echo "✅ Check Kafka UI: http://localhost:8080"
```

---

## 📊 EXPECTED RESULTS

### All Services Running

```
✅ Golang v1 (8080) - Healthy
✅ Golang v2 (3005) - Healthy
✅ NestJS (3001) - Healthy
✅ Fastify (3002) - Healthy
✅ Express (3004) - Healthy
✅ Frontend (3000) - Loaded
✅ PostgreSQL (5433) - Connected
✅ Redis (6380) - Connected (optional)
✅ Kafka (9092) - Connected
```

### All Pages Loading

```
✅ 22+ pages return HTTP 200
✅ No 404 errors
✅ No 500 errors
✅ React components render
✅ Data loads from APIs
✅ Stats cards show numbers
```

### All APIs Responding

```
✅ 35+ API endpoints respond
✅ JSON data returned
✅ Proper HTTP status codes
✅ CORS headers present
✅ Error handling works
```

### Kafka Working

```
✅ Broker accessible
✅ Topics exist
✅ Producer sends messages
✅ Consumer receives messages
✅ Events triggered on API calls
```

---

## 🐛 TROUBLESHOOTING

### Service Not Running

```bash
# Check logs
tail -f logs/golang-v2.log
tail -f logs/nestjs.log

# Restart specific service
pkill -f "go run"
cd services/api-golang-v2 && PORT=3005 go run cmd/main.go
```

### API Returns Error

```bash
# Check API logs
tail -f logs/*.log | grep ERROR

# Test with verbose curl
curl -v http://localhost:3005/api/products
```

### Kafka Not Working

```bash
# Check Kafka logs
docker logs -f $(docker ps | grep kafka | awk '{print $1}')

# Restart Kafka
docker-compose restart kafka
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Test connection
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c "SELECT 1"
```

---

## ✅ TESTING CHECKLIST

Before deployment, ensure:

- [ ] All services start without errors
- [ ] All health endpoints return 200
- [ ] All 35+ API endpoints respond
- [ ] All 22+ pages load
- [ ] Data flows from database to UI
- [ ] Stats cards show real numbers
- [ ] CRUD operations work
- [ ] Kafka produces events
- [ ] Kafka consumes events
- [ ] Database queries work
- [ ] No console errors in browser
- [ ] No network errors in browser
- [ ] React Query cache works
- [ ] Loading states appear
- [ ] Error handling works

---

## 🚀 QUICK TEST COMMANDS

```bash
# One-line full test
./test-all-comprehensive.sh && echo "✅ ALL TESTS PASSED!"

# Quick health check
curl -s http://localhost:8080/health && \
curl -s http://localhost:3005/health && \
curl -s http://localhost:3001/health && \
curl -s http://localhost:3002/health && \
curl -s http://localhost:3004/health && \
echo "✅ All services healthy"

# Quick page check
for page in / /dashboard /products /pos /sales /purchases /inventory /customers /vendors; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$page)
  echo "Page $page: $status"
done
```

---

## 📚 DOCUMENTATION

- **Startup:** `🚀-START-DEVELOPMENT.md`
- **Golang Services:** `GOLANG-SERVICES-GUIDE.md`
- **All Pages:** `COMPLETE-PAGES-STATUS.md`
- **Quick Reference:** `QUICK-REFERENCE.md`

---

**Happy Testing! 🎉**
