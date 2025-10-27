package cron

import (
	"database/sql"
	"log"
	"time"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron *cron.Cron
	db   *sql.DB
}

func NewScheduler(db *sql.DB) *Scheduler {
	return &Scheduler{
		cron: cron.New(cron.WithSeconds()),
		db:   db,
	}
}

func (s *Scheduler) Start() {
	log.Println("[CRON] Starting cron scheduler...")

	// Expiry Check Job - Every hour on the hour (0 * * * *)
	s.cron.AddFunc("0 0 * * * *", func() {
		log.Println("[CRON] Running expiry_check_job")
		if err := s.runExpiryCheck(); err != nil {
			log.Printf("[CRON] expiry_check_job error: %v", err)
		}
	})

	// Bug Scan Job - Every 10 minutes (*/10 * * * *)
	s.cron.AddFunc("0 */10 * * * *", func() {
		log.Println("[CRON] Running bug_scan_job")
		if err := s.runBugScan(); err != nil {
			log.Printf("[CRON] bug_scan_job error: %v", err)
		}
	})

	// AI Fix Check Job - Every 30 minutes (*/30 * * * *)
	s.cron.AddFunc("0 */30 * * * *", func() {
		log.Println("[CRON] Running ai_fix_check_job")
		if err := s.runAIFixCheck(); err != nil {
			log.Printf("[CRON] ai_fix_check_job error: %v", err)
		}
	})

	// Health Check Job - Every 5 minutes (*/5 * * * *)
	s.cron.AddFunc("0 */5 * * * *", func() {
		log.Println("[CRON] Running health_check_job")
		if err := s.runHealthCheck(); err != nil {
			log.Printf("[CRON] health_check_job error: %v", err)
		}
	})

	// Outbox Publisher - Every 30 seconds (*/30 * * * * *)
	s.cron.AddFunc("*/30 * * * * *", func() {
		if err := s.publishOutboxEvents(); err != nil {
			log.Printf("[CRON] outbox publisher error: %v", err)
		}
	})

	s.cron.Start()
	log.Println("[CRON] Cron scheduler started successfully")
}

func (s *Scheduler) Stop() {
	log.Println("[CRON] Stopping cron scheduler...")
	s.cron.Stop()
}

func (s *Scheduler) runExpiryCheck() error {
	// Call refresh_expiry_summary stored procedure
	_, err := s.db.Exec("SELECT refresh_expiry_summary()")
	if err != nil {
		return err
	}

	// Log completion
	_, err = s.db.Exec(`
		INSERT INTO cron_execution_log (job_name, status, executed_at)
		VALUES ('expiry_check_job', 'success', $1)
	`, time.Now())

	return err
}

func (s *Scheduler) runBugScan() error {
	// Scan application logs for errors
	query := `
		INSERT INTO system_bugs (bug_code, service_name, severity, title, details, http_status, status, created_at)
		SELECT 
			'BUG-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4),
			service_name,
			CASE 
				WHEN http_status >= 500 THEN 'high'
				WHEN http_status >= 400 THEN 'medium'
				ELSE 'low'
			END,
			message,
			stack_trace,
			http_status,
			'open',
			created_at
		FROM application_logs
		WHERE created_at > now() - interval '10 minutes'
		  AND (log_level IN ('ERROR', 'FATAL') OR http_status >= 500)
		  AND NOT EXISTS (
			SELECT 1 FROM system_bugs 
			WHERE system_bugs.details = application_logs.message
			  AND system_bugs.created_at > now() - interval '1 hour'
		  )
		LIMIT 50
	`

	_, err := s.db.Exec(query)
	return err
}

func (s *Scheduler) runAIFixCheck() error {
	// Find bugs pending AI analysis
	query := `
		SELECT id, service_name, title, details, http_status
		FROM system_bugs
		WHERE status = 'open'
		  AND ai_analysis IS NULL
		  AND created_at > now() - interval '24 hours'
		ORDER BY severity DESC, created_at ASC
		LIMIT 10
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	// TODO: Call AI service for each bug
	// For now, just mark as pending analysis
	for rows.Next() {
		var id, service, title, details string
		var httpStatus sql.NullInt64

		if err := rows.Scan(&id, &service, &title, &details, &httpStatus); err != nil {
			continue
		}

		// TODO: Call AI service API
		log.Printf("[CRON] Bug %s pending AI analysis", id)
	}

	return nil
}

func (s *Scheduler) runHealthCheck() error {
	// Check all services health
	services := []string{
		"http://localhost:3005/health",
		"http://localhost:3005/health",
		"http://localhost:8005/health",
		"http://localhost:8006/health",
		"http://localhost:4000/health",
	}

	for _, serviceURL := range services {
		// TODO: HTTP health check
		log.Printf("[CRON] Checking health: %s", serviceURL)
	}

	return nil
}

func (s *Scheduler) publishOutboxEvents() error {
	// Get unpublished events
	query := `
		SELECT id, aggregate_type, aggregate_id, event_type, payload
		FROM outbox_events
		WHERE published = false
		ORDER BY created_at ASC
		LIMIT 100
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, aggType, aggID, eventType string
		var payload []byte

		if err := rows.Scan(&id, &aggType, &aggID, &eventType, &payload); err != nil {
			continue
		}

		// TODO: Publish to Kafka
		// For now, just mark as published
		_, err = s.db.Exec(`
			UPDATE outbox_events 
			SET published = true, published_at = $1 
			WHERE id = $2
		`, time.Now(), id)

		if err == nil {
			count++
		}
	}

	if count > 0 {
		log.Printf("[CRON] Published %d outbox events", count)
	}

	return nil
}
