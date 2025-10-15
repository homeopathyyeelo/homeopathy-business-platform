import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { prisma } from "@yeelo/shared-db"
import { CreateInvoiceDto } from "./dto/create-invoice.dto"
import { OutboxService } from "../outbox/outbox.service"
import { eventProducer, TOPICS } from "@yeelo/shared-kafka"

@Injectable()
export class FinanceService {
  constructor(private readonly outboxService: OutboxService) {}

  // Invoice Management
  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    const { customerId, shopId, orderId, items, ...invoiceData } = createInvoiceDto

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      throw new BadRequestException("Customer not found")
    }

    // Validate shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) {
      throw new BadRequestException("Shop not found")
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const taxAmount = items.reduce((sum, item) => sum + (item.totalAmount * item.taxRate / 100), 0)
    const totalAmount = subtotal + taxAmount

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          ...invoiceData,
          invoiceNumber,
          customer: { connect: { id: customerId } },
          shop: { connect: { id: shopId } },
          ...(orderId ? { order: { connect: { id: orderId } } } : {}),
          subtotal,
          taxAmount,
          totalAmount,
          status: "DRAFT",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              totalAmount: item.totalAmount,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          shop: true,
        },
      })

      await this.outboxService.createEvent(tx, {
        eventType: "invoice.created",
        aggregateId: invoice.id,
        payload: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          customerName: invoice.customer.name,
          shopId: invoice.shopId,
          totalAmount: Number(invoice.totalAmount),
          type: invoice.type,
        },
      })

      return invoice
    })

    // Publish to Kafka (skip for now - no invoice event type defined)
    // TODO: Add InvoiceEvent to shared-kafka

    return result
  }

  async getInvoices(shopId?: string, customerId?: string, status?: string, page = 1, limit = 20) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true,
          shop: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  }

  async getInvoice(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        shop: true,
        payments: true,
      },
    })

    if (!invoice) {
      throw new NotFoundException("Invoice not found")
    }

    return invoice
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: { include: { product: true } },
        customer: true,
        shop: true,
      },
    })

    await this.outboxService.createEvent(prisma, {
      eventType: "invoice.status_updated",
      aggregateId: invoice.id,
      payload: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        shopId: invoice.shopId,
        status,
        totalAmount: Number(invoice.totalAmount),
      },
    })

    return invoice
  }

  // Payment Management
  async recordPayment(invoiceId: string, amount: number, paymentMethod: string, reference?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })

    if (!invoice) {
      throw new NotFoundException("Invoice not found")
    }

    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const remainingAmount = Number(invoice.totalAmount) - totalPaid

    if (amount > remainingAmount) {
      throw new BadRequestException("Payment amount exceeds remaining balance")
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod: paymentMethod as any,
          reference,
          status: "COMPLETED",
        },
      })

      // Update invoice status if fully paid
      const newTotalPaid = totalPaid + amount
      if (newTotalPaid >= Number(invoice.totalAmount)) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID" },
        })
      }

      await this.outboxService.createEvent(tx, {
        eventType: "payment.recorded",
        aggregateId: payment.id,
        payload: {
          paymentId: payment.id,
          invoiceId,
          amount,
          paymentMethod,
          reference,
        },
      })

      return payment
    })

    return result
  }

  // Financial Reports
  async getProfitLossReport(shopId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [
      totalRevenue,
      totalCosts,
      totalTax,
      orderCount,
      avgOrderValue,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { ...where, status: "DELIVERED" },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { ...where, status: "RECEIVED" },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: "PAID" },
        _sum: { taxAmount: true },
      }),
      prisma.order.count({
        where: { ...where, status: "DELIVERED" },
      }),
      prisma.order.aggregate({
        where: { ...where, status: "DELIVERED" },
        _avg: { totalAmount: true },
      }),
    ])

    const revenue = Number(totalRevenue._sum.totalAmount || 0)
    const costs = Number(totalCosts._sum.totalAmount || 0)
    const tax = Number(totalTax._sum.taxAmount || 0)
    const grossProfit = revenue - costs
    const netProfit = grossProfit - tax

    return {
      revenue,
      costs,
      tax,
      grossProfit,
      netProfit,
      orderCount,
      avgOrderValue: Number(avgOrderValue._avg.totalAmount || 0),
      profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    }
  }

  async getCashFlowReport(shopId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [
      cashInflows,
      cashOutflows,
      pendingReceivables,
      pendingPayables,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { ...where, status: "RECEIVED" },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: "SENT" },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { ...where, status: "ORDERED" },
        _sum: { totalAmount: true },
      }),
    ])

    return {
      cashInflows: Number(cashInflows._sum.amount || 0),
      cashOutflows: Number(cashOutflows._sum.totalAmount || 0),
      pendingReceivables: Number(pendingReceivables._sum.totalAmount || 0),
      pendingPayables: Number(pendingPayables._sum.totalAmount || 0),
      netCashFlow: Number(cashInflows._sum.amount || 0) - Number(cashOutflows._sum.totalAmount || 0),
    }
  }

  // GST/VAT Compliance
  async getGSTReport(shopId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {}
    if (shopId) where.shopId = shopId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const gstData = await prisma.invoice.groupBy({
      by: ["shopId"],
      where: { ...where, status: "PAID" },
      _sum: {
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
      },
      _count: { id: true },
    })

    return gstData.map((data) => ({
      shopId: data.shopId,
      totalInvoices: data._count.id,
      taxableAmount: Number(data._sum.subtotal || 0),
      gstAmount: Number(data._sum.taxAmount || 0),
      totalAmount: Number(data._sum.totalAmount || 0),
    }))
  }

  // Multi-currency Support
  async getCurrencyRates() {
    // This would typically fetch from an external API
    return {
      INR: { rate: 1, symbol: "₹" },
      EUR: { rate: 0.011, symbol: "€" },
      USD: { rate: 0.012, symbol: "$" },
    }
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
    const rates = await this.getCurrencyRates()
    const fromRate = rates[fromCurrency]?.rate || 1
    const toRate = rates[toCurrency]?.rate || 1
    
    return (amount / fromRate) * toRate
  }
}
