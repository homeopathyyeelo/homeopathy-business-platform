import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getSummary(shopId: string): Promise<{
        productId: string;
        name: string;
        totalStock: number;
        reorderLevel: number;
    }[]>;
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
    addStock(body: {
        productId: string;
        shopId: string;
        quantity: number;
        batchNo?: string;
        expiryDate?: string;
    }): Promise<{
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
    adjustStock(body: {
        productId: string;
        shopId: string;
        quantityDelta: number;
        batchNo?: string;
    }): Promise<{
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
}
