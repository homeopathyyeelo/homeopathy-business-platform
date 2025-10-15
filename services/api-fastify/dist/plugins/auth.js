"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function registerAuth(fastify, options) {
    await fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET || 'changeme'
    });
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });
}
exports.authPlugin = (0, fastify_plugin_1.default)(registerAuth);
//# sourceMappingURL=auth.js.map