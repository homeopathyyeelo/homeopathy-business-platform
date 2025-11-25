-- ============================================================================
-- GOOGLE MY BUSINESS (GMB) AUTOMATION SCHEMA
-- HomeoERP Social / GMB Posting, Scheduling & AI Automation
-- NOTE: Core users table already exists with UUID primary key in 001_init.sql
-- This migration only adds GMB-specific tables.
-- ============================================================================

-- 1) GMB ACCOUNTS (OAuth + Business Locations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- OAuth Data
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    -- Business Details
    gmb_account_id VARCHAR(255),   -- Google Account ID
    gmb_location_id VARCHAR(255),  -- Business Location ID
    business_name VARCHAR(255),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gmb_active ON gmb_accounts(is_active);

-- 2) SCHEDULES (Daily / Weekly / Monthly / Seasonal / Disease)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_schedules (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gmb_account_id BIGINT REFERENCES gmb_accounts(id) ON DELETE CASCADE,

    schedule_type VARCHAR(50) NOT NULL,  
        -- now, daily, weekly, monthly, seasonal, disease_trend

    schedule_time TIME,             -- time of posting (for daily/week/month)
    schedule_day SMALLINT,          -- 0–6 (Mon–Sun) for weekly
    schedule_date SMALLINT,         -- 1–31 for monthly posts

    season VARCHAR(20),             -- winter/summer/monsoon
    disease_topic VARCHAR(255),     -- e.g., dengue, flu, covid

    is_enabled BOOLEAN DEFAULT TRUE,
    auto_approve BOOLEAN DEFAULT TRUE,

    last_run TIMESTAMP,
    next_run TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_enabled ON gmb_schedules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_schedule_next_run ON gmb_schedules(next_run);

-- 3) GENERATED POSTS (Drafts + AI Output)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gmb_account_id BIGINT REFERENCES gmb_accounts(id) ON DELETE CASCADE,

    schedule_id BIGINT REFERENCES gmb_schedules(id) ON DELETE SET NULL,

    title TEXT,
    content TEXT,
    images JSONB,                   -- store file paths or GMB media IDs
    source VARCHAR(50),             -- manual, ai, seasonal, disease, random

    is_valid BOOLEAN DEFAULT FALSE,  
    validation_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gmb_posts_schedule ON gmb_posts(schedule_id);

-- 4) POST HISTORY (FINAL POSTED RESULTS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_history (
    id BIGSERIAL PRIMARY KEY,
    gmb_account_id BIGINT REFERENCES gmb_accounts(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES gmb_posts(id) ON DELETE SET NULL,

    gmb_post_id VARCHAR(255),      -- ID returned by Google API
    title TEXT,
    content TEXT,
    images JSONB,

    status VARCHAR(20),            -- success, failed
    error_message TEXT,

    posted_at TIMESTAMP DEFAULT NOW(),

    views INT DEFAULT 0,           -- Optional engagement stats
    clicks INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_gmb_history_posted_at ON gmb_history(posted_at);

-- 5) DISEASE TREND DATA (For India / News AI)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_trending_diseases (
    id BIGSERIAL PRIMARY KEY,
    disease_name VARCHAR(255),
    severity_level SMALLINT,        -- 1-10
    region VARCHAR(255) DEFAULT 'India',
    source VARCHAR(255),            -- RSS/news
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_name ON gmb_trending_diseases(disease_name);

-- 6) AI GENERATION LOGS (For debugging / traceability)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gmb_account_id BIGINT REFERENCES gmb_accounts(id),

    topic TEXT,
    ai_prompt TEXT,
    ai_output TEXT,

    is_valid BOOLEAN,
    validation_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_generation_logs(user_id);

-- 7) PERMISSIONS TABLE (Granular control)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gmb_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gmb_account_id BIGINT REFERENCES gmb_accounts(id) ON DELETE CASCADE,

    can_post BOOLEAN DEFAULT FALSE,
    can_schedule BOOLEAN DEFAULT FALSE,
    can_generate_ai BOOLEAN DEFAULT TRUE,
    can_view_history BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_perm_user_account
    ON gmb_user_permissions(user_id, gmb_account_id);
