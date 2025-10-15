import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@yeelo/shared-db'
import { v4 as uuidv4 } from 'uuid'

interface OrderParams {
  id: string
}

interface CreateOrderBody {
  customerId: string
  shopId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  totalAmount: number
  paymentMethod?: string
}

interface UpdateOrderStatusBody {
  status: string
}

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
}

export async function ordersRoutes(fastify: FastifyInstance) {
  // Get all orders
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
  }, async (request: FastifyRequest<{
    Querystring: {
      shopId?: string
      customerId?: string
      page?: number
      limit?: number
    }
  }>, reply: FastifyReply) => {
    try {
      const { shopId, customerId, page = 1, limit = 20 } = request.query
      const where: any = {}
      
      if (shopId) where.shopId = shopId
      if (customerId) where.customerId = customerId

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
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
        prisma.order.count({ where })
      ])

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch orders'
      })
    }
  })

  // Get order by ID
  fastify.get<{ Params: OrderParams }>('/:id', {
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
      const order = await prisma.order.findUnique({
        where: { id: request.params.id },
        include: {
          orderItems: {
            include: { product: true }
          },
          customer: true,
          shop: true,
          user: true
        }
      })

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found'
        })
      }

      return {
        success: true,
        data: order
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch order'
      })
    }
  })

  // Create order
  fastify.post<{ Body: CreateOrderBody }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      
      
      
      body: createOrderSchema
    }
  }, async (request, reply) => {
    try {
      const { items, ...orderData } = request.body

      // Validate customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: orderData.customerId }
      })
      if (!customer) {
        return reply.status(400).send({
          success: false,
          error: 'Customer not found'
        })
      }

      // Validate shop exists
      const shop = await prisma.shop.findUnique({
        where: { id: orderData.shopId }
      })
      if (!shop) {
        return reply.status(400).send({
          success: false,
          error: 'Shop not found'
        })
      }

      // Create order with items
      const order = await prisma.order.create({
        data: {
          id: uuidv4(),
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
      })

      reply.status(201).send({
        success: true,
        data: order,
        message: 'Order created successfully'
      })
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to create order'
      })
    }
  })

  // Update order status
  fastify.put<{ Params: OrderParams; Body: UpdateOrderStatusBody }>('/:id/status', {
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
      const order = await prisma.order.update({
        where: { id: request.params.id },
        data: { status: request.body.status as any },
        include: {
          customer: true,
          orderItems: {
            include: { product: true }
          }
        }
      })

      return {
        success: true,
        data: order,
        message: 'Order status updated successfully'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to update order status'
      })
    }
  })
}
