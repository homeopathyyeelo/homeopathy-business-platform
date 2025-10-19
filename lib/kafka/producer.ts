import { Kafka, Producer, ProducerRecord, Message } from 'kafkajs';

class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'yeelo-frontend',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Producer connected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('❌ Kafka Producer disconnected');
    }
  }

  async sendMessage(topic: string, messages: Message[]): Promise<void> {
    try {
      await this.connect();
      
      const record: ProducerRecord = {
        topic,
        messages,
      };

      await this.producer.send(record);
      console.log(`📤 Message sent to topic: ${topic}`);
    } catch (error) {
      console.error('❌ Error sending message to Kafka:', error);
      throw error;
    }
  }

  async sendEvent(topic: string, event: any): Promise<void> {
    const message: Message = {
      key: event.id || Date.now().toString(),
      value: JSON.stringify(event),
      timestamp: Date.now().toString(),
    };

    await this.sendMessage(topic, [message]);
  }

  // User Events
  async publishUserEvent(eventType: string, data: any): Promise<void> {
    await this.sendEvent('user-events', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Product Events
  async publishProductEvent(eventType: string, data: any): Promise<void> {
    await this.sendEvent('product-events', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Order Events
  async publishOrderEvent(eventType: string, data: any): Promise<void> {
    await this.sendEvent('order-events', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Payment Events
  async publishPaymentEvent(eventType: string, data: any): Promise<void> {
    await this.sendEvent('payment-events', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Inventory Events
  async publishInventoryEvent(eventType: string, data: any): Promise<void> {
    await this.sendEvent('inventory-events', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const kafkaProducer = new KafkaProducerService();

// Auto-connect on module load (optional)
if (typeof window === 'undefined') {
  // Only connect on server-side
  kafkaProducer.connect().catch(console.error);
}

export default kafkaProducer;
