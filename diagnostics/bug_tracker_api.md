# System Bug Tracker API (HomeoERP)

- **Base**: api-core (Go/Gin) + bug-collector (Go)
- **Security**: JWT (Bearer) + RBAC permissions
  - Read: `PERM_SYS_BUGS_READ`
  - Approve/Resolve: `PERM_SYS_BUGS_APPROVE`
- **Content-Type**: application/json
- **Notes**: All timestamps are UTC.

- **GET /api/v1/system/bugs**
  - query: `severity` (P0|P1|P2|P3, optional), `status` (open|triaged|in_progress|auto_fixed|resolved|rejected), `service` (string), `page` (int, default 1), `size` (int, default 20)
  - response 200:
```json
{
  "data": [
    {
      "id": "7b7d3c3d-5a1c-4a7d-9f0a-2e1a4b6c8d10",
      "service": "api-core",
      "severity": "P0",
      "status": "open",
      "title": "Panic: nil pointer in inventory update",
      "details": {"stack": "...", "trace_id": "trace-123"},
      "ai_analysis": {"root_cause": "missing null check", "confidence": 0.81,
        "fix_suggestions": [
          {"id":"sug-1","title":"Add nil check in handler","confidence":0.74},
          {"id":"sug-2","title":"Guard in service layer","confidence":0.65}
        ]
      },
      "created_at": "2025-10-24T07:50:00Z",
      "updated_at": "2025-10-24T07:55:00Z"
    }
  ],
  "pagination": {"page":1, "size":20, "total": 1}
}
```

- **GET /api/v1/system/bugs/:id**
  - response 200:
```json
{
  "id": "7b7d3c3d-5a1c-4a7d-9f0a-2e1a4b6c8d10",
  "service": "api-core",
  "severity": "P0",
  "status": "open",
  "title": "Panic: nil pointer in inventory update",
  "details": {"stack": "...", "trace_id": "trace-123"},
  "ai_analysis": {
    "root_cause": "missing null check",
    "confidence": 0.81,
    "fix_suggestions": [
      {
        "id":"sug-1",
        "title":"Add nil check in handler",
        "patch": "diff --git a/handler/inventory.go b/handler/inventory.go ...",
        "confidence": 0.74,
        "risks": ["may hide underlying issue"],
        "tests": ["TestInventoryUpdate_NilBatch"]
      }
    ]
  },
  "created_at": "2025-10-24T07:50:00Z",
  "updated_at": "2025-10-24T07:55:00Z"
}
```

- **POST /api/v1/system/bugs/:id/approve** (Super Admin only)
  - body:
```json
{
  "approval_note": "Proceed with AI suggestion sug-1",
  "suggestion_id": "sug-1"
}
```
  - response 200:
```json
{
  "approved": true,
  "bug_id": "7b7d3c3d-5a1c-4a7d-9f0a-2e1a4b6c8d10",
  "suggestion_id": "sug-1",
  "pr_url": "https://git.example.com/homeoerp/commit/abc...",
  "status": "in_progress"
}
```

- **POST /api/v1/system/bugs/ingest** (internal)
  - body (log payload):
```json
{
  "service": "api-core",
  "level": "error",
  "message": "panic: nil pointer dereference",
  "context": {"file": "inventory_service.go", "line": 213, "trace_id": "trace-123"},
  "timestamp": "2025-10-24T07:45:00Z"
}
```
  - response 202:
```json
{"ingested": true, "bug_id": "7b7d3c3d-5a1c-4a7d-9f0a-2e1a4b6c8d10"}
```

- **DB Schemas**
  - `sys.system_bugs`
```sql
-- see /db/ddl/core_schema_v2.sql
-- important columns: id, service, severity, status, title, details jsonb, ai_analysis jsonb, created_at, updated_at
CREATE INDEX IF NOT EXISTS idx_system_bugs_details ON sys.system_bugs USING gin (details);
```

- **Kafka Events**
  - topic: `system.logs` (ingest source)
  - topic: `audit.events` (approval/audit)

- **Security Notes**
  - All endpoints require JWT; `approve` requires `PERM_SYS_BUGS_APPROVE`.
  - Rate-limit `ingest` by API key or internal network.
