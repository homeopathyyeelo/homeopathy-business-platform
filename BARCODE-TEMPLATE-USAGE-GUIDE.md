# 📋 Barcode Template System - Usage Guide

## ✅ What Was Updated

### 1. Database Schema ✅
```sql
-- Added to products table
ALTER TABLE products ADD COLUMN barcode_template VARCHAR(50) DEFAULT 'BarcodeT8';
```

**Verify:**
```bash
psql -U postgres -d yeelo_homeopathy -c "\d products" | grep barcode
```

### 2. Backend API ✅

**Files Modified:**
- `/services/api-golang-master/internal/models/entities.go` - Added `BarcodeTemplate` field
- `/services/api-golang-master/internal/handlers/product_handler.go` - Returns barcode template in API
- `/services/api-golang-master/internal/handlers/barcode_label_handler.go` - Uses template for generation

**API Response Now Includes:**
```json
{
  "id": "xxx",
  "name": "Product Name",
  "sku": "SKU123",
  "barcode": "1234567890",
  "barcodeTemplate": "BarcodeT8",  // ← NEW FIELD
  ...
}
```

### 3. Frontend Components ✅

**New Files Created:**
1. `/lib/barcode-templates.ts` - 20 template definitions
2. `/components/barcode/BarcodeTemplateSelector.tsx` - Template selector component
3. `/app/products/barcode-templates/page.tsx` - Template manager page

## 🎯 How to Use

### Method 1: Barcode Template Manager Page

**URL:** `http://localhost:3000/products/barcode-templates`

**Features:**
- ✅ Visual grid showing all 20 templates
- ✅ Live preview with customizable data
- ✅ See template sizes (40mm-110mm width)
- ✅ Font size indicators (small/medium/large)
- ✅ Usage recommendations per bottle size

**Steps:**
1. Open browser: `http://localhost:3000/products/barcode-templates`
2. Enter sample product data in the form
3. Browse all 20 templates
4. Click on any template to select it
5. See live preview with your data

### Method 2: Check Product Data via API

**Test API:**
```bash
# Login first to get token
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"medicine@yeelohomeopathy.com","password":"your-password"}'

# Then get products (use the token from login)
curl "http://localhost:3005/api/erp/products?page=1&limit=5" \
  -H "Cookie: auth-token=YOUR_TOKEN_HERE" | jq '.data[0]'
```

**Expected Response:**
```json
{
  "id": "product-id",
  "name": "Sulphur 30C",
  "sku": "SULPH-30C",
  "barcodeTemplate": "BarcodeT8",  // ← This field now exists
  "barcode": "SULPH-30C",
  "mrp": 70.00,
  ...
}
```

### Method 3: Update Product Barcode Template

**Via Database:**
```sql
-- Update a specific product
UPDATE products 
SET barcode_template = 'BarcodeT3' 
WHERE sku = 'SULPH-30C';

-- Update by category (small bottles)
UPDATE products 
SET barcode_template = 'BarcodeT2' 
WHERE pack_size LIKE '%10ml%';

-- Update by category (large bottles)
UPDATE products 
SET barcode_template = 'BarcodeT10' 
WHERE pack_size LIKE '%100ml%' OR pack_size LIKE '%200ml%';
```

**Via API (when product form is updated):**
```bash
curl -X PUT http://localhost:3005/api/erp/products/{product-id} \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "barcodeTemplate": "BarcodeT5",
    ...other fields
  }'
```

## 📊 Available Templates

### Small Bottles (10ml - 20ml)
```
BarcodeT1 (40×20mm) - Minimal: Name, MRP, Barcode only
BarcodeT2 (50×25mm) - Compact: + Code, Sale Price
BarcodeT3 (60×30mm) - Small: + Batch, Brand
BarcodeT4 (65×32mm) - Small+: + QR Code
```

### Medium Bottles (30ml - 50ml)
```
BarcodeT5 (70×35mm) - Medium Compact
BarcodeT6 (75×35mm) - Standard Medium
BarcodeT7 (80×40mm) - Medium Plus
BarcodeT8 (75×35mm) - Default Standard ⭐ (Most Common)
```

### Large Bottles (100ml+)
```
BarcodeT9  (85×45mm)  - Large Compact
BarcodeT10 (90×50mm)  - Large
BarcodeT11 (100×55mm) - Extra Large
BarcodeT12 (100×60mm) - Box Label (for outer packaging)
```

### Special Products
```
BarcodeT13 (70×25mm) - Tablet Strips (horizontal)
BarcodeT14 (65×35mm) - Cream/Ointment Tubes
BarcodeT15 (80×45mm) - Mother Tincture Bottles
BarcodeT16 (60×30mm) - Bio Combination Tablets
BarcodeT17 (75×40mm) - Patent Medicines
BarcodeT18 (110×65mm) - Maximum Size (special products)
```

### Custom Templates
```
BarcodeCustomise1 (75×35mm) - Customizable Template 1
BarcodeCustomise2 (75×35mm) - Customizable Template 2
```

## 🔧 Quick Setup Examples

### Example 1: Assign Templates by Bottle Size
```sql
-- Small 10ml bottles
UPDATE products 
SET barcode_template = 'BarcodeT2' 
WHERE pack_size IN ('10ml', '10 ml', '10ML');

-- Medium 30ml bottles
UPDATE products 
SET barcode_template = 'BarcodeT8' 
WHERE pack_size IN ('30ml', '30 ml', '30ML');

-- Large 100ml bottles
UPDATE products 
SET barcode_template = 'BarcodeT10' 
WHERE pack_size IN ('100ml', '100 ml', '100ML');

-- Mother Tinctures
UPDATE products 
SET barcode_template = 'BarcodeT15' 
WHERE form = 'Mother Tincture' OR name LIKE '%MT%';

-- Creams and Ointments
UPDATE products 
SET barcode_template = 'BarcodeT14' 
WHERE form IN ('Cream', 'Ointment', 'Gel');
```

### Example 2: Check Current Template Distribution
```sql
SELECT 
    barcode_template,
    COUNT(*) as product_count,
    STRING_AGG(DISTINCT pack_size, ', ') as sizes_used
FROM products 
WHERE is_active = true
GROUP BY barcode_template
ORDER BY product_count DESC;
```

## 🎨 Visual Preview

### Access the Visual Template Manager:
```
http://localhost:3000/products/barcode-templates
```

**What You'll See:**
1. **Top Section:** Statistics (20 templates, size range, current selection)
2. **Live Preview:** Customizable preview with your product data
3. **Template Grid:** All 20 templates with:
   - Template name
   - Size dimensions
   - Font size indicator
   - Suitable for (bottle sizes)
   - Mini preview
4. **Usage Guide:** Recommendations by bottle size

## 📝 Template Selection Logic

```typescript
// In your code, you can use:
import { getBarcodeTemplate, BARCODE_TEMPLATES } from '@/lib/barcode-templates';

// Get specific template
const template = getBarcodeTemplate('BarcodeT8');

// Get all templates
const allTemplates = BARCODE_TEMPLATES;

// Get default template
const defaultTemplate = getDefaultTemplate(); // Returns BarcodeT8
```

## 🖨️ Printing with Templates

When you print barcodes from `/products/barcode` page:

1. System loads each product's `barcodeTemplate` value
2. Generates barcode using the correct template size
3. Applies appropriate layout (QR code, fonts, fields)
4. Outputs print-ready labels

**Example:**
- Product A (10ml) → Uses BarcodeT2 (50×25mm, small font)
- Product B (30ml) → Uses BarcodeT8 (75×35mm, medium font)
- Product C (100ml) → Uses BarcodeT10 (90×50mm, large font)

## ✅ Verification Checklist

### 1. Database Field
```bash
psql -U postgres -d yeelo_homeopathy -c "SELECT barcode_template FROM products LIMIT 5;"
```
**Expected:** Should show 'BarcodeT8' or other template names

### 2. Backend API
```bash
# Check if backend is running
curl http://localhost:3005/health

# Check products API (after login)
curl "http://localhost:3005/api/erp/products?limit=1" -H "Cookie: auth-token=TOKEN"
```
**Expected:** Response includes `barcodeTemplate` field

### 3. Frontend Files
```bash
ls -lh /var/www/homeopathy-business-platform/lib/barcode-templates.ts
ls -lh /var/www/homeopathy-business-platform/components/barcode/BarcodeTemplateSelector.tsx
ls -lh /var/www/homeopathy-business-platform/app/products/barcode-templates/page.tsx
```
**Expected:** All 3 files exist

### 4. Template Manager Page
```
Open: http://localhost:3000/products/barcode-templates
```
**Expected:** Page loads with 20 templates in grid layout

## 🚀 Next Steps

### Immediate:
1. ✅ Visit `http://localhost:3000/products/barcode-templates`
2. ✅ Assign templates to your products based on bottle size
3. ✅ Test barcode printing with different templates

### Optional Enhancements:
1. Add template selector to product add/edit form
2. Bulk assign templates by category
3. Create custom templates (BarcodeCustomise1/2)
4. Add template preview in product list

## 📞 Support

If you don't see the changes:
1. **Clear browser cache** and reload
2. **Restart Next.js dev server:** `npm run dev`
3. **Restart backend:** `pkill backend-server && ./backend-server &`
4. **Check logs:** `tail -f logs/backend.log`

---

**Your barcode template system is ready! 🎉**

All 20 templates are configured and ready to use for different bottle sizes.
