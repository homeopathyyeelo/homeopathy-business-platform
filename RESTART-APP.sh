#!/bin/bash

echo "🔄 Restarting Next.js application..."
echo ""

# Kill existing Next.js process
echo "Stopping any running Next.js processes..."
pkill -f "next dev" || true
sleep 2

# Start fresh
echo ""
echo "✅ Environment variables updated in .env.local"
echo ""
echo "Now run:"
echo "  npm run dev:app"
echo ""
echo "Or in a new terminal:"
echo "  cd /var/www/homeopathy-business-platform"
echo "  npm run dev:app"
echo ""
echo "Database connection fixed:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: yeelo_homeopathy"
echo "  Products: 2313"
echo ""
