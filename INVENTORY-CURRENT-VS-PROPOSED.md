# Inventory System - Current vs Proposed Comparison

## 📊 Current Status

### Database
**Existing Table:** `inventory` (8 columns)
- ❌ No batch tracking
- ❌ No expiry dates
- ❌ No purchase/MRP per batch
- ❌ No transaction history
- ❌ No source tracking
- ❌ No approval workflow

### Frontend
**15 pages exist** but need backend integration:
- `/inventory/stock` - Basic list
- `/inventory/adjustments` - Exists
- `/inventory/batches` - Exists
- `/inventory/expiry` - Exists
- `/inventory/low-stock` - Exists
- `/inventory/direct-entry` - Exists
- And 10 more pages

## 🎯 Proposed Enhancements

### New Tables Required (5)
1. `purchase_orders` - Purchase tracking
2. `purchase_items` - Line items
3. `inventory_stock` - Enhanced with batches
4. `stock_transactions` - Complete audit trail
5. `stock_adjustments` - Manual adjustments

### Key Features
✅ Batch-wise tracking
✅ Expiry date management
✅ Purchase rate + MRP per batch
✅ Complete transaction history
✅ Source tracking (purchase/manual)
✅ Approval workflow
✅ Multi-warehouse support
✅ FIFO/LIFO support

## 📋 Implementation Checklist

### Week 1: Database
- [ ] Create 5 new tables
- [ ] Migrate existing data
- [ ] Add indexes

### Week 2: Backend APIs
- [ ] Stock list API (enhanced)
- [ ] Manual entry API
- [ ] Purchase upload API
- [ ] Approval API
- [ ] Transaction history API

### Week 3: Frontend
- [ ] Enhance stock page
- [ ] Create manual entry form
- [ ] Create purchase upload page
- [ ] Create approval dashboard

## 📄 Full Documentation
See `PHARMACY-FEATURES-IMPLEMENTATION-PLAN.md` for complete details.
