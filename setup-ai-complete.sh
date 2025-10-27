#!/bin/bash

# Complete HomeoERP ML Implementation Guide

echo "🚀 HomeoERP AI/ML Implementation Guide"
echo "========================================"

# Phase 1: Environment Setup
echo ""
echo "📦 Phase 1: ML Environment Setup"
echo "--------------------------------"

echo "1. Install enhanced ML libraries:"
cd /var/www/homeopathy-business-platform
./setup-ml-environment.sh

echo ""
echo "2. Set up PostgreSQL with pgVector:"
echo "CREATE EXTENSION IF NOT EXISTS vector;"
echo "ALTER TABLE products ADD COLUMN embedding vector(384);"

echo ""
echo "3. Start MLflow for model tracking:"
echo "docker run -d -p 5000:5000 -v mlflow:/mlruns ghcr.io/mlflow/mlflow:latest"

# Phase 2: Data Preparation
echo ""
echo "📊 Phase 2: Data Preparation"
echo "----------------------------"

echo "1. Run data pipeline:"
cd /var/www/homeopathy-business-platform/services/ai-service
python -c "from src.data_pipeline import HomeoERPDataPipeline; pipeline = HomeoERPDataPipeline('postgresql://user:pass@localhost:5432/homeoerp'); pipeline.prepare_training_data()"

echo ""
echo "2. Verify data quality:"
echo "ls -la data/"
echo "Check for: products_processed.parquet, sales_processed.parquet, customers_processed.parquet"

# Phase 3: Model Training
echo ""
echo "🧠 Phase 3: Model Training"
echo "---------------------------"

echo "1. Train all ML models:"
python -c "from src.ml_models import train_all_models; train_all_models()"

echo ""
echo "2. Verify model files created:"
echo "ls -la data/"
echo "Look for: *.pkl files, *.npy files"

# Phase 4: API Integration
echo ""
echo "🔗 Phase 4: API Integration"
echo "---------------------------"

echo "1. Start enhanced AI service:"
python enhanced_ai_service.py

echo ""
echo "2. Test API endpoints:"
echo "curl -X POST http://localhost:8005/v2/models/status"
echo "curl -X POST http://localhost:8005/v2/recommendations/product -H 'Content-Type: application/json' -d '{\"product_id\": \"test-product\", \"top_n\": 5}'"

# Phase 5: Go Integration
echo ""
echo "🔧 Phase 5: Go Backend Integration"
echo "-----------------------------------"

echo "1. Add AI service calls to Go handlers:"
echo "Add these endpoints to your Go API routes:"
echo "  POST /api/v1/ai/recommendations/products"
echo "  POST /api/v1/ai/forecast/demand"
echo "  POST /api/v1/ai/segmentation/customers"
echo "  POST /api/v1/ai/optimization/inventory"

echo ""
echo "2. Update Go handlers to call AI service:"
echo "See src/go_integration.py for integration examples"

# Phase 6: Frontend Integration
echo ""
echo "🎨 Phase 6: Frontend Integration"
echo "--------------------------------"

echo "1. Add AI-powered features to Next.js frontend:"
echo "   - Product recommendation widgets"
echo "   - Smart inventory alerts"
echo "   - Customer segmentation insights"
echo "   - Demand forecasting dashboards"

echo ""
echo "2. Example React components:"
echo "   - RecommendationCarousel.tsx"
echo "   - InventoryAlerts.tsx"
echo "   - CustomerInsights.tsx"
echo "   - DemandForecastChart.tsx"

# Phase 7: Production Deployment
echo ""
echo "🚀 Phase 7: Production Deployment"
echo "----------------------------------"

echo "1. Docker deployment:"
echo "docker build -t homeoerp-ai-service:v2.0 services/ai-service/"
echo "docker run -p 8005:8005 homeoerp-ai-service:v2.0"

echo ""
echo "2. Kubernetes deployment:"
echo "kubectl apply -f services/ai-service/k8s-deployment.yaml"

echo ""
echo "3. Set up monitoring:"
echo "   - MLflow UI: http://localhost:5000"
echo "   - AI Service Health: http://localhost:8005/healthz"
echo "   - Performance Metrics: http://localhost:8005/v2/models/status"

echo ""
echo "🎯 NEXT STEPS:"
echo "-------------"
echo "1. Review and customize ML models for your specific business needs"
echo "2. Add more training data as your business grows"
echo "3. Set up automated retraining pipelines (weekly/monthly)"
echo "4. Monitor model performance and business impact"
echo "5. A/B test new AI features with customers"

echo ""
echo "📚 USEFUL COMMANDS:"
echo "-------------------"
echo "# Check model status"
echo "curl http://localhost:8005/v2/models/status"
echo ""
echo "# Get product recommendations"
echo 'curl -X POST http://localhost:8005/v2/recommendations/product -H "Content-Type: application/json" -d "{\"product_id\": \"your-product-id\", \"top_n\": 5}"'
echo ""
echo "# Trigger model training"
echo "curl -X POST http://localhost:8005/v2/models/train"
echo ""
echo "# Check business insights"
echo "curl http://localhost:8005/v2/analytics/business-insights"

echo ""
echo "✅ HomeoERP AI/ML setup complete!"
echo "Your system now has production-ready ML capabilities!"
