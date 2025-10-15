# ✅ FEATURE VERIFICATION & TESTING CHECKLIST

**Purpose:** Comprehensive checklist to verify all features from old app work correctly in new app  
**Date:** January 13, 2025

---

## 🎯 TESTING STRATEGY

### **Phase 1: UI & Navigation (30 mins)**
Test all pages load and basic navigation works

### **Phase 2: Master Data (1 hour)**
Test all CRUD operations on master tables

### **Phase 3: Business Operations (2 hours)**
Test core business flows (sales, purchase, inventory)

### **Phase 4: Advanced Features (1 hour)**
Test marketing, reports, prescriptions, loyalty

### **Phase 5: Integration Testing (1 hour)**
Test end-to-end workflows

---

## 📋 PHASE 1: UI & NAVIGATION TESTING

### **Landing & Authentication**
- [ ] Landing page loads (`/`)
- [ ] Login page accessible (`/login`)
- [ ] Login form validation works
- [ ] Authentication redirects properly
- [ ] Logout functionality works

### **Main Navigation**
- [ ] Dashboard accessible (`/dashboard`)
- [ ] Sidebar navigation visible
- [ ] All menu items clickable
- [ ] Page transitions smooth
- [ ] Breadcrumbs working

### **All 37 Pages Load**

**Core Pages (from old app):**
- [ ] `/dashboard` - Dashboard loads with metrics
- [ ] `/master` - Master management with 7 tabs
- [ ] `/inventory` - Inventory with 6 tabs
- [ ] `/sales` - Sales page with retail/wholesale tabs
- [ ] `/purchases` - Purchase page with PO/GRN
- [ ] `/customers` - Customer list and CRM
- [ ] `/marketing` - Marketing campaigns page
- [ ] `/prescriptions` - Prescription management
- [ ] `/reports` - Reports with 5 types
- [ ] `/settings` - Settings with 6 tabs
- [ ] `/daily-register` - Daily billing page
- [ ] `/gst` - GST compliance page
- [ ] `/delivery` - Delivery management
- [ ] `/loyalty` - Loyalty program page
- [ ] `/analytics` - Business intelligence
- [ ] `/email` - Email campaigns
- [ ] `/features` - Features showcase
- [ ] `/login` - Login page
- [ ] `/page.tsx` - Root landing page
- [ ] `/not-found` - 404 page

**New Enhanced Pages:**
- [ ] `/ai-campaigns` - AI marketing campaigns
- [ ] `/ai-chat` - AI chat assistant
- [ ] `/ai-insights` - ML insights
- [ ] `/ai-demos` - AI demos
- [ ] `/active-batches` - Batch tracking
- [ ] `/dashboards` - Advanced dashboards
- [ ] `/crm` - Dedicated CRM
- [ ] `/hr` - HR management
- [ ] `/manufacturing` - Manufacturing
- [ ] `/notifications` - Notifications
- [ ] `/pos` - POS system
- [ ] `/retail-pos` - Retail POS
- [ ] `/products` - Product catalog
- [ ] `/quick-stats` - Quick statistics
- [ ] `/schemes` - Schemes & offers
- [ ] `/user` - User management
- [ ] `/warehouse` - Warehouse mgmt

---

## 📋 PHASE 2: MASTER DATA TESTING

### **Product Master (`/master` → Products Tab)**

**CREATE Operations:**
- [ ] Add new homeopathy product
- [ ] Select brand (SBL, Schwabe, Bakson, etc.)
- [ ] Enter potency (MT, 6C, 30C, 200C, 1M, 10M)
- [ ] Set medicine form (Drops, Tablets, etc.)
- [ ] Configure pack size
- [ ] Enter HSN code
- [ ] Set GST rate (5%, 12%, 18%)
- [ ] Add purchase price
- [ ] Add retail price
- [ ] Add wholesale price
- [ ] Enable batch tracking
- [ ] Enable expiry tracking
- [ ] Set min/max/reorder levels
- [ ] Product saves successfully

**READ Operations:**
- [ ] Product list displays correctly
- [ ] Search by product name works
- [ ] Filter by category works
- [ ] Filter by brand works
- [ ] Filter by active/inactive works
- [ ] Pagination works
- [ ] Product details view shows all data

**UPDATE Operations:**
- [ ] Edit product details
- [ ] Update prices
- [ ] Change GST rates
- [ ] Modify stock levels
- [ ] Changes save successfully

**DELETE Operations:**
- [ ] Soft delete (mark inactive)
- [ ] Confirmation dialog appears
- [ ] Product marked as inactive
- [ ] Can reactivate product

### **Customer Master (`/master` → Customers Tab)**

**CREATE Operations:**
- [ ] Add new customer
- [ ] Enter customer name
- [ ] Enter phone number (required)
- [ ] Enter email (optional)
- [ ] Enter address details
- [ ] Set customer type (Retail/Wholesale)
- [ ] Set price level (A/B/C)
- [ ] Set credit limit
- [ ] Enter opening balance
- [ ] Enter GST number (for B2B)
- [ ] Customer saves successfully

**READ Operations:**
- [ ] Customer list displays
- [ ] Search by name/phone works
- [ ] Filter by type works
- [ ] View customer details
- [ ] Purchase history visible
- [ ] Outstanding balance shown

**UPDATE Operations:**
- [ ] Edit customer details
- [ ] Update credit limit
- [ ] Modify contact information
- [ ] Changes save successfully

**DELETE Operations:**
- [ ] Mark customer inactive
- [ ] Confirmation required
- [ ] Customer data preserved

### **Supplier Master (`/master` → Suppliers Tab)**

**CREATE Operations:**
- [ ] Add new supplier
- [ ] Enter company name
- [ ] Enter contact person
- [ ] Enter phone/email
- [ ] Enter address
- [ ] Enter GST number
- [ ] Add bank details
- [ ] Set opening balance
- [ ] Supplier saves successfully

**READ Operations:**
- [ ] Supplier list displays
- [ ] Search functionality works
- [ ] View supplier details
- [ ] Outstanding balance shown

**UPDATE & DELETE:**
- [ ] Edit supplier details
- [ ] Update bank information
- [ ] Mark inactive

### **Category Master (`/master` → Categories Tab)**

- [ ] Create main category
- [ ] Create subcategory
- [ ] Set HSN code
- [ ] Set default GST rate
- [ ] Hierarchical tree displays
- [ ] Edit categories
- [ ] Delete (mark inactive)

### **Brand Management (`/master` → Brands Tab)**

- [ ] Add brand (e.g., SBL, Schwabe, Bakson)
- [ ] View brand list
- [ ] Edit brand details
- [ ] Mark inactive

### **Unit Master (`/master` → Units Tab)**

- [ ] Add unit (e.g., Tablets, Bottles, ML)
- [ ] Set short name
- [ ] Set conversion factor
- [ ] Base unit relationship
- [ ] Edit units
- [ ] Mark inactive

### **Tax Master (`/master` → Taxes Tab)**

- [ ] Add tax rate (5%, 12%, 18%)
- [ ] Set HSN code mapping
- [ ] Composite tax setup
- [ ] Edit tax rates
- [ ] Mark inactive

---

## 📋 PHASE 3: BUSINESS OPERATIONS TESTING

### **Inventory Management (`/inventory`)**

**Dashboard Tab:**
- [ ] Total inventory value shown
- [ ] Total products count
- [ ] Low stock alerts displayed
- [ ] Expiring items shown
- [ ] Stock by category chart
- [ ] Stock by brand chart

**Batch-Wise Tab:**
- [ ] All batches listed
- [ ] Batch details visible (number, expiry, qty)
- [ ] Filter by product works
- [ ] Filter by warehouse works
- [ ] Search functionality works
- [ ] Expiring batches highlighted

**Search Tab:**
- [ ] Search by product name
- [ ] Search by batch number
- [ ] Search by barcode
- [ ] Results display correctly
- [ ] Stock levels accurate

**Valuation Tab:**
- [ ] FIFO valuation works
- [ ] LIFO valuation works
- [ ] Average cost calculation
- [ ] Total inventory value correct
- [ ] Export to CSV works

**Stock Adjustment:**
- [ ] Create adjustment entry
- [ ] Select product
- [ ] Select batch
- [ ] Enter quantity change
- [ ] Add reason/notes
- [ ] Adjustment saves
- [ ] Stock updated correctly

**CSV Import:**
- [ ] Download template
- [ ] Upload CSV file
- [ ] Data validation works
- [ ] Import successful
- [ ] Stock updated

### **Sales Operations (`/sales`)**

**Retail Sales:**
- [ ] Create new retail sale
- [ ] Select customer
- [ ] Add products to cart
- [ ] Select batch for each product
- [ ] Quantity validation works
- [ ] Price calculation correct
- [ ] Apply discount (%)
- [ ] Apply discount (amount)
- [ ] GST calculation correct
- [ ] CGST/SGST split (intra-state)
- [ ] IGST (inter-state)
- [ ] Round-off calculation
- [ ] Select payment method
- [ ] Print invoice
- [ ] Save sale successfully
- [ ] Stock reduced correctly

**Wholesale Sales:**
- [ ] Create wholesale sale
- [ ] Wholesale price applied
- [ ] Multi-tier pricing works (A/B/C)
- [ ] Bulk discount applies
- [ ] All other features work

**Sales Returns:**
- [ ] Select original invoice
- [ ] Select items to return
- [ ] Validate return quantity
- [ ] Credit note generated
- [ ] Stock increased
- [ ] Payment reversed/adjusted

**Invoice Upload (AI OCR):**
- [ ] Upload invoice image/PDF
- [ ] AI extracts data
- [ ] Data pre-filled in form
- [ ] User can edit
- [ ] Save invoice

**Sales Reports:**
- [ ] Daily sales summary
- [ ] Monthly sales report
- [ ] Customer-wise sales
- [ ] Product-wise sales
- [ ] Export to Excel/PDF

### **Purchase Operations (`/purchases`)**

**Purchase Order:**
- [ ] Create new PO
- [ ] Select supplier
- [ ] Add products
- [ ] Enter quantities
- [ ] Set purchase price
- [ ] Calculate total
- [ ] Save as draft
- [ ] Submit for approval
- [ ] Email to supplier

**GRN (Goods Receipt Note):**
- [ ] Select PO
- [ ] Mark received items
- [ ] Enter batch details
- [ ] Enter manufacturing date
- [ ] Enter expiry date
- [ ] Record rack location
- [ ] Generate GRN
- [ ] Stock increased correctly

**Purchase Approval:**
- [ ] View pending POs
- [ ] Review PO details
- [ ] Approve PO
- [ ] Reject with reason
- [ ] Notification sent

**Supplier Payment:**
- [ ] Record payment
- [ ] Select invoices
- [ ] Enter amount
- [ ] Select payment method
- [ ] Add reference number
- [ ] Outstanding updated

### **Customer Management (`/customers`)**

**Customer List:**
- [ ] All customers displayed
- [ ] Search by name/phone
- [ ] Filter by type
- [ ] Outstanding balance shown
- [ ] Total purchases visible

**Customer Details:**
- [ ] View full customer profile
- [ ] Purchase history shown
- [ ] Outstanding invoices listed
- [ ] Payment history visible
- [ ] Loyalty points shown

**Customer Actions:**
- [ ] Add new customer
- [ ] Edit customer
- [ ] Record payment
- [ ] Apply loyalty points
- [ ] Send statement via email
- [ ] Export customer data

---

## 📋 PHASE 4: ADVANCED FEATURES TESTING

### **Marketing Campaigns (`/marketing`)**

**WhatsApp Campaign:**
- [ ] Create campaign
- [ ] Enter campaign name
- [ ] Select contacts/segment
- [ ] Write message
- [ ] Add template variables
- [ ] Preview message
- [ ] Schedule campaign
- [ ] Send immediately
- [ ] Track delivery status

**SMS Campaign:**
- [ ] Create SMS campaign
- [ ] Select contacts
- [ ] Write SMS (160 chars)
- [ ] Check character count
- [ ] Send campaign
- [ ] Track delivery

**Email Campaign:**
- [ ] Create email campaign
- [ ] Select contacts
- [ ] Write subject
- [ ] Write HTML body
- [ ] Add attachments
- [ ] Preview email
- [ ] Send campaign
- [ ] Track opens/clicks

**Contact Management:**
- [ ] Import contacts from CSV
- [ ] Add contact manually
- [ ] Edit contact details
- [ ] Create segments
- [ ] Tag contacts
- [ ] Export contacts

**Campaign Analytics:**
- [ ] View sent campaigns
- [ ] Delivery rate shown
- [ ] Open rate shown
- [ ] Click rate shown
- [ ] Response tracking

### **Prescription Management (`/prescriptions`)**

**Create Prescription:**
- [ ] Select patient/customer
- [ ] Add doctor details
- [ ] Add medicines
- [ ] Enter dosage
- [ ] Set duration
- [ ] Add notes
- [ ] Save prescription
- [ ] Print prescription

**Refill Reminders:**
- [ ] View upcoming refills
- [ ] Send reminder (WhatsApp/SMS)
- [ ] Mark as refilled
- [ ] Automatic reminders work

**Prescription History:**
- [ ] View all prescriptions
- [ ] Search by patient
- [ ] Search by doctor
- [ ] Filter by date
- [ ] View prescription details

### **Loyalty Program (`/loyalty`)**

**Dashboard:**
- [ ] Total enrolled members
- [ ] Points issued
- [ ] Points redeemed
- [ ] Active tier breakdown

**Customer Loyalty:**
- [ ] View customer points
- [ ] Add points manually
- [ ] Redeem points
- [ ] Points history visible
- [ ] Tier upgrade automatic

**Loyalty Tiers:**
- [ ] View tier configuration
- [ ] Edit tier settings
- [ ] Set points threshold
- [ ] Set tier benefits
- [ ] Set discount percentage

**Settings:**
- [ ] Points per rupee
- [ ] Expiry duration
- [ ] Minimum redemption
- [ ] Welcome bonus
- [ ] Birthday bonus

### **Reports (`/reports`)**

**Sales Reports:**
- [ ] Daily sales report
- [ ] Date range selection
- [ ] Product-wise sales
- [ ] Customer-wise sales
- [ ] Payment method breakdown
- [ ] GST summary
- [ ] Export to Excel/PDF

**Purchase Reports:**
- [ ] Supplier-wise purchases
- [ ] Product-wise purchases
- [ ] Date range filter
- [ ] Payment status
- [ ] Export report

**Inventory Reports:**
- [ ] Stock summary
- [ ] Low stock report
- [ ] Dead stock report
- [ ] Fast-moving items
- [ ] Slow-moving items
- [ ] Stock valuation

**Customer Reports:**
- [ ] Customer ledger
- [ ] Outstanding report
- [ ] Customer statement
- [ ] Top customers
- [ ] Purchase frequency

**Expiry Reports:**
- [ ] Expiring in 30 days
- [ ] Expiring in 60 days
- [ ] Expiring in 90 days
- [ ] Expired items
- [ ] Batch-wise expiry

### **GST Compliance (`/gst`)**

- [ ] GSTR-1 data preparation
- [ ] B2B invoices listed
- [ ] B2C summary calculated
- [ ] HSN summary generated
- [ ] Export to JSON/Excel
- [ ] GSTR-3B calculation
- [ ] Input tax credit
- [ ] Output tax calculation

### **Daily Billing (`/daily-register`)**

**Cash Register:**
- [ ] Day opening entry
- [ ] Cash in hand
- [ ] Sales summary
- [ ] Payment breakdown (Cash/Card/UPI)
- [ ] Expenses entry
- [ ] Day closing
- [ ] Cash variance tracking
- [ ] Daily report generation

### **Settings (`/settings`)**

**Company Settings:**
- [ ] Update company name
- [ ] Update address
- [ ] Update phone/email
- [ ] Upload logo
- [ ] GST number
- [ ] Bank details
- [ ] Invoice settings

**User Management:**
- [ ] Add new user
- [ ] Assign role
- [ ] Set permissions
- [ ] Edit user
- [ ] Deactivate user

**Email Configuration:**
- [ ] SMTP settings
- [ ] Test email
- [ ] Email templates

**WhatsApp Settings:**
- [ ] API configuration
- [ ] Template management
- [ ] Test WhatsApp

---

## 📋 PHASE 5: END-TO-END WORKFLOWS

### **Workflow 1: New Product to Sale**

**Steps:**
1. [ ] Add new product in master
2. [ ] Create purchase order
3. [ ] Receive goods (GRN)
4. [ ] Verify stock in inventory
5. [ ] Create retail sale
6. [ ] Select product with batch
7. [ ] Complete payment
8. [ ] Print invoice
9. [ ] Verify stock reduced

**Expected Result:** Complete flow works without errors

### **Workflow 2: Customer Journey**

**Steps:**
1. [ ] Register new customer
2. [ ] Enroll in loyalty program
3. [ ] Create first sale
4. [ ] Award loyalty points
5. [ ] Customer makes second purchase
6. [ ] Redeem loyalty points
7. [ ] Check purchase history
8. [ ] Send marketing campaign

**Expected Result:** All customer features work

### **Workflow 3: Purchase to Payment**

**Steps:**
1. [ ] Create purchase order
2. [ ] Get approval
3. [ ] Receive goods (GRN)
4. [ ] Verify inventory updated
5. [ ] Record supplier invoice
6. [ ] Make payment
7. [ ] Check outstanding cleared

**Expected Result:** Purchase cycle complete

### **Workflow 4: Sales Return**

**Steps:**
1. [ ] Create original sale
2. [ ] Customer returns item
3. [ ] Process return
4. [ ] Generate credit note
5. [ ] Verify stock increased
6. [ ] Process refund
7. [ ] Check ledger updated

**Expected Result:** Return handled correctly

### **Workflow 5: Marketing Campaign**

**Steps:**
1. [ ] Import customer contacts
2. [ ] Create segment (e.g., "Active customers")
3. [ ] Create WhatsApp campaign
4. [ ] Schedule for specific time
5. [ ] Monitor delivery status
6. [ ] Check analytics
7. [ ] Track responses

**Expected Result:** Campaign reaches customers

---

## 🔍 DATA VALIDATION CHECKS

### **Stock Accuracy:**
- [ ] Physical stock = System stock
- [ ] Batch quantities correct
- [ ] Expiry dates accurate
- [ ] Valuation matches

### **Financial Accuracy:**
- [ ] Sales total = Payment total
- [ ] Purchase total = Supplier payable
- [ ] Customer outstanding correct
- [ ] GST calculations accurate

### **Master Data Integrity:**
- [ ] No duplicate products
- [ ] No orphan records
- [ ] Relationships intact
- [ ] Active/inactive flags correct

---

## 🚨 CRITICAL BUSINESS RULES TO VERIFY

### **Inventory Rules:**
- [ ] Cannot sell more than available stock
- [ ] Batch expiry validation on sale
- [ ] Negative stock prevented
- [ ] Stock reservation on order

### **Pricing Rules:**
- [ ] Retail price > Purchase price
- [ ] Wholesale price < Retail price
- [ ] Price level A > B > C
- [ ] Discount within limits

### **GST Rules:**
- [ ] Correct CGST/SGST for intra-state
- [ ] Correct IGST for inter-state
- [ ] HSN code mandatory
- [ ] Tax rate validation

### **Credit Rules:**
- [ ] Credit limit enforced
- [ ] Outstanding tracked correctly
- [ ] Payment allocation correct
- [ ] Credit period validation

---

## 📊 PERFORMANCE TESTING

### **Page Load Times:**
- [ ] Dashboard loads < 2 seconds
- [ ] Product list loads < 3 seconds
- [ ] Reports generate < 5 seconds
- [ ] Search results < 1 second

### **Large Data Sets:**
- [ ] 1000+ products handled
- [ ] 10000+ invoices handled
- [ ] 5000+ customers handled
- [ ] Pagination works smoothly

### **Concurrent Users:**
- [ ] Multiple users can work simultaneously
- [ ] No data conflicts
- [ ] Stock updates synchronized

---

## ✅ SIGN-OFF CHECKLIST

- [ ] All 37 pages tested
- [ ] All CRUD operations verified
- [ ] All business workflows work
- [ ] All reports generate correctly
- [ ] All integrations functional
- [ ] Data integrity verified
- [ ] Performance acceptable
- [ ] Security validated
- [ ] User training completed
- [ ] Documentation reviewed

---

## 📝 TESTING LOG TEMPLATE

```
Feature: _________________
Tester: _________________
Date: ___________________
Status: [ ] Pass [ ] Fail

Test Steps:
1. 
2. 
3. 

Expected Result:


Actual Result:


Issues Found:


Notes:
```

---

**Next Steps After Testing:**
1. Fix any issues found
2. Retest failed items
3. Document edge cases
4. Create user guides
5. Deploy to production

---

**Testing Priority:**
1. **HIGH:** Sales, Inventory, Purchase (Core business)
2. **MEDIUM:** Customer, Reports, Master Data
3. **LOW:** Marketing, Loyalty, Settings

**Estimated Testing Time:** 5-6 hours total
