"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignsRoutes = campaignsRoutes;
const zod_1 = require("zod");
const CreateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(["WHATSAPP", "SMS", "EMAIL", "INSTAGRAM", "GOOGLE_BUSINESS"]),
    targetAudience: zod_1.z.string().optional(),
    content: zod_1.z.string(),
    scheduledAt: zod_1.z.string().datetime().optional(),
});
const UpdateCampaignSchema = CreateCampaignSchema.partial();
async function campaignsRoutes(fastify) {
    fastify.get("/", async (request, reply) => {
        try {
            const campaigns = await fastify.prisma.campaign.findMany({
                orderBy: { createdAt: "desc" },
                include: { template: true },
            });
            return { campaigns };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch campaigns" });
        }
    });
    fastify.get("/:id", async (request, reply) => {
        try {
            const campaign = await fastify.prisma.campaign.findUnique({
                where: { id: request.params.id },
                include: { template: true },
            });
            if (!campaign) {
                return reply.status(404).send({ error: "Campaign not found" });
            }
            return { campaign };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch campaign" });
        }
    });
    fastify.post("/", async (request, reply) => {
        try {
            const data = CreateCampaignSchema.parse(request.body);
            const campaign = await fastify.prisma.campaign.create({
                data: {
                    name: data.name,
                    content: data.content,
                    type: data.type,
                    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                    status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
                    targetAudience: data.targetAudience ? (JSON.parse(data.targetAudience).value ?? data.targetAudience) : undefined,
                },
                include: { template: true },
            });
            return { campaign };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Invalid campaign data" });
        }
    });
    fastify.put("/:id", async (request, reply) => {
        try {
            const data = UpdateCampaignSchema.parse(request.body);
            const mapped = { ...data };
            if (mapped.status) {
                if (mapped.status === "RUNNING")
                    mapped.status = "SENDING";
                else if (mapped.status === "COMPLETED")
                    mapped.status = "SENT";
                else if (mapped.status === "CANCELLED")
                    mapped.status = "FAILED";
            }
            if (mapped.type === "PUSH")
                mapped.type = "INSTAGRAM";
            if (mapped.scheduledAt)
                mapped.scheduledAt = new Date(mapped.scheduledAt);
            const campaign = await fastify.prisma.campaign.update({
                where: { id: request.params.id },
                data: mapped,
            });
            return { campaign };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Failed to update campaign" });
        }
    });
    fastify.delete("/:id", async (request, reply) => {
        try {
            await fastify.prisma.campaign.delete({
                where: { id: request.params.id }
            });
            return { message: "Campaign deleted successfully" };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to delete campaign" });
        }
    });
    fastify.post("/:id/start", async (request, reply) => {
        try {
            const campaign = await fastify.prisma.campaign.update({
                where: { id: request.params.id },
                data: { status: "SENDING" }
            });
            fastify.log.info(`Campaign ${campaign.id} started`);
            return { campaign, message: "Campaign started successfully" };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to start campaign" });
        }
    });
    fastify.post("/:id/stop", async (request, reply) => {
        try {
            const campaign = await fastify.prisma.campaign.update({
                where: { id: request.params.id },
                data: { status: "SENT" }
            });
            return { campaign, message: "Campaign stopped successfully" };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to stop campaign" });
        }
    });
}
//# sourceMappingURL=campaigns.js.map