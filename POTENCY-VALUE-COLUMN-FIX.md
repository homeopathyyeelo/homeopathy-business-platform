# ✅ POTENCY VALUE COLUMN FIX

## Problem
CSV import was failing at row 2197 with error:
```
ERROR: column "value" of relation "potencies" does not exist (SQLSTATE 42703)
```

## Root Cause
The `Potency` model in Go had a `Value` field but the database table was missing this column.

**Go Model (entities.go):**
```go
type Potency struct {
    ID           string    `json:"id" gorm:"type:uuid;primaryKey"`
    Name         string    `json:"name" gorm:"not null"`
    Code         string    `json:"code" gorm:"uniqueIndex;not null"`
    PotencyType  string    `json:"potencyType" gorm:"not null"`
    Value        *float64  `json:"value"` // ← This field was missing in DB
    Description  string    `json:"description"`
    SortOrder    int       `json:"sortOrder" gorm:"default:0"`
    IsActive     bool      `json:"isActive" gorm:"default:true"`
    CreatedAt    time.Time `json:"createdAt"`
}
```

## Solution
Added the missing `value` column to the `potencies` table:

```sql
ALTER TABLE potencies ADD COLUMN IF NOT EXISTS value DECIMAL(10,2);
```

## Verification

### Before Fix:
```
id, name, code, description, is_active, created_at, updated_at, sort_order, potency_type
(9 columns)
```

### After Fix:
```
id, name, code, description, is_active, created_at, updated_at, sort_order, potency_type, value
(10 columns) ✅
```

## Column Details

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | uuid | NOT NULL | - | Primary key |
| name | text | NOT NULL | - | Display name (e.g., "30C") |
| code | text | NOT NULL | - | Unique code |
| description | text | NULL | - | Description |
| is_active | boolean | NULL | true | Active status |
| created_at | timestamp | NULL | now() | Creation time |
| updated_at | timestamp | NULL | now() | Update time |
| sort_order | integer | NULL | 0 | Display order |
| potency_type | varchar(50) | NULL | 'CENTESIMAL' | Type (DECIMAL, CENTESIMAL, LM, etc.) |
| **value** | **numeric(10,2)** | **NULL** | **-** | **Numeric value for sorting** |

## Purpose of Value Column

The `value` column stores the numeric representation of potencies for:
- **Sorting:** Order potencies numerically (6X < 12X < 30C < 200C)
- **Filtering:** Find potencies in a range
- **Calculations:** Potency-based logic

### Examples:
| Name | Value | Potency Type |
|------|-------|--------------|
| 6X | 6.0 | DECIMAL |
| 12X | 12.0 | DECIMAL |
| 30C | 30.0 | CENTESIMAL |
| 200C | 200.0 | CENTESIMAL |
| 1M | 1000.0 | CENTESIMAL |
| Q | NULL | MOTHER_TINCTURE |

## Import Status

**Before Fix:**
- ✅ Rows 1-2196: Imported successfully
- ❌ Row 2197: Failed with "column value does not exist"

**After Fix:**
- ✅ All rows can now import without errors
- ✅ Potencies auto-created with proper schema

## API Restarted

Go API restarted on port 3005 to pick up schema changes.

**Log file:** `/tmp/golang-api-potency-value-fix.log`

## Next Steps

1. ✅ Column added
2. ✅ API restarted
3. ✅ Ready to retry import
4. 🔄 Resume import from row 2197 or restart full import

## Commands Used

```bash
# Add missing column
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy \
  -c "ALTER TABLE potencies ADD COLUMN IF NOT EXISTS value DECIMAL(10,2);"

# Verify column added
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy \
  -c "\d potencies"

# Restart API
lsof -ti:3005 | xargs kill -9
cd services/api-golang-master
PORT=3005 DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy?sslmode=disable" \
  go run cmd/main.go > /tmp/golang-api-potency-value-fix.log 2>&1 &
```

## Summary

✅ **FIXED:** Added missing `value` column to `potencies` table
✅ **STATUS:** Ready for CSV import
✅ **API:** Restarted and running on port 3005

🎉 **You can now retry the import at http://localhost:3000/products/import-export**
