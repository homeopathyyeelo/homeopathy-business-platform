#!/bin/bash
# Quick setup script for Semantic Search

set -e

echo "🚀 Setting up Semantic Search for Homeopathy ERP"
echo "=================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please don't run as root"
   exit 1
fi

# Step 1: Install pgvector
echo ""
echo "📦 Step 1: Installing pgvector extension..."
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
echo "Detected PostgreSQL version: $PG_VERSION"

sudo apt-get update -qq
sudo apt-get install -y postgresql-$PG_VERSION-pgvector

# Enable extension
echo "Enabling pgvector extension..."
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || {
    echo "⚠️  Could not enable pgvector. Please run manually:"
    echo "   sudo -u postgres psql -d yeelo_homeopathy -c 'CREATE EXTENSION vector;'"
}

# Step 2: Install Python dependencies
echo ""
echo "📦 Step 2: Installing Python dependencies..."
pip3 install -q openai psycopg2-binary tqdm

# Step 3: Check OpenAI API key
echo ""
echo "🔑 Step 3: Checking OpenAI API key..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set!"
    echo ""
    echo "Please set your OpenAI API key:"
    echo "  export OPENAI_API_KEY='sk-your-key-here'"
    echo ""
    echo "Get your key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Enter your OpenAI API key (or press Enter to skip): " api_key
    if [ ! -z "$api_key" ]; then
        export OPENAI_API_KEY="$api_key"
        echo "export OPENAI_API_KEY='$api_key'" >> ~/.bashrc
        echo "✅ API key set and saved to ~/.bashrc"
    else
        echo "⚠️  Skipping embedding generation. Set OPENAI_API_KEY later."
        exit 0
    fi
else
    echo "✅ OpenAI API key found"
fi

# Step 4: Generate embeddings
echo ""
echo "🤖 Step 4: Generating embeddings..."
cd /var/www/homeopathy-business-platform
chmod +x scripts/generate_embeddings.py

echo ""
echo "This will generate embeddings for all products in your database."
echo "Estimated cost: ₹10-50 (one-time)"
echo ""
read -p "Proceed with embedding generation? (yes/no): " proceed

if [ "$proceed" = "yes" ] || [ "$proceed" = "y" ]; then
    python3 scripts/generate_embeddings.py
else
    echo "⚠️  Skipping embedding generation."
    echo "Run manually later: python3 scripts/generate_embeddings.py"
    exit 0
fi

# Step 5: Rebuild backend
echo ""
echo "🔨 Step 5: Rebuilding backend..."
cd /var/www/homeopathy-business-platform/services/api-golang-master
go build -o backend-server ./cmd/main.go

echo ""
echo "🔄 Restarting backend..."
pkill -9 -f backend-server 2>/dev/null || true
sleep 1
nohup ./backend-server > /var/www/homeopathy-business-platform/logs/backend.log 2>&1 &
sleep 2

# Check if backend started
if pgrep -f backend-server > /dev/null; then
    echo "✅ Backend restarted successfully"
else
    echo "⚠️  Backend may not have started. Check logs:"
    echo "   tail -f /var/www/homeopathy-business-platform/logs/backend.log"
fi

# Summary
echo ""
echo "=================================================="
echo "✅ Semantic Search Setup Complete!"
echo "=================================================="
echo ""
echo "🎉 Your search is now intelligent!"
echo ""
echo "Try these queries:"
echo "  - 'medicine for cold'"
echo "  - 'skin cream'"
echo "  - 'joint pain'"
echo "  - 'digestive issues'"
echo ""
echo "📊 Search will now:"
echo "  1. Try MeiliSearch (fast)"
echo "  2. Try Semantic Search (intelligent)"
echo "  3. Fall back to SQL (always works)"
echo ""
echo "💰 Cost: ~₹0.001 per semantic search"
echo "📈 Gets smarter as you upload more invoices!"
echo ""
