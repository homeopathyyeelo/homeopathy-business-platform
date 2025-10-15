import { Injectable, type OnModuleInit } from "@nestjs/common"
import { Redis } from "ioredis"

@Injectable()
export class RedisService implements OnModuleInit {
  private redis!: Redis

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    })
  }

  async setIdempotentResponse(key: string, value: any, ttlSeconds: number): Promise<void> {
    const redisKey = `idempotency:${key}`
    await this.redis.setex(redisKey, ttlSeconds, JSON.stringify(value))
  }

  async getIdempotentResponse(key: string): Promise<any | null> {
    const redisKey = `idempotency:${key}`
    const value = await this.redis.get(redisKey)
    return value ? JSON.parse(value) : null
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value)
    } else {
      await this.redis.set(key, value)
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key)
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key)
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key)
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds)
  }
}
