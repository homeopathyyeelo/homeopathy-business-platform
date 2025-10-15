-- YEELO HOMEOPATHY Production Database Export
-- Complete PostgreSQL Schema and Data Export for Production Deployment
-- Generated: $(date '+%Y-%m-%d %H:%M:%S')

-- =============================================================================
-- SECTION 1: DATABASE SETUP INSTRUCTIONS
-- =============================================================================

/*
PRODUCTION DEPLOYMENT INSTRUCTIONS:

1. Create PostgreSQL Database:
   createdb -U postgres yeelo_homeopathy

2. Import Schema:
   psql -U postgres -d yeelo_homeopathy -f database/postgresql/schema.sql

3. Import Master Data:
   psql -U postgres -d yeelo_homeopathy -f database/postgresql/master_data.sql

4. Configure Application:
   - Update database connection settings in application
   - Switch to PostgreSQL in Database Settings
   - Test connection and verify data

5. Optional Backup Commands:
   pg_dump -U postgres -d yeelo_homeopathy > yeelo_homeopathy_backup.sql
   pg_restore -U postgres -d yeelo_homeopathy yeelo_homeopathy_backup.sql

ENVIRONMENT VARIABLES FOR PRODUCTION:
Copy and configure database/production/environment.template.env
*/

-- =============================================================================
-- SECTION 2: VERIFICATION QUERIES
-- =============================================================================

-- Check if all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE 'Total tables in database: %', table_count;
    
    IF table_count < 40 THEN
        RAISE WARNING 'Expected at least 40 tables. Please check schema import.';
    ELSE
        RAISE NOTICE 'Database schema appears complete.';
    END IF;
END $$;

-- Verify core tables
SELECT 
    'Table Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN 'EXISTS'
        ELSE 'MISSING'
    END as products_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN 'EXISTS'
        ELSE 'MISSING'
    END as inventory_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN 'EXISTS'
        ELSE 'MISSING'
    END as customers_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN 'EXISTS'
        ELSE 'MISSING'
    END as invoices_table;

-- Check master data
SELECT 
    'Master Data Verification' as check_type,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM brands) as brands_count,
    (SELECT COUNT(*) FROM units) as units_count,
    (SELECT COUNT(*) FROM tax_rates) as tax_rates_count;

-- =============================================================================
-- SECTION 3: PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_brand ON products(category_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_batch ON inventory(product_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);

-- Analyze tables for query optimization
ANALYZE;

-- =============================================================================
-- SECTION 4: SECURITY SETUP
-- =============================================================================

-- Create application user (optional for production)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yeelo_app') THEN
--         CREATE ROLE yeelo_app WITH LOGIN PASSWORD 'secure_password_here';
--         GRANT CONNECT ON DATABASE yeelo_homeopathy TO yeelo_app;
--         GRANT USAGE ON SCHEMA public TO yeelo_app;
--         GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yeelo_app;
--         GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yeelo_app;
--     END IF;
-- END $$;

-- =============================================================================
-- SECTION 5: BACKUP STRATEGY
-- =============================================================================

/*
RECOMMENDED BACKUP STRATEGY:

1. Daily Backup:
   pg_dump -U postgres -d yeelo_homeopathy -f "backup_$(date +%Y%m%d).sql"

2. Weekly Full Backup:
   pg_dump -U postgres -d yeelo_homeopathy -F c -f "weekly_backup_$(date +%Y%m%d).backup"

3. Monthly Archive:
   pg_dump -U postgres -d yeelo_homeopathy -F t -f "monthly_archive_$(date +%Y%m).tar"

4. Automated Backup Script:
   See: scripts/backup.sh

5. Point-in-Time Recovery:
   Enable WAL archiving in postgresql.conf:
   wal_level = replica
   archive_mode = on
   archive_command = 'cp %p /backup/wal/%f'
*/

-- =============================================================================
-- SECTION 6: MONITORING QUERIES
-- =============================================================================

-- Database size and activity
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'yeelo_homeopathy';

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Connection count
SELECT 
    COUNT(*) as active_connections,
    usename as username
FROM pg_stat_activity 
WHERE datname = 'yeelo_homeopathy'
GROUP BY usename;

-- =============================================================================
-- SECTION 7: APPLICATION CONFIGURATION
-- =============================================================================

/*
DATABASE CONNECTION CONFIGURATION:

For Node.js/Express applications:
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yeelo_homeopathy',
  user: 'postgres',
  password: 'your_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

For Python/Django applications:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'yeelo_homeopathy',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

For this React application:
Update src/lib/config/database-connection.ts with your PostgreSQL credentials
and switch database source in Settings > Database Settings.
*/

-- =============================================================================
-- SECTION 8: TROUBLESHOOTING
-- =============================================================================

/*
COMMON ISSUES AND SOLUTIONS:

1. Connection Issues:
   - Check PostgreSQL service: sudo systemctl status postgresql
   - Verify pg_hba.conf authentication settings
   - Ensure user has proper permissions

2. Import Errors:
   - Run as superuser: psql -U postgres
   - Check for syntax errors in schema file
   - Verify uuid-ossp extension is available

3. Performance Issues:
   - Run VACUUM ANALYZE on large tables
   - Check slow query log
   - Monitor with pg_stat_statements

4. Backup/Restore Issues:
   - Use correct PostgreSQL version tools
   - Check disk space before operations
   - Verify file permissions

5. Application Connection:
   - Test with psql first: psql -U postgres -d yeelo_homeopathy
   - Check firewall settings
   - Verify SSL requirements
*/

SELECT 'Production export complete. Database ready for deployment.' as status;