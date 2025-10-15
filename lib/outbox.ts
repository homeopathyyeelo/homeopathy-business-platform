/**
 * Outbox Pattern Implementation
 * Provides utilities for writing events to the outbox table
 */

import { prisma } from "@yeelo/shared-db"

export interface OutboxEvent {
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: any
}

export class OutboxWriter {
  /**
   * Write an event to the outbox table
   * This should be called within a database transaction
   */
  static async writeEvent(event: OutboxEvent): Promise<void> {
    try {
      await prisma.outbox.create({
        data: {
          aggregate_type: event.aggregate_type,
          aggregate_id: event.aggregate_id,
          event_type: event.event_type,
          payload: event.payload,
          published: false
        }
      })
    } catch (error) {
      console.error('Failed to write outbox event:', error)
      throw error
    }
  }

  /**
   * Write multiple events to the outbox table
   * This should be called within a database transaction
   */
  static async writeEvents(events: OutboxEvent[]): Promise<void> {
    try {
      const outboxData = events.map(event => ({
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        event_type: event.event_type,
        payload: event.payload,
        published: false
      }))

      await prisma.outbox.createMany({
        data: outboxData
      })
    } catch (error) {
      console.error('Failed to write outbox events:', error)
      throw error
    }
  }

  /**
   * Create an order event
   */
  static createOrderEvent(orderId: string, eventType: string, orderData: any): OutboxEvent {
    return {
      aggregate_type: 'order',
      aggregate_id: orderId,
      event_type: eventType,
      payload: orderData
    }
  }

  /**
   * Create an inventory event
   */
  static createInventoryEvent(inventoryId: string, eventType: string, inventoryData: any): OutboxEvent {
    return {
      aggregate_type: 'inventory',
      aggregate_id: inventoryId,
      event_type: eventType,
      payload: inventoryData
    }
  }

  /**
   * Create a campaign event
   */
  static createCampaignEvent(campaignId: string, eventType: string, campaignData: any): OutboxEvent {
    return {
      aggregate_type: 'campaign',
      aggregate_id: campaignId,
      event_type: eventType,
      payload: campaignData
    }
  }

  /**
   * Create a customer event
   */
  static createCustomerEvent(customerId: string, eventType: string, customerData: any): OutboxEvent {
    return {
      aggregate_type: 'customer',
      aggregate_id: customerId,
      event_type: eventType,
      payload: customerData
    }
  }

  /**
   * Create a product event
   */
  static createProductEvent(productId: string, eventType: string, productData: any): OutboxEvent {
    return {
      aggregate_type: 'product',
      aggregate_id: productId,
      event_type: eventType,
      payload: productData
    }
  }

  /**
   * Create a purchase order event
   */
  static createPurchaseOrderEvent(poId: string, eventType: string, poData: any): OutboxEvent {
    return {
      aggregate_type: 'purchase_order',
      aggregate_id: poId,
      event_type: eventType,
      payload: poData
    }
  }

  /**
   * Create an AI event
   */
  static createAIEvent(aiRequestId: string, eventType: string, aiData: any): OutboxEvent {
    return {
      aggregate_type: 'ai_request',
      aggregate_id: aiRequestId,
      event_type: eventType,
      payload: aiData
    }
  }
}

/**
 * Common event types used throughout the system
 */
export const EventTypes = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_COMPLETED: 'order.completed',
  ORDER_PAID: 'order.paid',

  // Inventory events
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_LOW: 'inventory.low',
  INVENTORY_RESTOCKED: 'inventory.restocked',
  INVENTORY_TRANSFERRED: 'inventory.transferred',
  INVENTORY_EXPIRED: 'inventory.expired',

  // Campaign events
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_SCHEDULED: 'campaign.scheduled',
  CAMPAIGN_SENT: 'campaign.sent',
  CAMPAIGN_COMPLETED: 'campaign.completed',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_ACTIVATED: 'customer.activated',
  CUSTOMER_DEACTIVATED: 'customer.deactivated',

  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DISCONTINUED: 'product.discontinued',

  // Purchase order events
  PURCHASE_ORDER_CREATED: 'purchaseorder.created',
  PURCHASE_ORDER_APPROVED: 'purchaseorder.approved',
  PURCHASE_ORDER_RECEIVED: 'purchaseorder.received',
  PURCHASE_ORDER_CANCELLED: 'purchaseorder.cancelled',

  // AI events
  AI_REQUESTED: 'ai.requested',
  AI_COMPLETED: 'ai.completed',
  AI_FAILED: 'ai.failed',
  AI_FORECAST_GENERATED: 'ai.forecast.generated',
  AI_PRICING_GENERATED: 'ai.pricing.generated',
  AI_CONTENT_GENERATED: 'ai.content.generated'
} as const

export type EventType = typeof EventTypes[keyof typeof EventTypes]
