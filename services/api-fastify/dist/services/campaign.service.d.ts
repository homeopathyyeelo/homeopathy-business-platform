import type { FastifyInstance } from "fastify";
import { type CampaignType } from "@yeelo/shared-db";
interface CreateCampaignDto {
    name: string;
    type: CampaignType;
    content: string;
    templateId?: string;
    scheduledAt?: string;
    targetAudience?: any;
    idempotencyKey?: string;
}
interface GetCampaignsQuery {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class CampaignService {
    createCampaign(fastify: FastifyInstance, data: CreateCampaignDto): Promise<any>;
    getCampaigns(fastify: FastifyInstance, query: GetCampaignsQuery): Promise<{
        campaigns: ({
            template: {
                id: string;
                name: string;
                type: import("@yeelo/shared-db").$Enums.CampaignType;
                content: string;
                variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date | null;
            status: import("@yeelo/shared-db").$Enums.CampaignStatus;
            targetAudience: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            templateId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getCampaign(fastify: FastifyInstance, id: string): Promise<{
        template: {
            id: string;
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            content: string;
            variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date | null;
        status: import("@yeelo/shared-db").$Enums.CampaignStatus;
        targetAudience: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        templateId: string | null;
    }>;
    triggerCampaign(fastify: FastifyInstance, id: string, dryRun?: boolean): Promise<{
        campaignId: string;
        recipientCount: number;
        recipients: {
            id: string;
            name: string;
            phone: string;
            email: string;
        }[];
        dryRun: boolean;
        status?: undefined;
    } | {
        campaignId: string;
        recipientCount: number;
        status: string;
        recipients?: undefined;
        dryRun?: undefined;
    }>;
    updateCampaignStatus(fastify: FastifyInstance, id: string, status: string): Promise<{
        template: {
            id: string;
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            content: string;
            variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date | null;
        status: import("@yeelo/shared-db").$Enums.CampaignStatus;
        targetAudience: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        templateId: string | null;
    }>;
    publishCampaignCreated(payload: {
        id: string;
        shopId: string;
        channel: "whatsapp" | "sms" | "email";
        targetCount: number;
    }): Promise<{
        ok: boolean;
    }>;
    publishCampaignLaunched(payload: {
        id: string;
        shopId: string;
        channel: "whatsapp" | "sms" | "email";
        targetCount: number;
    }): Promise<{
        ok: boolean;
    }>;
    publishCampaignCompleted(payload: {
        id: string;
        shopId: string;
        channel: "whatsapp" | "sms" | "email";
        targetCount: number;
    }): Promise<{
        ok: boolean;
    }>;
    private getTargetAudience;
}
export {};
