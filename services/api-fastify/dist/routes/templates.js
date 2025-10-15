"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesRoutes = templatesRoutes;
const zod_1 = require("zod");
const CreateTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(["WHATSAPP", "SMS", "EMAIL", "INSTAGRAM", "GOOGLE_BUSINESS"]),
    content: zod_1.z.string().min(1),
    variables: zod_1.z.array(zod_1.z.string()).optional(),
});
const UpdateTemplateSchema = CreateTemplateSchema.partial();
async function templatesRoutes(fastify) {
    fastify.get("/", async (request, reply) => {
        try {
            const templates = await fastify.prisma.template.findMany({
                orderBy: { createdAt: "desc" }
            });
            return { templates };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch templates" });
        }
    });
    fastify.get("/:id", async (request, reply) => {
        try {
            const template = await fastify.prisma.template.findUnique({
                where: { id: request.params.id }
            });
            if (!template) {
                return reply.status(404).send({ error: "Template not found" });
            }
            return { template };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to fetch template" });
        }
    });
    fastify.post("/", async (request, reply) => {
        try {
            const data = CreateTemplateSchema.parse(request.body);
            const template = await fastify.prisma.template.create({
                data: {
                    name: data.name,
                    content: data.content,
                    type: data.type,
                    variables: data.variables,
                }
            });
            return { template };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Invalid template data" });
        }
    });
    fastify.put("/:id", async (request, reply) => {
        try {
            const data = UpdateTemplateSchema.parse(request.body);
            const mapped = { ...data };
            if (mapped.type === "PUSH")
                mapped.type = "INSTAGRAM";
            const template = await fastify.prisma.template.update({
                where: { id: request.params.id },
                data: mapped,
            });
            return { template };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(400).send({ error: "Failed to update template" });
        }
    });
    fastify.delete("/:id", async (request, reply) => {
        try {
            await fastify.prisma.template.delete({
                where: { id: request.params.id }
            });
            return { message: "Template deleted successfully" };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: "Failed to delete template" });
        }
    });
}
//# sourceMappingURL=templates.js.map