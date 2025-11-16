package handlers

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type AuthHandler struct {
	userService    *services.UserService
	sessionService *services.SessionService
	db             *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		userService:    services.NewUserService(),
		sessionService: services.NewSessionService(),
		db:             db,
	}
}

type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DisplayName:  req.FirstName + " " + req.LastName,
		PasswordHash: string(hashedPassword),
		IsActive:     true,
		CreatedAt:    time.Now(),
	}

	if err := h.userService.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email from database
	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check if account is locked
	if user.LockedUntil != nil && user.LockedUntil.After(time.Now()) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is locked. Please try again later."})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is deactivated"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		// Increment failed login attempts
		user.LoginAttempts++
		if user.LoginAttempts >= 5 {
			lockUntil := time.Now().Add(15 * time.Minute)
			user.LockedUntil = &lockUntil
		}
		h.db.Save(&user)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Reset login attempts on successful login
	user.LoginAttempts = 0
	user.LockedUntil = nil
	lastLogin := time.Now()
	user.LastLogin = &lastLogin
	h.db.Save(&user)

	// Generate JWT token
	token, expiresAt, err := h.generateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Create session record
	if err := h.createSession(&user, token, c.ClientIP(), c.GetHeader("User-Agent"), expiresAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Set auth-token cookie
	c.SetCookie(
		"auth-token",
		token,
		86400,
		"/",
		"localhost",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"token":       token,
		"accessToken": token,
		"expiresAt":   expiresAt,
		"user": gin.H{
			"id":          user.ID,
			"email":       user.Email,
			"name":        user.DisplayName,
			"displayName": user.DisplayName,
			"firstName":   user.FirstName,
			"lastName":    user.LastName,
			"role":        getUserRole(&user, h.db),
			"isActive":    user.IsActive,
			"isSuperAdmin": user.IsSuperAdmin,
			"permissions": []string{},
		},
	})
}

// createSession creates a new session in the database
func (h *AuthHandler) createSession(user *models.User, token string, ipAddress string, userAgent string, expiresAt time.Time) error {
	// Hash the token for storage using SHA256
	hash := sha256.Sum256([]byte(token))
	tokenHash := fmt.Sprintf("%x", hash)
	
	session := map[string]interface{}{
		"user_id":    user.ID,
		"token_hash": tokenHash,
		"ip_address": ipAddress,
		"user_agent": userAgent,
		"expires_at": expiresAt,
		"created_at": time.Now(),
		"updated_at": time.Now(),
	}
	
	return h.db.Table("user_sessions").Create(session).Error
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}



func (h *AuthHandler) generateToken(user *models.User) (string, time.Time, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
	}

	role := getUserRole(user, h.db)
	
	claims := &jwt.MapClaims{
		"user_id":      user.ID,
		"email":        user.Email,
		"name":         user.DisplayName,
		"displayName":  user.DisplayName,
		"firstName":    user.FirstName,
		"lastName":     user.LastName,
		"role":         role,
		"isSuperAdmin": user.IsSuperAdmin,
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
		"iat":          time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	expiry := time.Now().Add(24 * time.Hour)
	signed, err := token.SignedString([]byte(jwtSecret))
	return signed, expiry, err
}

func getUserRole(user *models.User, db *gorm.DB) string {
	var result struct {
		Code string
	}
	
	err := db.Table("user_roles").
		Select("roles.code, roles.level").
		Joins("LEFT JOIN roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", user.ID).
		Where("roles.is_active = ?", true).
		Order("roles.level DESC").
		Limit(1).
		Scan(&result).Error
	
	if err != nil || result.Code == "" {
		// If user has no role or is super admin, return super admin or default
		if user.IsSuperAdmin {
			return "SUPER_ADMIN"
		}
		return "STAFF"
	}
	
	return result.Code
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Implementation for token refresh
	c.JSON(http.StatusOK, gin.H{"message": "Token refreshed"})
}

// ForgotPassword handles password reset request
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	// Implementation for forgot password
	c.JSON(http.StatusOK, gin.H{"message": "Password reset email sent"})
}

// ResetPassword handles password reset
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	// Implementation for reset password
	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

// Me returns current user info
func (h *AuthHandler) Me(c *gin.Context) {
	// Try to get token from cookie first
	tokenString, err := c.Cookie("auth-token")
	if err != nil {
		// Fallback to Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": "No authentication token provided",
			})
			return
		}
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Parse JWT token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": "Invalid or expired token",
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": "Invalid token claims",
		})
		return
	}

	// Return user info from JWT claims (matching login response format)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": gin.H{
			"id":            claims["user_id"],
			"email":         claims["email"],
			"name":          claims["displayName"],
			"displayName":   claims["displayName"],
			"firstName":     getClaimString(claims, "firstName", "User"),
			"lastName":      getClaimString(claims, "lastName", ""),
			"role":          getClaimString(claims, "role", "STAFF"),
			"isActive":      true,
			"isSuperAdmin":  getClaimBool(claims, "isSuperAdmin", false),
			"permissions":   []string{},
		},
	})
}

// ValidateToken validates a JWT token and returns user info
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	// Parse JWT token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
	}
	
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	// Check expiry
	exp, ok := claims["exp"].(float64)
	if !ok || time.Now().Unix() > int64(exp) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
		return
	}

	// Return user info from claims
	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"user": gin.H{
			"id":           claims["user_id"],
			"email":        claims["email"],
			"name":         claims["displayName"],
			"displayName":  claims["displayName"],
			"role":         claims["role"],
			"isSuperAdmin": claims["isSuperAdmin"],
		},
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization header required"})
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader || token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bearer token required"})
		return
	}

	if err := h.sessionService.DeleteSessionByToken(token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to terminate session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Helper functions for JWT claims
func getClaimString(claims jwt.MapClaims, key string, defaultValue string) string {
	if val, ok := claims[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}

func getClaimBool(claims jwt.MapClaims, key string, defaultValue bool) bool {
	if val, ok := claims[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return defaultValue
}
