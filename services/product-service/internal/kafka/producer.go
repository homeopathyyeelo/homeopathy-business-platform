package kafka

import (
	"context"
	"encoding/json"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/yeelo/product-service/internal/config"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(cfg *config.Config) *Producer {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(cfg.Kafka.Brokers...),
		Topic:        cfg.Kafka.Topic,
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    100,
		BatchTimeout: 10 * time.Millisecond,
	}

	return &Producer{writer: writer}
}

func (p *Producer) PublishEvent(topic string, event interface{}) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Topic: topic,
		Value: data,
		Time:  time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return p.writer.WriteMessages(ctx, msg)
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
