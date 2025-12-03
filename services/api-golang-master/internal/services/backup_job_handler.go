package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"
)

// BackupJobPayload represents the payload for backup creation job
type BackupJobPayload struct {
	Description string `json:"description"`
	UserID      string `json:"user_id,omitempty"`
}

// BackupJobResult represents the result of a backup job
type BackupJobResult struct {
	Filename  string    `json:"filename"`
	Size      int64     `json:"size"`
	Path      string    `json:"path"`
	Duration  string    `json:"duration"`
	CreatedAt time.Time `json:"created_at"`
}

// RegisterBackupJobHandler registers the backup creation job handler
func RegisterBackupJobHandler(jobService *JobService, backupService *BackupService) {
	jobService.RegisterHandler(JobTypeBackupCreate, func(ctx context.Context, job *BackgroundJob, db *gorm.DB) error {
		log.Printf("🗄️ Starting backup job: %s", job.ID)

		// Parse payload
		var payload BackupJobPayload
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return fmt.Errorf("failed to parse job payload: %w", err)
		}

		// Update progress - configuration check
		jobService.UpdateJobProgress(job.ID, 10, 100)

		// Get backup configuration
		config, err := backupService.GetBackupConfig()
		if err != nil {
			return fmt.Errorf("failed to get backup config: %w", err)
		}

		jobService.UpdateJobProgress(job.ID, 20, 100)

		startTime := time.Now()

		// Create backup using existing service method
		filename, err := backupService.CreateBackup()
		if err != nil {
			return fmt.Errorf("failed to create backup: %w", err)
		}

		jobService.UpdateJobProgress(job.ID, 80, 100)

		// Get file info
		backupPath := filepath.Join(config.BackupPath, filename)
		fileInfo, err := os.Stat(backupPath)
		var size int64
		if err == nil {
			size = fileInfo.Size()
		}

		duration := time.Since(startTime)

		jobService.UpdateJobProgress(job.ID, 100, 100)

		// Save result
		result := BackupJobResult{
			Filename:  filename,
			Size:      size,
			Path:      backupPath,
			Duration:  duration.String(),
			CreatedAt: time.Now(),
		}

		if err := jobService.UpdateJobResult(job.ID, result); err != nil {
			log.Printf("⚠️ Failed to update job result: %v", err)
		}

		log.Printf("✅ Backup job completed: %s (file: %s, size: %d bytes, duration: %s)",
			job.ID, filename, size, duration)

		return nil
	})
}
