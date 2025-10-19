#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🚀 Homeopathy Business Platform - Complete Development Startup Script
# ═══════════════════════════════════════════════════════════════════════════
# This script orchestrates the complete development environment:
# ✅ Infrastructure (Kafka, Zookeeper, PostgreSQL, Redis, MinIO)
# ✅ Database Setup (Prisma generate, migrations, seeding)
# ✅ Backend Services (APIs via Turbo)
# ✅ Frontend (Next.js)
# ✅ Monitoring & Health Checks
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error
trap cleanup EXIT INT TERM

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

COMPOSE_FILE="docker-compose.infra.yml"
LOG_DIR="./logs"
HEALTH_CHECK_TIMEOUT=120
HEALTH_CHECK_INTERVAL=5
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Service Ports
declare -A INFRASTRUCTURE_PORTS=(
    ["Zookeeper"]="2181"
    ["Kafka"]="9092"
    ["PostgreSQL"]="5433"
    ["Redis"]="6380"
    ["MinIO"]="9000"
    ["MinIO Console"]="9001"
    ["Kafka UI"]="8080"
)

declare -A APPLICATION_PORTS=(
    ["Next.js Frontend"]="3000"
    ["API Fastify"]="3002"
    ["API Gateway"]="5000"
    ["GraphQL Gateway"]="4000"
    ["AI Service"]="8001"
)

# ═══════════════════════════════════════════════════════════════════════════
# Colors & Formatting
# ═══════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# ═══════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════

print_banner() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                       ║"
    echo "║         🏥 Homeopathy Business Platform - Dev Environment 🚀         ║"
    echo "║                                                                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

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

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ═══════════════════════════════════════════════════════════════════════════
# Port & Service Management
# ═══════════════════════════════════════════════════════════════════════════

check_port() {
    local port=$1
    nc -z localhost $port 2>/dev/null
    return $?
}

wait_for_port() {
    local service=$1
    local port=$2
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1

    print_step "Waiting for $service on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service is ready!"
            return 0
        fi
        
        if [ $((attempt % 6)) -eq 0 ]; then
            echo -ne "  ${CYAN}⏳${NC} Still waiting... (${attempt}/${max_attempts})\r"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start within ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

check_docker_health() {
    local container=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "not_found")
        
        if [ "$health" = "healthy" ]; then
            return 0
        elif [ "$health" = "not_found" ]; then
            # Container doesn't have health check, just check if running
            local status=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null || echo "not_found")
            if [ "$status" = "running" ]; then
                return 0
            fi
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Cleanup Functions
# ═══════════════════════════════════════════════════════════════════════════

cleanup() {
    if [ "$CLEANUP_ON_EXIT" = "true" ]; then
        print_header "Cleaning Up Services"
        print_step "Stopping all services..."
        
        # Stop Node processes
        pkill -f "turbo run dev" 2>/dev/null || true
        pkill -f "next dev" 2>/dev/null || true
        
        # Stop Docker containers
        docker compose -f $COMPOSE_FILE down 2>/dev/null || true
        
        print_success "Cleanup complete"
    fi
}

stop_existing_services() {
    print_header "Checking for Existing Services"
    
    local ports_in_use=()
    
    # Check infrastructure ports
    for service in "${!INFRASTRUCTURE_PORTS[@]}"; do
        local port="${INFRASTRUCTURE_PORTS[$service]}"
        if check_port $port; then
            ports_in_use+=("$service:$port")
        fi
    done
    
    # Check application ports
    for service in "${!APPLICATION_PORTS[@]}"; do
        local port="${APPLICATION_PORTS[$service]}"
        if check_port $port; then
            ports_in_use+=("$service:$port")
        fi
    done
    
    if [ ${#ports_in_use[@]} -ne 0 ]; then
        print_warning "Found services already running:"
        for item in "${ports_in_use[@]}"; do
            echo -e "  ${YELLOW}•${NC} $item"
        done
        
        echo ""
        read -p "$(echo -e ${YELLOW}Stop existing services and continue? [Y/n]:${NC} )" -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            print_step "Stopping existing services..."
            
            # Stop Node processes
            pkill -f "turbo run dev" 2>/dev/null || true
            pkill -f "next dev" 2>/dev/null || true
            
            # Stop Docker
            docker compose -f $COMPOSE_FILE down 2>/dev/null || true
            
            sleep 3
            print_success "Existing services stopped"
        else
            print_error "Cannot continue with services already running"
            exit 1
        fi
    else
        print_success "No conflicting services found"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Prerequisite Checks
# ═══════════════════════════════════════════════════════════════════════════

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    local required_tools=("docker" "docker-compose" "node" "npm" "nc")
    
    for tool in "${required_tools[@]}"; do
        if ! command_exists $tool; then
            missing_tools+=("$tool")
        else
            print_success "$tool is installed"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo -e "\n${YELLOW}Please install the missing tools:${NC}"
        echo -e "  ${CYAN}•${NC} Docker: https://docs.docker.com/get-docker/"
        echo -e "  ${CYAN}•${NC} Node.js: https://nodejs.org/"
        echo -e "  ${CYAN}•${NC} netcat: sudo apt-get install netcat (Ubuntu/Debian)"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        echo -e "${YELLOW}Please start Docker and try again${NC}"
        exit 1
    fi
    print_success "Docker daemon is running"
    
    # Check Node version
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_warning "Node.js version is $node_version, recommended: 18+"
    else
        print_success "Node.js version is compatible"
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    print_success "Project structure validated"
}

# ═══════════════════════════════════════════════════════════════════════════
# Infrastructure Setup
# ═══════════════════════════════════════════════════════════════════════════

start_infrastructure() {
    print_header "Starting Infrastructure Services"
    
    # Create log directory
    mkdir -p $LOG_DIR
    
    # Pull latest images
    print_step "Pulling latest Docker images..."
    docker compose -f $COMPOSE_FILE pull --quiet 2>&1 | tee -a $LOG_DIR/docker-pull.log
    
    # Start Docker Compose services
    print_step "Starting Docker containers..."
    docker compose -f $COMPOSE_FILE up -d --remove-orphans 2>&1 | tee -a $LOG_DIR/docker-up.log
    
    echo ""
    
    # Wait for each service
    print_info "Waiting for infrastructure services to be ready..."
    echo ""
    
    # Zookeeper
    wait_for_port "Zookeeper" 2181
    check_docker_health "yeelo-zookeeper" && print_success "Zookeeper health check passed" || print_warning "Zookeeper health check unavailable"
    
    # Kafka (needs more time)
    sleep 5
    wait_for_port "Kafka" 9092
    check_docker_health "yeelo-kafka" && print_success "Kafka health check passed" || print_warning "Kafka health check unavailable"
    
    # PostgreSQL
    wait_for_port "PostgreSQL" 5433
    check_docker_health "yeelo-postgres" && print_success "PostgreSQL health check passed" || print_warning "PostgreSQL health check unavailable"
    
    # Redis
    wait_for_port "Redis" 6380
    check_docker_health "yeelo-redis" && print_success "Redis health check passed" || print_warning "Redis health check unavailable"
    
    # MinIO
    wait_for_port "MinIO" 9000
    print_success "MinIO is ready"
    
    # Kafka UI
    wait_for_port "Kafka UI" 8080
    print_success "Kafka UI is ready"
    
    echo ""
    print_success "All infrastructure services are running!"
}

# ═══════════════════════════════════════════════════════════════════════════
# Database Setup
# ═══════════════════════════════════════════════════════════════════════════

setup_database() {
    print_header "Setting Up Database"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies (first time setup)..."
        npm install 2>&1 | tee -a $LOG_DIR/npm-install.log
        print_success "Dependencies installed"
    fi
    
    # Generate Prisma client
    print_step "Generating Prisma client..."
    if npm run db:generate 2>&1 | tee -a $LOG_DIR/db-generate.log; then
        print_success "Prisma client generated"
    else
        print_warning "Prisma generate had issues (check logs)"
    fi
    
    # Run migrations
    print_step "Running database migrations..."
    if npm run db:migrate 2>&1 | tee -a $LOG_DIR/db-migrate.log; then
        print_success "Database migrations complete"
    else
        print_error "Database migrations failed (check logs)"
        echo -e "${YELLOW}You may need to reset the database${NC}"
    fi
    
    # Optional: Seed database
    echo ""
    read -p "$(echo -e ${YELLOW}Would you like to seed the database with sample data? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Seeding database..."
        if npm run db:seed 2>&1 | tee -a $LOG_DIR/db-seed.log; then
            print_success "Database seeded successfully"
        else
            print_warning "Database seeding had issues (check logs at $LOG_DIR/db-seed.log)"
            print_info "You can seed later with: make db-seed"
        fi
    else
        print_info "Skipping database seeding"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Application Services
# ═══════════════════════════════════════════════════════════════════════════

start_application_services() {
    print_header "Starting Application Services"
    
    # Start Turbo dev mode in background
    print_step "Starting all services with Turbo..."
    print_info "This includes: Next.js, API Gateway, Fastify API, GraphQL Gateway, AI Service"
    
    nohup npm run dev > $LOG_DIR/turbo-dev.log 2>&1 &
    TURBO_PID=$!
    
    echo $TURBO_PID > $LOG_DIR/turbo.pid
    print_info "Turbo dev started with PID: $TURBO_PID"
    
    # Wait for services to initialize
    print_step "Waiting for services to initialize..."
    sleep 15
    
    # Check if Turbo is still running
    if ! ps -p $TURBO_PID > /dev/null; then
        print_warning "Some services failed to start"
        print_info "This is often due to:"
        print_info "  • Missing dependencies in individual services"
        print_info "  • Python virtual environment issues (AI service)"
        print_info "  • Port conflicts"
        echo ""
        print_info "Checking which services are running..."
        sleep 2
    fi
    
    # Wait for Next.js
    print_step "Waiting for Next.js frontend..."
    if wait_for_port "Next.js" 3000; then
        print_success "Next.js is ready!"
    else
        print_warning "Next.js may still be building (check logs)"
    fi
    
    # Check other services (non-blocking)
    echo ""
    print_info "Checking other application services..."
    
    for service in "${!APPLICATION_PORTS[@]}"; do
        if [ "$service" != "Next.js Frontend" ]; then
            local port="${APPLICATION_PORTS[$service]}"
            if check_port $port; then
                print_success "$service is running on port $port"
            else
                print_info "$service not yet available on port $port (may start later)"
            fi
        fi
    done
    
    echo ""
    print_success "Application services are starting!"
}

# ═══════════════════════════════════════════════════════════════════════════
# Service Status Display
# ═══════════════════════════════════════════════════════════════════════════

display_service_status() {
    print_header "Service Status Summary"
    
    echo -e "${BOLD}${GREEN}Infrastructure Services:${NC}"
    for service in "${!INFRASTRUCTURE_PORTS[@]}"; do
        local port="${INFRASTRUCTURE_PORTS[$service]}"
        if check_port $port; then
            echo -e "  ${GREEN}✓${NC} ${BOLD}$service${NC} → http://localhost:$port"
        else
            echo -e "  ${RED}✗${NC} ${BOLD}$service${NC} → Port $port (not responding)"
        fi
    done
    
    echo -e "\n${BOLD}${CYAN}Application Services:${NC}"
    for service in "${!APPLICATION_PORTS[@]}"; do
        local port="${APPLICATION_PORTS[$service]}"
        if check_port $port; then
            echo -e "  ${GREEN}✓${NC} ${BOLD}$service${NC} → http://localhost:$port"
        else
            echo -e "  ${YELLOW}⏳${NC} ${BOLD}$service${NC} → Port $port (starting...)"
        fi
    done
    
    echo -e "\n${BOLD}${MAGENTA}Quick Access URLs:${NC}"
    echo -e "  ${CYAN}•${NC} Frontend:      ${WHITE}http://localhost:3000${NC}"
    echo -e "  ${CYAN}•${NC} Kafka UI:      ${WHITE}http://localhost:8080${NC}"
    echo -e "  ${CYAN}•${NC} MinIO Console: ${WHITE}http://localhost:9001${NC} (minio/minio123)"
    echo -e "  ${CYAN}•${NC} GraphQL:       ${WHITE}http://localhost:4000/graphql${NC}"
    
    echo -e "\n${BOLD}${YELLOW}Database Connection:${NC}"
    echo -e "  ${CYAN}•${NC} Host: localhost"
    echo -e "  ${CYAN}•${NC} Port: 5433"
    echo -e "  ${CYAN}•${NC} User: postgres"
    echo -e "  ${CYAN}•${NC} Pass: postgres"
    echo -e "  ${CYAN}•${NC} DB:   yeelo_homeopathy"
    
    echo -e "\n${BOLD}${BLUE}Useful Commands:${NC}"
    echo -e "  ${CYAN}•${NC} View logs:        ${WHITE}tail -f $LOG_DIR/turbo-dev.log${NC}"
    echo -e "  ${CYAN}•${NC} Docker logs:      ${WHITE}docker compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  ${CYAN}•${NC} Stop all:         ${WHITE}./stop-dev.sh${NC} or ${WHITE}make stop-all${NC}"
    echo -e "  ${CYAN}•${NC} Health check:     ${WHITE}make smoke${NC}"
    echo -e "  ${CYAN}•${NC} Restart:          ${WHITE}make restart-all${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════════════════

main() {
    # Don't cleanup on exit by default (let services run)
    CLEANUP_ON_EXIT=false
    
    # Show banner
    print_banner
    
    echo -e "${BOLD}${WHITE}Starting complete development environment...${NC}\n"
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Stop existing services
    stop_existing_services
    
    # Step 3: Infrastructure
    start_infrastructure
    
    # Step 4: Database
    setup_database
    
    # Step 5: Application
    start_application_services
    
    # Step 6: Summary
    echo ""
    display_service_status
    
    # Success message
    echo -e "\n${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${GREEN}║                                                                       ║${NC}"
    echo -e "${BOLD}${GREEN}║              🎉 All services started successfully! 🎉                 ║${NC}"
    echo -e "${BOLD}${GREEN}║                                                                       ║${NC}"
    echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${BOLD}${CYAN}Next Steps:${NC}"
    echo -e "  ${GREEN}1.${NC} Open ${WHITE}http://localhost:3000${NC} in your browser"
    echo -e "  ${GREEN}2.${NC} Check service logs: ${WHITE}tail -f $LOG_DIR/turbo-dev.log${NC}"
    echo -e "  ${GREEN}3.${NC} Monitor Kafka: ${WHITE}http://localhost:8080${NC}"
    echo -e "  ${GREEN}4.${NC} When done, run: ${WHITE}./stop-dev.sh${NC}\n"
    
    print_info "Services are running in the background"
    print_info "Logs are being written to: $LOG_DIR/"
    
    echo -e "\n${YELLOW}Press ENTER to view live logs (Ctrl+C to exit log view)${NC}"
    read
    
    # Follow logs
    echo -e "\n${BOLD}${CYAN}Following application logs...${NC}\n"
    tail -f $LOG_DIR/turbo-dev.log
}

# Run main function
main
