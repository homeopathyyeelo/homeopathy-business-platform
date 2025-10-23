-- Integrations Module - Complete Database Schema
-- Migration 006: Payment Gateways, Hardware, Third-party APIs

-- Payment Gateways
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'paypal', 'paytm', 'phonepe')),
    display_name VARCHAR(255),
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,
    merchant_id VARCHAR(255),
    is_live BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    supported_currencies JSONB,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    gateway_id UUID REFERENCES payment_gateways(id),
    order_id UUID,
    customer_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) CHECK (status IN ('initiated', 'pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled')),
    payment_method VARCHAR(50),
    card_last4 VARCHAR(4),
    bank_reference VARCHAR(255),
    gateway_response JSONB,
    metadata JSONB,
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hardware Devices
CREATE TABLE IF NOT EXISTS hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type VARCHAR(50) CHECK (device_type IN ('printer', 'scanner', 'weighing', 'display', 'cash_drawer')),
    device_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    connection_type VARCHAR(50) CHECK (connection_type IN ('usb', 'serial', 'network', 'bluetooth')),
    connection_config JSONB,
    branch_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_connected_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'disconnected',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Integrations
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(50),
    api_endpoint VARCHAR(500),
    api_key TEXT,
    api_secret TEXT,
    auth_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB,
    headers JSONB,
    status VARCHAR(20),
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Gateway Config
CREATE TABLE IF NOT EXISTS sms_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) CHECK (provider IN ('twilio', 'msg91', 'textlocal', 'gupshup')),
    api_key TEXT,
    sender_id VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_id UUID REFERENCES sms_gateways(id),
    recipient_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    message_id VARCHAR(255),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Business API
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id VARCHAR(255),
    business_account_id VARCHAR(255),
    access_token TEXT,
    webhook_verify_token TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE,
    recipient_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50),
    template_name VARCHAR(255),
    message_content TEXT,
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email SMTP Configuration
CREATE TABLE IF NOT EXISTS email_smtp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username VARCHAR(255),
    smtp_password TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    encryption VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(created_at DESC);
CREATE INDEX idx_hardware_devices_type ON hardware_devices(device_type);
CREATE INDEX idx_hardware_devices_active ON hardware_devices(is_active);
CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_date ON webhook_logs(created_at DESC);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Comments
COMMENT ON TABLE payment_gateways IS 'Payment gateway configurations';
COMMENT ON TABLE payment_transactions IS 'Payment transaction history';
COMMENT ON TABLE hardware_devices IS 'Connected hardware devices';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp Business API message logs';
