package services

import (
	"gorm.io/gorm"
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/datatypes"
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
	cartData := datatypes.JSON(json.RawMessage(`{"items":[],"totals":{}}`))
	session := &models.POSSession{
		UserID:   userID,
		BranchID: branchID,
		Status:   "active",
		CartData: cartData,
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
		Where("user_id = ? AND status = ?", userID, "active").
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
	// Start transaction
	tx := s.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get product details
	var product models.Product
	if err := tx.Where("id = ?", productID).First(&product).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("product not found: %w", err)
	}

	// Calculate line total
	lineTotal := float64(quantity) * unitPrice

	// Create session item
	sessionItem := &models.POSSessionItem{
		SessionID:   sessionID,
		ProductID:   productID,
		ProductName: product.Name,
		Quantity:    quantity,
		UnitPrice:   unitPrice,
		LineTotal:   lineTotal,
	}

	if err := tx.Create(sessionItem).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to add item to session: %w", err)
	}

	// Update session totals
	if err := tx.Model(&models.POSSession{}).
		Where("id = ?", sessionID).
		Updates(map[string]interface{}{
			"total_amount": tx.Raw("total_amount + ?", lineTotal),
			"item_count":   tx.Raw("item_count + ?", quantity),
			"updated_at":   time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update session totals: %w", err)
	}

	return tx.Commit().Error
}

// CompleteSession marks a session as completed
func (s *POSSessionService) CompleteSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status": "completed",
	})
}

// PauseSession pauses a session
func (s *POSSessionService) PauseSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status": "paused",
	})
}

// ResumeSession resumes a paused session
func (s *POSSessionService) ResumeSession(ctx context.Context, sessionID uuid.UUID) error {
	return s.UpdateSession(ctx, sessionID, map[string]interface{}{
		"status": "active",
	})
}

// DeleteSession deletes a session and its items
func (s *POSSessionService) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	tx := s.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete session items
	if err := tx.Where("session_id = ?", sessionID).Delete(&models.POSSessionItem{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete session items: %w", err)
	}

	// Delete session
	if err := tx.Where("id = ?", sessionID).Delete(&models.POSSession{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return tx.Commit().Error
}

// GetSessionItems retrieves all items for a session
func (s *POSSessionService) GetSessionItems(ctx context.Context, sessionID uuid.UUID) ([]models.POSSessionItem, error) {
	var items []models.POSSessionItem
	if err := s.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to get session items: %w", err)
	}
	return items, nil
}
