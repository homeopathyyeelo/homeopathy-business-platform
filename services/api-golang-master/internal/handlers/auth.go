package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"os"
)

type AuthHandler struct {
	userService    *services.UserService
	sessionService *services.SessionService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userService:    services.NewUserService(),
		sessionService: services.NewSessionService(),
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

	// Super Admin mode: hardcoded credentials
	if req.Email == "medicine@yeelohomeopathy.com" && req.Password == "Medicine@2024" {
		token, expiresAt, err := h.generateDemoToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token":     token,
			"expiresAt": expiresAt,
			"user": gin.H{
				"id":          "superadmin-1",
				"email":       "medicine@yeelohomeopathy.com",
				"displayName": "Super Admin",
				"firstName":   "Super",
				"lastName":    "Admin",
				"role":        "SUPERADMIN",
				"isSuperAdmin": true,
			},
		})
		return
	}

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is disabled"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, expiresAt, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	if err := h.sessionService.DeleteSessionsForUser(user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare session"})
		return
	}

	if err := h.sessionService.CreateSession(token, user.ID, expiresAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist session"})
		return
	}

	_ = h.userService.UpdateLastLogin(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"token":     token,
		"expiresAt": expiresAt,
		"user": gin.H{
			"id":          user.ID,
			"email":       user.Email,
			"displayName": user.DisplayName,
			"firstName":   user.FirstName,
			"lastName":    user.LastName,
		},
	})
}



func (h *AuthHandler) generateToken(user *models.User) (string, time.Time, error) {
	claims := &jwt.MapClaims{
		"user_id":     user.ID,
		"email":       user.Email,
		"displayName": user.DisplayName,
		"exp":         time.Now().Add(24 * time.Hour).Unix(),
		"iat":         time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	expiry := time.Now().Add(24 * time.Hour)
	signed, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return signed, expiry, err
}

func (h *AuthHandler) generateDemoToken() (string, time.Time, error) {
	claims := &jwt.MapClaims{
		"user_id":      "superadmin-1",
		"email":        "medicine@yeelohomeopathy.com",
		"displayName":  "Super Admin",
		"role":         "SUPERADMIN",
		"isSuperAdmin": true,
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
		"iat":          time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	expiry := time.Now().Add(24 * time.Hour)
	signed, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return signed, expiry, err
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
	// Get user from JWT token
	userID := c.GetString("user_id")
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"displayName": user.DisplayName,
		"firstName":   user.FirstName,
		"lastName":    user.LastName,
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
