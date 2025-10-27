#!/bin/bash

# HomeoERP - Quick Setup Script
# This script sets up the complete HomeoERP application

echo "🏥 HomeoERP - Enterprise Setup Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

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

# Setup environment file
echo -e "\n🔧 Setting up environment..."
if [ ! -f "app/.env.local" ]; then
    cp app/env.example app/.env.local
    echo "✅ Environment file created (app/.env.local)"
    echo "⚠️  Please update the database URL and API endpoints in app/.env.local"
else
    echo "✅ Environment file already exists"
fi

# Check database connection
echo -e "\n🗄️  Checking database connection..."
if command -v psql &> /dev/null; then
    if [ -n "$DATABASE_URL" ]; then
        echo "🔗 DATABASE_URL is set"
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo "✅ Database connection successful"

            # Setup database schema
            echo -e "\n📊 Setting up database schema..."
            psql "$DATABASE_URL" -f create-enhanced-inventory-schema.sql
            psql "$DATABASE_URL" -f create-barcode-schema.sql

            if [ $? -eq 0 ]; then
                echo "✅ Database schema setup complete"
            else
                echo "⚠️  Database schema setup had issues. Please check manually."
            fi
        else
            echo "❌ Database connection failed. Please check DATABASE_URL."
        fi
    else
        echo "⚠️  DATABASE_URL not set. Please set it before running database migrations."
    fi
else
    echo "⚠️  PostgreSQL client (psql) not found. Please install PostgreSQL client."
fi

# Build the application
echo -e "\n🔨 Building application..."
npm run build:app

if [ $? -eq 0 ]; then
    echo "✅ Application built successfully"
else
    echo "⚠️  Build completed with warnings. Check output above."
fi

echo -e "\n🚀 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Update app/.env.local with your database and API URLs"
echo "2. Run database migrations: npm run db:setup"
echo "3. Start development: npm run dev:app"
echo "4. Access: http://localhost:3000"
echo ""
echo "🎯 For Production:"
echo "- Run: npm run deploy:vercel (for Vercel deployment)"
echo "- Or: npm run prod:build && npm run prod:start (manual deployment)"
echo ""
echo "📚 Documentation: README-DEPLOYMENT.md"
echo ""
echo "✅ Your HomeoERP application is ready!"
