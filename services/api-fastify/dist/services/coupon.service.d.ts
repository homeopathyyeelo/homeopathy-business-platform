import type { FastifyInstance } from "fastify";
import { CouponType } from "@yeelo/shared-db";
interface CreateCouponDto {
    code: string;
    type: CouponType;
    value: number;
    minAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom: string;
    validUntil: string;
}
interface ApplyCouponDto {
    code: string;
    orderAmount: number;
    customerId?: string;
}
interface GetCouponsQuery {
    active?: boolean;
    page?: number;
    limit?: number;
}
export declare class CouponService {
    createCoupon(fastify: FastifyInstance, data: CreateCouponDto): Promise<{
        type: import("@yeelo/shared-db").$Enums.CouponType;
        value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        code: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        minAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        maxDiscount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        usageLimit: number | null;
        validFrom: Date;
        validUntil: Date;
        usedCount: number;
    }>;
    validateCoupon(fastify: FastifyInstance, code: string, orderAmount?: number): Promise<{
        valid: boolean;
        error: string;
        coupon?: undefined;
    } | {
        valid: boolean;
        coupon: {
            id: string;
            code: string;
            type: import("@yeelo/shared-db").$Enums.CouponType;
            value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            discountAmount: number;
        };
        error?: undefined;
    }>;
    applyCoupon(fastify: FastifyInstance, data: ApplyCouponDto): Promise<{
        success: boolean;
        coupon: {
            id: string;
            code: string;
            type: import("@yeelo/shared-db").$Enums.CouponType;
            value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            discountAmount: number;
        };
        discountAmount: number;
    }>;
    getCoupons(fastify: FastifyInstance, query: GetCouponsQuery): Promise<{
        coupons: {
            type: import("@yeelo/shared-db").$Enums.CouponType;
            value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            code: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            minAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            maxDiscount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            usageLimit: number | null;
            validFrom: Date;
            validUntil: Date;
            usedCount: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
export {};
