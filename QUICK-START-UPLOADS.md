# 🚀 Quick Start - Purchase & Inventory Upload System

## Initial Setup (One-Time)

```bash
# Run the setup script
./scripts/setup-upload-system.sh
```

This creates all necessary database tables for the upload system.

---

## 📦 Purchase Upload Workflow

### 1. Prepare Your Data
Download template: http://localhost:3000/templates/Template_Purchase_Upload.csv

### 2. Fill the CSV
Example row:
```csv
GC10943,2025-01-15,YEELO HOMOEOPATHY GURGAON,06BUAPG3815Q1ZH,0001973,SBL DILUTION 200,SBL,200,30ML,DILUTION,30049014,N5,2026-12-31,71,64.00,130.00,0,5,4544.00
```

### 3. Upload
- Go to: http://localhost:3000/purchases/upload
- Upload your CSV file
- System will automatically:
  - Match products by SKU
  - Calculate totals
  - Validate data
  - Create approval request

### 4. Approval (Super User)
- Go to: http://localhost:3000/admin/approvals
- Review the upload details
- Click "Approve" to import data
- System will:
  - Create/update vendors
  - Create purchase orders
  - Update product stock
  - Create inventory batches

---

## 📊 Inventory Upload Workflow

### 1. Prepare Your Data
Download template: http://localhost:3000/templates/Template_Inventory_Upload.csv

### 2. Fill the CSV
Example row:
```csv
0001973,SBL DILUTION 200,SBL,200,30ML,DILUTION,N5,2026-12-31,71,64.00,100.00,130.00,Main Warehouse,Section A,A1
```

### 3. Upload
- Go to: http://localhost:3000/inventory/upload
- Upload your CSV file
- System will match products and prepare for approval

### 4. Approval (Super User)
- Go to: http://localhost:3000/admin/approvals
- Review and approve
- Stock quantities will be updated automatically

---

## 🔑 Key Features

✅ **Automatic Product Matching**
- Exact SKU match (priority)
- Fuzzy name matching (fallback)
- Manual review for unmatched

✅ **Data Validation**
- CSV format validation
- Product existence checks
- Amount calculations
- Error flagging

✅ **Approval Workflow**
- Super user review required
- View detailed upload summary
- Approve or reject with reason
- Audit trail maintained

✅ **Smart Import**
- Transaction-based (all or nothing)
- Automatic vendor creation
- Purchase order generation
- Stock synchronization
- Batch tracking with expiry

---

## 📍 Page URLs

| Page | URL | Purpose |
|------|-----|---------|
| Purchase Upload | `/purchases/upload` | Upload purchase CSV |
| Inventory Upload | `/inventory/upload` | Upload inventory CSV |
| Approval Dashboard | `/admin/approvals` | Review & approve uploads |
| Products List | `/products` | View all products |

---

## 💡 Tips

1. **Always use the templates** - Download fresh templates before each upload
2. **Check product codes** - Ensure SKUs match your database
3. **One invoice per upload** - Group items by invoice number
4. **Verify amounts** - System calculates but double-check totals
5. **Review before approving** - Check matched/unmatched counts

---

## 🐛 Troubleshooting

**Problem**: Products not matching
- **Fix**: Check SKU codes in database (`SELECT sku FROM products;`)
- **Alternative**: System will flag for manual review

**Problem**: Upload stuck in pending
- **Fix**: Check approval dashboard, may need super user action

**Problem**: CSV parsing errors
- **Fix**: Ensure CSV uses comma delimiters, no extra commas in data

**Problem**: Amounts don't match
- **Fix**: Verify calculation columns: Quantity × Unit Price + Tax - Discount

---

## 📞 Quick Commands

```bash
# Check pending approvals
psql $DATABASE_URL -c "SELECT * FROM upload_sessions WHERE approval_status='pending';"

# View upload logs
psql $DATABASE_URL -c "SELECT * FROM upload_logs ORDER BY created_at DESC LIMIT 10;"

# Check matched products count
psql $DATABASE_URL -c "SELECT session_id, COUNT(*) as matched FROM upload_items WHERE matched_product_id IS NOT NULL GROUP BY session_id;"
```

---

**Ready to start? Run the setup script and visit `/purchases/upload`!** 🎉
