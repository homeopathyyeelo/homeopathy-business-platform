package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobStatus represents the status of a background job
type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusCompleted JobStatus = "completed"
	JobStatusFailed    JobStatus = "failed"
	JobStatusCancelled JobStatus = "cancelled"
)

// JobType represents the type of background job
type JobType string

const (
	JobTypeBackupCreate   JobType = "backup_create"
	JobTypeBackupRestore  JobType = "backup_restore"
	JobTypeDataImport     JobType = "data_import"
	JobTypeReportGenerate JobType = "report_generate"
	JobTypeEmailSend      JobType = "email_send"
	JobTypeBulkUpdate     JobType = "bulk_update"
)

// BackgroundJob represents a background job in the database
type BackgroundJob struct {
	ID           string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	JobType      JobType         `gorm:"type:job_type;not null" json:"job_type"`
	Status       JobStatus       `gorm:"type:job_status;not null;default:'pending'" json:"status"`
	Payload      json.RawMessage `gorm:"type:jsonb" json:"payload"`
	Result       json.RawMessage `gorm:"type:jsonb" json:"result,omitempty"`
	ErrorMessage string          `json:"error_message,omitempty"`
	Progress     int             `gorm:"default:0" json:"progress"`
	Total        int             `gorm:"default:100" json:"total"`
	StartedAt    *time.Time      `json:"started_at,omitempty"`
	CompletedAt  *time.Time      `json:"completed_at,omitempty"`
	CreatedBy    *string         `gorm:"type:uuid" json:"created_by,omitempty"`
	CreatedAt    time.Time       `gorm:"default:NOW()" json:"created_at"`
	UpdatedAt    time.Time       `gorm:"default:NOW()" json:"updated_at"`
}

func (BackgroundJob) TableName() string {
	return "background_jobs"
}

// JobNotification represents a user notification for job status
type JobNotification struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	JobID     string    `gorm:"type:uuid;not null" json:"job_id"`
	UserID    string    `gorm:"type:uuid;not null" json:"user_id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"default:NOW()" json:"created_at"`
}

func (JobNotification) TableName() string {
	return "job_notifications"
}

// JobHandler is a function that processes a specific job type
type JobHandler func(ctx context.Context, job *BackgroundJob, db *gorm.DB) error

// JobService manages background jobs
type JobService struct {
	db       *gorm.DB
	handlers map[JobType]JobHandler
	mu       sync.RWMutex
	workers  int
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// NewJobService creates a new job service
func NewJobService(db *gorm.DB, workers int) *JobService {
	if workers <= 0 {
		workers = 5 // Default to 5 workers
	}

	return &JobService{
		db:       db,
		handlers: make(map[JobType]JobHandler),
		workers:  workers,
		stopChan: make(chan struct{}),
	}
}

// RegisterHandler registers a handler for a specific job type
func (s *JobService) RegisterHandler(jobType JobType, handler JobHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers[jobType] = handler
}

// CreateJob creates a new background job
func (s *JobService) CreateJob(jobType JobType, payload interface{}, createdBy *string) (*BackgroundJob, error) {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	job := &BackgroundJob{
		ID:        uuid.New().String(),
		JobType:   jobType,
		Status:    JobStatusPending,
		Payload:   payloadJSON,
		Progress:  0,
		Total:     100,
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(job).Error; err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	log.Printf("📋 Created background job: %s (type: %s)", job.ID, job.JobType)
	return job, nil
}

// GetJob retrieves a job by ID
func (s *JobService) GetJob(jobID string) (*BackgroundJob, error) {
	var job BackgroundJob
	if err := s.db.Where("id = ?", jobID).First(&job).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

// UpdateJobStatus updates the status of a job
func (s *JobService) UpdateJobStatus(jobID string, status JobStatus, errorMessage string) error {
	updates := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}

	if status == JobStatusRunning {
		now := time.Now()
		updates["started_at"] = now
	}

	if status == JobStatusCompleted || status == JobStatusFailed || status == JobStatusCancelled {
		now := time.Now()
		updates["completed_at"] = now
	}

	if errorMessage != "" {
		updates["error_message"] = errorMessage
	}

	return s.db.Model(&BackgroundJob{}).Where("id = ?", jobID).Updates(updates).Error
}

// UpdateJobProgress updates the progress of a job
func (s *JobService) UpdateJobProgress(jobID string, progress, total int) error {
	return s.db.Model(&BackgroundJob{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"progress":   progress,
			"total":      total,
			"updated_at": time.Now(),
		}).Error
}

// UpdateJobResult updates the result of a completed job
func (s *JobService) UpdateJobResult(jobID string, result interface{}) error {
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	return s.db.Model(&BackgroundJob{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"result":     resultJSON,
			"updated_at": time.Now(),
		}).Error
}

// CreateNotification creates a notification for a user about a job
func (s *JobService) CreateNotification(jobID, userID, title, message string) error {
	notification := &JobNotification{
		ID:        uuid.New().String(),
		JobID:     jobID,
		UserID:    userID,
		Title:     title,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	return s.db.Create(notification).Error
}

// GetUserNotifications retrieves unread notifications for a user
func (s *JobService) GetUserNotifications(userID string, limit int) ([]JobNotification, error) {
	var notifications []JobNotification
	query := s.db.Where("user_id = ? AND is_read = false", userID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&notifications).Error; err != nil {
		return nil, err
	}

	return notifications, nil
}

// MarkNotificationRead marks a notification as read
func (s *JobService) MarkNotificationRead(notificationID string) error {
	return s.db.Model(&JobNotification{}).
		Where("id = ?", notificationID).
		Update("is_read", true).Error
}

// ListJobs retrieves jobs with optional filters
func (s *JobService) ListJobs(status *JobStatus, jobType *JobType, createdBy *string, limit int) ([]BackgroundJob, error) {
	var jobs []BackgroundJob
	query := s.db.Model(&BackgroundJob{})

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	if jobType != nil {
		query = query.Where("job_type = ?", *jobType)
	}

	if createdBy != nil {
		query = query.Where("created_by = ?", *createdBy)
	}

	query = query.Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&jobs).Error; err != nil {
		return nil, err
	}

	return jobs, nil
}

// processJob processes a single job
func (s *JobService) processJob(job *BackgroundJob) {
	ctx := context.Background()

	log.Printf("🔄 Processing job: %s (type: %s)", job.ID, job.JobType)

	// Update status to running
	if err := s.UpdateJobStatus(job.ID, JobStatusRunning, ""); err != nil {
		log.Printf("❌ Failed to update job status to running: %v", err)
		return
	}

	// Get handler for this job type
	s.mu.RLock()
	handler, exists := s.handlers[job.JobType]
	s.mu.RUnlock()

	if !exists {
		errMsg := fmt.Sprintf("no handler registered for job type: %s", job.JobType)
		log.Printf("❌ %s", errMsg)
		s.UpdateJobStatus(job.ID, JobStatusFailed, errMsg)
		return
	}

	// Execute the handler
	if err := handler(ctx, job, s.db); err != nil {
		log.Printf("❌ Job %s failed: %v", job.ID, err)
		s.UpdateJobStatus(job.ID, JobStatusFailed, err.Error())

		// Send failure notification
		if job.CreatedBy != nil {
			s.CreateNotification(job.ID, *job.CreatedBy,
				fmt.Sprintf("Job Failed: %s", job.JobType),
				fmt.Sprintf("Job failed with error: %s", err.Error()))
		}
		return
	}

	// Mark as completed
	if err := s.UpdateJobStatus(job.ID, JobStatusCompleted, ""); err != nil {
		log.Printf("❌ Failed to update job status to completed: %v", err)
		return
	}

	log.Printf("✅ Job %s completed successfully", job.ID)

	// Send success notification
	if job.CreatedBy != nil {
		s.CreateNotification(job.ID, *job.CreatedBy,
			fmt.Sprintf("Job Completed: %s", job.JobType),
			"Your job has completed successfully!")
	}
}

// worker is a goroutine that processes jobs from the queue
func (s *JobService) worker(workerID int) {
	defer s.wg.Done()

	log.Printf("👷 Worker %d started", workerID)

	ticker := time.NewTicker(2 * time.Second) // Poll every 2 seconds
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			log.Printf("👷 Worker %d stopped", workerID)
			return
		case <-ticker.C:
			// Try to fetch and process a pending job
			var job BackgroundJob
			err := s.db.Transaction(func(tx *gorm.DB) error {
				// Lock and fetch one pending job
				if err := tx.Raw(`
					SELECT * FROM background_jobs 
					WHERE status = 'pending' 
					ORDER BY created_at ASC 
					LIMIT 1 
					FOR UPDATE SKIP LOCKED
				`).Scan(&job).Error; err != nil {
					return err
				}

				// Check if we actually got a job (ID will be empty if no rows)
				if job.ID == "" {
					return gorm.ErrRecordNotFound
				}

				// Update to running to prevent other workers from picking it up
				job.Status = JobStatusRunning
				now := time.Now()
				job.StartedAt = &now
				job.UpdatedAt = now

				return tx.Save(&job).Error
			})

			if err != nil {
				// Silently ignore "no records" error - queue is empty
				if err != gorm.ErrRecordNotFound {
					log.Printf("Worker %d error: %v", workerID, err)
				}
				continue
			}

			// Process the job outside the transaction
			s.processJob(&job)
		}
	}
}

// Start starts the job service workers
func (s *JobService) Start() {
	log.Printf("🚀 Starting job service with %d workers", s.workers)

	for i := 0; i < s.workers; i++ {
		s.wg.Add(1)
		go s.worker(i + 1)
	}
}

// Stop stops the job service workers
func (s *JobService) Stop() {
	log.Printf("🛑 Stopping job service...")
	close(s.stopChan)
	s.wg.Wait()
	log.Printf("✅ Job service stopped")
}

// GetPendingJobCount returns the number of pending jobs
func (s *JobService) GetPendingJobCount() (int64, error) {
	var count int64
	err := s.db.Model(&BackgroundJob{}).Where("status = ?", JobStatusPending).Count(&count).Error
	return count, err
}

// GetRunningJobCount returns the number of running jobs
func (s *JobService) GetRunningJobCount() (int64, error) {
	var count int64
	err := s.db.Model(&BackgroundJob{}).Where("status = ?", JobStatusRunning).Count(&count).Error
	return count, err
}
