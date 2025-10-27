// =============================================
// KAFKA EVENT SYSTEM FOR MASTER DATA CHANGES
// =============================================
// Real-time event publishing for master data operations

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

// ==================== EVENT TYPES ====================

// MasterDataEvent represents a master data change event
type MasterDataEvent struct {
	EventID     string                 `json:"event_id"`
	EventType   string                 `json:"event_type"` // CREATE, UPDATE, DELETE
	EntityType  string                 `json:"entity_type"` // company, branch, product, etc.
	EntityID    string                 `json:"entity_id"`
	OldData     map[string]interface{} `json:"old_data,omitempty"`
	NewData     map[string]interface{} `json:"new_data,omitempty"`
	UserID      string                 `json:"user_id"`
	Timestamp   time.Time              `json:"timestamp"`
	Source      string                 `json:"source"` // API, UI, BATCH
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// EventTypes for different operations
const (
	EventTypeCreate  = "CREATE"
	EventTypeUpdate  = "UPDATE"
	EventTypeDelete  = "DELETE"
	EventTypeBulk    = "BULK"
	EventTypeImport  = "IMPORT"
	EventTypeExport  = "EXPORT"
	EventTypeArchive = "ARCHIVE"
	EventTypeRestore = "RESTORE"
)

// EntityTypes for different master data entities
const (
	EntityTypeCompany           = "company"
	EntityTypeBranch            = "branch"
	EntityTypeDepartment        = "department"
	EntityTypeRole              = "role"
	EntityTypeUser              = "user"
	EntityTypeCurrency          = "currency"
	EntityTypeTaxSlab           = "tax_slab"
	EntityTypeUOM               = "uom"
	EntityTypePaymentMethod     = "payment_method"
	EntityTypeProduct           = "product"
	EntityTypeCategory          = "category"
	EntityTypeBrand             = "brand"
	EntityTypeVendor            = "vendor"
	EntityTypeCustomer          = "customer"
	EntityTypeEmployee          = "employee"
	EntityTypeLedger            = "ledger"
	EntityTypeCampaign          = "campaign"
	EntityTypeAIAgent           = "ai_agent"
	EntityTypeSystemSetting     = "system_setting"
	EntityTypeUserProfile       = "user_profile"
)

// Kafka topics for different event types
const (
	TopicMasterDataEvents    = "master-data-events"
	TopicMasterDataAudit     = "master-data-audit"
	TopicMasterDataAnalytics = "master-data-analytics"
	TopicMasterDataSync      = "master-data-sync"
)

// ==================== EVENT PRODUCER ====================

// EventProducer handles publishing events to Kafka
type EventProducer struct {
	writer *kafka.Writer
}

// NewEventProducer creates a new event producer
func NewEventProducer(brokers []string) *EventProducer {
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    TopicMasterDataEvents,
		Balancer: &kafka.LeastBytes{},
		Async:    true,
	})

	return &EventProducer{
		writer: writer,
	}
}

// PublishMasterDataEvent publishes a master data event to Kafka
func (p *EventProducer) PublishMasterDataEvent(event *MasterDataEvent) error {
	// Set event metadata
	event.EventID = fmt.Sprintf("evt_%d", time.Now().UnixNano())
	event.Timestamp = time.Now()
	event.Source = "api"

	// Marshal event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Create Kafka message
	message := kafka.Message{
		Key:   []byte(event.EntityType + ":" + event.EntityID),
		Value: eventBytes,
		Headers: []kafka.Header{
			{Key: "event_type", Value: []byte(event.EventType)},
			{Key: "entity_type", Value: []byte(event.EntityType)},
			{Key: "timestamp", Value: []byte(event.Timestamp.Format(time.RFC3339))},
		},
	}

	// Publish to multiple topics based on event type
	topics := []string{TopicMasterDataEvents, TopicMasterDataAudit}

	if event.EventType == EventTypeCreate || event.EventType == EventTypeUpdate || event.EventType == EventTypeDelete {
		topics = append(topics, TopicMasterDataSync)
	}

	// Send to all relevant topics
	for _, topic := range topics {
		message.Topic = topic
		if err := p.writer.WriteMessages(context.Background(), message); err != nil {
			log.Printf("Failed to publish event to topic %s: %v", topic, err)
			// Don't fail completely, just log the error
		}
	}

	log.Printf("Published master data event: %s %s for %s %s",
		event.EventType, event.EntityType, event.EntityID, event.EventID)

	return nil
}

// PublishBulkEvent publishes a bulk operation event
func (p *EventProducer) PublishBulkEvent(eventType, entityType string, entityIDs []string, userID string, metadata map[string]interface{}) error {
	event := &MasterDataEvent{
		EventType:  eventType,
		EntityType: entityType,
		UserID:     userID,
		Timestamp:  time.Now(),
		Source:     "bulk_operation",
		Metadata:   metadata,
	}

	event.EventID = fmt.Sprintf("bulk_%s_%d", entityType, time.Now().UnixNano())

	// For bulk operations, we don't have individual entity data
	// but we can include the count and entity IDs in metadata
	if event.Metadata == nil {
		event.Metadata = make(map[string]interface{})
	}
	event.Metadata["entity_ids"] = entityIDs
	event.Metadata["count"] = len(entityIDs)

	return p.EventProducer.PublishMasterDataEvent(event)
}

// Close closes the event producer
func (p *EventProducer) Close() error {
	return p.writer.Close()
}

// ==================== EVENT HELPERS ====================

// CreateMasterDataEvent creates a master data event from entity data
func CreateMasterDataEvent(eventType, entityType, entityID, userID string, oldData, newData interface{}) (*MasterDataEvent, error) {
	event := &MasterDataEvent{
		EventType:  eventType,
		EntityType: entityType,
		EntityID:   entityID,
		UserID:     userID,
		Timestamp:  time.Now(),
		Source:     "api",
	}

	// Convert data to map[string]interface{}
	if oldData != nil {
		if oldMap, err := convertToMap(oldData); err == nil {
			event.OldData = oldMap
		}
	}

	if newData != nil {
		if newMap, err := convertToMap(newData); err == nil {
			event.NewData = newMap
		}
	}

	return event, nil
}

// convertToMap converts any struct to map[string]interface{}
func convertToMap(data interface{}) (map[string]interface{}, error) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(dataBytes, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// ==================== INTEGRATION WITH SERVICES ====================

// EventService wraps the event producer and provides service integration
type EventService struct {
	producer *EventProducer
}

// NewEventService creates a new event service
func NewEventService(brokers []string) *EventService {
	return &EventService{
		producer: NewEventProducer(brokers),
	}
}

// OnEntityCreated publishes a create event
func (s *EventService) OnEntityCreated(entityType, entityID, userID string, entityData interface{}) error {
	event, err := CreateMasterDataEvent(EventTypeCreate, entityType, entityID, userID, nil, entityData)
	if err != nil {
		return err
	}

	return s.producer.PublishMasterDataEvent(event)
}

// OnEntityUpdated publishes an update event
func (s *EventService) OnEntityUpdated(entityType, entityID, userID string, oldData, newData interface{}) error {
	event, err := CreateMasterDataEvent(EventTypeUpdate, entityType, entityID, userID, oldData, newData)
	if err != nil {
		return err
	}

	return s.producer.PublishMasterDataEvent(event)
}

// OnEntityDeleted publishes a delete event
func (s *EventService) OnEntityDeleted(entityType, entityID, userID string, entityData interface{}) error {
	event, err := CreateMasterDataEvent(EventTypeDelete, entityType, entityID, userID, entityData, nil)
	if err != nil {
		return err
	}

	return s.producer.PublishMasterDataEvent(event)
}

// OnBulkOperation publishes a bulk operation event
func (s *EventService) OnBulkOperation(eventType, entityType string, entityIDs []string, userID string, metadata map[string]interface{}) error {
	return s.producer.PublishBulkEvent(eventType, entityType, entityIDs, userID, metadata)
}

// Close closes the event service
func (s *EventService) Close() error {
	return s.producer.Close()
}

// ==================== INTEGRATION WITH HANDLERS ====================

// Enhanced handlers with event publishing

// CreateCompanyWithEvents creates a company and publishes events
func (h *MasterHandler) CreateCompanyWithEvents(c *gin.Context) {
	ctx := context.Background()
	var company CompanyProfile

	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.companyService.Create(ctx, &company)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create company", Message: err.Error()})
		return
	}

	// Publish creation event
	userID := getUserIDFromToken(c)
	if err := h.eventService.OnEntityCreated(EntityTypeCompany, created.ID, userID, created); err != nil {
		log.Printf("Failed to publish company creation event: %v", err)
		// Don't fail the request, just log the error
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Company created successfully"})
}

// UpdateCompanyWithEvents updates a company and publishes events
func (h *MasterHandler) UpdateCompanyWithEvents(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")
	var company CompanyProfile

	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	// Get old data for comparison
	oldCompany, err := h.companyService.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch existing company", Message: err.Error()})
		return
	}

	updated, err := h.companyService.Update(ctx, id, &company)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update company", Message: err.Error()})
		return
	}

	// Publish update event
	userID := getUserIDFromToken(c)
	if err := h.eventService.OnEntityUpdated(EntityTypeCompany, id, userID, oldCompany, updated); err != nil {
		log.Printf("Failed to publish company update event: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"data": updated, "message": "Company updated successfully"})
}

// DeleteCompanyWithEvents deletes a company and publishes events
func (h *MasterHandler) DeleteCompanyWithEvents(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	// Get data before deletion for event
	company, err := h.companyService.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch company", Message: err.Error()})
		return
	}

	err = h.companyService.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete company", Message: err.Error()})
		return
	}

	// Publish deletion event
	userID := getUserIDFromToken(c)
	if err := h.eventService.OnEntityDeleted(EntityTypeCompany, id, userID, company); err != nil {
		log.Printf("Failed to publish company deletion event: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company deleted successfully"})
}

// ==================== KAFKA CONSUMER FOR REAL-TIME UPDATES ====================

// EventConsumer handles consuming events from Kafka
type EventConsumer struct {
	reader *kafka.Reader
}

// NewEventConsumer creates a new event consumer
func NewEventConsumer(brokers []string, groupID string) *EventConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		GroupID:  groupID,
		Topic:    TopicMasterDataEvents,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	return &EventConsumer{
		reader: reader,
	}
}

// ConsumeEvents starts consuming events (run in goroutine)
func (c *EventConsumer) ConsumeEvents(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			message, err := c.reader.ReadMessage(ctx)
			if err != nil {
				log.Printf("Error reading message: %v", err)
				continue
			}

			// Process the event
			if err := c.processEvent(message); err != nil {
				log.Printf("Error processing event: %v", err)
			}
		}
	}
}

// processEvent processes a received event
func (c *EventConsumer) processEvent(message kafka.Message) error {
	var event MasterDataEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		return fmt.Errorf("failed to unmarshal event: %w", err)
	}

	log.Printf("Received event: %s %s for %s %s",
		event.EventType, event.EntityType, event.EntityID, event.EventID)

	// Here you can add real-time processing logic:
	// - Update caches
	// - Trigger workflows
	// - Send notifications
	// - Update analytics
	// - Sync with external systems

	// For example, you could broadcast to WebSocket clients
	// or update Redis cache

	return nil
}

// Close closes the event consumer
func (c *EventConsumer) Close() error {
	return c.reader.Close()
}

// ==================== WEBSOCKET BROADCASTING ====================

// BroadcastEvent broadcasts events to connected WebSocket clients
func (c *EventConsumer) BroadcastEvent(event *MasterDataEvent) {
	// Convert event to JSON for broadcasting
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal event for broadcast: %v", err)
		return
	}

	// Broadcast to all connected clients
	// This would integrate with your WebSocket hub
	log.Printf("Broadcasting event: %s", string(eventBytes))
}

// ==================== CACHE INVALIDATION ====================

// InvalidateCache invalidates relevant caches when data changes
func (c *EventConsumer) InvalidateCache(event *MasterDataEvent) {
	// Invalidate specific caches based on entity type
	switch event.EntityType {
	case EntityTypeCompany:
		// Invalidate company cache
		log.Println("Invalidating company cache")
	case EntityTypeProduct:
		// Invalidate product cache
		log.Println("Invalidating product cache")
	case EntityTypeUser:
		// Invalidate user session cache
		log.Println("Invalidating user session cache")
		// You might want to force logout users if their permissions changed
	}

	// Invalidate general master data cache
	log.Println("Invalidating master data cache")
}

// ==================== ANALYTICS TRACKING ====================

// TrackAnalytics tracks analytics events
func (c *EventConsumer) TrackAnalytics(event *MasterDataEvent) {
	// Track changes for analytics
	analyticsEvent := map[string]interface{}{
		"event_type":  event.EventType,
		"entity_type": event.EntityType,
		"entity_id":   event.EntityID,
		"user_id":     event.UserID,
		"timestamp":   event.Timestamp,
		"source":      event.Source,
	}

	// Publish to analytics topic
	analyticsBytes, _ := json.Marshal(analyticsEvent)

	message := kafka.Message{
		Key:   []byte("analytics:" + event.EventType),
		Value: analyticsBytes,
		Topic: TopicMasterDataAnalytics,
	}

	// Send to analytics topic (async)
	go func() {
		if err := c.reader.Config().Brokers[0]; err != nil {
			log.Printf("Failed to publish analytics event: %v", err)
		}
	}()
}

// ==================== GLOBAL EVENT SERVICE ====================

var globalEventService *EventService

// InitializeEventService initializes the global event service
func InitializeEventService(brokers []string) {
	globalEventService = NewEventService(brokers)
}

// GetEventService returns the global event service
func GetEventService() *EventService {
	return globalEventService
}

// ==================== INTEGRATION WITH MAIN APPLICATION ====================

// Enhanced main function with event system
func main() {
	// ... existing initialization code ...

	// Initialize Kafka event system
	kafkaBrokers := []string{"localhost:9092"} // Configure from env
	InitializeEventService(kafkaBrokers)

	// Start event consumer in background
	eventConsumer := NewEventConsumer(kafkaBrokers, "master-data-consumer")
	go func() {
		ctx := context.Background()
		if err := eventConsumer.ConsumeEvents(ctx); err != nil {
			log.Printf("Event consumer stopped: %v", err)
		}
	}()

	// ... rest of main function ...

	// Graceful shutdown
	defer func() {
		globalEventService.Close()
		eventConsumer.Close()
	}()
}

// ==================== API ROUTES WITH EVENT INTEGRATION ====================

// Update routes to use event-enabled handlers
func setupRoutesWithEvents(router *gin.Engine, handler *MasterHandler) {
	v1 := router.Group("/api/v1/masters")

	// Company routes with events
	v1.POST("/companies", handler.CreateCompanyWithEvents)
	v1.PUT("/companies/:id", handler.UpdateCompanyWithEvents)
	v1.DELETE("/companies/:id", handler.DeleteCompanyWithEvents)

	// Product routes with events
	v1.POST("/products", handler.CreateProductWithEvents)
	v1.PUT("/products/:id", handler.UpdateProductWithEvents)
	v1.DELETE("/products/:id", handler.DeleteProductWithEvents)

	// Add similar routes for all other masters...
}

// ==================== BULK OPERATIONS WITH EVENTS ====================

// BulkDeleteWithEvents handles bulk delete operations with events
func (h *MasterHandler) BulkDeleteWithEvents(c *gin.Context) {
	var req struct {
		EntityType string   `json:"entity_type" binding:"required"`
		IDs        []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	// Perform bulk deletion (this would need to be implemented in services)
	deletedCount := 0
	var errors []string

	// This is a simplified example - real implementation would use service methods
	for _, id := range req.IDs {
		// Delete logic here
		deletedCount++
	}

	// Publish bulk deletion event
	userID := getUserIDFromToken(c)
	metadata := map[string]interface{}{
		"deleted_count": deletedCount,
		"total_requested": len(req.IDs),
		"errors": errors,
	}

	if err := h.eventService.OnBulkOperation(EventTypeDelete, req.EntityType, req.IDs, userID, metadata); err != nil {
		log.Printf("Failed to publish bulk deletion event: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Bulk deletion completed. Deleted: %d, Errors: %d", deletedCount, len(errors)),
		"deleted_count": deletedCount,
		"errors": errors,
	})
}

// ==================== EVENT MONITORING DASHBOARD ====================

// GetEventStats returns event statistics for monitoring
func (h *MasterHandler) GetEventStats(c *gin.Context) {
	// This would query event logs for statistics
	stats := map[string]interface{}{
		"total_events_today": 150,
		"events_by_type": map[string]int{
			"CREATE": 45,
			"UPDATE": 85,
			"DELETE": 20,
		},
		"events_by_entity": map[string]int{
			"product": 60,
			"customer": 40,
			"user": 25,
			"company": 15,
		},
		"average_processing_time": "2.3ms",
		"error_rate": "0.1%",
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

// WebSocketSubscribe subscribes to real-time master data events
func (h *MasterHandler) WebSocketSubscribe(c *gin.Context) {
	// This would integrate with your WebSocket implementation
	// to allow clients to subscribe to real-time master data events

	entityTypes := c.QueryArray("entity_types")
	eventTypes := c.QueryArray("event_types")

	log.Printf("WebSocket subscription: entity_types=%v, event_types=%v", entityTypes, eventTypes)

	c.JSON(http.StatusOK, gin.H{
		"message": "Subscribed to real-time events",
		"entity_types": entityTypes,
		"event_types": eventTypes,
	})
}

// ==================== EVENT HISTORY API ====================

// GetEventHistory returns event history for a specific entity
func (h *MasterHandler) GetEventHistory(c *gin.Context) {
	entityType := c.Param("entity_type")
	entityID := c.Param("entity_id")

	// This would query event logs for the specific entity
	events := []MasterDataEvent{
		{
			EventID:   "evt_123",
			EventType: "CREATE",
			EntityType: entityType,
			EntityID:  entityID,
			UserID:    "user_1",
			Timestamp: time.Now().Add(-24 * time.Hour),
		},
		{
			EventID:   "evt_456",
			EventType: "UPDATE",
			EntityType: entityType,
			EntityID:  entityID,
			UserID:    "user_2",
			Timestamp: time.Now().Add(-12 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{"data": events})
}

// ==================== AI INTEGRATION WITH EVENTS ====================

// AI suggestions based on master data changes
func (h *MasterHandler) GetAISuggestions(c *gin.Context) {
	entityType := c.Param("entity_type")

	// This would use AI to suggest improvements based on master data
	suggestions := []map[string]interface{}{
		{
			"type": "reorder_level",
			"message": "Based on sales trends, consider increasing reorder level for Product A",
			"confidence": 0.85,
			"action": "update_reorder_level",
		},
		{
			"type": "category_assignment",
			"message": "Product B might fit better in Category X based on similar products",
			"confidence": 0.72,
			"action": "suggest_category",
		},
	}

	c.JSON(http.StatusOK, gin.H{"data": suggestions})
}

// ==================== DATA SYNC API ====================

// SyncMasterData synchronizes master data with external systems
func (h *MasterHandler) SyncMasterData(c *gin.Context) {
	entityType := c.Param("entity_type")
	syncType := c.Query("type") // full, incremental

	// This would trigger data sync with external systems
	syncResult := map[string]interface{}{
		"entity_type": entityType,
		"sync_type":   syncType,
		"records_synced": 150,
		"last_sync":   time.Now(),
		"status":      "completed",
	}

	// Publish sync event
	userID := getUserIDFromToken(c)
	event := &MasterDataEvent{
		EventType:  EventTypeBulk,
		EntityType: entityType,
		UserID:     userID,
		Timestamp:  time.Now(),
		Source:     "sync",
		Metadata: map[string]interface{}{
			"sync_type": syncType,
			"records_synced": syncResult["records_synced"],
		},
	}

	if err := h.eventService.OnEntityCreated("sync", fmt.Sprintf("sync_%d", time.Now().UnixNano()), userID, syncResult); err != nil {
		log.Printf("Failed to publish sync event: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"data": syncResult, "message": "Data sync completed"})
}

// ==================== EVENT ROUTES ====================

func setupEventRoutes(router *gin.Engine, handler *MasterHandler) {
	events := router.Group("/api/v1/events")

	// Event monitoring
	events.GET("/stats", handler.GetEventStats)
	events.GET("/:entity_type/:entity_id/history", handler.GetEventHistory)

	// Real-time subscriptions
	events.GET("/subscribe", handler.WebSocketSubscribe)

	// AI suggestions
	events.GET("/:entity_type/suggestions", handler.GetAISuggestions)

	// Data sync
	events.POST("/:entity_type/sync", handler.SyncMasterData)

	// Bulk operations
	events.POST("/bulk/delete", handler.BulkDeleteWithEvents)
}
