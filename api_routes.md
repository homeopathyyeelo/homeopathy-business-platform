# API Routes Documentation - Missing Endpoints

## Overview
This document outlines all missing API endpoints that need to be implemented to achieve feature parity with RetailDaddy and MargERP.

## Authentication & Core
```
GET    /api/health                    - Health check ✓
GET    /api/metrics                   - System metrics ✓
POST   /api/login                     - User authentication ✓
GET    /api/me                        - Current user info ✓
```

## Sales & Invoicing (CRITICAL - P0)
```
# Invoices
GET    /api/invoices                  - List all invoices
GET    /api/invoices/:id              - Get invoice details
POST   /api/invoices                  - Create new invoice
PUT    /api/invoices/:id              - Update invoice (before issue)
PUT    /api/invoices/:id/status       - Update invoice status
PUT    /api/invoices/:id/approve      - Approve invoice
DELETE /api/invoices/:id              - Cancel/delete invoice
GET    /api/invoices/customer/:id     - Invoices by customer
GET    /api/invoices/salesman/:id     - Invoices by salesman
GET    /api/invoices/reports/summary  - Invoice summary reports
GET    /api/invoices/reports/outstanding - Outstanding invoices

# Sales Orders
GET    /api/sales-orders              - List sales orders
GET    /api/sales-orders/:id          - Get sales order details
POST   /api/sales-orders              - Create sales order
PUT    /api/sales-orders/:id          - Update sales order
DELETE /api/sales-orders/:id          - Delete sales order
POST   /api/sales-orders/:id/convert  - Convert order to invoice
GET    /api/sales-orders/customer/:id - Orders by customer

# Returns & Credit Notes
GET    /api/returns                   - List returns
GET    /api/returns/:id               - Get return details
POST   /api/returns                   - Create return
PUT    /api/returns/:id               - Update return
PUT    /api/returns/:id/approve       - Approve return
DELETE /api/returns/:id               - Delete return
GET    /api/returns/invoice/:id       - Returns by invoice

# Invoice Series
GET    /api/invoice-series            - List invoice series
GET    /api/invoice-series/:id        - Get invoice series
POST   /api/invoice-series            - Create invoice series
PUT    /api/invoice-series/:id        - Update invoice series
DELETE /api/invoice-series/:id        - Delete invoice series

# Commissions
GET    /api/commissions               - List commissions
GET    /api/commissions/:id           - Get commission details
POST   /api/commissions               - Create commission
PUT    /api/commissions/:id           - Update commission
PUT    /api/commissions/:id/approve   - Approve commission
DELETE /api/commissions/:id           - Delete commission
GET    /api/commissions/salesman/:id  - Commissions by salesman

# Payments
GET    /api/payments                  - List payments
GET    /api/payments/:id              - Get payment details
POST   /api/payments                  - Create payment
PUT    /api/payments/:id              - Update payment
DELETE /api/payments/:id              - Delete payment
GET    /api/payments/invoice/:id      - Payments by invoice
```

## Purchases & Vendors (CRITICAL - P0)
```
# Purchase Orders
GET    /api/purchase-orders           - List purchase orders
GET    /api/purchase-orders/:id       - Get purchase order details
POST   /api/purchase-orders           - Create purchase order
PUT    /api/purchase-orders/:id       - Update purchase order
DELETE /api/purchase-orders/:id       - Delete purchase order
PUT    /api/purchase-orders/:id/approve - Approve purchase order
GET    /api/purchase-orders/vendor/:id - Orders by vendor

# Goods Receipt Notes (GRN)
GET    /api/grn                       - List GRN
GET    /api/grn/:id                   - Get GRN details
POST   /api/grn                       - Create GRN
PUT    /api/grn/:id                   - Update GRN
DELETE /api/grn/:id                   - Delete GRN
GET    /api/grn/po/:id                - GRN by purchase order

# Vendor Invoices
GET    /api/vendor-invoices           - List vendor invoices
GET    /api/vendor-invoices/:id       - Get vendor invoice details
POST   /api/vendor-invoices           - Create vendor invoice
PUT    /api/vendor-invoices/:id       - Update vendor invoice
DELETE /api/vendor-invoices/:id       - Delete vendor invoice
PUT    /api/vendor-invoices/:id/approve - Approve vendor invoice

# Vendors
GET    /api/vendors                   - List vendors
GET    /api/vendors/:id               - Get vendor details
POST   /api/vendors                   - Create vendor
PUT    /api/vendors/:id               - Update vendor
DELETE /api/vendors/:id               - Delete vendor
GET    /api/vendors/performance       - Vendor performance metrics
GET    /api/vendors/price-comparison  - Price comparison across vendors
```

## Finance & Accounting (CRITICAL - P0)
```
# Ledgers
GET    /api/ledgers/sales             - Sales ledger
GET    /api/ledgers/purchase          - Purchase ledger
GET    /api/ledgers/customer/:id      - Customer ledger
GET    /api/ledgers/vendor/:id        - Vendor ledger

# Cash & Bank Book
GET    /api/cashbook                  - Cash book entries
GET    /api/bankbook                  - Bank book entries
POST   /api/cashbook                  - Add cash entry
POST   /api/bankbook                  - Add bank entry

# Expenses
GET    /api/expenses                  - List expenses
GET    /api/expenses/:id              - Get expense details
POST   /api/expenses                  - Create expense
PUT    /api/expenses/:id              - Update expense
DELETE /api/expenses/:id              - Delete expense
GET    /api/expenses/categories       - Expense categories

# GST & Tax
GET    /api/gst/returns               - GST return data
POST   /api/gst/returns               - File GST return
GET    /api/gst/eway-bills            - E-way bills
POST   /api/gst/eway-bills            - Generate e-way bill
PUT    /api/gst/eway-bills/:id/cancel - Cancel e-way bill

# Trial Balance & Reports
GET    /api/finance/trial-balance     - Trial balance
GET    /api/finance/balance-sheet     - Balance sheet
GET    /api/finance/profit-loss       - Profit & loss statement
GET    /api/finance/cash-flow         - Cash flow statement
```

## Reports & Analytics (CRITICAL - P0)
```
# Sales Reports
GET    /api/reports/sales/daily       - Daily sales report
GET    /api/reports/sales/weekly      - Weekly sales report
GET    /api/reports/sales/monthly     - Monthly sales report
GET    /api/reports/sales/product     - Product-wise sales
GET    /api/reports/sales/customer    - Customer-wise sales
GET    /api/reports/sales/salesman    - Salesman performance

# Inventory Reports
GET    /api/reports/inventory/stock   - Stock summary
GET    /api/reports/inventory/expiry  - Expiry reports
GET    /api/reports/inventory/movement - Stock movement
GET    /api/reports/inventory/valuation - Inventory valuation

# Purchase Reports
GET    /api/reports/purchases/vendor  - Vendor performance
GET    /api/reports/purchases/product - Product purchase analysis

# Financial Reports
GET    /api/reports/finance/receivables - Accounts receivable
GET    /api/reports/finance/payables   - Accounts payable
GET    /api/reports/finance/profit     - Profit analysis

# Homeopathy-Specific Reports
GET    /api/reports/doctor/patients   - Doctor-patient reports
GET    /api/reports/prescription/analysis - Prescription analysis
GET    /api/reports/treatment/outcomes - Treatment outcomes
```

## Marketing & Communication (CRITICAL - P0)
```
# Campaigns
GET    /api/campaigns                 - List campaigns
GET    /api/campaigns/:id             - Get campaign details
POST   /api/campaigns                 - Create campaign
PUT    /api/campaigns/:id             - Update campaign
DELETE /api/campaigns/:id             - Delete campaign
POST   /api/campaigns/:id/launch      - Launch campaign
GET    /api/campaigns/:id/analytics   - Campaign analytics

# WhatsApp Integration
POST   /api/whatsapp/send             - Send WhatsApp message
POST   /api/whatsapp/bulk             - Send bulk WhatsApp
GET    /api/whatsapp/templates        - WhatsApp templates
POST   /api/whatsapp/templates        - Create template

# SMS & Email
POST   /api/sms/send                  - Send SMS
POST   /api/email/send                - Send email
GET    /api/communication/history     - Communication history
```

## HR & Employees (CRITICAL - P0)
```
# Users
GET    /api/users                     - List users
GET    /api/users/:id                 - Get user details
POST   /api/users                     - Create user
PUT    /api/users/:id                 - Update user
DELETE /api/users/:id                 - Delete user
PUT    /api/users/:id/status          - Activate/deactivate user

# Roles & Permissions
GET    /api/roles                     - List roles
GET    /api/roles/:id                 - Get role details
POST   /api/roles                     - Create role
PUT    /api/roles/:id                 - Update role
DELETE /api/roles/:id                 - Delete role
GET    /api/permissions               - List permissions

# Employee Management
GET    /api/employees                 - List employees
GET    /api/employees/:id             - Get employee details
POST   /api/employees                 - Create employee
PUT    /api/employees/:id             - Update employee
GET    /api/employees/attendance      - Attendance records
POST   /api/employees/attendance      - Mark attendance

# Payroll
GET    /api/payroll/salary            - Salary records
POST   /api/payroll/salary            - Process salary
GET    /api/payroll/reports           - Payroll reports
```

## Settings & Configuration (CRITICAL - P0)
```
# System Settings
GET    /api/settings                  - Get system settings
PUT    /api/settings                  - Update system settings
GET    /api/settings/company          - Company information
PUT    /api/settings/company          - Update company info

# Branches
GET    /api/branches                  - List branches
GET    /api/branches/:id              - Get branch details
POST   /api/branches                  - Create branch
PUT    /api/branches/:id              - Update branch
DELETE /api/branches/:id              - Delete branch

# Configuration
GET    /api/config/tax                - Tax configuration
PUT    /api/config/tax                - Update tax config
GET    /api/config/invoice            - Invoice configuration
PUT    /api/config/invoice            - Update invoice config
```

## Integration & Automation (P1)
```
# Payment Gateways
POST   /api/payments/stripe           - Process Stripe payment
POST   /api/payments/razorpay         - Process Razorpay payment
GET    /api/payments/gateway/status   - Payment gateway status

# Hardware Integration
POST   /api/hardware/weighing         - Weighing machine data
POST   /api/hardware/barcode          - Barcode scanner data
GET    /api/hardware/devices          - Connected devices

# ERP-to-ERP Sync
POST   /api/sync/vendors              - Sync vendor data
POST   /api/sync/products             - Sync product data
GET    /api/sync/status               - Sync status
```

## Advanced Features (P2)
```
# Multi-Company
GET    /api/companies                 - List companies
POST   /api/companies                 - Create company
GET    /api/companies/:id             - Get company details
PUT    /api/companies/:id             - Update company

# AI Features
GET    /api/ai/reorder-suggestions    - AI reorder suggestions
GET    /api/ai/sales-forecast         - Sales forecasting
POST   /api/ai/chat                   - AI chat assistant

# Loyalty & Rewards
GET    /api/loyalty/programs          - Loyalty programs
POST   /api/loyalty/points            - Add loyalty points
POST   /api/loyalty/redeem            - Redeem points
GET    /api/loyalty/gift-cards        - Gift cards
```

## Total Missing Endpoints: ~200+
- **P0 Critical**: 80+ endpoints (Sales, Purchases, Finance, Reports, Marketing, HR, Settings)
- **P1 Important**: 60+ endpoints (Multi-company, Payment gateways, Advanced features)
- **P2 Nice-to-have**: 60+ endpoints (AI features, Advanced integrations)

## Implementation Priority
1. **Sales/Invoices/POS** - Core business functionality
2. **Purchases/Vendors/GRN** - Supply chain management
3. **Finance/Accounting** - Financial compliance
4. **Reports/Analytics** - Business intelligence
5. **Marketing/Campaigns** - Customer engagement
6. **HR/Employees** - User management
7. **Settings/Configuration** - System administration
