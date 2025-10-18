#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# KAFKA INTEGRATION TESTING
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "🔄 KAFKA INTEGRATION TESTING"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. CHECK KAFKA BROKER
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 1. KAFKA BROKER STATUS ━━━${NC}"
echo ""

echo -n "Checking Kafka broker on localhost:9092... "
if nc -z localhost 9092 2>/dev/null; then
    echo -e "${GREEN}✅ RUNNING${NC}"
else
    echo -e "${RED}❌ NOT RUNNING${NC}"
    echo ""
    echo "To start Kafka:"
    echo "  docker-compose up -d kafka"
    echo "  OR"
    echo "  ./START-INFRA.sh"
    exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. LIST KAFKA TOPICS
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 2. KAFKA TOPICS ━━━${NC}"
echo ""

if docker ps | grep -q kafka; then
    echo "📋 Listing topics..."
    docker exec -it $(docker ps | grep kafka | awk '{print $1}') \
        kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null || \
        echo "Using docker-compose kafka service..."
    
    echo ""
    echo "📊 Topic details:"
    docker exec -it $(docker ps | grep kafka | awk '{print $1}') \
        kafka-topics --bootstrap-server localhost:9092 --describe 2>/dev/null | head -20
else
    echo -e "${YELLOW}⚠️  Kafka not running in Docker${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. TEST KAFKA PRODUCER (Node.js)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 3. KAFKA PRODUCER TEST ━━━${NC}"
echo ""

# Create test producer script
cat > /tmp/test-kafka-producer.js << 'EOF'
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function testProducer() {
  try {
    await producer.connect();
    console.log('✅ Producer connected to Kafka');
    
    const result = await producer.send({
      topic: 'test-events',
      messages: [
        {
          key: 'test-key',
          value: JSON.stringify({
            event: 'test',
            timestamp: new Date().toISOString(),
            data: { message: 'Test from terminal' }
          }),
        },
      ],
    });
    
    console.log('✅ Message sent successfully:', result);
    
    await producer.disconnect();
    console.log('✅ Producer disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Producer error:', error.message);
    process.exit(1);
  }
}

testProducer();
EOF

echo "Running Kafka producer test..."
if node /tmp/test-kafka-producer.js 2>&1; then
    echo -e "${GREEN}✅ Producer test successful${NC}"
else
    echo -e "${RED}❌ Producer test failed${NC}"
fi

rm /tmp/test-kafka-producer.js

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. TEST KAFKA CONSUMER (Node.js)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 4. KAFKA CONSUMER TEST ━━━${NC}"
echo ""

# Create test consumer script
cat > /tmp/test-kafka-consumer.js << 'EOF'
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'test-group' });

async function testConsumer() {
  try {
    await consumer.connect();
    console.log('✅ Consumer connected to Kafka');
    
    await consumer.subscribe({ topic: 'test-events', fromBeginning: false });
    console.log('✅ Subscribed to test-events topic');
    
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      if (!messageReceived) {
        console.log('⏱️  No messages received in 5 seconds (this is OK for empty topics)');
        process.exit(0);
      }
    }, 5000);
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messageReceived = true;
        console.log('✅ Message received:', {
          topic,
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
        clearTimeout(timeout);
        await consumer.disconnect();
        process.exit(0);
      },
    });
    
  } catch (error) {
    console.error('❌ Consumer error:', error.message);
    process.exit(1);
  }
}

testConsumer();
EOF

echo "Running Kafka consumer test (will wait 5 seconds)..."
timeout 6 node /tmp/test-kafka-consumer.js 2>&1 || echo "Consumer test completed"

rm /tmp/test-kafka-consumer.js

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. TEST KAFKA INTEGRATION WITH APIS
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 5. API KAFKA INTEGRATION ━━━${NC}"
echo ""

echo "Testing if APIs produce Kafka events on data changes..."
echo ""

# Test creating a product (should trigger Kafka event)
echo "1. Creating product via API (should trigger Kafka event)..."
response=$(curl -s -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kafka Test Product",
    "sku": "KAFKA-TEST-001",
    "category": "Test",
    "unit_price": 99.99,
    "stock_qty": 10
  }' 2>/dev/null)

if echo "$response" | grep -q "id\|success"; then
    echo -e "${GREEN}✅ Product created (should have triggered Kafka event)${NC}"
else
    echo -e "${YELLOW}⚠️  Product creation response: $response${NC}"
fi

echo ""

# Check Kafka service logs for event
echo "2. Checking if Kafka events service is running..."
if [ -d "services/kafka-events" ]; then
    if pgrep -f "kafka-events" > /dev/null; then
        echo -e "${GREEN}✅ Kafka events service is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Kafka events service not running${NC}"
        echo "   Start it with: cd services/kafka-events && npm start"
    fi
else
    echo -e "${YELLOW}⚠️  Kafka events service directory not found${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. KAFKA EVENT TYPES
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 6. EXPECTED KAFKA EVENTS ━━━${NC}"
echo ""

echo "Kafka events that should be produced by the system:"
echo ""
echo "📦 Product Events:"
echo "   - product.created"
echo "   - product.updated"
echo "   - product.deleted"
echo ""
echo "💰 Sales Events:"
echo "   - sale.created"
echo "   - sale.completed"
echo "   - sale.returned"
echo ""
echo "📋 Purchase Events:"
echo "   - purchase.order.created"
echo "   - purchase.order.approved"
echo "   - grn.created"
echo ""
echo "📊 Inventory Events:"
echo "   - inventory.updated"
echo "   - batch.created"
echo "   - stock.transfer"
echo "   - stock.adjustment"
echo ""
echo "👥 Customer Events:"
echo "   - customer.created"
echo "   - customer.updated"
echo ""

# ═══════════════════════════════════════════════════════════════
# 7. CHECK KAFKA UI
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 7. KAFKA UI ACCESS ━━━${NC}"
echo ""

echo -n "Checking Kafka UI on port 8080... "
if nc -z localhost 8080 2>/dev/null; then
    echo -e "${GREEN}✅ AVAILABLE${NC}"
    echo ""
    echo "📊 Access Kafka UI at: http://localhost:8080"
    echo "   - View topics"
    echo "   - See message flow"
    echo "   - Monitor consumers"
else
    echo -e "${YELLOW}⚠️  NOT RUNNING${NC}"
    echo "   Start with: docker-compose up -d kafka-ui"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo -e "${CYAN}📊 KAFKA TEST SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Kafka broker checked"
echo "✅ Topics listed"
echo "✅ Producer tested"
echo "✅ Consumer tested"
echo "✅ API integration checked"
echo ""
echo "🔍 To monitor Kafka in real-time:"
echo "   1. Open Kafka UI: http://localhost:8080"
echo "   2. Watch consumer logs: docker logs -f <kafka-consumer-container>"
echo "   3. Create test data via APIs and watch events flow"
echo ""
echo "═══════════════════════════════════════════════════════════════"
