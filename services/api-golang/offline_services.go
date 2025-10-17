// Offline Mode Services - Storage, sync, and queue management services
package main

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// OfflineStorageService handles local data storage for offline mode
type OfflineStorageService struct {
	storagePath string
	isOffline   bool
	offlineSince time.Time
	mutex       sync.RWMutex
}

// NewOfflineStorageService creates a new offline storage service
func NewOfflineStorageService(storagePath string) *OfflineStorageService {
	return &OfflineStorageService{
		storagePath: storagePath,
		isOffline:   false,
	}
}

// EnableOffline enables offline mode
func (s *OfflineStorageService) EnableOffline() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.isOffline = true
	s.offlineSince = time.Now()
}

// DisableOffline disables offline mode
func (s *OfflineStorageService) DisableOffline() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.isOffline = false
}

// IsOffline checks if currently in offline mode
func (s *OfflineStorageService) IsOffline() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s.isOffline
}

// GetOfflineSince returns when offline mode was enabled
func (s *OfflineStorageService) GetOfflineSince() time.Time {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s.offlineSince
}

// StoreData stores data for offline use
func (s *OfflineStorageService) StoreData(entityType, entityID string, data interface{}, timestamp time.Time) error {
	// In a real implementation, this would store data to local storage (IndexedDB, local file, etc.)
	// For now, just log the operation
	fmt.Printf("Storing offline data: %s:%s at %v\n", entityType, entityID, timestamp)
	return nil
}

// GetData retrieves data from offline storage
func (s *OfflineStorageService) GetData(entityType, entityID string) (interface{}, error) {
	// In a real implementation, this would retrieve data from local storage
	// For now, return mock data
	mockData := map[string]interface{}{
		"id":   entityID,
		"type": entityType,
		"data": "Offline data would be retrieved here",
	}
	return mockData, nil
}

// DeleteData removes data from offline storage
func (s *OfflineStorageService) DeleteData(entityType, entityID string) error {
	// In a real implementation, this would delete data from local storage
	fmt.Printf("Deleting offline data: %s:%s\n", entityType, entityID)
	return nil
}

// GetStorageSize returns the current storage size
func (s *OfflineStorageService) GetStorageSize() int64 {
	// In a real implementation, this would calculate actual storage size
	return 1024 * 1024 * 50 // 50MB mock size
}

// SyncService handles data synchronization between offline and online modes
type SyncService struct {
	queueMutex sync.RWMutex
	lastSync   time.Time
}

// NewSyncService creates a new sync service
func NewSyncService() *SyncService {
	return &SyncService{
		lastSync: time.Now(),
	}
}

// SyncOfflineData synchronizes offline data with server
func (s *SyncService) SyncOfflineData(forceFullSync bool) *SyncResult {
	syncID := fmt.Sprintf("sync_%d", time.Now().Unix())

	result := &SyncResult{
		SyncID:    syncID,
		SyncType:  "incremental",
		Status:    "in_progress",
		StartedAt: time.Now(),
	}

	if forceFullSync {
		result.SyncType = "full"
	}

	// In a real implementation, this would:
	// 1. Get all offline operations
	// 2. Sync data with server
	// 3. Handle conflicts
	// 4. Update local storage

	// Simulate sync completion
	go func() {
		time.Sleep(10 * time.Second)

		result.Status = "completed"
		result.EntitiesSynced = 150
		result.ConflictsFound = 3
		result.Statistics = map[string]interface{}{
			"uploaded_records": 150,
			"downloaded_records": 25,
			"conflicts_resolved": 3,
			"sync_duration": "10s",
		}
		completedAt := time.Now()
		result.CompletedAt = &completedAt

		s.lastSync = time.Now()
	}()

	return result
}

// GetSyncStatus returns current synchronization status
func (s *SyncService) GetSyncStatus() map[string]interface{} {
	return map[string]interface{}{
		"status":        "idle",
		"last_sync":     s.lastSync,
		"next_sync":     s.lastSync.Add(5 * time.Minute),
		"sync_enabled":  true,
		"auto_sync":     true,
		"sync_interval": "5 minutes",
	}
}

// GetQueueStats returns statistics about the offline operation queue
func (s *SyncService) GetQueueStats() map[string]interface{} {
	return map[string]interface{}{
		"pending_count":   25,
		"processing_count": 0,
		"completed_count": 150,
		"failed_count":     3,
		"queue_size":      "25 operations",
		"oldest_operation": time.Now().Add(-30 * time.Minute),
	}
}

// GetLastSyncTime returns the last synchronization time
func (s *SyncService) GetLastSyncTime() time.Time {
	return s.lastSync
}
