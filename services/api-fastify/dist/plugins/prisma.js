"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const shared_db_1 = require("@yeelo/shared-db");
async function registerPrisma(fastify, options) {
    const prisma = new shared_db_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });
    await prisma.$connect();
    fastify.decorate("prisma", prisma);
    fastify.addHook("onClose", async (instance) => {
        await instance.prisma.$disconnect();
    });
}
exports.prismaPlugin = (0, fastify_plugin_1.default)(registerPrisma);
//# sourceMappingURL=prisma.js.map