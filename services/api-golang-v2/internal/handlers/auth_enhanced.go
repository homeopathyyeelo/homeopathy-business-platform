package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type AuthHandler struct {
	userService      *services.UserService
	groupService     *services.GroupService
	permissionService *services.PermissionService
	emailService     *services.EmailService
	sessionService   *services.SessionService
	auditService     *services.AuditService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userService:      services.NewUserService(),
		groupService:     services.NewGroupService(),
		permissionService: services.NewPermissionService(),
		emailService:     services.NewEmailService(),
		sessionService:   services.NewSessionService(),
		auditService:     services.NewAuditService(),
	}
}

// RegisterRequest with additional fields
type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Username    string `json:"username" binding:"required,min=3,max=30"`
	Password    string `json:"password" binding:"required,min=8"`
	FullName    string `json:"fullName" binding:"required"`
	GroupIDs    []string `json:"groupIds,omitempty"`
}

// LoginRequest
type LoginRequest struct {
	Email       string `json:"email"`
	Username    string `json:"username"`
	Password    string `json:"password" binding:"required"`
	RememberMe  bool   `json:"rememberMe"`
	TwoFactorCode string `json:"twoFactorCode,omitempty"`
}

// SocialLoginRequest
type SocialLoginRequest struct {
	Provider   string `json:"provider" binding:"required"` // google, facebook, twitter, linkedin
	ProviderID string `json:"providerId" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	FullName   string `json:"fullName"`
	Avatar     string `json:"avatar,omitempty"`
	AccessToken string `json:"accessToken" binding:"required"`
}

// Enhanced Register with group assignment and email verification
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email or username already exists
	if _, err := h.userService.GetUserByEmail(req.Email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}
	if _, err := h.userService.GetUserByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := &models.User{
		Email:     req.Email,
		Username:  req.Username,
		FullName:  req.FullName,
		Password:  string(hashedPassword),
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	if err := h.userService.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Assign to groups if specified
	if len(req.GroupIDs) > 0 {
		for _, groupID := range req.GroupIDs {
			h.groupService.AddUserToGroup(user.ID, groupID)
		}
	}

	// Send email verification
	verificationToken := h.generateVerificationToken()
	h.userService.SetEmailVerificationToken(user.ID, verificationToken)
	h.emailService.SendEmailVerification(user.Email, verificationToken)

	// Audit log
	h.auditService.LogAction(c.GetString("user_id"), "user.register", "users", user.ID, "User registered", c.ClientIP(), c.GetHeader("User-Agent"))

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully. Please check your email for verification.",
		"user_id": user.ID,
	})
}

// Enhanced Login with 2FA and session management
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user
	user, err := h.userService.GetUserByEmailOrUsername(req.Email, req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check if account is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is disabled"})
		return
	}

	// Check if account is locked
	if user.LockedUntil != nil && user.LockedUntil.After(time.Now()) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Account is temporarily locked"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		h.userService.IncrementLoginAttempts(user.ID)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check 2FA if enabled
	if user.TwoFactorEnabled {
		if req.TwoFactorCode == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Two-factor code required", "require_2fa": true})
			return
		}
		if !h.verifyTwoFactorCode(user.TwoFactorSecret, req.TwoFactorCode) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid two-factor code"})
			return
		}
	}

	// Reset login attempts on successful login
	h.userService.ResetLoginAttempts(user.ID)

	// Update last login
	h.userService.UpdateLastLogin(user.ID, c.ClientIP())

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Create session
	session := &models.UserSession{
		UserID:       user.ID,
		Token:        accessToken,
		RefreshToken: refreshToken,
		IPAddress:    c.ClientIP(),
		UserAgent:    c.GetHeader("User-Agent"),
		IsActive:     true,
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		CreatedAt:    time.Now(),
	}
	h.sessionService.CreateSession(session)

	// Audit log
	h.auditService.LogAction(user.ID, "user.login", "users", user.ID, "User logged in", c.ClientIP(), c.GetHeader("User-Agent"))

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"expires_in":    86400, // 24 hours
		"user": gin.H{
			"id":              user.ID,
			"email":           user.Email,
			"username":        user.Username,
			"fullName":        user.FullName,
			"isEmailVerified": user.IsEmailVerified,
		},
	})
}

// Social Login implementation
func (h *AuthHandler) SocialLogin(c *gin.Context) {
	var req SocialLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if social account exists
	socialAccount, err := h.userService.GetSocialAccount(req.Provider, req.ProviderID)
	if err != nil {
		// Create new user or link to existing
		user := &models.User{
			Email:     req.Email,
			FullName:  req.FullName,
			IsActive:  true,
			CreatedAt: time.Now(),
		}

		if err := h.userService.CreateUser(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// Create social account
		socialAccount = &models.SocialAccount{
			UserID:      user.ID,
			Provider:    req.Provider,
			ProviderID:  req.ProviderID,
			Email:       req.Email,
			FullName:    req.FullName,
			Avatar:      req.Avatar,
			AccessToken: req.AccessToken,
			CreatedAt:   time.Now(),
		}
		h.userService.CreateSocialAccount(socialAccount)
	}

	// Generate tokens for existing user
	accessToken, refreshToken, err := h.generateTokens(&models.User{ID: socialAccount.UserID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"expires_in":    86400,
	})
}

// Forgot Password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	email := c.PostForm("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	user, err := h.userService.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
		return
	}

	// Generate reset token
	token := h.generateResetToken()
	reset := &models.PasswordReset{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		IsUsed:    false,
		CreatedAt: time.Now(),
	}
	h.userService.CreatePasswordReset(reset)

	// Send reset email
	h.emailService.SendPasswordReset(user.Email, token)

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
}

// Reset Password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	token := c.PostForm("token")
	newPassword := c.PostForm("password")

	if token == "" || newPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token and password are required"})
		return
	}

	reset, err := h.userService.GetPasswordResetByToken(token)
	if err != nil || reset.IsUsed || reset.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update user password
	h.userService.UpdateUserPassword(reset.UserID, string(hashedPassword))

	// Mark reset as used
	h.userService.MarkPasswordResetAsUsed(reset.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

// Email Verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	user, err := h.userService.GetUserByVerificationToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	h.userService.VerifyEmail(user.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

// Enable 2FA
func (h *AuthHandler) Enable2FA(c *gin.Context) {
	userID := c.GetString("user_id")
	secret := h.generateTwoFactorSecret()

	h.userService.SetTwoFactorSecret(userID, secret)

	c.JSON(http.StatusOK, gin.H{
		"secret": secret,
		"qr_code": "Generate QR code for: " + secret, // In real implementation, generate QR
	})
}

// Disable 2FA
func (h *AuthHandler) Disable2FA(c *gin.Context) {
	userID := c.GetString("user_id")
	h.userService.DisableTwoFactor(userID)

	c.JSON(http.StatusOK, gin.H{"message": "2FA disabled"})
}

// Refresh Token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshToken := c.PostForm("refresh_token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	session, err := h.sessionService.GetSessionByRefreshToken(refreshToken)
	if err != nil || !session.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Generate new tokens
	user, err := h.userService.GetUserByID(session.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	accessToken, newRefreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Update session
	session.RefreshToken = newRefreshToken
	session.ExpiresAt = time.Now().Add(24 * time.Hour)
	h.sessionService.UpdateSession(session)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
		"token_type":    "Bearer",
		"expires_in":    86400,
	})
}

// Logout
func (h *AuthHandler) Logout(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimPrefix(token, "Bearer ")
	}

	h.sessionService.InvalidateSession(token)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Me (Get current user)
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get user groups and permissions
	groups, _ := h.groupService.GetUserGroups(userID)
	permissions, _ := h.permissionService.GetUserPermissions(userID)

	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID,
		"email":           user.Email,
		"username":        user.Username,
		"fullName":        user.FullName,
		"isActive":        user.IsActive,
		"isEmailVerified": user.IsEmailVerified,
		"twoFactorEnabled": user.TwoFactorEnabled,
		"lastLoginAt":     user.LastLoginAt,
		"groups":          groups,
		"permissions":     permissions,
	})
}

// Helper functions
func (h *AuthHandler) generateToken(user *models.User) (string, error) {
	claims := &jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"username": user.Username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte("your-secret-key")) // Use config
}

func (h *AuthHandler) generateTokens(user *models.User) (string, string, error) {
	accessToken, err := h.generateToken(user)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := h.generateRefreshToken()
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (h *AuthHandler) generateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (h *AuthHandler) generateVerificationToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func (h *AuthHandler) generateResetToken() string {
	return h.generateVerificationToken()
}

func (h *AuthHandler) generateTwoFactorSecret() string {
	// In real implementation, use a proper TOTP library
	return "JBSWY3DPEHPK3PXP" // Example secret
}

func (h *AuthHandler) verifyTwoFactorCode(secret, code string) bool {
	// In real implementation, verify TOTP code
	return code == "123456" // Example verification
}
