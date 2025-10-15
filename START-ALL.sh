#!/bin/bash
echo "🚀 Starting All Services..."

# Start infrastructure
docker-compose -f docker-compose.infra.yml up -d

sleep 5

# Start Golang API
cd services/api-golang && go run . &

# Start Express API
cd services/api-express && node src/index-complete.js &

# Start Frontend
cd app && npm run dev &

echo "✅ All services starting..."
echo "Frontend: http://localhost:3000"
echo "Golang API: http://localhost:3004"
echo "Express API: http://localhost:3003"
