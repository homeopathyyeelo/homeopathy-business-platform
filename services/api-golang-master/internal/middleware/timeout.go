package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware adds a timeout to request contexts
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if endpoint should skip timeout
		if noTimeout, exists := c.Get("no_timeout"); exists && noTimeout.(bool) {
			c.Next()
			return
		}
		
		// Create a context with timeout
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// Replace request context with timeout context
		c.Request = c.Request.WithContext(ctx)

		// Create a channel to signal completion
		finished := make(chan struct{})

		go func() {
			c.Next()
			close(finished)
		}()

		select {
		case <-finished:
			// Request completed successfully
			return
		case <-ctx.Done():
			// Timeout occurred
			if ctx.Err() == context.DeadlineExceeded {
				c.JSON(http.StatusRequestTimeout, gin.H{
					"success": false,
					"error":   "Request timeout",
					"code":    "TIMEOUT",
				})
				c.Abort()
			}
		}
	}
}

// DefaultTimeout returns middleware with 30 second timeout
func DefaultTimeout() gin.HandlerFunc {
	return TimeoutMiddleware(30 * time.Second)
}
