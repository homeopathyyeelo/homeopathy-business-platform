import type { FastifyInstance } from "fastify";
import type { CampaignType } from "@yeelo/shared-db";
interface CreateTemplateDto {
    name: string;
    type: CampaignType;
    content: string;
    variables?: any;
}
interface UpdateTemplateDto {
    name?: string;
    content?: string;
    variables?: any;
    isActive?: boolean;
}
interface GetTemplatesQuery {
    type?: string;
    active?: boolean;
}
export declare class TemplateService {
    createTemplate(fastify: FastifyInstance, data: CreateTemplateDto): Promise<{
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
    }>;
    getTemplates(fastify: FastifyInstance, query: GetTemplatesQuery): Promise<{
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
    }[]>;
    getTemplate(fastify: FastifyInstance, id: string): Promise<{
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
    }>;
    updateTemplate(fastify: FastifyInstance, id: string, data: UpdateTemplateDto): Promise<{
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
    }>;
    deleteTemplate(fastify: FastifyInstance, id: string): Promise<void>;
}
export {};
