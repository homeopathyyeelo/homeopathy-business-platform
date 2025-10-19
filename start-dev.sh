#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Homeopathy Business Platform - Development Startup Script
# ═══════════════════════════════════════════════════════════════
# This script starts all services required for development:
# - Infrastructure (Kafka, Zookeeper, PostgreSQL, Redis, MinIO)
# - Backend Services (APIs, Workers)
# - Frontend (Next.js)
# - Monitoring Tools
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
COMPOSE_FILE="docker-compose.infra.yml"
LOG_DIR="./logs"
HEALTH_CHECK_TIMEOUT=120
HEALTH_CHECK_INTERVAL=5

# ═══════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════

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

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${MAGENTA}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for service to be healthy
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1

    print_step "Waiting for $service to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            print_success "$service is ready!"
            return 0
        fi
        
        if [ $((attempt % 6)) -eq 0 ]; then
            print_info "Still waiting for $service... (${attempt}/${max_attempts})"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start within ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

# Check Docker health status
check_docker_health() {
    local container=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "not_found")
        
        if [ "$health" = "healthy" ]; then
            return 0
        elif [ "$health" = "not_found" ]; then
            print_error "Container $container not found"
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Container $container health check timeout"
    return 1
}

# Stop all services
cleanup() {
    print_header "Cleaning Up Services"
    print_step "Stopping all services..."
    
    # Stop Turbo dev processes
    pkill -f "turbo run dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    # Stop Docker containers
    docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
    
    print_success "Cleanup complete"
}

# ═══════════════════════════════════════════════════════════════
# Prerequisite Checks
# ═══════════════════════════════════════════════════════════════

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check required tools
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_tools+=("docker-compose")
    fi
    
    if ! command_exists node; then
        missing_tools+=("node")
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if ! command_exists nc; then
        missing_tools+=("netcat/nc")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo -e "\nPlease install the missing tools and try again."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    print_success "Docker daemon is running"
    
    # Check if ports are available
    local ports=(2181 9092 5433 6380 9000 9001 8080 3000 3001 3002 4000 5000 8001)
    local ports_in_use=()
    
    for port in "${ports[@]}"; do
        if nc -z localhost $port 2>/dev/null; then
            ports_in_use+=($port)
        fi
    done
    
    if [ ${#ports_in_use[@]} -ne 0 ]; then
        print_warning "Ports already in use: ${ports_in_use[*]}"
        print_info "Attempting to clean up existing services..."
        cleanup
        sleep 2
    fi
}

# ═══════════════════════════════════════════════════════════════
# Infrastructure Setup
# ═══════════════════════════════════════════════════════════════

start_infrastructure() {
    print_header "Starting Infrastructure Services"
    
    # Create log directory
    mkdir -p $LOG_DIR
    
    # Start Docker Compose services
    print_step "Starting Docker containers..."
    docker-compose -f $COMPOSE_FILE up -d --remove-orphans
    
    echo ""
    
    # Wait for Zookeeper
    wait_for_service "Zookeeper" 2181
    check_docker_health "yeelo-zookeeper" || print_warning "Zookeeper health check not available"
    
    # Wait for Kafka
    wait_for_service "Kafka" 9092
    check_docker_health "yeelo-kafka" || print_warning "Kafka health check not available"
    
    # Wait for PostgreSQL
    wait_for_service "PostgreSQL" 5433
    check_docker_health "yeelo-postgres" || print_warning "PostgreSQL health check not available"
    
    # Wait for Redis
    wait_for_service "Redis" 6380
    check_docker_health "yeelo-redis" || print_warning "Redis health check not available"
    
    # Wait for MinIO
    wait_for_service "MinIO" 9000
    
    # Wait for Kafka UI
    wait_for_service "Kafka UI" 8080
    
    print_success "All infrastructure services are running!"
}

# ═══════════════════════════════════════════════════════════════
# Database Setup
# ═══════════════════════════════════════════════════════════════

setup_database() {
    print_header "Setting Up Database"
    
    # Check if database is already initialized
    print_step "Checking database status..."
    
    # Generate Prisma client
    print_step "Generating Prisma client..."
    npm run db:generate 2>&1 | tee -a $LOG_DIR/db-generate.log
    
    if [ $? -eq 0 ]; then
        print_success "Prisma client generated"
    else
        print_warning "Prisma generate had issues, check logs"
    fi
    
    # Run migrations
    print_step "Running database migrations..."
    npm run db:migrate 2>&1 | tee -a $LOG_DIR/db-migrate.log
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations complete"
    else
        print_warning "Database migrations had issues, check logs"
    fi
    
    # Optional: Seed database
    read -p "$(echo -e ${YELLOW}Would you like to seed the database? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Seeding database..."
        npm run db:seed 2>&1 | tee -a $LOG_DIR/db-seed.log
        
        if [ $? -eq 0 ]; then
            print_success "Database seeded successfully"
        else
            print_warning "Database seeding had issues, check logs"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════
# Application Services
# ═══════════════════════════════════════════════════════════════

start_application_services() {
    print_header "Starting Application Services"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    fi
    
    # Start Turbo dev mode in background
    print_step "Starting backend services with Turbo..."
    nohup npm run dev > $LOG_DIR/turbo-dev.log 2>&1 &
    TURBO_PID=$!
    
    print_info "Turbo dev started with PID: $TURBO_PID"
    
    # Wait a bit for services to start
    sleep 10
    
    # Give Turbo a moment to start
    sleep 3
    
    # Check if services are starting
    if ps -p $TURBO_PID > /dev/null; then
        print_success "Application services are starting..."
    else
        print_error "Failed to start application services"
        print_info "Check logs at $LOG_DIR/turbo-dev.log"
        cat $LOG_DIR/turbo-dev.log
        return 1
    fi
    
    # Wait for Next.js to be ready
    print_step "Waiting for Next.js frontend..."
    wait_for_service "Next.js" 3000 || print_warning "Next.js may still be building..."
    
    print_success "Application services started!"
}

# ═══════════════════════════════════════════════════════════════
# Service Status Display
# ═══════════════════════════════════════════════════════════════

display_service_status() {
    print_header "Service Status Summary"
    
    echo -e "${BOLD}Infrastructure Services:${NC}"
    echo -e "  ${GREEN}✓${NC} Zookeeper         → http://localhost:2181"
    echo -e "  ${GREEN}✓${NC} Kafka             → http://localhost:9092"
    echo -e "  ${GREEN}✓${NC} PostgreSQL        → localhost:5433 (DB: yeelo_homeopathy)"
    echo -e "  ${GREEN}✓${NC} Redis             → localhost:6380"
    echo -e "  ${GREEN}✓${NC} MinIO             → http://localhost:9000 (Console: http://localhost:9001)"
    echo -e "  ${GREEN}✓${NC} Kafka UI          → http://localhost:8080"
    
    echo -e "\n${BOLD}Application Services:${NC}"
    echo -e "  ${GREEN}✓${NC} Next.js Frontend  → http://localhost:3000"
    echo -e "  ${CYAN}•${NC} API Services      → Running via Turbo (check individual ports)"
    echo -e "  ${CYAN}•${NC} GraphQL Gateway   → http://localhost:4000/graphql (if configured)"
    
    echo -e "\n${BOLD}Monitoring & Tools:${NC}"
    echo -e "  ${CYAN}•${NC} Logs Directory    → $LOG_DIR/"
    echo -e "  ${CYAN}•${NC} Docker Logs       → docker-compose -f $COMPOSE_FILE logs -f"
    
    echo -e "\n${BOLD}MinIO Credentials:${NC}"
    echo -e "  ${CYAN}•${NC} Username: minio"
    echo -e "  ${CYAN}•${NC} Password: minio123"
    
    echo -e "\n${BOLD}Database Connection:${NC}"
    echo -e "  ${CYAN}•${NC} Host: localhost"
    echo -e "  ${CYAN}•${NC} Port: 5433"
    echo -e "  ${CYAN}•${NC} User: postgres"
    echo -e "  ${CYAN}•${NC} Pass: postgres"
    echo -e "  ${CYAN}•${NC} DB:   yeelo_homeopathy"
    
    echo -e "\n${BOLD}Useful Commands:${NC}"
    echo -e "  ${CYAN}•${NC} Stop all:         ./stop-dev.sh"
    echo -e "  ${CYAN}•${NC} View logs:        tail -f $LOG_DIR/turbo-dev.log"
    echo -e "  ${CYAN}•${NC} Docker logs:      docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo -e "  ${CYAN}•${NC} Health check:     make smoke"
}

# ═══════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════

main() {
    # Trap CTRL+C and cleanup
    trap cleanup EXIT INT TERM
    
    clear
    print_header "Homeopathy Business Platform - Development Environment"
    
    echo -e "${BOLD}Starting all services...${NC}\n"
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Infrastructure
    start_infrastructure
    
    # Step 3: Database
    setup_database
    
    # Step 4: Application
    start_application_services
    
    # Step 5: Summary
    echo ""
    display_service_status
    
    # Success message
    echo -e "\n${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}  🚀 All services started successfully!${NC}"
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
    
    print_info "Press CTRL+C to stop all services and exit"
    
    # Keep script running and show logs
    echo -e "\n${BOLD}Following application logs...${NC}\n"
    tail -f $LOG_DIR/turbo-dev.log
}

# Run main function
main
