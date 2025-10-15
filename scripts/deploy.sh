#!/bin/bash

# Yeelo Homeopathy Platform Deployment Script
# This script deploys the complete platform to Kubernetes

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

# Check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl is available"
}

# Check if helm is installed
check_helm() {
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed. Please install helm first."
        exit 1
    fi
    print_success "helm is available"
}

# Create namespace
create_namespace() {
    print_status "Creating namespace..."
    kubectl create namespace yeelo --dry-run=client -o yaml | kubectl apply -f -
    print_success "Namespace created/verified"
}

# Deploy PostgreSQL
deploy_postgres() {
    print_status "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres.yaml
    print_success "PostgreSQL deployed"
}

# Deploy Redis
deploy_redis() {
    print_status "Deploying Redis..."
    kubectl apply -f k8s/redis.yaml
    print_success "Redis deployed"
}

# Deploy Kafka
deploy_kafka() {
    print_status "Deploying Kafka..."
    kubectl apply -f k8s/kafka.yaml
    print_success "Kafka deployed"
}

# Deploy MinIO
deploy_minio() {
    print_status "Deploying MinIO..."
    kubectl apply -f k8s/minio.yaml
    print_success "MinIO deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    print_status "Deploying monitoring stack..."
    
    # Add Prometheus Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Install Prometheus
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace yeelo \
        --set grafana.adminPassword=admin123 \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false
    
    # Apply custom Prometheus config
    kubectl apply -f k8s/monitoring/prometheus-config.yaml
    
    # Apply Grafana dashboard
    kubectl apply -f k8s/monitoring/grafana-dashboard.yaml
    
    print_success "Monitoring stack deployed"
}

# Deploy application services
deploy_applications() {
    print_status "Deploying application services..."
    
    # Deploy API Gateway
    kubectl apply -f k8s/api-gateway-deployment.yaml
    print_success "API Gateway deployed"
    
    # Deploy AI Service
    kubectl apply -f k8s/ai-service-deployment.yaml
    print_success "AI Service deployed"
    
    # Deploy Frontend
    kubectl apply -f k8s/frontend-deployment.yaml
    print_success "Frontend deployed"
    
    # Deploy Ingress
    kubectl apply -f k8s/ingress.yaml
    print_success "Ingress deployed"
}

# Wait for deployments
wait_for_deployments() {
    print_status "Waiting for deployments to be ready..."
    
    # Wait for PostgreSQL
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n yeelo || true
    
    # Wait for Redis
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n yeelo || true
    
    # Wait for API Gateway
    kubectl wait --for=condition=available --timeout=300s deployment/yeelo-api-gateway -n yeelo || true
    
    # Wait for AI Service
    kubectl wait --for=condition=available --timeout=300s deployment/yeelo-ai-service -n yeelo || true
    
    # Wait for Frontend
    kubectl wait --for=condition=available --timeout=300s deployment/yeelo-frontend -n yeelo || true
    
    print_success "Deployments are ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Get the API Gateway pod
    API_POD=$(kubectl get pods -n yeelo -l app=yeelo-api-gateway -o jsonpath='{.items[0].metadata.name}')
    
    if [ -n "$API_POD" ]; then
        # Run migrations
        kubectl exec -n yeelo $API_POD -- npm run db:migrate:deploy
        print_success "Database migrations completed"
    else
        print_warning "API Gateway pod not found, skipping migrations"
    fi
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    # Show pods
    echo "Pods:"
    kubectl get pods -n yeelo
    echo ""
    
    # Show services
    echo "Services:"
    kubectl get services -n yeelo
    echo ""
    
    # Show ingress
    echo "Ingress:"
    kubectl get ingress -n yeelo
    echo ""
    
    # Show URLs
    print_success "Deployment completed!"
    echo ""
    echo "Access URLs:"
    echo "- Frontend: https://app.yeelo.com"
    echo "- API: https://api.yeelo.com"
    echo "- B2B Portal: https://b2b.yeelo.com"
    echo "- Grafana: http://localhost:3000 (port-forward)"
    echo ""
    echo "To access Grafana locally:"
    echo "kubectl port-forward -n yeelo svc/prometheus-grafana 3000:80"
    echo ""
    echo "Grafana credentials:"
    echo "Username: admin"
    echo "Password: admin123"
}

# Main deployment function
main() {
    print_status "Starting Yeelo Homeopathy Platform deployment..."
    echo ""
    
    # Pre-flight checks
    check_kubectl
    check_helm
    
    # Deploy infrastructure
    create_namespace
    deploy_postgres
    deploy_redis
    deploy_kafka
    deploy_minio
    
    # Deploy monitoring
    deploy_monitoring
    
    # Deploy applications
    deploy_applications
    
    # Wait for deployments
    wait_for_deployments
    
    # Run migrations
    run_migrations
    
    # Show status
    show_status
}

# Run main function
main "$@"