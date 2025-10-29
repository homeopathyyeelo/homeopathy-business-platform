# 📄 CSV Upload Format Guide

The system supports **TWO CSV formats** for purchase uploads:

---

## Format 1: Marg ERP Export (Auto-Detected)

### ✅ What You Have
Your actual Marg ERP CSV export file looks like this:

```csv
H,1,GC10943,08102025,,00000000,,1,,08102025,,,08102025,06-HARYANA,0,0,,0,,,,,,,,,S,,BVEV,,YEELO HOMOEOPATHY GURGAON,8527672265,06BUAPG3815Q1ZH,...
T,OIF,SBL (DILUTION),0001973,,SBL DILUTION 200,30ML,,N5,00000000,,,5,0,130,,130,,0,,71,0,64,6065.37,4.76,3164.63,158.23,0,0,G,...
T,OIF,SBL (DILUTION),0001972,,SBL DILUTION 30,30ML,,N5,00000000,,,5,0,110,,110,,0,,44,0,64,3180.54,4.76,1659.46,82.97,0,0,G,...
F,46271,51477.28,0,0,0,0,,0,2203.37,
```

### How It Works
- **H** = Header line with invoice and supplier info
- **T** = Transaction (item) lines  
- **F** = Footer with totals

### ✨ Just Upload It!
**No conversion needed!** Our system:
1. Auto-detects Marg ERP format
2. Extracts invoice number, date, supplier details
3. Parses all product lines
4. Calculates totals
5. Ready for approval!

### Field Mapping (Marg ERP → Our System)

| Marg Position | Description | Maps To |
|---------------|-------------|---------|
| H[2] | Invoice Number (GC10943) | Invoice Number |
| H[3] | Invoice Date (08102025) | Invoice Date (YYYY-MM-DD) |
| H[30] | Supplier Name | Supplier Name |
| H[32] | Supplier GSTIN | Supplier GSTIN |
| T[3] | Product Code (0001973) | Product Code |
| T[5] | Product Name | Product Name |
| T[2] | Brand (SBL DILUTION) | Brand |
| T[6] | Size (30ML) | Size |
| T[8] | Batch Number (N5) | Batch Number |
| T[20] | Quantity (71) | Quantity |
| T[22] | Unit Price (64) | Unit Price |
| T[14]/T[16] | MRP (130) | MRP |
| T[24] | Tax % (4.76) | Tax % |
| T[39] | HSN Code (30049014) | HSN Code |

---

## Format 2: Simple CSV Template (Manual Entry)

### When to Use
- Creating invoices manually
- Supplier doesn't use Marg ERP
- Testing the system
- Simple data entry

### Template Format
Download from: `/templates/Template_Purchase_Upload.csv`

```csv
Invoice Number,Invoice Date,Supplier Name,Supplier GSTIN,Product Code,Product Name,Brand,Potency,Size,Form,HSN Code,Batch Number,Expiry Date,Quantity,Unit Price,MRP,Discount %,Tax %,Total Amount
GC10943,2025-01-15,YEELO HOMOEOPATHY GURGAON,06BUAPG3815Q1ZH,0001973,SBL DILUTION 200,SBL,200,30ML,DILUTION,30049014,N5,2026-12-31,71,64.00,130.00,0,5,4544.00
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Invoice Number** | ✅ Yes | Unique invoice number | GC10943 |
| **Invoice Date** | ✅ Yes | Format: YYYY-MM-DD | 2025-01-15 |
| **Supplier Name** | ✅ Yes | Vendor name | YEELO HOMOEOPATHY |
| **Supplier GSTIN** | ❌ No | 15-digit GST number | 06BUAPG3815Q1ZH |
| **Product Code** | ✅ Yes | SKU/Product code | 0001973 |
| **Product Name** | ✅ Yes | Full product name | SBL DILUTION 200 |
| **Brand** | ✅ Yes | Brand name | SBL |
| **Potency** | ❌ No | Potency | 200, 30, 1M, Q |
| **Size** | ✅ Yes | Pack size | 30ML, 100ML |
| **Form** | ✅ Yes | Medicine form | DILUTION, PATENT |
| **HSN Code** | ✅ Yes | HSN/SAC code | 30049014 |
| **Batch Number** | ✅ Yes | Batch/Lot number | N5, HL240671 |
| **Expiry Date** | ✅ Yes | Format: YYYY-MM-DD | 2026-12-31 |
| **Quantity** | ✅ Yes | Number of units | 71 |
| **Unit Price** | ✅ Yes | Price per unit | 64.00 |
| **MRP** | ✅ Yes | Maximum retail price | 130.00 |
| **Discount %** | ❌ No | Discount percentage | 0, 5, 10 |
| **Tax %** | ✅ Yes | GST percentage | 5, 12, 18 |
| **Total Amount** | ✅ Yes | Line total | 4544.00 |

---

## 🚀 Upload Process

### Step 1: Prepare Your File

**Option A - Marg ERP Users:**
```bash
# Export from Marg ERP (standard export)
# Upload directly - no changes needed!
```

**Option B - Manual Entry:**
```bash
# Download template
# Fill in your data
# Save as CSV
```

### Step 2: Upload

1. Go to: http://localhost:3000/purchases/upload
2. Click "Upload" or drag & drop your CSV
3. System auto-detects format
4. View upload summary

### Step 3: Review

- ✅ **Matched Products**: Products found in database
- ⚠️ **Unmatched Products**: Need manual review
- ❌ **Errors**: Invalid data

### Step 4: Approval

Super user reviews and approves:
- http://localhost:3000/admin/approvals

### Step 5: Import Complete!

System automatically:
- Creates/updates vendors
- Generates purchase orders
- Updates product stock
- Creates inventory batches

---

## 🔍 Product Matching

### Matching Logic

1. **Exact SKU Match** (100% confidence)
   ```
   CSV Product Code = Database SKU
   ```

2. **Fuzzy Name Match** (70% confidence)
   ```
   CSV Product Name ≈ Database Product Name
   ```

3. **Manual Review** (0% confidence)
   ```
   Product not found → Flag for admin
   ```

### Improving Match Rate

✅ **Keep SKUs consistent** in your database
✅ **Use standard product names**
✅ **Pre-create products** before uploading
❌ Don't use special characters in SKUs
❌ Don't change product codes frequently

---

## 📊 Example: Complete Invoice

### Your Marg ERP File
```
KHANDELWAL_HOMOEO_STORE_20251008_S_GC10943.CSV
```

**Contains:**
- 1 Header (H)
- 42 Items (T)
- 1 Footer (F)
- Invoice: GC10943
- Supplier: YEELO HOMOEOPATHY GURGAON
- Total: ₹51,477.28

### What Happens

1. **Upload** → System detects Marg format
2. **Parse** → Extracts all 42 items
3. **Match** → Finds products in database
4. **Stage** → Creates approval session
5. **Approve** → Super user reviews
6. **Import** → Data saved to system

### Result

✅ Purchase Order created  
✅ 42 products added to inventory  
✅ Batches tracked with expiry  
✅ Stock levels updated  
✅ Vendor record created  

---

## 🐛 Common Issues

### Issue: "Invalid Format"
**Solution**: Check if file is actually CSV (not Excel)

### Issue: "No Products Matched"
**Solution**: Verify product codes exist in database at `/products`

### Issue: "Date Parse Error"
**Solution**: 
- Marg format: Use DDMMYYYY (08102025)
- Simple format: Use YYYY-MM-DD (2025-10-08)

### Issue: "Supplier Not Found"
**Solution**: Don't worry! System auto-creates on approval

---

## 💡 Pro Tips

1. **Always use the actual Marg export** - Don't manually recreate it
2. **Check product list first** - Visit `/products` to see existing SKUs
3. **One invoice per file** - Don't mix multiple invoices (Marg does this automatically)
4. **Keep batch numbers** - Important for expiry tracking
5. **Review before approving** - Check matched/unmatched counts

---

## 📞 Need Help?

**Check your data:**
```bash
# View first few lines of your CSV
head -n 5 your_file.csv

# Check if it's Marg format (should see H, T, F)
grep "^H," your_file.csv
```

**Verify products exist:**
```bash
# Check product by SKU
psql $DATABASE_URL -c "SELECT id, sku, name FROM products WHERE sku='0001973';"
```

---

**Both formats fully supported! Just upload and let the system do the work!** 🎉
