import { Kafka, logLevel } from 'kafkajs'

const broker = process.env.KAFKA_BROKER || 'kafka:29092'
const groupId = process.env.KAFKA_GROUP_ID || 'outbox-worker'

const kafka = new Kafka({ brokers: [broker], logLevel: logLevel.INFO })

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })

async function run() {
  await producer.connect()
  await consumer.connect()
  await consumer.subscribe({ topic: process.env.CONSUME_TOPIC || 'orders', fromBeginning: true })

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key?.toString()
      const value = message.value?.toString()
      console.log(`[consume] ${topic}[${partition}] key=${key} value=${value}`)
    },
  })

  // Periodic demo publish to verify plumbing
  setInterval(async () => {
    try {
      const payload = {
        event_type: 'heartbeat',
        at: new Date().toISOString(),
      }
      await producer.send({
        topic: process.env.PUBLISH_TOPIC || 'analytics',
        messages: [{ key: 'outbox-worker', value: JSON.stringify(payload) }],
      })
      console.log('[publish] heartbeat sent')
    } catch (err) {
      console.error('publish error', err)
    }
  }, 15000)
}

run().catch((e) => {
  console.error('outbox-worker fatal', e)
  process.exit(1)
})


