import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

class KafkaConsumerService {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'yeelo-frontend-consumer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async createConsumer(groupId: string, topics: string[]): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });

    this.consumers.set(groupId, consumer);
    console.log(` Kafka Consumer connected: ${groupId}`);

    return consumer;
  }

  async consumeMessages(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    const consumer = await this.createConsumer(groupId, topics);

    await consumer.run({
      eachMessage: async (payload) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(' Error processing message:', error);
        }
      },
    });
  }

  async disconnect(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(groupId);
      console.log(` Kafka Consumer disconnected: ${groupId}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [groupId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      console.log(` Kafka Consumer disconnected: ${groupId}`);
    }
    this.consumers.clear();
  }
}

export const kafkaConsumer = new KafkaConsumerService();

export default kafkaConsumer;
