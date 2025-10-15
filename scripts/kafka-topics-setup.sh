#!/bin/bash

# Kafka Topics Setup Script
# Creates all necessary topics for the Yeelo Homeopathy Platform
# 
# Learning Notes:
# - Creates topics with appropriate partitions and replication
# - Configures retention policies for different event types
# - Sets up topics for all microservices

echo "Setting up Kafka topics for Yeelo Homeopathy Platform..."

# Detect running Kafka container name if possible
KAFKA_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^yeelo-kafka$' | head -n1)
if [ -z "$KAFKA_CONTAINER" ]; then
  # Fallback to first container with kafka in its name
  KAFKA_CONTAINER=$(docker ps --format '{{.Names}}' | grep kafka | head -n1)
fi

# Default broker inside docker network; override via env KAFKA_BROKER
KAFKA_BROKER=${KAFKA_BROKER:-kafka:29092}

# Function to create topic
create_topic() {
    local topic_name=$1
    local partitions=$2
    local replication_factor=$3
    local retention_ms=$4
    
    echo "Creating topic: $topic_name"
    
    docker exec "$KAFKA_CONTAINER" bash -lc \
      "/usr/bin/kafka-topics --create --bootstrap-server $KAFKA_BROKER --topic $topic_name --partitions $partitions --replication-factor $replication_factor --config retention.ms=$retention_ms --if-not-exists"
}

# Create topics with appropriate configurations

# Orders topic - high throughput, long retention
create_topic "orders" 6 1 604800000  # 7 days retention

# Campaigns topic - medium throughput, medium retention  
create_topic "campaigns" 4 1 259200000  # 3 days retention

# Inventory topic - low throughput, short retention
create_topic "inventory" 2 1 86400000  # 1 day retention

# AI requests topic - medium throughput, short retention (cost sensitive)
create_topic "ai-requests" 3 1 86400000  # 1 day retention

# Analytics topic - high throughput, long retention
create_topic "analytics" 8 1 2592000000  # 30 days retention

# Notifications topic - high throughput, short retention
create_topic "notifications" 4 1 86400000  # 1 day retention

# Dead letter queue for failed messages
create_topic "dead-letter-queue" 2 1 604800000  # 7 days retention

echo "Kafka topics setup completed!"

# List all topics to verify
echo "Current topics:"
docker exec "$KAFKA_CONTAINER" bash -lc \
  "/usr/bin/kafka-topics --list --bootstrap-server $KAFKA_BROKER"
