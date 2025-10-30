// Multi-PC Sharing Services - Session management, sync, and device coordination
package services

import (
	"sync"
	"time"
)

// SharedSessionStore manages shared sessions across multiple devices
type SharedSessionStore struct {
	sessions map[string][]string // sessionID -> deviceIDs
	mutex    sync.RWMutex
}

// NewSharedSessionStore creates a new shared session store
func NewSharedSessionStore() *SharedSessionStore {
	return &SharedSessionStore{
		sessions: make(map[string][]string),
	}
}

// CreateSession creates a new shared session
func (s *SharedSessionStore) CreateSession(sessionID string, deviceIDs []string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.sessions[sessionID] = deviceIDs
}

// AddDeviceToSession adds a device to an existing session
func (s *SharedSessionStore) AddDeviceToSession(sessionID, deviceID string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	devices := s.sessions[sessionID]
	// Check if device already exists
	for _, existingDeviceID := range devices {
		if existingDeviceID == deviceID {
			return // Device already in session
		}
	}

	s.sessions[sessionID] = append(devices, deviceID)
}

// RemoveDeviceFromSession removes a device from a session
func (s *SharedSessionStore) RemoveDeviceFromSession(sessionID, deviceID string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	devices := s.sessions[sessionID]
	newDevices := make([]string, 0, len(devices)-1)

	for _, existingDeviceID := range devices {
		if existingDeviceID != deviceID {
			newDevices = append(newDevices, existingDeviceID)
		}
	}

	if len(newDevices) == 0 {
		delete(s.sessions, sessionID)
	} else {
		s.sessions[sessionID] = newDevices
	}
}

// GetSessionDevices retrieves all devices in a session
func (s *SharedSessionStore) GetSessionDevices(sessionID string) []string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	devices, exists := s.sessions[sessionID]
	if !exists {
		return []string{}
	}

	// Return a copy to prevent external modification
	result := make([]string, len(devices))
	copy(result, devices)
	return result
}

// GetActiveSessions retrieves all active sessions
func (s *SharedSessionStore) GetActiveSessions() []string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	sessions := make([]string, 0, len(s.sessions))
	for sessionID := range s.sessions {
		sessions = append(sessions, sessionID)
	}

	return sessions
}

// PCSyncManager manages synchronization across multiple PCs
type PCSyncManager struct {
	notifications chan SyncNotification
	listeners     map[string][]chan SyncNotification
	mutex         sync.RWMutex
}

// SyncNotification represents a synchronization notification
type SyncNotification struct {
	SessionID string                 `json:"session_id"`
	EventType string                 `json:"event_type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// NewPCSyncManager creates a new PC sync manager
func NewPCSyncManager() *PCSyncManager {
	manager := &PCSyncManager{
		notifications: make(chan SyncNotification, 1000),
		listeners:     make(map[string][]chan SyncNotification),
	}

	// Start notification processor
	go manager.processNotifications()

	return manager
}

// NotifySessionUpdate sends a notification to all devices in a session
func (m *PCSyncManager) NotifySessionUpdate(sessionID, eventType string, data map[string]interface{}) {
	notification := SyncNotification{
		SessionID: sessionID,
		EventType: eventType,
		Data:      data,
		Timestamp: time.Now(),
	}

	select {
	case m.notifications <- notification:
	default:
		// Channel full, drop notification
	}
}

// NotifyCartUpdate sends a cart update notification
func (m *PCSyncManager) NotifyCartUpdate(sessionID, eventType string, data map[string]interface{}) {
	m.NotifySessionUpdate(sessionID, eventType, data)
}

// SubscribeToSession subscribes to notifications for a session
func (m *PCSyncManager) SubscribeToSession(sessionID string, listener chan SyncNotification) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	listeners := m.listeners[sessionID]
	m.listeners[sessionID] = append(listeners, listener)
}

// UnsubscribeFromSession unsubscribes from session notifications
func (m *PCSyncManager) UnsubscribeFromSession(sessionID string, listener chan SyncNotification) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	listeners := m.listeners[sessionID]
	newListeners := make([]chan SyncNotification, 0, len(listeners)-1)

	for _, existingListener := range listeners {
		if existingListener != listener {
			newListeners = append(newListeners, existingListener)
		}
	}

	if len(newListeners) == 0 {
		delete(m.listeners, sessionID)
	} else {
		m.listeners[sessionID] = newListeners
	}
}

// processNotifications processes incoming notifications
func (m *PCSyncManager) processNotifications() {
	for notification := range m.notifications {
		m.mutex.RLock()
		listeners := m.listeners[notification.SessionID]
		m.mutex.RUnlock()

		// Send notification to all listeners for this session
		for _, listener := range listeners {
			select {
			case listener <- notification:
			default:
				// Listener channel full, skip
			}
		}
	}
}

// GetSessionStats returns statistics about session activity
func (m *PCSyncManager) GetSessionStats(sessionID string) map[string]interface{} {
	m.mutex.RLock()
	listeners := m.listeners[sessionID]
	m.mutex.RUnlock()

	return map[string]interface{}{
		"session_id":        sessionID,
		"connected_devices": len(listeners),
		"active_listeners":  len(listeners),
		"last_notification": time.Now(),
	}
}
