#!/bin/bash

echo "🚀 STARTING ALL SERVICES - NO DOCS, JUST CODE"
echo "=============================================="

# Run migrations
echo "📊 Running database migrations..."
psql -U postgres -d yeelo_homeopathy -f db/migrations/003_pos_sessions.sql
psql -U postgres -d yeelo_homeopathy -f db/migrations/004_purchases_complete.sql
psql -U postgres -d yeelo_homeopathy -f db/migrations/005_marketing_complete.sql
psql -U postgres -d yeelo_homeopathy -f db/migrations/006_integrations_complete.sql

# Start all backend services in background
echo "🔧 Starting backend services..."

# Golang v2
cd services/api-golang-v2 && go run main.go &

# Golang v1  
cd services/api-golang-v1 && go run main.go &

# NestJS
cd services/api-nest && npm run start:dev &

# Fastify
cd services/api-fastify && npm run dev &

# Python AI
cd services/python-ai && python main.py &

# GraphQL
cd services/graphql-gateway && npm run dev &

# Kafka Events
cd services/kafka-events && npm run dev &

# Frontend
cd ../.. && npm run dev &

echo "✅ All services starting..."
echo "Visit http://localhost:3000"
