package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	JWTSecret        string
	Environment      string
	KafkaBrokers     string
	InvoiceParserURL string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️  No .env file found, using environment variables and defaults")
	}

	// Get DATABASE_URL from environment, or build it from individual components
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		// Build from individual env vars
		host := getEnv("POSTGRES_HOST", "localhost")
		port := getEnv("POSTGRES_PORT", "5432") // Changed from 5433 to 5432
		user := getEnv("POSTGRES_USER", "postgres")
		password := getEnv("POSTGRES_PASSWORD", "postgres")
		dbname := getEnv("POSTGRES_DB", "yeelo_homeopathy")

		databaseURL = fmt.Sprintf("postgresql://%s:%s@%s:%s/%s",
			user, password, host, port, dbname)
	}

	cfg := &Config{
		Port:             getEnv("PORT", "3005"),
		DatabaseURL:      databaseURL, // Use the constructed/fetched databaseURL
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6380"),
		JWTSecret:        getEnv("JWT_SECRET", "your-super-secret-jwt-key"),
		Environment:      getEnv("ENVIRONMENT", "development"),
		KafkaBrokers:     getEnv("KAFKA_BROKERS", "localhost:9092"),
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
