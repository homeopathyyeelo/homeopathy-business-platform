package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type OutboxEventService struct {
	db *gorm.DB
}

func NewOutboxEventService() *OutboxEventService {
	return &OutboxEventService{
		db: database.GetDB(),
	}
}

func (s *OutboxEventService) ListOutboxEvents(page, limit int, search, aggregateType, eventType, status string) ([]models.OutboxEvent, int64, error) {
	var outboxEvents []models.OutboxEvent
	var total int64

	query := s.db.Model(&models.OutboxEvent{})

	if search != "" {
		query = query.Where("aggregate_type ILIKE ? OR event_type ILIKE ? OR payload ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if aggregateType != "" {
		query = query.Where("aggregate_type = ?", aggregateType)
	}
	if eventType != "" {
		query = query.Where("event_type = ?", eventType)
	}
	if status == "published" {
		query = query.Where("published_at IS NOT NULL")
	} else if status == "unpublished" {
		query = query.Where("published_at IS NULL")
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&outboxEvents).Error

	return outboxEvents, total, err
}

func (s *OutboxEventService) GetOutboxEventByID(id string) (*models.OutboxEvent, error) {
	var outboxEvent models.OutboxEvent
	err := s.db.Where("id = ?", id).First(&outboxEvent).Error
	return &outboxEvent, err
}

func (s *OutboxEventService) RetryOutboxEvent(id string) error {
	// Reset retry count and published_at for retry
	return s.db.Model(&models.OutboxEvent{}).Where("id = ?", id).Updates(map[string]interface{}{
		"retry_count":  0,
		"published_at": nil,
		"last_error":   "",
	}).Error
}

func (s *OutboxEventService) DeleteOutboxEvent(id string) error {
	return s.db.Delete(&models.OutboxEvent{}, "id = ?", id).Error
}

func (s *OutboxEventService) GetEventStats() (map[string]interface{}, error) {
	var stats struct {
		Total        int64 `json:"total"`
		Published     int64 `json:"published"`
		Unpublished  int64 `json:"unpublished"`
		Failed       int64 `json:"failed"`
		RetryPending int64 `json:"retryPending"`
	}

	// Total events
	s.db.Model(&models.OutboxEvent{}).Count(&stats.Total)

	// Published events
	s.db.Model(&models.OutboxEvent{}).Where("published_at IS NOT NULL").Count(&stats.Published)

	// Unpublished events
	s.db.Model(&models.OutboxEvent{}).Where("published_at IS NULL").Count(&stats.Unpublished)

	// Failed events (max retries reached)
	s.db.Model(&models.OutboxEvent{}).Where("retry_count >= max_retries AND published_at IS NULL").Count(&stats.Failed)

	// Retry pending (unpublished with retry count < max retries)
	s.db.Model(&models.OutboxEvent{}).Where("retry_count < max_retries AND published_at IS NULL").Count(&stats.RetryPending)

	return map[string]interface{}{
		"total":        stats.Total,
		"published":    stats.Published,
		"unpublished":  stats.Unpublished,
		"failed":       stats.Failed,
		"retryPending": stats.RetryPending,
		"successRate":  float64(stats.Published) / float64(stats.Total) * 100,
	}, nil
}
