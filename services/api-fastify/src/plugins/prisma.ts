import { FastifyInstance, FastifyPluginOptions } from "fastify"
import fp from "fastify-plugin"
import { PrismaClient } from "@yeelo/shared-db"

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

async function registerPrisma(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  })

  // Connect to database
  await prisma.$connect()

  // Add Prisma to Fastify instance
  fastify.decorate("prisma", prisma)

  // Graceful shutdown
  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect()
  })
}

export const prismaPlugin = fp(registerPrisma)