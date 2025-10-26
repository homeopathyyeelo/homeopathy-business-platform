# HomeoERP - Quick Start Guide

## ✅ What's Been Completed

### 1. Database Setup (DONE)
- **41 tables** created and populated
- **13 categories** with homeopathy-specific data
- **62 subcategories** generated for all categories
- **177 default records** (categories, brands, potencies, forms, units, vendors, etc.)

### 2. Subcategories Generated (DONE)
All 13 main categories now have proper subcategories:
- Dilutions (7), Medicines (7), Mother Tinctures (6)
- Hair Care (5), Kits (5), Skin Care (5), Triturations (5)
- Bach Flower (4), Biochemic (4), Cosmetics (4), Oral Care (4)
- Bio Combination (3), LM Potencies (3)

### 3. Implementation Roadmap (DONE)
- **33 pharmacy features** planned across 5 phases
- Complete database schemas designed
- API endpoints documented
- Frontend pages mapped

---

## 🚀 Quick Start Commands

### Start Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait 10 seconds for database to be ready
sleep 10

# Reset and populate database
./reset-database.sh
```

### Start API Service
```bash
cd services/api-golang-v2
go run main.go
# API will start on http://localhost:3005
```

### Start Frontend
```bash
# From project root
npx next dev -p 3000
# Frontend will start on http://localhost:3000
```

---

## 📊 Verify Installation

### Check Database
```bash
# Check table count (should be 41)
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "\dt" | wc -l

# Check categories (should be 13)
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "SELECT COUNT(*) FROM categories;"

# Check subcategories (should be 62)
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "SELECT COUNT(*) FROM subcategories;"

# View subcategories by category
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "
SELECT c.name as category, COUNT(s.id) as subcategories 
FROM categories c 
LEFT JOIN subcategories s ON c.id = s.category_id 
GROUP BY c.name 
ORDER BY subcategories DESC;
"
```

### Check APIs
```bash
# Categories API (should return 13 records)
curl http://localhost:3005/api/erp/categories | jq '.data | length'

# Brands API (should return 12 records)
curl http://localhost:3005/api/erp/brands | jq '.data | length'

# Units API (should return 16 records)
curl http://localhost:3005/api/erp/units | jq '.data | length'

# Potencies API (should return 25 records)
curl http://localhost:3005/api/erp/potencies | jq '.data | length'

# Forms API (should return 22 records)
curl http://localhost:3005/api/erp/forms | jq '.data | length'
```

---

## 📁 Important Files

### Database Scripts
- `scripts/001_init_database.sql` - Core 18 tables
- `create-master-tables.sql` - Master data tables (4 tables)
- `create-additional-tables.sql` - Additional tables (7 tables)
- `INSERT-MASTER-DATA-FIXED.sql` - Master data (72 records)
- `insert-default-homeopathy-data.sql` - Business data (61 records)
- `generate-homeopathy-subcategories.sql` - Subcategories (62 records)
- `reset-database.sh` - Complete reset automation

### Documentation
- `COMPLETE-FIX-SUMMARY.md` - All fixes and database status
- `PHARMACY-FEATURES-IMPLEMENTATION-PLAN.md` - 33 features roadmap
- `SUBCATEGORIES-AND-FEATURES-SUMMARY.md` - Subcategories + features
- `QUICK-START-GUIDE.md` - This guide

---

## 🎯 Next Steps - Phase 1 Implementation

### Week 1-2 (Immediate Priority)

#### 1. Create Subcategories API Endpoint
**File:** `services/api-golang-v2/internal/handlers/subcategory_handler.go`

```go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type SubcategoryHandler struct {
    store SubcategoryStore
}

func (h *SubcategoryHandler) GetSubcategories(c *gin.Context) {
    categoryID := c.Query("category_id")
    
    subcategories, err := h.store.GetSubcategories(categoryID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"data": subcategories, "success": true})
}

func (h *SubcategoryHandler) GetSubcategoryByID(c *gin.Context) {
    id := c.Param("id")
    
    subcategory, err := h.store.GetSubcategoryByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Subcategory not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"data": subcategory, "success": true})
}
```

**Register Route in main.go:**
```go
subcategoryHandler := handlers.NewSubcategoryHandler(subcategoryStore)
api.GET("/erp/subcategories", subcategoryHandler.GetSubcategories)
api.GET("/erp/subcategories/:id", subcategoryHandler.GetSubcategoryByID)
```

#### 2. Update Product Add/Edit Pages
**File:** `app/products/add/page.tsx`

Add subcategory dropdown:
```typescript
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSubcategory, setSelectedSubcategory] = useState("");

// Fetch subcategories when category changes
const { data: subcategoriesResp } = useQuery({
  queryKey: ['subcategories', selectedCategory],
  queryFn: async () => {
    if (!selectedCategory) return { data: [] };
    const res = await golangAPI.get(`/api/erp/subcategories?category_id=${selectedCategory}`);
    return res.data;
  },
  enabled: !!selectedCategory
});

const subcategories = subcategoriesResp?.data || [];

// In the form:
<Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
  <SelectTrigger>
    <SelectValue placeholder="Select subcategory" />
  </SelectTrigger>
  <SelectContent>
    {subcategories.map((sub) => (
      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 3. Implement Expiry Tracking
**Database Migration:**
```sql
-- Add to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturing_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_alert_days INTEGER DEFAULT 90;

-- Create expiry alerts table
CREATE TABLE expiry_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    batch_id UUID,
    alert_type VARCHAR(20), -- '7D', '1M', '3M', '6M', '1Y'
    alert_date DATE,
    expiry_date DATE,
    days_to_expiry INTEGER,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expiry_alerts_product ON expiry_alerts(product_id);
CREATE INDEX idx_expiry_alerts_date ON expiry_alerts(alert_date);
CREATE INDEX idx_expiry_alerts_type ON expiry_alerts(alert_type);
```

**API Endpoint:** `GET /api/inventory/expiry/alerts`

**Frontend Page:** `app/inventory/expiry/page.tsx`

#### 4. Implement Low Stock Alerts
**Database Migration:**
```sql
CREATE TABLE low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    current_stock DECIMAL(10,2),
    min_stock_level DECIMAL(10,2),
    reorder_quantity DECIMAL(10,2),
    alert_sent BOOLEAN DEFAULT false,
    alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_low_stock_product ON low_stock_alerts(product_id);
CREATE INDEX idx_low_stock_alert_sent ON low_stock_alerts(alert_sent);
```

**API Endpoint:** `GET /api/inventory/low-stock`

**Frontend Page:** `app/inventory/low-stock/page.tsx`

#### 5. Enhance Barcode Page
**Already exists at:** `app/products/barcodes/page.tsx`

**Enhancements needed:**
- Add bulk barcode generation
- Add QR code support
- Add thermal printer templates
- Add barcode scanner integration

---

## 🔧 Development Workflow

### 1. Create Database Migration
```bash
# Create new migration file
touch scripts/002_add_expiry_tracking.sql

# Add migration SQL
# Run migration
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < scripts/002_add_expiry_tracking.sql
```

### 2. Create API Handler (Golang)
```bash
cd services/api-golang-v2

# Create handler file
touch internal/handlers/expiry_handler.go

# Create store file
touch internal/store/expiry_store.go

# Implement handler and store
# Register routes in main.go

# Test API
go run main.go
```

### 3. Create Frontend Page (Next.js)
```bash
# Create page directory
mkdir -p app/inventory/expiry

# Create page file
touch app/inventory/expiry/page.tsx

# Implement page with React Query/SWR
# Test in browser: http://localhost:3000/inventory/expiry
```

### 4. Test End-to-End
```bash
# 1. Check database
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "SELECT * FROM expiry_alerts LIMIT 5;"

# 2. Test API
curl http://localhost:3005/api/inventory/expiry/alerts

# 3. Test Frontend
# Open browser: http://localhost:3000/inventory/expiry
```

---

## 📈 Progress Tracking

### Completed ✅
- [x] Database setup (41 tables)
- [x] Master data insertion (177 records)
- [x] Subcategories generation (62 subcategories)
- [x] Implementation roadmap (33 features)
- [x] Documentation (5 comprehensive docs)

### In Progress 🔄
- [ ] Subcategories API endpoint
- [ ] Product page subcategory dropdown
- [ ] Expiry tracking implementation
- [ ] Low stock alerts implementation
- [ ] Barcode enhancements

### Pending ⚠️
- [ ] 28 remaining pharmacy features
- [ ] 19 additional database tables
- [ ] API endpoints for new features
- [ ] Frontend pages for new features

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker logs erp-postgres
```

### API Not Starting
```bash
# Check if port 3005 is free
lsof -i :3005

# Kill process if needed
kill -9 <PID>

# Check Golang version
go version  # Should be 1.21+

# Rebuild
cd services/api-golang-v2
go mod tidy
go run main.go
```

### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Start dev server
npx next dev -p 3000
```

### Subcategories Not Showing
```bash
# Verify subcategories exist
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "SELECT COUNT(*) FROM subcategories;"

# If count is 0, regenerate
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < generate-homeopathy-subcategories.sql

# Verify again
docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -c "SELECT c.name, COUNT(s.id) FROM categories c LEFT JOIN subcategories s ON c.id = s.category_id GROUP BY c.name;"
```

---

## 📞 Support

### Documentation Files
- `COMPLETE-FIX-SUMMARY.md` - Database fixes and API status
- `PHARMACY-FEATURES-IMPLEMENTATION-PLAN.md` - Detailed feature roadmap
- `SUBCATEGORIES-AND-FEATURES-SUMMARY.md` - Quick reference

### Key Commands
```bash
# Reset everything
./reset-database.sh

# Start services
docker-compose up -d
cd services/api-golang-v2 && go run main.go &
npx next dev -p 3000

# Check status
curl http://localhost:3005/api/erp/categories
curl http://localhost:3000/api/health
```

---

## ✅ Success Criteria

Your HomeoERP is ready when:
1. ✅ Database has 41 tables
2. ✅ 177 default records inserted
3. ✅ 62 subcategories generated
4. ✅ 6 APIs working (categories, brands, potencies, forms, units, products)
5. ⚠️ Subcategories API created (pending)
6. ⚠️ Product pages show subcategory dropdown (pending)
7. ⚠️ Expiry tracking working (pending)

---

**Status:** Database and subcategories complete. Ready to implement Phase 1 features.

**Last Updated:** October 26, 2025, 12:35 PM IST
