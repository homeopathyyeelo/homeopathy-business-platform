-- Cron Execution Log
CREATE TABLE IF NOT EXISTS cron_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    execution_time_ms INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_log_job ON cron_execution_log(job_name);
CREATE INDEX idx_cron_log_executed ON cron_execution_log(executed_at DESC);

-- Application Logs (for bug detection)
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    log_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    http_status INTEGER,
    request_id VARCHAR(100),
    user_id UUID,
    ip_address INET,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_logs_service ON application_logs(service_name);
CREATE INDEX idx_app_logs_level ON application_logs(log_level);
CREATE INDEX idx_app_logs_created ON application_logs(created_at DESC);
CREATE INDEX idx_app_logs_status ON application_logs(http_status) WHERE http_status >= 400;

-- Partition by month
CREATE TABLE IF NOT EXISTS application_logs_2025_10 PARTITION OF application_logs
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS application_logs_2025_11 PARTITION OF application_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Kafka DLQ Messages
CREATE TABLE IF NOT EXISTS kafka_dlq_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(200) NOT NULL,
    partition INTEGER NOT NULL,
    offset BIGINT NOT NULL,
    key TEXT,
    value TEXT,
    error_reason TEXT,
    failed_at TIMESTAMPTZ NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    UNIQUE(topic, partition, offset)
);

CREATE INDEX idx_dlq_topic ON kafka_dlq_messages(topic);
CREATE INDEX idx_dlq_processed ON kafka_dlq_messages(processed, failed_at);

-- Service Health Checks
CREATE TABLE IF NOT EXISTS service_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    service_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_service ON service_health_checks(service_name, checked_at DESC);

-- Outbox Publisher Stats
CREATE TABLE IF NOT EXISTS outbox_publisher_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    events_published INTEGER DEFAULT 0,
    events_failed INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ DEFAULT NOW(),
    next_run_at TIMESTAMPTZ
);

-- Sample application logs for testing
INSERT INTO application_logs (service_name, log_level, message, stack_trace, http_status) VALUES
('api-golang-master', 'ERROR', 'Database connection failed', 'sql: connection refused at line 45', 500),
('api-core', 'ERROR', 'Null pointer exception in handler', 'panic: runtime error at handler.go:123', 500),
('ai-service', 'WARN', 'AI model timeout', NULL, NULL)
ON CONFLICT DO NOTHING;

SELECT 'Cron and monitoring tables created!' as result;
