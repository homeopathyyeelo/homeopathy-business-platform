"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    onModuleInit() {
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: Number.parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
        });
    }
    async setIdempotentResponse(key, value, ttlSeconds) {
        const redisKey = `idempotency:${key}`;
        await this.redis.setex(redisKey, ttlSeconds, JSON.stringify(value));
    }
    async getIdempotentResponse(key) {
        const redisKey = `idempotency:${key}`;
        const value = await this.redis.get(redisKey);
        return value ? JSON.parse(value) : null;
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.redis.setex(key, ttlSeconds, value);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    async get(key) {
        return this.redis.get(key);
    }
    async del(key) {
        return this.redis.del(key);
    }
    async exists(key) {
        return this.redis.exists(key);
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async expire(key, seconds) {
        return this.redis.expire(key, seconds);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map