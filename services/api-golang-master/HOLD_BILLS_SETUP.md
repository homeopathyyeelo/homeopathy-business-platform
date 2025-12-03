# Hold Bills Feature - Setup Instructions

## ✅ What's Been Implemented

### Backend (Golang)

1. **Database Model** (`internal/models/hold_bill.go`)
   - `HoldBill` struct with all required fields
   - JSONB storage for cart items
   - Financial summary fields
   - Audit tracking

2. **Handler** (`internal/handlers/hold_bill_handler.go`)
   - `POST /api/erp/pos/hold-bill` - Hold current bill
   - `GET /api/erp/pos/hold-bills` - List all held bills
   - `GET /api/erp/pos/hold-bills/:id` - Get specific held bill (for resume)
   - `DELETE /api/erp/pos/hold-bills/:id` - Delete held bill
   - `GET /api/erp/pos/hold-bills/stats` - Get statistics

3. **Routes** (`cmd/main.go`)
   - All endpoints registered in POS group
   - Handler initialized with database connection

4. **Migration** (`migrations/018_create_hold_bills_table.sql`)
   - Creates `pos_hold_bills` table
   - Adds indexes for performance
   - Sets up auto-update triggers

## 🚀 Setup Steps

### 1. Run Database Migration

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-master

# Run migration (adjust credentials as needed)
psql -h localhost -U your_user -d yeelo_homeopathy -f migrations/018_create_hold_bills_table.sql
```

### 2. Restart Backend Server

```bash
# Stop current server (if running)
# Start with:
go run cmd/main.go
```

### 3. Test API Endpoints

#### Hold a Bill
```bash
curl -X POST http://localhost:3005/api/erp/pos/hold-bill \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Walk-in Customer",
    "customer_phone": "9876543210",
    "items": [
      {
        "id": "cart-1",
        "product_id": "abc",
        "name": "Arnica 30C",
        "quantity": 2,
        "unit_price": 100,
        "total": 200
      }
    ],
    "sub_total": 200,
    "tax_amount": 10,
    "total_amount": 210,
    "total_items": 1,
    "billing_type": "RETAIL",
    "notes": "Customer will return later",
    "held_by_name": "Rajesh"
  }'
```

#### Get All Held Bills
```bash
curl http://localhost:3005/api/erp/pos/hold-bills
```

#### Get Specific Held Bill (for Resume)
```bash
curl http://localhost:3005/api/erp/pos/hold-bills/{bill_id}
```

#### Delete Held Bill
```bash
curl -X DELETE http://localhost:3005/api/erp/pos/hold-bills/{bill_id}
```

#### Get Statistics
```bash
curl http://localhost:3005/api/erp/pos/hold-bills/stats
```

## 📋 API Response Examples

### Hold Bill Response
```json
{
  "success": true,
  "message": "Bill held successfully",
  "data": {
    "id": "uuid-here",
    "bill_number": "HOLD-20241202-151030",
    "customer_name": "Walk-in Customer",
    "total_amount": 210,
    "total_items": 1,
    "created_at": "2024-12-02T15:10:30Z"
  }
}
```

### Get Held Bills Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bill_number": "HOLD-20241202-151030",
      "customer_name": "Walk-in Customer",
      "customer_phone": "9876543210",
      "total_amount": 210,
      "total_items": 1,
      "billing_type": "RETAIL",
      "held_by_name": "Rajesh",
      "created_at": "2024-12-02T15:10:30Z"
    }
  ],
  "count": 1
}
```

## 🎯 Next Steps

1. ✅ Backend API complete
2. 🔄 Frontend implementation needed:
   - Add "Hold Bill" button on POS page
   - Create Hold Bills list page (`/sales/hold-bills`)
   - Add Resume functionality
   - Add Delete functionality
3. 🔜 Phase 2: AI Smart Suggestions
4. 🔜 Phase 3: Enhanced Cart with Profit Margins

## 🔧 Database Schema

```sql
Table: pos_hold_bills
- id (UUID, Primary Key)
- bill_number (VARCHAR, Unique) - Format: HOLD-YYYYMMDD-HHMMSS
- customer_id (UUID, FK to customers)
- customer_name (VARCHAR)
- customer_phone (VARCHAR)
- items (JSONB) - Cart items array
- sub_total (DECIMAL)
- discount_amount (DECIMAL)
- tax_amount (DECIMAL)
- total_amount (DECIMAL)
- total_items (INTEGER)
- billing_type (VARCHAR) - RETAIL, WHOLESALE, etc.
- notes (TEXT)
- held_by (UUID, FK to users)
- held_by_name (VARCHAR)
- resumed_count (INTEGER) - Track edits
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP) - Soft delete
```

## 📝 Features Implemented

- ✅ Hold incomplete bills
- ✅ Store complete cart state
- ✅ Customer information tracking
- ✅ Financial calculations
- ✅ Audit trail (who held, when)
- ✅ Resume tracking (how many times resumed)
- ✅ Soft delete support
- ✅ Statistics endpoint
- ✅ Filtering by counter/billing type
- ✅ JSONB storage for flexibility

## 🐛 Troubleshooting

If backend doesn't start:
1. Check `go.mod` module name matches imports
2. Run `go mod tidy` to update dependencies
3. Check PostgreSQL is running
4. Verify database `yeelo_homeopathy` exists
5. Check migration ran successfully

## 📞 Support

If you encounter issues:
- Check logs: Backend will show detailed error messages
- Verify API endpoints are accessible
- Test with curl/Postman before integrating frontend
