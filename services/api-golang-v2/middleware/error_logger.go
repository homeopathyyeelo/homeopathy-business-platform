package middleware

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/gin-gonic/gin"
)

type ErrorLogger struct {
	db *sql.DB
}

func NewErrorLogger(db *sql.DB) *ErrorLogger {
	return &ErrorLogger{db: db}
}

func (m *ErrorLogger) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Log 4xx and 5xx errors
		if c.Writer.Status() >= 400 {
			go m.logError(c)
		}
	}
}

func (m *ErrorLogger) logError(c *gin.Context) {
	metadata := map[string]interface{}{
		"path":         c.Request.URL.Path,
		"method":       c.Request.Method,
		"query":        c.Request.URL.RawQuery,
		"user_agent":   c.Request.UserAgent(),
		"content_type": c.ContentType(),
	}

	metadataJSON, _ := json.Marshal(metadata)

	logLevel := "ERROR"
	if c.Writer.Status() >= 500 {
		logLevel = "FATAL"
	} else if c.Writer.Status() >= 400 {
		logLevel = "WARN"
	}

	_, err := m.db.Exec(`
		INSERT INTO application_logs (
			service_name, log_level, message, http_status, 
			request_id, ip_address, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`,
		"api-golang-v2",
		logLevel,
		c.Errors.String(),
		c.Writer.Status(),
		c.GetString("request_id"),
		c.ClientIP(),
		metadataJSON,
		time.Now(),
	)

	if err != nil {
		// Fallback to stderr if DB insert fails
		println("[ERROR] Failed to log to DB:", err.Error())
	}
}
