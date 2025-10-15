import { FastifyInstance, FastifyPluginOptions } from "fastify"
import fp from "fastify-plugin"

async function registerSwagger(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Yeelo Fastify API',
        description: 'High-performance API for Homeopathy Business Platform',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:3002',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  })

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })
}

export const swaggerPlugin = fp(registerSwagger)