package services

import (
    "time"

    "gorm.io/gorm"

    "github.com/yeelo/homeopathy-erp/internal/database"
    "github.com/yeelo/homeopathy-erp/internal/models"
)

// SessionService manages persisted user sessions.
type SessionService struct {
    db *gorm.DB
}

// NewSessionService creates a new session service instance.
func NewSessionService() *SessionService {
    return &SessionService{db: database.GetDB()}
}

// CreateSession stores a new session row for the issued token.
func (s *SessionService) CreateSession(token, userID string, expiresAt time.Time) error {
    if s.db == nil {
        s.db = database.GetDB()
    }

    session := &models.Session{
        UserID:    userID,
        Token:     token,
        ExpiresAt: expiresAt,
    }
    return s.db.Create(session).Error
}

// DeleteSessionByToken removes a session matching the provided token.
func (s *SessionService) DeleteSessionByToken(token string) error {
    if s.db == nil {
        s.db = database.GetDB()
    }

    return s.db.Where("token = ?", token).Delete(&models.Session{}).Error
}

// DeleteSessionsForUser removes all sessions owned by the given user.
func (s *SessionService) DeleteSessionsForUser(userID string) error {
    if s.db == nil {
        s.db = database.GetDB()
    }

    return s.db.Where("user_id = ?", userID).Delete(&models.Session{}).Error
}

// GetSessionByToken fetches an active session if it exists and is not expired.
func (s *SessionService) GetSessionByToken(token string) (*models.Session, error) {
    if s.db == nil {
        s.db = database.GetDB()
    }

    var session models.Session
    err := s.db.Where("token = ?", token).First(&session).Error
    if err != nil {
        return nil, err
    }

    if time.Now().After(session.ExpiresAt) {
        // session expired: clean up and signal error
        _ = s.DeleteSessionByToken(token)
        return nil, gorm.ErrRecordNotFound
    }

    return &session, nil
}
