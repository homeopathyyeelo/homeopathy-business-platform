// Central API exports for all microservices
export { userServiceAPI, type User, type LoginRequest, type LoginResponse } from './user-service';
export { productServiceAPI, type Product, type Category, type Brand, type Inventory } from './product-service';
export { orderServiceAPI, type Order, type OrderItem, type CreateOrderRequest } from './order-service';
export { paymentServiceAPI, type Payment, type CreatePaymentRequest, type RefundRequest } from './payment-service';

// Kafka exports
export { kafkaProducer } from '@/lib/kafka/producer';
export { kafkaConsumer } from '@/lib/kafka/consumer';

// Initialize all services with token
export function initializeServices(token: string) {
  const { userServiceAPI } = require('./user-service');
  const { productServiceAPI } = require('./product-service');
  const { orderServiceAPI } = require('./order-service');
  const { paymentServiceAPI } = require('./payment-service');

  userServiceAPI.setToken(token);
  productServiceAPI.setToken(token);
  orderServiceAPI.setToken(token);
  paymentServiceAPI.setToken(token);
}

// Health check all services
export async function healthCheckAllServices() {
  const { userServiceAPI } = require('./user-service');
  const { productServiceAPI } = require('./product-service');
  const { orderServiceAPI } = require('./order-service');
  const { paymentServiceAPI } = require('./payment-service');

  const results = await Promise.allSettled([
    userServiceAPI.healthCheck(),
    productServiceAPI.healthCheck(),
    orderServiceAPI.healthCheck(),
    paymentServiceAPI.healthCheck(),
  ]);

  return {
    userService: results[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    productService: results[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    orderService: results[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    paymentService: results[3].status === 'fulfilled' ? 'healthy' : 'unhealthy',
  };
}
