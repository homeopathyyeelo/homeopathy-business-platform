export declare class CreatePurchaseOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    batchNo?: string;
    expiryDate?: string;
}
export declare class CreatePurchaseOrderDto {
    vendorId: string;
    shopId: string;
    items: CreatePurchaseOrderItemDto[];
    notes?: string;
    expectedDeliveryDate?: string;
}
