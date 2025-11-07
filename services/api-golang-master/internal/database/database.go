package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Skip auto-migration, use SQL migrations instead
	// err = db.AutoMigrate(
	// 	&models.Session{},
	// )
	// if err != nil {
	// 	log.Fatal("Failed to migrate database:", err)
	// }

	DB = db
	log.Println("✅ Database connected successfully (using SQL migrations)")
	return db
}

func GetDB() *gorm.DB {
	return DB
}
