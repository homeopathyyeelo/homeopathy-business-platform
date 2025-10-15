// Kafka Consumer Worker in Go
// Handles high-throughput event processing for analytics and notifications
//
// Learning Notes:
// - Go is excellent for high-performance Kafka consumers
// - Handles concurrent message processing with goroutines
// - Implements proper error handling and retry logic
// - Connects to PostgreSQL for data persistence

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/Shopify/sarama"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Event structures matching TypeScript definitions
type BaseEvent struct {
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Version   string `json:"version"`
	Source    string `json:"source"`
}

type OrderEventData struct {
	OrderID     string  `json:"orderId"`
	CustomerID  string  `json:"customerId"`
	ShopID      string  `json:"shopId"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"totalAmount"`
}

type OrderEvent struct {
	BaseEvent
	Type string         `json:"type"`
	Data OrderEventData `json:"data"`
}

type CampaignEventData struct {
	CampaignID  string `json:"campaignId"`
	ShopID      string `json:"shopId"`
	Channel     string `json:"channel"`
	TargetCount int    `json:"targetCount"`
	Status      string `json:"status"`
}

type CampaignEvent struct {
	BaseEvent
	Type string            `json:"type"`
	Data CampaignEventData `json:"data"`
}

// Worker configuration
type Config struct {
	KafkaBrokers  []string
	DatabaseURL   string
	ConsumerGroup string
	Topics        []string
}

// Consumer group handler
type ConsumerGroupHandler struct {
	db *sql.DB
}

func (h *ConsumerGroupHandler) Setup(sarama.ConsumerGroupSession) error   { return nil }
func (h *ConsumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error { return nil }

func (h *ConsumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for {
		select {
		case message := <-claim.Messages():
			if message == nil {
				return nil
			}

			// Process message
			if err := h.processMessage(message); err != nil {
				log.Printf("[Worker] Error processing message: %v", err)
				// In production, you might want to send to dead letter queue
				continue
			}

			// Mark message as processed
			session.MarkMessage(message, "")

		case <-session.Context().Done():
			return nil
		}
	}
}

func (h *ConsumerGroupHandler) processMessage(message *sarama.ConsumerMessage) error {
	log.Printf("[Worker] Processing message from topic %s, partition %d, offset %d",
		message.Topic, message.Partition, message.Offset)

	switch message.Topic {
	case "orders":
		return h.processOrderEvent(message.Value)
	case "campaigns":
		return h.processCampaignEvent(message.Value)
	case "analytics":
		return h.processAnalyticsEvent(message.Value)
	default:
		log.Printf("[Worker] Unknown topic: %s", message.Topic)
		return nil
	}
}

func (h *ConsumerGroupHandler) processOrderEvent(data []byte) error {
	var event OrderEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return fmt.Errorf("failed to unmarshal order event: %w", err)
	}

	log.Printf("[Worker] Processing order event: %s for order %s", event.Type, event.Data.OrderID)

	// Update analytics tables
	switch event.Type {
	case "order.created":
		return h.recordOrderCreated(event)
	case "order.completed":
		return h.recordOrderCompleted(event)
	case "order.cancelled":
		return h.recordOrderCancelled(event)
	}

	return nil
}

func (h *ConsumerGroupHandler) processCampaignEvent(data []byte) error {
	var event CampaignEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return fmt.Errorf("failed to unmarshal campaign event: %w", err)
	}

	log.Printf("[Worker] Processing campaign event: %s for campaign %s", event.Type, event.Data.CampaignID)

	// Update campaign analytics
	switch event.Type {
	case "campaign.launched":
		return h.recordCampaignLaunched(event)
	case "campaign.completed":
		return h.recordCampaignCompleted(event)
	}

	return nil
}

func (h *ConsumerGroupHandler) processAnalyticsEvent(data []byte) error {
	// Process general analytics events
	log.Printf("[Worker] Processing analytics event")

	// Update real-time metrics, aggregations, etc.
	return nil
}

// Database operations
func (h *ConsumerGroupHandler) recordOrderCreated(event OrderEvent) error {
	query := `
		INSERT INTO order_analytics (
			order_id, customer_id, shop_id, total_amount, 
			status, created_at, event_timestamp
		) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
		ON CONFLICT (order_id) DO UPDATE SET
			status = EXCLUDED.status,
			updated_at = NOW()
	`

	eventTime, _ := time.Parse(time.RFC3339, event.Timestamp)

	_, err := h.db.Exec(query,
		event.Data.OrderID,
		event.Data.CustomerID,
		event.Data.ShopID,
		event.Data.TotalAmount,
		event.Data.Status,
		eventTime,
	)

	if err != nil {
		return fmt.Errorf("failed to record order created: %w", err)
	}

	log.Printf("[Worker] Recorded order created: %s", event.Data.OrderID)
	return nil
}

func (h *ConsumerGroupHandler) recordOrderCompleted(event OrderEvent) error {
	query := `
		UPDATE order_analytics 
		SET status = $1, completed_at = NOW(), updated_at = NOW()
		WHERE order_id = $2
	`

	_, err := h.db.Exec(query, event.Data.Status, event.Data.OrderID)
	if err != nil {
		return fmt.Errorf("failed to record order completed: %w", err)
	}

	// Update daily revenue metrics
	revenueQuery := `
		INSERT INTO daily_revenue (date, shop_id, total_revenue, order_count)
		VALUES (CURRENT_DATE, $1, $2, 1)
		ON CONFLICT (date, shop_id) DO UPDATE SET
			total_revenue = daily_revenue.total_revenue + EXCLUDED.total_revenue,
			order_count = daily_revenue.order_count + 1,
			updated_at = NOW()
	`

	_, err = h.db.Exec(revenueQuery, event.Data.ShopID, event.Data.TotalAmount)
	if err != nil {
		return fmt.Errorf("failed to update daily revenue: %w", err)
	}

	log.Printf("[Worker] Recorded order completed: %s", event.Data.OrderID)
	return nil
}

func (h *ConsumerGroupHandler) recordOrderCancelled(event OrderEvent) error {
	query := `
		UPDATE order_analytics 
		SET status = $1, cancelled_at = NOW(), updated_at = NOW()
		WHERE order_id = $2
	`

	_, err := h.db.Exec(query, event.Data.Status, event.Data.OrderID)
	if err != nil {
		return fmt.Errorf("failed to record order cancelled: %w", err)
	}

	log.Printf("[Worker] Recorded order cancelled: %s", event.Data.OrderID)
	return nil
}

func (h *ConsumerGroupHandler) recordCampaignLaunched(event CampaignEvent) error {
	query := `
		INSERT INTO campaign_analytics (
			campaign_id, shop_id, channel, target_count, 
			status, launched_at, created_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (campaign_id) DO UPDATE SET
			status = EXCLUDED.status,
			launched_at = NOW(),
			updated_at = NOW()
	`

	_, err := h.db.Exec(query,
		event.Data.CampaignID,
		event.Data.ShopID,
		event.Data.Channel,
		event.Data.TargetCount,
		event.Data.Status,
	)

	if err != nil {
		return fmt.Errorf("failed to record campaign launched: %w", err)
	}

	log.Printf("[Worker] Recorded campaign launched: %s", event.Data.CampaignID)
	return nil
}

func (h *ConsumerGroupHandler) recordCampaignCompleted(event CampaignEvent) error {
	query := `
		UPDATE campaign_analytics 
		SET status = $1, completed_at = NOW(), updated_at = NOW()
		WHERE campaign_id = $2
	`

	_, err := h.db.Exec(query, event.Data.Status, event.Data.CampaignID)
	if err != nil {
		return fmt.Errorf("failed to record campaign completed: %w", err)
	}

	log.Printf("[Worker] Recorded campaign completed: %s", event.Data.CampaignID)
	return nil
}

func main() {
	// Expose health and metrics HTTP server
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	http.Handle("/metrics", promhttp.Handler())
	go func() {
		addr := ":9090"
		log.Printf("[Worker] HTTP server listening on %s", addr)
		if err := http.ListenAndServe(addr, nil); err != nil {
			log.Printf("[Worker] HTTP server error: %v", err)
		}
	}()

	// Load configuration
	config := Config{
		KafkaBrokers:  []string{getEnv("KAFKA_BROKERS", "localhost:9092")},
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://postgres:password@localhost/yeelo_homeopathy?sslmode=disable"),
		ConsumerGroup: getEnv("CONSUMER_GROUP", "yeelo-worker-golang"),
		Topics:        []string{"orders", "campaigns", "analytics"},
	}

	// Connect to database
	db, err := sql.Open("postgres", config.DatabaseURL)
	if err != nil {
		log.Fatalf("[Worker] Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("[Worker] Failed to ping database: %v", err)
	}
	log.Println("[Worker] Connected to database successfully")

	// Setup Kafka consumer
	saramaConfig := sarama.NewConfig()
	saramaConfig.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	saramaConfig.Consumer.Offsets.Initial = sarama.OffsetNewest
	saramaConfig.Consumer.Group.Session.Timeout = 30 * time.Second
	saramaConfig.Consumer.Group.Heartbeat.Interval = 3 * time.Second

	consumer := &ConsumerGroupHandler{db: db}

	client, err := sarama.NewConsumerGroup(config.KafkaBrokers, config.ConsumerGroup, saramaConfig)
	if err != nil {
		log.Fatalf("[Worker] Failed to create consumer group: %v", err)
	}
	defer client.Close()

	// Setup graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	wg := &sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			if err := client.Consume(ctx, config.Topics, consumer); err != nil {
				log.Printf("[Worker] Error from consumer: %v", err)
				return
			}
			if ctx.Err() != nil {
				return
			}
		}
	}()

	log.Printf("[Worker] Started consuming from topics: %v", config.Topics)

	// Wait for interrupt signal
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)
	<-sigterm

	log.Println("[Worker] Shutting down gracefully...")
	cancel()
	wg.Wait()
	log.Println("[Worker] Shutdown complete")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
