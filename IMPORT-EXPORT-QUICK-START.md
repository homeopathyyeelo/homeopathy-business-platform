# 🚀 Product Import/Export - Quick Start Guide

## 📥 How to Import Products

### Step 1: Download Template
1. Visit: `http://localhost:3000/products/import-export`
2. Click **"Download Template"** button
3. Save as `Template_File_Medicine_Product_List.csv`

### Step 2: Fill Template
The template includes sample homeopathy products:
- **Arnica Montana 30C** (SBL, Dilution, Liquid, 10ml)
- **Belladonna 200C** (Dr. Reckeweg, Dilution)
- **Calcarea Carbonica 30C** (Allen, Globules)
- **Chamomilla Q** (Schwabe, Mother Tincture)

**Required Fields**: SKU, Name  
**Optional Fields**: All others

### Step 3: Upload File
1. Click **"Select File"** or drag & drop
2. Supported formats: `.csv`, `.xlsx`, `.xls`
3. Max file size: **10MB**
4. Watch real-time progress bar

### Step 4: View Results
See detailed statistics:
- ✅ **Total Rows**: Number of products in file
- ✅ **Inserted**: New products added
- ✅ **Updated**: Existing products updated (by SKU)
- ✅ **Skipped**: Failed validations
- ✅ **Success Rate**: Percentage successful
- ⏱️ **Processing Time**: Time taken

---

## 📤 How to Export Products

### Option 1: From UI
1. Visit: `http://localhost:3000/products/import-export`
2. Go to **"Export Products"** tab
3. Click **"Export CSV"** button
4. File downloads as `products_export_YYYYMMDD_HHMMSS.csv`

### Option 2: Direct API
```bash
curl -o my_products.csv http://localhost:3005/api/erp/products/export
```

---

## 🎯 Template Format

### CSV Structure
```csv
SKU,Name,Category,Type,Brand,Potency,Form,Pack Size,UOM,Cost Price,Selling Price,MRP,Tax Percent,HSN Code,Manufacturer,Description,Barcode,Reorder Level,Min Stock,Max Stock,Current Stock,Is Active,Tags
ARM-30C-10ML,Arnica Montana 30C,Dilutions,Medicine,SBL,30C,Liquid,10ml,ml,45.00,75.00,85.00,18.00,30049014,SBL Pvt Ltd,Homeopathic dilution for bruises,8901234567890,20,10,500,100,true,trauma;bruising
```

### Homeopathy-Specific Fields

**Potency Options**:
- `30C`, `200C`, `1M`, `10M`, `50M`, `CM` (Centesimal)
- `6X`, `12X`, `30X` (Decimal)
- `Q` or `0/1` to `0/30` (LM/Q potencies)

**Form Options**:
- Liquid, Globules, Tablets, Drops, Ointment, Cream, Gel, Spray

**Category Options**:
- Dilutions, Mother Tincture, Biochemic, Patent Medicines, Ointments

**Brand Examples**:
- SBL, Dr. Reckeweg, Allen, Schwabe, Boiron, Hahnemann

**Common HSN Code**: `30049014` (Homeopathic medicines)

**Tax Percent**: `18%` (standard GST for medicines in India)

---

## ⚡ Quick Tips

### ✅ Do's
- ✅ Always fill **SKU** and **Name** (required)
- ✅ Use unique SKUs (duplicate SKUs will update existing)
- ✅ Use semicolons for multiple tags: `pain;fever;cold`
- ✅ Keep file size under 10MB
- ✅ Use proper decimal format: `45.00` not `45,00`

### ❌ Don'ts
- ❌ Don't leave SKU or Name empty
- ❌ Don't use commas in numbers: `1,234` → use `1234`
- ❌ Don't exceed 10MB file size
- ❌ Don't use unsupported formats (PDF, DOC, etc.)

---

## 🐛 Common Issues

### Issue: "file too large"
**Solution**: Split into multiple files < 10MB each

### Issue: "Row X: SKU is required"
**Solution**: Add SKU value in that row

### Issue: "Row X: duplicate entry"
**Note**: This is OK! It will UPDATE the existing product

### Issue: "unsupported file format"
**Solution**: Save as CSV, XLSX, or XLS only

---

## 📊 Sample Data

Copy this into your CSV file:

```csv
SKU,Name,Category,Type,Brand,Potency,Form,Pack Size,UOM,Cost Price,Selling Price,MRP,Tax Percent,HSN Code,Manufacturer,Is Active
NUX-30C,Nux Vomica 30C,Dilutions,Medicine,SBL,30C,Liquid,10ml,ml,35.00,65.00,75.00,18.00,30049014,SBL Pvt Ltd,true
PUL-200C,Pulsatilla 200C,Dilutions,Medicine,Reckeweg,200C,Globules,10g,gm,55.00,95.00,110.00,18.00,30049014,Dr. Reckeweg,true
CALC-PHOS-6X,Calcarea Phosphorica 6X,Biochemic,Medicine,SBL,6X,Tablets,25g,gm,65.00,110.00,125.00,18.00,30049014,SBL Pvt Ltd,true
```

---

## 🎉 Success Example

**Upload**: 100 products  
**Result**:
- ✅ Inserted: 85 new products
- ✅ Updated: 10 existing products
- ⚠️ Skipped: 5 (validation errors)
- 📈 Success Rate: **95%**
- ⏱️ Processing Time: **1.2s**

---

## 🔗 API Endpoints

For developers:

```bash
# Download template
GET http://localhost:3005/api/erp/products/template

# Import products
POST http://localhost:3005/api/erp/products/import
Content-Type: multipart/form-data
Body: file=@products.csv

# Export products
GET http://localhost:3005/api/erp/products/export
```

---

## 📞 Need Help?

1. Check error messages in import results
2. Download fresh template
3. Verify SKU and Name are filled
4. Ensure file format is CSV/XLSX/XLS
5. Check file size is under 10MB

---

**Ready to import?** Visit: `http://localhost:3000/products/import-export` 🚀
