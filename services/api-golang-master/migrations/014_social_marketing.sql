-- ============================================================================
-- SOCIAL MARKETING TABLES
-- ============================================================================

-- Social Accounts (Facebook, Instagram, LinkedIn, etc.)
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL, -- FACEBOOK, INSTAGRAM, LINKEDIN, TWITTER
    account_name VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL, -- External Platform ID
    page_id VARCHAR(255),             -- For Facebook Pages
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID, -- References users(id)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(platform, account_id)
);

-- Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
    
    content TEXT,
    media_urls TEXT[], -- Array of image/video URLs
    
    -- Scheduling
    scheduled_for TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED, FAILED
    error_message TEXT,
    
    -- Platform specific
    platform_post_id VARCHAR(255),
    
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Analytics (Basic)
CREATE TABLE IF NOT EXISTS social_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    reach INT DEFAULT 0,
    impressions INT DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'SCHEDULED';
