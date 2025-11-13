package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID             string                 `json:"id" gorm:"type:uuid;primaryKey"`
	UserID         *string                `json:"user_id" gorm:"type:uuid"`
	Action         string                 `json:"action"`
	EntityType     string                 `json:"entity_type"`
	EntityID       *string                `json:"entity_id" gorm:"type:uuid"`
	OldValue       map[string]interface{} `json:"old_value" gorm:"type:jsonb"`
	NewValue       map[string]interface{} `json:"new_value" gorm:"type:jsonb"`
	Changes        map[string]interface{} `json:"changes" gorm:"type:jsonb"`
	IPAddress      string                 `json:"ip_address"`
	UserAgent      string                 `json:"user_agent"`
	SessionID      string                 `json:"session_id"`
	RequestID      string                 `json:"request_id"`
	APIEndpoint    string                 `json:"api_endpoint"`
	HTTPMethod     string                 `json:"http_method"`
	ResponseStatus int                    `json:"response_status"`
	ErrorMessage   string                 `json:"error_message"`
	Metadata       map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt      time.Time              `json:"created_at"`
}

// AuditLogger middleware logs all API requests
func AuditLogger(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip health checks and static files
		if c.Request.URL.Path == "/health" || c.Request.URL.Path == "/ready" {
			c.Next()
			return
		}

		requestID := uuid.New().String()
		c.Set("request_id", requestID)

		// Capture request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Capture response
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		start := time.Now()
		c.Next()
		latency := time.Since(start)

		// Get user ID from context (set by auth middleware)
		var userID *string
		if val, exists := c.Get("user_id"); exists {
			if id, ok := val.(string); ok {
				userID = &id
			}
		}

		// Determine action from HTTP method
		action := getActionFromMethod(c.Request.Method)

		// Create audit log
		log := AuditLog{
			ID:             requestID,
			UserID:         userID,
			Action:         action,
			EntityType:     extractEntityType(c.Request.URL.Path),
			APIEndpoint:    c.Request.URL.Path,
			HTTPMethod:     c.Request.Method,
			ResponseStatus: c.Writer.Status(),
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
			RequestID:      requestID,
			Metadata: map[string]interface{}{
				"latency_ms":   latency.Milliseconds(),
				"request_body": string(requestBody),
				"query_params": c.Request.URL.Query(),
			},
			CreatedAt: time.Now(),
		}

		// Log errors
		if len(c.Errors) > 0 {
			log.ErrorMessage = c.Errors.String()
		}

		// Save to database (async to avoid blocking)
		go func() {
			db.Create(&log)
		}()
	}
}

// LogAction manually logs a specific action (for business logic)
func LogAction(db *gorm.DB, userID, action, entityType, entityID string, oldValue, newValue map[string]interface{}) {
	log := AuditLog{
		ID:         uuid.New().String(),
		UserID:     &userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   &entityID,
		OldValue:   oldValue,
		NewValue:   newValue,
		Changes:    calculateChanges(oldValue, newValue),
		CreatedAt:  time.Now(),
	}

	db.Create(&log)
}

func getActionFromMethod(method string) string {
	switch method {
	case "POST":
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	case "GET":
		return "read"
	default:
		return "unknown"
	}
}

func extractEntityType(path string) string {
	// Extract entity from path like /api/erp/products/123
	// Return "products"
	parts := splitPath(path)
	if len(parts) >= 3 {
		return parts[2]
	}
	return "unknown"
}

func splitPath(path string) []string {
	var parts []string
	current := ""
	for _, char := range path {
		if char == '/' {
			if current != "" {
				parts = append(parts, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}
	return parts
}

func calculateChanges(old, new map[string]interface{}) map[string]interface{} {
	changes := make(map[string]interface{})
	for key, newVal := range new {
		if oldVal, exists := old[key]; exists {
			if !equals(oldVal, newVal) {
				changes[key] = map[string]interface{}{
					"from": oldVal,
					"to":   newVal,
				}
			}
		} else {
			changes[key] = map[string]interface{}{
				"from": nil,
				"to":   newVal,
			}
		}
	}
	return changes
}

func equals(a, b interface{}) bool {
	aJSON, _ := json.Marshal(a)
	bJSON, _ := json.Marshal(b)
	return string(aJSON) == string(bJSON)
}

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}
