#!/bin/bash

echo "🧨 NUCLEAR RESET - Cleaning Everything..."

# Stop all services
echo "1️⃣ Stopping services..."
./stop-complete.sh

# Remove all build artifacts
echo "2️⃣ Removing build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf apps/*/.next 2>/dev/null
rm -rf packages/*/.next 2>/dev/null

# Clear any webpack cache
echo "3️⃣ Clearing webpack cache..."
find . -name ".webpack" -type d -exec rm -rf {} + 2>/dev/null

# Clear any TypeScript cache
echo "4️⃣ Clearing TypeScript cache..."
find . -name "tsconfig.tsbuildinfo" -type f -delete 2>/dev/null

# Clear any ESLint cache
echo "5️⃣ Clearing ESLint cache..."
find . -name ".eslintcache" -type f -delete 2>/dev/null

echo "✅ Nuclear reset complete!"
echo ""
echo "Now run: ./start-complete.sh"
echo "Then open in INCOGNITO mode: http://localhost:3000"
