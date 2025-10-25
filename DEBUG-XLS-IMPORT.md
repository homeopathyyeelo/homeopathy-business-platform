# Debug XLS Import Issue

## Problem
All rows showing "SKU is required" error even though SKU column exists in the Excel file.

Error message: `[Row 2099] ⚠️ Row 2099: Row 2: SKU is required`

## Debug Steps Added

### 1. Column Detection Log
```
📋 Detected columns: [SKU, Name, Potency, Size, Qty]
```
This shows which columns were successfully parsed from the header row.

### 2. First Row Sample Log
```
🔍 First row sample (length=6): [100A11 Acid fluor.  CM 11ml 500]
```
This shows:
- How many columns the first data row has
- What values are in each column
- Whether empty columns are being handled correctly

### 3. Row Padding
Added automatic padding to ensure all rows have the same column count as the header:
```go
// Ensure row has same length as header (pad if needed)
if len(row) < len(header) {
    padding := make([]string, len(header)-len(row))
    row = append(row, padding...)
}
```

## Test Now

### 1. Rebuild Complete ✅
The service has been rebuilt with debug logging.

### 2. Start Services
```bash
# Terminal 1 - API
cd /var/www/homeopathy-business-platform/services/api-golang-v2
./bin/api

# Terminal 2 - Frontend
cd /var/www/homeopathy-business-platform
npm run dev
```

### 3. Upload Template File
- Go to: http://localhost:3000/products/import-export
- Upload: `Template_File_Medicine_Product_List.xls`
- Watch the logs carefully for:
  ```
  📁 File uploaded successfully
  🔍 Parsing file...
  📋 Detected columns: [...]  ← What columns were found?
  🔍 First row sample (length=X): [...]  ← What's in first row?
  ✅ Found XXXX products to import
  ```

## Expected Debug Output

### If Columns Are Detected Correctly:
```
📋 Detected columns: [SKU Name Potency Size Qty]
🔍 First row sample (length=5): [100A11 Acid fluor. CM 11ml 500]
✅ Row 2: Created 'Acid fluor.' (SKU: 100A11)
```

### If Columns Are NOT Detected:
```
📋 Detected columns: []  ← Empty!
🔍 First row sample (length=0): []  ← Empty!
⚠️ Row 2: SKU is required  ← Because no columns mapped
```

## Possible Issues

### Issue 1: Old .XLS Format
The file is in old Excel format (.xls, not .xlsx). The `excelize` library might not handle it properly.

**Solution:** Convert to .xlsx format:
```bash
# Using LibreOffice (if installed)
libreoffice --headless --convert-to xlsx Template_File_Medicine_Product_List.xls
```

### Issue 2: Empty Header Row
If the first row is empty or doesn't contain column names, the parser won't find any columns.

**Check:** Look at the debug log for "Detected columns: []"

### Issue 3: Special Characters in Headers
If column names have special characters or encoding issues, they might not match.

**Check:** Look at the debug log to see exact column names detected.

### Issue 4: Multiple Sheets
If the Excel file has multiple sheets and data is not on the first sheet.

**Check:** The parser only reads the first sheet.

## Quick Fix Options

### Option 1: Convert to XLSX
```bash
# Save your .xls file as .xlsx in Excel
# Or use LibreOffice:
libreoffice --convert-to xlsx Template_File_Medicine_Product_List.xls
```

### Option 2: Export to CSV
```bash
# In Excel: File → Save As → CSV
# Then upload the CSV file instead
```

### Option 3: Check File Structure
Open the file in Excel and verify:
- ✅ First row has column headers: SKU, Name, etc.
- ✅ Second row has actual data
- ✅ No merged cells in header row
- ✅ No empty rows at the top

## What to Share

After uploading, share the debug logs showing:
1. What columns were detected
2. What the first row sample looks like
3. The exact error message

Example:
```
📋 Detected columns: [SKU Name Potency]
🔍 First row sample (length=3): [100A11 Acid fluor. CM]
⚠️ Row 2: SKU is required
```

This will help identify if it's:
- A parsing issue (no columns detected)
- A mapping issue (columns detected but not matching)
- A data issue (columns correct but data missing)

## Next Steps

1. ✅ Start the services
2. ✅ Upload the file
3. ✅ Check the debug logs
4. ✅ Share the output here

Based on the debug output, we can determine the exact issue and fix it!

---

**Status**: Debug logging added, ready to test  
**File**: Template_File_Medicine_Product_List.xls  
**Expected**: Debug logs will show column detection and first row data
