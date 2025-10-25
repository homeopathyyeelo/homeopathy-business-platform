# 📊 Master Data Insertion Guide

## Overview

This guide helps you insert comprehensive homeopathy master data into the database.

---

## 🗂️ Data Structure

### 1. Categories (10 Main + 3 Sub)

**Main Categories:**
1. Medicines
2. Cosmetics
3. Dilutions
4. Mother Tinctures
5. Biochemic
6. Triturations
7. Bio Combination
8. Bach Flower
9. Homeopathy Kits
10. Millesimal LM Potency

**Subcategories (under Cosmetics):**
- Hair Care
- Skin Care
- Oral Care

### 2. Brands (10 Manufacturers)

1. **SBL** - SBL Pvt Ltd (India)
2. **Dr. Reckeweg** - Dr. Reckeweg & Co. GmbH (Germany)
3. **Willmar Schwabe** - Willmar Schwabe India Pvt Ltd (Germany)
4. **Adel Pekana** - Adel Pekana Germany (Germany)
5. **BJain** - B Jain Publishers Pvt Ltd (India)
6. **Baksons** - Bakson Drugs & Pharmaceuticals (India)
7. **REPL** - REPL Homeopathy (India)
8. **R.S Bhargava** - R.S Bhargava Homeopathy (India)
9. **Haslab** - Haslab Homeopathy (India)
10. **Bach Flower Remedies** - Original Bach Flower (UK)

### 3. Potencies (20 Dilution Strengths)

**Decimal Potencies:**
- 3X, 6X, 12X, 30X

**Centesimal Potencies:**
- 3CH, 6CH, 12CH, 30CH, 200CH, 1000CH (1M), 10MCH (10M), 50MCH (50M), CMCH (CM)

**LM Potencies:**
- LM1, LM6, LM12, LM18, LM24, LM30

**Mother Tincture:**
- Q (Quintessence)

### 4. Forms (18 Product Types)

**Liquid Forms:**
- Dilution, Mother Tincture, Drop, Syrup, Oil, Spray

**Solid Forms:**
- Biochemic, Trituration, Bio Combination, Tablet, Globules

**External Use:**
- Ointment, Cream, Gel, Lotion

**Special Forms:**
- Bach Flower, LM Potency

**Cosmetic Forms:**
- Shampoo, Toothpaste

---

## 🚀 Quick Start

### Method 1: Run Shell Script (Recommended)

```bash
# Make script executable (if not already)
chmod +x insert-master-data.sh

# Run the script
./insert-master-data.sh
```

### Method 2: Direct SQL Execution

```bash
# Execute SQL file directly
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < INSERT-MASTER-DATA.sql
```

### Method 3: Manual psql

```bash
# Connect to database
docker exec -it erp-postgres psql -U postgres -d yeelo_homeopathy

# Copy and paste SQL from INSERT-MASTER-DATA.sql
\i INSERT-MASTER-DATA.sql
```

---

## 📋 Database Tables

### Categories Table
```sql
CREATE TABLE categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    parent_id VARCHAR(255) REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Brands Table
```sql
CREATE TABLE brands (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    country VARCHAR(100),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Potencies Table
```sql
CREATE TABLE potencies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Forms Table
```sql
CREATE TABLE forms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(64) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Verification

### Check Record Counts

```sql
-- Count all records
SELECT 'Categories (Main)' as type, COUNT(*) as count FROM categories WHERE parent_id IS NULL
UNION ALL
SELECT 'Categories (Sub)', COUNT(*) FROM categories WHERE parent_id IS NOT NULL
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;
```

**Expected Output:**
```
         type          | count
-----------------------+-------
 Categories (Main)     |    10
 Categories (Sub)      |     3
 Brands                |    10
 Potencies             |    20
 Forms                 |    18
```

### View All Data

```sql
-- View all categories
SELECT id, name, code, parent_id FROM categories ORDER BY name;

-- View all brands
SELECT id, name, code, country FROM brands ORDER BY name;

-- View all potencies
SELECT id, name, code FROM potencies ORDER BY name;

-- View all forms
SELECT id, name, code FROM forms ORDER BY name;
```

### View Category Hierarchy

```sql
-- Show categories with their parent
SELECT 
    c.name as category,
    COALESCE(p.name, 'Main Category') as parent
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY p.name NULLS FIRST, c.name;
```

---

## 🔧 Troubleshooting

### Issue: Container Not Running

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Or start all services
./START-SERVICES.sh
```

### Issue: SQL File Not Found

```bash
# Check if file exists
ls -la INSERT-MASTER-DATA.sql

# If missing, the file should be in project root
cd /var/www/homeopathy-business-platform
```

### Issue: Duplicate Key Error

The SQL uses `ON CONFLICT DO UPDATE`, so it's safe to run multiple times. It will update existing records instead of failing.

### Issue: Permission Denied

```bash
# Make script executable
chmod +x insert-master-data.sh

# Or run with bash
bash insert-master-data.sh
```

---

## 🌐 Test in Frontend

After insertion, test the data in your frontend:

### 1. Categories Page
```
http://localhost:3000/products/categories
```
Should show 10 main categories + 3 subcategories

### 2. Brands Page
```
http://localhost:3000/products/brands
```
Should show 10 brands

### 3. Potencies Page
```
http://localhost:3000/products/potencies
```
Should show 20 potencies

### 4. Forms Page
```
http://localhost:3000/products/forms
```
Should show 18 forms

### 5. Product Edit Page
```
http://localhost:3000/products/[id]/edit
```
All dropdowns should be populated with master data

---

## 📊 Data Summary

| Table | Records | Description |
|-------|---------|-------------|
| **Categories** | 13 | 10 main + 3 sub |
| **Brands** | 10 | Manufacturers |
| **Potencies** | 20 | Dilution strengths |
| **Forms** | 18 | Product types |
| **Total** | **61** | All master records |

---

## 🔄 Update Existing Data

The SQL script uses `ON CONFLICT DO UPDATE`, so you can:

1. Modify the SQL file
2. Run the script again
3. Existing records will be updated
4. New records will be inserted

---

## 🗑️ Clean Up (Optional)

If you need to start fresh:

```sql
-- Delete all master data (careful!)
DELETE FROM forms;
DELETE FROM potencies;
DELETE FROM brands;
DELETE FROM categories;

-- Reset sequences if using SERIAL
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE brands_id_seq RESTART WITH 1;
ALTER SEQUENCE potencies_id_seq RESTART WITH 1;
ALTER SEQUENCE forms_id_seq RESTART WITH 1;
```

---

## 📝 Notes

1. **IDs are string-based** (e.g., 'cat-medicines', 'brand-sbl') for better readability
2. **Codes are unique** for easy reference in reports
3. **Descriptions** provide context for each record
4. **Parent-child relationship** for categories (subcategories)
5. **Country field** for brands (useful for filtering)
6. **All records are active** by default

---

## 🎯 Next Steps

After inserting master data:

1. ✅ Verify data in frontend pages
2. ✅ Create products using these masters
3. ✅ Test product edit page dropdowns
4. ✅ Test import/export with master data
5. ✅ Create sample products for testing

---

**Status:** ✅ **READY TO INSERT**  
**Total Records:** 61  
**Tables:** 4 (Categories, Brands, Potencies, Forms)

Run `./insert-master-data.sh` to insert all data! 🚀
