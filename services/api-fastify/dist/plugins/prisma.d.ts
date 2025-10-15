import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { PrismaClient } from "@yeelo/shared-db";
declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
declare function registerPrisma(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void>;
export declare const prismaPlugin: typeof registerPrisma;
export {};
