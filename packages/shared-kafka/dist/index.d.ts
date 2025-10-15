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
import { Kafka } from "kafkajs";
export declare const kafka: Kafka;
export interface BaseEvent {
    id: string;
    timestamp: string;
    version: string;
    source: string;
}
export interface OrderEvent extends BaseEvent {
    type: "order.created" | "order.updated" | "order.cancelled" | "order.completed";
    data: {
        orderId: string;
        customerId: string;
        shopId: string;
        status: string;
        totalAmount: number;
        items: Array<{
            productId: string;
            quantity: number;
            price: number;
        }>;
    };
}
export interface CampaignEvent extends BaseEvent {
    type: "campaign.created" | "campaign.launched" | "campaign.completed" | "campaign.failed";
    data: {
        campaignId: string;
        shopId: string;
        channel: "whatsapp" | "sms" | "email";
        targetCount: number;
        status: string;
    };
}
export interface InventoryEvent extends BaseEvent {
    type: "inventory.updated" | "inventory.low_stock" | "inventory.out_of_stock";
    data: {
        productId: string;
        shopId: string;
        currentStock: number;
        reorderPoint: number;
        lastUpdated: string;
    };
}
export interface AIEvent extends BaseEvent {
    type: "ai.request" | "ai.response" | "ai.error";
    data: {
        requestId: string;
        userId: string;
        promptType: string;
        tokensUsed?: number;
        cost?: number;
        duration?: number;
    };
}
export interface PurchaseOrderEvent extends BaseEvent {
    type: "purchase_order.created" | "purchase_order.updated" | "purchase_order.status_updated";
    data: {
        purchaseOrderId: string;
        vendorId: string;
        shopId: string;
        status: string;
        totalAmount: number;
        items: Array<{
            productId: string;
            quantity: number;
            price: number;
        }>;
    };
}
export type PlatformEvent = OrderEvent | CampaignEvent | InventoryEvent | AIEvent | PurchaseOrderEvent;
export declare const TOPICS: {
    readonly ORDERS: "orders";
    readonly CAMPAIGNS: "campaigns";
    readonly INVENTORY: "inventory";
    readonly AI_REQUESTS: "ai-requests";
    readonly ANALYTICS: "analytics";
    readonly NOTIFICATIONS: "notifications";
    readonly PURCHASE_ORDERS: "purchase-orders";
};
export declare class EventProducer {
    private producer;
    private isConnected;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publishEvent(topic: string, event: PlatformEvent, key?: string): Promise<void>;
    publishBatch(topic: string, events: PlatformEvent[]): Promise<void>;
}
export declare class EventConsumer {
    private consumer;
    private isConnected;
    constructor(groupId: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(topics: string[]): Promise<void>;
    startConsuming(messageHandler: (event: PlatformEvent, metadata: {
        topic: string;
        partition: number;
        offset: string;
    }) => Promise<void>): Promise<void>;
}
export declare const createOrderEvent: (type: OrderEvent["type"], data: OrderEvent["data"], source?: string) => OrderEvent;
export declare const createCampaignEvent: (type: CampaignEvent["type"], data: CampaignEvent["data"], source?: string) => CampaignEvent;
export declare const createInventoryEvent: (type: InventoryEvent["type"], data: InventoryEvent["data"], source?: string) => InventoryEvent;
export declare const createAIEvent: (type: AIEvent["type"], data: AIEvent["data"], source?: string) => AIEvent;
export declare const createPurchaseOrderEvent: (type: PurchaseOrderEvent["type"], data: PurchaseOrderEvent["data"], source?: string) => PurchaseOrderEvent;
export declare const eventProducer: EventProducer;
export declare const createEventConsumer: (groupId: string) => EventConsumer;
export declare const setupGracefulShutdown: (consumers: EventConsumer[], producer?: EventProducer) => void;
