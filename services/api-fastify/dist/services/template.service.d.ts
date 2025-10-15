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
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTemplates(fastify: FastifyInstance, query: GetTemplatesQuery): Promise<{
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTemplate(fastify: FastifyInstance, id: string): Promise<{
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTemplate(fastify: FastifyInstance, id: string, data: UpdateTemplateDto): Promise<{
        id: string;
        name: string;
        type: import("@yeelo/shared-db").$Enums.CampaignType;
        content: string;
        variables: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteTemplate(fastify: FastifyInstance, id: string): Promise<void>;
}
export {};
