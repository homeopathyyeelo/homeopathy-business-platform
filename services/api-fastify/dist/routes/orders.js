"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRoutes = ordersRoutes;
const shared_db_1 = require("@yeelo/shared-db");
const uuid_1 = require("uuid");
const createOrderSchema = {
    type: 'object',
    properties: {
        customerId: { type: 'string' },
        shopId: { type: 'string' },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    productId: { type: 'string' },
                    quantity: { type: 'number' },
                    price: { type: 'number' }
                },
                required: ['productId', 'quantity', 'price']
            }
        },
        totalAmount: { type: 'number' },
        paymentMethod: { type: 'string' }
    },
    required: ['customerId', 'shopId', 'items', 'totalAmount']
};
async function ordersRoutes(fastify) {
    fastify.get('/', {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    shopId: { type: 'string' },
                    customerId: { type: 'string' },
                    page: { type: 'number', default: 1 },
                    limit: { type: 'number', default: 20 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { shopId, customerId, page = 1, limit = 20 } = request.query;
            const where = {};
            if (shopId)
                where.shopId = shopId;
            if (customerId)
                where.customerId = customerId;
            const [orders, total] = await Promise.all([
                shared_db_1.prisma.order.findMany({
                    where,
                    include: {
                        orderItems: {
                            include: { product: true }
                        },
                        customer: true,
                        shop: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                shared_db_1.prisma.order.count({ where })
            ]);
            return {
                success: true,
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch orders'
            });
        }
    });
    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, async (request, reply) => {
        try {
            const order = await shared_db_1.prisma.order.findUnique({
                where: { id: request.params.id },
                include: {
                    orderItems: {
                        include: { product: true }
                    },
                    customer: true,
                    shop: true,
                    user: true
                }
            });
            if (!order) {
                return reply.status(404).send({
                    success: false,
                    error: 'Order not found'
                });
            }
            return {
                success: true,
                data: order
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch order'
            });
        }
    });
    fastify.post('/', {
        preHandler: [fastify.authenticate],
        schema: {
            body: createOrderSchema
        }
    }, async (request, reply) => {
        try {
            const { items, ...orderData } = request.body;
            const customer = await shared_db_1.prisma.customer.findUnique({
                where: { id: orderData.customerId }
            });
            if (!customer) {
                return reply.status(400).send({
                    success: false,
                    error: 'Customer not found'
                });
            }
            const shop = await shared_db_1.prisma.shop.findUnique({
                where: { id: orderData.shopId }
            });
            if (!shop) {
                return reply.status(400).send({
                    success: false,
                    error: 'Shop not found'
                });
            }
            const order = await shared_db_1.prisma.order.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    ...orderData,
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    orderItems: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                },
                include: {
                    orderItems: {
                        include: { product: true }
                    },
                    customer: true,
                    shop: true
                }
            });
            reply.status(201).send({
                success: true,
                data: order,
                message: 'Order created successfully'
            });
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to create order'
            });
        }
    });
    fastify.put('/:id/status', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    status: { type: 'string' }
                },
                required: ['status']
            }
        }
    }, async (request, reply) => {
        try {
            const order = await shared_db_1.prisma.order.update({
                where: { id: request.params.id },
                data: { status: request.body.status },
                include: {
                    customer: true,
                    orderItems: {
                        include: { product: true }
                    }
                }
            });
            return {
                success: true,
                data: order,
                message: 'Order status updated successfully'
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to update order status'
            });
        }
    });
}
//# sourceMappingURL=orders.js.map