package handlers

import (
	"context"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"time"
)

type CounterSyncHandler struct {
	redis *redis.Client
}

func NewCounterSyncHandler(redisClient *redis.Client) *CounterSyncHandler {
	return &CounterSyncHandler{redis: redisClient}
}

// POST /api/erp/counters/sync
func (h *CounterSyncHandler) SyncCounter(c *gin.Context) {
	var req struct {
		CounterID string      `json:"counter_id"`
		Data      interface{} `json:"data"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	ctx := context.Background()
	key := "counter:" + req.CounterID
	
	data, _ := json.Marshal(req.Data)
	h.redis.Set(ctx, key, data, 10*time.Minute)
	
	// Publish to Redis pub/sub
	h.redis.Publish(ctx, "counter-sync", string(data))
	
	c.JSON(200, gin.H{
		"success": true,
		"synced": true,
	})
}

// GET /api/erp/counters/:id/state
func (h *CounterSyncHandler) GetCounterState(c *gin.Context) {
	counterID := c.Param("id")
	ctx := context.Background()
	key := "counter:" + counterID
	
	val, err := h.redis.Get(ctx, key).Result()
	if err != nil {
		c.JSON(404, gin.H{"error": "Counter not found"})
		return
	}
	
	var data interface{}
	json.Unmarshal([]byte(val), &data)
	
	c.JSON(200, gin.H{
		"success": true,
		"data": data,
	})
}
