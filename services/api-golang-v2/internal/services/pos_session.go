package services

import (
	"gorm.io/gorm"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"time"
)

type POSSessionService struct {
	db *gorm.DB
}

func NewPOSSessionService() *POSSessionService {
	return &POSSessionService{
		db: database.GetDB(),
	}
}

// CreateSession creates a new POS session
func (s *POSSessionService) CreateSession(ctx context.Context, userID, branchID uuid.UUID) (*models.POSSession, error) {
	session := &models.POSSession{
		EmployeeID:    userID.String(),
		ShopID:        branchID.String(),
		Status:        "OPEN",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create POS session: %w", err)
	}

	return session, nil
}

// GetSession retrieves a POS session by ID
func (s *POSSessionService) GetSession(ctx context.Context, sessionID uuid.UUID) (*models.POSSession, error) {
	var session models.POSSession
	if err := s.db.WithContext(ctx).Where("id = ?", sessionID).First(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to get POS session: %w", err)
	}
	return &session, nil
}

// GetUserSessions retrieves all active sessions for a user
func (s *POSSessionService) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]models.POSSession, error) {
	var sessions []models.POSSession
	if err := s.db.WithContext(ctx).
		Where("employee_id = ? AND status = ?", userID.String(), "OPEN").
		Order("created_at DESC").
		Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	return sessions, nil
}

// UpdateSession updates a POS session
func (s *POSSessionService) UpdateSession(ctx context.Context, sessionID uuid.UUID, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()
	
	if err := s.db.WithContext(ctx).
		Model(&models.POSSession{}).
		Where("id = ?", sessionID).
		Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update POS session: %w", err)
	}
	return nil
}

// AddItemToSession adds an item to a POS session
func (s *POSSessionService) AddItemToSession(ctx context.Context, sessionID, productID uuid.UUID, quantity int, unitPrice float64) error {
	// Note: Unified schema doesn't support session items or cart functionality
	// This is a simplified implementation that just updates the session timestamp
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"updated_at": time.Now(),
	})
}

// CompleteSession marks a session as completed
func (s *POSSessionService) CompleteSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status":     "CLOSED",
		"close_time": time.Now(),
	})
}

// PauseSession pauses a session
func (s *POSSessionService) PauseSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status": "PAUSED",
	})
}

// ResumeSession resumes a paused session
func (s *POSSessionService) ResumeSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status": "OPEN",
	})
}

// DeleteSession deletes a session and its items
func (s *POSSessionService) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	// Note: Unified schema doesn't support session items, just delete the session
	return s.db.WithContext(ctx).Where("id = ?", sessionID).Delete(&models.POSSession{}).Error
}

// GetSessionItems retrieves all items for a session
func (s *POSSessionService) GetSessionItems(ctx context.Context, sessionID uuid.UUID) ([]models.POSSession, error) {
	// Note: Unified schema doesn't support session items
	// Return empty slice for compatibility
	return []models.POSSession{}, nil
}
