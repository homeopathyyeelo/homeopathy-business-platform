-- =====================================================
-- AI-DRIVEN SELF-HEALING SYSTEM
-- Automated bug detection, analysis, and fixing
-- =====================================================

-- System Bugs Table (Main tracking)
CREATE TABLE IF NOT EXISTS system_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Source Information
    service_name VARCHAR(100) NOT NULL, -- api-golang, invoice-parser, api-gateway, etc.
    module VARCHAR(100), -- handler, service, repository, etc.
    component VARCHAR(100), -- specific file or function
    
    -- Bug Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL, -- P0_critical, P1_major, P2_minor, P3_low
    bug_type VARCHAR(50), -- backend_error, frontend_error, db_error, logic_bug, performance
    
    -- Error Context
    log_excerpt TEXT,
    stack_trace TEXT,
    error_message TEXT,
    http_status_code INTEGER,
    request_path TEXT,
    request_method VARCHAR(10),
    
    -- Environment
    environment VARCHAR(20) DEFAULT 'production', -- development, staging, production
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    last_occurred_at TIMESTAMP DEFAULT NOW(),
    
    -- AI Analysis
    ai_analysis JSONB, -- Full AI analysis with root cause
    root_cause_hypothesis TEXT,
    suggested_fix TEXT, -- Code diff or fix description
    fix_confidence DECIMAL(3,2), -- 0-1 confidence score
    estimated_impact TEXT, -- Low, Medium, High
    related_bugs UUID[], -- Similar bugs
    
    -- Fix Details
    fix_type VARCHAR(50), -- code_patch, config_change, db_migration, dependency_update
    files_to_modify TEXT[], -- List of files
    code_diff TEXT, -- Actual patch
    commit_message TEXT,
    test_cases TEXT[], -- Suggested test cases
    
    -- Status & Workflow
    status VARCHAR(30) DEFAULT 'detected', -- detected, analyzed, pending_review, approved, fixing, fixed, failed, ignored
    priority INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Approval & Fix Tracking
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- Git Integration
    branch_name VARCHAR(255),
    pr_url TEXT,
    fixed_commit_sha VARCHAR(40),
    deployed_at TIMESTAMP,
    
    -- Testing
    test_status VARCHAR(20), -- pending, running, passed, failed
    test_results JSONB,
    
    -- Metrics
    time_to_detect INTERVAL,
    time_to_analyze INTERVAL,
    time_to_fix INTERVAL,
    
    -- Metadata
    tags TEXT[],
    affected_users INTEGER DEFAULT 0,
    business_impact TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity IN ('P0_critical', 'P1_major', 'P2_minor', 'P3_low')),
    CONSTRAINT valid_status CHECK (status IN ('detected', 'analyzed', 'pending_review', 'approved', 'fixing', 'fixed', 'failed', 'ignored'))
);

CREATE INDEX idx_system_bugs_service ON system_bugs(service_name);
CREATE INDEX idx_system_bugs_severity ON system_bugs(severity);
CREATE INDEX idx_system_bugs_status ON system_bugs(status);
CREATE INDEX idx_system_bugs_occurred ON system_bugs(occurred_at DESC);
CREATE INDEX idx_system_bugs_priority ON system_bugs(priority DESC);

-- System Logs (Centralized logging)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    service_name VARCHAR(100) NOT NULL,
    log_level VARCHAR(20) NOT NULL, -- DEBUG, INFO, WARN, ERROR, FATAL
    
    -- Content
    message TEXT NOT NULL,
    error_type VARCHAR(100),
    stack_trace TEXT,
    context JSONB, -- Additional context data
    
    -- Request Context
    request_id UUID,
    user_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    
    -- Processed
    processed BOOLEAN DEFAULT false,
    bug_created BOOLEAN DEFAULT false,
    bug_id UUID REFERENCES system_bugs(id),
    
    -- Deduplication
    log_hash VARCHAR(64), -- Hash for deduplication
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_logs_service ON system_logs(service_name);
CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_processed ON system_logs(processed) WHERE processed = false;
CREATE INDEX idx_system_logs_hash ON system_logs(log_hash);

-- AI Fix Suggestions (Multiple fixes per bug)
CREATE TABLE IF NOT EXISTS ai_fix_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES system_bugs(id) ON DELETE CASCADE,
    suggestion_number INTEGER NOT NULL,
    
    -- Fix Details
    fix_title VARCHAR(255) NOT NULL,
    fix_description TEXT,
    fix_approach TEXT, -- Detailed explanation
    
    -- Code Changes
    code_diff TEXT NOT NULL,
    files_affected TEXT[] NOT NULL,
    lines_changed INTEGER,
    
    -- AI Metadata
    ai_model VARCHAR(50), -- gpt-4, claude-3, etc.
    confidence_score DECIMAL(3,2) NOT NULL,
    reasoning TEXT,
    
    -- Impact Analysis
    breaking_changes BOOLEAN DEFAULT false,
    estimated_effort VARCHAR(20), -- low, medium, high
    potential_side_effects TEXT,
    dependencies_affected TEXT[],
    
    -- Testing
    test_cases TEXT[],
    test_coverage_impact DECIMAL(5,2),
    
    -- Validation
    syntax_valid BOOLEAN,
    linter_passed BOOLEAN,
    security_scan_passed BOOLEAN,
    
    -- Status
    status VARCHAR(20) DEFAULT 'suggested', -- suggested, approved, rejected, applied, failed
    applied_at TIMESTAMP,
    applied_by UUID,
    
    -- Feedback
    worked BOOLEAN,
    feedback TEXT,
    user_rating INTEGER, -- 1-5 stars
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(bug_id, suggestion_number)
);

CREATE INDEX idx_ai_suggestions_bug ON ai_fix_suggestions(bug_id);
CREATE INDEX idx_ai_suggestions_status ON ai_fix_suggestions(status);
CREATE INDEX idx_ai_suggestions_confidence ON ai_fix_suggestions(confidence_score DESC);

-- System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service Info
    service_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- cpu, memory, disk, api_latency, error_rate, etc.
    
    -- Metrics
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20), -- percent, ms, mb, count, etc.
    threshold_warning DECIMAL(15,4),
    threshold_critical DECIMAL(15,4),
    
    -- Status
    status VARCHAR(20), -- healthy, warning, critical
    alert_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_service ON system_health_metrics(service_name);
CREATE INDEX idx_health_metrics_type ON system_health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded ON system_health_metrics(recorded_at DESC);
CREATE INDEX idx_health_metrics_status ON system_health_metrics(status);

-- Cron Job Status
CREATE TABLE IF NOT EXISTS cron_job_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job Info
    job_name VARCHAR(100) UNIQUE NOT NULL,
    job_type VARCHAR(50), -- monitoring, cleanup, backup, analysis
    schedule VARCHAR(50), -- cron expression
    
    -- Status
    status VARCHAR(20) DEFAULT 'idle', -- idle, running, completed, failed
    enabled BOOLEAN DEFAULT true,
    
    -- Execution
    last_run_at TIMESTAMP,
    last_success_at TIMESTAMP,
    last_failure_at TIMESTAMP,
    next_run_at TIMESTAMP,
    
    -- Metrics
    total_runs INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    avg_duration_ms INTEGER,
    last_duration_ms INTEGER,
    
    -- Error Tracking
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cron_jobs_name ON cron_job_status(job_name);
CREATE INDEX idx_cron_jobs_enabled ON cron_job_status(enabled);
CREATE INDEX idx_cron_jobs_next_run ON cron_job_status(next_run_at);

-- Bug Patterns (Learning system)
CREATE TABLE IF NOT EXISTS bug_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern Info
    pattern_name VARCHAR(255) NOT NULL UNIQUE,
    pattern_type VARCHAR(50), -- null_pointer, sql_error, timeout, memory_leak, etc.
    
    -- Detection
    error_signature TEXT, -- Regex or pattern to match
    service_patterns TEXT[], -- Which services this affects
    
    -- Analysis
    common_causes TEXT[],
    common_fixes TEXT[],
    prevention_tips TEXT[],
    
    -- Statistics
    occurrence_count INTEGER DEFAULT 1,
    fix_success_rate DECIMAL(5,2),
    avg_time_to_fix INTERVAL,
    avg_confidence_score DECIMAL(3,2),
    
    -- Learning
    last_seen_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bug_patterns_type ON bug_patterns(pattern_type);
CREATE INDEX idx_bug_patterns_occurrence ON bug_patterns(occurrence_count DESC);

-- Auto-Fix History
CREATE TABLE IF NOT EXISTS auto_fix_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES system_bugs(id),
    suggestion_id UUID REFERENCES ai_fix_suggestions(id),
    
    -- Fix Details
    fix_action VARCHAR(50), -- applied, reverted, modified
    
    -- Before/After
    code_before TEXT,
    code_after TEXT,
    
    -- Execution
    applied_by UUID,
    applied_at TIMESTAMP DEFAULT NOW(),
    
    -- Testing
    tests_run INTEGER,
    tests_passed INTEGER,
    tests_failed INTEGER,
    
    -- Result
    success BOOLEAN,
    error_message TEXT,
    
    -- Rollback
    rolled_back BOOLEAN DEFAULT false,
    rollback_reason TEXT,
    rolled_back_at TIMESTAMP,
    
    -- Impact
    services_restarted TEXT[],
    downtime_seconds INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auto_fix_history_bug ON auto_fix_history(bug_id);
CREATE INDEX idx_auto_fix_history_applied ON auto_fix_history(applied_at DESC);

-- System Alerts
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alert Info
    alert_type VARCHAR(50) NOT NULL, -- bug_detected, service_down, high_error_rate, performance_degradation
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Source
    source_service VARCHAR(100),
    source_type VARCHAR(50), -- bug, metric, log, cron
    source_id UUID, -- Reference to bug_id, metric_id, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved, ignored
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Notification
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[], -- email, slack, sms, webhook
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_status ON system_alerts(status);
CREATE INDEX idx_system_alerts_created ON system_alerts(created_at DESC);

-- Functions

-- Auto-generate bug code
CREATE OR REPLACE FUNCTION generate_bug_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bug_code IS NULL THEN
        NEW.bug_code := 'BUG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('bug_code_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS bug_code_seq START 1;

CREATE TRIGGER trigger_generate_bug_code
BEFORE INSERT ON system_bugs
FOR EACH ROW
EXECUTE FUNCTION generate_bug_code();

-- Update timestamps
CREATE TRIGGER trigger_system_bugs_updated_at
BEFORE UPDATE ON system_bugs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cron_jobs_updated_at
BEFORE UPDATE ON cron_job_status
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Calculate time metrics
CREATE OR REPLACE FUNCTION calculate_bug_time_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'analyzed' AND OLD.status = 'detected' THEN
        NEW.time_to_analyze := NOW() - NEW.occurred_at;
    END IF;
    
    IF NEW.status = 'fixed' AND OLD.status != 'fixed' THEN
        NEW.time_to_fix := NOW() - NEW.occurred_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_bug_metrics
BEFORE UPDATE ON system_bugs
FOR EACH ROW
EXECUTE FUNCTION calculate_bug_time_metrics();

-- Views

-- Active Bugs Dashboard
CREATE OR REPLACE VIEW v_active_bugs_dashboard AS
SELECT 
    COUNT(*) FILTER (WHERE status IN ('detected', 'analyzed', 'pending_review')) as active_bugs,
    COUNT(*) FILTER (WHERE severity = 'P0_critical') as critical_bugs,
    COUNT(*) FILTER (WHERE severity = 'P1_major') as major_bugs,
    COUNT(*) FILTER (WHERE status = 'fixing') as bugs_being_fixed,
    COUNT(*) FILTER (WHERE status = 'fixed' AND fixed_commit_sha IS NOT NULL) as auto_fixed_bugs,
    AVG(time_to_fix) FILTER (WHERE time_to_fix IS NOT NULL) as avg_time_to_fix,
    AVG(fix_confidence) FILTER (WHERE fix_confidence IS NOT NULL) as avg_fix_confidence,
    COUNT(*) FILTER (WHERE occurred_at > NOW() - INTERVAL '24 hours') as bugs_last_24h,
    COUNT(*) FILTER (WHERE occurred_at > NOW() - INTERVAL '7 days') as bugs_last_week
FROM system_bugs;

-- Service Health Summary
CREATE OR REPLACE VIEW v_service_health_summary AS
SELECT 
    service_name,
    COUNT(*) FILTER (WHERE status = 'critical') as critical_metrics,
    COUNT(*) FILTER (WHERE status = 'warning') as warning_metrics,
    MAX(recorded_at) as last_check,
    jsonb_object_agg(metric_type, value) as latest_metrics
FROM system_health_metrics
WHERE recorded_at > NOW() - INTERVAL '5 minutes'
GROUP BY service_name;

-- Cron Jobs Summary
CREATE OR REPLACE VIEW v_cron_jobs_summary AS
SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE enabled = true) as enabled_jobs,
    COUNT(*) FILTER (WHERE status = 'running') as running_jobs,
    COUNT(*) FILTER (WHERE consecutive_failures > 3) as failing_jobs,
    AVG(success_count::DECIMAL / NULLIF(total_runs, 0)) as avg_success_rate
FROM cron_job_status;

-- Sample Data

-- Insert cron jobs
INSERT INTO cron_job_status (job_name, job_type, schedule, enabled) VALUES
    ('expiry_check_job', 'monitoring', '0 * * * *', true),
    ('bug_scan_job', 'monitoring', '*/10 * * * *', true),
    ('ai_fix_check_job', 'analysis', '*/30 * * * *', true),
    ('health_check_job', 'monitoring', '*/5 * * * *', true),
    ('backup_job', 'backup', '0 2 * * *', true),
    ('log_cleanup_job', 'cleanup', '0 3 * * *', true),
    ('metrics_aggregation_job', 'analysis', '*/15 * * * *', true)
ON CONFLICT (job_name) DO NOTHING;

-- Insert sample bug patterns
INSERT INTO bug_patterns (pattern_name, pattern_type, error_signature, common_causes, common_fixes) VALUES
    ('Null Pointer Exception', 'null_pointer', 'nil pointer dereference|null pointer', 
     ARRAY['Missing null check', 'Uninitialized variable', 'Invalid data from DB'],
     ARRAY['Add null check before access', 'Initialize variable properly', 'Add database constraint']),
    ('SQL Constraint Violation', 'sql_error', 'violates.*constraint|duplicate key',
     ARRAY['Duplicate entry', 'Foreign key mismatch', 'Invalid data type'],
     ARRAY['Add unique check before insert', 'Validate foreign keys', 'Add data validation']),
    ('API Timeout', 'timeout', 'context deadline exceeded|timeout',
     ARRAY['Slow database query', 'External API delay', 'Resource contention'],
     ARRAY['Optimize query', 'Add timeout handling', 'Implement caching'])
ON CONFLICT (pattern_name) DO NOTHING;

SELECT 'AI Self-Healing System schema created successfully!' as result;
