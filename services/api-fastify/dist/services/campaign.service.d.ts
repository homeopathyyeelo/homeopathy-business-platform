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
                name: string;
                type: import("@yeelo/shared-db").$Enums.CampaignType;
                content: string;
                variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            status: import("@yeelo/shared-db").$Enums.CampaignStatus;
            content: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date | null;
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
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            content: string;
            variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        status: import("@yeelo/shared-db").$Enums.CampaignStatus;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date | null;
        targetAudience: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        templateId: string | null;
    }>;
    triggerCampaign(fastify: FastifyInstance, id: string, dryRun?: boolean): Promise<{
        campaignId: string;
        recipientCount: number;
        recipients: {
            name: string;
            id: string;
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
            name: string;
            type: import("@yeelo/shared-db").$Enums.CampaignType;
            content: string;
            variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        status: import("@yeelo/shared-db").$Enums.CampaignStatus;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date | null;
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
