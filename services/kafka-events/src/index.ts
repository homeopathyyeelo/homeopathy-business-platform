// Kafka Events Service - Main Entry Point

import { eventConsumer, registerEventHandlers } from './consumer'
import { eventProducer } from './producer'
import { topics } from './config'

async function main() {
  console.log(' Starting Kafka Events Service...')

  try {
    // Connect producer
    await eventProducer.connect()

    // Register all event handlers
    registerEventHandlers()

    // Subscribe to all topics
    const allTopics = Object.values(topics)
    await eventConsumer.subscribeToTopics(allTopics)

    // Start consuming messages
    await eventConsumer.start()

    console.log(' Kafka Events Service running')
  } catch (error) {
    console.error(' Failed to start Kafka Events Service:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n Shutting down Kafka Events Service...')
  await eventConsumer.disconnect()
  await eventProducer.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n Shutting down Kafka Events Service...')
  await eventConsumer.disconnect()
  await eventProducer.disconnect()
  process.exit(0)
})

main()

// Export for use in other services
export { eventProducer, eventConsumer }
export * from './config'
