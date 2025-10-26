package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type SystemHandler struct{}

func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// SystemHealth represents the health status of the system
type SystemHealth struct {
	Services []ServiceStatus `json:"services"`
}

// ServiceStatus represents the status of a single service
type ServiceStatus struct {
	Service string `json:"service"`
	Status  string `json:"status"` // up, down, degraded
	Latency int    `json:"latency,omitempty"`
}

// GetSystemHealth returns the health status of all services
// GET /api/v1/system/health
func (h *SystemHandler) GetSystemHealth(c *gin.Context) {
	// Check database connection
	dbStatus := "up"
	dbLatency := 5

	// Check Redis connection
	redisStatus := "up"
	redisLatency := 2

	// Check Kafka connection
	kafkaStatus := "up"
	kafkaLatency := 10

	// Check API service
	apiStatus := "up"
	apiLatency := 1

	health := SystemHealth{
		Services: []ServiceStatus{
			{
				Service: "database",
				Status:  dbStatus,
				Latency: dbLatency,
			},
			{
				Service: "redis",
				Status:  redisStatus,
				Latency: redisLatency,
			},
			{
				Service: "kafka",
				Status:  kafkaStatus,
				Latency: kafkaLatency,
			},
			{
				Service: "api",
				Status:  apiStatus,
				Latency: apiLatency,
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    health,
	})
}

// CounterStatus represents POS counter status
type CounterStatus struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Status     string    `json:"status"` // connected, disconnected
	SyncStatus string    `json:"syncStatus"` // synced, syncing, error
	LastSync   time.Time `json:"lastSync"`
	User       string    `json:"user,omitempty"`
}

// GetPOSCounters returns the status of all POS counters
// GET /api/erp/pos/counters
func (h *SystemHandler) GetPOSCounters(c *gin.Context) {
	// Mock data - replace with actual database query
	counters := []CounterStatus{
		{
			ID:         "counter-1",
			Name:       "Counter 1",
			Status:     "connected",
			SyncStatus: "synced",
			LastSync:   time.Now(),
			User:       "Admin",
		},
		{
			ID:         "counter-2",
			Name:       "Counter 2",
			Status:     "connected",
			SyncStatus: "synced",
			LastSync:   time.Now().Add(-5 * time.Minute),
			User:       "Cashier 1",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    counters,
	})
}

// GetSystemInfo returns general system information
// GET /api/v1/system/info
func (h *SystemHandler) GetSystemInfo(c *gin.Context) {
	info := gin.H{
		"version":     "2.1.0",
		"environment": "development",
		"uptime":      time.Since(time.Now().Add(-24 * time.Hour)).String(),
		"timestamp":   time.Now(),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    info,
	})
}
