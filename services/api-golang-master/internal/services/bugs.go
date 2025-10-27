package services

import (
	"errors"
	"strings"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type BugService struct { DB *gorm.DB }

func NewBugService(db *gorm.DB) *BugService { return &BugService{DB: db} }

type BugFilter struct {
	Severity    string
	Status      string
	Environment string // unified schema uses environment instead of module_name
	Limit       int
	Offset      int
}

type IngestBugDTO struct {
	ServiceName        string `json:"service_name"`
	Environment        string `json:"environment"`
	Severity           string `json:"severity"`
	Title              string `json:"title"`
	Details            string `json:"details"`
	StepsToReproduce   string `json:"steps_to_reproduce"`
	ExpectedBehavior   string `json:"expected_behavior"`
	ActualBehavior     string `json:"actual_behavior"`
	Browser            string `json:"browser"`
	OS                 string `json:"os"`
	UserAgent          string `json:"user_agent"`
	URL                string `json:"url"`
}

func (s *BugService) ListBugs(f BugFilter) ([]models.BugReport, int64, error) {
	where := []string{}
	args := []any{}
	if f.Severity != "" { where = append(where, "severity = ?"); args = append(args, f.Severity) }
	if f.Status != "" { where = append(where, "status = ?"); args = append(args, f.Status) }
	if f.Environment != "" { where = append(where, "environment = ?"); args = append(args, f.Environment) }
	if f.Limit <= 0 { f.Limit = 20 }

	qWhere := ""
	if len(where) > 0 { qWhere = "WHERE " + strings.Join(where, " AND ") }

	var total int64
	if err := s.DB.Raw("SELECT COUNT(*) FROM bug_reports "+qWhere, args...).Scan(&total).Error; err != nil { return nil, 0, err }

	rows := []models.BugReport{}
	query := "SELECT id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, priority, status, environment, browser, os, user_agent, url, user_id, assigned_to, comments, resolution, resolution_date, created_at, updated_at FROM bug_reports " + qWhere + " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	argsQ := append(args, f.Limit, f.Offset)
	if err := s.DB.Raw(query, argsQ...).Scan(&rows).Error; err != nil { return nil, 0, err }
	return rows, total, nil
}

func (s *BugService) GetBug(id string) (*models.BugReport, error) {
	row := models.BugReport{}
	if err := s.DB.Raw("SELECT id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, priority, status, environment, browser, os, user_agent, url, user_id, assigned_to, comments, resolution, resolution_date, created_at, updated_at FROM bug_reports WHERE id = ?", id).Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.ID == "" { return nil, gorm.ErrRecordNotFound }
	return &row, nil
}

func (s *BugService) ApproveBug(bugID string, approverID string) error {
	res := s.DB.Exec("UPDATE bug_reports SET status='IN_PROGRESS', assigned_to=?, updated_at=now() WHERE id = ?", approverID, bugID)
	return res.Error
}

func (s *BugService) IngestBug(dto IngestBugDTO) (string, error) {
	if dto.Severity == "" { dto.Severity = "MEDIUM" }
	if dto.Title == "" { return "", errors.New("title required") }
	var id string
	err := s.DB.Raw(`
		INSERT INTO bug_reports (title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, priority, status, environment, browser, os, user_agent, url, comments, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, 'MEDIUM', 'OPEN', ?, ?, ?, ?, ?, '', now(), now()) RETURNING id
	`, dto.Title, dto.Details, dto.StepsToReproduce, dto.ExpectedBehavior, dto.ActualBehavior, dto.Severity, dto.Environment, dto.Browser, dto.OS, dto.UserAgent, dto.URL).Scan(&id).Error
	return id, err
}
