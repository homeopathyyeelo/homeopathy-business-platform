# 🗄️ Database Implementation Guide
## Converting Mock Handlers to Real Database Operations

## ✅ COMPLETED: Sales Handler (Real Database Implementation)

The `sales_handler.go` has been fully converted from mock data to real database operations.

### What Was Implemented:

#### 1. **GetSalesOrders** - Real Database Query
```go
// BEFORE (Mock):
orders := []gin.H{
    {"id": uuid.New().String(), "orderNo": "SO-2024-001", ...},
}

// AFTER (Database):
var orders []models.SalesOrder
query := h.db.WithContext(ctx).Model(&models.SalesOrder{})
  .Preload("Customer")
  .Preload("Items")
  .Where("status = ?", status)  // Filtering
  .Offset(offset).Limit(limit)  // Pagination
  .Order("created_at DESC")
  .Find(&orders)
```

**Features:**
- ✅ Real database queries with GORM
- ✅ Pagination support (page, limit)
- ✅ Filtering by status, customer_id
- ✅ Eager loading of relationships (Customer, Items)
- ✅ Context timeout (30 seconds)
- ✅ Standardized error responses

#### 2. **GetSalesOrder** - Single Record Fetch
```go
// AFTER (Database):
var order models.SalesOrder
h.db.WithContext(ctx)
  .Preload("Customer")
  .Preload("Items")
  .Preload("Items.Product")  // Nested preload
  .Where("id = ?", id)
  .First(&order)
```

**Features:**
- ✅ Fetches single record with all relationships
- ✅ 404 handling for not found
- ✅ Nested relationship loading

#### 3. **CreateSalesOrder** - Transaction-Based Creation
```go
// AFTER (Database with Transaction):
tx := h.db.WithContext(ctx).Begin()
defer func() {
    if r := recover(); r != nil {
        tx.Rollback()
    }
}()

// Create order
order := &models.SalesOrder{...}
tx.Create(order)

// Create order items
for _, item := range req.Items {
    item := &models.SalesOrderItem{...}
    tx.Create(item)
}

tx.Commit()
```

**Features:**
- ✅ Database transactions (ACID compliance)
- ✅ Automatic rollback on error
- ✅ Request validation with struct tags
- ✅ Automatic total calculations
- ✅ Order number generation

## 📋 Implementation Pattern (Copy This for All Handlers)

### Step 1: Update Handler Struct

```go
// BEFORE:
type YourHandler struct {
    db interface{}
}

// AFTER:
type YourHandler struct {
    db *gorm.DB
}

func NewYourHandler(db interface{}) *YourHandler {
    if gormDB, ok := db.(*gorm.DB); ok {
        return &YourHandler{db: gormDB}
    }
    return &YourHandler{db: nil}
}
```

### Step 2: Add Required Imports

```go
import (
    "context"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/yeelo/homeopathy-erp/internal/models"
    "gorm.io/gorm"
)
```

### Step 3: Convert GET (List) Methods

```go
// BEFORE (Mock):
func (h *Handler) GetItems(c *gin.Context) {
    items := []gin.H{
        {"id": uuid.New().String(), "name": "Item 1"},
    }
    c.JSON(200, gin.H{"data": items})
}

// AFTER (Database):
func (h *Handler) GetItems(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    // Parse pagination
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 { page = 1 }
    if limit < 1 || limit > 100 { limit = 20 }

    // Build query
    query := h.db.WithContext(ctx).Model(&models.YourModel{})
    
    // Add filters
    if search := c.Query("search"); search != "" {
        query = query.Where("name ILIKE ?", "%"+search+"%")
    }

    // Count total
    var total int64
    if err := query.Count(&total).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    // Fetch with pagination
    var items []models.YourModel
    offset := (page - 1) * limit
    if err := query.Preload("RelatedModel").
        Offset(offset).
        Limit(limit).
        Order("created_at DESC").
        Find(&items).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    // Calculate pagination metadata
    totalPages := (total + int64(limit) - 1) / int64(limit)

    // Return with metadata
    RespondSuccessWithMeta(c, items, &MetaData{
        Page:       page,
        Limit:      limit,
        Total:      total,
        TotalPages: totalPages,
    })
}
```

### Step 4: Convert GET (Single) Methods

```go
// BEFORE (Mock):
func (h *Handler) GetItem(c *gin.Context) {
    id := c.Param("id")
    item := gin.H{"id": id, "name": "Item"}
    c.JSON(200, gin.H{"data": item})
}

// AFTER (Database):
func (h *Handler) GetItem(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    id := c.Param("id")
    if id == "" {
        RespondBadRequest(c, "ID is required")
        return
    }

    var item models.YourModel
    if err := h.db.WithContext(ctx).
        Preload("RelatedModel").
        Where("id = ?", id).
        First(&item).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            RespondNotFound(c, "Item")
            return
        }
        RespondInternalError(c, err)
        return
    }

    RespondSuccess(c, item)
}
```

### Step 5: Convert POST (Create) Methods

```go
// BEFORE (Mock):
func (h *Handler) CreateItem(c *gin.Context) {
    var req map[string]interface{}
    c.ShouldBindJSON(&req)
    item := gin.H{"id": uuid.New().String(), "name": req["name"]}
    c.JSON(201, gin.H{"data": item})
}

// AFTER (Database):
func (h *Handler) CreateItem(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    // Parse and validate request
    var req models.CreateItemRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        RespondValidationError(c, err)
        return
    }

    // Create model
    item := &models.YourModel{
        ID:        uuid.New().String(),
        Name:      req.Name,
        // ... other fields
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    // Save to database
    if err := h.db.WithContext(ctx).Create(item).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    // Reload with relationships (optional)
    if err := h.db.WithContext(ctx).
        Preload("RelatedModel").
        First(item, "id = ?", item.ID).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    RespondCreated(c, item, "Item created successfully")
}
```

### Step 6: Convert PUT (Update) Methods

```go
// BEFORE (Mock):
func (h *Handler) UpdateItem(c *gin.Context) {
    id := c.Param("id")
    var req map[string]interface{}
    c.ShouldBindJSON(&req)
    c.JSON(200, gin.H{"data": gin.H{"id": id, "name": req["name"]}})
}

// AFTER (Database):
func (h *Handler) UpdateItem(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    id := c.Param("id")
    if id == "" {
        RespondBadRequest(c, "ID is required")
        return
    }

    // Parse and validate request
    var req models.UpdateItemRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        RespondValidationError(c, err)
        return
    }

    // Check if exists
    var item models.YourModel
    if err := h.db.WithContext(ctx).
        Where("id = ?", id).
        First(&item).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            RespondNotFound(c, "Item")
            return
        }
        RespondInternalError(c, err)
        return
    }

    // Update fields (only if provided)
    if req.Name != "" {
        item.Name = req.Name
    }
    if req.Description != "" {
        item.Description = req.Description
    }
    item.UpdatedAt = time.Now()

    // Save updates
    if err := h.db.WithContext(ctx).Save(&item).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    RespondSuccessWithMessage(c, item, "Item updated successfully")
}
```

### Step 7: Convert DELETE Methods

```go
// BEFORE (Mock):
func (h *Handler) DeleteItem(c *gin.Context) {
    id := c.Param("id")
    c.JSON(200, gin.H{"message": "Deleted"})
}

// AFTER (Database - Soft Delete):
func (h *Handler) DeleteItem(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    id := c.Param("id")
    if id == "" {
        RespondBadRequest(c, "ID is required")
        return
    }

    // Check if exists
    var item models.YourModel
    if err := h.db.WithContext(ctx).
        Where("id = ?", id).
        First(&item).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            RespondNotFound(c, "Item")
            return
        }
        RespondInternalError(c, err)
        return
    }

    // Soft delete (set is_active = false)
    if err := h.db.WithContext(ctx).
        Model(&item).
        Update("is_active", false).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    // OR Hard delete:
    // if err := h.db.WithContext(ctx).Delete(&item).Error; err != nil {
    //     RespondInternalError(c, err)
    //     return
    // }

    RespondSuccessWithMessage(c, nil, "Item deleted successfully")
}
```

## 🔄 Handlers That Need Conversion

### Priority 1: Core Business Logic (MUST CONVERT)

| Handler | File | Mock Methods | Status |
|---------|------|--------------|--------|
| ✅ SalesHandler | `sales_handler.go` | 7 methods | ✅ **DONE** |
| ❌ InventoryHandler | `inventory_handler.go` | 10+ methods | 🔴 Mock |
| ❌ ProductHandler | `product_handler.go` | 15+ methods | 🔴 Mock |
| ❌ CustomerHandler | `customer_handler.go` | 8+ methods | 🔴 Mock |
| ❌ PurchaseHandler | `purchase_enhanced_handler.go` | 10+ methods | 🔴 Mock |

### Priority 2: Settings & Configuration

| Handler | File | Mock Methods | Status |
|---------|------|--------------|--------|
| ❌ BranchHandler | `branch_handler.go` | 5 methods | 🔴 Mock |
| ❌ TaxHandler | `tax_handler.go` | 10 methods | 🔴 Mock |
| ❌ SettingsHandler | `settings_handler.go` | 3 methods | 🔴 Mock |
| ❌ RBACHandler | `rbac_handler.go` | 7 methods | 🔴 Mock |

### Priority 3: Secondary Features

| Handler | File | Mock Methods | Status |
|---------|------|--------------|--------|
| ❌ CategoryHandler | `categories_handler.go` | 5 methods | 🔴 Mock |
| ❌ CustomerGroupHandler | `customer_group_handler.go` | 5 methods | 🔴 Mock |
| ❌ POSSessionHandler | `pos_session.go` | 8 methods | 🔴 Mock |

## 🎯 Quick Start: Converting Your First Handler

### Example: Converting InventoryHandler

**File**: `internal/handlers/inventory_handler.go`

1. **Update imports**:
```go
import (
    "context"
    "strconv"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/yeelo/homeopathy-erp/internal/models"
    "gorm.io/gorm"
)
```

2. **Update struct**:
```go
type InventoryHandler struct {
    db *gorm.DB
}

func NewInventoryHandler(db interface{}) *InventoryHandler {
    if gormDB, ok := db.(*gorm.DB); ok {
        return &InventoryHandler{db: gormDB}
    }
    return &InventoryHandler{db: nil}
}
```

3. **Convert GetInventory method**:
```go
func (h *InventoryHandler) GetInventory(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
    defer cancel()

    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

    var inventoryItems []models.InventoryItem
    var total int64

    query := h.db.WithContext(ctx).Model(&models.InventoryItem{})
    
    if err := query.Count(&total).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    offset := (page - 1) * limit
    if err := query.Preload("Product").
        Offset(offset).
        Limit(limit).
        Find(&inventoryItems).Error; err != nil {
        RespondInternalError(c, err)
        return
    }

    totalPages := (total + int64(limit) - 1) / int64(limit)
    RespondSuccessWithMeta(c, inventoryItems, &MetaData{
        Page:       page,
        Limit:      limit,
        Total:      total,
        TotalPages: totalPages,
    })
}
```

## 📊 Implementation Progress Tracker

```
Total Handlers: 50+
Converted: 1 (Sales)
Remaining: 49+

Progress: [██░░░░░░░░░░░░░░░░░░] 2%
```

## 🔍 Testing Your Database Implementation

### Test with curl:

```bash
# Create a sales order
curl -X POST http://localhost:3005/api/erp/sales/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "uuid-here",
    "order_date": "2025-01-29T00:00:00Z",
    "items": [
      {
        "product_id": "product-uuid",
        "quantity": 10,
        "unit_price": 100.00,
        "discount_pct": 5,
        "tax_pct": 12
      }
    ],
    "notes": "Test order"
  }'

# Get all orders (with pagination)
curl http://localhost:3005/api/erp/sales/orders?page=1&limit=10

# Get single order
curl http://localhost:3005/api/erp/sales/orders/{order-id}

# Filter by status
curl http://localhost:3005/api/erp/sales/orders?status=pending

# Filter by customer
curl http://localhost:3005/api/erp/sales/orders?customer_id=uuid-here
```

## ✅ Checklist for Each Handler Conversion

- [ ] Update imports (add context, strconv, models, gorm)
- [ ] Change handler struct to use `*gorm.DB`
- [ ] Add type assertion in constructor
- [ ] Add context timeout to all methods
- [ ] Replace mock data with database queries
- [ ] Add pagination to list methods
- [ ] Add filtering capabilities
- [ ] Use Preload for relationships
- [ ] Add proper error handling (404, 500)
- [ ] Use standardized response helpers
- [ ] Add validation for create/update
- [ ] Use transactions for complex operations
- [ ] Test all CRUD operations
- [ ] Verify error responses
- [ ] Check pagination works

## 🎉 Benefits of Database Implementation

✅ **Real data persistence**  
✅ **ACID transactions**  
✅ **Relationship loading**  
✅ **Advanced filtering**  
✅ **Pagination support**  
✅ **Data integrity**  
✅ **Production-ready**  
✅ **Consistent error handling**  
✅ **Request validation**  
✅ **Context timeouts**  

## 📝 Next Steps

1. **Convert Priority 1 handlers** (Core business logic)
2. **Test each handler** thoroughly after conversion
3. **Update frontend** to match new response formats
4. **Add more filters** as needed
5. **Optimize queries** with indexes
6. **Add caching** for frequently accessed data
7. **Monitor performance** in production

## 🚀 Estimated Effort

- **Per Handler**: 30-60 minutes
- **All Handlers**: 25-50 hours
- **With Testing**: 40-80 hours

**Recommendation**: Convert 2-3 handlers per day = 2-3 weeks total

---

**Note**: The Sales Handler is now a complete reference implementation. Copy its patterns for all other handlers!
