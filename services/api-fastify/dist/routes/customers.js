"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRoutes = customersRoutes;
const shared_db_1 = require("@yeelo/shared-db");
const uuid_1 = require("uuid");
const customerSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        address: { type: 'string' },
        marketingConsent: { type: 'boolean' }
    },
    required: ['name', 'email', 'phone']
};
async function customersRoutes(fastify) {
    fastify.get('/', {
        preHandler: [fastify.authenticate],
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
            const customers = await shared_db_1.prisma.customer.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            return {
                success: true,
                data: customers,
                count: customers.length
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch customers'
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
            const customer = await shared_db_1.prisma.customer.findUnique({
                where: { id: request.params.id }
            });
            if (!customer) {
                return reply.status(404).send({
                    success: false,
                    error: 'Customer not found'
                });
            }
            return {
                success: true,
                data: customer
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch customer'
            });
        }
    });
    fastify.post('/', {
        preHandler: [fastify.authenticate],
        schema: {
            body: customerSchema
        }
    }, async (request, reply) => {
        try {
            const customer = await shared_db_1.prisma.customer.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    ...request.body,
                    loyaltyPoints: 0
                }
            });
            reply.status(201).send({
                success: true,
                data: customer,
                message: 'Customer created successfully'
            });
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to create customer'
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
            body: customerSchema
        }
    }, async (request, reply) => {
        try {
            const customer = await shared_db_1.prisma.customer.update({
                where: { id: request.params.id },
                data: request.body
            });
            return {
                success: true,
                data: customer,
                message: 'Customer updated successfully'
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to update customer'
            });
        }
    });
}
//# sourceMappingURL=customers.js.map