package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisSessionService struct {
	redis *redis.Client
	ctx   context.Context
}

func NewRedisSessionService(redisClient *redis.Client) *RedisSessionService {
	return &RedisSessionService{
		redis: redisClient,
		ctx:   context.Background(),
	}
}

// RefreshToken model
type RefreshToken struct {
	Token     string
	UserID    string
	ExpiresAt time.Time
	CreatedAt time.Time
	IPAddress string
	UserAgent string
}

// CreateRefreshToken generates and stores a new refresh token
func (s *RedisSessionService) CreateRefreshToken(userID, ipAddress, userAgent string) (*RefreshToken, error) {
	// Generate cryptographically secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}
	
	token := base64.URLEncoding.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days

	refreshToken := &RefreshToken{
		Token:     token,
		UserID:    userID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	// Store in Redis with expiration
	key := fmt.Sprintf("refresh_token:%s", token)
	data := map[string]interface{}{
		"user_id":    userID,
		"ip_address": ipAddress,
		"user_agent": userAgent,
		"created_at": refreshToken.CreatedAt.Unix(),
	}

	pipe := s.redis.Pipeline()
	pipe.HSet(s.ctx, key, data)
	pipe.ExpireAt(s.ctx, key, expiresAt)
	
	if _, err := pipe.Exec(s.ctx); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	// Also maintain user -> tokens mapping for revocation
	userTokensKey := fmt.Sprintf("user_tokens:%s", userID)
	pipe = s.redis.Pipeline()
	pipe.SAdd(s.ctx, userTokensKey, token)
	pipe.Expire(s.ctx, userTokensKey, 30*24*time.Hour) // 30 days
	
	if _, err := pipe.Exec(s.ctx); err != nil {
		return nil, fmt.Errorf("failed to add token to user set: %w", err)
	}

	return refreshToken, nil
}

// ValidateRefreshToken checks if refresh token is valid
func (s *RedisSessionService) ValidateRefreshToken(token string) (string, error) {
	key := fmt.Sprintf("refresh_token:%s", token)
	
	data, err := s.redis.HGetAll(s.ctx, key).Result()
	if err != nil {
		return "", fmt.Errorf("failed to get refresh token: %w", err)
	}

	if len(data) == 0 {
		return "", fmt.Errorf("refresh token not found or expired")
	}

	userID, ok := data["user_id"]
	if !ok {
		return "", fmt.Errorf("invalid refresh token data")
	}

	return userID, nil
}

// RevokeRefreshToken invalidates a specific refresh token
func (s *RedisSessionService) RevokeRefreshToken(token string) error {
	// Get user ID first
	key := fmt.Sprintf("refresh_token:%s", token)
	userID, err := s.redis.HGet(s.ctx, key, "user_id").Result()
	
	if err == nil && userID != "" {
		// Remove from user's token set
		userTokensKey := fmt.Sprintf("user_tokens:%s", userID)
		s.redis.SRem(s.ctx, userTokensKey, token)
	}

	// Delete the refresh token
	return s.redis.Del(s.ctx, key).Err()
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (s *RedisSessionService) RevokeAllUserTokens(userID string) error {
	userTokensKey := fmt.Sprintf("user_tokens:%s", userID)
	
	// Get all tokens for this user
	tokens, err := s.redis.SMembers(s.ctx, userTokensKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get user tokens: %w", err)
	}

	// Delete each token
	pipe := s.redis.Pipeline()
	for _, token := range tokens {
		key := fmt.Sprintf("refresh_token:%s", token)
		pipe.Del(s.ctx, key)
	}
	
	// Delete the user tokens set
	pipe.Del(s.ctx, userTokensKey)
	
	_, err = pipe.Exec(s.ctx)
	return err
}

// GetUserTokenCount returns number of active tokens for a user
func (s *RedisSessionService) GetUserTokenCount(userID string) (int64, error) {
	userTokensKey := fmt.Sprintf("user_tokens:%s", userID)
	return s.redis.SCard(s.ctx, userTokensKey).Result()
}

// CleanupExpiredTokens removes expired token references (periodic cleanup)
func (s *RedisSessionService) CleanupExpiredTokens() error {
	// Scan all user_tokens keys
	iter := s.redis.Scan(s.ctx, 0, "user_tokens:*", 100).Iterator()
	
	for iter.Next(s.ctx) {
		userTokensKey := iter.Val()
		
		// Get all tokens
		tokens, err := s.redis.SMembers(s.ctx, userTokensKey).Result()
		if err != nil {
			continue
		}

		// Check each token and remove if expired
		for _, token := range tokens {
			key := fmt.Sprintf("refresh_token:%s", token)
			exists, err := s.redis.Exists(s.ctx, key).Result()
			
			if err != nil || exists == 0 {
				// Token doesn't exist, remove from set
				s.redis.SRem(s.ctx, userTokensKey, token)
			}
		}
	}

	return iter.Err()
}

// CreateAccessToken stores access token metadata (for revocation if needed)
func (s *RedisSessionService) CreateAccessToken(userID, jti string, expiresAt time.Time) error {
	key := fmt.Sprintf("access_token:%s", jti)
	ttl := time.Until(expiresAt)
	
	if ttl <= 0 {
		return fmt.Errorf("token already expired")
	}

	return s.redis.Set(s.ctx, key, userID, ttl).Err()
}

// RevokeAccessToken marks access token as revoked
func (s *RedisSessionService) RevokeAccessToken(jti string) error {
	key := fmt.Sprintf("access_token:%s", jti)
	return s.redis.Del(s.ctx, key).Err()
}

// IsAccessTokenRevoked checks if access token is revoked
func (s *RedisSessionService) IsAccessTokenRevoked(jti string) (bool, error) {
	key := fmt.Sprintf("access_token:%s", jti)
	exists, err := s.redis.Exists(s.ctx, key).Result()
	
	if err != nil {
		return false, err
	}
	
	return exists == 0, nil // If doesn't exist, it's revoked
}
