import { FastifyInstance, FastifyPluginOptions } from "fastify"
import fp from "fastify-plugin"
import Redis from "ioredis"

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis
  }
}

async function registerRedis(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6380"),
    password: process.env.REDIS_PASSWORD || undefined,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
  })

  // Add Redis to Fastify instance
  fastify.decorate("redis", redis)

  // Graceful shutdown
  fastify.addHook("onClose", async (instance) => {
    await instance.redis.quit()
  })
}

export const redisPlugin = fp(registerRedis)