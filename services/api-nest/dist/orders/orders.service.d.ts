import { RedisService } from "../redis/redis.service";
import type { CreateOrderDto } from "./dto/create-order.dto";
import { OutboxService } from "../outbox/outbox.service";
export declare class OrdersService {
    private readonly redisService;
    private readonly outboxService;
    constructor(redisService: RedisService, outboxService: OutboxService);
    createOrder(createOrderDto: CreateOrderDto): Promise<any>;
    private updateInventory;
    getOrder(id: string): Promise<{
        user: {
            shopId: string | null;
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string;
            phone: string | null;
            role: import("@yeelo/shared-db").$Enums.UserRole;
            isActive: boolean;
        };
        shop: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            isActive: boolean;
            address: string;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        orderItems: ({
            product: {
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                shopId: string;
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            productId: string;
            quantity: number;
            price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            orderId: string;
        })[];
    } & {
        customerId: string;
        shopId: string;
        userId: string | null;
        orderType: import("@yeelo/shared-db").$Enums.OrderType;
        paymentStatus: import("@yeelo/shared-db").$Enums.PaymentStatus;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.OrderStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
    }>;
    getOrders(shopId?: string, customerId?: string, page?: number, limit?: number): Promise<{
        orders: ({
            shop: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string;
                isActive: boolean;
                address: string;
                workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            };
            customer: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string;
                address: string | null;
                dateOfBirth: Date | null;
                gender: string | null;
                marketingConsent: boolean;
                loyaltyPoints: number;
            };
            orderItems: ({
                product: {
                    price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                    shopId: string;
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    isActive: boolean;
                    description: string | null;
                    imageUrl: string | null;
                    category: string | null;
                };
            } & {
                productId: string;
                quantity: number;
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                id: string;
                createdAt: Date;
                orderId: string;
            })[];
        } & {
            customerId: string;
            shopId: string;
            userId: string | null;
            orderType: import("@yeelo/shared-db").$Enums.OrderType;
            paymentStatus: import("@yeelo/shared-db").$Enums.PaymentStatus;
            notes: string | null;
            id: string;
            status: import("@yeelo/shared-db").$Enums.OrderStatus;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    updateOrderStatus(id: string, status: string, userId?: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        orderItems: ({
            product: {
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                shopId: string;
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            productId: string;
            quantity: number;
            price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            orderId: string;
        })[];
    } & {
        customerId: string;
        shopId: string;
        userId: string | null;
        orderType: import("@yeelo/shared-db").$Enums.OrderType;
        paymentStatus: import("@yeelo/shared-db").$Enums.PaymentStatus;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.OrderStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
    }>;
}
