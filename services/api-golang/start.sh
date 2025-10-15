#!/bin/bash

# start.sh
# Quick start script for Golang API

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Golang API${NC}"
echo "========================================"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}⚠️  Go is not installed${NC}"
    echo "Please install Go 1.22 or higher"
    echo "Visit: https://golang.org/dl/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Go is installed: $(go version)"

# Check if dependencies are downloaded
if [ ! -d "vendor" ] && [ ! -f "go.sum" ]; then
    echo ""
    echo -e "${BLUE}📦 Downloading dependencies...${NC}"
    go mod download
    echo -e "${GREEN}✓${NC} Dependencies downloaded"
fi

# Set environment variables if not set
export PORT=${PORT:-3004}
export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:postgres@localhost:5433/yeelo_homeopathy?sslmode=disable"}
export JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key-change-in-production"}

echo ""
echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Port:     $PORT"
echo "  Database: ${DATABASE_URL:0:50}..."
echo ""

echo -e "${GREEN}🚀 Starting server...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Server will be available at:${NC}"
echo "  API:     http://localhost:$PORT"
echo "  Health:  http://localhost:$PORT/health"
echo "  Swagger: http://localhost:$PORT/swagger"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the server
go run .
