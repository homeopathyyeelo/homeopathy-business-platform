import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { OutboxService } from "../outbox/outbox.service";
export declare class PurchaseService {
    private readonly outboxService;
    constructor(outboxService: OutboxService);
    createVendor(createVendorDto: CreateVendorDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        phone: string;
        email: string | null;
        address: string | null;
        isActive: boolean;
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
            phone: string;
            email: string | null;
            address: string | null;
            isActive: boolean;
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
        phone: string;
        email: string | null;
        address: string | null;
        isActive: boolean;
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
        phone: string;
        email: string | null;
        address: string | null;
        isActive: boolean;
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
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        vendor: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            isActive: boolean;
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
                phone: string;
                email: string | null;
                address: string;
                isActive: boolean;
                workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            };
            vendor: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                phone: string;
                email: string | null;
                address: string | null;
                isActive: boolean;
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
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        vendor: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            isActive: boolean;
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
    updatePurchaseOrderStatus(id: string, status: string): Promise<{
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
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        vendor: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            isActive: boolean;
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
    createGRN(purchaseOrderId: string, receivedItems: Array<{
        itemId: string;
        receivedQuantity: number;
        condition: string;
    }>): Promise<{
        items: ({
            purchaseOrderItem: {
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
            };
        } & {
            notes: string | null;
            id: string;
            createdAt: Date;
            receivedQuantity: number;
            condition: import("@yeelo/shared-db").$Enums.GrnItemCondition;
            purchaseOrderItemId: string;
            grnId: string;
        })[];
    } & {
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.GrnStatus;
        createdAt: Date;
        purchaseOrderId: string;
        grnNumber: string;
        receivedBy: string | null;
        receivedAt: Date;
    }>;
    getPurchaseAnalytics(shopId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
        totalOrders: number;
        totalAmount: number;
        vendorCount: number;
        topVendors: (import("@yeelo/shared-db").Prisma.PickEnumerable<import("@yeelo/shared-db").Prisma.PurchaseOrderGroupByOutputType, "vendorId"[]> & {
            _count: {
                id: number;
            };
            _sum: {
                totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            };
        })[];
        monthlyTrend: (import("@yeelo/shared-db").Prisma.PickEnumerable<import("@yeelo/shared-db").Prisma.PurchaseOrderGroupByOutputType, "createdAt"[]> & {
            _count: {
                id: number;
            };
            _sum: {
                totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            };
        })[];
    }>;
}
