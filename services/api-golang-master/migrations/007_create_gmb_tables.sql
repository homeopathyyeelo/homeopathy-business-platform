-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GMB Accounts - stores connected GMB accounts
CREATE TABLE IF NOT EXISTS gmb_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL UNIQUE,
    location_id VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- GMB Posts - stores created posts
CREATE TABLE IF NOT EXISTS gmb_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES gmb_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, PUBLISHED, FAILED
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    post_url VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GMB History - tracks all GMB actions
CREATE TABLE IF NOT EXISTS gmb_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES gmb_accounts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- POST_CREATED, POST_PUBLISHED, ERROR, etc.
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GMB Schedules - stores scheduling configuration
CREATE TABLE IF NOT EXISTS gmb_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES gmb_accounts(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    schedule_type VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY, SEASONAL
    time_of_day TIME NOT NULL, -- Time of day to post
    day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    day_of_month INTEGER, -- 1-31
    seasonal_preset VARCHAR(50), -- WINTER, SUMMER, MONSOON, FESTIVE
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gmb_posts_account_id ON gmb_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_gmb_posts_status ON gmb_posts(status);
CREATE INDEX IF NOT EXISTS idx_gmb_history_account_id ON gmb_history(account_id);
CREATE INDEX IF NOT EXISTS idx_gmb_schedules_next_run ON gmb_schedules(next_run_at) WHERE is_active = true;
