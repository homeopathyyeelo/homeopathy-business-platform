# Inventory Expiry API (HomeoERP)

- **Base**: api-core (Go/Gin)
- **Security**: JWT (Bearer) + RBAC permission `PERM_INVENTORY_EXPIRE_VIEW`
- **Content-Type**: application/json
- **Notes**: All timestamps are UTC.

- **GET /api/v1/inventory/expiry**
  - query: `shop_id` (uuid, required), `range` (enum: 7d|1m|3m|6m|1y|60m, optional), `page` (default 1), `size` (default 20)
  - desc: List inventory batches expiring in the selected range; if `range` omitted, returns grouped summary of all ranges.
  - responses:
```json
// 200 (range omitted: summary per window)
{
  "data": [
    {"window_label":"7d","count": 12},
    {"window_label":"1m","count": 35},
    {"window_label":"3m","count": 80},
    {"window_label":"6m","count": 120},
    {"window_label":"1y","count": 210},
    {"window_label":"60m","count": 0}
  ],
  "meta": {"shop_id":"00000000-0000-0000-0000-000000000001","generated_at":"2025-10-24T07:45:00Z"}
}
```
```json
// 200 (specific range: paginated list of batches)
{
  "data": [
    {
      "inventory_batch_id": "3c14b5b0-8b6e-4e9e-81c9-9b0f55c3f8a1",
      "product_id": "00000000-0000-0000-0000-00000000abcd",
      "product_name": "UTI Plus Drops 30ml",
      "batch_no": "B20251001",
      "expiry_date": "2025-10-31",
      "qty": 100,
      "reserved_qty": 0,
      "shop_id": "00000000-0000-0000-0000-000000000001"
    }
  ],
  "pagination": {"page":1, "size":20, "total": 12}
}
```
```json
// 400
{"error":"shop_id required"}
```
```json
// 401
{"error":"unauthorized"}
```

- **POST /api/v1/inventory/expiry/acknowledge**
  - body:
```json
{
  "shop_id": "00000000-0000-0000-0000-000000000001",
  "window_label": "7d",
  "batch_ids": ["3c14b5b0-8b6e-4e9e-81c9-9b0f55c3f8a1"],
  "note": "Reviewed by inventory manager"
}
```
  - desc: Mark selected expiry alerts as read/acknowledged.
  - responses:
```json
// 200
{"acknowledged": true, "count": 1}
```
```json
// 403
{"error":"forbidden"}
```

- **GET /api/v1/dashboard/expiry-summary**
  - query: `shop_id` (uuid, required)
  - desc: Aggregated KPI counts per window for dashboard widgets.
  - responses:
```json
{
  "data": {
    "7d": 12,
    "1m": 35,
    "3m": 80,
    "6m": 120,
    "1y": 210,
    "60m": 0
  },
  "meta": {"shop_id":"00000000-0000-0000-0000-000000000001","generated_at":"2025-10-24T07:45:00Z"}
}
```

- **Ranges mapping**
  - 7d → `expiry_date BETWEEN now()::date AND (now() + interval '7 days')::date`
  - 1m → `... interval '1 month'`
  - 3m → `... interval '3 months'`
  - 6m → `... interval '6 months'`
  - 1y → `... interval '1 year'`
  - 60m → `... interval '60 months'`

- **SQL hints**
  - index: `CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON core.inventory_batches(expiry_date);`
  - join products for name: `LEFT JOIN core.products p ON p.id = i.product_id`

- **Outbox events (hourly cron)**
  - topic: `inventory.events`
  - type: `inventory.expiry.summary.v1`
  - sample:
```json
{
  "event_type":"inventory.expiry.summary.v1",
  "aggregate_type":"shop",
  "aggregate_id":"00000000-0000-0000-0000-000000000001",
  "payload":{"7d":12,"1m":35,"3m":80,"6m":120,"1y":210,"60m":0,"computed_at":"2025-10-24T07:00:00Z"},
  "metadata":{"source":"api-core","trace_id":"trace-abc"}
}
```
