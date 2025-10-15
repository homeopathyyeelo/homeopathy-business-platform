import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { prisma } from "@yeelo/shared-db"
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto"
import { CreateVendorDto } from "./dto/create-vendor.dto"
import { OutboxService } from "../outbox/outbox.service"
import { eventProducer, createPurchaseOrderEvent, TOPICS } from "@yeelo/shared-kafka"

@Injectable()
export class PurchaseService {
  constructor(private readonly outboxService: OutboxService) {}

  // Vendor Management
  async createVendor(createVendorDto: CreateVendorDto) {
    const vendor = await prisma.vendor.create({
      data: createVendorDto,
    })

    await this.outboxService.createEvent(prisma, {
      eventType: "vendor.created",
      aggregateId: vendor.id,
      payload: {
        vendorId: vendor.id,
        name: vendor.name,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
      },
    })

    return vendor
  }

  async getVendors(page = 1, limit = 20) {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count(),
    ])

    return { vendors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  }

  async getVendor(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!vendor) {
      throw new NotFoundException("Vendor not found")
    }

    return vendor
  }

  async updateVendor(id: string, updateData: Partial<CreateVendorDto>) {
    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    })

    await this.outboxService.createEvent(prisma, {
      eventType: "vendor.updated",
      aggregateId: vendor.id,
      payload: {
        vendorId: vendor.id,
        name: vendor.name,
        changes: updateData,
      },
    })

    return vendor
  }

  // Purchase Order Management
  async createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto) {
    const { vendorId, shopId, items, ...orderData } = createPurchaseOrderDto

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) {
      throw new BadRequestException("Vendor not found")
    }

    // Validate shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) {
      throw new BadRequestException("Shop not found")
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    
    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
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
      })

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
      })

      return purchaseOrder
    })

    // Publish to Kafka
    try {
      await eventProducer.publishEvent(
        TOPICS.PURCHASE_ORDERS,
        createPurchaseOrderEvent("purchase_order.created", {
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
        }),
        result.id,
      )
    } catch (err) {
      console.error("[PurchaseService] Kafka publish failed:", err)
    }

    return result
  }

  async getPurchaseOrders(shopId?: string, vendorId?: string, status?: string, page = 1, limit = 20) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (vendorId) where.vendorId = vendorId
    if (status) where.status = status

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
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
      prisma.purchaseOrder.count({ where }),
    ])

    return { purchaseOrders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  }

  async getPurchaseOrder(id: string) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        vendor: true,
        shop: true,
      },
    })

    if (!purchaseOrder) {
      throw new NotFoundException("Purchase order not found")
    }

    return purchaseOrder
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: { include: { product: true } },
        vendor: true,
        shop: true,
      },
    })

    await this.outboxService.createEvent(prisma, {
      eventType: "purchase_order.status_updated",
      aggregateId: purchaseOrder.id,
      payload: {
        purchaseOrderId: purchaseOrder.id,
        vendorId: purchaseOrder.vendorId,
        shopId: purchaseOrder.shopId,
        status,
        previousStatus: status,
      },
    })

    return purchaseOrder
  }

  // Goods Receipt Note (GRN)
  async createGRN(purchaseOrderId: string, receivedItems: Array<{ itemId: string; receivedQuantity: number; condition: string }>) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: { include: { product: true } } },
    })

    if (!purchaseOrder) {
      throw new NotFoundException("Purchase order not found")
    }
    
    // Generate GRN number
    const grnNumber = `GRN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      // Create GRN
      const grn = await tx.goodsReceiptNote.create({
        data: {
          grnNumber,
          purchaseOrderId,
          status: "RECEIVED",
          items: {
            create: receivedItems.map((item) => ({
              purchaseOrderItem: { connect: { id: item.itemId } },
              receivedQuantity: item.receivedQuantity,
              condition: item.condition as any,
            })),
          },
        },
        include: {
          items: { include: { purchaseOrderItem: { include: { product: true } } } },
        },
      })

      // Update inventory for each received item
      for (const grnItem of grn.items) {
        const { productId, quantity, batchNo, expiryDate } = grnItem.purchaseOrderItem
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
        })
      }

      // Update purchase order status
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "RECEIVED" },
      })

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
      })

      return grn
    })

    return result
  }

  // Purchase Analytics
  async getPurchaseAnalytics(shopId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [
      totalOrders,
      totalAmount,
      vendorCount,
      topVendors,
      monthlyTrend,
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.purchaseOrder.groupBy({
        by: ["vendorId"],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),
      prisma.purchaseOrder.groupBy({
        by: ["createdAt"],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { createdAt: "asc" },
      }),
    ])

    return {
      totalOrders,
      totalAmount: Number(totalAmount._sum.totalAmount || 0),
      vendorCount,
      topVendors,
      monthlyTrend,
    }
  }
}
