package jobs

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"
)

type BugScanJob struct {
	db *sql.DB
}

type LogEntry struct {
	Timestamp   time.Time `json:"timestamp"`
	Service     string    `json:"service"`
	Level       string    `json:"level"`
	Message     string    `json:"message"`
	Stack       string    `json:"stack"`
	StatusCode  int       `json:"status_code"`
}

func NewBugScanJob(db *sql.DB) *BugScanJob {
	return &BugScanJob{db: db}
}

// Run executes every 10 minutes (*/10 * * * *)
func (j *BugScanJob) Run() error {
	log.Println("[CRON] Starting bug_scan_job...")
	
	if err := j.scanApplicationLogs(); err != nil {
		log.Printf("[CRON] Error scanning logs: %v", err)
		return err
	}
	
	if err := j.scanDLQ(); err != nil {
		log.Printf("[CRON] Error scanning DLQ: %v", err)
		return err
	}
	
	log.Println("[CRON] bug_scan_job completed")
	return nil
}

func (j *BugScanJob) scanApplicationLogs() error {
	// Query logs from last 10 minutes with errors
	query := `
		SELECT service_name, log_level, message, stack_trace, http_status, created_at
		FROM application_logs
		WHERE created_at > now() - interval '10 minutes'
		  AND (log_level IN ('ERROR', 'FATAL') OR http_status >= 500)
		  AND NOT EXISTS (
			SELECT 1 FROM system_bugs 
			WHERE system_bugs.log_excerpt = application_logs.message
			  AND system_bugs.created_at > now() - interval '1 hour'
		  )
		ORDER BY created_at DESC
		LIMIT 50
	`
	
	rows, err := j.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	count := 0
	for rows.Next() {
		var service, level, message, stack sql.NullString
		var status sql.NullInt64
		var timestamp time.Time
		
		if err := rows.Scan(&service, &level, &message, &stack, &status, &timestamp); err != nil {
			continue
		}
		
		if err := j.createBugReport(service.String, message.String, stack.String, status.Int64); err != nil {
			log.Printf("Error creating bug report: %v", err)
			continue
		}
		count++
	}
	
	log.Printf("[CRON] Created %d bug reports from logs", count)
	return nil
}

func (j *BugScanJob) scanDLQ() error {
	// Check Kafka DLQ messages
	query := `
		SELECT topic, partition, offset, key, value, error_reason, failed_at
		FROM kafka_dlq_messages
		WHERE processed = false
		  AND failed_at > now() - interval '10 minutes'
		ORDER BY failed_at DESC
		LIMIT 20
	`
	
	rows, err := j.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	count := 0
	for rows.Next() {
		var topic, key, value, errorReason string
		var partition, offset int64
		var failedAt time.Time
		
		if err := rows.Scan(&topic, &partition, &offset, &key, &value, &errorReason, &failedAt); err != nil {
			continue
		}
		
		details := map[string]interface{}{
			"topic":        topic,
			"partition":    partition,
			"offset":       offset,
			"key":          key,
			"error_reason": errorReason,
			"failed_at":    failedAt,
		}
		detailsJSON, _ := json.Marshal(details)
		
		if err := j.createBugReport("kafka-consumer", errorReason, string(detailsJSON), 0); err != nil {
			log.Printf("Error creating DLQ bug report: %v", err)
			continue
		}
		count++
		
		// Mark as processed
		_, _ = j.db.Exec("UPDATE kafka_dlq_messages SET processed = true WHERE topic = $1 AND offset = $2", topic, offset)
	}
	
	log.Printf("[CRON] Created %d bug reports from DLQ", count)
	return nil
}

func (j *BugScanJob) createBugReport(service, message, details string, statusCode int64) error {
	severity := "medium"
	if statusCode >= 500 {
		severity = "high"
	}
	
	bugCode := generateBugCode()
	
	_, err := j.db.Exec(`
		INSERT INTO system_bugs (
			bug_code, service_name, severity, title, details, 
			http_status, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, 'open', now())
	`, bugCode, service, severity, message, details, statusCode)
	
	if err == nil {
		log.Printf("[CRON] Created bug report: %s for service %s", bugCode, service)
	}
	
	return err
}

func generateBugCode() string {
	return "BUG-" + time.Now().Format("20060102") + "-" + randString(4)
}
