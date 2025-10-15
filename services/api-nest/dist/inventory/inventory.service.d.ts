export declare class InventoryService {
    getSummary(shopId: string): Promise<{
        productId: string;
        name: string;
        totalStock: number;
        reorderLevel: number;
    }[]>;
    addStock(productId: string, shopId: string, quantity: number, batchNo?: string, expiryDate?: Date): Promise<{
        productId: string;
        quantity: number;
        shopId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        batchNo: string | null;
        expiryDate: Date | null;
        reorderLevel: number;
    }>;
    adjustStock(productId: string, shopId: string, quantityDelta: number, batchNo?: string): Promise<{
        productId: string;
        quantity: number;
        shopId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        batchNo: string | null;
        expiryDate: Date | null;
        reorderLevel: number;
    }>;
    lowStock(shopId: string): Promise<{
        productId: string;
        quantity: number;
        shopId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        batchNo: string | null;
        expiryDate: Date | null;
        reorderLevel: number;
    }[]>;
}
