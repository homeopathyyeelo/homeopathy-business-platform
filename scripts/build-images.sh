#!/bin/bash

# Yeelo Homeopathy Platform Image Build Script
# This script builds all Docker images for the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is available"
}

# Build Frontend image
build_frontend() {
    print_status "Building Frontend image..."
    docker build -t yeelo-frontend:latest -f Dockerfile.frontend .
    print_success "Frontend image built"
}

# Build API Gateway image
build_api_gateway() {
    print_status "Building API Gateway image..."
    docker build -t yeelo-api-gateway:latest -f services/api-gateway/Dockerfile services/api-gateway/
    print_success "API Gateway image built"
}

# Build API Nest image
build_api_nest() {
    print_status "Building API Nest image..."
    docker build -t yeelo-api-nest:latest -f services/api-nest/Dockerfile services/api-nest/
    print_success "API Nest image built"
}

# Build API Fastify image
build_api_fastify() {
    print_status "Building API Fastify image..."
    docker build -t yeelo-api-fastify:latest -f services/api-fastify/Dockerfile services/api-fastify/
    print_success "API Fastify image built"
}

# Build AI Service image
build_ai_service() {
    print_status "Building AI Service image..."
    docker build -t yeelo-ai-service:latest -f services/ai-service/Dockerfile services/ai-service/
    print_success "AI Service image built"
}

# Build Outbox Worker image
build_outbox_worker() {
    print_status "Building Outbox Worker image..."
    docker build -t yeelo-outbox-worker:latest -f services/outbox-worker/Dockerfile services/outbox-worker/
    print_success "Outbox Worker image built"
}

# Build Campaign Sender image
build_campaign_sender() {
    print_status "Building Campaign Sender image..."
    docker build -t yeelo-campaign-sender:latest -f services/campaign-sender/Dockerfile services/campaign-sender/
    print_success "Campaign Sender image built"
}

# Build all images
build_all() {
    print_status "Building all Docker images..."
    echo ""
    
    build_frontend
    build_api_gateway
    build_api_nest
    build_api_fastify
    build_ai_service
    build_outbox_worker
    build_campaign_sender
    
    print_success "All images built successfully!"
}

# Show built images
show_images() {
    print_status "Built images:"
    echo ""
    docker images | grep yeelo
    echo ""
}

# Main function
main() {
    print_status "Starting Yeelo Homeopathy Platform image build..."
    echo ""
    
    # Pre-flight checks
    check_docker
    
    # Build all images
    build_all
    
    # Show images
    show_images
    
    print_success "Image build completed!"
    echo ""
    echo "Next steps:"
    echo "1. Push images to registry: docker push <registry>/yeelo-<service>:latest"
    echo "2. Deploy to Kubernetes: ./scripts/deploy.sh"
}

# Run main function
main "$@"
