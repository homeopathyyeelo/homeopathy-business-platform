-- AI Tables Migration - Fixed for Prisma Schema Compatibility
-- Adds support for AI models, embeddings, and RAG functionality

-- AI Models metadata
CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,          -- e.g. "llama-2-13b-instruct"
  variant TEXT,                -- e.g. "13b", "7b"
  endpoint_url TEXT NOT NULL,  -- internal inference API
  status TEXT DEFAULT 'ready', -- ready, training, deploying
  model_type TEXT DEFAULT 'llm', -- llm, embedding, classification
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Prompts templates and history (update existing table)
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS variables JSONB;
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- AI Requests audit log
CREATE TABLE IF NOT EXISTS ai_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  requestor_user_id TEXT REFERENCES users(id),
  model_id TEXT REFERENCES ai_models(id),
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
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_type TEXT, -- product, faq, template, doc, campaign
  source_id TEXT,   -- id of product/faq/etc
  text TEXT,
  embedding vector(1536), -- 1536 dims for OpenAI embeddings
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AI Training datasets
CREATE TABLE IF NOT EXISTS ai_training_datasets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  description TEXT,
  s3_path TEXT, -- where dataset is stored (MinIO / S3)
  schema JSONB,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Predictions and recommendations
CREATE TABLE IF NOT EXISTS ai_predictions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  model_type VARCHAR(100) NOT NULL, -- 'demand_forecast', 'pricing', 'vendor_score', 'campaign_optimization'
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'customer', 'vendor', 'campaign'
  entity_id TEXT NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  actual_result JSONB,
  accuracy_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Model Performance tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  model_id TEXT REFERENCES ai_models(id),
  metric_name TEXT NOT NULL, -- 'accuracy', 'latency', 'cost_per_token'
  metric_value DECIMAL(10,4) NOT NULL,
  measurement_date TIMESTAMPTZ DEFAULT now(),
  context JSONB -- additional context about the measurement
);

-- AI Content Generation logs
CREATE TABLE IF NOT EXISTS ai_content_generation (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_type TEXT NOT NULL, -- 'product_description', 'campaign', 'social_media'
  input_data JSONB NOT NULL,
  generated_content JSONB NOT NULL,
  model_used TEXT,
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  quality_score DECIMAL(3,2), -- 0-1 quality rating
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Automation Rules
CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'inventory.low', 'order.created', 'campaign.scheduled'
  conditions JSONB, -- conditions that must be met
  actions JSONB NOT NULL, -- actions to take
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Automation Execution logs
CREATE TABLE IF NOT EXISTS ai_automation_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rule_id TEXT REFERENCES ai_automation_rules(id),
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
INSERT INTO ai_models (id, name, variant, endpoint_url, model_type) VALUES
('local-llm-instruct', 'local-llm-instruct', '13b', 'http://ai-service:8001/v1/generate', 'llm'),
('embed-small', 'embed-small', 'encoder-v1', 'http://ai-service:8001/v1/embed', 'embedding'),
('gpt-3.5-turbo', 'gpt-3.5-turbo', 'openai', 'https://api.openai.com/v1/chat/completions', 'llm'),
('gpt-4', 'gpt-4', 'openai', 'https://api.openai.com/v1/chat/completions', 'llm')
ON CONFLICT (id) DO NOTHING;

-- Insert default AI prompts (update existing ones)
UPDATE ai_prompts SET 
  category = 'product_description',
  variables = '["product_name", "category", "potency", "indications", "target_audience", "tone"]'::jsonb
WHERE id = (SELECT id FROM ai_prompts LIMIT 1);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests(requestor_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model_type ON ai_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ai_automation_rules_trigger ON ai_automation_rules(trigger_event, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_automation_executions_rule ON ai_automation_executions(rule_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_content_generation_type ON ai_content_generation(content_type, created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW ai_usage_stats AS
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

CREATE OR REPLACE VIEW ai_model_performance_summary AS
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
