-- AI Tables Migration
-- Adds support for AI models, embeddings, and RAG functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- AI Models metadata
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- e.g. "llama-2-13b-instruct"
  variant TEXT,                -- e.g. "13b", "7b"
  endpoint_url TEXT NOT NULL,  -- internal inference API
  status TEXT DEFAULT 'ready', -- ready, training, deploying
  model_type TEXT DEFAULT 'llm', -- llm, embedding, classification
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Prompts templates and history
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE,             -- e.g. 'ig_daily_post_v2'
  language TEXT DEFAULT 'en',
  prompt_template TEXT NOT NULL,
  description TEXT,
  category TEXT,               -- 'social_media', 'product_description', 'campaign'
  variables JSONB,             -- Template variables
  last_used TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Requests audit log
CREATE TABLE ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requestor_user_id UUID REFERENCES users(id),
  model_id UUID REFERENCES ai_models(id),
  prompt TEXT NOT NULL,
  context JSONB,
  response TEXT,
  tokens_used INTEGER,
  cost_estimate NUMERIC(10,4),
  status TEXT DEFAULT 'done', -- pending, processing, done, failed
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Embeddings for RAG (using pgvector extension)
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT, -- product, faq, template, doc, campaign
  source_id UUID,   -- id of product/faq/etc
  text TEXT,
  embedding vector(1536), -- 1536 dims for OpenAI embeddings
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AI Training datasets
CREATE TABLE ai_training_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  s3_path TEXT, -- where dataset is stored (MinIO / S3)
  schema JSONB,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Predictions and recommendations
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(100) NOT NULL, -- 'demand_forecast', 'pricing', 'vendor_score', 'campaign_optimization'
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'customer', 'vendor', 'campaign'
  entity_id UUID NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  actual_result JSONB,
  accuracy_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Model Performance tracking
CREATE TABLE ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ai_models(id),
  metric_name TEXT NOT NULL, -- 'accuracy', 'latency', 'cost_per_token'
  metric_value DECIMAL(10,4) NOT NULL,
  measurement_date TIMESTAMPTZ DEFAULT now(),
  context JSONB -- additional context about the measurement
);

-- AI Content Generation logs
CREATE TABLE ai_content_generation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'product_description', 'campaign', 'social_media'
  input_data JSONB NOT NULL,
  generated_content JSONB NOT NULL,
  model_used TEXT,
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  quality_score DECIMAL(3,2), -- 0-1 quality rating
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Automation Rules
CREATE TABLE ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'inventory.low', 'order.created', 'campaign.scheduled'
  conditions JSONB, -- conditions that must be met
  actions JSONB NOT NULL, -- actions to take
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Automation Execution logs
CREATE TABLE ai_automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES ai_automation_rules(id),
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  execution_status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  result_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Insert default AI models
INSERT INTO ai_models (name, variant, endpoint_url, model_type) VALUES
('local-llm-instruct', '13b', 'http://ai-service:8001/v1/generate', 'llm'),
('embed-small', 'encoder-v1', 'http://ai-service:8001/v1/embed', 'embedding'),
('gpt-3.5-turbo', 'openai', 'https://api.openai.com/v1/chat/completions', 'llm'),
('gpt-4', 'openai', 'https://api.openai.com/v1/chat/completions', 'llm');

-- Insert default AI prompts
INSERT INTO ai_prompts (key, language, prompt_template, description, category, variables) VALUES
('product_description_v1', 'en', 'Create a compelling product description for a homeopathy product: {{product_name}}. Category: {{category}}. Potency: {{potency}}. Indications: {{indications}}. Target Audience: {{target_audience}}. Write in a {{tone}} tone, include benefits and usage instructions, mention safety and natural healing aspects, keep it between 150-250 words, make it SEO-friendly, include a compelling call-to-action.', 'Generate product descriptions for homeopathy products', 'product_description', '["product_name", "category", "potency", "indications", "target_audience", "tone"]'),

('instagram_post_v1', 'en', 'Create an Instagram post for homeopathy product: {{product_name}}. Benefits: {{benefits}}. Include: engaging caption (40-80 words), 5-7 relevant hashtags, emoji usage, call-to-action. Make it visually appealing and authentic.', 'Generate Instagram posts for products', 'social_media', '["product_name", "benefits"]'),

('whatsapp_promo_v1', 'en', 'Create a WhatsApp promotional message for homeopathy business. Highlight: {{offer}}. Mention: {{product_benefits}}. Include clear call-to-action. Keep it concise and engaging (2-3 lines).', 'Generate WhatsApp promotional messages', 'campaign', '["offer", "product_benefits"]'),

('campaign_seasonal_v1', 'en', 'Create a {{season}} seasonal marketing campaign for homeopathy business. Target audience: {{target_audience}}. Products: {{products}}. Generate: campaign theme, Instagram caption, WhatsApp message, email subject line, call-to-action suggestions. Make it engaging, authentic, and focused on natural healing benefits.', 'Generate seasonal marketing campaigns', 'campaign', '["season", "target_audience", "products"]'),

('demand_forecast_v1', 'en', 'Analyze sales data for product {{product_name}} in shop {{shop_code}}. Historical sales: {{sales_data}}. Predict demand for next {{days_ahead}} days. Consider seasonality: {{seasonality_factor}}. Return: forecasted quantity, confidence score, reasoning, recommendations.', 'Generate demand forecasts', 'forecasting', '["product_name", "shop_code", "sales_data", "days_ahead", "seasonality_factor"]'),

('pricing_optimization_v1', 'en', 'Calculate optimal pricing for product {{product_name}}. Current price: ₹{{current_price}}. Cost price: ₹{{cost_price}}. Current stock: {{current_stock}}. Demand forecast: {{demand_forecast}}. Expiry date: {{expiry_date}}. Competitor prices: {{competitor_prices}}. Provide: recommended price, confidence score, reasoning, expected impact on sales and profit.', 'Optimize product pricing', 'pricing', '["product_name", "current_price", "cost_price", "current_stock", "demand_forecast", "expiry_date", "competitor_prices"]');

-- Insert default automation rules
INSERT INTO ai_automation_rules (name, description, trigger_event, conditions, actions, created_by) VALUES
('Auto Forecast on Low Stock', 'Automatically generate demand forecast when inventory is low', 'inventory.low', '{"stock_ratio": "< 0.5"}', '{"action": "forecast_demand", "days_ahead": 30}', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),

('Dynamic Pricing for Expiring Products', 'Suggest dynamic pricing for products nearing expiry', 'inventory.expiring', '{"days_to_expiry": "< 30"}', '{"action": "calculate_pricing", "include_expiry": true}', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),

('Auto Campaign Generation', 'Generate campaign content when new campaign is created', 'campaign.created', '{}', '{"action": "generate_campaign_content", "channels": ["instagram", "whatsapp"]}', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),

('Product Recommendations', 'Suggest complementary products for new orders', 'order.created', '{"order_value": "> 500"}', '{"action": "generate_recommendations", "max_recommendations": 3}', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- Create indexes for performance
CREATE INDEX idx_ai_requests_user_id ON ai_requests(requestor_user_id);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at);
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX idx_ai_predictions_model_type ON ai_predictions(model_type);
CREATE INDEX idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX idx_ai_automation_rules_trigger ON ai_automation_rules(trigger_event, is_active);
CREATE INDEX idx_ai_automation_executions_rule ON ai_automation_executions(rule_id, created_at);
CREATE INDEX idx_ai_content_generation_type ON ai_content_generation(content_type, created_at);

-- Create views for common queries
CREATE VIEW ai_usage_stats AS
SELECT 
  DATE(created_at) as date,
  model_id,
  COUNT(*) as request_count,
  SUM(tokens_used) as total_tokens,
  AVG(processing_time_ms) as avg_processing_time,
  SUM(cost_estimate) as total_cost
FROM ai_requests 
WHERE status = 'done'
GROUP BY DATE(created_at), model_id;

CREATE VIEW ai_model_performance_summary AS
SELECT 
  m.name as model_name,
  m.variant,
  AVG(p.metric_value) as avg_accuracy,
  COUNT(p.id) as measurement_count,
  MAX(p.measurement_date) as last_measured
FROM ai_models m
LEFT JOIN ai_model_performance p ON m.id = p.model_id AND p.metric_name = 'accuracy'
GROUP BY m.id, m.name, m.variant;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yeelo;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yeelo;
