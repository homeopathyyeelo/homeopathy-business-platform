-- App Settings Table for Key-Value Configuration Storage
-- Replaces .env variables with database-backed settings

CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(200) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    value JSONB NOT NULL,
    description VARCHAR(500),
    is_secret BOOLEAN DEFAULT false, -- Mark sensitive data (API keys, passwords)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_active ON app_settings(is_active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Insert default settings (migrating from .env)
INSERT INTO app_settings (key, category, type, value, description, is_secret) VALUES
-- AI Settings
('ai.openai.apiKey', 'ai', 'string', '"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"', 'OpenAI API key for AI services', true),
('ai.openai.model', 'ai', 'string', '"gpt-4o-mini"', 'Default OpenAI model', false),
('ai.enabled', 'ai', 'boolean', 'true', 'Enable AI features', false),

-- Email Settings
('email.smtp.host', 'email', 'string', '""', 'SMTP server host', false),
('email.smtp.port', 'email', 'number', '587', 'SMTP server port', false),
('email.smtp.username', 'email', 'string', '""', 'SMTP username', false),
('email.smtp.password', 'email', 'string', '""', 'SMTP password', true),
('email.from.address', 'email', 'string', '"medicine@yeelohomeopathy.com"', 'Default from email', false),
('email.from.name', 'email', 'string', '"Yeelo Homeopathy"', 'Default from name', false),

-- WhatsApp Settings
('whatsapp.apiKey', 'whatsapp', 'string', '""', 'WhatsApp Business API key', true),
('whatsapp.phoneNumber', 'whatsapp', 'string', '"918478019973"', 'WhatsApp business phone number', false),
('whatsapp.enabled', 'whatsapp', 'boolean', 'false', 'Enable WhatsApp notifications', false),

-- SMS Settings (Kaleyra)
('sms.kaleyra.apiKey', 'sms', 'string', '""', 'Kaleyra SMS API key', true),
('sms.kaleyra.senderId', 'sms', 'string', '""', 'SMS sender ID', false),
('sms.enabled', 'sms', 'boolean', 'false', 'Enable SMS notifications', false),

-- Payment Gateway Settings
('payment.razorpay.keyId', 'payment', 'string', '""', 'Razorpay Key ID', true),
('payment.razorpay.keySecret', 'payment', 'string', '""', 'Razorpay Key Secret', true),
('payment.razorpay.enabled', 'payment', 'boolean', 'false', 'Enable Razorpay', false),
('payment.stripe.publishableKey', 'payment', 'string', '""', 'Stripe Publishable Key', false),
('payment.stripe.secretKey', 'payment', 'string', '""', 'Stripe Secret Key', true),
('payment.stripe.enabled', 'payment', 'boolean', 'false', 'Enable Stripe', false),

-- Social Media Settings
('social.facebook.accessToken', 'social', 'string', '""', 'Facebook Page Access Token', true),
('social.facebook.pageId', 'social', 'string', '""', 'Facebook Page ID', false),
('social.instagram.accessToken', 'social', 'string', '""', 'Instagram Access Token', true),
('social.instagram.accountId', 'social', 'string', '""', 'Instagram Business Account ID', false),

-- Google Maps Settings
('maps.google.apiKey', 'maps', 'string', '""', 'Google Maps API key', true),

-- Storage Settings (AWS S3)
('storage.s3.accessKeyId', 'storage', 'string', '""', 'AWS S3 Access Key ID', true),
('storage.s3.secretAccessKey', 'storage', 'string', '""', 'AWS S3 Secret Access Key', true),
('storage.s3.bucket', 'storage', 'string', '""', 'S3 Bucket name', false),
('storage.s3.region', 'storage', 'string', '"ap-south-1"', 'AWS region', false),

-- Backup Settings
('backup.enabled', 'backup', 'boolean', 'false', 'Enable automatic backups', false),
('backup.schedule', 'backup', 'string', '"0 2 * * *"', 'Backup schedule (cron expression)', false),
('backup.path', 'backup', 'string', '"/var/www/homeopathy-business-platform/backups"', 'Backup directory path', false),
('backup.retention_days', 'backup', 'number', '30', 'Number of days to retain backups', false),
('backup.compress', 'backup', 'boolean', 'true', 'Compress backup files', false),

-- Database Settings
('database.host', 'database', 'string', '"localhost"', 'PostgreSQL host', false),
('database.port', 'database', 'number', '5432', 'PostgreSQL port', false),
('database.name', 'database', 'string', '"yeelo_homeopathy"', 'Database name', false),
('database.user', 'database', 'string', '"postgres"', 'Database user', false),
('database.password', 'database', 'string', '""', 'Database password', true),

-- POS Settings
('pos.thermalPrinter.enabled', 'pos', 'boolean', 'false', 'Enable thermal printer', false),
('pos.thermalPrinter.ip', 'pos', 'string', '""', 'Thermal printer IP address', false),
('pos.barcode.autoFocus', 'pos', 'boolean', 'true', 'Auto-focus barcode scanner', false)

ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMENT ON TABLE app_settings IS 'Application-wide settings stored as key-value pairs';
COMMENT ON COLUMN app_settings.key IS 'Unique setting identifier (dot notation: category.service.property)';
COMMENT ON COLUMN app_settings.type IS 'Data type: string, number, boolean, json';
COMMENT ON COLUMN app_settings.value IS 'JSONB value (always stored as JSON, even for strings)';
COMMENT ON COLUMN app_settings.is_secret IS 'Mark as sensitive data (will be masked in API responses)';
