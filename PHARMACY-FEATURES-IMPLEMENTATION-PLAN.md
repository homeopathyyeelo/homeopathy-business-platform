# HomeoERP - Complete Pharmacy/Medical Shop Features Implementation Plan

## ✅ COMPLETED: Subcategories Generation

**Status:** 62 subcategories generated for all 13 main categories

### Subcategory Breakdown by Category:

1. **Dilutions (7 subcategories)**
   - Single Remedies, Combination Remedies, Constitutional Remedies
   - Acute Remedies, Chronic Remedies, Nosodes, Sarcodes

2. **Mother Tinctures (6 subcategories)**
   - Herbal, Mineral, Animal Tinctures
   - Digestive, Respiratory, Skin Tinctures

3. **Biochemic (4 subcategories)**
   - 12 Tissue Salts, Single Biochemic, Biochemic Tablets, Biochemic Powder

4. **Bio Combinations (3 subcategories)**
   - BC 1-14, BC 15-28, Special Combinations

5. **Triturations (5 subcategories)**
   - Mineral, Metal, Herbal, 3X, 6X Triturations

6. **Medicines (7 subcategories)**
   - Syrups, Tablets, Drops, Ointments, Gels, Oils, Sprays

7. **Bach Flower (4 subcategories)**
   - Original 38 Remedies, Rescue Remedy, Mood Remedies, Stress Remedies

8. **Homeopathy Kits (5 subcategories)**
   - Family Kits, Travel Kits, First Aid Kits, Doctor Kits, Specialty Kits

9. **LM Potencies (3 subcategories)**
   - LM 0/1-0/6, LM 0/7-0/15, LM 0/16-0/30

10. **Cosmetics (4 subcategories)**
    - Face Care, Body Care, Anti-Aging, Acne Care

11. **Hair Care (5 subcategories)**
    - Hair Oils, Shampoos, Hair Loss Treatment, Conditioners, Hair Tonics

12. **Skin Care (5 subcategories)**
    - Skin Creams, Skin Ointments, Eczema Care, Psoriasis Care, Wound Care

13. **Oral Care (4 subcategories)**
    - Toothpastes, Mouthwash, Tooth Powders, Gum Care

---

## 🏥 CORE PHARMACY FEATURES - Implementation Roadmap

### Phase 1: Inventory & Stock Management (Priority: HIGH)

#### 1.1 Expiry & Manufacturing Tracking
**Status:** 🔄 IN PROGRESS

**Database Schema:**
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
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /api/inventory/expiry/alerts` - Get expiry alerts
- `GET /api/inventory/expiry/report?days=30` - Expiry report
- `POST /api/inventory/expiry/notify` - Send expiry notifications

**Frontend Page:** `/inventory/expiry`
- Dashboard with expiry timeline (7D, 1M, 3M, 6M, 1Y)
- Color-coded alerts (red, orange, yellow)
- Export to Excel/PDF
- WhatsApp notification integration

---

#### 1.2 Inventory Control
**Status:** ⚠️ PENDING

**Features:**
- Opening stock entry
- Stock adjustments (damage, theft, correction)
- Low stock alerts (configurable threshold)
- Stock transfer between branches
- Batch-wise tracking

**Database Schema:**
```sql
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    batch_id UUID,
    adjustment_type VARCHAR(50), -- 'opening', 'damage', 'theft', 'correction', 'transfer'
    quantity_before DECIMAL(10,2),
    quantity_adjusted DECIMAL(10,2),
    quantity_after DECIMAL(10,2),
    reason TEXT,
    adjusted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    current_stock DECIMAL(10,2),
    min_stock_level DECIMAL(10,2),
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `POST /api/inventory/opening-stock` - Add opening stock
- `POST /api/inventory/adjust` - Stock adjustment
- `GET /api/inventory/low-stock` - Low stock report
- `POST /api/inventory/transfer` - Transfer stock

**Frontend Pages:**
- `/inventory/adjust` - Stock adjustment form
- `/inventory/stock` - Current stock view
- `/inventory/low-stock` - Low stock alerts

---

#### 1.3 Barcode Management
**Status:** ✅ PARTIALLY DONE (Page exists, needs enhancement)

**Enhancements Needed:**
- Auto barcode generation for new products
- Bulk barcode generation
- QR code support
- Barcode scanner integration
- Print label templates (A4, thermal)

**API Endpoints:**
- `POST /api/inventory/barcode/generate` - Generate barcodes
- `POST /api/inventory/barcode/bulk-generate` - Bulk generation
- `GET /api/inventory/barcode/print/:id` - Print barcode
- `POST /api/inventory/barcode/scan` - Scan barcode lookup

**Frontend:** `/inventory/barcode` (Already exists, needs enhancement)

---

#### 1.4 Supplier Management
**Status:** ✅ TABLE EXISTS (vendors table with 7 records)

**Features to Add:**
- Vendor performance rating
- Payment tracking
- Purchase order history
- Vendor-wise product mapping
- Credit terms management

**Database Schema:**
```sql
-- Vendor payments table
CREATE TABLE vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id),
    payment_date DATE,
    amount DECIMAL(12,2),
    payment_mode VARCHAR(50), -- 'cash', 'cheque', 'upi', 'neft'
    reference_no VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor ratings
CREATE TABLE vendor_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    quality_rating INTEGER,
    delivery_rating INTEGER,
    pricing_rating INTEGER,
    comments TEXT,
    rated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /api/purchases/vendors` - List vendors
- `POST /api/purchases/vendors` - Add vendor
- `PUT /api/purchases/vendors/:id` - Update vendor
- `POST /api/finance/suppliers/pay` - Record payment
- `GET /api/purchases/vendors/:id/performance` - Vendor performance

**Frontend Pages:**
- `/purchases/vendors` - Vendor list
- `/purchases/vendors/add` - Add vendor
- `/finance/suppliers/pay` - Payment entry

---

#### 1.5 Bulk Editing
**Status:** ⚠️ PENDING

**Features:**
- Mass update products (price, MRP, discount)
- Bulk customer updates
- Bulk supplier updates
- Import/Export via Excel

**API Endpoints:**
- `POST /api/inventory/bulk-update` - Bulk product update
- `POST /api/crm/bulk-edit` - Bulk customer update
- `POST /api/purchases/vendors/bulk-update` - Bulk vendor update

**Frontend:** `/inventory/bulk-update`

---

#### 1.6 Product Categorization
**Status:** ✅ DONE (13 categories, 62 subcategories)

**Enhancements:**
- Filter by category, brand, potency, form
- Category-wise reports
- Best sellers by category

---

#### 1.7 Multiple Units & Conversions
**Status:** ✅ TABLE EXISTS (16 units)

**Features to Add:**
- Unit conversion logic
- Alternate unit pricing
- Purchase in one unit, sell in another

**Database Schema:**
```sql
CREATE TABLE product_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    unit_id UUID REFERENCES units(id),
    conversion_factor DECIMAL(10,4), -- How many base units = 1 of this unit
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    mrp DECIMAL(10,2),
    is_base_unit BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** `/inventory/unit-setup`

---

#### 1.8 Fast Search (Medicine Finder)
**Status:** ⚠️ NEEDS ENHANCEMENT

**Features:**
- Search by name, brand, potency, composition
- Fuzzy search
- Voice search
- Barcode scan search
- Recently searched items

**API Endpoint:**
- `GET /api/inventory/search?q=arnica&brand=sbl&potency=30c`

**Frontend:** `/inventory/search` (Global search component)

---

### Phase 2: POS & Billing Features (Priority: HIGH)

#### 2.1 Multi-PC Sharing
**Status:** ⚠️ PENDING

**Architecture:**
- Real-time sync via WebSocket
- Redis pub/sub for multi-counter
- Conflict resolution

**Database Schema:**
```sql
CREATE TABLE pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counter_id VARCHAR(50),
    user_id UUID REFERENCES users(id),
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Service:** `sync-service` (WebSocket server)
**Frontend:** `/system/multi-pc`

---

#### 2.2 POS Billing
**Status:** ✅ PAGE EXISTS (needs enhancement)

**Features:**
- Quick scan & add
- Product lookup
- Discount logic (customer group-based)
- Multiple payment modes
- Split payment
- Return/exchange

**Frontend:** `/sales/pos`

---

#### 2.3 Bill Customization
**Status:** ⚠️ PENDING

**Features:**
- Multiple templates (A4, A5, thermal)
- Logo upload
- Custom header/footer
- GST invoice format
- Multi-language support

**Database Schema:**
```sql
CREATE TABLE bill_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    template_type VARCHAR(50), -- 'a4', 'a5', 'thermal'
    template_html TEXT,
    logo_url VARCHAR(255),
    header_text TEXT,
    footer_text TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** `/sales/bill-template`

---

#### 2.4 Hold / Resume Bills
**Status:** ✅ TABLE EXISTS (pos_held_bills)

**Features:**
- Hold current bill
- Resume later
- Multiple held bills per counter
- Auto-clear old held bills

**API Endpoints:**
- `POST /api/sales/hold` - Hold bill
- `GET /api/sales/hold` - List held bills
- `POST /api/sales/resume/:id` - Resume bill

**Frontend:** `/sales/hold`

---

#### 2.5 Estimate → Invoice Conversion
**Status:** ⚠️ PENDING

**Features:**
- Create quotation
- Convert to invoice
- Track conversion rate

**Database Schema:**
```sql
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_no VARCHAR(50) UNIQUE,
    customer_id UUID REFERENCES customers(id),
    estimate_date DATE,
    valid_until DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(50), -- 'pending', 'converted', 'expired'
    converted_invoice_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoint:**
- `POST /api/sales/estimate-convert/:id`

**Frontend:** `/sales/estimate-convert`

---

#### 2.6 Direct Bill Edit
**Status:** ⚠️ PENDING (Role-controlled)

**Features:**
- Edit invoice after sale
- Audit trail
- Role-based permission
- Reason for edit

**Database Schema:**
```sql
CREATE TABLE invoice_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    edited_by UUID REFERENCES users(id),
    edit_reason TEXT,
    changes_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoint:**
- `PUT /api/sales/invoices/edit/:id`

**Frontend:** `/sales/invoices/edit`

---

#### 2.7 Payment Gateway / R-Pay
**Status:** ⚠️ PENDING

**Integration:**
- Razorpay
- UPI
- QR code payment

**Service:** `finance-service`
**Frontend:** `/finance/gateway`

---

#### 2.8 Customer Display Screen
**Status:** ⚠️ PENDING

**Features:**
- Show items being billed
- Show total
- Show payment status
- Promotional messages

**Frontend:** `/sales/customer-display` (Separate window)

---

### Phase 3: Business Management & Reporting (Priority: MEDIUM)

#### 3.1 GST Billing & Returns
**Status:** ⚠️ PENDING

**Features:**
- GST-compliant invoices
- GSTR-1 report
- GSTR-3B report
- HSN-wise summary

**Database Schema:**
```sql
CREATE TABLE gst_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    gstin VARCHAR(15),
    invoice_type VARCHAR(50), -- 'B2B', 'B2C'
    taxable_value DECIMAL(12,2),
    cgst DECIMAL(12,2),
    sgst DECIMAL(12,2),
    igst DECIMAL(12,2),
    cess DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Service:** `finance-service`
**Frontend:** `/finance/gst`

---

#### 3.2 Expense Tracking
**Status:** ⚠️ PENDING

**Features:**
- Expense categories
- Recurring expenses
- Expense reports

**Database Schema:**
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_category VARCHAR(100),
    amount DECIMAL(12,2),
    expense_date DATE,
    payment_mode VARCHAR(50),
    description TEXT,
    receipt_url VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** `/finance/expenses`

---

#### 3.3 Salesman Commission
**Status:** ✅ TABLES EXIST (commission_rules, commission_payments)

**Features to Add:**
- Commission calculation
- Payment tracking
- Performance reports

**Frontend:** `/finance/commission`

---

#### 3.4 Top Sellers / Profit Reports
**Status:** ⚠️ PENDING

**Features:**
- Product-wise sales
- Brand-wise sales
- Profit margin analysis
- Slow-moving items

**Service:** `analytics-service`
**Frontend:** `/reports/sales`

---

#### 3.5 Damaged Products Report
**Status:** ⚠️ PENDING

**Database Schema:**
```sql
CREATE TABLE damaged_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    batch_id UUID,
    quantity DECIMAL(10,2),
    damage_type VARCHAR(100), -- 'expired', 'broken', 'leaked', 'other'
    damage_date DATE,
    cost_value DECIMAL(12,2),
    notes TEXT,
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** `/inventory/damage`

---

#### 3.6 Custom Reports Builder
**Status:** ⚠️ PENDING

**Features:**
- Drag-and-drop report builder
- Custom filters
- Export to Excel/PDF
- Scheduled reports

**Service:** `analytics-service`
**Frontend:** `/reports/custom`

---

### Phase 4: CRM, Customer & Marketing (Priority: MEDIUM)

#### 4.1 Bulk WhatsApp Messaging
**Status:** ⚠️ PENDING

**Features:**
- Send payment reminders
- Birthday wishes
- Promotional messages
- Order confirmations

**Service:** `campaign-service`
**Frontend:** `/crm/whatsapp`

---

#### 4.2 Gift Cards / Vouchers
**Status:** ⚠️ PENDING

**Database Schema:**
```sql
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_number VARCHAR(50) UNIQUE,
    card_value DECIMAL(12,2),
    balance DECIMAL(12,2),
    issued_to VARCHAR(100),
    issued_date DATE,
    expiry_date DATE,
    status VARCHAR(50), -- 'active', 'redeemed', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** `/sales/giftcards`

---

#### 4.3 Customer Loyalty Program
**Status:** ✅ TABLES EXIST (loyalty_cards, loyalty_transactions)

**Features to Add:**
- Points calculation
- Redemption logic
- Tier-based benefits

**Frontend:** `/crm/loyalty`

---

#### 4.4 AI Product Image Management
**Status:** ⚠️ PENDING

**Features:**
- Auto-download images from web
- Image recognition
- Bulk image assignment

**Service:** `ai-service`
**Frontend:** `/ai/image-update`

---

#### 4.5 E-commerce Integration
**Status:** ⚠️ PENDING

**Features:**
- Sync with WooCommerce
- Sync with Shopify
- Real-time inventory sync

**Service:** `api-gateway`
**Frontend:** `/system/integrations/ecommerce`

---

### Phase 5: AI, Automation & System Health (Priority: LOW)

#### 5.1 AI Insights
**Status:** ⚠️ PENDING

**Features:**
- Predict reorders
- Sales trend analysis
- Demand forecasting

**Service:** `ai-service`
**Frontend:** `/ai/insights`

---

#### 5.2 AI Auto Fix
**Status:** ⚠️ PENDING

**Features:**
- Bug detection
- Auto-generate fixes
- System health monitoring

**Service:** `bug-collector`, `ai-fix-worker`
**Frontend:** `/ai/auto-fix`

---

#### 5.3 AI Expiry Forecast
**Status:** ⚠️ PENDING

**Features:**
- Predict soon-to-expire batches
- Suggest promotions
- Auto-generate offers

**Service:** `ai-service`
**Frontend:** `/ai/expiry-predict`

---

#### 5.4 Microservice Health Dashboard
**Status:** ⚠️ PENDING

**Features:**
- Show /health of all services
- Response time monitoring
- Error rate tracking

**Service:** `system-monitor`
**Frontend:** `/system/health`

---

#### 5.5 Audit Logs
**Status:** ⚠️ PENDING

**Database Schema:**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id UUID,
    changes_json JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Service:** `auth-service`
**Frontend:** `/system/audit`

---

#### 5.6 Offline Sync Mode
**Status:** ⚠️ PENDING

**Features:**
- Local SQLite database
- Auto-sync when online
- Conflict resolution

**Service:** `sync-service`
**Frontend:** `/system/offline`

---

## Implementation Priority

### Immediate (Week 1-2)
1. ✅ Subcategories generation - DONE
2. Expiry tracking & alerts
3. Low stock alerts
4. Barcode enhancement
5. POS billing enhancement

### Short-term (Week 3-4)
6. Stock adjustments
7. Supplier management
8. GST billing
9. Customer display screen
10. Hold/Resume bills

### Medium-term (Month 2)
11. Multi-PC sharing
12. Bill customization
13. Expense tracking
14. Damaged products report
15. WhatsApp messaging

### Long-term (Month 3+)
16. AI insights
17. E-commerce integration
18. Offline sync
19. Custom reports builder
20. AI auto-fix

---

## Database Summary

**Total Tables Required:** 60+
**Currently Implemented:** 41
**Pending:** 19

**New Tables Needed:**
1. expiry_alerts
2. stock_adjustments
3. low_stock_alerts
4. vendor_payments
5. vendor_ratings
6. product_units
7. pos_sessions
8. bill_templates
9. estimates
10. invoice_edits
11. gst_invoices
12. expenses
13. damaged_products
14. gift_cards
15. audit_logs
16. (and more...)

---

## Next Steps

1. ✅ Generate subcategories - COMPLETED
2. Create database migrations for new tables
3. Implement API endpoints (Golang)
4. Build frontend pages (Next.js)
5. Test each feature
6. Deploy to production

---

**Status:** Subcategories generation complete. Ready to implement Phase 1 features.
**Last Updated:** October 26, 2025, 12:25 PM IST
