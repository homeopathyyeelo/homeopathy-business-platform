#\!/bin/bash
# Quick Start Script for Invoice Ingestion System

echo "🚀 Starting Invoice Ingestion System..."
echo ""

# Check if services are running
echo "Checking infrastructure..."
docker ps | grep -E "postgres|redis|minio" > /dev/null && echo "✅ Infrastructure running" || echo "❌ Start Docker services first"

echo ""
echo "Database Status:"
docker exec erp-postgres psql -U postgres -d homeoerp -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null && echo "✅ Database ready" || echo "❌ Database not accessible"

echo ""
echo "📋 Available Commands:"
echo ""
echo "1. Test Complete Workflow:"
echo "   ./TEST-INVOICE-SYSTEM.sh"
echo ""
echo "2. Start Python Service (Port 8005):"
echo "   cd services/invoice-parser-service"
echo "   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload"
echo ""
echo "3. Start Golang Service (Port 8006):"
echo "   cd services/purchase-service"
echo "   go run main.go"
echo ""
echo "4. Check Service Health:"
echo "   curl http://localhost:8005/health  # Python"
echo "   curl http://localhost:8006/health  # Golang"
echo ""
echo "5. View Inventory Batches:"
echo "   docker exec erp-postgres psql -U postgres -d homeoerp -c 'SELECT * FROM inventory_batches;'"
echo ""
echo "📚 Documentation:"
echo "   - SYSTEM-READY.md - Complete guide"
echo "   - INVOICE-INGESTION-COMPLETE-IMPLEMENTATION.md - Full details"
echo ""
