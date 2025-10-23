// Kafka Event Consumer - Subscribe to events and process them

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs'
import { kafkaConfig, consumerConfig, topics, BaseEvent } from './config'

class EventConsumer {
  private kafka: Kafka
  private consumer: Consumer
  private isConnected: boolean = false
  private handlers: Map<string, Array<(event: BaseEvent) => Promise<void>>> = new Map()

  constructor() {
    this.kafka = new Kafka(kafkaConfig)
    this.consumer = this.kafka.consumer(consumerConfig)
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect()
      this.isConnected = true
      console.log(' Kafka Consumer connected')
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect()
      this.isConnected = false
      console.log(' Kafka Consumer disconnected')
    }
  }

  async subscribe(topic: string): Promise<void> {
    await this.connect()
    await this.consumer.subscribe({ topic, fromBeginning: false })
    console.log(` Subscribed to topic: ${topic}`)
  }

  async subscribeToTopics(topicList: string[]): Promise<void> {
    await this.connect()
    for (const topic of topicList) {
      await this.consumer.subscribe({ topic, fromBeginning: false })
      console.log(` Subscribed to topic: ${topic}`)
    }
  }

  registerHandler(topic: string, handler: (event: BaseEvent) => Promise<void>): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, [])
    }
    this.handlers.get(topic)!.push(handler)
    console.log(` Handler registered for topic: ${topic}`)
  }

  async start(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload)
      },
    })
    console.log(' Kafka Consumer started processing messages')
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload

    try {
      const event: BaseEvent = JSON.parse(message.value?.toString() || '{}')
      console.log(` Received event from ${topic}:`, event.eventType)

      const handlers = this.handlers.get(topic) || []
      
      // Execute all handlers for this topic
      await Promise.all(
        handlers.map(handler => 
          handler(event).catch(error => {
            console.error(` Handler error for ${topic}:`, error)
          })
        )
      )
    } catch (error) {
      console.error(` Error processing message from ${topic}:`, error)
    }
  }
}

// Singleton instance
export const eventConsumer = new EventConsumer()

// Example: Register event handlers
export function registerEventHandlers() {
  // Product Events
  eventConsumer.registerHandler(topics.PRODUCT_CREATED, async (event) => {
    console.log(' Product created:', event.data)
    // Update search index, cache, etc.
  })

  eventConsumer.registerHandler(topics.PRODUCT_STOCK_UPDATED, async (event) => {
    console.log(' Stock updated:', event.data)
    // Check low stock alerts, update dashboard
  })

  // Sale Events
  eventConsumer.registerHandler(topics.SALE_CREATED, async (event) => {
    console.log(' Sale created:', event.data)
    // Update inventory, customer loyalty points, analytics
  })

  eventConsumer.registerHandler(topics.SALE_COMPLETED, async (event) => {
    console.log(' Sale completed:', event.data)
    // Generate invoice, send confirmation email
  })

  // Inventory Events
  eventConsumer.registerHandler(topics.INVENTORY_LOW_STOCK, async (event) => {
    console.log(' Low stock alert:', event.data)
    // Send notification, create purchase order suggestion
  })

  eventConsumer.registerHandler(topics.INVENTORY_EXPIRING, async (event) => {
    console.log(' Expiring products:', event.data)
    // Send alert, create discount campaign
  })

  // Customer Events
  eventConsumer.registerHandler(topics.CUSTOMER_CREATED, async (event) => {
    console.log(' Customer created:', event.data)
    // Send welcome email, create loyalty account
  })

  eventConsumer.registerHandler(topics.CUSTOMER_LOYALTY_POINTS_ADDED, async (event) => {
    console.log(' Loyalty points added:', event.data)
    // Send notification, check tier upgrade
  })

  // Marketing Events
  eventConsumer.registerHandler(topics.CAMPAIGN_LAUNCHED, async (event) => {
    console.log(' Campaign launched:', event.data)
    // Start sending messages, track analytics
  })

  // Finance Events
  eventConsumer.registerHandler(topics.PAYMENT_RECEIVED, async (event) => {
    console.log(' Payment received:', event.data)
    // Update ledger, send receipt
  })

  console.log(' All event handlers registered')
}

export default eventConsumer
