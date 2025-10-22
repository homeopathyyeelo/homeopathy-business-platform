import type { FastifyInstance } from "fastify"
import { CouponType } from "@yeelo/shared-db"

interface CreateCouponDto {
  code: string
  type: CouponType
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  validFrom: string
  validUntil: string
}

interface ApplyCouponDto {
  code: string
  orderAmount: number
  customerId?: string
}

interface GetCouponsQuery {
  active?: boolean
  page?: number
  limit?: number
}

export class CouponService {
  async createCoupon(fastify: FastifyInstance, data: CreateCouponDto) {
    // Check if coupon code already exists
    const existingCoupon = await fastify.prisma.coupon.findUnique({
      where: { code: data.code },
    })

    if (existingCoupon) {
      throw new Error("Coupon code already exists")
    }

    const coupon = await fastify.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minAmount: data.minAmount || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        isActive: true,
      },
    })

    return coupon
  }

  async validateCoupon(fastify: FastifyInstance, code: string, orderAmount?: number) {
    const coupon = await fastify.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return { valid: false, error: "Coupon not found" }
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" }
    }

    const now = new Date()
    if (now < coupon.validFrom) {
      return { valid: false, error: "Coupon is not yet valid" }
    }

    if (now > coupon.validUntil) {
      return { valid: false, error: "Coupon has expired" }
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit exceeded" }
    }

    if (orderAmount && coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
      return {
        valid: false,
        error: `Minimum order amount of ${Number(coupon.minAmount)} required`,
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (orderAmount) {
      if (coupon.type === CouponType.PERCENTAGE) {
        const value = Number(coupon.value)
        discountAmount = (orderAmount * value) / 100
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount)
        }
      } else {
        discountAmount = Number(coupon.value)
      }
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
      },
    }
  }

  async applyCoupon(fastify: FastifyInstance, data: ApplyCouponDto) {
    const validation = await this.validateCoupon(fastify, data.code, data.orderAmount)

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Increment usage count
    const coupon = await fastify.prisma.coupon.update({
      where: { code: data.code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    })

    // Create audit log for coupon usage
    await fastify.prisma.event.create({
      data: {
        type: "coupon.applied",
        entityType: "coupon",
        entityId: coupon.id,
        metadata: {
          code: coupon.code,
          orderAmount: data.orderAmount,
          discountAmount: validation.coupon?.discountAmount,
          customerId: data.customerId,
        },
      },
    })

    return {
      success: true,
      coupon: validation.coupon,
      discountAmount: validation.coupon?.discountAmount || 0,
    }
  }

  async getCoupons(fastify: FastifyInstance, query: GetCouponsQuery) {
    const { active, page = 1, limit = 20 } = query

    const where: any = {}
    if (active !== undefined) where.isActive = active

    const [coupons, total] = await Promise.all([
      fastify.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      fastify.prisma.coupon.count({ where }),
    ])

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
}
