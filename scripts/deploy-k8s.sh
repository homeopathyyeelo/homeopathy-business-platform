#!/bin/bash

# Yeelo Homeopathy Business Platform - Kubernetes Deployment Script
# This script handles the deployment of the platform to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="yeelo-homeopathy"
CONTEXT=${1:-"default"}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    log_info "Checking kubectl..."
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl and try again."
        exit 1
    fi
    log_success "kubectl is available"
}

# Check if cluster is accessible
check_cluster() {
    log_info "Checking cluster connectivity..."
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    log_success "Cluster is accessible"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
    log_success "Namespace created"
}

# Apply configurations
apply_configs() {
    log_info "Applying configurations..."
    
    # Apply ConfigMap and Secrets
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    
    log_success "Configurations applied"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure services..."
    
    # Deploy PostgreSQL
    kubectl apply -f k8s/postgres.yaml
    
    # Deploy Redis
    kubectl apply -f k8s/redis.yaml
    
    # Wait for infrastructure to be ready
    log_info "Waiting for infrastructure services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n $NAMESPACE
    
    log_success "Infrastructure services deployed"
}

# Deploy application services
deploy_application() {
    log_info "Deploying application services..."
    
    # Deploy AI Service
    kubectl apply -f k8s/ai-service.yaml
    
    # Deploy API Gateway
    kubectl apply -f k8s/api-gateway.yaml
    
    # Wait for application services to be ready
    log_info "Waiting for application services to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/ai-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n $NAMESPACE
    
    log_success "Application services deployed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Create a job to run migrations
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: migration
        image: yeelo-api-nest:latest
        command: ["npm", "run", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: yeelo-config
              key: DATABASE_URL
      restartPolicy: Never
  backoffLimit: 3
EOF
    
    # Wait for migration to complete
    kubectl wait --for=condition=complete --timeout=300s job/db-migration -n $NAMESPACE
    
    log_success "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if all deployments are ready
    kubectl get deployments -n $NAMESPACE
    
    # Check if all services are running
    kubectl get services -n $NAMESPACE
    
    # Check pod status
    kubectl get pods -n $NAMESPACE
    
    log_success "Health checks completed"
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    echo "Namespace: $NAMESPACE"
    echo "Context: $CONTEXT"
    echo ""
    echo "Deployments:"
    kubectl get deployments -n $NAMESPACE
    echo ""
    echo "Services:"
    kubectl get services -n $NAMESPACE
    echo ""
    echo "Pods:"
    kubectl get pods -n $NAMESPACE
    echo ""
    echo "To access services:"
    echo "  - Port forward API Gateway: kubectl port-forward service/api-gateway-service 3001:3001 -n $NAMESPACE"
    echo "  - Port forward AI Service: kubectl port-forward service/ai-service 8001:8001 -n $NAMESPACE"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment..."
    kubectl delete namespace $NAMESPACE
    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    log_info "Starting Kubernetes deployment for namespace: $NAMESPACE"
    
    check_kubectl
    check_cluster
    create_namespace
    apply_configs
    deploy_infrastructure
    run_migrations
    deploy_application
    health_check
    show_status
    
    log_success "Kubernetes deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        show_status
        ;;
    "health")
        health_check
        ;;
    "logs")
        kubectl logs -f deployment/ai-service -n $NAMESPACE
        ;;
    *)
        echo "Usage: $0 {deploy|cleanup|status|health|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the entire platform to Kubernetes (default)"
        echo "  cleanup  - Delete the entire namespace and all resources"
        echo "  status   - Show deployment status"
        echo "  health   - Perform health checks"
        echo "  logs     - Show logs from AI service"
        exit 1
        ;;
esac

