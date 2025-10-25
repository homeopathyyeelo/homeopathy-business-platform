# ❌ ISSUE FOUND: Unsupported File Format

## Problem
```
❌ Error opening file: unsupported workbook file format
```

Your file `Template_File_Medicine_Product_List.xls` is in **old Excel 97-2003 format (.xls)**.

The Go `excelize` library **ONLY supports .xlsx format** (Excel 2007+).

## Solution: Convert .xls to .xlsx

### Option 1: Using LibreOffice (Command Line)
```bash
cd /var/www/homeopathy-business-platform
libreoffice --headless --convert-to xlsx Template_File_Medicine_Product_List.xls
```

This will create: `Template_File_Medicine_Product_List.xlsx`

### Option 2: Using Excel (Manual)
1. Open `Template_File_Medicine_Product_List.xls` in Excel
2. Click **File → Save As**
3. Choose format: **Excel Workbook (*.xlsx)**
4. Save as: `Template_File_Medicine_Product_List.xlsx`

### Option 3: Using Google Sheets
1. Upload the .xls file to Google Sheets
2. Download as: **Microsoft Excel (.xlsx)**

### Option 4: Export as CSV
If conversion fails, export as CSV:
1. Open in Excel
2. **File → Save As → CSV (Comma delimited)**
3. Upload the .csv file instead

## After Conversion

### Test the New File
```bash
# Start API
cd /var/www/homeopathy-business-platform/services/api-golang-v2
./bin/api

# Start Frontend (new terminal)
cd /var/www/homeopathy-business-platform
npm run dev
```

### Upload
- Go to: http://localhost:3000/products/import-export
- Upload the **NEW .xlsx file** (not the old .xls)
- Watch for success:
  ```
  📁 File uploaded successfully
  🔍 Parsing file...
  📋 Detected columns: [SKU Name Potency Size Qty]
  🔍 First row sample: [100A11 Acid fluor. CM 11ml 500]
  ✅ Found 2288 products to import
  ✅ Row 2: Created 'Acid fluor.' (SKU: 100A11)
  ... (all rows importing)
  🎉 Import completed successfully!
  ```

## Why This Happened

### .xls vs .xlsx

| Format | Year | Support |
|--------|------|---------|
| .xls   | 1997-2003 | ❌ NOT supported by excelize |
| .xlsx  | 2007+ | ✅ Fully supported |
| .csv   | Any | ✅ Fully supported |

The `excelize` Go library only supports the modern XML-based `.xlsx` format, not the old binary `.xls` format.

## Quick Command (If LibreOffice Installed)

```bash
cd /var/www/homeopathy-business-platform
libreoffice --headless --convert-to xlsx Template_File_Medicine_Product_List.xls
```

Then upload the new `.xlsx` file!

## Alternative: Update Backend to Support .xls

If you need to support old .xls files, we'd need to:
1. Add a different library (like `github.com/extrame/xls`)
2. Detect file format
3. Use appropriate parser

But **converting to .xlsx is much simpler and recommended**!

---

**Status**: Issue identified - unsupported .xls format  
**Solution**: Convert to .xlsx or .csv  
**Time**: < 1 minute to convert
