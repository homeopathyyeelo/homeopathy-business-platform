export declare class InvoiceItemDto {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    totalAmount: number;
}
export declare class CreateInvoiceDto {
    customerId: string;
    shopId: string;
    orderId?: string;
    type: "SALE" | "PURCHASE" | "SERVICE" | "REFUND";
    items: InvoiceItemDto[];
    notes?: string;
    paymentTerms?: string;
    dueDate?: string;
}
