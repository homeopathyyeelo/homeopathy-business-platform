"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
const shared_db_1 = require("@yeelo/shared-db");
class CouponService {
    async createCoupon(fastify, data) {
        const existingCoupon = await fastify.prisma.coupon.findUnique({
            where: { code: data.code },
        });
        if (existingCoupon) {
            throw new Error("Coupon code already exists");
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
        });
        return coupon;
    }
    async validateCoupon(fastify, code, orderAmount) {
        const coupon = await fastify.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!coupon) {
            return { valid: false, error: "Coupon not found" };
        }
        if (!coupon.isActive) {
            return { valid: false, error: "Coupon is not active" };
        }
        const now = new Date();
        if (now < coupon.validFrom) {
            return { valid: false, error: "Coupon is not yet valid" };
        }
        if (now > coupon.validUntil) {
            return { valid: false, error: "Coupon has expired" };
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, error: "Coupon usage limit exceeded" };
        }
        if (orderAmount && coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
            return {
                valid: false,
                error: `Minimum order amount of ₹${Number(coupon.minAmount)} required`,
            };
        }
        let discountAmount = 0;
        if (orderAmount) {
            if (coupon.type === shared_db_1.CouponType.PERCENTAGE) {
                const value = Number(coupon.value);
                discountAmount = (orderAmount * value) / 100;
                if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
                    discountAmount = Number(coupon.maxDiscount);
                }
            }
            else {
                discountAmount = Number(coupon.value);
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
        };
    }
    async applyCoupon(fastify, data) {
        const validation = await this.validateCoupon(fastify, data.code, data.orderAmount);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        const coupon = await fastify.prisma.coupon.update({
            where: { code: data.code.toUpperCase() },
            data: { usedCount: { increment: 1 } },
        });
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
        });
        return {
            success: true,
            coupon: validation.coupon,
            discountAmount: validation.coupon?.discountAmount || 0,
        };
    }
    async getCoupons(fastify, query) {
        const { active, page = 1, limit = 20 } = query;
        const where = {};
        if (active !== undefined)
            where.isActive = active;
        const [coupons, total] = await Promise.all([
            fastify.prisma.coupon.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            fastify.prisma.coupon.count({ where }),
        ]);
        return {
            coupons,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
}
exports.CouponService = CouponService;
//# sourceMappingURL=coupon.service.js.map