package redis

import (
	"context"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/yeelo/product-service/internal/config"
)

type Client struct {
	client *redis.Client
}

func NewRedisClient(cfg *config.Config) *Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Address(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
		PoolSize: cfg.Redis.PoolSize,
	})

	return &Client{client: rdb}
}

func (c *Client) Get(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, key).Result()
}

func (c *Client) Set(ctx context.Context, key string, value string, expiration time.Duration) error {
	return c.client.Set(ctx, key, value, expiration).Err()
}

func (c *Client) Del(ctx context.Context, keys ...string) error {
	return c.client.Del(ctx, keys...).Err()
}

func (c *Client) Ping(ctx context.Context) error {
	return c.client.Ping(ctx).Err()
}

func (c *Client) Close() error {
	return c.client.Close()
}
