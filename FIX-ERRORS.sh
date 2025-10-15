#!/bin/bash
set -e

echo "🔧 Fixing all errors..."

# Fix 1: Golang dependencies
echo "1️⃣ Fixing Golang API dependencies..."
cd /var/www/homeopathy-business-platform/services/api-golang
go mod tidy
echo "✅ Golang fixed"

# Fix 2: Express API dependencies
echo "2️⃣ Fixing Express API dependencies..."
cd /var/www/homeopathy-business-platform/services/api-express
npm install swagger-jsdoc swagger-ui-express nodemon --save
echo "✅ Express fixed"

# Fix 3: Root dependencies
echo "3️⃣ Installing root dependencies..."
cd /var/www/homeopathy-business-platform
npm install
echo "✅ Root dependencies installed"

echo ""
echo "✅ ALL ERRORS FIXED!"
echo ""
echo "Now run: ./START-ALL.sh"
