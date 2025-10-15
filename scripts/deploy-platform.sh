#!/bin/bash

# Yeelo Homeopathy Platform Deployment Script
# Deploys the complete platform to Kubernetes using Helm
#
# Learning Notes:
# - Automated deployment of all microservices
# - Handles dependencies and proper ordering
# - Includes health checks and rollback capabilities

set -e

NAMESPACE="yeelo-platform"
HELM_TIMEOUT="10m"
CHART_VERSION="0.1.0"

echo "🚀 Deploying Yeelo Homeopathy Platform..."

# Function to check if deployment is ready
check_deployment() {
    local deployment=$1
    local namespace=$2
    
    echo "⏳ Waiting for $deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n $namespace
    
    if [ $? -eq 0 ]; then
        echo "✅ $deployment is ready"
    else
        echo "❌ $deployment failed to become ready"
        exit 1
    fi
}

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl apply -f infra/k8s/namespace.yaml

# Install or upgrade Kafka cluster (if using Strimzi)
echo "🔧 Setting up Kafka cluster..."
kubectl apply -f infra/k8s/kafka-cluster.yaml

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka cluster to be ready..."
kubectl wait kafka/yeelo-kafka-cluster --for=condition=Ready --timeout=600s -n $NAMESPACE

# Deploy services in dependency order
echo "🏗️  Deploying microservices..."

# 1. Deploy Auth Service first (other services depend on it)
echo "🔐 Deploying Auth Service..."
helm upgrade --install auth-service infra/helm/auth-service \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "auth-service" $NAMESPACE

# 2. Deploy API Gateway
echo "🌐 Deploying API Gateway..."
helm upgrade --install api-gateway infra/helm/api-gateway \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "api-gateway" $NAMESPACE

# 3. Deploy Orders Service
echo "📦 Deploying Orders Service..."
helm upgrade --install orders-service infra/helm/orders-service \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "orders-service" $NAMESPACE

# 4. Deploy Campaigns Service
echo "📢 Deploying Campaigns Service..."
helm upgrade --install campaigns-service infra/helm/campaigns-service \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "campaigns-service" $NAMESPACE

# 5. Deploy AI Service
echo "🤖 Deploying AI Service..."
helm upgrade --install ai-service infra/helm/ai-service \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "ai-service" $NAMESPACE

# 6. Deploy Go Worker (Kafka consumer)
echo "⚙️  Deploying Go Worker..."
helm upgrade --install worker-golang infra/helm/worker-golang \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "worker-golang" $NAMESPACE

# 7. Deploy Analytics Service
echo "📊 Deploying Analytics Service..."
helm upgrade --install analytics-service infra/helm/analytics-service \
    --namespace $NAMESPACE \
    --timeout $HELM_TIMEOUT \
    --wait

check_deployment "analytics-service" $NAMESPACE

echo "🎉 Deployment completed successfully!"

# Display service status
echo "📋 Service Status:"
kubectl get pods -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
kubectl get ingress -n $NAMESPACE

# Display useful commands
echo "🔧 Useful commands:"
echo "  View logs: kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo "  Port forward API Gateway: kubectl port-forward service/api-gateway 8080:3000 -n $NAMESPACE"
echo "  Scale service: kubectl scale deployment <service-name> --replicas=5 -n $NAMESPACE"
echo "  Check HPA status: kubectl get hpa -n $NAMESPACE"

echo "✨ Platform is ready at: https://api.yeelo.com"
