-- =====================================================
-- AUTOMATED BUG TRACKING SYSTEM
-- AI-Powered Bug Detection, Reporting & Auto-Fix
-- =====================================================

-- Bug Reports Table
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, fixed, closed, wont_fix
    
    -- Location & Context
    module_name VARCHAR(100),
    file_path TEXT,
    line_number INTEGER,
    function_name VARCHAR(255),
    error_message TEXT,
    stack_trace TEXT,
    
    -- Environment
    environment VARCHAR(20) DEFAULT 'production', -- development, staging, production
    browser VARCHAR(100),
    os VARCHAR(100),
    user_agent TEXT,
    
    -- User Context
    reported_by UUID,
    affected_user_id UUID,
    user_action TEXT, -- what user was doing when bug occurred
    
    -- Reproduction
    steps_to_reproduce TEXT[],
    expected_behavior TEXT,
    actual_behavior TEXT,
    frequency VARCHAR(20), -- always, often, sometimes, rare
    
    -- AI Analysis
    ai_analysis JSONB, -- AI-generated analysis
    ai_suggested_fix TEXT, -- AI-suggested code fix
    ai_confidence DECIMAL(3,2), -- 0-1 confidence score
    similar_bugs UUID[], -- array of similar bug IDs
    
    -- Fix Tracking
    fix_applied BOOLEAN DEFAULT false,
    fix_code_diff TEXT, -- git diff of the fix
    fix_applied_by UUID,
    fix_applied_at TIMESTAMP,
    fix_verified BOOLEAN DEFAULT false,
    fix_verified_by UUID,
    fix_verified_at TIMESTAMP,
    
    -- Metadata
    priority INTEGER DEFAULT 5, -- 1-10 scale
    tags TEXT[],
    attachments JSONB, -- screenshots, logs, etc.
    related_tickets UUID[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    
    -- Metrics
    time_to_fix INTERVAL,
    impact_score INTEGER, -- calculated based on severity, frequency, users affected
    
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'fixed', 'closed', 'wont_fix'))
);

CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX idx_bug_reports_module ON bug_reports(module_name);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX idx_bug_reports_priority ON bug_reports(priority DESC);
CREATE INDEX idx_bug_reports_environment ON bug_reports(environment);

-- Bug Comments/Activity Log
CREATE TABLE IF NOT EXISTS bug_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    comment_type VARCHAR(20) DEFAULT 'comment', -- comment, status_change, fix_applied, ai_analysis
    content TEXT NOT NULL,
    author_id UUID,
    author_name VARCHAR(255),
    metadata JSONB, -- additional data like old/new status
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bug_comments_bug ON bug_comments(bug_id);
CREATE INDEX idx_bug_comments_created ON bug_comments(created_at DESC);

-- AI Fix Suggestions
CREATE TABLE IF NOT EXISTS ai_fix_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    suggestion_number INTEGER NOT NULL,
    
    -- Fix Details
    fix_title VARCHAR(255) NOT NULL,
    fix_description TEXT,
    code_changes TEXT NOT NULL, -- actual code diff/patch
    files_affected TEXT[],
    
    -- AI Metadata
    ai_model VARCHAR(50), -- gpt-4, claude, etc.
    confidence_score DECIMAL(3,2),
    reasoning TEXT, -- why AI suggests this fix
    
    -- Testing
    test_cases TEXT[], -- suggested test cases
    potential_side_effects TEXT,
    
    -- Approval
    approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP,
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP,
    
    -- Feedback
    worked BOOLEAN,
    feedback TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(bug_id, suggestion_number)
);

CREATE INDEX idx_ai_suggestions_bug ON ai_fix_suggestions(bug_id);
CREATE INDEX idx_ai_suggestions_approved ON ai_fix_suggestions(approved);

-- Bug Patterns (for learning)
CREATE TABLE IF NOT EXISTS bug_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50), -- syntax_error, logic_error, performance, security
    
    -- Pattern Definition
    error_signature TEXT, -- regex or pattern to match
    common_causes TEXT[],
    common_fixes TEXT[],
    
    -- Statistics
    occurrence_count INTEGER DEFAULT 1,
    fix_success_rate DECIMAL(5,2),
    avg_time_to_fix INTERVAL,
    
    -- Learning
    last_seen_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(pattern_name)
);

-- Automated Bug Detection Logs
CREATE TABLE IF NOT EXISTS bug_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_type VARCHAR(50), -- error_log, performance_monitor, user_report, automated_test
    
    -- Detection Details
    error_type VARCHAR(100),
    error_message TEXT,
    context JSONB,
    
    -- Auto-created Bug
    bug_created BOOLEAN DEFAULT false,
    bug_id UUID REFERENCES bug_reports(id),
    
    -- Deduplication
    signature_hash VARCHAR(64), -- hash of error signature for dedup
    duplicate_of UUID REFERENCES bug_detection_logs(id),
    
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_detection_logs_type ON bug_detection_logs(detection_type);
CREATE INDEX idx_detection_logs_signature ON bug_detection_logs(signature_hash);
CREATE INDEX idx_detection_logs_detected ON bug_detection_logs(detected_at DESC);

-- Bug Impact Tracking
CREATE TABLE IF NOT EXISTS bug_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    
    -- Impact Metrics
    users_affected INTEGER DEFAULT 0,
    sessions_affected INTEGER DEFAULT 0,
    revenue_impact DECIMAL(15,2) DEFAULT 0,
    
    -- Time Metrics
    total_downtime INTERVAL,
    avg_user_wait_time INTERVAL,
    
    -- Business Impact
    critical_feature_blocked BOOLEAN DEFAULT false,
    customer_complaints INTEGER DEFAULT 0,
    
    -- Tracking Period
    tracked_from TIMESTAMP DEFAULT NOW(),
    tracked_to TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_impact_tracking_bug ON bug_impact_tracking(bug_id);

-- Function to auto-generate bug code
CREATE OR REPLACE FUNCTION generate_bug_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bug_code IS NULL THEN
        NEW.bug_code := 'BUG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('bug_code_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS bug_code_seq START 1;

CREATE TRIGGER trigger_generate_bug_code
BEFORE INSERT ON bug_reports
FOR EACH ROW
EXECUTE FUNCTION generate_bug_code();

-- Function to update bug updated_at
CREATE TRIGGER trigger_bug_reports_updated_at
BEFORE UPDATE ON bug_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate time_to_fix
CREATE OR REPLACE FUNCTION calculate_time_to_fix()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'fixed' AND OLD.status != 'fixed' THEN
        NEW.time_to_fix := NOW() - NEW.created_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_time_to_fix
BEFORE UPDATE ON bug_reports
FOR EACH ROW
EXECUTE FUNCTION calculate_time_to_fix();

-- View for bug dashboard
CREATE OR REPLACE VIEW bug_dashboard_summary AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'open') as open_bugs,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_bugs,
    COUNT(*) FILTER (WHERE status = 'fixed') as fixed_bugs,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_bugs,
    COUNT(*) FILTER (WHERE severity = 'high') as high_bugs,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as bugs_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as bugs_last_week,
    AVG(time_to_fix) FILTER (WHERE time_to_fix IS NOT NULL) as avg_time_to_fix,
    COUNT(*) FILTER (WHERE fix_applied = true) as auto_fixed_bugs,
    AVG(ai_confidence) FILTER (WHERE ai_confidence IS NOT NULL) as avg_ai_confidence
FROM bug_reports;

-- Sample data for testing
INSERT INTO bug_reports (title, description, severity, module_name, file_path, error_message, status) VALUES
    ('404 Error on /inventory/expiry', 'Page returns 404 when accessing expiry dashboard', 'high', 'inventory', '/app/inventory/expiry/page.tsx', 'Not Found', 'open'),
    ('Slow product search', 'Product search takes >5 seconds with 1000+ products', 'medium', 'products', '/services/api-golang/products_handler.go', 'Query timeout', 'open'),
    ('Invoice upload fails for large PDFs', 'PDFs >10MB fail to upload', 'high', 'purchases', '/services/invoice-parser-service/app/api/routes/upload.py', 'Request Entity Too Large', 'open')
ON CONFLICT DO NOTHING;

SELECT 'Automated bug tracking system created successfully!' as result;
