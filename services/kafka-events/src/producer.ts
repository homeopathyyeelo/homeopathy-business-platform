// Kafka Event Producer - Publish events from all services

import { Kafka, Producer, ProducerRecord } from 'kafkajs'
import { kafkaConfig, BaseEvent, topics } from './config'
import { v4 as uuidv4 } from 'uuid'

class EventProducer {
  private kafka: Kafka
  private producer: Producer
  private isConnected: boolean = false

  constructor() {
    this.kafka = new Kafka(kafkaConfig)
    this.producer = this.kafka.producer()
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect()
      this.isConnected = true
      console.log(' Kafka Producer connected')
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect()
      this.isConnected = false
      console.log(' Kafka Producer disconnected')
    }
  }

  async publishEvent(topic: string, event: Partial<BaseEvent>): Promise<void> {
    try {
      await this.connect()

      const fullEvent: BaseEvent = {
        eventId: event.eventId || uuidv4(),
        eventType: event.eventType || topic,
        timestamp: event.timestamp || new Date().toISOString(),
        source: event.source || 'unknown',
        version: event.version || '1.0',
        data: event.data,
        metadata: event.metadata,
      }

      const message: ProducerRecord = {
        topic,
        messages: [
          {
            key: fullEvent.eventId,
            value: JSON.stringify(fullEvent),
            headers: {
              'event-type': fullEvent.eventType,
              'source': fullEvent.source,
            },
          },
        ],
      }

      await this.producer.send(message)
      console.log(` Event published to ${topic}:`, fullEvent.eventType)
    } catch (error) {
      console.error(' Error publishing event:', error)
      throw error
    }
  }

  // Domain-specific publish methods
  async publishProductEvent(eventType: string, data: any, source: string = 'api-golang-v2'): Promise<void> {
    const topic = this.getProductTopic(eventType)
    await this.publishEvent(topic, {
      eventType,
      source,
      data,
    })
  }

  async publishSaleEvent(eventType: string, data: any, source: string = 'api-golang-v2'): Promise<void> {
    const topic = this.getSaleTopic(eventType)
    await this.publishEvent(topic, {
      eventType,
      source,
      data,
    })
  }

  async publishInventoryEvent(eventType: string, data: any, source: string = 'api-golang-v2'): Promise<void> {
    const topic = this.getInventoryTopic(eventType)
    await this.publishEvent(topic, {
      eventType,
      source,
      data,
    })
  }

  async publishCustomerEvent(eventType: string, data: any, source: string = 'api-golang-v2'): Promise<void> {
    const topic = this.getCustomerTopic(eventType)
    await this.publishEvent(topic, {
      eventType,
      source,
      data,
    })
  }

  async publishMarketingEvent(eventType: string, data: any, source: string = 'api-fastify'): Promise<void> {
    const topic = this.getMarketingTopic(eventType)
    await this.publishEvent(topic, {
      eventType,
      source,
      data,
    })
  }

  private getProductTopic(eventType: string): string {
    const mapping: Record<string, string> = {
      'product.created': topics.PRODUCT_CREATED,
      'product.updated': topics.PRODUCT_UPDATED,
      'product.deleted': topics.PRODUCT_DELETED,
      'product.stock.updated': topics.PRODUCT_STOCK_UPDATED,
    }
    return mapping[eventType] || topics.PRODUCT_UPDATED
  }

  private getSaleTopic(eventType: string): string {
    const mapping: Record<string, string> = {
      'sale.created': topics.SALE_CREATED,
      'sale.completed': topics.SALE_COMPLETED,
      'sale.cancelled': topics.SALE_CANCELLED,
      'sale.returned': topics.SALE_RETURNED,
    }
    return mapping[eventType] || topics.SALE_CREATED
  }

  private getInventoryTopic(eventType: string): string {
    const mapping: Record<string, string> = {
      'inventory.adjusted': topics.INVENTORY_ADJUSTED,
      'inventory.transferred': topics.INVENTORY_TRANSFERRED,
      'inventory.low-stock': topics.INVENTORY_LOW_STOCK,
      'inventory.expiring': topics.INVENTORY_EXPIRING,
    }
    return mapping[eventType] || topics.INVENTORY_ADJUSTED
  }

  private getCustomerTopic(eventType: string): string {
    const mapping: Record<string, string> = {
      'customer.created': topics.CUSTOMER_CREATED,
      'customer.updated': topics.CUSTOMER_UPDATED,
      'customer.loyalty.points.added': topics.CUSTOMER_LOYALTY_POINTS_ADDED,
      'customer.loyalty.points.redeemed': topics.CUSTOMER_LOYALTY_POINTS_REDEEMED,
    }
    return mapping[eventType] || topics.CUSTOMER_UPDATED
  }

  private getMarketingTopic(eventType: string): string {
    const mapping: Record<string, string> = {
      'campaign.created': topics.CAMPAIGN_CREATED,
      'campaign.launched': topics.CAMPAIGN_LAUNCHED,
      'campaign.completed': topics.CAMPAIGN_COMPLETED,
    }
    return mapping[eventType] || topics.CAMPAIGN_CREATED
  }
}

// Singleton instance
export const eventProducer = new EventProducer()

// Export for use in services
export default eventProducer
