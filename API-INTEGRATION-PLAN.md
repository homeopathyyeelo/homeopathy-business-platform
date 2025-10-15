# 🔌 Complete API Integration Plan

## NestJS APIs Available (Port 3002)

### 1. Orders Module (4 endpoints)
- POST /orders - Create order
- GET /orders - List orders
- GET /orders/{id} - Get order details
- PUT /orders/{id}/status - Update order status

### 2. Inventory Module (4 endpoints)
- GET /inventory/summary - Inventory summary
- GET /inventory/low-stock - Low stock items
- POST /inventory/add - Add inventory
- POST /inventory/adjust - Adjust inventory

### 3. B2B Module (11 endpoints)
- POST /b2b/orders - Create B2B order
- GET /b2b/orders - List B2B orders
- GET /b2b/orders/{id} - Get B2B order
- PUT /b2b/orders/{id}/approve - Approve order
- PUT /b2b/orders/{id}/reject - Reject order
- GET /b2b/customers - List B2B customers
- GET /b2b/customers/{id} - Get B2B customer
- GET /b2b/customers/{id}/credit - Customer credit
- POST /b2b/d2d/transactions - D2D transactions
- GET /b2b/d2d/transactions - List D2D transactions
- GET /b2b/pricing/{customerId} - Customer pricing
- GET /b2b/analytics/sales - B2B analytics

### 4. Purchase Module (9 endpoints)
- POST /purchase/vendors - Create vendor
- GET /purchase/vendors - List vendors
- GET /purchase/vendors/{id} - Get vendor
- PUT /purchase/vendors/{id} - Update vendor
- POST /purchase/orders - Create PO
- GET /purchase/orders - List POs
- GET /purchase/orders/{id} - Get PO
- PUT /purchase/orders/{id}/status - Update PO status
- POST /purchase/grn - Goods Receipt Note
- GET /purchase/analytics - Purchase analytics

### 5. Finance Module (11 endpoints)
- POST /finance/invoices - Create invoice
- GET /finance/invoices - List invoices
- GET /finance/invoices/{id} - Get invoice
- PUT /finance/invoices/{id}/status - Update invoice
- POST /finance/payments - Record payment
- GET /finance/reports/profit-loss - P&L Report
- GET /finance/reports/cash-flow - Cash Flow
- GET /finance/reports/gst - GST Report
- GET /finance/currency/rates - Currency rates
- GET /finance/currency/convert - Convert currency

### 6. AI Module (10 endpoints)
- POST /ai/generate - Generate content
- POST /ai/embed - Generate embeddings
- GET /ai/models - List AI models
- GET /ai/prompts - List prompts
- GET /ai/requests - AI request history
- GET /ai/requests/{id} - Get request details
- POST /ai/forecast/demand - Demand forecasting
- POST /ai/pricing/dynamic - Dynamic pricing
- POST /ai/content/campaign - Campaign content

## Pages to Create/Update:

1. ✅ /inventory - Consume all inventory APIs
2. ✅ /purchases - Consume purchase APIs
3. ✅ /finance - Consume finance APIs  
4. ✅ /b2b - Consume B2B APIs
5. ✅ /ai-insights - Consume AI APIs
6. ✅ /sales - Consume orders APIs

Creating production-ready pages now...
