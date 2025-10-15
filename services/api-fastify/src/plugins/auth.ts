import { FastifyInstance, FastifyPluginOptions } from "fastify"
import fp from "fastify-plugin"

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>
    jwt: {
      sign: (payload: any, options?: any) => string
      verify: (token: string) => any
    }
  }
  interface FastifyRequest {
    user?: any
    jwtVerify: () => Promise<void>
  }
}

async function registerAuth(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Register JWT plugin
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'changeme'
  })

  // Create authenticate decorator
  fastify.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
}

export const authPlugin = fp(registerAuth)