# 🤖 Yeelo AI-Powered ERP System Guide

## 🎯 Overview

Your homeopathy business platform now includes a comprehensive AI system that automates content generation, demand forecasting, dynamic pricing, and business intelligence. This guide will help you understand and use all the AI features.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI-POWERED ERP SYSTEM                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │   API Gateway   │    AI Services          │
│                 │                 │                         │
│ • Next.js App   │ • NestJS        │ • Content Generation    │
│ • Admin Panel   │ • Fastify       │ • Demand Forecasting    │
│ • Dealer Portal │ • Express       │ • Dynamic Pricing       │
│ • Mobile App    │ • GraphQL       │ • Campaign Automation   │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Event System    │
                    │                   │
                    │ • Kafka Topics    │
                    │ • Outbox Pattern  │
                    │ • Event Sourcing  │
                    └───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Data Layer      │
                    │                   │
                    │ • PostgreSQL      │
                    │ • pgVector        │
                    │ • Redis Cache     │
                    │ • MinIO Storage   │
                    └───────────────────┘
```

## 🚀 Quick Start

### 1. Setup the System
```bash
# Run the setup script
./scripts/setup-ai-system.sh

# Or manually start services
docker-compose -f docker-compose.ai.yml up -d
```

### 2. Configure AI Models
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Or add to .env file
echo "OPENAI_API_KEY=your-api-key-here" >> .env
```

### 3. Test AI Services
```bash
# Test content generation
curl -X POST http://localhost:8001/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a product description for a homeopathy medicine",
    "max_tokens": 100
  }'

# Test demand forecasting
curl -X POST http://localhost:8001/v1/forecast-demand \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-123",
    "shop_id": "shop-456",
    "days_ahead": 30
  }'
```

## 🤖 AI Features

### 1. Content Generation

#### Product Descriptions
```typescript
// Generate product description
const description = await aiService.generateProductDescription({
  name: "Arnica Montana 30C",
  category: "Trauma & Injury",
  potency: "30C",
  indications: ["Bruises", "Muscle Pain", "Swelling"],
  target_audience: "Sports enthusiasts",
  tone: "professional"
});
```

#### Marketing Campaigns
```typescript
// Generate seasonal campaign
const campaign = await aiService.generateSeasonalCampaign({
  season: "winter",
  target_audience: "Immunity seekers",
  budget: 10000,
  channels: ["whatsapp", "instagram", "facebook"]
});
```

#### Social Media Posts
```typescript
// Generate Instagram post
const post = await aiService.generateSocialMediaPost({
  content_type: "product_promotion",
  product_data: {
    name: "Echinacea Drops",
    benefits: ["Immune support", "Cold prevention"]
  },
  platform: "instagram"
});
```

### 2. Demand Forecasting

#### Automatic Forecasting
```typescript
// AI automatically forecasts demand when inventory is low
// Triggered by: inventory.low event
const forecast = await aiService.forecastDemand({
  product_id: "product-123",
  shop_id: "shop-456",
  days_ahead: 30,
  include_seasonality: true
});

// Result includes:
// - forecasted_quantity: 150
// - confidence_score: 0.85
// - factors: { trend: 0.05, seasonality: 1.2 }
// - recommendations: ["Consider restocking", "Monitor sales trends"]
```

#### Manual Forecasting
```typescript
// Get forecast for multiple products
const forecasts = await fetch('/api/ai/forecast-demand', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    shop_id: "shop-456",
    product_ids: ["product-123", "product-456"],
    days_ahead: 30
  })
});
```

### 3. Dynamic Pricing

#### Automatic Pricing Optimization
```typescript
// AI suggests optimal pricing based on multiple factors
const pricing = await aiService.calculateOptimalPricing({
  product_id: "product-123",
  current_price: 150,
  current_stock: 25,
  expiry_date: new Date("2024-12-31"),
  demand_forecast: 30,
  competitor_prices: [140, 160, 155],
  cost_price: 90
});

// Result includes:
// - recommended_price: 145
// - confidence_score: 0.78
// - reasoning: "Price adjustment for expiring inventory"
// - expected_impact: { sales_change: 0.15, revenue_change: 0.08 }
```

### 4. Business Intelligence

#### Daily Profit Reports
```typescript
// AI generates daily business insights
const insights = await aiService.generateDailyInsights("shop-456", new Date());

// Returns insights like:
// - Profit analysis across B2C, B2B, D2D channels
// - Sales forecasting trends
// - Inventory optimization suggestions
// - Customer behavior insights
```

#### Anomaly Detection
```typescript
// AI detects unusual patterns
const anomalies = await aiService.detectAnomalies("shop-456", new Date());

// Detects:
// - Unusual sales spikes/drops
// - Inventory discrepancies
// - Customer behavior changes
// - Pricing anomalies
```

## 🔄 Event-Driven Automation

### Kafka Topics
The system uses Kafka for event-driven automation:

- `campaigns.events` - Campaign lifecycle events
- `inventory.events` - Inventory changes and alerts
- `orders.events` - Order processing events
- `purchase.events` - Purchase order events
- `ai.events` - AI processing events

### Automation Rules
```sql
-- Example: Auto-generate demand forecast on low stock
INSERT INTO ai_automation_rules (name, trigger_event, conditions, actions) VALUES
('Auto Forecast on Low Stock', 'inventory.low', 
 '{"stock_ratio": "< 0.5"}', 
 '{"action": "forecast_demand", "days_ahead": 30}');
```

### Event Flow Example
```
1. Inventory drops below threshold
2. inventory.low event published to Kafka
3. AI service consumes event
4. Generates demand forecast
5. Publishes forecast.completed event
6. Purchase service creates auto-PO
7. Manager gets WhatsApp notification
```

## 📊 AI Models and Performance

### Available Models
- **Local Models**: Llama-2-13B (for development)
- **OpenAI Models**: GPT-4, GPT-3.5-turbo
- **Embedding Models**: OpenAI text-embedding-ada-002
- **Custom Models**: Fine-tuned for homeopathy domain

### Model Performance Tracking
```sql
-- View model performance
SELECT 
  m.name,
  AVG(p.metric_value) as avg_accuracy,
  COUNT(p.id) as measurement_count
FROM ai_models m
LEFT JOIN ai_model_performance p ON m.id = p.model_id
WHERE p.metric_name = 'accuracy'
GROUP BY m.id, m.name;
```

### Cost Management
```typescript
// Track AI usage and costs
const usage = await db.query(`
  SELECT 
    DATE(created_at) as date,
    SUM(tokens_used) as total_tokens,
    SUM(cost_estimate) as total_cost
  FROM ai_requests 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
`);
```

## 🛠️ API Endpoints

### AI Service Endpoints
- `POST /v1/generate` - Generate content
- `POST /v1/embed` - Create embeddings
- `POST /v1/forecast-demand` - Demand forecasting
- `POST /v1/calculate-pricing` - Dynamic pricing
- `POST /v1/generate-campaign` - Campaign generation
- `GET /v1/models` - List available models
- `GET /health` - Health check

### Business API Endpoints
- `POST /api/b2b/orders` - Create B2B orders
- `GET /api/b2b/orders` - Get B2B orders
- `PUT /api/b2b/orders/:id/approve` - Approve B2B orders
- `POST /api/ai/forecast-demand` - Demand forecasting
- `POST /api/ai/dynamic-pricing` - Pricing optimization

## 📱 Frontend Integration

### React Components
```typescript
// AI Insights Dashboard
import { AIInsightsDashboard } from '@/components/ai/InsightsDashboard';

export default function Dashboard() {
  return (
    <div>
      <AIInsightsDashboard />
      <DemandForecastChart />
      <DynamicPricingWidget />
      <CampaignPerformance />
    </div>
  );
}
```

### Dealer Portal
```typescript
// B2B Dealer Portal
import { DealerDashboard } from '@/components/dealer/Dashboard';

export default function DealerPortal() {
  return (
    <div>
      <B2BPricingTable />
      <CreditLimitWidget />
      <BulkOrderForm />
      <OrderHistory />
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables
```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key
AI_SERVICE_URL=http://localhost:8001

# Database
DATABASE_URL=postgresql://yeelo:yeelo@localhost:5432/yeelo

# Event System
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379

# Storage
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
```

### AI Prompt Templates
```sql
-- Customize AI prompts
UPDATE ai_prompts 
SET prompt_template = 'Your custom prompt template here'
WHERE key = 'product_description_v1';
```

## 📈 Monitoring and Analytics

### Grafana Dashboards
- AI Service Performance
- Model Accuracy Metrics
- Cost Tracking
- Usage Analytics
- Business Intelligence

### Prometheus Metrics
- Request latency
- Error rates
- Token usage
- Model performance
- Business metrics

### Logs
```bash
# View AI service logs
docker-compose -f docker-compose.ai.yml logs ai-service

# View specific service logs
docker-compose -f docker-compose.ai.yml logs -f api-gateway
```

## 🚨 Troubleshooting

### Common Issues

#### AI Service Not Responding
```bash
# Check service status
curl http://localhost:8001/health

# Check logs
docker-compose -f docker-compose.ai.yml logs ai-service

# Restart service
docker-compose -f docker-compose.ai.yml restart ai-service
```

#### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose -f docker-compose.ai.yml logs postgres

# Test connection
psql -h localhost -U yeelo -d yeelo -c "SELECT 1;"
```

#### Kafka Issues
```bash
# Check Kafka status
docker-compose -f docker-compose.ai.yml logs kafka

# Check topics
docker exec -it yeelo-kafka-1 kafka-topics --list --bootstrap-server localhost:9092
```

### Performance Optimization

#### Model Caching
```typescript
// Enable model caching
const result = await aiService.generate({
  prompt: "Generate content",
  use_cache: true,
  cache_ttl: 3600 // 1 hour
});
```

#### Batch Processing
```typescript
// Process multiple requests in batch
const results = await aiService.generateBatch([
  { prompt: "Prompt 1" },
  { prompt: "Prompt 2" },
  { prompt: "Prompt 3" }
]);
```

## 🎯 Best Practices

### 1. Prompt Engineering
- Use specific, clear prompts
- Include context and examples
- Test different prompt variations
- Monitor and iterate based on results

### 2. Cost Management
- Set usage limits per user/tenant
- Cache frequently used responses
- Use appropriate models for tasks
- Monitor token usage and costs

### 3. Quality Control
- Implement human-in-the-loop for critical decisions
- Set confidence thresholds
- Regular model performance reviews
- A/B testing for content generation

### 4. Security
- Validate all AI inputs
- Sanitize outputs before display
- Implement rate limiting
- Audit AI requests and responses

## 📚 Additional Resources

- [API Documentation](./api-documentation.md)
- [Database Schema](./database-schema.md)
- [Deployment Guide](./deployment-guide.md)
- [Troubleshooting Guide](./troubleshooting.md)

## 🆘 Support

For technical support:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Check system health endpoints
4. Contact the development team

---

**🎉 Congratulations!** You now have a fully AI-powered ERP system for your homeopathy business. The system will automatically handle content generation, demand forecasting, dynamic pricing, and business intelligence to help you scale your operations efficiently.
