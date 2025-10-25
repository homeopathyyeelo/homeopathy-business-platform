# 🚀 Quick Subcategories Setup

## ✅ What's Ready

1. **SQL Script** - ADD-SUBCATEGORIES.sql (35+ subcategories)
2. **Shell Script** - add-subcategories.sh (easy execution)
3. **New Page** - /products/subcategories (management UI)
4. **Documentation** - Complete guides

---

## 🎯 Run This Command

```bash
./add-subcategories.sh
```

This will:
- ✅ Add `parent_id` column to categories table
- ✅ Create "External Application" main category
- ✅ Insert 35+ subcategories with proper hierarchy
- ✅ Safe to run multiple times (uses ON CONFLICT)

---

## 📊 What Gets Added

### External Application (12 subcategories)
Ointment, Cream, Gel, Paste, Lotion, Spray, Hair Cream, Foot Cream, Eye Drops, Ear Drops, Nasal Drops, Vaporizer

### Cosmetics (3 subcategories)
Hair Care, Skin Care, Oral Care

### Dilutions (12 potency subcategories)
3X, 6X, 12X, 3CH, 6CH, 12CH, 30CH, 200CH, 1M, 10M, 50M, CM

### Mother Tincture (4 brand subcategories)
SBL, Dr. Reckeweg, Willmar Schwabe, BJain

### Biochemic (4 brand subcategories)
SBL, Dr. Reckeweg, Willmar Schwabe, BJain

**Total: 35 subcategories**

---

## 🌐 Test URLs

```
http://localhost:3000/products/subcategories  → New subcategories page
http://localhost:3000/products/categories     → Updated with parent-child
```

---

## 📋 Quick Verify

```bash
docker exec -it erp-postgres psql -U postgres -d yeelo_homeopathy -c "
SELECT 
    'Main Categories' as type, 
    COUNT(*) 
FROM categories 
WHERE parent_id IS NULL
UNION ALL
SELECT 
    'Subcategories', 
    COUNT(*) 
FROM categories 
WHERE parent_id IS NOT NULL;"
```

Expected:
- Main Categories: 14
- Subcategories: 35+

---

**Status:** ✅ Ready to run!
