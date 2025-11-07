package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	_ "github.com/lib/pq"
)

func main() {
	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy?sslmode=disable"
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("✓ Connected to database")

	// Apply schema
	fmt.Println("📋 Applying database schema...")
	schemaSQL, err := os.ReadFile("../../database/MASTER_SCHEMA.sql")
	if err != nil {
		log.Fatal("Failed to read schema file:", err)
	}

	if _, err := db.Exec(string(schemaSQL)); err != nil {
		log.Fatal("Failed to apply schema:", err)
	}
	fmt.Println("✓ Schema applied successfully")

	// Hash the password
	password := "Medicine@2024"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	fmt.Println("🔐 Creating super admin user...")

	// Insert Super Admin Role
	roleSQL := `
		INSERT INTO roles (id, name, description, is_system)
		VALUES 
			('00000000-0000-0000-0000-000000000001', 'SUPERADMIN', 'Super Administrator with full system access', TRUE)
		ON CONFLICT (name) DO NOTHING;
	`
	if _, err := db.Exec(roleSQL); err != nil {
		log.Fatal("Failed to create role:", err)
	}

	// Insert Super Admin User
	var userID string
	userSQL := `
		INSERT INTO users (
			email,
			password_hash,
			first_name,
			last_name,
			display_name,
			is_active,
			is_verified
		)
		VALUES (
			'medicine@yeelohomeopathy.com',
			$1,
			'Super',
			'Admin',
			'Super Admin',
			TRUE,
			TRUE
		)
		ON CONFLICT (email) DO UPDATE SET
			password_hash = EXCLUDED.password_hash,
			is_active = TRUE,
			is_verified = TRUE
		RETURNING id;
	`
	err = db.QueryRow(userSQL, string(hashedPassword)).Scan(&userID)
	if err != nil {
		log.Fatal("Failed to create user:", err)
	}

	// Assign Super Admin Role to User
	userRoleSQL := `
		INSERT INTO user_roles (user_id, role_id)
		VALUES (
			$1,
			'00000000-0000-0000-0000-000000000001'
		)
		ON CONFLICT DO NOTHING;
	`
	if _, err := db.Exec(userRoleSQL, userID); err != nil {
		log.Fatal("Failed to assign role:", err)
	}

	fmt.Println("✓ Super admin created successfully")
	fmt.Println("")
	fmt.Println("🎉 Database setup complete!")
	fmt.Println("")
	fmt.Println("📝 Super Admin Credentials:")
	fmt.Println("   Email:    medicine@yeelohomeopathy.com")
	fmt.Println("   Password: Medicine@2024")
	fmt.Println("")
}
