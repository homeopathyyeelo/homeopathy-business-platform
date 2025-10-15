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
        id: string;
        type: import("@yeelo/shared-db").$Enums.CouponType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        minAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        maxDiscount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
        usageLimit: number | null;
        usedCount: number;
        validFrom: Date;
        validUntil: Date;
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
            id: string;
            type: import("@yeelo/shared-db").$Enums.CouponType;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            value: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            minAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            maxDiscount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal | null;
            usageLimit: number | null;
            usedCount: number;
            validFrom: Date;
            validUntil: Date;
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
