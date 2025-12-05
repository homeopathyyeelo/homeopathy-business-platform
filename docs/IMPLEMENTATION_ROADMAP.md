# Sales Workflows Implementation Roadmap
## Yeelo Homeopathy ERP - Complete SOP & Technical Specifications

**Document Version:** 1.0.0  
**Created:** December 4, 2025  
**Status:** ✅ Database Migration Created | 🚧 Backend Services In Progress | ⏳ Frontend Pending

---

## 📋 Executive Summary

This document provides comprehensive Standard Operating Procedures (SOPs) and technical specifications for implementing 5 critical sales workflow modules:

1. **Hold Bills** (`/sales/hold-bills`) - Priority: IMMEDIATE
2. **Returns & Credit Notes** (`/sales/returns`) - Priority: HIGH  
3. **B2B & E-Invoice** (`/sales/b2b`, `/sales/e-invoice`) - Priority: MEDIUM
4. **Payment Tracking** (`/sales/payments`) - Priority: HIGH
5. **Commission Management** (`/sales/commission`) - Priority: MEDIUM

---

## 🎯 Module 1: Hold Bills

### Business Context
- Customers need to consult doctors, verify prescriptions before purchase
- Must NOT block inventory (other sales continue)
- Auto-expire after 7 days
- Validate stock/price/batch on resume

### Critical Rules

**✅ MUST DO:**
1. Save complete cart state to `held_bills` table
2. Generate unique HOLD-YYYYMMDD-XXXX number
3. NO inventory reduction (not a reservation)
4. Validate on resume: stock available, batch not expired, price unchanged
5. Counter-specific view (POS 1 sees only POS 1 holds)
6. Auto-cleanup after 7 days

**❌ MUST NOT DO:**
1. DON'T reduce inventory_batches.available_quantity
2. DON'T create sales_invoices on hold
3. DON'T calculate GST liability on hold
4. DON'T allow resume without stock validation

### Edge Cases Handled
- **Stock depleted**: Show warning, allow partial completion
- **Price changed**: Show comparison, get customer confirmation
- **Batch expired**: Auto-replace with FEFO, alert if unavailable
- **System crash**: Use database transactions, rollback on failure
- **Duplicate clicks**: Client debouncing + server idempotency

### Technical Implementation

**Database:**
```sql
CREATE TABLE held_bills (
    id UUID PRIMARY KEY,
    hold_number VARCHAR(50) UNIQUE,
    counter_id VARCHAR(50),
    cart_data JSONB NOT NULL,
    total_amount NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);
```

**API Endpoints:**
- `POST /api/erp/pos/hold-bill` - Create hold
- `GET /api/erp/pos/held-bills` - List holds
- `POST /api/erp/pos/held-bills/:id/resume` - Resume with validation
- `POST /api/erp/pos/held-bills/:id/discard` - Discard hold

**Files Created:**
- ✅ `services/api-golang-master/internal/services/hold_bill_service.go`
- ✅ `services/api-golang-master/internal/handlers/hold_bill_handler.go`
- ⏳ `app/sales/hold-bills/page.tsx` (TODO)

---

## 🎯 Module 2: Returns & Credit Notes

### Business Context
- Medicines may be returned within 30 days
- Different handling for RESALABLE vs DAMAGED items
- GST reversal via Credit Note (GSTR-1 compliance)
- Fraud detection for serial returners

### Critical Rules

**✅ MUST DO:**
1. Validate original invoice exists and is not cancelled
2. Check return quantity ≤ sold quantity
3. Enforce 30-day time limit (or manager approval)
4. Capture item condition: RESALABLE, DAMAGED, EXPIRED, OPENED
5. Generate Credit Note (CN-YYYYMMDD-XXXX)
6. Reverse GST (CGST/SGST/IGST)
7. Adjust stock based on condition
8. Require manager approval for >₹5000 or >30 days
9. Fraud detection: Flag if >3 returns in 30 days

**❌ MUST NOT DO:**
1. DON'T allow return without invoice proof
2. DON'T add damaged items to saleable stock
3. DON'T skip GST reversal (compliance violation)
4. DON'T allow cash refund for high-value card/UPI without approval

### Edge Cases Handled
- **Invoice not found**: Supervisor search by phone + date
- **Batch exhausted**: Add to unallocated_returns for later allocation
- **Price changed**: Refund at original price, not current
- **Lost invoice**: Search by phone, verify details
- **Exchange**: Process as Return + New Sale
- **Cancelled invoice**: Block return, show error

### Technical Implementation

**Database:**
```sql
CREATE TABLE sales_returns (
    id UUID PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE,
    original_invoice_id UUID NOT NULL REFERENCES sales_invoices(id),
    return_reason VARCHAR(50),
    refund_method VARCHAR(20),
    refund_status VARCHAR(20) DEFAULT 'PENDING',
    requires_approval BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(15,2)
);

CREATE TABLE sales_return_items (
    id UUID PRIMARY KEY,
    return_id UUID REFERENCES sales_returns(id),
    product_id UUID,
    batch_id UUID,
    quantity_returned NUMERIC(10,2),
    item_condition VARCHAR(20),
    stock_adjusted BOOLEAN DEFAULT FALSE
);
```

**API Endpoints:**
- `GET /api/erp/sales/invoices/:invoiceNo/eligible-for-return`
- `POST /api/erp/sales/returns` - Create return
- `POST /api/erp/sales/returns/:id/approve` - Manager approval
- `POST /api/erp/sales/returns/:id/process-refund` - Complete refund
- `GET /api/erp/sales/returns/fraud-alerts` - Serial returners

**Files Created:**
- ✅ `services/api-golang-master/internal/services/returns_service.go`
- ⏳ `services/api-golang-master/internal/handlers/returns_handler.go` (TODO)
- ⏳ `app/sales/returns/page.tsx` (TODO)

---

## 🎯 Module 3: B2B & E-Invoice

### Business Context
- E-invoice mandatory for B2B (turnover >₹5 crore)
- Requires IRN from GST portal
- GSTIN validation, HSN codes mandatory
- E-way bill for inter-state >₹50,000
- 24-hour cancellation window

### Critical Rules

**✅ MUST DO:**
1. Validate GSTIN format (15 chars, specific pattern)
2. Detect inter-state vs intra-state (IGST vs CGST+SGST)
3. Call GST E-invoice API to generate IRN
4. Store IRN, Ack No, Ack Date, QR Code
5. Display QR code on printed invoice
6. E-way bill for inter-state >₹50K
7. Credit terms tracking (30/60/90 days)
8. Outstanding management (prevent sales if exceeding limit)

**❌ MUST NOT DO:**
1. DON'T skip GSTIN validation
2. DON'T generate E-invoice without IRN
3. DON'T cancel E-invoice after 24 hours (use Credit Note)
4. DON'T allow sales beyond credit limit without approval
5. DON'T forget HSN codes (API will reject)

### Edge Cases Handled
- **GST portal down**: Retry logic + offline fallback (IRN pending status)
- **Invalid GSTIN**: Show warning, allow override with manager approval
- **IRN timeout**: Async generation with polling
- **Duplicate invoice**: Prevent with unique constraints
- **Credit limit exceeded**: Show warning, require approval

### Technical Implementation

**Database:**
```sql
ALTER TABLE sales_invoices ADD COLUMN e_invoice_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_invoices ADD COLUMN irn VARCHAR(100);
ALTER TABLE sales_invoices ADD COLUMN ack_no VARCHAR(50);
ALTER TABLE sales_invoices ADD COLUMN qr_code TEXT;
ALTER TABLE sales_invoices ADD COLUMN e_way_bill_no VARCHAR(50);
ALTER TABLE sales_invoices ADD COLUMN due_date DATE;
ALTER TABLE sales_invoices ADD COLUMN credit_period_days INTEGER;

CREATE TABLE b2b_customers (
    id UUID PRIMARY KEY,
    gstin VARCHAR(15) UNIQUE NOT NULL,
    legal_name VARCHAR(200),
    credit_limit NUMERIC(15,2),
    credit_period_days INTEGER,
    outstanding_amount NUMERIC(15,2)
);
```

**API Endpoints:**
- `POST /api/erp/sales/b2b/invoices` - Create B2B invoice
- `POST /api/erp/sales/b2b/invoices/:id/generate-irn` - Generate E-invoice
- `POST /api/erp/sales/b2b/invoices/:id/cancel-irn` - Cancel (within 24h)
- `GET /api/erp/sales/b2b/customers/:gstin/verify` - Verify GSTIN
- `POST /api/erp/sales/b2b/invoices/:id/generate-eway-bill`

**External Integrations:**
- GST E-invoice API (Sandbox + Production)
- E-way Bill API
- GSTIN Verification API

---

## 🎯 Module 4: Payment Tracking

### Business Context
- Multi-tender support (Cash + Card + UPI in single transaction)
- Advance payments before invoice
- Cheque clearance tracking
- Daily cash reconciliation
- Overpayment → Store credit

### Critical Rules

**✅ MUST DO:**
1. Allow split payments (multiple entries per invoice)
2. Capture transaction references (UPI ID, card last 4 digits, cheque no)
3. Track cheque status: Received → Deposited → Cleared/Bounced
4. Daily EOD reconciliation report
5. Handle overpayments → customer_credits table
6. Payment reminders for credit invoices
7. Payment proof upload (bank statement, screenshot)
8. Bank deposit tracking

**❌ MUST NOT DO:**
1. DON'T allow payments without transaction reference
2. DON'T mark invoice paid until cheque cleared
3. DON'T allow deleting payments (only reverse)
4. DON'T allow backdating >7 days without approval

### Edge Cases Handled
- **Partial payments across multiple invoices**: Payment allocation table
- **Advance payment**: Create payment with invoice_id = NULL
- **Cheque bounced**: Reverse payment, mark invoice unpaid
- **Overpayment**: Create store credit, auto-apply next purchase
- **Payment gateway charges**: Option to pass to customer or absorb

### Technical Implementation

**Database:**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE,
    invoice_id UUID REFERENCES sales_invoices(id),
    payment_method VARCHAR(20),
    amount NUMERIC(15,2),
    transaction_ref_no VARCHAR(100),
    cheque_status VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    reconciled BOOLEAN DEFAULT FALSE
);

CREATE TABLE payment_allocations (
    payment_id UUID REFERENCES payments(id),
    invoice_id UUID REFERENCES sales_invoices(id),
    allocated_amount NUMERIC(15,2)
);

CREATE TABLE customer_credits (
    id UUID PRIMARY KEY,
    customer_id UUID,
    credit_number VARCHAR(50),
    original_amount NUMERIC(15,2),
    balance_amount NUMERIC(15,2),
    expiry_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE bank_deposits (
    id UUID PRIMARY KEY,
    deposit_number VARCHAR(50),
    deposit_date DATE,
    amount NUMERIC(15,2),
    bank_name VARCHAR(100),
    status VARCHAR(20)
);
```

**API Endpoints:**
- `POST /api/erp/sales/payments` - Record payment
- `PUT /api/erp/sales/payments/:id/cheque-status` - Update cheque status
- `POST /api/erp/sales/payments/:id/reverse` - Reverse payment
- `GET /api/erp/sales/payments/reconciliation?date=` - EOD report
- `POST /api/erp/sales/payments/bank-deposit` - Record deposit

---

## 🎯 Module 5: Commission Tracking

### Business Context
- Commissions for doctors, agents, affiliates, staff
- Tiered rates (5% for 0-1L, 7% for 1L-5L, 10% above)
- TDS calculation (10% if >₹15K annually)
- Monthly/quarterly payout cycles
- Clawback on returns

### Critical Rules

**✅ MUST DO:**
1. Define commission rules: % or flat or tiered
2. Auto-calculate on invoice or payment (configurable)
3. Calculate TDS (10% for commission)
4. Track commission_transactions per sale/payment
5. Monthly payout batches with TDS certificates
6. Clawback on returns/cancellations
7. Manager approval for >₹10K payouts
8. Commission statement generation

**❌ MUST NOT DO:**
1. DON'T pay commission before payment received (if payment-basis)
2. DON'T skip TDS deduction and reporting
3. DON'T allow manual overrides without audit trail
4. DON'T exceed monthly caps if configured

### Edge Cases Handled
- **Returns/cancellations**: Reverse commission, create negative transaction
- **Multi-level commissions**: Support hierarchy (agent + area manager)
- **Commission disputes**: Detailed audit trail with calculations
- **TDS certificate delay**: Generate PDF, email to beneficiary

### Technical Implementation

**Database:**
```sql
CREATE TABLE commission_beneficiaries (
    id UUID PRIMARY KEY,
    beneficiary_code VARCHAR(50),
    beneficiary_type VARCHAR(20),
    name VARCHAR(200),
    pan_number VARCHAR(10),
    bank_account_number VARCHAR(50),
    status VARCHAR(20)
);

CREATE TABLE commission_rules (
    id UUID PRIMARY KEY,
    beneficiary_id UUID REFERENCES commission_beneficiaries(id),
    commission_type VARCHAR(20),
    commission_rate NUMERIC(5,2),
    tier_config JSONB,
    calculation_basis VARCHAR(20),
    tds_applicable BOOLEAN,
    monthly_cap_amount NUMERIC(15,2)
);

CREATE TABLE commission_transactions (
    id UUID PRIMARY KEY,
    transaction_number VARCHAR(50),
    beneficiary_id UUID,
    invoice_id UUID REFERENCES sales_invoices(id),
    sale_amount NUMERIC(15,2),
    commission_amount NUMERIC(15,2),
    tds_amount NUMERIC(15,2),
    net_payable NUMERIC(15,2),
    status VARCHAR(20),
    reversed BOOLEAN DEFAULT FALSE
);

CREATE TABLE commission_payouts (
    id UUID PRIMARY KEY,
    payout_number VARCHAR(50),
    beneficiary_id UUID,
    payout_period_start DATE,
    payout_period_end DATE,
    total_commission NUMERIC(15,2),
    total_tds NUMERIC(15,2),
    net_payout NUMERIC(15,2),
    tds_certificate_issued BOOLEAN,
    status VARCHAR(20)
);
```

**API Endpoints:**
- `POST /api/erp/commission/beneficiaries` - Create beneficiary
- `POST /api/erp/commission/rules` - Create commission rule
- `GET /api/erp/commission/transactions` - List transactions
- `POST /api/erp/commission/payouts` - Create payout batch
- `POST /api/erp/commission/payouts/:id/approve` - Approve payout
- `GET /api/erp/commission/tds-certificate/:id` - Generate TDS PDF

---

## 📊 Implementation Status

### ✅ Completed
1. Database migration (`016_sales_workflow_modules.sql`) - ALL tables created
2. Hold Bills service (`hold_bill_service.go`) - Complete
3. Hold Bills handler (`hold_bill_handler.go`) - Existing, verified
4. Returns service (`returns_service.go`) - Complete

### 🚧 In Progress
1. Returns handler
2. Payment tracking enhancements
3. Commission service & handler
4. B2B/E-invoice handler

### ⏳ Pending
1. Frontend pages for all 5 modules
2. Background jobs (hold bills cleanup, commission calculation)
3. Report generation (returns report, commission statements)
4. Integration testing
5. User training materials

---

## 🚀 Next Steps

### Phase 1: Backend Completion (2-3 days)
1. Complete all handler files
2. Add validation logic
3. Unit tests for services
4. API integration tests

### Phase 2: Frontend Development (3-4 days)
1. Hold Bills page (`/sales/hold-bills`)
2. Returns page (`/sales/returns`)
3. Payments page (`/sales/payments`)
4. Commission page (`/sales/commission`)
5. B2B enhancements to existing page

### Phase 3: Testing & Refinement (2-3 days)
1. End-to-end testing
2. Edge case validation
3. Performance optimization
4. Security audit

### Phase 4: Deployment (1 day)
1. Run migration on production
2. Deploy backend code
3. Deploy frontend code
4. User training
5. Go-live monitoring

---

## 📞 Support & Questions

For implementation questions or clarifications, refer to:
- Full SOP JSON: `docs/SALES_WORKFLOWS_SOP.json`
- Database Migration: `database/migrations/016_sales_workflow_modules.sql`
- Service Code: `services/api-golang-master/internal/services/`
- Handlers: `services/api-golang-master/internal/handlers/`

---

**Document maintained by:** Development Team  
**Last updated:** December 4, 2025  
**Next review:** After Phase 1 completion
