/**
 * Outbox Publisher Service
 * Reads unpublished events from the outbox table and publishes them to Kafka
 */

import { Kafka, logLevel } from 'kafkajs'
import { Pool } from 'pg'

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  logLevel: logLevel.INFO,
  clientId: 'outbox-publisher'
})

const producer = kafka.producer()

// Database connection
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

class OutboxPublisher {
  constructor() {
    this.isRunning = false
    this.pollInterval = 5000 // 5 seconds
    this.batchSize = 100
  }

  async start() {
    console.log('Starting Outbox Publisher...')
    
    try {
      await producer.connect()
      console.log('Connected to Kafka')
      
      this.isRunning = true
      this.pollForEvents()
      
      console.log('Outbox Publisher started successfully')
    } catch (error) {
      console.error('Failed to start Outbox Publisher:', error)
      throw error
    }
  }

  async stop() {
    console.log('Stopping Outbox Publisher...')
    this.isRunning = false
    
    try {
      await producer.disconnect()
      await dbPool.end()
      console.log('Outbox Publisher stopped')
    } catch (error) {
      console.error('Error stopping Outbox Publisher:', error)
    }
  }

  async pollForEvents() {
    while (this.isRunning) {
      try {
        await this.processOutboxEvents()
      } catch (error) {
        console.error('Error processing outbox events:', error)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval))
    }
  }

  async processOutboxEvents() {
    const client = await dbPool.connect()
    
    try {
      // Start transaction
      await client.query('BEGIN')
      
      // Get unpublished events
      const result = await client.query(`
        SELECT id, aggregate_type, aggregate_id, event_type, payload, created_at
        FROM outbox 
        WHERE published = false 
        ORDER BY created_at ASC 
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `, [this.batchSize])
      
      if (result.rows.length === 0) {
        await client.query('COMMIT')
        return
      }
      
      console.log(`Processing ${result.rows.length} outbox events`)
      
      // Process each event
      for (const event of result.rows) {
        try {
          await this.publishEvent(event)
          
          // Mark as published
          await client.query(
            'UPDATE outbox SET published = true, published_at = NOW() WHERE id = $1',
            [event.id]
          )
          
          console.log(`Published event: ${event.event_type} for ${event.aggregate_type}:${event.aggregate_id}`)
        } catch (error) {
          console.error(`Failed to publish event ${event.id}:`, error)
          
          // Move to DLQ after 3 failed attempts
          await client.query(`
            INSERT INTO outbox_dlq (outbox_id, error_message, retry_count, created_at)
            VALUES ($1, $2, 1, NOW())
            ON CONFLICT (outbox_id) 
            DO UPDATE SET 
              retry_count = outbox_dlq.retry_count + 1,
              error_message = $2,
              updated_at = NOW()
          `, [event.id, error.message])
          
          // Mark as published to avoid reprocessing
          await client.query(
            'UPDATE outbox SET published = true, published_at = NOW() WHERE id = $1',
            [event.id]
          )
        }
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async publishEvent(event) {
    const topic = this.getTopicForEventType(event.event_type)
    
    const message = {
      key: event.aggregate_id,
      value: JSON.stringify({
        event_type: event.event_type,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        payload: event.payload,
        metadata: {
          source: 'outbox-publisher',
          published_at: new Date().toISOString(),
          trace_id: this.generateTraceId()
        }
      }),
      headers: {
        eventType: event.event_type,
        aggregateType: event.aggregate_type,
        aggregateId: event.aggregate_id
      }
    }
    
    await producer.send({
      topic,
      messages: [message]
    })
  }

  getTopicForEventType(eventType) {
    // Map event types to Kafka topics
    const topicMap = {
      'order.created': 'orders.events',
      'order.updated': 'orders.events',
      'order.cancelled': 'orders.events',
      'order.completed': 'orders.events',
      
      'inventory.updated': 'inventory.events',
      'inventory.low': 'inventory.events',
      'inventory.restocked': 'inventory.events',
      'inventory.transferred': 'inventory.events',
      
      'purchaseorder.created': 'purchase.events',
      'purchaseorder.approved': 'purchase.events',
      'purchaseorder.received': 'purchase.events',
      
      'campaign.created': 'campaigns.events',
      'campaign.scheduled': 'campaigns.events',
      'campaign.sent': 'campaigns.events',
      
      'customer.created': 'customers.events',
      'customer.updated': 'customers.events',
      
      'product.created': 'products.events',
      'product.updated': 'products.events',
      
      'ai.requested': 'ai.events',
      'ai.completed': 'ai.events',
      'ai.failed': 'ai.events'
    }
    
    // Extract base event type (before the dot)
    const baseEventType = eventType.split('.')[0]
    const topic = topicMap[eventType] || `${baseEventType}.events`
    
    return topic
  }

  generateTraceId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}

// Start the publisher
const publisher = new OutboxPublisher()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await publisher.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await publisher.stop()
  process.exit(0)
})

// Start the service
publisher.start().catch((error) => {
  console.error('Failed to start Outbox Publisher:', error)
  process.exit(1)
})

