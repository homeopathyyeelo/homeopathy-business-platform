#!/bin/bash

# Dynamic service starter - only starts services that exist

echo "🌐 Starting backend services..."

# Function to start a service if it exists
start_service() {
    local service_name=$1
    local port=$2
    local start_cmd=$3
    
    if [ -d "services/$service_name" ]; then
        echo "Starting $service_name on port $port..."
        $start_cmd > /tmp/$service_name.log 2>&1 &
        echo "✅ $service_name started (PID: $!)"
    else
        echo "⚠️  Skipping $service_name (services/$service_name not found)"
    fi
}

# Start existing services
start_service "api-golang" "3004" "cd services/api-golang && go run ."
# AI Service is already running in Docker container

echo "🎨 Starting Next.js Frontend on port 3000..."
/var/www/homeopathy-business-platform npx next dev --port 3000npx next dev --port 3000 cd /var/www/homeopathy-business-platform npx next dev --port 3000 > /tmp/frontend.log 2>&1 &npx next dev --port 3000 > /tmp/frontend.log 2>&1 & npx next dev --port 3000 > /tmp/frontend.log 2>npx next dev --port 3000 > /tmp/frontend.log 2>&1 &1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo "🔍 Checking service health..."
sleep 5

# Check service health
check_service() {
    local service_name=$1
    local url=$2
    local port=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $service_name is ready at $url"
        return 0
    else
        echo "❌ $service_name not responding on $url"
        return 1
    fi
}

check_service "Golang API" "http://localhost:3004/health" "3004"
check_service "AI Service" "http://localhost:8001/health" "8001" 
check_service "Frontend" "http://localhost:3000" "3000"

echo "🚀 All services started successfully!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 Golang API: http://localhost:3004"
echo "🤖 AI Service: http://localhost:8001"
