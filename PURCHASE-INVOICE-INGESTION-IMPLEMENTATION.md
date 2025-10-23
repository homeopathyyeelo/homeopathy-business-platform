# Purchase Invoice Ingestion & Matching System - Implementation Plan

## Executive Summary

**Service Name:** `invoice-parser-service`  
**Technology:** Python/FastAPI (for OCR/ML capabilities)  
**Port:** 8005  
**Priority:** P0 (Critical for operations)  
**Complexity:** High  
**Timeline:** 4 weeks

---

## 🎯 Business Value

### Problems Solved
1. **Manual data entry** - 4-6 hours/day saved
2. **Invoice errors** - 95% reduction in entry mistakes
3. **Stock delays** - Real-time inventory updates
4. **Pricing errors** - Automated discount application
5. **Reconciliation time** - 80% faster matching

### ROI
- **Time saved:** 20-25 hours/week
- **Error reduction:** ₹50,000-100,000/month
- **Faster restocking:** 2-3 days faster
- **Better pricing:** 5-8% cost savings

---

## 🏗️ Architecture Design

### Service Structure
```
services/
└── invoice-parser-service/          (NEW)
    ├── Dockerfile
    ├── docker-compose.yml
    ├── requirements.txt
    ├── main.py
    ├── app/
    │   ├── api/
    │   │   ├── routes/
    │   │   │   ├── upload.py
    │   │   │   ├── parse.py
    │   │   │   ├── match.py
    │   │   │   └── reconcile.py
    │   │   └── dependencies.py
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   └── events.py
    │   ├── services/
    │   │   ├── pdf_parser.py
    │   │   ├── ocr_service.py
    │   │   ├── matcher.py
    │   │   ├── pricing_engine.py
    │   │   └── inventory_updater.py
    │   ├── models/
    │   │   ├── invoice.py
    │   │   ├── parsed_line.py
    │   │   └── match_result.py
    │   ├── db/
    │   │   ├── models.py
    │   │   └── repositories.py
    │   └── ml/
    │       ├── fuzzy_matcher.py
    │       ├── llm_matcher.py
    │       └── vendor_learner.py
    └── tests/
```

### Technology Stack
```python
# Core Framework
FastAPI==0.104.1
uvicorn[standard]==0.24.0

# PDF Processing
pdfplumber==0.10.3
PyPDF2==3.0.1
tabula-py==2.8.2

# OCR
pytesseract==0.3.10
pdf2image==1.16.3
Pillow==10.1.0

# ML/Matching
scikit-learn==1.3.2
fuzzywuzzy==0.18.0
python-Levenshtein==0.23.0
sentence-transformers==2.2.2

# LLM Integration
openai==1.3.7
langchain==0.0.340

# Database
asyncpg==0.29.0
SQLAlchemy==2.0.23
alembic==1.12.1

# Events
aiokafka==0.9.0
redis==5.0.1

# Storage
minio==7.2.0
boto3==1.29.7

# Utils
python-multipart==0.0.6
celery==5.3.4
```

---

## 📊 Database Schema (PostgreSQL)

### New Tables

```sql
-- =====================================================
-- INVOICE PARSING TABLES
-- =====================================================

-- Parsed Invoices
CREATE TABLE parsed_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    shop_id UUID NOT NULL REFERENCES shops(id),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    source_type VARCHAR(20) NOT NULL, -- pdf|email|api|manual
    source_ref VARCHAR(255),
    raw_pdf_path TEXT,
    ocr_text TEXT,
    total_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'parsed', -- parsed|matched|confirmed|posted
    confidence_score DECIMAL(3,2),
    uploaded_by UUID REFERENCES users(id),
    parsed_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    confirmed_by UUID REFERENCES users(id),
    trace_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parsed_invoices_vendor ON parsed_invoices(vendor_id);
CREATE INDEX idx_parsed_invoices_status ON parsed_invoices(status);
CREATE INDEX idx_parsed_invoices_shop ON parsed_invoices(shop_id);

-- Parsed Invoice Lines
CREATE TABLE parsed_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    raw_text TEXT,
    description TEXT,
    qty DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    line_total DECIMAL(15,2),
    batch_no VARCHAR(50),
    expiry_date DATE,
    hsn_code VARCHAR(20),
    
    -- Matching fields
    suggested_product_id UUID REFERENCES products(id),
    matched_product_id UUID REFERENCES products(id),
    match_type VARCHAR(20), -- sku|vendor_map|exact|fuzzy|ai|manual
    match_confidence DECIMAL(3,2),
    match_metadata JSONB,
    
    -- Pricing fields
    unit_cost DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    landed_unit_cost DECIMAL(12,2),
    
    status VARCHAR(20) DEFAULT 'pending', -- pending|matched|confirmed|posted
    reconciled_by UUID REFERENCES users(id),
    reconciled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parsed_lines_invoice ON parsed_invoice_lines(parsed_invoice_id);
CREATE INDEX idx_parsed_lines_product ON parsed_invoice_lines(matched_product_id);
CREATE INDEX idx_parsed_lines_status ON parsed_invoice_lines(status);

-- Vendor Product Mappings (Learning)
CREATE TABLE vendor_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    vendor_sku_name TEXT NOT NULL,
    vendor_sku_code VARCHAR(100),
    product_id UUID NOT NULL REFERENCES products(id),
    confidence DECIMAL(3,2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vendor_id, vendor_sku_name)
);

CREATE INDEX idx_vendor_mappings_vendor ON vendor_product_mappings(vendor_id);
CREATE INDEX idx_vendor_mappings_product ON vendor_product_mappings(product_id);

-- Vendor Price List
CREATE TABLE vendor_price_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    min_qty INTEGER DEFAULT 1,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vendor_id, product_id, effective_from)
);

-- Discount Rules
CREATE TABLE discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    scope VARCHAR(20) NOT NULL, -- vendor|brand|category|product|global
    scope_id UUID, -- vendor_id, brand_id, category_id, or product_id
    type VARCHAR(20) NOT NULL, -- percentage|fixed|tiered
    threshold_qty INTEGER,
    threshold_amount DECIMAL(15,2),
    discount_rate DECIMAL(5,2),
    discount_amount DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reconciliation Tasks
CREATE TABLE reconciliation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parsed_invoice_id UUID NOT NULL REFERENCES parsed_invoices(id),
    parsed_line_id UUID REFERENCES parsed_invoice_lines(id),
    task_type VARCHAR(30) NOT NULL, -- unmatched|low_confidence|duplicate|validation_error
    description TEXT,
    suggested_actions JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending|in_progress|resolved|ignored
    assigned_to UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_status ON reconciliation_tasks(status);
CREATE INDEX idx_reconciliation_assigned ON reconciliation_tasks(assigned_to);

-- Purchase Receipts (GRN)
CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    parsed_invoice_id UUID REFERENCES parsed_invoices(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    shop_id UUID NOT NULL REFERENCES shops(id),
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    freight_charges DECIMAL(12,2),
    other_charges DECIMAL(12,2),
    grand_total DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft|confirmed|posted|cancelled
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    posted_at TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Receipt Lines
CREATE TABLE purchase_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_no VARCHAR(50),
    expiry_date DATE,
    qty DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    landed_unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### 1. Upload & Parse
```
POST /api/v1/invoices/upload
Content-Type: multipart/form-data

Request:
- file: PDF file
- vendor_id: UUID
- shop_id: UUID
- source: "manual"|"email"|"api"
- uploader_id: UUID

Response:
{
  "success": true,
  "data": {
    "parsed_invoice_id": "uuid",
    "status": "processing",
    "trace_id": "uuid"
  }
}
```

### 2. Get Parsed Invoice
```
GET /api/v1/invoices/:id/parsed

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "vendor": {...},
    "invoice_number": "INV-2025-001",
    "invoice_date": "2025-10-01",
    "total_amount": 12500.00,
    "confidence_score": 0.87,
    "status": "parsed",
    "lines": [
      {
        "line_id": "uuid",
        "raw_text": "SBL UTI PLUS DROPS 30ml...",
        "description": "UTI Plus Drops 30ml",
        "qty": 12,
        "unit_price": 125.00,
        "matched_product": {...},
        "match_confidence": 0.95,
        "match_type": "vendor_map"
      }
    ],
    "summary": {
      "total_lines": 15,
      "matched_lines": 12,
      "unmatched_lines": 3,
      "avg_confidence": 0.87
    }
  }
}
```

### 3. Manual Match Line
```
POST /api/v1/invoices/:id/lines/:lineId/match

Request:
{
  "action": "match"|"create"|"ignore",
  "product_id": "uuid",
  "batch_no": "B20251001",
  "expiry_date": "2027-10-01"
}

Response:
{
  "success": true,
  "data": {
    "line_id": "uuid",
    "matched_product_id": "uuid",
    "status": "matched"
  }
}
```

### 4. Confirm & Post Invoice
```
POST /api/v1/invoices/:id/confirm

Request:
{
  "shop_id": "uuid",
  "approve_by": "uuid",
  "auto_allocate_batches": true,
  "apply_discounts": true
}

Response:
{
  "success": true,
  "data": {
    "receipt_id": "uuid",
    "receipt_number": "GRN-2025-001",
    "posted": true,
    "inventory_updated": true,
    "events_published": true
  }
}
```

### 5. Search Products for Matching
```
GET /api/v1/products/search?q=uti+plus&brand=sbl&potency=Q

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "UTI Plus Drops",
      "brand": "SBL",
      "potency": "Q",
      "pack_size": "30ml",
      "similarity_score": 0.95
    }
  ]
}
```

### 6. Reconciliation Tasks
```
GET /api/v1/reconciliations?status=pending&shop_id=uuid

Response:
{
  "success": true,
  "data": [
    {
      "task_id": "uuid",
      "invoice_id": "uuid",
      "line_id": "uuid",
      "task_type": "unmatched",
      "description": "Product not found",
      "suggested_actions": [
        {"action": "search", "query": "..."},
        {"action": "create_product", "data": {...}}
      ]
    }
  ]
}
```

---

## 🎯 Implementation Roadmap

### **Phase 1: P0 - Core Parsing (Week 1-2)**

#### Week 1: Infrastructure
- [ ] Create `invoice-parser-service` with FastAPI
- [ ] Set up Docker container
- [ ] Create database tables (migrations)
- [ ] Set up MinIO for PDF storage
- [ ] Implement PDF upload endpoint
- [ ] Basic PDF text extraction (pdfplumber)
- [ ] Store parsed_invoices and lines

#### Week 2: Matching Engine
- [ ] SKU exact match
- [ ] Vendor mapping table lookup
- [ ] Exact name match (normalized)
- [ ] Fuzzy match (pg_trgm + fuzzywuzzy)
- [ ] Manual reconciliation UI (Next.js)
- [ ] Match/Create/Ignore actions
- [ ] Vendor mapping learning

### **Phase 2: P0 - Post & Update (Week 3)**

- [ ] Pricing rules engine (basic)
- [ ] Discount calculation
- [ ] Create purchase_receipts (GRN)
- [ ] Update inventory batches
- [ ] Outbox events (invoice.parsed, purchase.received, inventory.restocked)
- [ ] Validation checks (duplicate, totals)
- [ ] Basic approval flow

### **Phase 3: P1 - Advanced Features (Week 4)**

- [ ] OCR for scanned PDFs (Tesseract)
- [ ] AI matching (LLM fallback)
- [ ] Advanced pricing rules
- [ ] Landed cost calculation
- [ ] Multi-currency support
- [ ] Vendor API connectors
- [ ] Auto-approve rules
- [ ] Manager approval workflow

### **Phase 4: P2 - Optimization (Later)**

- [ ] ML model training
- [ ] Active learning
- [ ] Vendor template learning
- [ ] Batch processing
- [ ] Performance optimization
- [ ] Advanced analytics

---

## 🔄 Event Flow

### Events Published
```
1. invoice.uploaded.v1
   - parsed_invoice_id
   - vendor_id
   - shop_id
   - trace_id

2. invoice.parsed.v1
   - parsed_invoice_id
   - total_lines
   - matched_lines
   - confidence_score

3. invoice.matched.v1
   - parsed_invoice_id
   - match_summary

4. purchase.receipt.created.v1
   - receipt_id
   - vendor_id
   - shop_id
   - total_amount
   - lines[]

5. inventory.restocked.v1
   - shop_id
   - product_id
   - batch_no
   - qty
   - expiry_date

6. reconciliation.task.created.v1
   - task_id
   - invoice_id
   - task_type
```

---

## 🧪 Testing Strategy

### Unit Tests
- PDF parsing accuracy
- Matching algorithms
- Pricing calculations
- Validation rules

### Integration Tests
- Upload → Parse → Match → Post flow
- Event publishing
- Database transactions
- API endpoints

### Acceptance Tests
- ≥90% auto-match rate for known vendors
- <2 min reconciliation time
- 100% duplicate detection
- Inventory consistency

---

## 📋 Next Steps

### Immediate Actions
1. **Create service folder** ✅
2. **Set up FastAPI project** ✅
3. **Run database migrations** ✅
4. **Implement upload endpoint** ✅
5. **Test PDF parsing** ✅

### This Week
1. Build matching engine
2. Create reconciliation UI
3. Implement GRN creation
4. Test with real invoices

---

**Status:** Ready for Implementation  
**Priority:** P0 (Critical)  
**Timeline:** 4 weeks  
**Team:** 2-3 developers
