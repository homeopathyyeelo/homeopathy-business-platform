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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const shared_db_1 = require("@yeelo/shared-db");
const redis_service_1 = require("../redis/redis.service");
const outbox_service_1 = require("../outbox/outbox.service");
const shared_kafka_1 = require("@yeelo/shared-kafka");
let OrdersService = class OrdersService {
    constructor(redisService, outboxService) {
        this.redisService = redisService;
        this.outboxService = outboxService;
    }
    async createOrder(createOrderDto) {
        const { idempotencyKey, items, ...orderData } = createOrderDto;
        if (idempotencyKey) {
            const existingResponse = await this.redisService.getIdempotentResponse(idempotencyKey);
            if (existingResponse) {
                return existingResponse;
            }
        }
        const customer = await shared_db_1.prisma.customer.findUnique({
            where: { id: orderData.customerId },
        });
        if (!customer) {
            throw new common_1.BadRequestException("Customer not found");
        }
        const shop = await shared_db_1.prisma.shop.findUnique({
            where: { id: orderData.shopId },
        });
        if (!shop) {
            throw new common_1.BadRequestException("Shop not found");
        }
        let totalAmount = 0;
        const validatedItems = [];
        for (const item of items) {
            const product = await shared_db_1.prisma.product.findUnique({
                where: { id: item.productId },
                include: { inventory: { where: { shopId: orderData.shopId } } },
            });
            if (!product) {
                throw new common_1.BadRequestException(`Product ${item.productId} not found`);
            }
            if (!product.isActive) {
                throw new common_1.BadRequestException(`Product ${product.name} is not active`);
            }
            const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            if (totalStock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Available: ${totalStock}`);
            }
            validatedItems.push({ productId: item.productId, quantity: item.quantity, price: item.price });
            totalAmount += item.price * item.quantity;
        }
        const result = await shared_db_1.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    ...orderData,
                    totalAmount,
                    orderItems: {
                        create: items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
                    },
                },
                include: { orderItems: { include: { product: true } }, customer: true, shop: true },
            });
            for (const item of validatedItems) {
                await this.updateInventory(tx, item.productId, orderData.shopId, item.quantity);
            }
            await this.outboxService.createEvent(tx, {
                eventType: "order.created",
                aggregateId: order.id,
                payload: {
                    orderId: order.id,
                    customerId: order.customerId,
                    customerName: order.customer.name,
                    customerPhone: order.customer.phone,
                    totalAmount: order.totalAmount,
                    items: order.orderItems.map((item) => ({ productName: item.product.name, quantity: item.quantity, price: item.price })),
                },
            });
            return order;
        });
        try {
            await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.ORDERS, (0, shared_kafka_1.createOrderEvent)("order.created", {
                orderId: result.id,
                customerId: result.customerId,
                shopId: result.shopId,
                status: result.status,
                totalAmount: Number(result.totalAmount),
                items: result.orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) })),
            }), result.id);
        }
        catch (err) {
            console.error("[OrdersService] Kafka publish failed:", err);
        }
        if (idempotencyKey) {
            await this.redisService.setIdempotentResponse(idempotencyKey, result, 3600);
        }
        return result;
    }
    async updateInventory(tx, productId, shopId, quantityToDeduct) {
        const inventoryRecords = await tx.inventory.findMany({
            where: { productId, shopId, quantity: { gt: 0 } },
            orderBy: { expiryDate: "asc" },
        });
        let remainingToDeduct = quantityToDeduct;
        for (const record of inventoryRecords) {
            if (remainingToDeduct <= 0)
                break;
            const deductFromThis = Math.min(record.quantity, remainingToDeduct);
            await tx.inventory.update({ where: { id: record.id }, data: { quantity: record.quantity - deductFromThis } });
            remainingToDeduct -= deductFromThis;
        }
        if (remainingToDeduct > 0) {
            throw new common_1.ConflictException("Insufficient inventory to fulfill order");
        }
    }
    async getOrder(id) {
        const order = await shared_db_1.prisma.order.findUnique({
            where: { id },
            include: { orderItems: { include: { product: true } }, customer: true, shop: true, user: true },
        });
        if (!order) {
            throw new common_1.BadRequestException("Order not found");
        }
        return order;
    }
    async getOrders(shopId, customerId, page = 1, limit = 20) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (customerId)
            where.customerId = customerId;
        const [orders, total] = await Promise.all([
            shared_db_1.prisma.order.findMany({
                where,
                include: { orderItems: { include: { product: true } }, customer: true, shop: true },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            shared_db_1.prisma.order.count({ where }),
        ]);
        return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async updateOrderStatus(id, status, userId) {
        const order = await shared_db_1.prisma.order.update({
            where: { id },
            data: { status: status },
            include: { customer: true, orderItems: { include: { product: true } } },
        });
        await this.outboxService.createEvent(shared_db_1.prisma, {
            eventType: "order.status_updated",
            aggregateId: order.id,
            payload: {
                orderId: order.id,
                customerId: order.customerId,
                customerName: order.customer.name,
                customerPhone: order.customer.phone,
                status,
                previousStatus: status,
            },
        });
        try {
            await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.ORDERS, (0, shared_kafka_1.createOrderEvent)("order.updated", {
                orderId: order.id,
                customerId: order.customerId,
                shopId: order.shopId,
                status: status,
                totalAmount: Number(order.totalAmount),
                items: order.orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) })),
            }), order.id);
        }
        catch (err) {
            console.error("[OrdersService] Kafka publish failed:", err);
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        outbox_service_1.OutboxService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map