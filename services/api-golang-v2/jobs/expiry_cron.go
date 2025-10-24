package jobs

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"
)

type ExpiryCronJob struct {
	db *sql.DB
}

type ExpiryWindow struct {
	Window      string    `json:"window"`
	Days        int       `json:"days"`
	Count       int       `json:"count"`
	TotalValue  float64   `json:"total_value"`
	ComputedAt  time.Time `json:"computed_at"`
}

func NewExpiryCronJob(db *sql.DB) *ExpiryCronJob {
	return &ExpiryCronJob{db: db}
}

// Run executes every hour (0 * * * *)
func (j *ExpiryCronJob) Run() error {
	log.Println("[CRON] Starting expiry_check_job...")
	
	if err := j.refreshExpirySummary(); err != nil {
		log.Printf("[CRON] Error refreshing expiry summary: %v", err)
		return err
	}
	
	if err := j.publishExpiryEvents(); err != nil {
		log.Printf("[CRON] Error publishing expiry events: %v", err)
		return err
	}
	
	log.Println("[CRON] expiry_check_job completed successfully")
	return nil
}

func (j *ExpiryCronJob) refreshExpirySummary() error {
	query := `
		WITH upcoming AS (
			SELECT 
				shop_id,
				product_id,
				CASE
					WHEN expiry_date <= now() + interval '7 days' THEN '7d'
					WHEN expiry_date <= now() + interval '1 month' THEN '1m'
					WHEN expiry_date <= now() + interval '3 months' THEN '3m'
					WHEN expiry_date <= now() + interval '6 months' THEN '6m'
					WHEN expiry_date <= now() + interval '1 year' THEN '1y'
					ELSE '60m'
				END as bucket,
				qty_available,
				unit_cost
			FROM inventory_batches
			WHERE expiry_date IS NOT NULL 
			  AND qty_available > 0
			  AND expiry_date > now()
			  AND status = 'active'
		)
		SELECT bucket, count(*), sum(qty_available * unit_cost)
		FROM upcoming
		WHERE bucket IS NOT NULL
		GROUP BY bucket
	`
	
	rows, err := j.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	windows := make([]ExpiryWindow, 0)
	for rows.Next() {
		var w ExpiryWindow
		if err := rows.Scan(&w.Window, &w.Count, &w.TotalValue); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		w.ComputedAt = time.Now()
		windows = append(windows, w)
	}
	
	log.Printf("[CRON] Computed expiry for %d windows", len(windows))
	return nil
}

func (j *ExpiryCronJob) publishExpiryEvents() error {
	// TODO: Publish to Kafka topic: inventory.expiry.summary
	// For now, insert into outbox table
	
	event := map[string]interface{}{
		"event_type":     "inventory.expiry.computed",
		"aggregate_type": "expiry_summary",
		"payload": map[string]interface{}{
			"computed_at": time.Now(),
		},
		"metadata": map[string]interface{}{
			"source":   "expiry-cron",
			"trace_id": generateTraceID(),
		},
	}
	
	eventJSON, _ := json.Marshal(event)
	
	_, err := j.db.Exec(`
		INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, published)
		VALUES ($1, $2, $3, $4, false)
	`, "expiry_summary", generateTraceID(), "inventory.expiry.computed", eventJSON)
	
	return err
}

func generateTraceID() string {
	return time.Now().Format("20060102-150405") + "-" + randString(8)
}

func randString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
