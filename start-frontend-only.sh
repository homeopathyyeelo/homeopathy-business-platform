#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Start Frontend Only - Minimal Development Setup
# ═══════════════════════════════════════════════════════════════════════════
# This script starts only infrastructure + Next.js frontend
# Use this if backend services are failing
# ═══════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

COMPOSE_FILE="docker-compose.infra.yml"
LOG_DIR="./logs"

print_header() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${BOLD}${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

clear
echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║         🏥 Frontend-Only Mode - Minimal Setup 🚀                     ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Create log directory
mkdir -p $LOG_DIR

# Start infrastructure
print_header "Starting Infrastructure"
print_step "Starting Docker containers..."
docker compose -f $COMPOSE_FILE up -d 2>&1 | tee -a $LOG_DIR/docker-up.log
print_success "Infrastructure started"

# Wait a bit
print_step "Waiting for services to be ready..."
sleep 10

# Setup database
print_header "Setting Up Database"

print_step "Generating Prisma client..."
npm run db:generate 2>&1 | tee -a $LOG_DIR/db-generate.log
print_success "Prisma client generated"

print_step "Running migrations..."
npm run db:migrate 2>&1 | tee -a $LOG_DIR/db-migrate.log
print_success "Migrations complete"

# Start Next.js only
print_header "Starting Next.js Frontend"

print_step "Starting Next.js..."
nohup npm run dev:app > $LOG_DIR/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo $NEXTJS_PID > $LOG_DIR/nextjs.pid

print_info "Next.js started with PID: $NEXTJS_PID"
print_step "Waiting for Next.js to be ready..."
sleep 15

# Check if running
if ps -p $NEXTJS_PID > /dev/null; then
    print_success "Next.js is running!"
else
    print_warning "Next.js may have issues, check logs"
fi

# Display status
print_header "Service Status"

echo -e "${BOLD}${GREEN}Infrastructure:${NC}"
echo -e "  ${GREEN}✓${NC} PostgreSQL  → localhost:5433"
echo -e "  ${GREEN}✓${NC} Redis       → localhost:6380"
echo -e "  ${GREEN}✓${NC} Kafka       → localhost:9092"
echo -e "  ${GREEN}✓${NC} MinIO       → http://localhost:9000"
echo -e "  ${GREEN}✓${NC} Kafka UI    → http://localhost:8080"

echo -e "\n${BOLD}${CYAN}Application:${NC}"
echo -e "  ${GREEN}✓${NC} Next.js     → http://localhost:3000"

echo -e "\n${BOLD}${YELLOW}Note:${NC} Backend APIs are NOT running in this mode"
echo -e "This is a minimal setup for frontend development only\n"

echo -e "${BOLD}${BLUE}Useful Commands:${NC}"
echo -e "  ${CYAN}•${NC} View logs:  tail -f $LOG_DIR/nextjs.log"
echo -e "  ${CYAN}•${NC} Stop all:   ./stop-dev.sh"
echo -e "  ${CYAN}•${NC} Full setup: ./dev-start.sh\n"

echo -e "${BOLD}${GREEN}✓ Frontend is ready at http://localhost:3000${NC}\n"

print_info "Press ENTER to view live logs (Ctrl+C to exit log view)"
read

tail -f $LOG_DIR/nextjs.log
