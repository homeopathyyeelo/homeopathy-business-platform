"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponsRoutes = couponsRoutes;
const zod_1 = require("zod");
const CreateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    type: zod_1.z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: zod_1.z.number().min(0),
    minAmount: zod_1.z.number().min(0).optional(),
    maxDiscount: zod_1.z.number().min(0).optional(),
    usageLimit: zod_1.z.number().min(1).optional(),
    validFrom: zod_1.z.string().datetime(),
    validUntil: zod_1.z.string().datetime(),
    isActive: zod_1.z.boolean().default(true),
});
const UpdateCouponSchema = CreateCouponSchema.partial();
async function couponsRoutes(fastify) {
    fastify.get("/", async (request, reply) => {
        try {
            const coupons = await fastify.prisma.coupon.findMany({
                orderBy: { createdAt: "desc" },
            });
            return { coupons };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch coupons" });
        }
    });
    fastify.get("/:id", async (request, reply) => {
        try {
            const coupon = await fastify.prisma.coupon.findUnique({
                where: { id: request.params.id },
            });
            if (!coupon) {
                return reply.status(404).send({ error: "Coupon not found" });
            }
            return { coupon };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch coupon" });
        }
    });
    fastify.post("/", async (request, reply) => {
        try {
            const data = CreateCouponSchema.parse(request.body);
            const coupon = await fastify.prisma.coupon.create({
                data: {
                    code: data.code.toUpperCase(),
                    type: data.type,
                    value: data.value,
                    minAmount: data.minAmount ?? null,
                    maxDiscount: data.maxDiscount ?? null,
                    usageLimit: data.usageLimit ?? null,
                    validFrom: new Date(data.validFrom),
                    validUntil: new Date(data.validUntil),
                    isActive: data.isActive,
                }
            });
            return { coupon };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Invalid coupon data" });
        }
    });
    fastify.put("/:id", async (request, reply) => {
        try {
            const data = UpdateCouponSchema.parse(request.body);
            const mapped = { ...data };
            if (mapped.validFrom)
                mapped.validFrom = new Date(mapped.validFrom);
            if (mapped.validUntil)
                mapped.validUntil = new Date(mapped.validUntil);
            if (mapped.code)
                mapped.code = mapped.code.toUpperCase();
            if (mapped.minAmount === undefined && mapped.minimumAmount !== undefined) {
                mapped.minAmount = mapped.minimumAmount;
                delete mapped.minimumAmount;
            }
            if (mapped.maxDiscount === undefined && mapped.maximumDiscount !== undefined) {
                mapped.maxDiscount = mapped.maximumDiscount;
                delete mapped.maximumDiscount;
            }
            const coupon = await fastify.prisma.coupon.update({
                where: { id: request.params.id },
                data: mapped,
            });
            return { coupon };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Failed to update coupon" });
        }
    });
    fastify.delete("/:id", async (request, reply) => {
        try {
            await fastify.prisma.coupon.delete({
                where: { id: request.params.id }
            });
            return { message: "Coupon deleted successfully" };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to delete coupon" });
        }
    });
    fastify.post("/validate", async (request, reply) => {
        try {
            const { code, amount } = request.body;
            const coupon = await fastify.prisma.coupon.findFirst({
                where: {
                    code,
                    isActive: true,
                    validFrom: { lte: new Date() },
                    validUntil: { gte: new Date() },
                    ...(amount ? { minAmount: { lte: amount } } : {})
                }
            });
            if (!coupon) {
                return reply.status(404).send({ error: "Invalid or expired coupon" });
            }
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                return reply.status(400).send({ error: "Coupon usage limit exceeded" });
            }
            return { coupon, valid: true };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to validate coupon" });
        }
    });
}
//# sourceMappingURL=coupons.js.map