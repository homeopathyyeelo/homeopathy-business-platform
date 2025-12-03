package services

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// BackupService handles database backup operations
type BackupService struct {
	db     *gorm.DB
	cron   *cron.Cron
	cronID cron.EntryID
}

// BackupConfig represents backup configuration
type BackupConfig struct {
	Enabled       bool   `json:"enabled"`
	Schedule      string `json:"schedule"` // Cron expression
	BackupPath    string `json:"backup_path"`
	RetentionDays int    `json:"retention_days"`
	Compress      bool   `json:"compress"`
	DBHost        string `json:"db_host"`
	DBPort        int    `json:"db_port"`
	DBName        string `json:"db_name"`
	DBUser        string `json:"db_user"`
	DBPassword    string `json:"db_password"`
}

// BackupInfo represents information about a backup file
type BackupInfo struct {
	Filename   string    `json:"filename"`
	Path       string    `json:"path"`
	Size       int64     `json:"size"`
	CreatedAt  time.Time `json:"created_at"`
	Compressed bool      `json:"compressed"`
}

// BackupStatus represents current backup status
type BackupStatus struct {
	LastBackupTime  *time.Time `json:"last_backup_time"`
	NextBackupTime  *time.Time `json:"next_backup_time"`
	TotalBackups    int        `json:"total_backups"`
	TotalBackupSize int64      `json:"total_backup_size"`
	BackupEnabled   bool       `json:"backup_enabled"`
}

// NewBackupService creates a new backup service
func NewBackupService(db *gorm.DB) *BackupService {
	return &BackupService{
		db:   db,
		cron: cron.New(),
	}
}

// GetBackupConfig retrieves backup configuration from app_settings
func (s *BackupService) GetBackupConfig() (*BackupConfig, error) {
	config := &BackupConfig{
		Enabled:       false,
		Schedule:      "0 2 * * *", // Default: 2 AM daily
		BackupPath:    "/var/www/homeopathy-business-platform/backups",
		RetentionDays: 30,
		Compress:      true,
		DBHost:        "localhost",
		DBPort:        5433,
		DBName:        "yeelo_homeopathy",
		DBUser:        "postgres",
	}

	// Fetch settings from database
	type AppSetting struct {
		Key   string          `gorm:"column:key"`
		Value json.RawMessage `gorm:"column:value"`
	}

	var settings []AppSetting
	err := s.db.Table("app_settings").
		Where("key LIKE ?", "backup.%").
		Or("key LIKE ?", "database.%").
		Find(&settings).Error

	if err != nil {
		return config, err
	}

	// Parse settings
	for _, setting := range settings {
		switch setting.Key {
		case "backup.enabled":
			json.Unmarshal(setting.Value, &config.Enabled)
		case "backup.schedule":
			json.Unmarshal(setting.Value, &config.Schedule)
		case "backup.path":
			json.Unmarshal(setting.Value, &config.BackupPath)
		case "backup.retention_days":
			json.Unmarshal(setting.Value, &config.RetentionDays)
		case "backup.compress":
			json.Unmarshal(setting.Value, &config.Compress)
		case "database.host":
			json.Unmarshal(setting.Value, &config.DBHost)
		case "database.port":
			json.Unmarshal(setting.Value, &config.DBPort)
		case "database.name":
			json.Unmarshal(setting.Value, &config.DBName)
		case "database.user":
			json.Unmarshal(setting.Value, &config.DBUser)
		case "database.password":
			json.Unmarshal(setting.Value, &config.DBPassword)
		}
	}

	return config, nil
}

// SaveBackupConfig saves backup configuration to app_settings
func (s *BackupService) SaveBackupConfig(config *BackupConfig) error {
	type AppSetting struct {
		Key         string          `gorm:"column:key"`
		Category    string          `gorm:"column:category"`
		Type        string          `gorm:"column:type"`
		Value       json.RawMessage `gorm:"column:value"`
		Description string          `gorm:"column:description"`
	}

	settings := []AppSetting{
		{Key: "backup.enabled", Category: "backup", Type: "boolean", Value: mustMarshal(config.Enabled), Description: "Enable automated backups"},
		{Key: "backup.schedule", Category: "backup", Type: "string", Value: mustMarshal(config.Schedule), Description: "Backup schedule (cron expression)"},
		{Key: "backup.path", Category: "backup", Type: "string", Value: mustMarshal(config.BackupPath), Description: "Backup directory path"},
		{Key: "backup.retention_days", Category: "backup", Type: "number", Value: mustMarshal(config.RetentionDays), Description: "Number of days to retain backups"},
		{Key: "backup.compress", Category: "backup", Type: "boolean", Value: mustMarshal(config.Compress), Description: "Compress backup files"},
		{Key: "database.host", Category: "database", Type: "string", Value: mustMarshal(config.DBHost), Description: "PostgreSQL host"},
		{Key: "database.port", Category: "database", Type: "number", Value: mustMarshal(config.DBPort), Description: "PostgreSQL port"},
		{Key: "database.name", Category: "database", Type: "string", Value: mustMarshal(config.DBName), Description: "Database name"},
		{Key: "database.user", Category: "database", Type: "string", Value: mustMarshal(config.DBUser), Description: "Database user"},
		{Key: "database.password", Category: "database", Type: "string", Value: mustMarshal(config.DBPassword), Description: "Database password (encrypted)"},
	}

	for _, setting := range settings {
		err := s.db.Exec(`
			INSERT INTO app_settings (key, category, type, value, description)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT (key) DO UPDATE SET
				value = EXCLUDED.value,
				category = EXCLUDED.category,
				type = EXCLUDED.type,
				description = EXCLUDED.description,
				updated_at = NOW()
		`, setting.Key, setting.Category, setting.Type, setting.Value, setting.Description).Error

		if err != nil {
			return err
		}
	}

	// Restart cron if enabled
	if config.Enabled {
		return s.StartScheduledBackups()
	} else {
		s.StopScheduledBackups()
	}

	return nil
}

// CreateBackup creates a new database backup
func (s *BackupService) CreateBackup() (string, error) {
	config, err := s.GetBackupConfig()
	if err != nil {
		return "", fmt.Errorf("failed to get backup config: %w", err)
	}

	// Ensure backup directory exists
	if err := os.MkdirAll(config.BackupPath, 0700); err != nil {
		return "", fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Generate filename
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("yeelo_homeopathy_%s.sql", timestamp)
	filepath := filepath.Join(config.BackupPath, filename)

	// Set PGPASSWORD environment variable
	os.Setenv("PGPASSWORD", config.DBPassword)
	defer os.Unsetenv("PGPASSWORD")

	// Execute pg_dump
	cmd := exec.Command("pg_dump",
		"-h", config.DBHost,
		"-p", fmt.Sprintf("%d", config.DBPort),
		"-U", config.DBUser,
		"-d", config.DBName,
		"-f", filepath,
		"--no-owner",
		"--no-acl",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("pg_dump failed: %w, output: %s", err, string(output))
	}

	// Compress if enabled
	if config.Compress {
		if err := compressFile(filepath); err != nil {
			return "", fmt.Errorf("failed to compress backup: %w", err)
		}
		filename += ".gz"
		filepath += ".gz"
	}

	// Clean up old backups
	go s.CleanupOldBackups(config.RetentionDays)

	return filename, nil
}

// ListBackups lists all backup files
func (s *BackupService) ListBackups() ([]BackupInfo, error) {
	config, err := s.GetBackupConfig()
	if err != nil {
		return nil, err
	}

	files, err := os.ReadDir(config.BackupPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []BackupInfo{}, nil
		}
		return nil, err
	}

	var backups []BackupInfo
	for _, file := range files {
		if file.IsDir() {
			continue
		}

		name := file.Name()
		if !strings.HasPrefix(name, "yeelo_homeopathy_") {
			continue
		}

		info, err := file.Info()
		if err != nil {
			continue
		}

		backups = append(backups, BackupInfo{
			Filename:   name,
			Path:       filepath.Join(config.BackupPath, name),
			Size:       info.Size(),
			CreatedAt:  info.ModTime(),
			Compressed: strings.HasSuffix(name, ".gz"),
		})
	}

	// Sort by creation time (newest first)
	sort.Slice(backups, func(i, j int) bool {
		return backups[i].CreatedAt.After(backups[j].CreatedAt)
	})

	return backups, nil
}

// GetBackupStatus returns current backup status
func (s *BackupService) GetBackupStatus() (*BackupStatus, error) {
	config, err := s.GetBackupConfig()
	if err != nil {
		return nil, err
	}

	backups, err := s.ListBackups()
	if err != nil {
		return nil, err
	}

	status := &BackupStatus{
		BackupEnabled: config.Enabled,
		TotalBackups:  len(backups),
	}

	// Calculate total size
	for _, backup := range backups {
		status.TotalBackupSize += backup.Size
	}

	// Get last backup time
	if len(backups) > 0 {
		status.LastBackupTime = &backups[0].CreatedAt
	}

	// Get next backup time from cron
	if config.Enabled && s.cronID != 0 {
		entry := s.cron.Entry(s.cronID)
		if !entry.Next.IsZero() {
			status.NextBackupTime = &entry.Next
		}
	}

	return status, nil
}

// CleanupOldBackups removes backups older than retention period
func (s *BackupService) CleanupOldBackups(retentionDays int) error {
	backups, err := s.ListBackups()
	if err != nil {
		return err
	}

	cutoffTime := time.Now().AddDate(0, 0, -retentionDays)

	for _, backup := range backups {
		if backup.CreatedAt.Before(cutoffTime) {
			if err := os.Remove(backup.Path); err != nil {
				fmt.Printf("Failed to delete old backup %s: %v\n", backup.Filename, err)
			}
		}
	}

	return nil
}

// StartScheduledBackups starts the cron job for automated backups
func (s *BackupService) StartScheduledBackups() error {
	config, err := s.GetBackupConfig()
	if err != nil {
		return err
	}

	if !config.Enabled {
		return nil
	}

	// Stop existing cron if running
	s.StopScheduledBackups()

	// Add new cron job
	cronID, err := s.cron.AddFunc(config.Schedule, func() {
		filename, err := s.CreateBackup()
		if err != nil {
			fmt.Printf("Scheduled backup failed: %v\n", err)
		} else {
			fmt.Printf("Scheduled backup created: %s\n", filename)
		}
	})

	if err != nil {
		return fmt.Errorf("failed to schedule backup: %w", err)
	}

	s.cronID = cronID
	s.cron.Start()

	return nil
}

// StopScheduledBackups stops the cron job
func (s *BackupService) StopScheduledBackups() {
	if s.cronID != 0 {
		s.cron.Remove(s.cronID)
		s.cronID = 0
	}
}

// DeleteBackup deletes a specific backup file
func (s *BackupService) DeleteBackup(filename string) error {
	config, err := s.GetBackupConfig()
	if err != nil {
		return err
	}

	// Security check: ensure filename doesn't contain path traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		return fmt.Errorf("invalid filename")
	}

	filepath := filepath.Join(config.BackupPath, filename)
	return os.Remove(filepath)
}

// Helper function to compress a file
func compressFile(filepath string) error {
	// Open source file
	source, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer source.Close()

	// Create compressed file
	dest, err := os.Create(filepath + ".gz")
	if err != nil {
		return err
	}
	defer dest.Close()

	// Create gzip writer
	gzipWriter := gzip.NewWriter(dest)
	defer gzipWriter.Close()

	// Copy data
	_, err = io.Copy(gzipWriter, source)
	if err != nil {
		return err
	}

	// Remove original file
	return os.Remove(filepath)
}

// Helper function to marshal JSON
func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
