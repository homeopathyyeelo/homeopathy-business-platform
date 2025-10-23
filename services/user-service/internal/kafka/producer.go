package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/yeelo/user-service/internal/config"
)

type Producer struct {
	writer *kafka.Writer
}

type Event struct {
	Type      string                 `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	UserID    string                 `json:"user_id,omitempty"`
	Data      map[string]interface{} `json:"data"`
}

func NewProducer(cfg *config.Config) *Producer {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(cfg.Kafka.Brokers...),
		Topic:        cfg.Kafka.Topic,
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    100,
		BatchTimeout: 10 * time.Millisecond,
		Async:        false,
		Compression:  kafka.Snappy,
	}

	return &Producer{writer: writer}
}

func (p *Producer) PublishEvent(ctx context.Context, event Event) error {
	event.Timestamp = time.Now().UTC()

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	message := kafka.Message{
		Key:   []byte(event.UserID),
		Value: data,
		Time:  event.Timestamp,
	}

	if err := p.writer.WriteMessages(ctx, message); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	return nil
}

func (p *Producer) PublishUserCreated(ctx context.Context, userID string, data map[string]interface{}) error {
	return p.PublishEvent(ctx, Event{
		Type:   "user.created",
		UserID: userID,
		Data:   data,
	})
}

func (p *Producer) PublishUserUpdated(ctx context.Context, userID string, data map[string]interface{}) error {
	return p.PublishEvent(ctx, Event{
		Type:   "user.updated",
		UserID: userID,
		Data:   data,
	})
}

func (p *Producer) PublishUserDeleted(ctx context.Context, userID string) error {
	return p.PublishEvent(ctx, Event{
		Type:   "user.deleted",
		UserID: userID,
		Data:   map[string]interface{}{},
	})
}

func (p *Producer) PublishUserLoggedIn(ctx context.Context, userID string, data map[string]interface{}) error {
	return p.PublishEvent(ctx, Event{
		Type:   "user.logged_in",
		UserID: userID,
		Data:   data,
	})
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
