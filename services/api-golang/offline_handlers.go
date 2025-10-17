// Offline Mode Handlers - Local storage, sync, and queue management
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// OfflineHandler handles offline mode operations
type OfflineHandler struct {
	db     *GORMDatabase
	cache  *CacheService
	storage *OfflineStorageService
	sync   *SyncService
}

// NewOfflineHandler creates a new offline handler
func NewOfflineHandler(db *GORMDatabase, cache *CacheService, storage *OfflineStorageService, sync *SyncService) *OfflineHandler {
	return &OfflineHandler{
		db:      db,
		cache:   cache,
		storage: storage,
		sync:    sync,
	}
}

// ==================== OFFLINE STATUS ====================

// GetOfflineStatus retrieves current offline mode status
func (h *OfflineHandler) GetOfflineStatus(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Check if we're currently offline
	isOffline := h.storage.IsOffline()

	// Get offline queue statistics
	queueStats := h.sync.GetQueueStats()

	// Get sync status
	syncStatus := h.sync.GetSyncStatus()

	status := map[string]interface{}{
		"is_offline":       isOffline,
		"offline_since":    h.storage.GetOfflineSince(),
		"queue_stats":      queueStats,
		"sync_status":      syncStatus,
		"local_storage_size": h.storage.GetStorageSize(),
		"last_sync":        h.sync.GetLastSyncTime(),
		"pending_operations": queueStats["pending_count"],
	}

	c.JSON(http.StatusOK, status)
}

// SetOfflineMode sets the application to offline mode
func (h *OfflineHandler) SetOfflineMode(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		EnableOffline bool `json:"enable_offline" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.EnableOffline {
		h.storage.EnableOffline()
		response := map[string]interface{}{
			"message":       "Offline mode enabled",
			"offline_since": time.Now(),
			"status":        "offline",
		}
		c.JSON(http.StatusOK, response)
	} else {
		h.storage.DisableOffline()
		response := map[string]interface{}{
			"message":     "Offline mode disabled",
			"status":      "online",
			"sync_status": "syncing",
		}
		c.JSON(http.StatusOK, response)
	}
}

// ==================== OFFLINE STORAGE ====================

// GetOfflineData retrieves locally stored data for offline use
func (h *OfflineHandler) GetOfflineData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	entityType := c.Param("entity_type")
	entityID := c.Query("entity_id")

	// Get data from offline storage
	data, err := h.storage.GetData(entityType, entityID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data not found in offline storage"})
		return
	}

	response := map[string]interface{}{
		"entity_type": entityType,
		"entity_id":   entityID,
		"data":        data,
		"cached_at":   time.Now(),
		"offline":     true,
	}

	c.JSON(http.StatusOK, response)
}

// StoreOfflineData stores data locally for offline use
func (h *OfflineHandler) StoreOfflineData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		EntityType string      `json:"entity_type" binding:"required"`
		EntityID   string      `json:"entity_id"`
		Data       interface{} `json:"data" binding:"required"`
		Timestamp  time.Time   `json:"timestamp"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Timestamp.IsZero() {
		request.Timestamp = time.Now()
	}

	// Store in offline storage
	err := h.storage.StoreData(request.EntityType, request.EntityID, request.Data, request.Timestamp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store offline data"})
		return
	}

	response := map[string]interface{}{
		"message":       "Data stored for offline use",
		"entity_type":   request.EntityType,
		"entity_id":     request.EntityID,
		"stored_at":     request.Timestamp,
		"storage_size":  h.storage.GetStorageSize(),
	}

	c.JSON(http.StatusCreated, response)
}

// ==================== OFFLINE QUEUE MANAGEMENT ====================

// GetOfflineQueue retrieves pending offline operations
func (h *OfflineHandler) GetOfflineQueue(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var operations []OfflineOperation
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&OfflineOperation{}).Where("status = ?", "pending")

	// Apply filters
	if operationType := c.Query("type"); operationType != "" {
		query = query.Where("operation_type = ?", operationType)
	}
	if entityType := c.Query("entity_type"); entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count offline operations"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at ASC").Find(&operations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve offline operations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"operations": operations,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// QueueOfflineOperation queues an operation for offline execution
func (h *OfflineHandler) QueueOfflineOperation(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var request struct {
		OperationType string      `json:"operation_type" binding:"required"`
		EntityType    string      `json:"entity_type" binding:"required"`
		EntityID      string      `json:"entity_id" binding:"required"`
		Data          interface{} `json:"data" binding:"required"`
		Priority      int         `json:"priority"` // 1 = high, 2 = medium, 3 = low
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Priority == 0 {
		request.Priority = 2 // Default to medium priority
	}

	// Create offline operation
	operation := OfflineOperation{
		OperationType: request.OperationType,
		EntityType:    request.EntityType,
		EntityID:      request.EntityID,
		Data:          request.Data,
		Status:        "pending",
		Priority:      request.Priority,
		RetryCount:    0,
		MaxRetries:    3,
		CreatedAt:     time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&operation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue offline operation"})
		return
	}

	response := map[string]interface{}{
		"message":         "Operation queued for offline execution",
		"operation_id":    operation.ID,
		"operation_type":  operation.OperationType,
		"entity_type":     operation.EntityType,
		"queued_at":       operation.CreatedAt,
		"queue_position":  operation.ID, // Simplified queue position
	}

	c.JSON(http.StatusCreated, response)
}

// ProcessOfflineQueue processes pending offline operations
func (h *OfflineHandler) ProcessOfflineQueue(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second) // Longer timeout for processing
	defer cancel()

	// Get pending operations
	var operations []OfflineOperation
	if err := h.db.DB.WithContext(ctx).Where("status = ?", "pending").Order("priority ASC, created_at ASC").Limit(10).Find(&operations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve pending operations"})
		return
	}

	processedCount := 0
	failedCount := 0

	for _, operation := range operations {
		// Process each operation
		err := h.processOfflineOperation(operation)
		if err != nil {
			// Update retry count
			operation.RetryCount++
			operation.LastError = err.Error()

			if operation.RetryCount >= operation.MaxRetries {
				operation.Status = "failed"
			}

			h.db.DB.Save(&operation)
			failedCount++
		} else {
			operation.Status = "completed"
			h.db.DB.Save(&operation)
			processedCount++
		}
	}

	response := map[string]interface{}{
		"message":           "Offline queue processing completed",
		"processed_count":   processedCount,
		"failed_count":      failedCount,
		"total_operations":  len(operations),
		"processed_at":      time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== SYNC MANAGEMENT ====================

// SyncOfflineData synchronizes offline data with server
func (h *OfflineHandler) SyncOfflineData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second) // Longer timeout for sync
	defer cancel()

	var request struct {
		ForceFullSync bool `json:"force_full_sync"` // Force complete resync
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initiate sync process
	syncResult := h.sync.SyncOfflineData(request.ForceFullSync)

	response := map[string]interface{}{
		"message":           "Data synchronization initiated",
		"sync_id":           syncResult.SyncID,
		"sync_type":         syncResult.SyncType,
		"status":            syncResult.Status,
		"estimated_duration": "2-5 minutes",
		"started_at":        syncResult.StartedAt,
	}

	c.JSON(http.StatusAccepted, response)
}

// GetSyncStatus retrieves current sync status
func (h *OfflineHandler) GetSyncStatus(c *gin.Context) {
	syncStatus := h.sync.GetSyncStatus()

	c.JSON(http.StatusOK, syncStatus)
}

// ==================== CONFLICT RESOLUTION ====================

// GetSyncConflicts retrieves data conflicts for resolution
func (h *OfflineHandler) GetSyncConflicts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var conflicts []SyncConflict
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&SyncConflict{}).Where("status = ?", "pending")

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count sync conflicts"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("detected_at DESC").Find(&conflicts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sync conflicts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conflicts": conflicts,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// ResolveSyncConflict resolves a data conflict
func (h *OfflineHandler) ResolveSyncConflict(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	conflictID := c.Param("conflict_id")

	var request struct {
		Resolution   string `json:"resolution" binding:"required"` // "local", "remote", "merge"
		ResolvedData interface{} `json:"resolved_data"`
		Notes        string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find conflict
	var conflict SyncConflict
	if err := h.db.DB.WithContext(ctx).Where("id = ?", conflictID).First(&conflict).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sync conflict not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sync conflict"})
		return
	}

	// Resolve conflict based on resolution strategy
	err := h.resolveConflict(conflict, request.Resolution, request.ResolvedData, request.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve conflict"})
		return
	}

	response := map[string]interface{}{
		"message":       "Conflict resolved successfully",
		"conflict_id":   conflictID,
		"resolution":    request.Resolution,
		"resolved_at":   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== OFFLINE REPORTING ====================

// GetOfflineReports retrieves reports that can be generated offline
func (h *OfflineHandler) GetOfflineReports(c *gin.Context) {
	reports := []map[string]interface{}{
		{
			"id":          "daily_sales",
			"name":        "Daily Sales Summary",
			"description": "Sales summary for the current day",
			"data_source": "local",
			"requires_sync": false,
		},
		{
			"id":          "inventory_status",
			"name":        "Inventory Status",
			"description": "Current inventory levels and alerts",
			"data_source": "local",
			"requires_sync": false,
		},
		{
			"id":          "customer_ledger",
			"name":        "Customer Ledger",
			"description": "Customer transaction history",
			"data_source": "local",
			"requires_sync": false,
		},
		{
			"id":          "sync_status",
			"name":        "Sync Status Report",
			"description": "Synchronization status and conflicts",
			"data_source": "local",
			"requires_sync": false,
		},
	}

	c.JSON(http.StatusOK, reports)
}

// GenerateOfflineReport generates a report using offline data
func (h *OfflineHandler) GenerateOfflineReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	reportID := c.Param("report_id")

	var request struct {
		Parameters map[string]interface{} `json:"parameters"`
		Format     string                 `json:"format"` // pdf, excel, json
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate report using offline data
	report, err := h.generateOfflineReport(reportID, request.Parameters, request.Format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate offline report"})
		return
	}

	response := map[string]interface{}{
		"report_id":   reportID,
		"report":      report,
		"generated_at": time.Now(),
		"offline":     true,
		"format":      request.Format,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== UTILITY FUNCTIONS ====================

func (h *OfflineHandler) processOfflineOperation(operation OfflineOperation) error {
	// Process different types of offline operations
	switch operation.OperationType {
	case "create":
		return h.processCreateOperation(operation)
	case "update":
		return h.processUpdateOperation(operation)
	case "delete":
		return h.processDeleteOperation(operation)
	default:
		return fmt.Errorf("unsupported operation type: %s", operation.OperationType)
	}
}

func (h *OfflineHandler) processCreateOperation(operation OfflineOperation) error {
	// In a real implementation, this would create the entity
	// For now, just log the operation
	fmt.Printf("Processing CREATE operation for %s:%s\n", operation.EntityType, operation.EntityID)
	return nil
}

func (h *OfflineHandler) processUpdateOperation(operation OfflineOperation) error {
	// In a real implementation, this would update the entity
	fmt.Printf("Processing UPDATE operation for %s:%s\n", operation.EntityType, operation.EntityID)
	return nil
}

func (h *OfflineHandler) processDeleteOperation(operation OfflineOperation) error {
	// In a real implementation, this would delete the entity
	fmt.Printf("Processing DELETE operation for %s:%s\n", operation.EntityType, operation.EntityID)
	return nil
}

func (h *OfflineHandler) resolveConflict(conflict SyncConflict, resolution string, resolvedData interface{}, notes string) error {
	// Apply conflict resolution
	conflict.Status = "resolved"
	conflict.Resolution = resolution
	conflict.ResolvedData = resolvedData
	conflict.Notes = notes
	conflict.ResolvedAt = time.Now()

	// In a real implementation, this would apply the resolved data
	return nil
}

func (h *OfflineHandler) generateOfflineReport(reportID string, parameters map[string]interface{}, format string) (interface{}, error) {
	// Generate report using offline data
	report := map[string]interface{}{
		"report_id":   reportID,
		"parameters":  parameters,
		"format":      format,
		"data":        "Offline report data would be generated here",
		"generated_at": time.Now(),
	}

	return report, nil
}

// ==================== OFFLINE STORAGE OPERATIONS ====================

// SaveOfflineData saves data for offline use
func (h *OfflineHandler) SaveOfflineData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	entityType := c.Param("entity_type")
	entityID := c.Param("entity_id")

	var data interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Save to offline storage
	err := h.storage.StoreData(entityType, entityID, data, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save offline data"})
		return
	}

	response := map[string]interface{}{
		"message":     "Data saved for offline use",
		"entity_type": entityType,
		"entity_id":   entityID,
		"saved_at":    time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// DeleteOfflineData removes data from offline storage
func (h *OfflineHandler) DeleteOfflineData(c *gin.Context) {
	entityType := c.Param("entity_type")
	entityID := c.Param("entity_id")

	err := h.storage.DeleteData(entityType, entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete offline data"})
		return
	}

	response := map[string]interface{}{
		"message":     "Data removed from offline storage",
		"entity_type": entityType,
		"entity_id":   entityID,
		"deleted_at":  time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== DATA STRUCTURES ====================

// OfflineOperation represents an operation queued for offline execution
type OfflineOperation struct {
	BaseEntity
	OperationType string      `gorm:"not null;size:50" json:"operation_type" validate:"required"`
	EntityType    string      `gorm:"not null;size:50" json:"entity_type" validate:"required"`
	EntityID      string      `gorm:"not null;size:100" json:"entity_id" validate:"required"`
	Data          interface{} `gorm:"type:jsonb" json:"data"`
	Status        string      `gorm:"not null;size:20" json:"status" validate:"oneof=pending processing completed failed"`
	Priority      int         `gorm:"default:2" json:"priority"` // 1 = high, 2 = medium, 3 = low
	RetryCount    int         `gorm:"default:0" json:"retry_count"`
	MaxRetries    int         `gorm:"default:3" json:"max_retries"`
	LastError     string      `gorm:"type:text" json:"last_error"`
	ProcessedAt   *time.Time  `gorm:"null" json:"processed_at"`
}

// SyncConflict represents data synchronization conflicts
type SyncConflict struct {
	BaseEntity
	EntityType     string      `gorm:"not null;size:50" json:"entity_type" validate:"required"`
	EntityID       string      `gorm:"not null;size:100" json:"entity_id" validate:"required"`
	LocalData      interface{} `gorm:"type:jsonb" json:"local_data"`
	RemoteData     interface{} `gorm:"type:jsonb" json:"remote_data"`
	ConflictType   string      `gorm:"not null;size:50" json:"conflict_type" validate:"required"`
	Status         string      `gorm:"not null;size:20" json:"status" validate:"oneof=pending resolved ignored"`
	Resolution     string      `gorm:"size:50" json:"resolution"`
	ResolvedData   interface{} `gorm:"type:jsonb" json:"resolved_data"`
	Notes          string      `gorm:"type:text" json:"notes"`
	DetectedAt     time.Time   `gorm:"not null" json:"detected_at"`
	ResolvedAt     *time.Time  `gorm:"null" json:"resolved_at"`
}

// SyncResult represents synchronization operation results
type SyncResult struct {
	SyncID         string                 `json:"sync_id"`
	SyncType       string                 `json:"sync_type"`
	Status         string                 `json:"status"`
	StartedAt      time.Time              `json:"started_at"`
	CompletedAt    *time.Time             `json:"completed_at"`
	EntitiesSynced int                    `json:"entities_synced"`
	ConflictsFound int                    `json:"conflicts_found"`
	Errors         []string               `json:"errors"`
	Statistics     map[string]interface{} `json:"statistics"`
}
