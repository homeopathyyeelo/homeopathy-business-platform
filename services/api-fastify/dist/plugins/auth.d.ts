import { FastifyInstance, FastifyPluginOptions } from "fastify";
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
        jwt: {
            sign: (payload: any, options?: any) => string;
            verify: (token: string) => any;
        };
    }
    interface FastifyRequest {
        user?: any;
        jwtVerify: () => Promise<void>;
    }
}
declare function registerAuth(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void>;
export declare const authPlugin: typeof registerAuth;
export {};
