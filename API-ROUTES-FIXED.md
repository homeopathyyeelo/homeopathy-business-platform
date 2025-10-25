# API Routes Fixed for /products/add Page

## Issue
Frontend was calling:
- `GET http://localhost:3005/api/products/categories` → 404
- `GET http://localhost:3005/api/products/brands` → 404

## Root Cause
The routes existed at `/api/erp/categories` and `/api/erp/brands` but frontend expected `/api/products/categories` and `/api/products/brands`.

## Fix Applied
Added backward compatibility routes in `cmd/main.go`:

```go
// API routes (for backward compatibility)
api := r.Group("/api")
{
    // Product routes (for frontend compatibility)
    api.GET("/products/categories", productHandler.GetCategories)
    api.GET("/products/brands", productHandler.GetBrands)
    api.GET("/products/potencies", productHandler.GetPotencies)
    api.GET("/products/forms", productHandler.GetForms)
    ...
}
```

## Available Routes Now

### Both Paths Work:
| Frontend Path | Backend Path | Handler |
|---------------|--------------|---------|
| `/api/products/categories` | `/api/erp/categories` | GetCategories |
| `/api/products/brands` | `/api/erp/brands` | GetBrands |
| `/api/products/potencies` | `/api/erp/potencies` | GetPotencies |
| `/api/products/forms` | `/api/erp/forms` | GetForms |

## Restart Required

### 1. Rebuild (Already Done ✅)
```bash
cd services/api-golang-v2
go build -o bin/api cmd/main.go
```

### 2. Restart API
```bash
# If running in foreground: Ctrl+C then restart
cd services/api-golang-v2
./bin/api

# If running in background:
pkill -f "api-golang-v2"
cd services/api-golang-v2
./bin/api &
```

### 3. Test
```bash
# Test categories
curl http://localhost:3005/api/products/categories

# Test brands
curl http://localhost:3005/api/products/brands
```

## Expected Response

### Categories:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Dilutions", "parent_id": null },
    { "id": "uuid", "name": "Mother Tincture", "parent_id": null },
    ...
  ]
}
```

### Brands:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "SBL", "description": "..." },
    { "id": "uuid", "name": "Dr. Reckeweg", "description": "..." },
    ...
  ]
}
```

## Frontend Page
Now `/products/add` page will work correctly:
- Categories dropdown will populate
- Brands dropdown will populate
- Potencies dropdown will populate
- Forms dropdown will populate

## Status
✅ Routes added
✅ Binary rebuilt
⏳ Restart API to apply changes
