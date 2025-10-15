#!/bin/bash

# Monitoring Stack Setup Script
# Deploys complete observability stack for Yeelo Platform
#
# Learning Notes:
# - Installs Prometheus, Grafana, Jaeger, and Loki
# - Configures service discovery and alerting
# - Sets up dashboards and log aggregation

set -e

NAMESPACE="yeelo-platform"
MONITORING_NAMESPACE="monitoring"

echo "🔍 Setting up monitoring stack for Yeelo Platform..."

# Create monitoring namespace
echo "📦 Creating monitoring namespace..."
kubectl create namespace $MONITORING_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Add Helm repositories
echo "📚 Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo update

# Install Prometheus Operator and Prometheus
echo "📊 Installing Prometheus stack..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    --namespace $MONITORING_NAMESPACE \
    --values infra/monitoring/prometheus/values.yaml \
    --timeout 10m \
    --wait

# Apply custom alerting rules
echo "🚨 Applying custom alerting rules..."
kubectl apply -f infra/monitoring/prometheus/alerting-rules.yaml

# Install Jaeger for distributed tracing
echo "🔍 Installing Jaeger..."
helm upgrade --install jaeger jaegertracing/jaeger \
    --namespace $MONITORING_NAMESPACE \
    --values infra/monitoring/jaeger/values.yaml \
    --timeout 10m \
    --wait

# Install Loki for log aggregation
echo "📝 Installing Loki..."
helm upgrade --install loki grafana/loki-stack \
    --namespace $MONITORING_NAMESPACE \
    --values infra/monitoring/loki/values.yaml \
    --timeout 10m \
    --wait

# Install exporters for additional metrics
echo "📈 Installing metric exporters..."

# Kafka exporter
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-exporter
  namespace: $MONITORING_NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kafka-exporter
  template:
    metadata:
      labels:
        app: kafka-exporter
    spec:
      containers:
      - name: kafka-exporter
        image: danielqsj/kafka-exporter:latest
        args:
        - --kafka.server=kafka.yeelo-platform:9092
        - --web.listen-address=:9308
        ports:
        - containerPort: 9308
          name: metrics
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 100m
            memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: kafka-exporter
  namespace: $MONITORING_NAMESPACE
  labels:
    app: kafka-exporter
spec:
  ports:
  - port: 9308
    name: metrics
  selector:
    app: kafka-exporter
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kafka-exporter
  namespace: $MONITORING_NAMESPACE
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: kafka-exporter
  endpoints:
  - port: metrics
    interval: 30s
EOF

# PostgreSQL exporter
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-exporter
  namespace: $MONITORING_NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres-exporter
  template:
    metadata:
      labels:
        app: postgres-exporter
    spec:
      containers:
      - name: postgres-exporter
        image: prometheuscommunity/postgres-exporter:latest
        env:
        - name: DATA_SOURCE_NAME
          value: "postgresql://postgres:password@postgres.yeelo-platform:5432/yeelo_homeopathy?sslmode=disable"
        ports:
        - containerPort: 9187
          name: metrics
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 100m
            memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-exporter
  namespace: $MONITORING_NAMESPACE
  labels:
    app: postgres-exporter
spec:
  ports:
  - port: 9187
    name: metrics
  selector:
    app: postgres-exporter
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-exporter
  namespace: $MONITORING_NAMESPACE
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: postgres-exporter
  endpoints:
  - port: metrics
    interval: 30s
EOF

# Wait for all components to be ready
echo "⏳ Waiting for monitoring components to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-kube-prometheus-prometheus-operator -n $MONITORING_NAMESPACE
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-grafana -n $MONITORING_NAMESPACE

# Get access information
echo "🎉 Monitoring stack deployed successfully!"
echo ""
echo "📊 Access Information:"
echo "  Prometheus: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n $MONITORING_NAMESPACE"
echo "  Grafana: kubectl port-forward svc/prometheus-grafana 3000:80 -n $MONITORING_NAMESPACE"
echo "  Jaeger: kubectl port-forward svc/jaeger-query 16686:16686 -n $MONITORING_NAMESPACE"
echo "  AlertManager: kubectl port-forward svc/prometheus-kube-prometheus-alertmanager 9093:9093 -n $MONITORING_NAMESPACE"
echo ""
echo "🔑 Default Credentials:"
echo "  Grafana: admin / admin123"
echo ""
echo "🔧 Useful Commands:"
echo "  View Prometheus targets: kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n $MONITORING_NAMESPACE"
echo "  Check alerting rules: kubectl get prometheusrules -n $MONITORING_NAMESPACE"
echo "  View service monitors: kubectl get servicemonitors -n $MONITORING_NAMESPACE"
