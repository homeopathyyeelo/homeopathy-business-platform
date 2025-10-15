import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@yeelo/shared-db'
import { v4 as uuidv4 } from 'uuid'

interface CustomerParams {
  id: string
}

interface CreateCustomerBody {
  name: string
  email: string
  phone: string
  address?: string
  marketingConsent?: boolean
}

interface UpdateCustomerBody extends CreateCustomerBody {}

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
}

export async function customersRoutes(fastify: FastifyInstance) {
  // Get all customers
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return {
        success: true,
        data: customers,
        count: customers.length
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch customers'
      })
    }
  })

  // Get customer by ID
  fastify.get<{ Params: CustomerParams }>('/:id', {
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
      const customer = await prisma.customer.findUnique({
        where: { id: request.params.id }
      })

      if (!customer) {
        return reply.status(404).send({
          success: false,
          error: 'Customer not found'
        })
      }

      return {
        success: true,
        data: customer
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch customer'
      })
    }
  })

  // Create customer
  fastify.post<{ Body: CreateCustomerBody }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      
      
      
      body: customerSchema
    }
  }, async (request, reply) => {
    try {
      const customer = await prisma.customer.create({
        data: {
          id: uuidv4(),
          ...request.body,
          loyaltyPoints: 0
        }
      })

      reply.status(201).send({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      })
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to create customer'
      })
    }
  })

  // Update customer
  fastify.put<{ Params: CustomerParams; Body: UpdateCustomerBody }>('/:id', {
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
      const customer = await prisma.customer.update({
        where: { id: request.params.id },
        data: request.body
      })

      return {
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to update customer'
      })
    }
  })
}
