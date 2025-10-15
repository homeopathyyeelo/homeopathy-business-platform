"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const ioredis_1 = __importDefault(require("ioredis"));
async function registerRedis(fastify, options) {
    const redis = new ioredis_1.default({
        host: process.env.REDIS_HOST || "localhost",
        port: Number.parseInt(process.env.REDIS_PORT || "6380"),
        password: process.env.REDIS_PASSWORD || undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
    });
    fastify.decorate("redis", redis);
    fastify.addHook("onClose", async (instance) => {
        await instance.redis.quit();
    });
}
exports.redisPlugin = (0, fastify_plugin_1.default)(registerRedis);
//# sourceMappingURL=redis.js.map