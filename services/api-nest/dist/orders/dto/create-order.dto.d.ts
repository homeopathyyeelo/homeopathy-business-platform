import { OrderType, PaymentStatus } from "@yeelo/shared-db";
export declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
    price: number;
}
export declare class CreateOrderDto {
    customerId: string;
    shopId: string;
    userId?: string;
    orderType?: OrderType;
    paymentStatus?: PaymentStatus;
    notes?: string;
    items: CreateOrderItemDto[];
    idempotencyKey?: string;
}
