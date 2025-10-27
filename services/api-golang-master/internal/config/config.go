package config

import (
	"log"
	"os"
	"strconv"
	
	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	Environment string
	KafkaBrokers string
	InvoiceParserURL string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️  No .env file found, using environment variables and defaults")
	}

	cfg := &Config{
		Port:        getEnv("PORT", "3005"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6380"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key"),
		Environment: getEnv("ENVIRONMENT", "development"),
		KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
		InvoiceParserURL: getEnv("INVOICE_PARSER_URL", "http://localhost:8005"),
	}

	log.Printf("📋 Configuration loaded for %s environment", cfg.Environment)
	log.Printf("🔌 Database: %s", cfg.DatabaseURL)
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
