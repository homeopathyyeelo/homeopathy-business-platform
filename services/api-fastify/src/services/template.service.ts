import type { FastifyInstance } from "fastify"
import type { CampaignType } from "@yeelo/shared-db"

interface CreateTemplateDto {
  name: string
  type: CampaignType
  content: string
  variables?: any
}

interface UpdateTemplateDto {
  name?: string
  content?: string
  variables?: any
  isActive?: boolean
}

interface GetTemplatesQuery {
  type?: string
  active?: boolean
}

export class TemplateService {
  async createTemplate(fastify: FastifyInstance, data: CreateTemplateDto) {
    const template = await fastify.prisma.template.create({
      data: {
        name: data.name,
        type: data.type,
        content: data.content,
        variables: data.variables || null,
        isActive: true,
      },
    })

    return template
  }

  async getTemplates(fastify: FastifyInstance, query: GetTemplatesQuery) {
    const where: any = {}
    if (query.type) where.type = query.type
    if (query.active !== undefined) where.isActive = query.active

    const templates = await fastify.prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return templates
  }

  async getTemplate(fastify: FastifyInstance, id: string) {
    const template = await fastify.prisma.template.findUnique({
      where: { id },
    })

    if (!template) {
      throw new Error("Template not found")
    }

    return template
  }

  async updateTemplate(fastify: FastifyInstance, id: string, data: UpdateTemplateDto) {
    const template = await fastify.prisma.template.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.content && { content: data.content }),
        ...(data.variables !== undefined && { variables: data.variables }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    })

    return template
  }

  async deleteTemplate(fastify: FastifyInstance, id: string) {
    // Check if template is being used by any campaigns
    const campaignCount = await fastify.prisma.campaign.count({
      where: { templateId: id },
    })

    if (campaignCount > 0) {
      throw new Error("Cannot delete template that is being used by campaigns")
    }

    await fastify.prisma.template.delete({
      where: { id },
    })
  }
}
