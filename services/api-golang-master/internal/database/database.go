package database

import (
	"log"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate GMB models
	err = db.AutoMigrate(
		&models.GMBAccount{},
		&models.GMBPost{},
		&models.GMBHistory{},
	)
	if err != nil {
		log.Printf("Warning: Failed to auto-migrate GMB tables: %v", err)
	}

	DB = db
	log.Println("✅ Database connected successfully (using SQL migrations)")
	return db
}

func GetDB() *gorm.DB {
	return DB
}
