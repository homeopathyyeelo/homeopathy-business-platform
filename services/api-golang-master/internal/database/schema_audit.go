package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

type SchemaAuditor struct {
	DB *gorm.DB
}

func NewSchemaAuditor(db *gorm.DB) *SchemaAuditor {
	return &SchemaAuditor{DB: db}
}

// GetExistingTables returns all table names in the database
func (sa *SchemaAuditor) GetExistingTables() ([]string, error) {
	var tables []string
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`
	err := sa.DB.Raw(query).Scan(&tables).Error
	return tables, err
}

// GetMissingTables compares expected vs existing tables
func (sa *SchemaAuditor) GetMissingTables(expectedTables []string) ([]string, error) {
	existing, err := sa.GetExistingTables()
	if err != nil {
		return nil, err
	}

	existingMap := make(map[string]bool)
	for _, t := range existing {
		existingMap[t] = true
	}

	var missing []string
	for _, expected := range expectedTables {
		if !existingMap[expected] {
			missing = append(missing, expected)
		}
	}

	return missing, nil
}

// AuditSchema performs full schema audit
func (sa *SchemaAuditor) AuditSchema() (map[string][]string, error) {
	result := make(map[string][]string)
	
	modules := GetExpectedSchema()
	
	for moduleName, tables := range modules {
		missing, err := sa.GetMissingTables(tables)
		if err != nil {
			return nil, err
		}
		if len(missing) > 0 {
			result[moduleName] = missing
		}
	}
	
	return result, nil
}

// CreateMissingTables generates and executes CREATE TABLE statements
func (sa *SchemaAuditor) CreateMissingTables(dryRun bool) ([]string, error) {
	missingByModule, err := sa.AuditSchema()
	if err != nil {
		return nil, err
	}

	var executed []string
	
	for module, tables := range missingByModule {
		log.Printf("Module %s: %d missing tables", module, len(tables))
		
		for _, table := range tables {
			sql := GenerateCreateTableSQL(table)
			
			if dryRun {
				log.Printf("[DRY RUN] Would create: %s", table)
				executed = append(executed, fmt.Sprintf("[DRY RUN] %s", table))
			} else {
				if err := sa.DB.Exec(sql).Error; err != nil {
					log.Printf("Error creating table %s: %v", table, err)
					return executed, err
				}
				log.Printf("✅ Created table: %s", table)
				executed = append(executed, table)
			}
		}
	}
	
	return executed, nil
}
