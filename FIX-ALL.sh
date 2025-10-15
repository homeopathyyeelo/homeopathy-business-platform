#!/bin/bash
# Complete Fix Script for Yeelo Platform

set -e

echo "=========================================="
echo "FIXING ALL ISSUES - Yeelo Platform"
echo "=========================================="
echo ""

cd /var/www/homeopathy-business-platform

# Step 1: Kill all running services
echo "[1/8] Stopping all services..."
pkill -f "next dev" || true
pkill -f "nest start" || true
pkill -f "ts-node-dev" || true
sleep 2

# Step 2: Fix Kafka
echo "[2/8] Starting Kafka..."
docker compose -f docker-compose.dev.yml up -d kafka
sleep 5
docker compose -f docker-compose.dev.yml ps kafka

# Step 3: Fix Next.js dependencies
echo "[3/8] Fixing Next.js dependencies..."
rm -rf node_modules/.cache
npm install cookie 2>/dev/null || true
npm install

# Step 4: Fix API Gateway
echo "[4/8] Fixing API Gateway..."
cd services/api-gateway
npm install
cd ../..

# Step 5: Fix API Fastify
echo "[5/8] Fixing API Fastify..."
cd services/api-fastify
npm install
cd ../..

# Step 6: Fix API Nest
echo "[6/8] Fixing API Nest..."
cd services/api-nest
npm install
cd ../..

# Step 7: Start all services
echo "[7/8] Starting all services..."

# Start API Gateway on port 3000
cd services/api-gateway
PORT=3000 npm run dev > /tmp/api-gateway.log 2>&1 &
echo "Started API Gateway (port 3000)"
cd ../..
sleep 3

# Start API Fastify on port 3001
cd services/api-fastify
PORT=3001 npm run dev > /tmp/api-fastify.log 2>&1 &
echo "Started API Fastify (port 3001)"
cd ../..
sleep 3

# Start API Nest on port 3002
cd services/api-nest
PORT=3002 npm run dev > /tmp/api-nest.log 2>&1 &
echo "Started API Nest (port 3002)"
cd ../..
sleep 3

# Start Next.js on port 4000
PORT=4000 npm run dev:app > /tmp/nextjs.log 2>&1 &
echo "Started Next.js (port 4000)"
sleep 10

# Step 8: Check everything
echo ""
echo "[8/8] Checking services..."
echo ""

echo "=== Docker Services ==="
docker compose -f docker-compose.dev.yml ps

echo ""
echo "=== Node Services ==="
ps aux | grep -E "(next|nest|fastify|ts-node)" | grep -v grep | awk '{print $2, $11, $12, $13, $14}'

echo ""
echo "=== Port Check ==="
echo "Checking ports..."
sleep 5

for port in 3000 3001 3002 4000 8001; do
    if nc -z localhost $port 2>/dev/null; then
        echo "✓ Port $port is OPEN"
    else
        echo "✗ Port $port is CLOSED"
    fi
done

echo ""
echo "=== Service URLs ==="
echo "Frontend:      http://localhost:4000"
echo "API Gateway:   http://localhost:3000"
echo "API Fastify:   http://localhost:3001"
echo "API Nest:      http://localhost:3002"
echo "AI Service:    http://localhost:8001"
echo ""
echo "=== View Logs ==="
echo "Next.js:       tail -f /tmp/nextjs.log"
echo "API Gateway:   tail -f /tmp/api-gateway.log"
echo "API Fastify:   tail -f /tmp/api-fastify.log"
echo "API Nest:      tail -f /tmp/api-nest.log"
echo ""
echo "Done! Wait 30 seconds then check http://localhost:4000"
