package middleware

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// HMACVerification verifies webhook HMAC signatures
func HMACVerification(secretEnvKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv(secretEnvKey)
		if secret == "" {
			// If no secret configured, skip verification (dev mode)
			c.Next()
			return
		}

		// Get signature from header
		signature := c.GetHeader("X-Signature")
		if signature == "" {
			signature = c.GetHeader("X-Hub-Signature-256")
		}
		if signature == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing signature"})
			c.Abort()
			return
		}

		// Read request body
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
			c.Abort()
			return
		}

		// Verify signature
		if !verifyHMAC(body, signature, secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
			c.Abort()
			return
		}

		// Reset body for subsequent handlers
		c.Request.Body = io.NopCloser(bytes.NewReader(body))
		c.Next()
	}
}

func verifyHMAC(payload []byte, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	
	// Handle different signature formats
	if signature[:7] == "sha256=" {
		signature = signature[7:]
	}
	
	return hmac.Equal([]byte(expected), []byte(signature))
}
