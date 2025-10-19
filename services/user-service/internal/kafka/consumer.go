package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/yeelo/user-service/internal/config"
	"go.uber.org/zap"
)

type Consumer struct {
	reader *kafka.Reader
	logger *zap.Logger
}

type EventHandler func(ctx context.Context, event Event) error

func NewConsumer(cfg *config.Config, logger *zap.Logger) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        cfg.Kafka.Brokers,
		Topic:          cfg.Kafka.Topic,
		GroupID:        cfg.Kafka.GroupID,
		MinBytes:       10e3, // 10KB
		MaxBytes:       10e6, // 10MB
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
	})

	return &Consumer{
		reader: reader,
		logger: logger,
	}
}

func (c *Consumer) Start(ctx context.Context, handler EventHandler) error {
	c.logger.Info("Starting Kafka consumer")

	for {
		select {
		case <-ctx.Done():
			c.logger.Info("Stopping Kafka consumer")
			return c.reader.Close()
		default:
			message, err := c.reader.ReadMessage(ctx)
			if err != nil {
				c.logger.Error("Failed to read message", zap.Error(err))
				continue
			}

			var event Event
			if err := json.Unmarshal(message.Value, &event); err != nil {
				c.logger.Error("Failed to unmarshal event", zap.Error(err))
				continue
			}

			if err := handler(ctx, event); err != nil {
				c.logger.Error("Failed to handle event",
					zap.String("type", event.Type),
					zap.Error(err))
			}
		}
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
