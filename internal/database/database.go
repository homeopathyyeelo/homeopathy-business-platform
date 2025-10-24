package database

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(databaseURL string) *gorm.DB {
	var err error

	// Configure GORM logger
	newLogger := logger.Default
	newLogger = newLogger.LogMode(logger.Info)

	// Connect to database
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: newLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate tables
	err = DB.AutoMigrate(
		&User{}, &Role{}, &Permission{}, &UserRole{}, &RolePermission{},
		&Company{}, &Shop{},
		&Product{}, &ProductCategory{}, &ProductBrand{}, &ProductBatch{},
		&Customer{}, &CustomerGroup{},
		&Vendor{},
		&Sale{}, &SaleItem{},
		&Purchase{}, &PurchaseItem{}, &PurchaseReceipt{}, &PurchaseReceiptItem{},
		&InventoryBatch{},
		&Expense{}, &Payment{},
		&Employee{}, &Attendance{}, &Payroll{},
		&AISuggestion{}, &Campaign{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated successfully")
	return DB
}
