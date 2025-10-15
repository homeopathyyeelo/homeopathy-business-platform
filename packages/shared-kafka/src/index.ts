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

import { Kafka, type Producer, type Consumer, type EachMessagePayload } from "kafkajs"
import { SchemaRegistry, SchemaType } from "@kafkajs/confluent-schema-registry"

const SCHEMA_REGISTRY_URL = process.env.SCHEMA_REGISTRY_URL
const schemaRegistry = SCHEMA_REGISTRY_URL ? new SchemaRegistry({ host: SCHEMA_REGISTRY_URL }) : undefined

export const kafka = new Kafka({
  clientId: "yeelo-platform",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
  connectionTimeout: 3000,
  requestTimeout: 30000,
})

export interface BaseEvent {
  id: string
  timestamp: string
  version: string
  source: string
}

export interface OrderEvent extends BaseEvent {
  type: "order.created" | "order.updated" | "order.cancelled" | "order.completed"
  data: {
    orderId: string
    customerId: string
    shopId: string
    status: string
    totalAmount: number
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
  }
}

export interface CampaignEvent extends BaseEvent {
  type: "campaign.created" | "campaign.launched" | "campaign.completed" | "campaign.failed"
  data: {
    campaignId: string
    shopId: string
    channel: "whatsapp" | "sms" | "email"
    targetCount: number
    status: string
  }
}

export interface InventoryEvent extends BaseEvent {
  type: "inventory.updated" | "inventory.low_stock" | "inventory.out_of_stock"
  data: {
    productId: string
    shopId: string
    currentStock: number
    reorderPoint: number
    lastUpdated: string
  }
}

export interface AIEvent extends BaseEvent {
  type: "ai.request" | "ai.response" | "ai.error"
  data: {
    requestId: string
    userId: string
    promptType: string
    tokensUsed?: number
    cost?: number
    duration?: number
  }
}

export interface PurchaseOrderEvent extends BaseEvent {
  type: "purchase_order.created" | "purchase_order.updated" | "purchase_order.status_updated"
  data: {
    purchaseOrderId: string
    vendorId: string
    shopId: string
    status: string
    totalAmount: number
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
  }
}

export type PlatformEvent = OrderEvent | CampaignEvent | InventoryEvent | AIEvent | PurchaseOrderEvent

export const TOPICS = {
  ORDERS: "orders",
  CAMPAIGNS: "campaigns",
  INVENTORY: "inventory",
  AI_REQUESTS: "ai-requests",
  ANALYTICS: "analytics",
  NOTIFICATIONS: "notifications",
  PURCHASE_ORDERS: "purchase-orders",
} as const

async function encodeMessage(event: PlatformEvent): Promise<Buffer> {
  if (!schemaRegistry) {
    return Buffer.from(JSON.stringify(event))
  }
  // minimal Avro schema by event type (example uses generic schema)
  const subject = `${event.type}-value`
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
  }
  const result = await schemaRegistry.getLatestSchemaId(subject).catch(async () => {
    const { id } = await schemaRegistry!.register({ type: SchemaType.AVRO, schema: JSON.stringify(schema) })
    return { id }
  })
  const id = typeof result === 'number' ? result : result.id
  const payload = { ...event, data: JSON.stringify(event.data) }
  return await schemaRegistry.encode(id, payload)
}

async function decodeMessage(topic: string, buffer: Buffer): Promise<PlatformEvent | undefined> {
  if (!buffer) return undefined
  if (!schemaRegistry) {
    return JSON.parse(buffer.toString()) as PlatformEvent
  }
  try {
    const decoded = (await schemaRegistry.decode(buffer)) as any
    if (typeof decoded.data === "string") decoded.data = JSON.parse(decoded.data)
    return decoded as PlatformEvent
  } catch (e) {
    console.warn(`[Kafka] Failed Avro decode for topic ${topic}, falling back to JSON:`, e)
    return JSON.parse(buffer.toString()) as PlatformEvent
  }
}

export class EventProducer {
  private producer: Producer
  private isConnected = false

  constructor() {
    this.producer = kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    })
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect()
      this.isConnected = true
      console.log("[Kafka Producer] Connected successfully")
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect()
      this.isConnected = false
      console.log("[Kafka Producer] Disconnected")
    }
  }

  async publishEvent(topic: string, event: PlatformEvent, key?: string): Promise<void> {
    try {
      await this.connect()

      const value = await encodeMessage(event)

      const message = {
        key: key || event.id,
        value,
        timestamp: Date.now().toString(),
        headers: {
          "event-type": event.type,
          "event-version": event.version,
          "event-source": event.source,
        },
      }

      await this.producer.send({
        topic,
        messages: [message],
      })

      console.log(`[Kafka Producer] Published event ${event.type} to topic ${topic}`)
    } catch (error) {
      console.error(`[Kafka Producer] Failed to publish event:`, error)
      throw error
    }
  }

  async publishBatch(topic: string, events: PlatformEvent[]): Promise<void> {
    try {
      await this.connect()

      const messages = await Promise.all(
        events.map(async (event) => ({
          key: event.id,
          value: await encodeMessage(event),
          timestamp: Date.now().toString(),
          headers: {
            "event-type": event.type,
            "event-version": event.version,
            "event-source": event.source,
          },
        })),
      )

      await this.producer.send({
        topic,
        messages,
      })

      console.log(`[Kafka Producer] Published ${events.length} events to topic ${topic}`)
    } catch (error) {
      console.error(`[Kafka Producer] Failed to publish batch:`, error)
      throw error
    }
  }
}

export class EventConsumer {
  private consumer: Consumer
  private isConnected = false

  constructor(groupId: string) {
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    })
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect()
      this.isConnected = true
      console.log(`[Kafka Consumer] Connected`)
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect()
      this.isConnected = false
      console.log("[Kafka Consumer] Disconnected")
    }
  }

  async subscribe(topics: string[]): Promise<void> {
    await this.connect()
    await this.consumer.subscribe({ topics, fromBeginning: false })
    console.log(`[Kafka Consumer] Subscribed to topics: ${topics.join(", ")}`)
  }

  async startConsuming(
    messageHandler: (
      event: PlatformEvent,
      metadata: {
        topic: string
        partition: number
        offset: string
      },
    ) => Promise<void>,
  ): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          if (!message.value) {
            console.warn("[Kafka Consumer] Received empty message")
            return
          }

          const event = await decodeMessage(topic, message.value)

          if (!event) {
            console.warn(`[Kafka Consumer] Could not decode message from topic ${topic}`)
            return
          }

          console.log(`[Kafka Consumer] Processing event ${event.type} from topic ${topic}`)

          await messageHandler(event, {
            topic,
            partition,
            offset: message.offset,
          })

          console.log(`[Kafka Consumer] Successfully processed event ${event.id}`)
        } catch (error) {
          console.error("[Kafka Consumer] Error processing message:", error)
          // In production, you might want to send to a dead letter queue
          throw error
        }
      },
    })
  }
}

export const createOrderEvent = (
  type: OrderEvent["type"],
  data: OrderEvent["data"],
  source = "order-service",
): OrderEvent => ({
  id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  version: "1.0",
  source,
  type,
  data,
})

export const createCampaignEvent = (
  type: CampaignEvent["type"],
  data: CampaignEvent["data"],
  source = "campaign-service",
): CampaignEvent => ({
  id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  version: "1.0",
  source,
  type,
  data,
})

export const createInventoryEvent = (
  type: InventoryEvent["type"],
  data: InventoryEvent["data"],
  source = "inventory-service",
): InventoryEvent => ({
  id: `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  version: "1.0",
  source,
  type,
  data,
})

export const createAIEvent = (type: AIEvent["type"], data: AIEvent["data"], source = "ai-service"): AIEvent => ({
  id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  version: "1.0",
  source,
  type,
  data,
})

export const createPurchaseOrderEvent = (
  type: PurchaseOrderEvent["type"],
  data: PurchaseOrderEvent["data"],
  source = "purchase-service",
): PurchaseOrderEvent => ({
  id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  version: "1.0",
  source,
  type,
  data,
})

export const eventProducer = new EventProducer()
export const createEventConsumer = (groupId: string) => new EventConsumer(groupId)

export const setupGracefulShutdown = (consumers: EventConsumer[], producer?: EventProducer) => {
  const shutdown = async () => {
    console.log("[Kafka] Shutting down gracefully...")

    await Promise.all([...consumers.map((consumer) => consumer.disconnect()), producer?.disconnect()])

    console.log("[Kafka] Shutdown complete")
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}
