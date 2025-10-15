import { Injectable, BadRequestException, ConflictException } from "@nestjs/common"
import { prisma } from "@yeelo/shared-db"
import { RedisService } from "../redis/redis.service"
import type { CreateOrderDto } from "./dto/create-order.dto"
import { OutboxService } from "../outbox/outbox.service"
import { eventProducer, createOrderEvent, TOPICS } from "@yeelo/shared-kafka"

@Injectable()
export class OrdersService {
  constructor(
    private readonly redisService: RedisService,
    private readonly outboxService: OutboxService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const { idempotencyKey, items, ...orderData } = createOrderDto

    if (idempotencyKey) {
      const existingResponse = await this.redisService.getIdempotentResponse(idempotencyKey)
      if (existingResponse) {
        return existingResponse
      }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: orderData.customerId },
    })
    if (!customer) {
      throw new BadRequestException("Customer not found")
    }

    const shop = await prisma.shop.findUnique({
      where: { id: orderData.shopId },
    })
    if (!shop) {
      throw new BadRequestException("Shop not found")
    }

    let totalAmount = 0
    const validatedItems: Array<{ productId: string; quantity: number; price: number }> = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: { where: { shopId: orderData.shopId } } },
      })

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`)
      }
      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not active`)
      }

      const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
      if (totalStock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${totalStock}`)
      }

      validatedItems.push({ productId: item.productId, quantity: item.quantity, price: item.price })
      totalAmount += item.price * item.quantity
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          totalAmount,
          orderItems: {
            create: items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
          },
        },
        include: { orderItems: { include: { product: true } }, customer: true, shop: true },
      })

      for (const item of validatedItems) {
        await this.updateInventory(tx, item.productId, orderData.shopId, item.quantity)
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
      })

      return order
    })

    // Publish to Kafka (fire-and-forget)
    try {
      await eventProducer.publishEvent(
        TOPICS.ORDERS,
        createOrderEvent("order.created", {
          orderId: result.id,
          customerId: result.customerId,
          shopId: result.shopId,
          status: result.status as unknown as string,
          totalAmount: Number(result.totalAmount),
          items: result.orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) })),
        }),
        result.id,
      )
    } catch (err) {
      // Log but don't fail the request; outbox ensures eventual delivery
      console.error("[OrdersService] Kafka publish failed:", err)
    }

    if (idempotencyKey) {
      await this.redisService.setIdempotentResponse(idempotencyKey, result, 3600)
    }

    return result
  }

  private async updateInventory(tx: any, productId: string, shopId: string, quantityToDeduct: number) {
    const inventoryRecords = await tx.inventory.findMany({
      where: { productId, shopId, quantity: { gt: 0 } },
      orderBy: { expiryDate: "asc" },
    })

    let remainingToDeduct = quantityToDeduct

    for (const record of inventoryRecords) {
      if (remainingToDeduct <= 0) break
      const deductFromThis = Math.min(record.quantity, remainingToDeduct)
      await tx.inventory.update({ where: { id: record.id }, data: { quantity: record.quantity - deductFromThis } })
      remainingToDeduct -= deductFromThis
    }

    if (remainingToDeduct > 0) {
      throw new ConflictException("Insufficient inventory to fulfill order")
    }
  }

  async getOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } }, customer: true, shop: true, user: true },
    })

    if (!order) {
      throw new BadRequestException("Order not found")
    }

    return order
  }

  async getOrders(shopId?: string, customerId?: string, page = 1, limit = 20) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (customerId) where.customerId = customerId

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { orderItems: { include: { product: true } }, customer: true, shop: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  }

  async updateOrderStatus(id: string, status: string, userId?: string) {
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: { customer: true, orderItems: { include: { product: true } } },
    })

    await this.outboxService.createEvent(prisma, {
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
    })

    try {
      await eventProducer.publishEvent(
        TOPICS.ORDERS,
        createOrderEvent("order.updated", {
          orderId: order.id,
          customerId: order.customerId,
          shopId: order.shopId,
          status: status,
          totalAmount: Number(order.totalAmount),
          items: order.orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity, price: Number(i.price) })),
        }),
        order.id,
      )
    } catch (err) {
      console.error("[OrdersService] Kafka publish failed:", err)
    }

    return order
  }
}
