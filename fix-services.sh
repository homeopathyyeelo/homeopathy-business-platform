#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Fix Common Service Issues
# ═══════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Fixing Common Service Issues${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Fix AI Service Python Environment
if [ -d "services/ai-service" ]; then
    print_step "Checking AI Service..."
    
    if [ ! -d "services/ai-service/venv" ]; then
        print_warning "Python virtual environment not found"
        print_step "Creating virtual environment..."
        cd services/ai-service
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt 2>/dev/null || print_warning "requirements.txt not found"
        deactivate
        cd ../..
        print_success "Virtual environment created"
    else
        print_success "AI Service venv exists"
    fi
fi

# Fix api-nest dependencies
if [ -d "services/api-nest" ]; then
    print_step "Checking api-nest service..."
    
    if [ ! -d "services/api-nest/node_modules" ]; then
        print_warning "api-nest dependencies not installed"
        print_step "Installing dependencies..."
        cd services/api-nest
        npm install
        cd ../..
        print_success "Dependencies installed"
    else
        print_success "api-nest dependencies exist"
    fi
fi

# Fix api-fastify
if [ -d "services/api-fastify" ]; then
    print_step "Checking api-fastify service..."
    
    if [ ! -d "services/api-fastify/node_modules" ]; then
        print_warning "api-fastify dependencies not installed"
        print_step "Installing dependencies..."
        cd services/api-fastify
        npm install
        cd ../..
        print_success "Dependencies installed"
    else
        print_success "api-fastify dependencies exist"
    fi
fi

# Fix api-gateway
if [ -d "services/api-gateway" ]; then
    print_step "Checking api-gateway service..."
    
    if [ ! -d "services/api-gateway/node_modules" ]; then
        print_warning "api-gateway dependencies not installed"
        print_step "Installing dependencies..."
        cd services/api-gateway
        npm install
        cd ../..
        print_success "Dependencies installed"
    else
        print_success "api-gateway dependencies exist"
    fi
fi

echo -e "\n${GREEN}✓${NC} Service fixes complete!"
echo -e "\n${YELLOW}Note:${NC} If services still fail, check individual service logs:"
echo -e "  ${BLUE}•${NC} tail -f logs/turbo-dev.log"
echo -e "  ${BLUE}•${NC} Check service-specific README files\n"
