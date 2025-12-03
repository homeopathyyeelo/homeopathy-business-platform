-- Migration 021: Background Jobs System
-- Create background jobs table for async task processing

-- Create job_status enum
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Create job_type enum
CREATE TYPE job_type AS ENUM ('backup_create', 'backup_restore', 'data_import', 'report_generate', 'email_send', 'bulk_update');

-- Create background_jobs table
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    payload JSONB,
    result JSONB,
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    total INTEGER DEFAULT 100,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_background_jobs_status ON background_jobs(status);
CREATE INDEX idx_background_jobs_type ON background_jobs(job_type);
CREATE INDEX idx_background_jobs_created_by ON background_jobs(created_by);
CREATE INDEX idx_background_jobs_created_at ON background_jobs(created_at DESC);

-- Create job_notifications table for real-time updates
CREATE TABLE IF NOT EXISTS job_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES background_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_notifications_user_id ON job_notifications(user_id);
CREATE INDEX idx_job_notifications_job_id ON job_notifications(job_id);
CREATE INDEX idx_job_notifications_is_read ON job_notifications(is_read);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_background_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_background_jobs_updated_at
    BEFORE UPDATE ON background_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_background_jobs_updated_at();

-- Comments
COMMENT ON TABLE background_jobs IS 'Stores background job information for async task processing';
COMMENT ON COLUMN background_jobs.job_type IS 'Type of background job (backup_create, data_import, etc.)';
COMMENT ON COLUMN background_jobs.status IS 'Current status of the job (pending, running, completed, failed)';
COMMENT ON COLUMN background_jobs.payload IS 'Input parameters for the job as JSON';
COMMENT ON COLUMN background_jobs.result IS 'Result data from completed job as JSON';
COMMENT ON COLUMN background_jobs.progress IS 'Current progress (0-100)';
COMMENT ON COLUMN background_jobs.total IS 'Total items to process';

COMMENT ON TABLE job_notifications IS 'User notifications for job status changes';
