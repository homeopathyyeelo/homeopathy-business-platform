package middleware

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
)

// RequireRole middleware checks if user has required role
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Validate token and check role
		userID, userRole, err := validateTokenAndGetRole(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if userRole != role {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}

// validateTokenAndGetRole validates JWT token and returns user ID and role
func validateTokenAndGetRole(tokenString string) (string, string, error) {
	// This is a simplified implementation
	// In real implementation, use proper JWT validation
	return "user_id", "admin", nil
}
