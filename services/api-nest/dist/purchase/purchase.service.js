"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseService = void 0;
const common_1 = require("@nestjs/common");
const shared_db_1 = require("@yeelo/shared-db");
const outbox_service_1 = require("../outbox/outbox.service");
const shared_kafka_1 = require("@yeelo/shared-kafka");
let PurchaseService = class PurchaseService {
    constructor(outboxService) {
        this.outboxService = outboxService;
    }
    async createVendor(createVendorDto) {
        const vendor = await shared_db_1.prisma.vendor.create({
            data: createVendorDto,
        });
        await this.outboxService.createEvent(shared_db_1.prisma, {
            eventType: "vendor.created",
            aggregateId: vendor.id,
            payload: {
                vendorId: vendor.id,
                name: vendor.name,
                contactPerson: vendor.contactPerson,
                phone: vendor.phone,
            },
        });
        return vendor;
    }
    async getVendors(page = 1, limit = 20) {
        const [vendors, total] = await Promise.all([
            shared_db_1.prisma.vendor.findMany({
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            shared_db_1.prisma.vendor.count(),
        ]);
        return { vendors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async getVendor(id) {
        const vendor = await shared_db_1.prisma.vendor.findUnique({
            where: { id },
            include: {
                purchaseOrders: {
                    include: { items: { include: { product: true } } },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        if (!vendor) {
            throw new common_1.NotFoundException("Vendor not found");
        }
        return vendor;
    }
    async updateVendor(id, updateData) {
        const vendor = await shared_db_1.prisma.vendor.update({
            where: { id },
            data: updateData,
        });
        await this.outboxService.createEvent(shared_db_1.prisma, {
            eventType: "vendor.updated",
            aggregateId: vendor.id,
            payload: {
                vendorId: vendor.id,
                name: vendor.name,
                changes: updateData,
            },
        });
        return vendor;
    }
    async createPurchaseOrder(createPurchaseOrderDto) {
        const { vendorId, shopId, items, ...orderData } = createPurchaseOrderDto;
        const vendor = await shared_db_1.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) {
            throw new common_1.BadRequestException("Vendor not found");
        }
        const shop = await shared_db_1.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop) {
            throw new common_1.BadRequestException("Shop not found");
        }
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const result = await shared_db_1.prisma.$transaction(async (tx) => {
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    ...orderData,
                    poNumber,
                    vendor: { connect: { id: vendorId } },
                    shop: { connect: { id: shopId } },
                    totalAmount,
                    status: "PENDING",
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            batchNo: item.batchNo,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    vendor: true,
                    shop: true,
                },
            });
            await this.outboxService.createEvent(tx, {
                eventType: "purchase_order.created",
                aggregateId: purchaseOrder.id,
                payload: {
                    purchaseOrderId: purchaseOrder.id,
                    vendorId: purchaseOrder.vendorId,
                    vendorName: purchaseOrder.vendor.name,
                    shopId: purchaseOrder.shopId,
                    totalAmount: Number(purchaseOrder.totalAmount),
                    items: purchaseOrder.items.map((item) => ({
                        productId: item.productId,
                        productName: item.product.name,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        batchNo: item.batchNo,
                    })),
                },
            });
            return purchaseOrder;
        });
        try {
            await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.PURCHASE_ORDERS, (0, shared_kafka_1.createPurchaseOrderEvent)("purchase_order.created", {
                purchaseOrderId: result.id,
                vendorId: result.vendorId,
                shopId: result.shopId,
                status: result.status,
                totalAmount: Number(result.totalAmount),
                items: result.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: Number(item.unitPrice),
                })),
            }), result.id);
        }
        catch (err) {
            console.error("[PurchaseService] Kafka publish failed:", err);
        }
        return result;
    }
    async getPurchaseOrders(shopId, vendorId, status, page = 1, limit = 20) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (vendorId)
            where.vendorId = vendorId;
        if (status)
            where.status = status;
        const [purchaseOrders, total] = await Promise.all([
            shared_db_1.prisma.purchaseOrder.findMany({
                where,
                include: {
                    items: { include: { product: true } },
                    vendor: true,
                    shop: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            shared_db_1.prisma.purchaseOrder.count({ where }),
        ]);
        return { purchaseOrders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async getPurchaseOrder(id) {
        const purchaseOrder = await shared_db_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                vendor: true,
                shop: true,
            },
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException("Purchase order not found");
        }
        return purchaseOrder;
    }
    async updatePurchaseOrderStatus(id, status) {
        const purchaseOrder = await shared_db_1.prisma.purchaseOrder.update({
            where: { id },
            data: { status: status },
            include: {
                items: { include: { product: true } },
                vendor: true,
                shop: true,
            },
        });
        await this.outboxService.createEvent(shared_db_1.prisma, {
            eventType: "purchase_order.status_updated",
            aggregateId: purchaseOrder.id,
            payload: {
                purchaseOrderId: purchaseOrder.id,
                vendorId: purchaseOrder.vendorId,
                shopId: purchaseOrder.shopId,
                status,
                previousStatus: status,
            },
        });
        return purchaseOrder;
    }
    async createGRN(purchaseOrderId, receivedItems) {
        const purchaseOrder = await shared_db_1.prisma.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            include: { items: { include: { product: true } } },
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException("Purchase order not found");
        }
        const grnNumber = `GRN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const result = await shared_db_1.prisma.$transaction(async (tx) => {
            const grn = await tx.goodsReceiptNote.create({
                data: {
                    grnNumber,
                    purchaseOrderId,
                    status: "RECEIVED",
                    items: {
                        create: receivedItems.map((item) => ({
                            purchaseOrderItem: { connect: { id: item.itemId } },
                            receivedQuantity: item.receivedQuantity,
                            condition: item.condition,
                        })),
                    },
                },
                include: {
                    items: { include: { purchaseOrderItem: { include: { product: true } } } },
                },
            });
            for (const grnItem of grn.items) {
                const { productId, quantity, batchNo, expiryDate } = grnItem.purchaseOrderItem;
                await tx.inventory.upsert({
                    where: { productId_shopId_batchNo: { productId, shopId: purchaseOrder.shopId, batchNo: batchNo || "" } },
                    update: { quantity: { increment: grnItem.receivedQuantity } },
                    create: {
                        productId,
                        shopId: purchaseOrder.shopId,
                        quantity: grnItem.receivedQuantity,
                        batchNo,
                        expiryDate: expiryDate ? new Date(expiryDate) : null,
                    },
                });
            }
            await tx.purchaseOrder.update({
                where: { id: purchaseOrderId },
                data: { status: "RECEIVED" },
            });
            await this.outboxService.createEvent(tx, {
                eventType: "grn.created",
                aggregateId: grn.id,
                payload: {
                    grnId: grn.id,
                    purchaseOrderId,
                    shopId: purchaseOrder.shopId,
                    items: grn.items.map((item) => ({
                        productId: item.purchaseOrderItem.productId,
                        productName: item.purchaseOrderItem.product.name,
                        receivedQuantity: item.receivedQuantity,
                        condition: item.condition,
                    })),
                },
            });
            return grn;
        });
        return result;
    }
    async getPurchaseAnalytics(shopId, dateFrom, dateTo) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const [totalOrders, totalAmount, vendorCount, topVendors, monthlyTrend,] = await Promise.all([
            shared_db_1.prisma.purchaseOrder.count({ where }),
            shared_db_1.prisma.purchaseOrder.aggregate({
                where,
                _sum: { totalAmount: true },
            }),
            shared_db_1.prisma.vendor.count({ where: { isActive: true } }),
            shared_db_1.prisma.purchaseOrder.groupBy({
                by: ["vendorId"],
                where,
                _sum: { totalAmount: true },
                _count: { id: true },
                orderBy: { _sum: { totalAmount: "desc" } },
                take: 5,
            }),
            shared_db_1.prisma.purchaseOrder.groupBy({
                by: ["createdAt"],
                where,
                _sum: { totalAmount: true },
                _count: { id: true },
                orderBy: { createdAt: "asc" },
            }),
        ]);
        return {
            totalOrders,
            totalAmount: Number(totalAmount._sum.totalAmount || 0),
            vendorCount,
            topVendors,
            monthlyTrend,
        };
    }
};
exports.PurchaseService = PurchaseService;
exports.PurchaseService = PurchaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbox_service_1.OutboxService])
], PurchaseService);
//# sourceMappingURL=purchase.service.js.map