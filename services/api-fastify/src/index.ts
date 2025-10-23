import Fastify from "fastify"
import { campaignsRoutes } from "./routes/campaigns"
import { templatesRoutes } from "./routes/templates"
import { couponsRoutes } from "./routes/coupons"
import { productsRoutes } from "./routes/products"
// import { customersRoutes } from "./routes/customers"
// import { ordersRoutes } from "./routes/orders"
// import { authRoutes } from "./routes/auth"
// import { analyticsRoutes } from "./routes/analytics"
import { authPlugin } from "./plugins/auth"
import { prismaPlugin } from "./plugins/prisma"
import { redisPlugin } from "./plugins/redis"
import client from "prom-client"
import { swaggerPlugin } from "./plugins/swagger"

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: { target: "pino-pretty", options: { colorize: true } },
  },
})

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: true
})

// Register rate limiting
fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
})

// Metrics
const register = new client.Registry()
client.collectDefaultMetrics({ register })
fastify.get("/metrics", async (request, reply) => {
  reply.header("Content-Type", register.contentType)
  return await register.metrics()
})

// Register plugins
fastify.register(prismaPlugin)
fastify.register(redisPlugin)
fastify.register(authPlugin)
fastify.register(swaggerPlugin)

// Register API routes
fastify.register(productsRoutes, { prefix: "/api/products" })

// Register marketing routes (Fastify's specialty)
fastify.register(campaignsRoutes, { prefix: "/api/campaigns" })
fastify.register(templatesRoutes, { prefix: "/api/templates" })
fastify.register(couponsRoutes, { prefix: "/api/coupons" })

// Health check
fastify.get("/health", async (request, reply) => {
  return { 
    status: "ok", 
    service: "fastify-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  reply.status(500).send({ 
    success: false,
    error: "Internal Server Error" 
  })
})

const start = async () => {
  try {
    const port = Number.parseInt(process.env.PORT || "3002")
    const host = process.env.HOST || "0.0.0.0"

    await fastify.listen({ port, host })
    fastify.log.info(` Fastify API server listening on ${host}:${port}`)
    fastify.log.info(` Swagger docs available at http://${host}:${port}/documentation`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
