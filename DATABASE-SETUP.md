# Database Setup Guide

## ✅ Consolidated Database Schema

All database tables have been consolidated into a single master schema file.

### Structure

```
database/
├── MASTER_SCHEMA.sql       ✅ Single source of truth (ALL tables)
└── init-database.sh        ✅ Initialization script
```

## What's Included

The `MASTER_SCHEMA.sql` contains:

### 1. Authentication & Authorization
- `users` - User accounts
- `sessions` - Active sessions (JWT)
- `roles` - User roles
- `permissions` - Granular permissions
- `role_permissions` - Role-permission mapping
- `user_roles` - User-role mapping
- `user_permissions` - User permission overrides

### 2. Product Catalog
- `categories` - Product categories
- `subcategories` - Product subcategories
- `brands` - Product brands
- `units` - Units of measure
- `products` - Main product catalog
- `inventory_batches` - Batch tracking with expiry

### 3. Customers & Vendors
- `customers` - Customer database
- `vendors` - Supplier/vendor database

### 4. Sales
- `sales_invoices` - Sales invoices
- `sales_invoice_items` - Invoice line items
- `online_orders` - E-commerce orders

### 5. Purchases
- `purchase_orders` - Purchase orders
- `purchase_order_items` - PO line items

### 6. Payments
- `payments` - Payment transactions

### 7. Notifications & Events
- `notifications` - User notifications
- `outbox_events` - Event sourcing pattern

### 8. HR & Employee
- `employees` - Employee records

### 9. Settings
- `company_settings` - Company configuration
- `app_settings` - Application settings (key-value)

## Default Data

The schema includes:

### Default Admin User
```
Email: medicine@yeelohomeopathy.com
Password: XXghosh@147
Role: Super Administrator
```

### Default Roles
- **admin** - Full access
- **manager** - Limited access
- **user** - Regular user

### Default Units
- Piece, Box, Bottle
- Kilogram, Gram
- Liter, Milliliter

## How to Initialize

### Option 1: Using Docker Compose
```bash
# Database initializes automatically on first run
docker-compose up -d
```

### Option 2: Manual Initialization
```bash
# Run the init script
./database/init-database.sh

# Or manually with psql
psql "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy" \
  < database/MASTER_SCHEMA.sql
```

### Option 3: From Application
The Go backend will verify schema on startup.

## Removed Files

### ❌ Deleted (Duplicates & Unnecessary)

**47 SQL files reduced to 1 master file!**

Removed folders:
- `db/migrations/` - Old migrations
- `db/ddl/` - Duplicate DDL
- `db/init/` - Old init scripts
- `packages/shared-db/migrations/` - Duplicate migrations
- `schema-contracts/sql/` - Duplicate contracts
- `migrations/` - Old root migrations
- `services/api-golang-master/database/migrations/` - Service-specific (no longer needed)

Removed individual migrations (consolidated):
- `001_auth_rbac_schema.sql`
- `002_invoice_parser_tables.sql`
- `003_sales_tables.sql`
- `004_complete_invoice_system.sql`
- `005_automated_bug_tracking.sql`
- `006_expiry_dashboard.sql`
- `007_ai_self_healing_system.sql`
- `008_cron_and_monitoring.sql`
- `009_purchase_ingestion.sql`
- `011_upload_approval_system.sql`
- `012_auth_refactor.sql`
- `create_all_missing_tables.sql`
- ... and 35 more duplicate files

## Schema Maintenance

### Adding New Tables
Edit `database/MASTER_SCHEMA.sql` and add:

```sql
-- ============================================================================
-- NEW FEATURE NAME
-- ============================================================================

CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Re-initializing Database
```bash
# Drop and recreate (WARNING: destroys all data)
psql "postgresql://postgres:postgres@localhost:5433/postgres" \
  -c "DROP DATABASE IF EXISTS yeelo_homeopathy;"

psql "postgresql://postgres:postgres@localhost:5433/postgres" \
  -c "CREATE DATABASE yeelo_homeopathy;"

# Run master schema
psql "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy" \
  < database/MASTER_SCHEMA.sql
```

## Benefits of Consolidation

✅ **Single Source of Truth** - One file to maintain
✅ **No Version Conflicts** - No migration ordering issues
✅ **Faster Setup** - One command initializes everything
✅ **Easy to Understand** - All tables in one place
✅ **No Duplicates** - Eliminated 46 redundant files
✅ **Idempotent** - Can run multiple times safely (IF NOT EXISTS)
✅ **Complete** - All tables for all 63 handlers

## Table Count

Total tables in schema: **25+ core tables**

All tables support the 63 handlers in `api-golang-master`:
- Authentication (auth.go)
- Products (product_handler.go)
- Inventory (inventory_handler.go)
- Sales (sales_handler.go)
- Purchases (purchase_enhanced_handler.go)
- Customers (customer_handler.go)
- Orders (order_handler.go)
- Payments (payment_handler.go)
- Finance (finance_handler.go)
- HR (employee_handler.go)
- Notifications (notification_handler.go)
- ... and 52 more handlers

## Database Connection

### From Backend (Go)
```go
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
```

### From Docker
```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: yeelo_homeopathy
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
  
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy
```

### Test Connection
```bash
psql "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy" \
  -c "\dt"
```

## Scripts Cleanup

### ❌ Removed (30+ scripts)
All unnecessary scripts removed from `/scripts/`:
- Build scripts (moved to Docker)
- Deploy scripts (using Docker Compose)
- Testing scripts (obsolete)
- Page generation scripts (frontend complete)
- Migration scripts (consolidated)

### ✅ Kept (Essential only)
- `database/init-database.sh` - Database initialization
- `START.sh` - Application startup
- `001_init_database.sql` - Legacy reference
- `002_seed_data.sql` - Additional seed data

---

**Status**: ✅ Database schema consolidated  
**Files**: 47 SQL files → 1 master file  
**Scripts**: 30+ scripts → 2 essential scripts  
**Maintenance**: Easy single-file updates
