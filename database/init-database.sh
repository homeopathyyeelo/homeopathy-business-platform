#\!/bin/bash
# Initialize database with master schema

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy}"

echo "🗄️  Initializing database..."
psql "$DB_URL" < /var/www/homeopathy-business-platform/database/MASTER_SCHEMA.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully\!"
else
    echo "❌ Database initialization failed\!"
    exit 1
fi
