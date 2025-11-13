package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	rdb *redis.Client
	ctx context.Context
}

func NewRedisCache(addr, password string, db int) *RedisCache {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	
	ctx := context.Background()
	
	// Test connection
	if err := rdb.Ping(ctx).Err(); err != nil {
		fmt.Printf("⚠️  Redis connection failed: %v (caching disabled)\n", err)
		return nil
	}
	
	fmt.Println("✅ Redis cache connected")
	return &RedisCache{rdb: rdb, ctx: ctx}
}

// Get retrieves a value from cache and unmarshals it
func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) (bool, error) {
	if c == nil || c.rdb == nil {
		return false, nil
	}
	
	val, err := c.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil // Cache miss
	}
	if err != nil {
		return false, err
	}
	
	return true, json.Unmarshal([]byte(val), dest)
}

// Set stores a value in cache with TTL
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if c == nil || c.rdb == nil {
		return nil // Gracefully skip if Redis unavailable
	}
	
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	
	return c.rdb.Set(ctx, key, data, ttl).Err()
}

// Delete removes a key from cache
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	if c == nil || c.rdb == nil {
		return nil
	}
	
	return c.rdb.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching a pattern
func (c *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	if c == nil || c.rdb == nil {
		return nil
	}
	
	keys, err := c.rdb.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}
	
	if len(keys) > 0 {
		return c.rdb.Del(ctx, keys...).Err()
	}
	
	return nil
}
