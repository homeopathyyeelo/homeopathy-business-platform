-- ============================================
-- OUTBOX PATTERN IMPLEMENTATION
-- ============================================
-- Purpose: Ensure reliable event publishing with transactional guarantees
-- Pattern: Each service writes events to outbox table in same transaction
--          Worker polls outbox and publishes to Kafka
--          Ensures at-least-once delivery

-- ============================================
-- OUTBOX TABLE (Generic - use in all services)
-- ============================================

CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_id UUID NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    event_version VARCHAR(10) NOT NULL DEFAULT 'v1',
    
    -- Routing
    topic VARCHAR(100) NOT NULL,
    partition_key VARCHAR(255), -- Optional: for Kafka partition routing
    
    -- Tracing & correlation
    trace_id UUID NOT NULL,
    correlation_id UUID, -- Optional: for request correlation
    causation_id UUID, -- Optional: event that caused this event
    
    -- Source metadata
    source_service VARCHAR(100) NOT NULL,
    source_entity VARCHAR(100), -- e.g., 'order', 'product'
    source_entity_id UUID, -- e.g., order_id, product_id
    
    -- Event payload
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}', -- Additional metadata (user_id, ip, etc.)
    
    -- Publishing state
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status values: 'pending', 'published', 'failed'
    
    published_at TIMESTAMP,
    publish_attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_status CHECK (status IN ('pending', 'published', 'failed'))
);

-- Indexes for performance
CREATE INDEX idx_outbox_status_created ON outbox(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_outbox_topic ON outbox(topic);
CREATE INDEX idx_outbox_event_type ON outbox(event_type);
CREATE INDEX idx_outbox_trace_id ON outbox(trace_id);
CREATE INDEX idx_outbox_source_entity ON outbox(source_entity, source_entity_id);
CREATE INDEX idx_outbox_created_at ON outbox(created_at DESC);

-- Partial index for pending events (most queried)
CREATE INDEX idx_outbox_pending_events ON outbox(created_at) WHERE status = 'pending';

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_outbox_updated_at
    BEFORE UPDATE ON outbox
    FOR EACH ROW
    EXECUTE FUNCTION update_outbox_updated_at();

-- ============================================
-- FUNCTION: Add event to outbox
-- ============================================

CREATE OR REPLACE FUNCTION add_to_outbox(
    p_event_type VARCHAR,
    p_topic VARCHAR,
    p_payload JSONB,
    p_source_service VARCHAR,
    p_trace_id UUID DEFAULT NULL,
    p_source_entity VARCHAR DEFAULT NULL,
    p_source_entity_id UUID DEFAULT NULL,
    p_partition_key VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
    v_trace_id UUID;
BEGIN
    -- Generate IDs
    v_event_id := gen_random_uuid();
    v_trace_id := COALESCE(p_trace_id, gen_random_uuid());
    
    -- Insert into outbox
    INSERT INTO outbox (
        event_id,
        event_type,
        topic,
        partition_key,
        trace_id,
        source_service,
        source_entity,
        source_entity_id,
        payload,
        metadata,
        status
    ) VALUES (
        v_event_id,
        p_event_type,
        p_topic,
        p_partition_key,
        v_trace_id,
        p_source_service,
        p_source_entity,
        p_source_entity_id,
        p_payload,
        p_metadata,
        'pending'
    );
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark event as published
-- ============================================

CREATE OR REPLACE FUNCTION mark_event_published(
    p_event_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE outbox
    SET 
        status = 'published',
        published_at = NOW(),
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark event as failed
-- ============================================

CREATE OR REPLACE FUNCTION mark_event_failed(
    p_event_id UUID,
    p_error_message TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE outbox
    SET 
        status = 'failed',
        error_message = p_error_message,
        publish_attempts = publish_attempts + 1,
        last_attempt_at = NOW(),
        updated_at = NOW()
    WHERE event_id = p_event_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Retry failed events
-- ============================================

CREATE OR REPLACE FUNCTION retry_failed_events(
    p_max_attempts INT DEFAULT 5
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE outbox
    SET 
        status = 'pending',
        updated_at = NOW()
    WHERE status = 'failed'
      AND publish_attempts < p_max_attempts
      AND last_attempt_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get pending events (for worker)
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_events(
    p_limit INT DEFAULT 100,
    p_service VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    event_id UUID,
    event_type VARCHAR,
    topic VARCHAR,
    partition_key VARCHAR,
    trace_id UUID,
    payload JSONB,
    metadata JSONB,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.event_id,
        o.event_type,
        o.topic,
        o.partition_key,
        o.trace_id,
        o.payload,
        o.metadata,
        o.created_at
    FROM outbox o
    WHERE o.status = 'pending'
      AND (p_service IS NULL OR o.source_service = p_service)
    ORDER BY o.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED; -- Prevent concurrent workers from picking same events
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Cleanup old published events
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_published_events(
    p_retention_days INT DEFAULT 7
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM outbox
    WHERE status = 'published'
      AND published_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXAMPLE USAGE
-- ============================================

-- Example 1: Add order.created event
/*
SELECT add_to_outbox(
    p_event_type := 'order.created',
    p_topic := 'orders.events.v1',
    p_payload := jsonb_build_object(
        'order_id', '123e4567-e89b-12d3-a456-426614174000',
        'customer_id', '123e4567-e89b-12d3-a456-426614174001',
        'total', 1500.00,
        'items', jsonb_build_array(
            jsonb_build_object('product_id', 'prod-1', 'qty', 2, 'price', 750.00)
        )
    ),
    p_source_service := 'sales-service',
    p_source_entity := 'order',
    p_source_entity_id := '123e4567-e89b-12d3-a456-426614174000',
    p_partition_key := '123e4567-e89b-12d3-a456-426614174000', -- Use order_id for partitioning
    p_metadata := jsonb_build_object('user_id', 'user-123', 'ip', '192.168.1.1')
);
*/

-- Example 2: Get pending events (worker)
/*
SELECT * FROM get_pending_events(100, 'sales-service');
*/

-- Example 3: Mark as published
/*
SELECT mark_event_published('event-id-here');
*/

-- Example 4: Cleanup old events (run as cron job)
/*
SELECT cleanup_published_events(7); -- Keep 7 days
*/

-- ============================================
-- MONITORING VIEWS
-- ============================================

-- View: Outbox statistics
CREATE OR REPLACE VIEW outbox_stats AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM outbox
GROUP BY status;

-- View: Failed events summary
CREATE OR REPLACE VIEW failed_events_summary AS
SELECT 
    event_type,
    topic,
    COUNT(*) as failure_count,
    MAX(last_attempt_at) as last_failure,
    array_agg(DISTINCT error_message) as error_messages
FROM outbox
WHERE status = 'failed'
GROUP BY event_type, topic
ORDER BY failure_count DESC;

-- View: Pending events by service
CREATE OR REPLACE VIEW pending_events_by_service AS
SELECT 
    source_service,
    topic,
    COUNT(*) as pending_count,
    MIN(created_at) as oldest_pending,
    MAX(created_at) as newest_pending
FROM outbox
WHERE status = 'pending'
GROUP BY source_service, topic
ORDER BY pending_count DESC;

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================

-- Grant to application user
-- GRANT SELECT, INSERT, UPDATE ON outbox TO app_user;
-- GRANT EXECUTE ON FUNCTION add_to_outbox TO app_user;
-- GRANT EXECUTE ON FUNCTION mark_event_published TO app_user;
-- GRANT EXECUTE ON FUNCTION mark_event_failed TO app_user;

-- Grant to worker user
-- GRANT SELECT, UPDATE ON outbox TO worker_user;
-- GRANT EXECUTE ON FUNCTION get_pending_events TO worker_user;
-- GRANT EXECUTE ON FUNCTION mark_event_published TO worker_user;
-- GRANT EXECUTE ON FUNCTION mark_event_failed TO worker_user;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE outbox IS 'Transactional outbox pattern for reliable event publishing';
COMMENT ON COLUMN outbox.event_id IS 'Unique event identifier (idempotency key)';
COMMENT ON COLUMN outbox.trace_id IS 'Distributed tracing ID';
COMMENT ON COLUMN outbox.partition_key IS 'Kafka partition routing key (e.g., order_id, customer_id)';
COMMENT ON COLUMN outbox.status IS 'Event publishing status: pending, published, failed';
COMMENT ON FUNCTION add_to_outbox IS 'Add event to outbox within application transaction';
COMMENT ON FUNCTION get_pending_events IS 'Fetch pending events for worker (with row locking)';
COMMENT ON FUNCTION mark_event_published IS 'Mark event as successfully published to Kafka';
COMMENT ON FUNCTION cleanup_published_events IS 'Delete old published events (run as cron job)';

-- ============================================
-- NOTES
-- ============================================

/*
IMPLEMENTATION NOTES:

1. TRANSACTIONAL GUARANTEE:
   - Always insert into outbox in the SAME transaction as business logic
   - Example:
     BEGIN;
       INSERT INTO orders (...) VALUES (...);
       SELECT add_to_outbox('order.created', 'orders.events.v1', ...);
     COMMIT;

2. WORKER IMPLEMENTATION:
   - Poll get_pending_events() every 100ms-1s
   - Publish to Kafka
   - Call mark_event_published() on success
   - Call mark_event_failed() on failure
   - Use FOR UPDATE SKIP LOCKED to prevent duplicate processing

3. IDEMPOTENCY:
   - event_id is unique - use as Kafka message key
   - Consumers should deduplicate using event_id

4. PARTITIONING:
   - Use partition_key for Kafka partition routing
   - Example: Use customer_id to ensure all customer events go to same partition

5. MONITORING:
   - Alert on high pending_count (worker lag)
   - Alert on failed events
   - Monitor publish_attempts

6. CLEANUP:
   - Run cleanup_published_events() daily via cron
   - Keep 7-30 days based on compliance needs

7. SCALABILITY:
   - Multiple workers can run concurrently (SKIP LOCKED prevents conflicts)
   - Partition outbox table if volume > 10M events/day

8. FAILURE HANDLING:
   - Failed events auto-retry (max 5 attempts)
   - After max attempts, requires manual intervention
   - Check failed_events_summary view

9. TESTING:
   - Test transaction rollback (outbox should rollback too)
   - Test worker crash (events should remain pending)
   - Test Kafka unavailability (events should queue)
*/
