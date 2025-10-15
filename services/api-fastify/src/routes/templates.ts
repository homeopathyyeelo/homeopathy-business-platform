import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"

// Template schemas (match Prisma CampaignType)
const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["WHATSAPP", "SMS", "EMAIL", "INSTAGRAM", "GOOGLE_BUSINESS"]),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
})

const UpdateTemplateSchema = CreateTemplateSchema.partial()

export async function templatesRoutes(fastify: FastifyInstance) {
  // Get all templates
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const templates = await fastify.prisma.template.findMany({
        orderBy: { createdAt: "desc" }
      })
      return { templates }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch templates" })
    }
  })

  // Get template by ID
  fastify.get("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const template = await fastify.prisma.template.findUnique({
        where: { id: request.params.id }
      })

      if (!template) {
        return reply.status(404).send({ error: "Template not found" })
      }

      return { template }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to fetch template" })
    }
  })

  // Create new template
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateTemplateSchema.parse(request.body)
      
      const template = await fastify.prisma.template.create({
        data: {
          name: data.name,
          content: data.content,
          type: data.type as any,
          variables: data.variables,
          // description is not in schema; ignore if absent in Prisma model
        }
      })

      return { template }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Invalid template data" })
    }
  })

  // Update template
  fastify.put("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = UpdateTemplateSchema.parse(request.body)

      const mapped: any = { ...data }
      if (mapped.type === "PUSH") mapped.type = "INSTAGRAM"

      const template = await fastify.prisma.template.update({
        where: { id: request.params.id },
        data: mapped,
      })

      return { template }
    } catch (error) {
      fastify.log.error(error)
      reply.status(400).send({ error: "Failed to update template" })
    }
  })

  // Delete template
  fastify.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await fastify.prisma.template.delete({
        where: { id: request.params.id }
      })

      return { message: "Template deleted successfully" }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({ error: "Failed to delete template" })
    }
  })
}