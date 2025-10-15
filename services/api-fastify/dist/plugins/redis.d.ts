import { FastifyInstance, FastifyPluginOptions } from "fastify";
import Redis from "ioredis";
declare module "fastify" {
    interface FastifyInstance {
        redis: Redis;
    }
}
declare function registerRedis(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void>;
export declare const redisPlugin: typeof registerRedis;
export {};
