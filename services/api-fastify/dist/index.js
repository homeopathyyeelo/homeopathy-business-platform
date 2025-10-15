"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const campaigns_1 = require("./routes/campaigns");
const templates_1 = require("./routes/templates");
const coupons_1 = require("./routes/coupons");
const products_1 = require("./routes/products");
const auth_1 = require("./plugins/auth");
const prisma_1 = require("./plugins/prisma");
const redis_1 = require("./plugins/redis");
const prom_client_1 = __importDefault(require("prom-client"));
const swagger_1 = require("./plugins/swagger");
const fastify = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || "info",
        transport: { target: "pino-pretty", options: { colorize: true } },
    },
});
fastify.register(require('@fastify/cors'), {
    origin: true
});
fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
});
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
fastify.get("/metrics", async (request, reply) => {
    reply.header("Content-Type", register.contentType);
    return await register.metrics();
});
fastify.register(prisma_1.prismaPlugin);
fastify.register(redis_1.redisPlugin);
fastify.register(auth_1.authPlugin);
fastify.register(swagger_1.swaggerPlugin);
fastify.register(products_1.productsRoutes, { prefix: "/api/products" });
fastify.register(campaigns_1.campaignsRoutes, { prefix: "/api/campaigns" });
fastify.register(templates_1.templatesRoutes, { prefix: "/api/templates" });
fastify.register(coupons_1.couponsRoutes, { prefix: "/api/coupons" });
fastify.get("/health", async (request, reply) => {
    return {
        status: "ok",
        service: "fastify-api",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    };
});
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
        success: false,
        error: "Internal Server Error"
    });
});
const start = async () => {
    try {
        const port = Number.parseInt(process.env.PORT || "3002");
        const host = process.env.HOST || "0.0.0.0";
        await fastify.listen({ port, host });
        fastify.log.info(`🚀 Fastify API server listening on ${host}:${port}`);
        fastify.log.info(`📚 Swagger docs available at http://${host}:${port}/documentation`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map