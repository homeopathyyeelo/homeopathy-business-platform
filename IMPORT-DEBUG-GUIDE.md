# 🔍 Complete Import Debugging Guide - Step by Step

## For Beginners: How to Debug the Import System

This guide will show you **exactly** what happens when you upload a CSV file, step by step.

---

## 📋 Table of Contents

1. [The Complete Flow](#the-complete-flow)
2. [Step 1: File Selection (Frontend)](#step-1-file-selection-frontend)
3. [Step 2: File Upload (HTTP Request)](#step-2-file-upload-http-request)
4. [Step 3: Backend Receives File](#step-3-backend-receives-file)
5. [Step 4: File Parsing](#step-4-file-parsing)
6. [Step 5: Validation](#step-5-validation)
7. [Step 6: Database Insert](#step-6-database-insert)
8. [Step 7: Response to Frontend](#step-7-response-to-frontend)
9. [How to Debug Each Step](#how-to-debug-each-step)
10. [Common Errors & Solutions](#common-errors--solutions)

---

## The Complete Flow

```
User Browser (Frontend)
    ↓
1. User selects CSV file
    ↓
2. JavaScript reads file
    ↓
3. HTTP POST to backend
    ↓
Backend (Golang API - Port 3005)
    ↓
4. Receive file
    ↓
5. Parse CSV rows
    ↓
6. Validate each row
    ↓
7. Insert to PostgreSQL
    ↓
8. Send response back
    ↓
Frontend (Browser)
    ↓
9. Show results
```

---

## Step 1: File Selection (Frontend)

### 📁 File Location
```
/var/www/homeopathy-business-platform/app/products/import-export/page.tsx
```

### 🔍 What Happens

**Line 1: User clicks "Choose File"**
```tsx
<input
  type="file"
  accept=".csv,.xlsx,.xls"
  onChange={handleFileChange}
  className="..."
/>
```

**Line 2: File is stored in state**
```tsx
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile) {
    setFile(selectedFile);  // ← File stored here
    console.log('📁 File selected:', selectedFile.name);
  }
};
```

### 🐛 How to Debug

**Open Browser Console (F12):**
```javascript
// Check if file is selected
console.log('File:', file);
console.log('File name:', file.name);
console.log('File size:', file.size);
console.log('File type:', file.type);
```

**Expected Output:**
```
📁 File selected: Template_File_Medicine_Product_List.csv
File: File {name: "Template_File_Medicine_Product_List.csv", size: 123456, type: "text/csv"}
```

---

## Step 2: File Upload (HTTP Request)

### 📁 File Location
```
/var/www/homeopathy-business-platform/app/products/import-export/page.tsx
```

### 🔍 What Happens

**Line 1: User clicks "Import Products"**
```tsx
<Button onClick={handleImport}>
  Import Products
</Button>
```

**Line 2: Create FormData**
```tsx
const handleImport = async () => {
  if (!file) {
    alert('Please select a file');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);  // ← File attached here
  
  console.log('📤 Uploading file to backend...');
  
  // Send to backend
  const response = await fetch('http://localhost:3005/api/erp/products/import/stream', {
    method: 'POST',
    body: formData,
  });
};
```

### 🐛 How to Debug

**Open Browser Network Tab (F12 → Network):**

1. Click "Import Products"
2. Look for request: `import/stream`
3. Check:
   - **Request Method**: POST
   - **Request URL**: http://localhost:3005/api/erp/products/import/stream
   - **Request Payload**: Should show the file
   - **Status Code**: 200 (success) or error code

**Console Logs:**
```javascript
console.log('📤 Uploading file:', file.name);
console.log('📤 File size:', file.size, 'bytes');
console.log('📤 Sending to:', 'http://localhost:3005/api/erp/products/import/stream');
```

**Expected Output:**
```
📤 Uploading file: Template_File_Medicine_Product_List.csv
📤 File size: 123456 bytes
📤 Sending to: http://localhost:3005/api/erp/products/import/stream
```

---

## Step 3: Backend Receives File

### 📁 File Location
```
/var/www/homeopathy-business-platform/services/api-golang-v2/internal/handlers/product_import_streaming.go
```

### 🔍 What Happens

**Line 1: Route receives request**
```go
// In cmd/main.go
erp.POST("/products/import/stream", streamingImportHandler.StreamingImport)
```

**Line 2: Handler function starts**
```go
// In product_import_streaming.go - Line 35
func (h *StreamingImportHandler) StreamingImport(c *gin.Context) {
    fmt.Println("🔵 [STEP 1] Import request received")
    
    // Get uploaded file
    file, header, err := c.Request.FormFile("file")
    if err != nil {
        fmt.Println("❌ [ERROR] Failed to get file:", err)
        c.JSON(400, gin.H{"error": "No file uploaded"})
        return
    }
    defer file.Close()
    
    fmt.Println("✅ [STEP 1] File received:", header.Filename)
    fmt.Println("📊 [STEP 1] File size:", header.Size, "bytes")
}
```

### 🐛 How to Debug

**Check Backend Logs:**
```bash
# Open terminal and run:
tail -f logs/api-golang-v2.log

# You should see:
🔵 [STEP 1] Import request received
✅ [STEP 1] File received: Template_File_Medicine_Product_List.csv
📊 [STEP 1] File size: 123456 bytes
```

**Add Debug Logs (if needed):**
```go
// Add these lines in StreamingImport function
fmt.Println("🔵 [DEBUG] Request method:", c.Request.Method)
fmt.Println("🔵 [DEBUG] Request URL:", c.Request.URL.Path)
fmt.Println("🔵 [DEBUG] Content-Type:", c.Request.Header.Get("Content-Type"))
```

---

## Step 4: File Parsing

### 📁 File Location
```
/var/www/homeopathy-business-platform/services/api-golang-v2/internal/handlers/product_import_streaming.go
```

### 🔍 What Happens

**Line 1: Save file temporarily**
```go
// Line 60
tempFile := filepath.Join(os.TempDir(), header.Filename)
out, err := os.Create(tempFile)
if err != nil {
    fmt.Println("❌ [ERROR] Failed to create temp file:", err)
    return
}
defer os.Remove(tempFile)

fmt.Println("✅ [STEP 2] Temp file created:", tempFile)
```

**Line 2: Parse CSV file**
```go
// Line 80
rows, err := h.importHandler.parseCSV(tempFile)
if err != nil {
    fmt.Println("❌ [ERROR] Failed to parse CSV:", err)
    return
}

fmt.Println("✅ [STEP 2] CSV parsed successfully")
fmt.Println("📊 [STEP 2] Total rows:", len(rows))
```

**Line 3: Build column index**
```go
// Line 137
header := rows[0]
colIdx := make(map[string]int)

for i, col := range header {
    normalized := strings.ToLower(strings.TrimSpace(col))
    if normalized != "" {
        colIdx[normalized] = i
        fmt.Println("📋 [STEP 3] Column", i, ":", col, "→", normalized)
    }
}

fmt.Println("✅ [STEP 3] Column mapping complete")
fmt.Println("📊 [STEP 3] Detected columns:", colIdx)
```

### 🐛 How to Debug

**Check Logs:**
```bash
tail -f logs/api-golang-v2.log

# Expected output:
✅ [STEP 2] Temp file created: /tmp/Template_File_Medicine_Product_List.csv
✅ [STEP 2] CSV parsed successfully
📊 [STEP 2] Total rows: 2289 (including header)
📋 [STEP 3] Column 0: SKU → sku
📋 [STEP 3] Column 1: Name → name
📋 [STEP 3] Column 2: Potency → potency
📋 [STEP 3] Column 3: Size → size
📋 [STEP 3] Column 4: Qty → qty
✅ [STEP 3] Column mapping complete
```

**Manual CSV Check:**
```bash
# Check first 5 rows of CSV
head -5 Template_File_Medicine_Product_List.csv

# Expected:
SKU,Name,Potency,Size,Qty
100A11,Acid fluor. ,CM,11ml,500
100A16,Acidum nitricum ,CM,11ml,500
```

---

## Step 5: Validation

### 📁 File Location
```
/var/www/homeopathy-business-platform/services/api-golang-v2/internal/handlers/product_import_streaming.go
```

### 🔍 What Happens

**Line 1: Loop through each row**
```go
// Line 170
for rowNum, row := range rows[1:] {  // Skip header
    lineNum := rowNum + 2  // Line number in file
    
    fmt.Println("🔵 [STEP 4] Processing row", lineNum)
    
    // Parse row data
    product, validationErr := h.parseRow(row, colIdx, lineNum)
    
    if validationErr != "" {
        fmt.Println("❌ [STEP 4] Validation error on row", lineNum, ":", validationErr)
        skipped++
        continue
    }
    
    fmt.Println("✅ [STEP 4] Row", lineNum, "validated:", product.SKU, "-", product.Name)
}
```

**Line 2: parseRow function validates**
```go
// Line 410
func (h *StreamingImportHandler) parseRow(row []string, colIdx map[string]int, lineNum int) (models.ProductImport, string) {
    // Get SKU
    sku := getValue("sku")
    fmt.Println("🔍 [VALIDATE] Row", lineNum, "SKU:", sku)
    
    // Validate SKU
    if sku == "" {
        fmt.Println("❌ [VALIDATE] Row", lineNum, "FAILED: SKU is required")
        return models.ProductImport{}, "SKU is required"
    }
    
    // Get Name
    name := getValue("name")
    fmt.Println("🔍 [VALIDATE] Row", lineNum, "Name:", name)
    
    // Validate Name
    if name == "" {
        fmt.Println("❌ [VALIDATE] Row", lineNum, "FAILED: Name is required")
        return models.ProductImport{}, "Name is required"
    }
    
    fmt.Println("✅ [VALIDATE] Row", lineNum, "PASSED")
    
    // Build product object
    product := models.ProductImport{
        SKU:      sku,
        Name:     name,
        Potency:  getValue("potency"),
        PackSize: getValue("size"),
        // ... other fields
    }
    
    return product, ""
}
```

### 🐛 How to Debug

**Check Logs:**
```bash
tail -f logs/api-golang-v2.log

# Expected output:
🔵 [STEP 4] Processing row 2
🔍 [VALIDATE] Row 2 SKU: 100A11
🔍 [VALIDATE] Row 2 Name: Acid fluor.
✅ [VALIDATE] Row 2 PASSED
✅ [STEP 4] Row 2 validated: 100A11 - Acid fluor.

🔵 [STEP 4] Processing row 3
🔍 [VALIDATE] Row 3 SKU: 100A16
🔍 [VALIDATE] Row 3 Name: Acidum nitricum
✅ [VALIDATE] Row 3 PASSED
✅ [STEP 4] Row 3 validated: 100A16 - Acidum nitricum
```

**If Validation Fails:**
```bash
# You'll see:
🔵 [STEP 4] Processing row 1986
🔍 [VALIDATE] Row 1986 SKU: 
❌ [VALIDATE] Row 1986 FAILED: SKU is required
❌ [STEP 4] Validation error on row 1986: SKU is required
```

**Debug Specific Row:**
```go
// Add this in parseRow function
if lineNum == 1986 {  // Debug specific row
    fmt.Println("🐛 [DEBUG] Row 1986 raw data:", row)
    fmt.Println("🐛 [DEBUG] Column index:", colIdx)
    fmt.Println("🐛 [DEBUG] SKU index:", colIdx["sku"])
    fmt.Println("🐛 [DEBUG] SKU value:", row[colIdx["sku"]])
}
```

---

## Step 6: Database Insert

### 📁 File Location
```
/var/www/homeopathy-business-platform/services/api-golang-v2/internal/handlers/product_import_streaming.go
```

### 🔍 What Happens

**Line 1: Upsert product**
```go
// Line 211
isNew, err := h.upsertProduct(product)
if err != nil {
    fmt.Println("❌ [STEP 5] Database error on row", lineNum, ":", err)
    skipped++
    continue
}

if isNew {
    inserted++
    fmt.Println("✅ [STEP 5] Row", lineNum, "INSERTED:", product.SKU)
} else {
    updated++
    fmt.Println("✅ [STEP 5] Row", lineNum, "UPDATED:", product.SKU)
}
```

**Line 2: upsertProduct function**
```go
// Line 459
func (h *StreamingImportHandler) upsertProduct(product models.ProductImport) (bool, error) {
    fmt.Println("🔵 [DB] Checking if product exists:", product.SKU)
    
    // Check if exists
    var existing models.ProductImport
    err := h.db.Where("sku = ?", product.SKU).First(&existing).Error
    
    if err == gorm.ErrRecordNotFound {
        // Insert new
        fmt.Println("🔵 [DB] Product not found, inserting:", product.SKU)
        
        product.ID = uuid.New().String()
        product.CreatedAt = time.Now()
        product.UpdatedAt = time.Now()
        
        if err := h.db.Create(&product).Error; err != nil {
            fmt.Println("❌ [DB] Insert failed:", err)
            return false, err
        }
        
        fmt.Println("✅ [DB] Insert successful:", product.SKU)
        return true, nil
    }
    
    // Update existing
    fmt.Println("🔵 [DB] Product found, updating:", product.SKU)
    
    product.UpdatedAt = time.Now()
    if err := h.db.Model(&existing).Updates(product).Error; err != nil {
        fmt.Println("❌ [DB] Update failed:", err)
        return false, err
    }
    
    fmt.Println("✅ [DB] Update successful:", product.SKU)
    return false, nil
}
```

### 🐛 How to Debug

**Check Logs:**
```bash
tail -f logs/api-golang-v2.log

# Expected output:
🔵 [DB] Checking if product exists: 100A11
🔵 [DB] Product not found, inserting: 100A11
✅ [DB] Insert successful: 100A11
✅ [STEP 5] Row 2 INSERTED: 100A11
```

**Check Database Directly:**
```bash
# Connect to PostgreSQL
docker exec -it erp-postgres psql -U postgres -d yeelo_homeopathy

# Check products
SELECT COUNT(*) FROM products;
SELECT sku, name FROM products LIMIT 5;

# Check specific product
SELECT * FROM products WHERE sku = '100A11';
```

**Expected Database Output:**
```sql
yeelo_homeopathy=# SELECT COUNT(*) FROM products;
 count 
-------
  2288

yeelo_homeopathy=# SELECT sku, name FROM products LIMIT 5;
   sku   |         name          
---------+----------------------
 100A11  | Acid fluor.
 100A16  | Acidum nitricum
 100A18  | Acidum phosphoricum
```

---

## Step 7: Response to Frontend

### 📁 File Location
```
/var/www/homeopathy-business-platform/services/api-golang-v2/internal/handlers/product_import_streaming.go
```

### 🔍 What Happens

**Line 1: Send SSE progress updates**
```go
// Line 186
h.sendProgress(c, ProgressMessage{
    Type:       "log",
    Message:    fmt.Sprintf("✅ Row %d: Created '%s' (SKU: %s)", lineNum, product.Name, product.SKU),
    Percentage: percentage,
    RowNumber:  lineNum,
    Timestamp:  time.Now().Format(time.RFC3339),
})
```

**Line 2: Send completion message**
```go
// Line 250
h.sendProgress(c, ProgressMessage{
    Type:    "complete",
    Message: "Import completed successfully!",
    Data: map[string]interface{}{
        "total_rows":   totalRows,
        "inserted":     inserted,
        "updated":      updated,
        "skipped":      skipped,
        "success_rate": successRate,
    },
})
```

### 🐛 How to Debug

**Check Browser Console:**
```javascript
// In page.tsx, add console logs
const eventSource = new EventSource('http://localhost:3005/api/erp/products/import/stream');

eventSource.onmessage = (event) => {
    console.log('📨 [SSE] Received:', event.data);
    
    const data = JSON.parse(event.data);
    console.log('📨 [SSE] Type:', data.type);
    console.log('📨 [SSE] Message:', data.message);
    console.log('📨 [SSE] Progress:', data.percentage + '%');
};
```

**Expected Console Output:**
```
📨 [SSE] Received: {"type":"log","message":"✅ Row 2: Created 'Acid fluor.' (SKU: 100A11)","percentage":15.5}
📨 [SSE] Type: log
📨 [SSE] Message: ✅ Row 2: Created 'Acid fluor.' (SKU: 100A11)
📨 [SSE] Progress: 15.5%
```

---

## How to Debug Each Step

### 🔧 Quick Debug Checklist

**1. Frontend (Browser)**
```
✓ Open DevTools (F12)
✓ Check Console tab for logs
✓ Check Network tab for HTTP requests
✓ Look for errors in red
```

**2. Backend (Terminal)**
```bash
# Watch logs in real-time
tail -f logs/api-golang-v2.log

# Search for errors
grep "ERROR" logs/api-golang-v2.log

# Search for specific row
grep "Row 1986" logs/api-golang-v2.log
```

**3. Database (PostgreSQL)**
```bash
# Connect to database
docker exec -it erp-postgres psql -U postgres -d yeelo_homeopathy

# Check tables
\dt

# Check products
SELECT COUNT(*) FROM products;
SELECT * FROM products WHERE sku = '100A11';
```

---

## Common Errors & Solutions

### ❌ Error 1: "SKU is required"

**Symptom:**
```
⚠️ Row 1986: SKU is required
```

**Debug Steps:**
```bash
# 1. Check CSV file
head -1986 Template_File_Medicine_Product_List.csv | tail -1

# 2. Check if row has SKU value
awk -F',' 'NR==1986 {print "SKU:", $1}' Template_File_Medicine_Product_List.csv

# 3. Check column mapping in logs
grep "Column mapping" logs/api-golang-v2.log
```

**Solution:**
- Make sure CSV has SKU in first column
- Check for empty rows in CSV
- Verify column headers match: `SKU,Name,Potency,Size,Qty`

---

### ❌ Error 2: "Failed to parse CSV"

**Symptom:**
```
❌ [ERROR] Failed to parse CSV: invalid format
```

**Debug Steps:**
```bash
# 1. Check file encoding
file Template_File_Medicine_Product_List.csv

# 2. Check for special characters
cat -A Template_File_Medicine_Product_List.csv | head -5

# 3. Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 Template_File_Medicine_Product_List.csv > fixed.csv
```

---

### ❌ Error 3: "Database connection failed"

**Symptom:**
```
❌ [DB] Insert failed: connection refused
```

**Debug Steps:**
```bash
# 1. Check if PostgreSQL is running
docker ps | grep postgres

# 2. Check database connection
docker exec -it erp-postgres pg_isready

# 3. Restart PostgreSQL
docker-compose restart postgres
```

---

### ❌ Error 4: "Port 3005 already in use"

**Symptom:**
```
[ERROR] listen tcp :3005: bind: address already in use
```

**Solution:**
```bash
# Kill process on port 3005
lsof -ti:3005 | xargs kill -9

# Restart API
./restart-import-api.sh
```

---

## Complete Debug Session Example

### Scenario: Debugging Row 1986 Error

**Step 1: Check the error**
```bash
tail -f logs/api-golang-v2.log
# Output: ❌ [VALIDATE] Row 1986 FAILED: SKU is required
```

**Step 2: Check the CSV row**
```bash
awk -F',' 'NR==1986 {print}' Template_File_Medicine_Product_List.csv
# Output: ,Some Product,30C,10ml,100
# ↑ Missing SKU!
```

**Step 3: Check column mapping**
```bash
grep "Column mapping" logs/api-golang-v2.log
# Output: Column 0: SKU → sku
```

**Step 4: Add debug logs**
```go
// In parseRow function, add:
if lineNum == 1986 {
    fmt.Println("🐛 [DEBUG] Raw row:", row)
    fmt.Println("🐛 [DEBUG] SKU index:", colIdx["sku"])
    fmt.Println("🐛 [DEBUG] SKU value:", row[colIdx["sku"]])
}
```

**Step 5: Rebuild and test**
```bash
./restart-import-api.sh
# Upload file again
# Check logs for debug output
```

**Step 6: Fix the CSV**
```bash
# Edit row 1986 to add SKU
# Or skip empty SKU rows in code
```

---

## Summary

### Import Flow Recap

```
1. User selects file → File stored in browser memory
2. User clicks import → FormData created with file
3. HTTP POST → File sent to backend
4. Backend receives → File saved to temp location
5. Parse CSV → Rows extracted into array
6. Build column map → Header columns mapped to indices
7. Loop rows → Each row validated
8. Validate row → Check SKU, Name required
9. Insert/Update → Save to PostgreSQL
10. Send SSE → Progress updates to frontend
11. Complete → Final statistics shown
```

### Debug Tools

| Tool | Purpose | Command |
|------|---------|---------|
| Browser Console | Frontend logs | F12 → Console |
| Browser Network | HTTP requests | F12 → Network |
| Backend Logs | Server logs | `tail -f logs/api-golang-v2.log` |
| Database | Check data | `docker exec -it erp-postgres psql...` |
| CSV Check | Verify file | `head -5 file.csv` |

---

## Next Steps

1. **Test the import** with your CSV file
2. **Watch the logs** in terminal: `tail -f logs/api-golang-v2.log`
3. **Check browser console** for frontend errors
4. **Verify database** after import completes

**You're now ready to debug any import issue!** 🎉

---

**Created:** October 25, 2025  
**For:** Beginners learning the import system  
**Status:** Complete debugging guide
