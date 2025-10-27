package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type LogEvent struct {
	Service   string `json:"service"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	TraceID   string `json:"trace_id"`
}

type IngestReq struct {
	ServiceName string `json:"service_name"`
	Module      string `json:"module"`
	Severity    string `json:"severity"`
	Title       string `json:"title"`
	Details     string `json:"details"`
	LogExcerpt  string `json:"log_excerpt"`
}

func postBug(api string, body IngestReq) error {
	b, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, api+"/api/v1/system/bugs/ingest", strings.NewReader(string(b)))
	if err != nil { return err }
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{ Timeout: 10 * time.Second }
	resp, err := client.Do(req)
	if err != nil { return err }
	defer resp.Body.Close()
	if resp.StatusCode >= 300 { return err }
	return nil
}

func dedupeKey(e LogEvent) string { return e.Service+"|"+e.Level+"|"+e.Message }

func main() {
	api := os.Getenv("CORE_API_URL")
	if api == "" { api = "http://localhost:3005" }
	log.Println("bug-collector starting; core api:", api)

	ticker := time.NewTicker(10 * time.Second)
	seen := map[string]int{}
	for {
		select {
		case <-ticker.C:
			// placeholder: poll a local HTTP log endpoint or file
			e := LogEvent{Service:"api-golang-master", Level:"ERROR", Message:"panic: nil pointer", Timestamp: time.Now().Format(time.RFC3339), TraceID:"trace"}
			key := dedupeKey(e)
			if _, ok := seen[key]; ok { continue }
			seen[key] = 1
			_ = postBug(api, IngestReq{
				ServiceName: e.Service,
				Module:      "unknown",
				Severity:    "high",
				Title:       e.Message,
				Details:     e.Message,
				LogExcerpt:  e.Message,
			})
		}
	}
}
