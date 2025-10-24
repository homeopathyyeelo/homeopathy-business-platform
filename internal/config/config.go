package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL    string
	Port           string
	AIServiceURL   string
	RedisURL       string
	KafkaBrokers   []string
	JWTSecret      string
	Environment    string
}

func Load() *Config {
	return &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://user:password@localhost/homeoerp?sslmode=disable"),
		Port:         getEnv("PORT", "3005"),
		AIServiceURL: getEnv("AI_SERVICE_URL", "http://localhost:8001"),
		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379"),
		KafkaBrokers: []string{getEnv("KAFKA_BROKERS", "localhost:9092")},
		JWTSecret:    getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		Environment:  getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
