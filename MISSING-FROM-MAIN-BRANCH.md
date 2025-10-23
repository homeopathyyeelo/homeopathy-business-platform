# Missing Files from Main Branch

## Overview
This document lists important files from `main-latest-code-homeopathy-business-platform` that are not yet copied to the current project.

**Date:** October 23, 2025, 7:38 PM IST

---

## 🔴 Critical Missing Files (High Priority)

### 1. API Service Files (`lib/api/`)
These are essential for proper API communication with backend microservices:

```
❌ lib/api/index.ts - Main API export
❌ lib/api/product-service.ts - Product API calls
❌ lib/api/order-service.ts - Order/Sales API calls
❌ lib/api/payment-service.ts - Payment processing
❌ lib/api/user-service.ts - User management API
```

**Impact:** Without these, the copied module pages may not connect properly to backend services.

### 2. React Hooks (`lib/hooks/`)
These hooks are used by the module pages we just copied:

```
❌ lib/hooks/use-products.ts - Product data hooks
❌ lib/hooks/use-inventory.ts - Inventory management
❌ lib/hooks/use-customers.ts - Customer operations
❌ lib/hooks/use-dashboard.ts - Dashboard data
❌ lib/hooks/use-finance.ts - Finance operations
❌ lib/hooks/use-hr.ts - HR management
❌ lib/hooks/use-marketing.ts - Marketing campaigns
❌ lib/hooks/use-ai.ts - AI assistant hooks
❌ lib/hooks/company.ts - Company/branch context
❌ lib/hooks/rbac.ts - Role-based access control
❌ lib/hooks/marketing.ts - Marketing utilities
```

**Impact:** The module pages will fail to load data without these hooks.

### 3. API Client Files (`lib/`)
```
❌ lib/api-client.ts - Base API client configuration
❌ lib/api-complete.ts - Complete API implementation
❌ lib/db.ts - Database client
```

### 4. Configuration Files (`lib/config/`)
```
❌ lib/config/database.ts - Database configuration
```

---

## 🟡 Important Missing Components (Medium Priority)

### 1. Module-Specific Components

#### Sales Components (`components/sales/`)
```
❌ CreateSaleDialog.tsx - New sale form
❌ SaleDetailsDialog.tsx - View sale details
❌ useCreateSale.tsx - Sale creation hook
```

#### Inventory Components (`components/inventory/`)
```
❌ StockAdjustmentDialog.tsx
❌ BatchTrackingTable.tsx
❌ ExpiryAlertCard.tsx
```

#### Customer Components (`components/customers/`)
```
❌ CustomerForm.tsx
❌ CustomerDetailsDialog.tsx
❌ LoyaltyCard.tsx
```

#### Purchase Components (`components/purchases/`)
```
❌ PurchaseOrderForm.tsx
❌ GRNDialog.tsx
❌ VendorSelector.tsx
```

### 2. Shared Components (`components/shared/`)
Check if these exist and are up to date:
```
? StatsCard.tsx - Reusable stats card
? SearchBar.tsx - Global search
? FilterPanel.tsx - Advanced filtering
? ExportButton.tsx - Data export
```

---

## 🟢 Nice-to-Have Missing Files (Low Priority)

### 1. Subpages for Modules

#### Products Subpages
```
❌ app/products/add/page.tsx - Add new product
❌ app/products/edit/[id]/page.tsx - Edit product
❌ app/products/[id]/page.tsx - View product details
❌ app/products/batches/page.tsx - Batch management
❌ app/products/categories/page.tsx - Category management
```

#### Sales Subpages
```
❌ app/sales/pos/page.tsx - POS interface
❌ app/sales/invoices/page.tsx - Invoice list
❌ app/sales/returns/page.tsx - Sales returns
❌ app/sales/[id]/page.tsx - Sale details
```

#### Inventory Subpages
```
❌ app/inventory/stock-transfer/page.tsx
❌ app/inventory/adjustments/page.tsx
❌ app/inventory/expiry-alerts/page.tsx
❌ app/inventory/low-stock/page.tsx
```

#### Customer Subpages
```
❌ app/customers/add/page.tsx
❌ app/customers/edit/[id]/page.tsx
❌ app/customers/[id]/page.tsx
❌ app/customers/groups/page.tsx
❌ app/customers/loyalty/page.tsx
```

### 2. Additional Module Pages

#### Settings Subpages
```
❌ app/settings/company/page.tsx
❌ app/settings/branches/page.tsx
❌ app/settings/users/page.tsx
❌ app/settings/roles/page.tsx
❌ app/settings/integrations/page.tsx
```

#### Finance Subpages
```
❌ app/finance/ledgers/page.tsx
❌ app/finance/gst/page.tsx
❌ app/finance/reports/page.tsx
❌ app/finance/bank-reconciliation/page.tsx
```

---

## 📊 Priority Matrix

### Must Copy Now (Blocking Issues)
1. ✅ **API Service Files** - Without these, pages can't fetch data
2. ✅ **React Hooks** - Module pages depend on these
3. ✅ **API Client** - Base configuration needed

### Should Copy Soon (1-2 days)
4. **Module Components** - Forms, dialogs, specialized components
5. **Subpages** - Add/Edit/View pages for each module

### Can Copy Later (1 week)
6. **Additional Features** - Advanced filtering, exports, etc.
7. **Settings Pages** - Configuration interfaces
8. **Utility Functions** - Helper functions and utilities

---

## 🔍 How to Check What's Missing

### Compare Directories
```bash
# Check components
diff -qr components main-latest-code-homeopathy-business-platform/components

# Check lib
diff -qr lib main-latest-code-homeopathy-business-platform/lib

# Check app pages
diff -qr app main-latest-code-homeopathy-business-platform/app
```

### Find Specific Files
```bash
# Find all hooks
find main-latest-code-homeopathy-business-platform/lib/hooks -name "*.ts"

# Find all API services
find main-latest-code-homeopathy-business-platform/lib/api -name "*.ts"

# Find all component files
find main-latest-code-homeopathy-business-platform/components -name "*.tsx"
```

---

## 🚀 Recommended Copy Order

### Phase 1: Critical Files (Do Now)
```bash
# 1. Copy API services
cp -r main-latest-code-homeopathy-business-platform/lib/api/* lib/api/

# 2. Copy hooks
cp main-latest-code-homeopathy-business-platform/lib/hooks/use-*.ts lib/hooks/

# 3. Copy API clients
cp main-latest-code-homeopathy-business-platform/lib/api-client.ts lib/
cp main-latest-code-homeopathy-business-platform/lib/api-complete.ts lib/
```

### Phase 2: Components (Next)
```bash
# Copy module-specific components
for module in sales inventory customers purchases; do
  cp -r main-latest-code-homeopathy-business-platform/components/$module/* components/$module/
done
```

### Phase 3: Subpages (Later)
```bash
# Copy subpages for each module
for module in products sales inventory customers; do
  cp -r main-latest-code-homeopathy-business-platform/app/$module/* app/$module/
done
```

---

## ⚠️ Current Issues Without These Files

### 1. Module Pages May Not Work Fully
The pages we copied use hooks like:
- `useProducts()` ❌ Missing
- `useInventory()` ❌ Missing
- `useCustomers()` ❌ Missing
- `useProductMutations()` ❌ Missing

**Result:** Pages will show errors or empty data

### 2. API Calls May Fail
Without proper API service files:
- No centralized API configuration
- Inconsistent error handling
- Missing request/response interceptors

### 3. Components May Be Incomplete
Forms and dialogs referenced in pages may not exist:
- Add/Edit forms
- Detail view dialogs
- Specialized input components

---

## ✅ What We Already Have

### Copied Successfully
- ✅ 14 main module pages (products, inventory, sales, etc.)
- ✅ DataTable component
- ✅ 4-sided layout (TopBar, LeftSidebar, RightPanel, BottomBar)
- ✅ 89 master data pages (fixed)
- ✅ WhatsApp service
- ✅ Basic hooks (some exist in lib/hooks/)

### Existing in Current Project
- ✅ UI components (shadcn/ui)
- ✅ Layout components
- ✅ Some utility functions
- ✅ Database client (basic)
- ✅ Auth hooks

---

## 📝 Action Plan

### Immediate (Next 30 minutes)
1. Copy all API service files from `lib/api/`
2. Copy all missing hooks from `lib/hooks/`
3. Copy API client files

### Short Term (Today)
4. Copy module-specific components
5. Test all copied module pages
6. Fix any import errors

### Medium Term (Tomorrow)
7. Copy subpages (add/edit/view)
8. Copy settings pages
9. Copy additional features

### Long Term (This Week)
10. Copy all remaining utilities
11. Copy advanced features
12. Complete documentation

---

## 🔧 Quick Copy Commands

### Copy All Critical Files at Once
```bash
cd /var/www/homeopathy-business-platform

# Create directories if they don't exist
mkdir -p lib/api lib/hooks lib/config

# Copy API services
cp -v main-latest-code-homeopathy-business-platform/lib/api/*.ts lib/api/ 2>/dev/null

# Copy hooks
cp -v main-latest-code-homeopathy-business-platform/lib/hooks/*.ts lib/hooks/ 2>/dev/null

# Copy API clients
cp -v main-latest-code-homeopathy-business-platform/lib/api-client.ts lib/ 2>/dev/null
cp -v main-latest-code-homeopathy-business-platform/lib/api-complete.ts lib/ 2>/dev/null
cp -v main-latest-code-homeopathy-business-platform/lib/db.ts lib/ 2>/dev/null

# Copy config
cp -v main-latest-code-homeopathy-business-platform/lib/config/*.ts lib/config/ 2>/dev/null

echo "✅ Critical files copied!"
```

---

## 📞 Summary

**Total Missing Files:** ~50+ files  
**Critical:** 15-20 files (API services, hooks)  
**Important:** 20-30 files (components, subpages)  
**Nice-to-have:** 10+ files (utilities, advanced features)

**Recommendation:** Copy the critical files (API services and hooks) immediately to make the module pages fully functional.

---

**Last Updated:** October 23, 2025, 7:38 PM IST  
**Status:** Analysis Complete - Ready to copy critical files
