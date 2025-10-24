package services

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type BugService struct { DB *gorm.DB }

func NewBugService(db *gorm.DB) *BugService { return &BugService{DB: db} }

type BugReport struct {
	ID           string    `json:"id"`
	BugCode      string    `json:"bug_code"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Severity     string    `json:"severity"`
	Status       string    `json:"status"`
	ModuleName   string    `json:"module_name"`
	FilePath     string    `json:"file_path"`
	ErrorMessage string    `json:"error_message"`
	CreatedAt    time.Time `json:"created_at"`
}

type BugFilter struct {
	Severity string
	Status   string
	Service  string // maps to module_name or service_name where applicable
	Limit    int
	Offset   int
}

type IngestBugDTO struct {
	ServiceName string `json:"service_name"`
	Module      string `json:"module"`
	Severity    string `json:"severity"`
	Title       string `json:"title"`
	Details     string `json:"details"`
	LogExcerpt  string `json:"log_excerpt"`
}

func (s *BugService) ListBugs(f BugFilter) ([]BugReport, int64, error) {
	where := []string{}
	args := []any{}
	if f.Severity != "" { where = append(where, "severity = ?"); args = append(args, f.Severity) }
	if f.Status != "" { where = append(where, "status = ?"); args = append(args, f.Status) }
	if f.Service != "" { where = append(where, "module_name = ?"); args = append(args, f.Service) }
	if f.Limit <= 0 { f.Limit = 20 }

	qWhere := ""
	if len(where) > 0 { qWhere = "WHERE " + strings.Join(where, " AND ") }

	var total int64
	if err := s.DB.Raw("SELECT COUNT(*) FROM bug_reports "+qWhere, args...).Scan(&total).Error; err != nil { return nil, 0, err }

	rows := []BugReport{}
	query := "SELECT id, bug_code, title, description, severity, status, module_name, file_path, error_message, created_at FROM bug_reports " + qWhere + " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	argsQ := append(args, f.Limit, f.Offset)
	if err := s.DB.Raw(query, argsQ...).Scan(&rows).Error; err != nil { return nil, 0, err }
	return rows, total, nil
}

func (s *BugService) GetBug(id string) (*BugReport, error) {
	row := BugReport{}
	if err := s.DB.Raw("SELECT id, bug_code, title, description, severity, status, module_name, file_path, error_message, created_at FROM bug_reports WHERE id = ?", id).Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.ID == "" { return nil, gorm.ErrRecordNotFound }
	return &row, nil
}

func (s *BugService) ApproveBug(bugID string, approverID string) error {
	res := s.DB.Exec("UPDATE bug_reports SET status='in_progress', updated_at=now() WHERE id = ?", bugID)
	return res.Error
}

func (s *BugService) IngestBug(dto IngestBugDTO) (string, error) {
	if dto.Severity == "" { dto.Severity = "medium" }
	if dto.Title == "" { return "", errors.New("title required") }
	var id string
	err := s.DB.Raw(`
		INSERT INTO bug_reports (title, description, severity, module_name, error_message, status)
		VALUES (?, ?, ?, ?, ?, 'open') RETURNING id
	`, dto.Title, dto.Details, dto.Severity, dto.Module, dto.LogExcerpt).Scan(&id).Error
	return id, err
}
