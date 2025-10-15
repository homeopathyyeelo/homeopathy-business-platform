import { FastifyInstance, FastifyPluginOptions } from "fastify";
declare function registerSwagger(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void>;
export declare const swaggerPlugin: typeof registerSwagger;
export {};
