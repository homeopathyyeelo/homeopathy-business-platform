import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"

// Coupon schemas (match Prisma Coupon)
const CreateCouponSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().min(0),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
})

const UpdateCouponSchema = CreateCouponSchema.partial()

export async function couponsRoutes(fastify: FastifyInstance) {
  // Get all coupons
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const coupons = await fastify.prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
      })
      return { coupons }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch coupons" })
    }
  })

  // Get coupon by ID
  fastify.get("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const coupon = await fastify.prisma.coupon.findUnique({
        where: { id: request.params.id },
      })

      if (!coupon) {
        return reply.status(404).send({ error: "Coupon not found" })
      }

      return { coupon }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch coupon" })
    }
  })

  // Create new coupon
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateCouponSchema.parse(request.body)
      
      const coupon = await fastify.prisma.coupon.create({
        data: {
          code: data.code.toUpperCase(),
          type: data.type as any,
          value: data.value,
          minAmount: data.minAmount ?? null,
          maxDiscount: data.maxDiscount ?? null,
          usageLimit: data.usageLimit ?? null,
          validFrom: new Date(data.validFrom),
          validUntil: new Date(data.validUntil),
          isActive: data.isActive,
        }
      })

      return { coupon }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Invalid coupon data" })
    }
  })

  // Update coupon
  fastify.put("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = UpdateCouponSchema.parse(request.body)

      const mapped: any = { ...data }
      if (mapped.validFrom) mapped.validFrom = new Date(mapped.validFrom)
      if (mapped.validUntil) mapped.validUntil = new Date(mapped.validUntil)
      if (mapped.code) mapped.code = mapped.code.toUpperCase()
      if (mapped.minAmount === undefined && mapped.minimumAmount !== undefined) {
        mapped.minAmount = mapped.minimumAmount
        delete mapped.minimumAmount
      }
      if (mapped.maxDiscount === undefined && mapped.maximumDiscount !== undefined) {
        mapped.maxDiscount = mapped.maximumDiscount
        delete mapped.maximumDiscount
      }

      const coupon = await fastify.prisma.coupon.update({
        where: { id: request.params.id },
        data: mapped,
      })

      return { coupon }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Failed to update coupon" })
    }
  })

  // Delete coupon
  fastify.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await fastify.prisma.coupon.delete({
        where: { id: request.params.id }
      })

      return { message: "Coupon deleted successfully" }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to delete coupon" })
    }
  })

  // Validate coupon
  fastify.post("/validate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, amount } = request.body as { code: string; amount: number }
      
      const coupon = await fastify.prisma.coupon.findFirst({
        where: {
          code,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
          ...(amount ? { minAmount: { lte: amount } } : {})
        }
      })

      if (!coupon) {
        return reply.status(404).send({ error: "Invalid or expired coupon" })
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return reply.status(400).send({ error: "Coupon usage limit exceeded" })
      }

      return { coupon, valid: true }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to validate coupon" })
    }
  })
}