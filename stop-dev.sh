#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Homeopathy Business Platform - Stop Development Script
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

COMPOSE_FILE="docker-compose.infra.yml"

print_step() {
    echo -e "${BOLD}${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo -e "\n${BOLD}${CYAN}Stopping All Development Services${NC}\n"

# Stop Node/NPM processes
print_step "Stopping Node.js processes..."
pkill -f "turbo run dev" 2>/dev/null && print_success "Stopped Turbo dev" || print_warning "No Turbo processes found"
pkill -f "next dev" 2>/dev/null && print_success "Stopped Next.js" || print_warning "No Next.js processes found"
pkill -f "node" 2>/dev/null && print_success "Stopped remaining Node processes" || print_warning "No Node processes found"

# Stop Docker containers
print_step "Stopping Docker containers..."
docker-compose -f $COMPOSE_FILE down

print_success "All services stopped"

# Optional: Remove volumes
read -p "$(echo -e ${YELLOW}Would you like to remove data volumes? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Removing volumes..."
    docker-compose -f $COMPOSE_FILE down -v
    print_success "Volumes removed"
fi

echo -e "\n${BOLD}${GREEN}✓ Cleanup complete${NC}\n"
