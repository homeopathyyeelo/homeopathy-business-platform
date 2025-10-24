# Acceptance Tests (Expiry & Bug Auto-Fix)

- **pre-requisites**
  - DB schema loaded from `/db/ddl/core_schema_v2.sql`
  - Services up: api-core, outbox-worker, bug-collector, ai-service, kafka, postgres
  - JWT user has required permissions

- **T1: Seed inventory with 7d/1m/3m expiries**
  - steps:
    1. Insert three batches in `core.inventory_batches` for shop `00000000-0000-0000-0000-000000000001` with expiries at `now()+7d`, `now()+1m`, `now()+3m`, qty > 0.
    2. Run the hourly expiry PL/pgSQL snippet from `/cronjobs/cronjobs.md` (DO $$ block).
    3. Call `GET /api/v1/dashboard/expiry-summary?shop_id=...`.
  - expected:
    - JSON counts reflect at least 1 for `7d`, `1m`, `3m`.
    - `sys.outbox` contains events with topic `inventory.events` and payload window keys `7d|1m|3m`.

- **T2: Expiry API pagination**
  - steps:
    1. Insert > 30 expiring batches in the `7d` window.
    2. Call `GET /api/v1/inventory/expiry?shop_id=...&range=7d&page=2&size=20`.
  - expected:
    - HTTP 200, `pagination.page=2`, `size=20`, `data.length <= 20`.

- **T3: Acknowledge expiry alerts**
  - steps:
    1. Query `GET /api/v1/inventory/expiry?shop_id=...&range=1m` to get batch ids.
    2. POST `/api/v1/inventory/expiry/acknowledge` with `batch_ids` and `window_label":"1m"`.
  - expected:
    - HTTP 200 `{ acknowledged: true, count: N }`.
    - Audit event emitted to `sys.outbox` with topic `audit.events` including `action: 'expiry_ack'`.

- **T4: Bug ingest → list**
  - steps:
    1. POST `/api/v1/system/bugs/ingest` with a payload causing `severity=P0` for `service=api-core`.
    2. GET `/api/v1/system/bugs?severity=P0&status=open`.
  - expected:
    - HTTP 202 on ingest with a `bug_id`.
    - List returns item with same `bug_id`, `status=open`.

- **T5: Bug details include AI suggestions**
  - steps:
    1. After T4, GET `/api/v1/system/bugs/:id`.
  - expected:
    - Response 200 contains `ai_analysis.fix_suggestions[]` with `title`, `confidence`.

- **T6: Approve AI fix → PR simulation**
  - steps:
    1. POST `/api/v1/system/bugs/:id/approve` with `suggestion_id` and note.
    2. Wait for auto-fix-worker to process (or simulate callback).
  - expected:
    - 200 `{ approved: true, pr_url: "..." }`.
    - DB: `sys.system_bugs.status` transitions `open|triaged -> in_progress -> auto_fixed|resolved`.
    - Kafka: `audit.events` contains approval and resolution entries.

- **T7: Outbox delivery**
  - steps:
    1. Insert a row into `sys.outbox` with `published=false` and topic `inventory.events`.
    2. Ensure outbox-worker runs.
  - expected:
    - Row becomes `published=true` after publish.
    - Message visible in Kafka topic `inventory.events` (via kafka-ui).

- **T8: Duplicate invoice detection (purchase)**
  - steps:
    1. Upload the same invoice twice to `/api/v1/purchases/invoices/upload` (same vendor_id+invoice_number+total).
  - expected:
    - Second upload returns error or creates `reconciliation_task` with duplicate flag.

- **T9: Partial GRN and inventory update**
  - steps:
    1. Confirm parsed invoice with partial quantities.
    2. Verify `core.inventory_batches.qty` increment equals posted qty.
  - expected:
    - `inventory.events` includes `inventory.restocked.v1` with correct `qty` and `landed_unit_cost`.

- **T10: Dashboard UI targets**
  - steps:
    1. Navigate `/dashboard` and `/inventory/expiry` (ensure page exists).
  - expected:
    - Expiry Summary widget present (cards for 7d/1m/3m/6m/1y counts).
    - Quick Upload area present.

- **Sample payloads**
```json
{
  "event_type":"inventory.restocked.v1",
  "aggregate_type":"vendor_receipt",
  "aggregate_id":"6f8e2b3a-0000-0000-0000-00000000abcd",
  "payload":{"shop_id":"00000000-0000-0000-0000-000000000001","receipt_id":"00000000-0000-0000-0000-0000000000bb","lines":[{"product_id":"00000000-0000-0000-0000-00000000abcd","batch_no":"B20251001","expiry_date":"2027-10-01","qty":100,"landed_unit_cost":12.5}],"received_at":"2025-10-23T09:00:00Z"},
  "metadata":{"source":"api-core","trace_id":"trace-12345"}
}
```
