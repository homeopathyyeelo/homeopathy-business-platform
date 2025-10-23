#!/bin/bash

echo "Testing PostgreSQL connection..."
echo ""

# Test from inside Docker container
echo "1️⃣  Testing from Docker container..."
docker-compose exec -T postgres psql -U postgres -d yeelo_homeopathy -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Docker connection successful!"
    echo ""
    
    # Show database info
    echo "2️⃣  Database information:"
    docker-compose exec -T postgres psql -U postgres -d yeelo_homeopathy -c "\l" | grep yeelo_homeopathy
    
    echo ""
    echo "3️⃣  Tables in database:"
    docker-compose exec -T postgres psql -U postgres -d yeelo_homeopathy -c "\dt"
    
    echo ""
    echo "✅ All tests passed!"
else
    echo "❌ PostgreSQL connection failed!"
    exit 1
fi
