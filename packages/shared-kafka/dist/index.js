"use strict";
/**
 * Shared Kafka Library
 * Provides producers, consumers, and event schemas for the Yeelo platform
 *
 * Learning Notes:
 * - Centralized Kafka configuration and utilities
 * - Type-safe event schemas and serialization
 * - Retry logic and error handling for reliability
 * - Support for both producers and consumers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGracefulShutdown = exports.createEventConsumer = exports.eventProducer = exports.createPurchaseOrderEvent = exports.createAIEvent = exports.createInventoryEvent = exports.createCampaignEvent = exports.createOrderEvent = exports.EventConsumer = exports.EventProducer = exports.TOPICS = exports.kafka = void 0;
const kafkajs_1 = require("kafkajs");
const confluent_schema_registry_1 = require("@kafkajs/confluent-schema-registry");
const SCHEMA_REGISTRY_URL = process.env.SCHEMA_REGISTRY_URL;
const schemaRegistry = SCHEMA_REGISTRY_URL ? new confluent_schema_registry_1.SchemaRegistry({ host: SCHEMA_REGISTRY_URL }) : undefined;
exports.kafka = new kafkajs_1.Kafka({
    clientId: "yeelo-platform",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
    connectionTimeout: 3000,
    requestTimeout: 30000,
});
exports.TOPICS = {
    ORDERS: "orders",
    CAMPAIGNS: "campaigns",
    INVENTORY: "inventory",
    AI_REQUESTS: "ai-requests",
    ANALYTICS: "analytics",
    NOTIFICATIONS: "notifications",
    PURCHASE_ORDERS: "purchase-orders",
};
async function encodeMessage(event) {
    if (!schemaRegistry) {
        return Buffer.from(JSON.stringify(event));
    }
    // minimal Avro schema by event type (example uses generic schema)
    const subject = `${event.type}-value`;
    const schema = {
        type: "record",
        name: "PlatformEvent",
        fields: [
            { name: "id", type: "string" },
            { name: "timestamp", type: "string" },
            { name: "version", type: "string" },
            { name: "source", type: "string" },
            { name: "type", type: "string" },
            { name: "data", type: "string" }, // store data as JSON string for flexibility
        ],
    };
    const result = await schemaRegistry.getLatestSchemaId(subject).catch(async () => {
        const { id } = await schemaRegistry.register({ type: confluent_schema_registry_1.SchemaType.AVRO, schema: JSON.stringify(schema) });
        return { id };
    });
    const id = typeof result === 'number' ? result : result.id;
    const payload = { ...event, data: JSON.stringify(event.data) };
    return await schemaRegistry.encode(id, payload);
}
async function decodeMessage(topic, buffer) {
    if (!buffer)
        return undefined;
    if (!schemaRegistry) {
        return JSON.parse(buffer.toString());
    }
    try {
        const decoded = (await schemaRegistry.decode(buffer));
        if (typeof decoded.data === "string")
            decoded.data = JSON.parse(decoded.data);
        return decoded;
    }
    catch (e) {
        console.warn(`[Kafka] Failed Avro decode for topic ${topic}, falling back to JSON:`, e);
        return JSON.parse(buffer.toString());
    }
}
class EventProducer {
    constructor() {
        this.isConnected = false;
        this.producer = exports.kafka.producer({
            maxInFlightRequests: 1,
            idempotent: true,
            transactionTimeout: 30000,
        });
    }
    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
            console.log("[Kafka Producer] Connected successfully");
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
            console.log("[Kafka Producer] Disconnected");
        }
    }
    async publishEvent(topic, event, key) {
        try {
            await this.connect();
            const value = await encodeMessage(event);
            const message = {
                key: key || event.id,
                value,
                timestamp: Date.now().toString(),
                headers: {
                    "event-type": event.type,
                    "event-version": event.version,
                    "event-source": event.source,
                },
            };
            await this.producer.send({
                topic,
                messages: [message],
            });
            console.log(`[Kafka Producer] Published event ${event.type} to topic ${topic}`);
        }
        catch (error) {
            console.error(`[Kafka Producer] Failed to publish event:`, error);
            throw error;
        }
    }
    async publishBatch(topic, events) {
        try {
            await this.connect();
            const messages = await Promise.all(events.map(async (event) => ({
                key: event.id,
                value: await encodeMessage(event),
                timestamp: Date.now().toString(),
                headers: {
                    "event-type": event.type,
                    "event-version": event.version,
                    "event-source": event.source,
                },
            })));
            await this.producer.send({
                topic,
                messages,
            });
            console.log(`[Kafka Producer] Published ${events.length} events to topic ${topic}`);
        }
        catch (error) {
            console.error(`[Kafka Producer] Failed to publish batch:`, error);
            throw error;
        }
    }
}
exports.EventProducer = EventProducer;
class EventConsumer {
    constructor(groupId) {
        this.isConnected = false;
        this.consumer = exports.kafka.consumer({
            groupId,
            sessionTimeout: 30000,
            rebalanceTimeout: 60000,
            heartbeatInterval: 3000,
        });
    }
    async connect() {
        if (!this.isConnected) {
            await this.consumer.connect();
            this.isConnected = true;
            console.log(`[Kafka Consumer] Connected`);
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.consumer.disconnect();
            this.isConnected = false;
            console.log("[Kafka Consumer] Disconnected");
        }
    }
    async subscribe(topics) {
        await this.connect();
        await this.consumer.subscribe({ topics, fromBeginning: false });
        console.log(`[Kafka Consumer] Subscribed to topics: ${topics.join(", ")}`);
    }
    async startConsuming(messageHandler) {
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value) {
                        console.warn("[Kafka Consumer] Received empty message");
                        return;
                    }
                    const event = await decodeMessage(topic, message.value);
                    if (!event) {
                        console.warn(`[Kafka Consumer] Could not decode message from topic ${topic}`);
                        return;
                    }
                    console.log(`[Kafka Consumer] Processing event ${event.type} from topic ${topic}`);
                    await messageHandler(event, {
                        topic,
                        partition,
                        offset: message.offset,
                    });
                    console.log(`[Kafka Consumer] Successfully processed event ${event.id}`);
                }
                catch (error) {
                    console.error("[Kafka Consumer] Error processing message:", error);
                    // In production, you might want to send to a dead letter queue
                    throw error;
                }
            },
        });
    }
}
exports.EventConsumer = EventConsumer;
const createOrderEvent = (type, data, source = "order-service") => ({
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source,
    type,
    data,
});
exports.createOrderEvent = createOrderEvent;
const createCampaignEvent = (type, data, source = "campaign-service") => ({
    id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source,
    type,
    data,
});
exports.createCampaignEvent = createCampaignEvent;
const createInventoryEvent = (type, data, source = "inventory-service") => ({
    id: `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source,
    type,
    data,
});
exports.createInventoryEvent = createInventoryEvent;
const createAIEvent = (type, data, source = "ai-service") => ({
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source,
    type,
    data,
});
exports.createAIEvent = createAIEvent;
const createPurchaseOrderEvent = (type, data, source = "purchase-service") => ({
    id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source,
    type,
    data,
});
exports.createPurchaseOrderEvent = createPurchaseOrderEvent;
exports.eventProducer = new EventProducer();
const createEventConsumer = (groupId) => new EventConsumer(groupId);
exports.createEventConsumer = createEventConsumer;
const setupGracefulShutdown = (consumers, producer) => {
    const shutdown = async () => {
        console.log("[Kafka] Shutting down gracefully...");
        await Promise.all([...consumers.map((consumer) => consumer.disconnect()), producer?.disconnect()]);
        console.log("[Kafka] Shutdown complete");
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};
exports.setupGracefulShutdown = setupGracefulShutdown;
