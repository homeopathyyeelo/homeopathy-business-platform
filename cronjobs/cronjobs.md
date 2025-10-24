# HomeoERP Cron Jobs

-- **expiry_check_job**
  - schedule: `0 * * * *`
  - owner: api-core (Go/Gin)
  - purpose: compute upcoming expiry counts per shop for 7d, 1m, 3m, 6m, 1y, 60m windows and emit summary event
  - sql:
```sql
-- Per shop computation (parameter: :shop_id)
WITH upcoming AS (
  SELECT shop_id,
         CASE
           WHEN expiry_date <= now() + interval '7 days' THEN '7d'
           WHEN expiry_date <= now() + interval '1 month' THEN '1m'
           WHEN expiry_date <= now() + interval '3 months' THEN '3m'
           WHEN expiry_date <= now() + interval '6 months' THEN '6m'
           WHEN expiry_date <= now() + interval '1 year' THEN '1y'
           WHEN expiry_date <= now() + interval '60 months' THEN '60m'
         END as bucket
  FROM core.inventory_batches
  WHERE shop_id = $1
    AND expiry_date IS NOT NULL
    AND expiry_date > now()
    AND (qty - reserved_qty) > 0
)
SELECT bucket, count(*) FROM upcoming GROUP BY bucket;
```
  - plpgsql (executable) upsert + outbox publish:
```sql
DO $$
DECLARE
  rec RECORD;
  shop_rec RECORD;
BEGIN
  FOR shop_rec IN SELECT id FROM core.shops LOOP
    FOR rec IN
      WITH upcoming AS (
        SELECT CASE
          WHEN expiry_date <= now() + interval '7 days' THEN '7d'
          WHEN expiry_date <= now() + interval '1 month' THEN '1m'
          WHEN expiry_date <= now() + interval '3 months' THEN '3m'
          WHEN expiry_date <= now() + interval '6 months' THEN '6m'
          WHEN expiry_date <= now() + interval '1 year' THEN '1y'
          WHEN expiry_date <= now() + interval '60 months' THEN '60m' END AS bucket
        FROM core.inventory_batches
        WHERE shop_id = shop_rec.id
          AND expiry_date IS NOT NULL AND expiry_date > now()
          AND (qty - reserved_qty) > 0
      )
      SELECT bucket, count(*) AS cnt FROM upcoming GROUP BY bucket
    LOOP
      INSERT INTO sys.outbox(topic, aggregate_type, aggregate_id, payload, metadata)
      VALUES (
        'inventory.events',
        'expiry_summary',
        shop_rec.id,
        jsonb_build_object('shop_id', shop_rec.id, 'window', rec.bucket, 'count', rec.cnt, 'computed_at', now()),
        jsonb_build_object('source','api-core','trace_id', gen_random_uuid()::text)
      );
    END LOOP;
  END LOOP;
END$$;
```

- **bug_scan_job**
  - schedule: `*/10 * * * *`
  - owner: bug-collector
  - purpose: scan incoming `system.logs` and open/update `sys.system_bugs`

- **health_check_job**
  - schedule: `*/5 * * * *`
  - owner: api-gateway
  - purpose: ping all services `/health`, publish `audit.events` health snapshot

- **ai_queue_worker**
  - schedule: `* * * * *`
  - owner: ai-service
  - purpose: drain ai_requests queue and publish `ai.events`

- **campaign_dispatcher**
  - schedule: `*/15 * * * *`
  - owner: campaign-service
  - purpose: send scheduled campaigns and log to `campaigns.events`

- **dlq_scan_job**
  - schedule: `0 */1 * * *`
  - owner: bug-collector
  - purpose: scan `dlq.events` and create follow-up tasks

- **analytics_rollup_daily**
  - schedule: `5 0 * * *`
  - owner: analytics-service
  - purpose: daily KPI rollups for dashboard
