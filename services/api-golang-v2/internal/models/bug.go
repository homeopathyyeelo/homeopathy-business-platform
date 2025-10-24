package models

import "time"

type SystemBug struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ServiceName    string    `json:"service_name"`
	Module         string    `json:"module"`
	Severity       string    `json:"severity"`
	Title          string    `json:"title"`
	LogExcerpt     string    `json:"log_excerpt"`
	AIAnalysis     any       `gorm:"type:jsonb" json:"ai_analysis"`
	FixSuggestions any       `gorm:"type:jsonb" json:"fix_suggestions"`
	SuggestedFix   string    `json:"suggested_fix"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	ApprovedBy     *string   `json:"approved_by"`
	FixedCommitSHA *string   `json:"fixed_commit_sha"`
}

type AIFixSuggestion struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	BugID      string    `json:"bug_id"`
	Suggestion string    `json:"suggestion"`
	DiffPatch  string    `json:"diff_patch"`
	Confidence float64   `json:"confidence"`
	CreatedAt  time.Time `json:"created_at"`
	Approved   bool      `json:"approved"`
	Executed   bool      `json:"executed"`
}
