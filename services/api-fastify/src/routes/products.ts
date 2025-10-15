import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@yeelo/shared-db'
import { v4 as uuidv4 } from 'uuid'

interface ProductParams {
  id: string
}

interface CreateProductBody {
  name: string
  price: number
  stock: number
  category: string
  description?: string
}

interface UpdateProductBody extends CreateProductBody {}

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
}

export async function productsRoutes(fastify: FastifyInstance) {
  // Get all products
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return {
        success: true,
        data: products,
        count: products.length
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch products'
      })
    }
  })

  // Get product by ID
  fastify.get<{ Params: ProductParams }>('/:id', {
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
      const product = await prisma.product.findUnique({
        where: { id: request.params.id }
      })

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        })
      }

      return {
        success: true,
        data: product
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch product'
      })
    }
  })

  // Create product
  fastify.post<{ Body: CreateProductBody }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: productSchema
    }
  }, async (request, reply) => {
    try {
      const product = await prisma.product.create({
        data: {
          id: uuidv4(),
          ...request.body,
          isActive: true,
          shopId: 'default-shop'
        }
      })

      reply.status(201).send({
        success: true,
        data: product,
        message: 'Product created successfully'
      })
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to create product'
      })
    }
  })

  // Update product
  fastify.put<{ Params: ProductParams; Body: UpdateProductBody }>('/:id', {
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
      const product = await prisma.product.update({
        where: { id: request.params.id },
        data: request.body
      })

      return {
        success: true,
        data: product,
        message: 'Product updated successfully'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to update product'
      })
    }
  })

  // Delete product
  fastify.delete<{ Params: ProductParams }>('/:id', {
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
      await prisma.product.delete({
        where: { id: request.params.id }
      })

      return {
        success: true,
        message: 'Product deleted successfully'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to delete product'
      })
    }
  })
}
