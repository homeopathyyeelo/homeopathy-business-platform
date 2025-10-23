package main

import (
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("your-secret-key-change-this") // Change in production!

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
}

type Claims struct {
	UserID       int    `json:"user_id"`
	Email        string `json:"email"`
	IsSuperAdmin bool   `json:"is_super_admin"`
	jwt.RegisteredClaims
}

// Login handles user authentication
func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Get user from database
	var user User
	err := db.QueryRow(`
		SELECT id, email, username, password_hash, full_name, is_active, is_super_admin
		FROM users WHERE email = $1 AND is_active = true
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.Username, &user.PasswordHash,
		&user.FullName, &user.IsActive, &user.IsSuperAdmin,
	)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid email or password",
		})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid email or password",
		})
	}

	// Get user permissions
	permissions, err := GetUserPermissionsFromDB(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to load permissions",
		})
	}

	// Generate tokens
	token, refreshToken, err := generateTokens(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate tokens",
		})
	}

	// Create session
	sessionToken := generateSessionToken()
	sessionData := map[string]interface{}{
		"user_id":        user.ID,
		"email":          user.Email,
		"full_name":      user.FullName,
		"is_super_admin": user.IsSuperAdmin,
		"permissions":    permissions,
	}

	_, err = db.Exec(`
		INSERT INTO user_sessions (user_id, session_token, refresh_token, session_data, ip_address, user_agent, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, user.ID, sessionToken, refreshToken, sessionData, c.IP(), c.Get("User-Agent"), time.Now().Add(24*time.Hour))

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to create session",
		})
	}

	// Update last login
	db.Exec(`UPDATE users SET last_login_at = $1, last_login_ip = $2 WHERE id = $3`,
		time.Now(), c.IP(), user.ID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"token":         token,
			"refresh_token": refreshToken,
			"session_token": sessionToken,
			"user": fiber.Map{
				"id":             user.ID,
				"email":          user.Email,
				"username":       user.Username,
				"full_name":      user.FullName,
				"is_super_admin": user.IsSuperAdmin,
			},
			"permissions": permissions,
		},
	})
}

// Register handles user registration
func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to hash password",
		})
	}

	// Insert user
	var userID int
	err = db.QueryRow(`
		INSERT INTO users (email, username, password_hash, full_name, phone)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, req.Email, req.Username, string(hashedPassword), req.FullName, req.Phone).Scan(&userID)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "Email or username already exists",
		})
	}

	// Assign default role (staff)
	db.Exec(`
		INSERT INTO user_roles (user_id, role_id)
		SELECT $1, id FROM roles WHERE name = 'staff'
	`, userID)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "User registered successfully",
		"data": fiber.Map{
			"user_id": userID,
		},
	})
}

// Logout handles user logout
func Logout(c *fiber.Ctx) error {
	sessionToken := c.Get("X-Session-Token")
	if sessionToken != "" {
		db.Exec(`DELETE FROM user_sessions WHERE session_token = $1`, sessionToken)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Logged out successfully",
	})
}

// RefreshToken handles token refresh
func RefreshToken(c *fiber.Ctx) error {
	refreshToken := c.Get("X-Refresh-Token")
	if refreshToken == "" {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "Refresh token required",
		})
	}

	// Verify refresh token and get user
	var userID int
	err := db.QueryRow(`
		SELECT user_id FROM user_sessions 
		WHERE refresh_token = $1 AND expires_at > NOW()
	`, refreshToken).Scan(&userID)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid or expired refresh token",
		})
	}

	// Get user
	var user User
	err = db.QueryRow(`
		SELECT id, email, username, full_name, is_super_admin
		FROM users WHERE id = $1 AND is_active = true
	`, userID).Scan(&user.ID, &user.Email, &user.Username, &user.FullName, &user.IsSuperAdmin)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "User not found",
		})
	}

	// Generate new tokens
	token, newRefreshToken, err := generateTokens(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate tokens",
		})
	}

	// Update session
	db.Exec(`
		UPDATE user_sessions 
		SET refresh_token = $1, expires_at = $2, last_activity_at = NOW()
		WHERE refresh_token = $3
	`, newRefreshToken, time.Now().Add(24*time.Hour), refreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"token":         token,
			"refresh_token": newRefreshToken,
		},
	})
}

// GetCurrentUser returns current authenticated user
func GetCurrentUser(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	var user User
	err := db.QueryRow(`
		SELECT id, email, username, full_name, phone, avatar_url, is_super_admin, created_at
		FROM users WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.Email, &user.Username, &user.FullName,
		&user.Phone, &user.AvatarURL, &user.IsSuperAdmin, &user.CreatedAt,
	)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error":   "User not found",
		})
	}

	// Get permissions
	permissions, _ := GetUserPermissionsFromDB(userID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user":        user,
			"permissions": permissions,
		},
	})
}

// Helper functions
func generateTokens(user User) (string, string, error) {
	// Generate access token (1 hour)
	claims := Claims{
		UserID:       user.ID,
		Email:        user.Email,
		IsSuperAdmin: user.IsSuperAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token (7 days)
	refreshClaims := Claims{
		UserID: user.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshTokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err := refreshTokenJWT.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func generateSessionToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
