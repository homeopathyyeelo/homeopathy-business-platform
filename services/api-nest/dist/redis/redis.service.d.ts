import { type OnModuleInit } from "@nestjs/common";
export declare class RedisService implements OnModuleInit {
    private redis;
    onModuleInit(): void;
    setIdempotentResponse(key: string, value: any, ttlSeconds: number): Promise<void>;
    getIdempotentResponse(key: string): Promise<any | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
}
