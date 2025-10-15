# 📦 Database Setup Instructions

## PostgreSQL Database Setup for Yeelo Homeopathy ERP

---

## **Option 1: Using psql Command Line** (Recommended)

### **Step 1: Check PostgreSQL Service**
```bash
# Check if PostgreSQL is running on port 5433
sudo systemctl status postgresql
# OR
pg_isready -p 5433
```

### **Step 2: Find PostgreSQL User Credentials**
Your PostgreSQL database is running on port **5433**. You need to know:
- Username (usually: `postgres`, `yeelo`, or similar)
- Password

### **Step 3: Run the Schema**
```bash
cd /var/www/homeopathy-business-platform

# Method A: If you know the password
PGPASSWORD=your_password psql -h localhost -p 5433 -U postgres -d postgres -f COMPLETE-ERP-SCHEMA.sql

# Method B: Interactive password prompt
psql -h localhost -p 5433 -U postgres -d postgres -f COMPLETE-ERP-SCHEMA.sql

# Method C: Using connection string
psql "postgresql://postgres:password@localhost:5433/postgres" -f COMPLETE-ERP-SCHEMA.sql
```

### **Step 4: Verify Tables Created**
```bash
psql -h localhost -p 5433 -U postgres -d postgres -c "\dt"
```

You should see 30+ tables including:
- products, customers, suppliers, categories
- inventory, invoices, purchases
- prescriptions, marketing_contacts, etc.

---

## **Option 2: Using pgAdmin GUI**

1. **Open pgAdmin**
2. **Connect to your database:**
   - Host: localhost
   - Port: 5433
   - Database: postgres
   - Username: postgres (or your username)
   - Password: (your password)

3. **Execute Schema:**
   - Right-click on your database
   - Click "Query Tool"
   - Open file: `/var/www/homeopathy-business-platform/COMPLETE-ERP-SCHEMA.sql`
   - Click "Execute" (F5)

4. **Verify:**
   - Expand "Schemas" → "public" → "Tables"
   - You should see 30+ tables

---

## **Option 3: Using Docker PostgreSQL**

If you're using Docker for PostgreSQL:

```bash
# Copy schema into container
docker cp COMPLETE-ERP-SCHEMA.sql postgres_container:/tmp/

# Execute inside container
docker exec -it postgres_container psql -U postgres -d postgres -f /tmp/COMPLETE-ERP-SCHEMA.sql
```

---

## **Option 4: Find Your PostgreSQL Password**

If you don't know your PostgreSQL password:

### **Check .env files:**
```bash
# Search for password in env files
grep -r "POSTGRES" /var/www/homeopathy-business-platform/packages/*/
grep -r "PASSWORD" /var/www/homeopathy-business-platform/.env* 2>/dev/null
```

### **Check PostgreSQL config:**
```bash
# Check peer authentication (no password needed)
cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#"
```

### **Reset PostgreSQL password (if needed):**
```bash
sudo -u postgres psql -p 5433
ALTER USER postgres WITH PASSWORD 'new_password';
\q
```

---

## **What the Schema Creates**

### **Master Data Tables (9)**
- `categories` - Product categories
- `brands` - Product brands (SBL, Schwabe, etc.)
- `units` - Measurement units
- `tax_rates` - GST and other taxes
- `warehouses` - Storage locations
- `products` - Product master with potency
- `customers` - Customer master
- `suppliers` - Supplier/vendor master
- `users` - System users

### **Transaction Tables (10)**
- `invoices` - Sales invoices
- `invoice_items` - Invoice line items
- `purchases` - Purchase orders
- `purchase_items` - Purchase line items
- `sales_returns` - Return transactions
- `credit_notes` - Credit notes
- `prescriptions` - Patient prescriptions
- `prescription_items` - Prescription details
- `payment_transactions` - Payment records
- `stock_movements` - Inventory movements

### **Inventory Tables (2)**
- `inventory` - Batch-wise stock tracking
- `delivery_staff` - Delivery personnel

### **Marketing Tables (3)**
- `marketing_contacts` - Marketing database
- `whatsapp_templates` - Message templates
- `whatsapp_messages` - Sent messages

### **System Tables (2)**
- `app_configuration` - System settings
- `supplier_discounts` - Supplier discount schemes

---

## **After Database Setup**

### **1. Configure Environment Variables**
Create or update `.env.local`:

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DATABASE=postgres
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### **2. Test Database Connection**
```bash
psql -h localhost -p 5433 -U postgres -d postgres -c "SELECT COUNT(*) FROM products;"
```

### **3. Insert Sample Data (Optional)**
```bash
# If you have sample data from reference project
psql -h localhost -p 5433 -U postgres -d postgres -f homeopathy-erp-nexus-main/database/postgresql/master_data.sql
```

---

## **Troubleshooting**

### **Error: Connection refused**
```bash
# Check if PostgreSQL is running
sudo systemctl start postgresql

# Check if listening on port 5433
sudo netstat -tlnp | grep 5433
```

### **Error: Password authentication failed**
```bash
# Try peer authentication (as postgres user)
sudo -u postgres psql -p 5433 -d postgres -f COMPLETE-ERP-SCHEMA.sql
```

### **Error: Database doesn't exist**
```bash
# Create database first
createdb -p 5433 -U postgres yeelo_homeopathy

# Then run schema on that database
psql -p 5433 -U postgres -d yeelo_homeopathy -f COMPLETE-ERP-SCHEMA.sql
```

### **Error: Extension uuid-ossp not found**
```bash
sudo -u postgres psql -p 5433 -d postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

---

## **Verification Queries**

After setup, run these to verify:

### **Check all tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Count tables:**
```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
Expected: **30+ tables**

### **Check triggers:**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```
Expected: **20+ triggers** (for updated_at columns)

### **Check indexes:**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```
Expected: **15+ indexes**

---

## **Next Steps After Database Setup**

1. ✅ Database schema applied
2. → Install npm dependencies: `npm install`
3. → Configure `.env.local` file
4. → Start development server: `npm run dev`
5. → Access dashboard: http://localhost:3000/dashboard
6. → Test master management: http://localhost:3000/master

---

## **Quick Reference**

| Task | Command |
|------|---------|
| Apply schema | `psql -p 5433 -U postgres -d postgres -f COMPLETE-ERP-SCHEMA.sql` |
| List tables | `psql -p 5433 -U postgres -d postgres -c "\dt"` |
| Check connection | `psql -p 5433 -U postgres -d postgres -c "SELECT version();"` |
| Drop all tables | `psql -p 5433 -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` |

---

## **Support**

If you encounter any issues:
1. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
2. Verify port: `sudo lsof -i :5433`
3. Check user permissions: `psql -p 5433 -U postgres -c "\du"`

**Database setup is crucial - everything else depends on it!**
