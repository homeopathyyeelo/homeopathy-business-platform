# Inventory System - Current vs Proposed Analysis

## 🔍 Current Implementation Status

### Database Schema (BASIC - Needs Enhancement)

#### Existing: `inventory` table
```sql
Column          | Type        | Description
----------------|-------------|------------------
id              | integer     | Primary key
product_id      | integer     | Product reference
shop_id         | integer     | Shop/branch
stock_qty       | integer     | Current quantity
reorder_point   | integer     | Low stock threshold
last_restocked  | timestamp   | Last restock date
created_at      | timestamp   | Created
updated_at      | timestamp   | Updated
```

**❌ CRITICAL MISSING FEATURES:**
- ❌ No batch tracking
- ❌ No expiry dates
- ❌ No manufacturing dates
- ❌ No purchase rate/MRP per batch
- ❌ No transaction history (qty_in/qty_out)
- ❌ No source tracking (purchase vs manual)
- ❌ No approval workflow
- ❌ No warehouse/rack location
- ❌ No FIFO/LIFO support

### Frontend Pages (15 pages exist)
✅ `/inventory/stock` - Basic list  
✅ `/inventory/adjustments` - Exists  
✅ `/inventory/batches` - Exists  
✅ `/inventory/expiry` - Exists  
✅ `/inventory/low-stock` - Exists  
✅ `/inventory/direct-entry` - Exists (Manual entry)  
✅ `/inventory/history` - Exists  
✅ `/inventory/damage` - Exists  
✅ `/inventory/dead-stock` - Exists  
✅ `/inventory/transfers` - Exists  
✅ `/inventory/valuation` - Exists  
✅ `/inventory/reconciliation` - Exists  
✅ `/inventory/bulk-update` - Exists  
✅ `/inventory/combo` - Exists  

**Status:** Pages exist but need proper backend integration

---

## 🎯 Proposed Enhanced System (Your Requirements)

### Required New Tables (4 core + 1 optional)

#### 1. `purchase_orders` (NEW - Critical)
```sql
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES vendors(id),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending, approved, rejected
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(invoice_date);
```

#### 2. `purchase_items` (NEW - Critical)
```sql
CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    batch_no VARCHAR(100) NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL, -- Purchase rate
    mrp DECIMAL(10,2) NOT NULL, -- Maximum Retail Price
    mfg_date DATE,
    exp_date DATE,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    amount DECIMAL(12,2), -- qty * rate
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);
CREATE INDEX idx_purchase_items_batch ON purchase_items(batch_no);
```

#### 3. `inventory_stock` (ENHANCED - Replace existing)
```sql
-- Drop old inventory table and create new enhanced one
DROP TABLE IF EXISTS inventory CASCADE;

CREATE TABLE inventory_stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_no VARCHAR(100) NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id), -- Storage location
    qty_in DECIMAL(10,2) DEFAULT 0, -- Total quantity received
    qty_out DECIMAL(10,2) DEFAULT 0, -- Total quantity sold/used
    balance DECIMAL(10,2) DEFAULT 0, -- Current balance (qty_in - qty_out)
    purchase_rate DECIMAL(10,2), -- Purchase cost per unit
    mrp DECIMAL(10,2), -- Selling price
    mfg_date DATE,
    exp_date DATE,
    last_txn_type VARCHAR(50), -- IN, OUT, ADJ
    last_txn_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, expired, damaged
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, batch_no, warehouse_id)
);

CREATE INDEX idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX idx_inventory_stock_batch ON inventory_stock(batch_no);
CREATE INDEX idx_inventory_stock_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX idx_inventory_stock_exp_date ON inventory_stock(exp_date);
CREATE INDEX idx_inventory_stock_balance ON inventory_stock(balance);
```

#### 4. `stock_transactions` (NEW - Complete Audit Trail)
```sql
CREATE TABLE stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    batch_no VARCHAR(100),
    warehouse_id INTEGER REFERENCES warehouses(id),
    type VARCHAR(50) NOT NULL, -- IN, OUT, ADJ (Adjustment)
    qty DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    source VARCHAR(50) NOT NULL, -- purchase, manual, sale, return, adjustment, transfer, damage
    ref_id INTEGER, -- Reference to purchase_id, sale_id, etc.
    ref_type VARCHAR(50), -- purchase_order, sale_order, manual_entry, etc.
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_txn_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_txn_batch ON stock_transactions(batch_no);
CREATE INDEX idx_stock_txn_type ON stock_transactions(type);
CREATE INDEX idx_stock_txn_source ON stock_transactions(source);
CREATE INDEX idx_stock_txn_date ON stock_transactions(created_at);
CREATE INDEX idx_stock_txn_ref ON stock_transactions(ref_id, ref_type);
```

#### 5. `stock_adjustments` (OPTIONAL - For approval workflow)
```sql
CREATE TABLE stock_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    batch_no VARCHAR(100),
    warehouse_id INTEGER REFERENCES warehouses(id),
    adjustment_type VARCHAR(50), -- opening_stock, manual_bill, correction, damage, theft, return
    quantity_before DECIMAL(10,2),
    quantity_adjusted DECIMAL(10,2),
    quantity_after DECIMAL(10,2),
    reason TEXT,
    adjusted_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

CREATE INDEX idx_stock_adj_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adj_status ON stock_adjustments(status);
CREATE INDEX idx_stock_adj_type ON stock_adjustments(adjustment_type);
```

---

## 📋 Implementation Comparison

### Current System (Basic)
```
User → Add Product → Update stock_qty in inventory table
❌ No batch tracking
❌ No history
❌ No approval
❌ No source tracking
```

### Proposed System (Professional)
```
🧾 Purchase Flow:
User → Upload Excel → purchase_orders (pending) → Admin Approves → 
inventory_stock updated → stock_transactions logged

🧍‍♂️ Manual Flow:
User → /inventory/stock/add → inventory_stock updated → 
stock_transactions logged → Optional approval

📊 Reporting:
Query inventory_stock for current balance
Query stock_transactions for complete history
Filter by batch, expiry, warehouse, source
```

---

## 🔄 Proposed Workflows

### A. Purchase Upload Workflow
```
1. User uploads purchase Excel/CSV
   Route: /purchases/upload
   
2. System creates:
   - purchase_orders (status = 'pending')
   - purchase_items (all line items)
   
3. Admin reviews:
   Route: /purchases/pending
   Shows: Supplier, Invoice, Items, Total
   
4. Admin approves:
   - Updates purchase_orders.status = 'approved'
   - For each purchase_item:
     * Insert/Update inventory_stock
     * Create stock_transactions (type=IN, source=purchase)
   
5. Stock is now available for sale
```

### B. Manual Stock Entry Workflow
```
1. User goes to /inventory/stock/add

2. Fills form:
   - Product (dropdown with search)
   - Batch No (auto-generate or manual)
   - Mfg Date / Exp Date
   - Quantity
   - Purchase Rate / MRP
   - Warehouse/Rack
   - Reason (Opening Stock, Free Sample, Return, Adjustment)

3. On save:
   - Insert/Update inventory_stock
   - Create stock_transactions (type=IN, source=manual)
   - Optional: Create stock_adjustments (if approval needed)

4. Stock immediately available (or pending approval)
```

### C. Sale/Deduction Workflow
```
1. POS/Sale creates order

2. For each item:
   - Find inventory_stock (FIFO: oldest expiry first)
   - Update: qty_out += sold_qty, balance -= sold_qty
   - Create stock_transactions (type=OUT, source=sale)

3. If balance < reorder_point:
   - Trigger low stock alert
```

---

## 🖥️ Frontend Pages Enhancement

### 1. `/inventory/stock` (Enhanced)
**Current:** Basic list  
**Proposed:** Comprehensive stock management

**Columns:**
- Product Name + Image
- Batch No
- Qty In | Qty Out | Balance
- MRP | Purchase Rate | Margin %
- Mfg Date | Exp Date (color-coded)
- Warehouse/Rack
- Source (Purchase/Manual)
- Last Updated
- Actions (View History, Adjust, Transfer)

**Filters:**
- Product search
- Batch search
- Expiry status (Fresh, Expiring Soon, Expired)
- Warehouse
- Source
- Date range

**Action Buttons:**
- ➕ Add Manual Stock
- 📤 Upload Purchase File
- 🔄 Approve Pending Purchases
- 📊 Stock Report
- 📥 Export Excel

### 2. `/inventory/stock/add` (NEW - Manual Entry)
**Form Fields:**
```
Product*         [Dropdown with search]
Batch No*        [Text] [Auto-Generate Button]
Mfg Date         [Date Picker]
Exp Date*        [Date Picker]
Quantity*        [Number] [Unit Display]
Purchase Rate*   [Currency]
MRP*             [Currency] [Auto-calculate margin]
Warehouse*       [Dropdown]
Rack/Location    [Dropdown - filtered by warehouse]
Reason*          [Select: Opening Stock, Free Sample, Return, Adjustment]
Notes            [Textarea]

[Calculate Margin: (MRP - Rate) / Rate * 100]

Buttons: [Save] [Save & Add Another] [Cancel]
```

### 3. `/purchases/upload` (NEW)
**Upload Form:**
```
Supplier*        [Dropdown]
Invoice No*      [Text]
Invoice Date*    [Date]
Upload File*     [Excel/CSV]

[Download Template]

After upload:
- Show preview table
- Validate products exist
- Check batch duplicates
- Show errors inline
- [Submit for Approval] [Cancel]
```

### 4. `/purchases/pending` (NEW - Approval Dashboard)
**List View:**
```
Columns:
- Invoice No
- Supplier
- Date
- Total Amount
- Items Count
- Uploaded By
- Status
- Actions

Actions per row:
- [View Details]
- [Approve]
- [Reject]
- [Edit]

Bulk Actions:
- [Approve Selected]
- [Reject Selected]
```

---

## 🔧 Go API Endpoints (Required)

### Inventory APIs
```go
// Stock Management
GET    /api/inventory/stock              // List all stock
GET    /api/inventory/stock/:id          // Get stock details
POST   /api/inventory/stock              // Add manual stock
PUT    /api/inventory/stock/:id          // Update stock
DELETE /api/inventory/stock/:id          // Remove stock

// Transactions
GET    /api/inventory/transactions       // Transaction history
GET    /api/inventory/transactions/:id   // Transaction details

// Reports
GET    /api/inventory/stock/summary      // Stock summary
GET    /api/inventory/stock/expiring     // Expiring items
GET    /api/inventory/stock/low          // Low stock items
GET    /api/inventory/stock/valuation    // Stock valuation
```

### Purchase APIs
```go
// Purchase Orders
GET    /api/purchases                    // List purchases
GET    /api/purchases/:id                // Get purchase
POST   /api/purchases/upload             // Upload Excel
PUT    /api/purchases/:id/approve        // Approve purchase
PUT    /api/purchases/:id/reject         // Reject purchase
DELETE /api/purchases/:id                // Delete purchase

// Purchase Items
GET    /api/purchases/:id/items          // Get items
POST   /api/purchases/:id/items          // Add item
PUT    /api/purchases/:id/items/:itemId  // Update item
DELETE /api/purchases/:id/items/:itemId  // Delete item
```

---

## 📊 Stock Calculation Logic

### Real-time Balance Query
```go
func GetStockBalance(productID int, batchNo string) (float64, error) {
    var result struct {
        Balance float64
    }
    
    err := db.Raw(`
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'IN' THEN qty ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN qty ELSE 0 END), 0) as balance
        FROM stock_transactions
        WHERE product_id = ? AND batch_no = ?
    `, productID, batchNo).Scan(&result).Error
    
    return result.Balance, err
}
```

### Or use pre-calculated balance
```go
func GetStockList(c *gin.Context) {
    var stocks []InventoryStock
    
    query := db.Table("inventory_stock").
        Select(`
            inventory_stock.*,
            products.name as product_name,
            warehouses.name as warehouse_name,
            CASE 
                WHEN exp_date < CURRENT_DATE THEN 'expired'
                WHEN exp_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
                ELSE 'fresh'
            END as expiry_status
        `).
        Joins("LEFT JOIN products ON products.id = inventory_stock.product_id").
        Joins("LEFT JOIN warehouses ON warehouses.id = inventory_stock.warehouse_id").
        Where("balance > 0").
        Order("exp_date ASC")
    
    query.Find(&stocks)
    
    c.JSON(200, gin.H{
        "success": true,
        "data": stocks,
    })
}
```

---

## ✅ Implementation Priority

### Phase 1 (Week 1) - Critical Foundation
1. ✅ Create 4 new tables (purchase_orders, purchase_items, inventory_stock, stock_transactions)
2. ✅ Migrate existing inventory data
3. ✅ Create manual stock entry API
4. ✅ Create manual stock entry page

### Phase 2 (Week 2) - Purchase Integration
5. ✅ Create purchase upload API
6. ✅ Create purchase upload page
7. ✅ Create approval workflow API
8. ✅ Create approval dashboard page

### Phase 3 (Week 3) - Reporting & Alerts
9. ✅ Stock summary reports
10. ✅ Expiry alerts
11. ✅ Low stock alerts
12. ✅ Transaction history

### Phase 4 (Week 4) - Advanced Features
13. ✅ FIFO/LIFO implementation
14. ✅ Multi-warehouse support
15. ✅ Stock valuation
16. ✅ Batch transfers

---

## 🚨 Critical Issues with Current System

### 1. No Batch Tracking
**Problem:** Can't track which batch was sold  
**Impact:** Can't handle expiry, can't do FIFO  
**Solution:** Add batch_no to inventory_stock

### 2. No Transaction History
**Problem:** Can't audit stock movements  
**Impact:** No accountability, can't trace errors  
**Solution:** Add stock_transactions table

### 3. No Purchase Integration
**Problem:** Manual entry only  
**Impact:** Time-consuming, error-prone  
**Solution:** Add purchase_orders workflow

### 4. No Approval Workflow
**Problem:** Anyone can change stock  
**Impact:** Security risk, no control  
**Solution:** Add approval status

### 5. Single Stock Quantity
**Problem:** No qty_in/qty_out tracking  
**Impact:** Can't calculate COGS, valuation  
**Solution:** Track IN/OUT separately

---

## 📈 Benefits of Proposed System

### Business Benefits
✅ **Accurate Stock:** Batch-wise tracking prevents errors  
✅ **Expiry Management:** Automatic alerts, FIFO selling  
✅ **Cost Control:** Track purchase rates, calculate margins  
✅ **Audit Trail:** Complete history of all movements  
✅ **Multi-location:** Manage stock across warehouses  
✅ **Compliance:** GST-ready with proper documentation  

### Technical Benefits
✅ **Scalable:** Handles millions of transactions  
✅ **Fast:** Indexed queries, pre-calculated balances  
✅ **Reliable:** ACID transactions, data integrity  
✅ **Flexible:** Easy to add new features  
✅ **Maintainable:** Clean separation of concerns  

---

## 🎯 Recommendation

### IMPLEMENT THE PROPOSED SYSTEM ✅

**Reasons:**
1. Current system is too basic for pharmacy business
2. Missing critical features (batch, expiry, history)
3. Frontend pages already exist (just need backend)
4. Your proposed design is industry-standard
5. Will save time and prevent errors long-term

### Next Steps:
1. **Create database migration script** (all 4 tables)
2. **Migrate existing data** (inventory → inventory_stock)
3. **Implement manual entry API** (quick win)
4. **Build manual entry page** (use existing /inventory/direct-entry)
5. **Implement purchase workflow** (bigger feature)

---

## 📄 Files to Create

1. `create-enhanced-inventory-tables.sql` - Database migration
2. `migrate-existing-inventory-data.sql` - Data migration
3. `services/api-golang-v2/internal/handlers/inventory_stock_handler.go` - Stock APIs
4. `services/api-golang-v2/internal/handlers/purchase_handler.go` - Purchase APIs
5. `app/inventory/stock/add/page.tsx` - Manual entry form
6. `app/purchases/upload/page.tsx` - Purchase upload
7. `app/purchases/pending/page.tsx` - Approval dashboard

---

**Status:** Current system is BASIC. Proposed system is PROFESSIONAL and REQUIRED for pharmacy business.

**Recommendation:** Implement the proposed enhanced inventory system ASAP.

Would you like me to start creating the database migration and APIs?
