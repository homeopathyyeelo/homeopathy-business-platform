"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const shared_db_1 = require("@yeelo/shared-db");
const shared_kafka_1 = require("@yeelo/shared-kafka");
class CampaignService {
    async createCampaign(fastify, data) {
        const { idempotencyKey, ...campaignData } = data;
        if (idempotencyKey) {
            const existingResponse = await fastify.redis.get(`idempotency:${idempotencyKey}`);
            if (existingResponse) {
                return JSON.parse(existingResponse);
            }
        }
        if (campaignData.templateId) {
            const template = await fastify.prisma.template.findUnique({
                where: { id: campaignData.templateId },
            });
            if (!template) {
                throw new Error("Template not found");
            }
            if (template.type !== campaignData.type) {
                throw new Error("Template type does not match campaign type");
            }
        }
        const result = await fastify.prisma.$transaction(async (tx) => {
            const campaign = await tx.campaign.create({
                data: {
                    ...campaignData,
                    scheduledAt: campaignData.scheduledAt ? new Date(campaignData.scheduledAt) : null,
                    status: campaignData.scheduledAt ? shared_db_1.CampaignStatus.SCHEDULED : shared_db_1.CampaignStatus.DRAFT,
                },
                include: {
                    template: true,
                },
            });
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
            });
            return campaign;
        });
        if (idempotencyKey) {
            await fastify.redis.setex(`idempotency:${idempotencyKey}`, 3600, JSON.stringify(result));
        }
        return result;
    }
    async getCampaigns(fastify, query) {
        const { type, status, page = 1, limit = 20 } = query;
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
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
        ]);
        return {
            campaigns,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getCampaign(fastify, id) {
        const campaign = await fastify.prisma.campaign.findUnique({
            where: { id },
            include: {
                template: true,
            },
        });
        if (!campaign) {
            throw new Error("Campaign not found");
        }
        return campaign;
    }
    async triggerCampaign(fastify, id, dryRun = false) {
        const campaign = await fastify.prisma.campaign.findUnique({
            where: { id },
            include: {
                template: true,
            },
        });
        if (!campaign) {
            throw new Error("Campaign not found");
        }
        const recipients = await this.getTargetAudience(fastify, campaign.targetAudience);
        if (dryRun) {
            return {
                campaignId: id,
                recipientCount: recipients.length,
                recipients: recipients.slice(0, 10),
                dryRun: true,
            };
        }
        await fastify.prisma.$transaction(async (tx) => {
            await tx.campaign.update({
                where: { id },
                data: { status: shared_db_1.CampaignStatus.SENDING },
            });
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
            });
        });
        return {
            campaignId: id,
            recipientCount: recipients.length,
            status: "triggered",
        };
    }
    async updateCampaignStatus(fastify, id, status) {
        const campaign = await fastify.prisma.campaign.update({
            where: { id },
            data: { status: status },
            include: {
                template: true,
            },
        });
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
        });
        return campaign;
    }
    async publishCampaignCreated(payload) {
        const event = (0, shared_kafka_1.createCampaignEvent)("campaign.created", {
            campaignId: payload.id,
            shopId: payload.shopId,
            channel: payload.channel,
            targetCount: payload.targetCount,
            status: "created",
        });
        await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.CAMPAIGNS, event, payload.id);
        return { ok: true };
    }
    async publishCampaignLaunched(payload) {
        const event = (0, shared_kafka_1.createCampaignEvent)("campaign.launched", {
            campaignId: payload.id,
            shopId: payload.shopId,
            channel: payload.channel,
            targetCount: payload.targetCount,
            status: "launched",
        });
        await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.CAMPAIGNS, event, payload.id);
        return { ok: true };
    }
    async publishCampaignCompleted(payload) {
        const event = (0, shared_kafka_1.createCampaignEvent)("campaign.completed", {
            campaignId: payload.id,
            shopId: payload.shopId,
            channel: payload.channel,
            targetCount: payload.targetCount,
            status: "completed",
        });
        await shared_kafka_1.eventProducer.publishEvent(shared_kafka_1.TOPICS.CAMPAIGNS, event, payload.id);
        return { ok: true };
    }
    async getTargetAudience(fastify, criteria) {
        if (!criteria) {
            return fastify.prisma.customer.findMany({
                where: { marketingConsent: true },
                select: { id: true, name: true, phone: true, email: true },
            });
        }
        const where = { marketingConsent: true };
        if (criteria.loyaltyPointsMin) {
            where.loyaltyPoints = { gte: criteria.loyaltyPointsMin };
        }
        if (criteria.tags && criteria.tags.length > 0) {
            where.tags = { hasSome: criteria.tags };
        }
        if (criteria.lastOrderDaysAgo) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - criteria.lastOrderDaysAgo);
            where.orders = {
                some: {
                    createdAt: { gte: cutoffDate },
                },
            };
        }
        return fastify.prisma.customer.findMany({
            where,
            select: { id: true, name: true, phone: true, email: true },
        });
    }
}
exports.CampaignService = CampaignService;
//# sourceMappingURL=campaign.service.js.map