"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = productsRoutes;
const shared_db_1 = require("@yeelo/shared-db");
const uuid_1 = require("uuid");
const productSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        category: { type: 'string' },
        description: { type: 'string' }
    },
    required: ['name', 'price', 'stock', 'category']
};
async function productsRoutes(fastify) {
    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array' },
                        count: { type: 'number' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const products = await shared_db_1.prisma.product.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            return {
                success: true,
                data: products,
                count: products.length
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch products'
            });
        }
    });
    fastify.get('/:id', {
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
            const product = await shared_db_1.prisma.product.findUnique({
                where: { id: request.params.id }
            });
            if (!product) {
                return reply.status(404).send({
                    success: false,
                    error: 'Product not found'
                });
            }
            return {
                success: true,
                data: product
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch product'
            });
        }
    });
    fastify.post('/', {
        preHandler: [fastify.authenticate],
        schema: {
            body: productSchema
        }
    }, async (request, reply) => {
        try {
            const product = await shared_db_1.prisma.product.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    ...request.body,
                    isActive: true,
                    shopId: 'default-shop'
                }
            });
            reply.status(201).send({
                success: true,
                data: product,
                message: 'Product created successfully'
            });
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to create product'
            });
        }
    });
    fastify.put('/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            },
            body: productSchema
        }
    }, async (request, reply) => {
        try {
            const product = await shared_db_1.prisma.product.update({
                where: { id: request.params.id },
                data: request.body
            });
            return {
                success: true,
                data: product,
                message: 'Product updated successfully'
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to update product'
            });
        }
    });
    fastify.delete('/:id', {
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
            await shared_db_1.prisma.product.delete({
                where: { id: request.params.id }
            });
            return {
                success: true,
                message: 'Product deleted successfully'
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to delete product'
            });
        }
    });
}
//# sourceMappingURL=products.js.map