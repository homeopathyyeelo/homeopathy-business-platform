import type { FastifyInstance } from "fastify"
import { type CampaignType, CampaignStatus } from "@yeelo/shared-db"
import { eventProducer, createCampaignEvent, TOPICS } from "@yeelo/shared-kafka"

interface CreateCampaignDto {
  name: string
  type: CampaignType
  content: string
  templateId?: string
  scheduledAt?: string
  targetAudience?: any
  idempotencyKey?: string
}

interface GetCampaignsQuery {
  type?: string
  status?: string
  page?: number
  limit?: number
}

export class CampaignService {
  async createCampaign(fastify: FastifyInstance, data: CreateCampaignDto) {
    const { idempotencyKey, ...campaignData } = data

    // Handle idempotency
    if (idempotencyKey) {
      const existingResponse = await fastify.redis.get(`idempotency:${idempotencyKey}`)
      if (existingResponse) {
        return JSON.parse(existingResponse)
      }
    }

    // Validate template if provided
    if (campaignData.templateId) {
      const template = await fastify.prisma.template.findUnique({
        where: { id: campaignData.templateId },
      })
      if (!template) {
        throw new Error("Template not found")
      }
      if (template.type !== campaignData.type) {
        throw new Error("Template type does not match campaign type")
      }
    }

    // Create campaign with outbox event in transaction
    const result = await fastify.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          ...campaignData,
          scheduledAt: campaignData.scheduledAt ? new Date(campaignData.scheduledAt) : null,
          status: campaignData.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        },
        include: {
          template: true,
        },
      })

      // Create outbox event
      await tx.outbox.create({
        data: {
          eventType: "campaign.created",
          aggregateId: campaign.id,
          payload: {
            campaignId: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            targetAudience: campaign.targetAudience,
          },
          status: "PENDING",
        },
      })

      return campaign
    })

    // Store idempotent response
    if (idempotencyKey) {
      await fastify.redis.setex(`idempotency:${idempotencyKey}`, 3600, JSON.stringify(result))
    }

    return result
  }

  async getCampaigns(fastify: FastifyInstance, query: GetCampaignsQuery) {
    const { type, status, page = 1, limit = 20 } = query

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    const [campaigns, total] = await Promise.all([
      fastify.prisma.campaign.findMany({
        where,
        include: {
          template: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      fastify.prisma.campaign.count({ where }),
    ])

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getCampaign(fastify: FastifyInstance, id: string) {
    const campaign = await fastify.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
      },
    })

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    return campaign
  }

  async triggerCampaign(fastify: FastifyInstance, id: string, dryRun = false) {
    const campaign = await fastify.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
      },
    })

    if (!campaign) {
      throw new Error("Campaign not found")
    }

    // Get target audience based on campaign criteria
    const recipients = await this.getTargetAudience(fastify, campaign.targetAudience)

    if (dryRun) {
      return {
        campaignId: id,
        recipientCount: recipients.length,
        recipients: recipients.slice(0, 10), // Preview first 10
        dryRun: true,
      }
    }

    // Update campaign status and create outbox event
    await fastify.prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: { status: CampaignStatus.SENDING },
      })

      // Create outbox event for campaign execution
      await tx.outbox.create({
        data: {
          eventType: "campaign.triggered",
          aggregateId: id,
          payload: {
            campaignId: id,
            name: campaign.name,
            type: campaign.type,
            content: campaign.content,
            recipients: recipients.map((r) => ({
              customerId: r.id,
              phone: r.phone,
              name: r.name,
            })),
          },
          status: "PENDING",
        },
      })
    })

    return {
      campaignId: id,
      recipientCount: recipients.length,
      status: "triggered",
    }
  }

  async updateCampaignStatus(fastify: FastifyInstance, id: string, status: string) {
    const campaign = await fastify.prisma.campaign.update({
      where: { id },
      data: { status: status as CampaignStatus },
      include: {
        template: true,
      },
    })

    // Create outbox event for status update
    await fastify.prisma.outbox.create({
      data: {
        eventType: "campaign.status_updated",
        aggregateId: id,
        payload: {
          campaignId: id,
          status,
          updatedAt: new Date(),
        },
        status: "PENDING",
      },
    })

    return campaign
  }

  async publishCampaignCreated(payload: { id: string; shopId: string; channel: "whatsapp" | "sms" | "email"; targetCount: number }) {
    const event = createCampaignEvent("campaign.created", {
      campaignId: payload.id,
      shopId: payload.shopId,
      channel: payload.channel,
      targetCount: payload.targetCount,
      status: "created",
    })
    await eventProducer.publishEvent(TOPICS.CAMPAIGNS, event, payload.id)
    return { ok: true }
  }

  async publishCampaignLaunched(payload: { id: string; shopId: string; channel: "whatsapp" | "sms" | "email"; targetCount: number }) {
    const event = createCampaignEvent("campaign.launched", {
      campaignId: payload.id,
      shopId: payload.shopId,
      channel: payload.channel,
      targetCount: payload.targetCount,
      status: "launched",
    })
    await eventProducer.publishEvent(TOPICS.CAMPAIGNS, event, payload.id)
    return { ok: true }
  }

  async publishCampaignCompleted(payload: { id: string; shopId: string; channel: "whatsapp" | "sms" | "email"; targetCount: number }) {
    const event = createCampaignEvent("campaign.completed", {
      campaignId: payload.id,
      shopId: payload.shopId,
      channel: payload.channel,
      targetCount: payload.targetCount,
      status: "completed",
    })
    await eventProducer.publishEvent(TOPICS.CAMPAIGNS, event, payload.id)
    return { ok: true }
  }

  private async getTargetAudience(fastify: FastifyInstance, criteria: any) {
    // Default to all customers with marketing consent if no criteria
    if (!criteria) {
      return fastify.prisma.customer.findMany({
        where: { marketingConsent: true },
        select: { id: true, name: true, phone: true, email: true },
      })
    }

    const where: any = { marketingConsent: true }

    // Apply filters based on criteria
    if (criteria.loyaltyPointsMin) {
      where.loyaltyPoints = { gte: criteria.loyaltyPointsMin }
    }

    if (criteria.tags && criteria.tags.length > 0) {
      // Assuming customers have tags stored as JSON array
      where.tags = { hasSome: criteria.tags }
    }

    if (criteria.lastOrderDaysAgo) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - criteria.lastOrderDaysAgo)
      where.orders = {
        some: {
          createdAt: { gte: cutoffDate },
        },
      }
    }

    return fastify.prisma.customer.findMany({
      where,
      select: { id: true, name: true, phone: true, email: true },
    })
  }
}
