HomeoERP Artifact Bundle (v2.1.0)
Generated: 2025-10-24T07:55:00Z UTC

FILES
- /erd/homeoerp-erd.drawio  (Draw.io XML ERD)
- /erd/homeoerp-erd.svg     (SVG overview)
- /db/ddl/core_schema_v2.sql  (PostgreSQL DDL + seed + fn_expiry_counts)
- /services/service_map.yaml   (Microservices, APIs, topics)
- /kafka/topics.json           (Topics + schema + sample)
- /cronjobs/cronjobs.md        (Cron list + hourly expiry PL/pgSQL)
- /ui/layout/app_shell_spec.md (4-sided AppShell spec with RBAC)
- /ui/menu.json                (Full left menu, 60+ entries)
- /ui/wireframes/dashboard_layout.svg (Dashboard wireframe)
- /api_contracts/inventory_expiry_api.md (Expiry APIs)
- /diagnostics/bug_tracker_api.md       (Bug tracker APIs)
- /acceptance/acceptance_tests.md       (10 acceptance tests)

USAGE
1) Load DB schema:
   psql -U <user> -d <db> -f db/ddl/core_schema_v2.sql

2) Configure services with .env:
   - Add DB DSNs, Kafka, Redis, MinIO; do NOT commit secrets

3) Backend routes of interest (api-core):
   - GET /api/v2/inventory/expiries?shop_id=... (summary)
   - (per API contract) /api/v1/inventory/expiry* endpoints

4) Frontend:
   - Ensure a Next.js page exists at /app/inventory/expiry/page.tsx calling /api/v2/inventory/expiries
   - Sidebar/menu defined by /ui/menu.json

5) Cron:
   - Implement an hourly job using /cronjobs/cronjobs.md DO $$ block
   - Outbox-worker publishes inventory.expiry.summary events

NOTES
- Extensions required: pgcrypto, vector, pg_trgm
- Partition hints provided (orders/outbox/ai_requests)
- Seed data inserts 1 shop, 1 vendor, 1 product, and 1 expiring batch for testing

MIGRATION COMMANDS (provided by user; edit paths if needed)
psql -U postgres -d yeelo_homeopathy -f database/migrations/005_automated_bug_tracking.sql
psql -U postgres -d yeelo_homeopathy -f database/migrations/006_expiry_dashboard.sql
psql -U postgres -d yeelo_homeopathy -f database/migrations/007_ai_self_healing_system.sql
