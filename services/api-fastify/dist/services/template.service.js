"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
class TemplateService {
    async createTemplate(fastify, data) {
        const template = await fastify.prisma.template.create({
            data: {
                name: data.name,
                type: data.type,
                content: data.content,
                variables: data.variables || null,
                isActive: true,
            },
        });
        return template;
    }
    async getTemplates(fastify, query) {
        const where = {};
        if (query.type)
            where.type = query.type;
        if (query.active !== undefined)
            where.isActive = query.active;
        const templates = await fastify.prisma.template.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return templates;
    }
    async getTemplate(fastify, id) {
        const template = await fastify.prisma.template.findUnique({
            where: { id },
        });
        if (!template) {
            throw new Error("Template not found");
        }
        return template;
    }
    async updateTemplate(fastify, id, data) {
        const template = await fastify.prisma.template.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.content && { content: data.content }),
                ...(data.variables !== undefined && { variables: data.variables }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                updatedAt: new Date(),
            },
        });
        return template;
    }
    async deleteTemplate(fastify, id) {
        const campaignCount = await fastify.prisma.campaign.count({
            where: { templateId: id },
        });
        if (campaignCount > 0) {
            throw new Error("Cannot delete template that is being used by campaigns");
        }
        await fastify.prisma.template.delete({
            where: { id },
        });
    }
}
exports.TemplateService = TemplateService;
//# sourceMappingURL=template.service.js.map