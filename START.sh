#\!/bin/bash

echo "🚀 Starting Homeopathy ERP Platform"
echo ""

# Check if Docker is running
if \! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "✅ Checking service status:"
echo "-----------------------------------"

# Check PostgreSQL
if docker-compose ps | grep postgres | grep -q "Up"; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Not running"
fi

# Check Redis
if docker-compose ps | grep redis | grep -q "Up"; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

# Check Backend
if docker-compose ps | grep backend | grep -q "Up"; then
    echo "✅ Backend (Go): Running on port 3005"
else
    echo "❌ Backend: Not running"
fi

# Check Frontend
if docker-compose ps | grep frontend | grep -q "Up"; then
    echo "✅ Frontend (Next.js): Running on port 3000"
else
    echo "❌ Frontend: Not running"
fi

echo ""
echo "🌐 Application URLs:"
echo "-----------------------------------"
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:3005"
echo "Health:    http://localhost:3005/health"
echo ""
echo "📊 View logs:"
echo "docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "docker-compose down"
