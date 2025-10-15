import { PurchaseService } from "./purchase.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { CreateVendorDto } from "./dto/create-vendor.dto";
export declare class PurchaseController {
    private readonly purchaseService;
    constructor(purchaseService: PurchaseService);
    createVendor(createVendorDto: CreateVendorDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        email: string | null;
        phone: string;
        isActive: boolean;
        address: string | null;
        contactPerson: string;
        gstNumber: string | null;
        creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        paymentTerms: number | null;
    }>;
    getVendors(page?: number, limit?: number): Promise<{
        vendors: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            isActive: boolean;
            address: string | null;
            contactPerson: string;
            gstNumber: string | null;
            creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            paymentTerms: number | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getVendor(id: string): Promise<{
        purchaseOrders: ({
            items: ({
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
                id: string;
                createdAt: Date;
                batchNo: string | null;
                expiryDate: Date | null;
                unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                purchaseOrderId: string;
            })[];
        } & {
            shopId: string;
            notes: string | null;
            id: string;
            status: import("@yeelo/shared-db").$Enums.PurchaseOrderStatus;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            updatedAt: Date;
            vendorId: string;
            expectedDeliveryDate: Date | null;
            poNumber: string;
            createdBy: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        email: string | null;
        phone: string;
        isActive: boolean;
        address: string | null;
        contactPerson: string;
        gstNumber: string | null;
        creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        paymentTerms: number | null;
    }>;
    updateVendor(id: string, updateData: Partial<CreateVendorDto>): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        email: string | null;
        phone: string;
        isActive: boolean;
        address: string | null;
        contactPerson: string;
        gstNumber: string | null;
        creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        paymentTerms: number | null;
    }>;
    createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<{
        items: ({
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
            id: string;
            createdAt: Date;
            batchNo: string | null;
            expiryDate: Date | null;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
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
        vendor: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            isActive: boolean;
            address: string | null;
            contactPerson: string;
            gstNumber: string | null;
            creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            paymentTerms: number | null;
        };
    } & {
        shopId: string;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
        vendorId: string;
        expectedDeliveryDate: Date | null;
        poNumber: string;
        createdBy: string | null;
    }>;
    getPurchaseOrders(shopId?: string, vendorId?: string, status?: string, page?: number, limit?: number): Promise<{
        purchaseOrders: ({
            items: ({
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
                id: string;
                createdAt: Date;
                batchNo: string | null;
                expiryDate: Date | null;
                unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                purchaseOrderId: string;
            })[];
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
            vendor: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string;
                isActive: boolean;
                address: string | null;
                contactPerson: string;
                gstNumber: string | null;
                creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
                paymentTerms: number | null;
            };
        } & {
            shopId: string;
            notes: string | null;
            id: string;
            status: import("@yeelo/shared-db").$Enums.PurchaseOrderStatus;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            updatedAt: Date;
            vendorId: string;
            expectedDeliveryDate: Date | null;
            poNumber: string;
            createdBy: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getPurchaseOrder(id: string): Promise<{
        items: ({
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
            id: string;
            createdAt: Date;
            batchNo: string | null;
            expiryDate: Date | null;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
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
        vendor: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            email: string | null;
            phone: string;
            isActive: boolean;
            address: string | null;
            contactPerson: string;
            gstNumber: string | null;
            creditLimit: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            paymentTerms: number | null;
        };
    } & {
        shopId: string;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
        vendorId: string;
        expectedDeliveryDate: Date | null;
        poNumber: string;
        createdBy: string | null;
    }>;
    updatePurchaseOrderStatus(id: string, body: {
        status: string;
    }): Promise<any>;
    createGRN(body: {
        purchaseOrderId: string;
        receivedItems: Array<{
            itemId: string;
            receivedQuantity: number;
            condition: string;
        }>;
    }): Promise<any>;
    getPurchaseAnalytics(shopId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
}
