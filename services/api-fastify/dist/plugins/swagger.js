"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function registerSwagger(fastify, _options) {
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
    });
    await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false
        },
        staticCSP: true,
        transformStaticCSP: (header) => header
    });
}
exports.swaggerPlugin = (0, fastify_plugin_1.default)(registerSwagger);
//# sourceMappingURL=swagger.js.map