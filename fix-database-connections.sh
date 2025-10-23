#!/bin/bash

# ============================================================================
# Fix Database Connections - Standardize to Single PostgreSQL
# Connection: postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     🔧 Fixing Database Connections Everywhere 🔧          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Standard connection string
DB_URL="postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"
DB_HOST="postgres"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="postgres"
DB_NAME="yeelo_homeopathy"

log "📝 Updating .env file..."
cat > .env << EOF
# ============================================================================
# Yeelo Homeopathy ERP - Environment Configuration
# ============================================================================

# PostgreSQL Database - SINGLE SOURCE OF TRUTH
DATABASE_URL=${DB_URL}
POSTGRES_HOST=${DB_HOST}
POSTGRES_PORT=${DB_PORT}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=${DB_NAME}

# For Prisma
DATABASE_URL=${DB_URL}?schema=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=erp-platform

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=erp-files

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# API Gateway
API_GATEWAY_PORT=4000
API_GATEWAY_URL=http://localhost:4000

# Microservices
PRODUCT_SERVICE_URL=http://localhost:8001
INVENTORY_SERVICE_URL=http://localhost:8002
SALES_SERVICE_URL=http://localhost:8003
AI_SERVICE_URL=http://localhost:8010

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
EOF

log "✅ .env updated"

log "📝 Updating .env.local..."
cat > .env.local << EOF
# Local overrides for development
DATABASE_URL=${DB_URL}
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF

log "✅ .env.local updated"

log "📝 Updating docker-compose.yml PostgreSQL config..."
# Update docker-compose.yml to use correct database name
sed -i 's/POSTGRES_DB=.*/POSTGRES_DB=yeelo_homeopathy/' docker-compose.yml
sed -i 's/POSTGRES_USER=.*/POSTGRES_USER=postgres/' docker-compose.yml
sed -i 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=postgres/' docker-compose.yml

log "✅ docker-compose.yml updated"

log "📝 Updating Go services..."
# Update product-service
if [ -f "services/product-service/main.go" ]; then
    sed -i 's|postgresql://.*@.*:.*/.* |postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy |g' services/product-service/main.go
    log "✅ product-service updated"
fi

# Update inventory-service
if [ -f "services/inventory-service/main.go" ]; then
    sed -i 's|postgresql://.*@.*:.*/.* |postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy |g' services/inventory-service/main.go
    log "✅ inventory-service updated"
fi

# Update sales-service
if [ -f "services/sales-service/main.go" ]; then
    sed -i 's|postgresql://.*@.*:.*/.* |postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy |g' services/sales-service/main.go
    log "✅ sales-service updated"
fi

log "📝 Creating unified database config..."
cat > lib/config/database.ts << 'EOF'
/**
 * Unified Database Configuration
 * Single source of truth for all database connections
 */

export const DATABASE_CONFIG = {
  // PostgreSQL - Primary Database
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'yeelo_homeopathy',
  },

  // Redis - Cache & Sessions
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'redis_password',
  },

  // Connection Pool Settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// Helper to get connection string
export function getPostgresConnectionString(): string {
  return DATABASE_CONFIG.postgres.url;
}

// Helper to get connection config
export function getPostgresConfig() {
  return {
    host: DATABASE_CONFIG.postgres.host,
    port: DATABASE_CONFIG.postgres.port,
    user: DATABASE_CONFIG.postgres.user,
    password: DATABASE_CONFIG.postgres.password,
    database: DATABASE_CONFIG.postgres.database,
  };
}
EOF

log "✅ Unified database config created"

log "📝 Updating Prisma schema..."
if [ -f "prisma/schema.prisma" ]; then
    # Ensure datasource uses correct env var
    sed -i 's|url.*=.*env.*|url      = env("DATABASE_URL")|' prisma/schema.prisma
    log "✅ Prisma schema updated"
fi

log "📝 Creating connection test script..."
cat > test-db-connection.sh << 'TESTEOF'
#!/bin/bash

echo "Testing PostgreSQL connection..."
docker-compose exec -T postgres psql -U postgres -d yeelo_homeopathy -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL connection successful!"
else
    echo "❌ PostgreSQL connection failed!"
    exit 1
fi
TESTEOF

chmod +x test-db-connection.sh

log "✅ Test script created"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  Database Connections Standardized!                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "📋 Summary:"
log "   Database: yeelo_homeopathy"
log "   Host: postgres (Docker) / localhost (local)"
log "   Port: 5432"
log "   User: postgres"
log "   Password: postgres"
echo ""
log "🔄 Next steps:"
log "   1. Stop all services: ./stop-complete.sh"
log "   2. Restart Docker: docker-compose down && docker-compose up -d"
log "   3. Test connection: ./test-db-connection.sh"
log "   4. Start services: ./start-complete.sh"
echo ""
