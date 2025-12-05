package middleware

import (
	"net/http"
	"strings"
	"time"

	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Claims structure for JWT
type Claims struct {
	UserID       string   `json:"user_id"`
	Email        string   `json:"email"`
	Role         string   `json:"role"`
	Permissions  []string `json:"permissions"`
	IsSuperAdmin bool     `json:"isSuperAdmin"`
	jwt.RegisteredClaims
}

// RequireAuth is a simple wrapper that returns an auth middleware without db dependency
// For routes that just need authentication but don't use RBAC features
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try cookie first, then Authorization header
		tokenString, err := c.Cookie("auth-token")
		if err != nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"error":   "No authentication token provided",
				})
				c.Abort()
				return
			}
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// Parse and validate JWT
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "your-secret-key-change-in-production"
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid token claims",
			})
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_permissions", claims.Permissions)
		c.Set("is_super_admin", claims.IsSuperAdmin)

		c.Next()
	}
}

// RBACMiddleware validates JWT and extracts user context
func RBACMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try cookie first, then Authorization header
		tokenString, err := c.Cookie("auth-token")
		if err != nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"error":   "No authentication token provided",
				})
				c.Abort()
				return
			}
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// Parse and validate JWT
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "your-secret-key-change-in-production"
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid token claims",
			})
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_permissions", claims.Permissions)
		c.Set("is_super_admin", claims.IsSuperAdmin)

		c.Next()
	}
}

// RequireRole middleware - checks if user has required role
func RequireRole(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Super admin bypasses all role checks
		if isSuperAdmin, exists := c.Get("is_super_admin"); exists && isSuperAdmin.(bool) {
			c.Next()
			return
		}

		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error":   "User role not found",
			})
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, role := range requiredRoles {
			if userRole.(string) == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{
				"success":        false,
				"error":          "Insufficient permissions",
				"required_roles": requiredRoles,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission middleware - checks if user has required permission
func RequirePermission(requiredPermissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Super admin bypasses all permission checks
		if isSuperAdmin, exists := c.Get("is_super_admin"); exists && isSuperAdmin.(bool) {
			c.Next()
			return
		}

		userPermissions, exists := c.Get("user_permissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error":   "User permissions not found",
			})
			c.Abort()
			return
		}

		permissions := userPermissions.([]string)

		// Check if user has all required permissions
		for _, required := range requiredPermissions {
			hasPermission := false
			for _, perm := range permissions {
				if perm == required || perm == "*" { // * is wildcard permission
					hasPermission = true
					break
				}
			}

			if !hasPermission {
				c.JSON(http.StatusForbidden, gin.H{
					"success":  false,
					"error":    "Insufficient permissions",
					"required": required,
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// Role hierarchy for automatic permission inheritance
var roleHierarchy = map[string]int{
	"SUPER_ADMIN": 100,
	"ADMIN":       80,
	"MANAGER":     60,
	"DOCTOR":      50,
	"PHARMACIST":  40,
	"MARKETER":    30,
	"STAFF":       20,
	"CASHIER":     10,
	"CUSTOMER":    0,
}

// RequireMinRole - checks if user has minimum role level
func RequireMinRole(minRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Super admin bypasses
		if isSuperAdmin, exists := c.Get("is_super_admin"); exists && isSuperAdmin.(bool) {
			c.Next()
			return
		}

		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error":   "User role not found",
			})
			c.Abort()
			return
		}

		userLevel := roleHierarchy[userRole.(string)]
		minLevel := roleHierarchy[minRole]

		if userLevel < minLevel {
			c.JSON(http.StatusForbidden, gin.H{
				"success":      false,
				"error":        "Insufficient role level",
				"required_min": minRole,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AuditLog middleware - logs all authenticated requests
func AuditLog(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Log after request
		duration := time.Since(start)

		userID, _ := c.Get("user_id")

		// Simple audit log (can be enhanced to write to DB)
		if c.Request.Method != "GET" {
			// Log only non-GET requests for audit purposes
			go func() {
				// TODO: Write to audit_logs table
				_ = db.Exec(`
					INSERT INTO audit_logs (user_id, action, resource, method, status_code, duration_ms, ip_address, created_at)
					VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
				`, userID, c.FullPath(), c.Request.URL.Path, c.Request.Method, c.Writer.Status(), duration.Milliseconds(), c.ClientIP())
			}()
		}

		c.Next()
	}
}

// HasPermission checks if the user has a specific permission
func HasPermission(c *gin.Context, requiredPermission string) bool {
	// Super admins have all permissions
	if isSuperAdmin, exists := c.Get("is_super_admin"); exists && isSuperAdmin.(bool) {
		return true
	}

	// Get user permissions from context
	permissions, exists := c.Get("user_permissions")
	if !exists {
		return false
	}

	permList, ok := permissions.([]string)
	if !ok {
		return false
	}

	// Check if user has the required permission
	for _, perm := range permList {
		if perm == requiredPermission {
			return true
		}
	}

	return false
}
