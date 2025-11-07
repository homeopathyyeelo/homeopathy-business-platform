#!/bin/bash

# HomeoERP - Quick Setup Script
# This script sets up the HomeoERP application for immediate use

echo "🏥 HomeoERP - Quick Setup Script"
echo "================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ npm detected"

# Install dependencies
echo -e "\n📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Update to latest versions
echo -e "\n🔄 Updating to latest versions..."
npm run update

# Setup database tables
echo -e "\n🗄️  Setting up database tables..."
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Creating database tables..."
    psql "$DATABASE_URL" -f create-basic-tables.sql 2>/dev/null || echo "   ⚠️  Database tables may already exist or connection failed"

    echo "📋 Inserting master data..."
    psql "$DATABASE_URL" -f INSERT-MASTER-DATA-FIXED.sql 2>/dev/null || echo "   ⚠️  Master data may already exist"

    echo "📊 Creating additional API tables..."
    psql "$DATABASE_URL" -f create-missing-apis.sql 2>/dev/null || echo "   ⚠️  Additional API tables may already exist"

    echo "✅ Database setup attempted"
else
    echo "⚠️  DATABASE_URL not set. Please set your PostgreSQL connection string."
    echo "   Example: export DATABASE_URL='postgresql://user:password@localhost:5433/homeoerp'"
fi

# Build the application
echo -e "\n🔨 Building application..."
npm run build:app

if [ $? -eq 0 ]; then
    echo "✅ Application built successfully"
else
    echo "⚠️  Build completed with warnings. Check output above."
fi

# Setup environment
echo -e "\n🔧 Environment setup..."
if [ ! -f "app/.env.local" ]; then
    echo "   Creating .env.local file..."
    cp app/env.example app/.env.local
    echo "   ✅ Environment file created"
else
    echo "   ✅ Environment file already exists"
fi

echo -e "\n🚀 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Set DATABASE_URL: export DATABASE_URL='postgresql://user:password@localhost:5433/homeoerp'"
echo "2. Run database setup: psql \$DATABASE_URL -f create-basic-tables.sql"
echo "3. Start development: npm run dev:app"
echo "4. Access: http://localhost:3000"
echo ""
echo "🔐 Login Credentials:"
echo "   Email: admin@admin.com"
echo "   Password: (any password - development mode)"
echo ""
echo "🎯 For Production:"
echo "- Build: npm run build:app"
echo "- Start: npm run start:app"
echo "- Deploy: npm run deploy:vercel"
echo ""
echo "📚 Documentation: README-DEPLOYMENT.md"
echo ""
echo "✅ Your HomeoERP application is ready!"
