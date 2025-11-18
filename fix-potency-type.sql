-- Fix potency_type constraint issue
-- Set default value for existing NULL records
ALTER TABLE potencies ALTER COLUMN potency_type SET DEFAULT 'DECIMAL';

-- Update existing NULL records
UPDATE potencies SET potency_type = 'DECIMAL' WHERE potency_type IS NULL;

-- Make column NOT NULL (if not already)
ALTER TABLE potencies ALTER COLUMN potency_type SET NOT NULL;

-- Create marketing tables
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- whatsapp, sms, email
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, scheduled
    target_audience TEXT,
    message TEXT,
    scheduled_at TIMESTAMP,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- whatsapp, sms, email
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
