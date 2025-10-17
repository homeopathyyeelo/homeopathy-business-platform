#!/bin/bash

# Deploy Yeelo Homeopathy ERP to Kubernetes

set -e

echo "🚀 Deploying Yeelo Homeopathy ERP to Kubernetes..."
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Create secrets
echo -e "${BLUE}📝 Creating secrets...${NC}"
kubectl apply -f k8s/secrets/database-secrets.yaml
kubectl apply -f k8s/secrets/jwt-secrets.yaml
echo -e "${GREEN}✅ Secrets created${NC}"

# 2. Deploy StatefulSets (Databases, Kafka, Zookeeper)
echo -e "${BLUE}🗄️  Deploying StatefulSets...${NC}"
kubectl apply -f k8s/statefulsets/postgres-statefulset.yaml
kubectl apply -f k8s/statefulsets/kafka-statefulset.yaml
echo -e "${GREEN}✅ StatefulSets deployed${NC}"

# Wait for StatefulSets to be ready
echo -e "${YELLOW}⏳ Waiting for StatefulSets to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=zookeeper --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka --timeout=300s
echo -e "${GREEN}✅ StatefulSets ready${NC}"

# 3. Deploy backend services
echo -e "${BLUE}🔷 Deploying backend services...${NC}"
kubectl apply -f k8s/deployments/api-golang-v1-deployment.yaml
kubectl apply -f k8s/deployments/api-golang-v2-deployment.yaml
kubectl apply -f k8s/deployments/api-nest-deployment.yaml
kubectl apply -f k8s/deployments/api-fastify-deployment.yaml
kubectl apply -f k8s/deployments/ai-service-deployment.yaml
echo -e "${GREEN}✅ Backend services deployed${NC}"

# 4. Deploy gateways
echo -e "${BLUE}🌐 Deploying gateways...${NC}"
kubectl apply -f k8s/deployments/graphql-gateway-deployment.yaml
echo -e "${GREEN}✅ Gateways deployed${NC}"

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment/api-golang-v1 --timeout=300s
kubectl wait --for=condition=available deployment/api-golang-v2 --timeout=300s
kubectl wait --for=condition=available deployment/api-nest --timeout=300s
kubectl wait --for=condition=available deployment/api-fastify --timeout=300s
kubectl wait --for=condition=available deployment/ai-service --timeout=300s
kubectl wait --for=condition=available deployment/graphql-gateway --timeout=300s
echo -e "${GREEN}✅ All deployments ready${NC}"

# 5. Show status
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📊 Deployment Status:"
kubectl get deployments
echo ""
echo "📦 Pods:"
kubectl get pods
echo ""
echo "🌐 Services:"
kubectl get services
echo ""
echo "🔍 To check logs:"
echo "  kubectl logs -f deployment/api-golang-v2"
echo "  kubectl logs -f deployment/api-nest"
echo "  kubectl logs -f deployment/graphql-gateway"
echo ""
echo "🌐 To access GraphQL Gateway:"
echo "  kubectl port-forward service/graphql-gateway-service 4000:4000"
echo "  Then open: http://localhost:4000/graphql"
echo ""
