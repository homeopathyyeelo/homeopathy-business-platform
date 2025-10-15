import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"

// Campaign schemas
const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  // Match Prisma enum CampaignType
  type: z.enum(["WHATSAPP", "SMS", "EMAIL", "INSTAGRAM", "GOOGLE_BUSINESS"]),
  targetAudience: z.string().optional(),
  content: z.string(),
  scheduledAt: z.string().datetime().optional(),
})

const UpdateCampaignSchema = CreateCampaignSchema.partial()

export async function campaignsRoutes(fastify: FastifyInstance) {
  // Get all campaigns
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const campaigns = await fastify.prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        include: { template: true },
      })
      return { campaigns }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch campaigns" })
    }
  })

  // Get campaign by ID
  fastify.get("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const campaign = await fastify.prisma.campaign.findUnique({
        where: { id: request.params.id },
        include: { template: true },
      })

      if (!campaign) {
        return reply.status(404).send({ error: "Campaign not found" })
      }

      return { campaign }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch campaign" })
    }
  })

  // Create new campaign
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateCampaignSchema.parse(request.body)

      // Map input strictly to Prisma fields
      const campaign = await fastify.prisma.campaign.create({
        data: {
          name: data.name,
          content: data.content,
          type: data.type as any,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: data.scheduledAt ? ("SCHEDULED" as any) : ("DRAFT" as any),
          targetAudience: data.targetAudience ? (JSON.parse(data.targetAudience).value ?? data.targetAudience) : undefined as any,
        },
        include: { template: true },
      })

      return { campaign }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Invalid campaign data" })
    }
  })

  // Update campaign
  fastify.put("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = UpdateCampaignSchema.parse(request.body)

      // Map statuses/fields to valid Prisma enums
      const mapped: any = { ...data }
      if (mapped.status) {
        if (mapped.status === "RUNNING") mapped.status = "SENDING"
        else if (mapped.status === "COMPLETED") mapped.status = "SENT"
        else if (mapped.status === "CANCELLED") mapped.status = "FAILED"
      }
      if (mapped.type === "PUSH") mapped.type = "INSTAGRAM"
      if (mapped.scheduledAt) mapped.scheduledAt = new Date(mapped.scheduledAt)

      const campaign = await fastify.prisma.campaign.update({
        where: { id: request.params.id },
        data: mapped,
      })

      return { campaign }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Failed to update campaign" })
    }
  })

  // Delete campaign
  fastify.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await fastify.prisma.campaign.delete({
        where: { id: request.params.id }
      })

      return { message: "Campaign deleted successfully" }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to delete campaign" })
    }
  })

  // Start campaign
  fastify.post("/:id/start", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const campaign = await fastify.prisma.campaign.update({
        where: { id: request.params.id },
        data: { status: "SENDING" as any }
      })

      // TODO: Implement actual campaign execution logic
      fastify.log.info(`Campaign ${campaign.id} started`)

      return { campaign, message: "Campaign started successfully" }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to start campaign" })
    }
  })

  // Stop campaign
  fastify.post("/:id/stop", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const campaign = await fastify.prisma.campaign.update({
        where: { id: request.params.id },
        data: { status: "SENT" as any }
      })

      return { campaign, message: "Campaign stopped successfully" }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to stop campaign" })
    }
  })
}